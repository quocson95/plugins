// Renders and saves the session-end digest. Each harness hook reads its own transcript format into a Session
// and calls writeDigest, so the file looks the same whichever harness wrote it.
//
// Session: { harness, id, cwd, branch?, startedAt?, reason?, transcript?, prompts: string[], files: string[], commands: number, lastReply }

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { readDir, summaryPath } from "./summary-dir.mjs";

const PROMPTS = 20;
const CLIP = 300;

export function clip(text) {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > CLIP ? `${line.slice(0, CLIP)}…` : line;
}

// Local time as YYYY-MM-DD-HHMM, the stamp the skill names its files with.
export function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function gitBranch(cwd) {
  try {
    return execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function render(session) {
  const { prompts } = session;
  const shown = prompts.length > PROMPTS ? [...prompts.slice(0, PROMPTS / 2), "…", ...prompts.slice(-PROMPTS / 2)] : prompts;
  return [
    `# Session ${session.id.slice(0, 8)}`,
    "",
    `- **Harness:** ${session.harness}`,
    `- **Started:** ${session.startedAt ?? "unknown"}`,
    `- **Ended:** ${new Date().toISOString()}${session.reason ? ` (${session.reason})` : ""}`,
    `- **Project:** ${session.cwd}${session.branch ? `, branch \`${session.branch}\`` : ""}`,
    ...(session.transcript ? [`- **Transcript:** ${session.transcript}`] : []),
    "",
    "Written by the pstack session-end hook from the transcript. The session-summary skill writes a fuller summary before a session ends.",
    "",
    "## Prompts",
    "",
    ...shown.map((prompt) => `- ${clip(prompt)}`),
    "",
    "## Files edited",
    "",
    ...(session.files.length ? [...new Set(session.files)].map((path) => `- \`${path}\``) : ["- none"]),
    "",
    `Shell commands run: ${session.commands}`,
    "",
    "## Last reply",
    "",
    session.lastReply.trim() || "none",
    "",
  ].join("\n");
}

// Returns the path written, or undefined when no folder is saved, summaries are off, or the session had no prompts.
// A hook cannot ask the user, so an unset folder is a skip here; the session-start nudge and the skill do the asking.
export function writeDigest(session) {
  const dir = readDir();
  if (dir === undefined || dir === "off" || session.prompts.length === 0) return undefined;
  const path = summaryPath(dir, `${stamp()}-session-${session.id.slice(0, 8)}`, session.cwd);
  writeFileSync(path, render({ ...session, branch: session.branch ?? gitBranch(session.cwd) }));
  return path;
}
