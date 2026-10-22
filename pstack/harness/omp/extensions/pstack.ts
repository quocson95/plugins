/**
 * pstack for omp.
 *
 * Two jobs, both of which omp has no native equivalent for:
 *
 * 1. Inject the poteto-mode mandate into every main session. omp has no
 *    SessionStart hook, so the mandate rides the system prompt instead, where
 *    compaction cannot drop it.
 * 2. Point the model at the omp adapter, which maps the Cursor tool and model
 *    names the pstack skills use to the ones omp exposes.
 *
 * The model sheet (`pstack-models.md` in the omp agent directory) is read the
 * same way, so the per-role model choices a user recorded apply everywhere.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The mandate omp injects. It is the same shape as the Claude Code and Codex
 * session-start text, so one session reads the same whichever harness runs it.
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
</EXTREMELY_IMPORTANT>`;

/** The agent directory omp reads user-level files from. */
function agentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".omp", "agent");
}

/**
 * The per-role model sheet. A missing sheet leaves the skill defaults in place,
 * as the session hooks do.
 */
function readSheet(): string | undefined {
	try {
		return readFileSync(join(agentDir(), "pstack-models.md"), "utf8");
	} catch {
		return undefined;
	}
}

/** The sheet's `session hook: off` line, which stops the mandate injection. */
function hookOff(sheet: string | undefined): boolean {
	return sheet?.split(/\r?\n/).some((line) => line.trim() === "session hook: off") ?? false;
}

/**
 * The pointer to the adapter. The skills name Cursor tools and models, so the
 * model needs to know where the mapping lives before it follows one.
 */
function adapterNote(): string {
	const file = join(PLUGIN_ROOT, "docs", "harness", "omp.md");
	return `pstack skills are written for Cursor. When one names a Cursor tool (Task, AskQuestion, a todolist), a bundled skill, or a Cursor model, read ${file} for the omp equivalent before following it.`;
}

/**
 * Whether this session is the top-level one. A task subagent runs the same
 * extension, and the mandate belongs to the main chat only.
 */
function isMainSession(ctx): boolean {
	// When the context is unavailable, treat the session as the main one: an
	// injected mandate in a child is a smaller fault than a missing mandate in
	// the chat that owns the playbook.
	if (!ctx || typeof ctx !== "object") return true;
	const agent = ctx.agent;
	if (!agent || typeof agent !== "object") return true;
	return agent.kind === undefined || agent.kind === "main";
}

export default function pstack(pi) {
	pi.on("before_agent_start", (event, ctx) => {
		const systemPrompt = event.systemPrompt;
		if (!Array.isArray(systemPrompt) || systemPrompt.length === 0) return;

		const sheet = readSheet();
		const blocks = [...systemPrompt];
		const last = blocks.length - 1;
		const base = typeof blocks[last] === "string" ? blocks[last] : "";

		// A child agent gets the sheet and the pointer, as a Claude Code subagent
		// sees CLAUDE.md, but not the mandate: the session start does not run for
		// subagents.
		const sections: string[] = [];
		if (!hookOff(sheet) && isMainSession(ctx)) {
			sections.push(MANDATE);
		}
		sections.push(adapterNote());
		if (sheet) sections.push(sheet);

		blocks[last] = [base, ...sections].filter(Boolean).join("\n\n");
		return { systemPrompt: blocks };
	});
}
