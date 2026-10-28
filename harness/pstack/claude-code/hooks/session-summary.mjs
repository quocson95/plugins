#!/usr/bin/env node
// Claude Code hook for the session-summary skill.
//   start (SessionStart): when no summary folder is saved, asks the model to get one from the user.
//   end (SessionEnd): reads the transcript into a Session and writes its digest to the saved folder.
// Never fails the session: every error exits 0.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { writeDigest } from "../skills/session-summary/scripts/digest.mjs";
import { startNudge } from "../skills/session-summary/scripts/summary-dir.mjs";

const SKILL = fileURLToPath(new URL("../skills/session-summary/SKILL.md", import.meta.url));
const EDITS = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);

function input() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function start() {
  const context = startNudge(SKILL);
  if (context) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
}

// The text the user typed, without tool results, slash-command wrappers, or harness reminders.
function typed(content) {
  const text = typeof content === "string" ? content : content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
  return text.replace(/<(system-reminder|local-command-[a-z]+|command-[a-z]+)>[\s\S]*?<\/\1>/g, "").trim();
}

function read(transcript, session) {
  for (const line of readFileSync(transcript, "utf8").split("\n")) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    // Other entry types, such as api-request-blob, repeat messages the session already logged.
    if (entry.isSidechain || !["user", "assistant"].includes(entry.type) || !entry.message) continue;
    session.startedAt ??= entry.timestamp;
    session.branch = entry.gitBranch ?? session.branch;
    const { role, content } = entry.message;
    if (role === "user" && !entry.isMeta) {
      const text = typed(content);
      if (text) session.prompts.push(text);
    } else if (role === "assistant" && Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "text" && part.text.trim()) session.lastReply = part.text;
        if (part.type !== "tool_use") continue;
        if (part.name === "Bash") session.commands++;
        const path = part.input?.file_path ?? part.input?.notebook_path;
        if (EDITS.has(part.name) && path) session.files.push(path);
      }
    }
  }
  return session;
}

function end({ transcript_path: transcript, cwd = process.cwd(), session_id: id = "unknown", reason }) {
  if (!transcript || !existsSync(transcript)) return;
  writeDigest(read(transcript, { harness: "Claude Code", id, cwd, reason, transcript, prompts: [], files: [], commands: 0, lastReply: "" }));
}

try {
  if (process.argv[2] === "start") start();
  else if (process.argv[2] === "end") end(input());
} catch (error) {
  console.error(`pstack session-summary hook: ${error.message}`);
}
