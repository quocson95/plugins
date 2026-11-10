#!/usr/bin/env node
// Claude Code PreToolUse hook for Bash. Denies the two polling loops that never exit:
// a `pgrep -f` or `pkill -f` loop, which matches its own shell, and a sleep loop with no `timeout`.
// Never fails the call it guards: any error lets the command run.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HEREDOC = /<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g;
const LOOP = /\b(?:while|until)\b[\s\S]*?\bdo\b[\s\S]*?\bdone\b/g;
const RULES = [
  {
    breaks: (loop) => /\bp(?:grep|kill)\s+(?:-[a-zA-Z]*f[a-zA-Z]*|--full)\b/.test(loop),
    reason:
      "This loop polls with `pgrep -f` or `pkill -f`, which also matches the shell running this loop, because its command line holds the same pattern. The loop never ends. Wait on the PID instead: start the job with `&`, keep `p=$!`, then `wait $p` or `while kill -0 $p 2>/dev/null; do sleep 5; done`, inside `timeout`.",
  },
  {
    breaks: (loop, command) => /(?:^|[;&|\n]|\bdo|\bthen)\s*sleep\s+[\d$]/.test(loop) &&!/\btimeout\s+(?:-\S+\s+)*\d/.test(command),
    reason:
      "This polling loop has no bound, so it runs forever when its condition never comes true, and a background one holds a subagent's report until it is stopped. Wrap it, as in `timeout 900 bash -c 'until ...; do sleep 10; done'`, and pick a bound past the slowest run you expect.",
  },
];

export function check(command) {
  const reasons = new Set();
  command = command.replace(HEREDOC, "");
  for (const [loop] of command.matchAll(LOOP)) {
    for (const rule of RULES) if (rule.breaks(loop, command)) reasons.add(rule.reason);
  }
  return [...reasons].join("\n\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const reason = check(JSON.parse(readFileSync(0, "utf8")).tool_input?.command ?? "");
    if (reason) {
      console.log(
        JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }),
      );
    }
  } catch {}
}
