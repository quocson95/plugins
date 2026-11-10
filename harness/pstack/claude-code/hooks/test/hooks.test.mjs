import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { check } from "../bash-guard.mjs";
import { onStop, onSubagentStop } from "../background-tasks.mjs";

const hook = (name, input) =>
  execFileSync("node", [fileURLToPath(new URL(`../${name}`, import.meta.url))], { input: JSON.stringify(input), encoding: "utf8" });

const HUNG = [
  'until grep -q "^exit\\|Error [0-9]\\|All tests passed" /tmp/s/client/flutter2.log 2>/dev/null && ! pgrep -f "make verify-flutter" >/dev/null; do sleep 10; done; tail -4 /tmp/s/client/flutter2.log',
  'until ! pgrep -f "flutter_tools.*test.*home_bootstrap" >/dev/null && [ -s /tmp/t/byangp132.output ]; do sleep 3; done; cat /tmp/t/byangp132.output',
  'until grep -q "^exit=" /tmp/t/b092ji9po.output 2>/dev/null; do sleep 10; done; tail -5 /tmp/t/b092ji9po.output',
];

const FINE = [
  'cd coding/FitUp/flutter && for i in 1 2 3; do timeout 300 flutter test test/coach_voice_test.dart 2>&1 | grep -E "All tests|Some tests" ; done',
  "make verify-flutter > /tmp/s/int.log 2>&1; echo exit=$?; tail -5 /tmp/s/int.log",
  "git log --oneline | while read sha msg; do echo $sha; done",
  'timeout 900 bash -c \'until grep -q "^exit=" /tmp/t/x.output; do sleep 10; done\'',
  "make serve & p=$!; timeout 600 bash -c \"while kill -0 $p 2>/dev/null; do sleep 5; done\"",
  'pgrep -af "make verify-flutter"',
  'grep -lniE "coach|water|sleep" e2e/tests/*.ts | while read f; do grep -niE "steps|sleep" "$f" | head -6; done',
  "python3 - <<'EOF'\nold='''  while adb shell input keyevent KEYCODE_WAKEUP; do sleep 20; done'''\nEOF\necho patched",
];

test("the polling loops that hung real sessions are denied", () => {
  for (const command of HUNG) assert.notEqual(check(command), "", command);
});

test("a pgrep -f loop is denied even inside timeout, because it can only end by timing out", () => {
  assert.match(check('timeout 60 bash -c \'until ! pgrep -f "make verify"; do sleep 5; done\''), /matches the shell running this loop/);
});

test("bounded loops, read loops, and one-off pgrep still run", () => {
  for (const command of FINE) assert.equal(check(command), "", command);
});

test("the hook process denies through the PreToolUse decision and stays silent otherwise", () => {
  const denied = JSON.parse(hook("bash-guard.mjs", { tool_input: { command: HUNG[1] } }));
  assert.equal(denied.hookSpecificOutput.permissionDecision, "deny");
  assert.equal(hook("bash-guard.mjs", { tool_input: { command: FINE[1] } }), "");
  assert.equal(hook("bash-guard.mjs", {}), "");
});

const SHELL = { id: "ba65ruoym", type: "shell", status: "running", command: "until grep -q ^exit log; do sleep 10; done" };
const OTHER = { id: "bn21xb3fr", type: "shell", status: "running", command: "make verify-flutter" };
const SIBLING = { id: "a9d2d41a7aad20623", type: "subagent", status: "running", description: "Fix Home trainer-target refresh" };

test("a subagent with its own shell still running is sent back to stop it", () => {
  const out = onSubagentStop({ background_tasks: [SHELL, OTHER, SIBLING] }, "... running in background with ID: ba65ruoym ... a9d2d41a7aad20623");
  assert.equal(out.decision, "block");
  assert.match(out.reason, /ba65ruoym/);
  assert.doesNotMatch(out.reason, /bn21xb3fr|a9d2d41a7aad20623/);
});

test("a subagent stops freely when nothing it started runs, on the second try, or with no transcript", () => {
  assert.equal(onSubagentStop({ background_tasks: [OTHER] }, "transcript without the id"), null);
  assert.equal(onSubagentStop({ background_tasks: [SHELL], stop_hook_active: true }, "ba65ruoym"), null);
  assert.equal(onSubagentStop({ background_tasks: [SHELL] }, ""), null);
});

test("the hook process reads the subagent transcript from its path", () => {
  const transcript = join(mkdtempSync(join(tmpdir(), "pstack-hook-")), "agent.jsonl");
  writeFileSync(transcript, '{"content":"Command running in background with ID: ba65ruoym."}\n');
  const out = JSON.parse(hook("background-tasks.mjs", { hook_event_name: "SubagentStop", agent_transcript_path: transcript, background_tasks: [SHELL] }));
  assert.equal(out.decision, "block");
});

test("the main chat's turn end names every task still running, and says nothing when none run", () => {
  assert.match(onStop({ background_tasks: [OTHER, SIBLING] }).systemMessage, /shell bn21xb3fr \(make verify-flutter\); subagent a9d2d41a7aad20623 \(Fix Home/);
  assert.equal(onStop({ background_tasks: [] }), null);
  assert.equal(hook("background-tasks.mjs", { hook_event_name: "Stop" }), "");
});
