/**
 * pstack for OpenCode.
 *
 * One job per feature of the tree, because OpenCode has no native equivalent:
 *
 * 1. Register every skill in `skills/` so the `skill` tool can load it, and
 *    register one `/name` command per skill so the `/how`, `/why`, and
 *    `/poteto-mode` commands the pstack prose names actually exist.
 * 2. Register the `poteto-agent` and `comment-sicko` subagents from `agents/`.
 * 3. Inject the poteto-mode mandate into each main session, the pointer to the
 *    OpenCode adapter, and the per-role model sheet. A child session gets the
 *    adapter and the sheet, as a Claude Code subagent sees CLAUDE.md, but not
 *    the mandate: the chat that owns the playbook is the main one.
 * 4. Run the session-summary skill's hooks: the nudge to pick a summary folder
 *    while none is saved, and the digest. OpenCode has no session-end event, so
 *    the digest is rewritten each time a main session goes idle.
 *
 * A local plugin directory loads through this package's `exports`. Everything
 * here is plain JavaScript at runtime: the `@opencode/plugin` import is a type
 * import, so the package needs no dependencies and no build step.
 */

import type { Agent, Plugin, Skill } from "@opencode/plugin"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { writeDigest } from "./skills/session-summary/scripts/digest.mjs"
import { startNudge } from "./skills/session-summary/scripts/summary-dir.mjs"

const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))
const SKILLS = join(PLUGIN_ROOT, "skills")
const AGENTS = join(PLUGIN_ROOT, "agents")
const ADAPTER = join(PLUGIN_ROOT, "docs", "harness", "opencode.md")
const SUMMARY_SKILL = join(SKILLS, "session-summary", "SKILL.md")
const EDIT_TOOLS = new Set(["edit", "write"])
const SHELL_TOOLS = new Set(["shell", "bash"])

/** Subagents whose own prompt says they never write code. Enforced, not just asked. */
const READONLY_AGENTS = new Set(["comment-sicko"])

/**
 * The mandate every pstack harness injects. It is the same shape as the Claude
 * Code, Codex, omp, and Antigravity text, so one session reads the same
 * whichever harness runs it.
 */
const MANDATE = `<EXTREMELY_IMPORTANT>
You have pstack.

Invoke the \`poteto-mode\` skill and follow its instructions when a task meets any of these:

- it touches more than one file, or changes a signature other files call
- it involves a design or architecture choice
- it is a bug whose cause is not yet known, or a performance issue

It routes to the right pstack skill from there. For smaller tasks, such as a contained change to one file with an obvious test, a question, or a one-line edit, work directly and verify on the real artifact.

When the intent is already specific, enter that skill directly: \`tdd\`, \`architect\`, \`how\`, \`why\`, \`arena\`, \`interrogate\`.

User instructions (AGENTS.md, CLAUDE.md, direct requests) take precedence. Other session-start mandates still apply. Their skill checks run as before, and when a task meets the criteria above they route implementation through poteto-mode.
</EXTREMELY_IMPORTANT>`

interface Frontmatter {
  data: Record<string, string>
  body: string
}

/** Strip a quoted YAML scalar and undo its escapes. */
function unquote(value: string): string {
  const quoted = /^(["'])([\s\S]*)\1$/.exec(value)
  if (!quoted) return value
  return quoted[2].replace(/\\(["'\\])/g, "$1")
}

/**
 * Read the tiny YAML subset pstack frontmatter uses: one `key: value` per line,
 * quoted or plain, plus the folded (`>`) scalar one skill uses for its
 * description. Anything more exotic is left off, which OpenCode treats as a
 * missing field rather than a broken skill.
 */
function parseFrontmatter(text: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!match) return { data: {}, body: text }

  const data: Record<string, string> = {}
  let key: string | undefined
  let style: "plain" | "folded" | "literal" = "plain"
  let lines: string[] = []

  const flush = () => {
    if (key === undefined) return
    const value = style === "folded" ? lines.join(" ").replace(/\s+/g, " ") : lines.join("\n")
    data[key] = style === "plain" ? unquote(value.trim()) : value.trim()
    key = undefined
    style = "plain"
    lines = []
  }

  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z0-9_-]+):(.*)$/.exec(line)
    if (field) {
      flush()
      key = field[1]
      const rest = field[2].trim()
      if (rest === ">" || rest === ">-") style = "folded"
      else if (rest === "|" || rest === "|-") style = "literal"
      else if (rest !== "") lines.push(rest)
      continue
    }
    if (key !== undefined && /^\s+\S/.test(line)) lines.push(line.trim())
  }
  flush()

  return { data, body: text.slice(match[0].length) }
}

interface PstackSkill {
  id: string
  name: string
  description?: string
  autoinvoke: boolean
  path: string
  content: string
}

function loadSkills(): PstackSkill[] {
  if (!existsSync(SKILLS)) return []
  return readdirSync(SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(SKILLS, entry.name, "SKILL.md")))
    .map((entry) => {
      const path = join(SKILLS, entry.name, "SKILL.md")
      const { data, body } = parseFrontmatter(readFileSync(path, "utf8"))
      return {
        id: entry.name,
        name: data.name ?? entry.name,
        description: data.description,
        // pstack hides every leaf skill from auto-invocation and enters it by
        // name, which is exactly OpenCode's `autoinvoke: false`. OpenCode
        // rejects a missing value, so every skill states one.
        autoinvoke: data["disable-model-invocation"] !== "true",
        path,
        content: body.trim(),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

interface PstackAgent {
  id: string
  description?: string
  system: string
}

function loadAgents(): PstackAgent[] {
  if (!existsSync(AGENTS)) return []
  return readdirSync(AGENTS, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const { data, body } = parseFrontmatter(readFileSync(join(AGENTS, entry.name), "utf8"))
      return { id: entry.name.slice(0, -3), description: data.description, system: body.trim() }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The OpenCode config directory, which `$XDG_CONFIG_HOME` moves. */
function configDir(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode")
}

/**
 * The per-role model sheet. A missing sheet leaves the skill defaults in place,
 * as the session hooks do in the other harnesses.
 */
function readSheet(): string | undefined {
  try {
    return readFileSync(join(configDir(), "pstack-models.md"), "utf8")
  } catch {
    return undefined
  }
}

/** The sheet's `session hook: off` line, which stops the mandate injection. */
function hookOff(sheet: string | undefined): boolean {
  return sheet?.split(/\r?\n/).some((line) => line.trim() === "session hook: off") ?? false
}

/**
 * The pointer to the adapter. The skills name Cursor tools and models, so the
 * model needs to know where the mapping lives before it follows one.
 */
function adapterNote(): string {
  return `pstack skills are written for Cursor. When one names a Cursor tool (Task, AskQuestion, a todolist), a bundled skill, or a Cursor model, read ${ADAPTER} for the OpenCode equivalent before following it.`
}

/** Reads a session's messages into the Session shape the session-summary digest takes. */
function summarize(info: any, messages: any[], directory: string) {
  const session = {
    harness: "OpenCode",
    id: String(info.id),
    cwd: info.location?.directory ?? directory,
    startedAt: info.time?.created,
    prompts: [] as string[],
    files: [] as string[],
    commands: 0,
    lastReply: "",
  }
  for (const message of messages) {
    if (message.type === "user" && message.text?.trim()) session.prompts.push(message.text)
    if (message.type === "shell") session.commands++
    if (message.type !== "assistant" || !Array.isArray(message.content)) continue
    for (const part of message.content) {
      if (part.type === "text" && part.text?.trim()) session.lastReply = part.text
      if (part.type !== "tool") continue
      if (SHELL_TOOLS.has(part.name)) session.commands++
      const path = part.state?.input?.path ?? part.state?.input?.file_path
      if (EDIT_TOOLS.has(part.name) && path) session.files.push(path)
    }
  }
  return session
}

const pstack: Plugin.Plugin = {
  id: "pstack",

  async setup(ctx) {
    const skills = loadSkills()
    const agents = loadAgents()

    await ctx.skill.transform((editor) => {
      for (const skill of skills) {
        editor.add({
          id: skill.id as unknown as Skill.ID,
          name: skill.name as unknown as Skill.Name,
          description: skill.description,
          autoinvoke: skill.autoinvoke,
          path: skill.path as unknown as Skill.Info["path"],
          content: skill.content,
        } satisfies Skill.Info)
      }
    })

    // `/how`, `/why`, `/poteto-mode`: the pstack prose tells the user to type
    // these, and OpenCode commands are the only place a slash name exists.
    await ctx.command.transform((editor) => {
      for (const skill of skills) {
        editor.add({
          name: skill.id,
          description: skill.description,
          execute: async (input) => {
            await ctx.session.prompt({
              sessionID: input.sessionID,
              text: input.prompt.text.trim() || `Follow the ${skill.id} skill.`,
              files: input.prompt.files,
              agents: input.prompt.agents,
              skills: [...(input.prompt.skills ?? []), { id: skill.id }],
              delivery: input.delivery,
            })
          },
        })
      }
    })

    await ctx.agent.transform((editor) => {
      for (const agent of agents) {
        editor.update(agent.id as unknown as Agent.ID, (item) => {
          item.description = agent.description
          item.system = agent.system
          item.mode = "subagent"
          if (READONLY_AGENTS.has(agent.id)) {
            item.permissions.push({ action: "edit", resource: "*", effect: "deny" })
          }
        })
      }
    })

    // A child session is created with a parent, and its parentID never changes,
    // so one lookup per session is enough.
    const mainSessions = new Map<string, boolean>()
    const isMain = async (sessionID: string) => {
      if (!mainSessions.has(sessionID)) {
        let main = true
        try {
          main = !(await ctx.session.get({ sessionID })).parentID
        } catch {
          // An unavailable lookup should not cost the main session its mandate.
        }
        if (mainSessions.size > 500) mainSessions.clear()
        mainSessions.set(sessionID, main)
      }
      return mainSessions.get(sessionID)
    }

    await ctx.session.hook("context", async (event) => {
      const main = await isMain(event.sessionID)
      const sheet = readSheet()
      const sections: string[] = []
      if (main && !hookOff(sheet)) sections.push(MANDATE)
      const nudge = main && startNudge(SUMMARY_SKILL)
      if (nudge) sections.push(nudge)
      sections.push(adapterNote())
      if (sheet) sections.push(sheet)

      event.system.push({ type: "text", text: sections.join("\n\n") })
    })

    const unload = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ types: ["session.idle"], signal: unload.signal })) {
        if (event.type !== "session.idle") continue
        const sessionID = event.data.sessionID
        try {
          if (!(await isMain(sessionID))) continue
          const [info, messages] = await Promise.all([ctx.session.get({ sessionID }), ctx.session.context({ sessionID })])
          writeDigest(summarize(info, messages, ctx.location.directory))
        } catch (error) {
          console.error(`pstack session-summary: ${(error as Error).message}`)
        }
      }
    })().catch(() => {})
    return () => unload.abort()
  },
}

export default pstack
