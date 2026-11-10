#!/usr/bin/env node
// Claude Code SessionStart hook: injects the poteto-mode mandate, as the other pstack ports do.
// A `session hook: off` line in the model sheet stops it. Never fails the session: every error exits 0.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SHEET = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "rules", "pstack-models.md");

function hookOff() {
  try {
    return readFileSync(SHEET, "utf8").split(/\r?\n/).some((line) => line.trim() === "session hook: off");
  } catch {
    return false;
  }
}

try {
  if (!hookOff()) {
    const context = readFileSync(new URL("./session-start-context.md", import.meta.url), "utf8").trim();
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
  }
} catch (error) {
  console.error(`pstack session-start hook: ${error.message}`);
}
