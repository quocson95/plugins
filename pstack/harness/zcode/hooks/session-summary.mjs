#!/usr/bin/env node
// ZCode hook for the session-summary skill.
//   start (SessionStart): when no summary folder is saved, asks the model to get one from the user.
//   stop (Stop): reads the session from ZCode's db into a Session and rewrites its digest.
// ZCode has no session-end hook, and the transcript_path it passes holds one message, so the digest comes
// from the db after every turn. ZCode parses hook stdout as strict JSON. Never fails the session.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeDigest } from "../skills/session-summary/scripts/digest.mjs";
import { startNudge } from "../skills/session-summary/scripts/summary-dir.mjs";

const SKILL = fileURLToPath(new URL("../skills/session-summary/SKILL.md", import.meta.url));
const DB = join(process.env.ZCODE_CONFIG_DIR || join(homedir(), ".zcode"), "cli", "db", "db.sqlite");
const EDITS = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);

function input() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

async function read(id, cwd) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(DB, { readOnly: true });
  try {
    const info = db.prepare("select directory, time_created from session where id = ? and parent_id is null").get(id);
    if (!info) return undefined;
    const session = { harness: "ZCode", id, cwd: info.directory || cwd, startedAt: info.time_created, transcript: DB, prompts: [], files: [], commands: 0, lastReply: "" };
    const rows = db.prepare("select p.data part, m.data message from part p join message m on m.id = p.message_id where p.session_id = ? order by p.time_created, p.id").all(id);
    for (const row of rows) {
      const part = JSON.parse(row.part);
      const { role } = JSON.parse(row.message);
      // Synthetic user parts are harness reminders and task notifications, not what the user typed.
      if (role === "user" && part.type === "text" && !part.synthetic && part.text?.trim()) session.prompts.push(part.text);
      if (role !== "assistant") continue;
      if (part.type === "text" && part.text?.trim()) session.lastReply = part.text;
      if (part.type !== "tool") continue;
      if (part.tool === "Bash") session.commands++;
      const path = part.state?.input?.file_path ?? part.state?.input?.notebook_path;
      if (EDITS.has(part.tool) && path) session.files.push(path);
    }
    return session;
  } finally {
    db.close();
  }
}

async function main() {
  const command = process.argv[2];
  if (command === "start") {
    const context = startNudge(SKILL);
    return context ? { additionalContext: context } : {};
  }
  if (command === "stop") {
    const { session_id: id, cwd = process.cwd() } = input();
    if (id && existsSync(DB)) {
      const session = await read(id, cwd);
      if (session) writeDigest(session);
    }
  }
  return {};
}

let output = {};
try {
  output = await main();
} catch (error) {
  console.error(`pstack session-summary hook: ${error.message}`);
}
console.log(JSON.stringify(output));
