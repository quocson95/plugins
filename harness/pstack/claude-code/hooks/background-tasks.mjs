#!/usr/bin/env node
// Claude Code hook for background work that outlives a turn.
//   SubagentStop: sends a subagent back once when shells or monitors it started still run, because
//     Claude Code holds its report until they exit, and the parent waits for a report that never comes.
//   Stop: tells the user which background tasks are still running when the main chat ends its turn.
// Never fails the session: every error exits 0.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const label = (task) => `${task.type} ${task.id} (${task.command ?? task.description ?? ""})`;

export function onSubagentStop(input, transcript) {
  if (input.stop_hook_active || !transcript) return null;
  const own = (input.background_tasks ?? []).filter((task) => task.type !== "subagent" && transcript.includes(task.id));
  if (own.length === 0) return null;
  return {
    decision: "block",
    reason: `Your report is held until these background tasks exit, so your caller never receives it:\n${own.map((task) => `- ${label(task)}`).join("\n")}\nStop each one with TaskStop, or wait for it if its result belongs in your report, then give your final report.`,
  };
}

export function onStop(input) {
  const running = input.background_tasks ?? [];
  if (running.length === 0) return null;
  return { systemMessage: `Still running in the background: ${running.map(label).join("; ")}` };
}

function transcriptOf(path) {
  try {
    return path ? readFileSync(path, "utf8") : "";
  } catch {
    return "";
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const output =
      input.hook_event_name === "SubagentStop" ? onSubagentStop(input, transcriptOf(input.agent_transcript_path)) : onStop(input);
    if (output) console.log(JSON.stringify(output));
  } catch {}
}
