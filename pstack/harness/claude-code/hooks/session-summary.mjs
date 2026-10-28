#!/usr/bin/env node
// Claude Code hook for the session-summary skill.
//   start (SessionStart): when no summary folder is saved, asks the model to get one from the user.
//   end (SessionEnd): writes a digest of the transcript to the saved folder. A hook cannot ask, so it skips when none is saved.
// Never fails the session: every error exits 0.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readDir, summaryPath } from "../skills/session-summary/scripts/summary-dir.mjs";

const SKILL = fileURLToPath(new URL("../skills/session-summary/SKILL.md", import.meta.url));
const PROMPTS = 20;
const CLIP = 300;

function input() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function start() {
  if (readDir() !== undefined) return;
  const context =
    "pstack session summaries have no folder yet. At the first natural pause in this session, not in the middle of the user's task, " +
    `follow "Find the folder" in ${SKILL} to ask the user once where to save them, or "off". ` +
    "Once saved, the end of every session writes a summary there.";
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
}

function clip(text) {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > CLIP ? `${line.slice(0, CLIP)}…` : line;
}

// The text the user typed, without tool results, slash-command wrappers, or harness reminders.
function typed(content) {
  const text = typeof content === "string" ? content : content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
  return text.replace(/<(system-reminder|local-command-[a-z]+|command-[a-z]+)>[\s\S]*?<\/\1>/g, "").trim();
}

function digest(transcript, cwd, sessionId, reason) {
  const prompts = [];
  const files = new Set();
  let commands = 0;
  let last = "";
  let first;
  let branch;
  for (const line of readFileSync(transcript, "utf8").split("\n")) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    // Other entry types, such as api-request-blob, repeat messages the session already logged.
    if (entry.isSidechain || !["user", "assistant"].includes(entry.type) || !entry.message) continue;
    first ??= entry.timestamp;
    branch = entry.gitBranch ?? branch;
    const { role, content } = entry.message;
    if (role === "user" && !entry.isMeta) {
      const text = typed(content);
      if (text) prompts.push(clip(text));
    } else if (role === "assistant" && Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "text" && part.text.trim()) last = part.text.trim();
        if (part.type !== "tool_use") continue;
        if (part.name === "Bash") commands++;
        const path = part.input?.file_path ?? part.input?.notebook_path;
        if (["Edit", "Write", "NotebookEdit", "MultiEdit"].includes(part.name) && path) files.add(path);
      }
    }
  }
  if (prompts.length === 0) return undefined;
  const shown = prompts.length > PROMPTS ? [...prompts.slice(0, PROMPTS / 2), "…", ...prompts.slice(-PROMPTS / 2)] : prompts;
  return [
    `# Session ${sessionId.slice(0, 8)}`,
    "",
    `- **Started:** ${first ?? "unknown"}`,
    `- **Ended:** ${new Date().toISOString()} (${reason ?? "unknown"})`,
    `- **Project:** ${cwd}${branch ? `, branch \`${branch}\`` : ""}`,
    `- **Transcript:** ${transcript}`,
    "",
    "Written by the pstack SessionEnd hook from the transcript. `/pstack:session-summary` writes a fuller summary before a session ends.",
    "",
    "## Prompts",
    "",
    ...shown.map((prompt) => `- ${prompt}`),
    "",
    "## Files edited",
    "",
    ...(files.size ? [...files].map((path) => `- \`${path}\``) : ["- none"]),
    "",
    `Shell commands run: ${commands}`,
    "",
    "## Last reply",
    "",
    last || "none",
    "",
  ].join("\n");
}

function end({ transcript_path: transcript, cwd = process.cwd(), session_id: sessionId = "unknown", reason }) {
  const dir = readDir();
  if (dir === undefined || dir === "off" || !transcript || !existsSync(transcript)) return;
  const text = digest(transcript, cwd, sessionId, reason);
  if (!text) return;
  // Local time, YYYY-MM-DD-HHMM, the same stamp the skill names its files with.
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  writeFileSync(summaryPath(dir, `${stamp}-session-${sessionId.slice(0, 8)}`, cwd), text);
}

try {
  if (process.argv[2] === "start") start();
  else if (process.argv[2] === "end") end(input());
} catch (error) {
  console.error(`pstack session-summary hook: ${error.message}`);
}
