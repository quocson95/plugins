#!/usr/bin/env node
// Owns the folder session summaries go to, so the skill and every harness hook read and write one setting.
//
//   summary-dir.mjs get           prints the folder. Exit 2: not set yet, ask the user. Exit 3: the user turned summaries off.
//   summary-dir.mjs set <dir|off> saves the folder (or turns summaries off) and prints what it saved.
//   summary-dir.mjs path <name>   prints <folder>/<project>/<name>.md and creates its folder. Exits 2 or 3 like get.
//
// PSTACK_SESSION_SUMMARY_DIR overrides the saved folder for one shell.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const CONFIG = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "pstack", "session-summary.json");

function expand(path) {
  return resolve(path.replace(/^~(?=$|\/)/, homedir()));
}

// The saved folder, "off", or undefined when the user has not answered yet.
export function readDir() {
  if (process.env.PSTACK_SESSION_SUMMARY_DIR) return expand(process.env.PSTACK_SESSION_SUMMARY_DIR);
  if (!existsSync(CONFIG)) return undefined;
  const { dir } = JSON.parse(readFileSync(CONFIG, "utf8"));
  if (dir === "off") return "off";
  return typeof dir === "string" && dir ? expand(dir) : undefined;
}

export function writeDir(value) {
  const dir = value === "off" ? "off" : expand(value);
  mkdirSync(dirname(CONFIG), { recursive: true });
  writeFileSync(CONFIG, `${JSON.stringify({ dir }, null, 2)}\n`);
  return dir;
}

// What a harness's session-start hook injects while no folder is saved, or undefined once one is.
// `skill` is the path to this skill's SKILL.md in the harness's tree.
export function startNudge(skill) {
  if (readDir() !== undefined) return undefined;
  return (
    "pstack session summaries have no folder yet. At the first natural pause in this session, not in the middle of the user's task, " +
    `follow "Find the folder" in ${skill} to ask the user once where to save them, or "off". ` +
    "Once saved, the end of every session writes a summary there."
  );
}

// One subfolder per project, named after the git root, so summaries from different repos never mix.
export function project(cwd = process.cwd()) {
  try {
    return basename(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
  } catch {
    return basename(resolve(cwd));
  }
}

export function summaryPath(dir, name, cwd) {
  const folder = join(dir, project(cwd));
  mkdirSync(folder, { recursive: true });
  return join(folder, `${name.replace(/[^\w.-]+/g, "-")}.md`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, arg] = process.argv.slice(2);
  if (command === "set" && arg) {
    console.log(writeDir(arg));
  } else if (command === "get" || (command === "path" && arg)) {
    const dir = readDir();
    if (dir === undefined) {
      console.error(`no summary folder set. Ask the user, then run: summary-dir.mjs set <dir|off>`);
      process.exit(2);
    }
    if (dir === "off") {
      console.error(`session summaries are off. summary-dir.mjs set <dir> turns them back on.`);
      process.exit(3);
    }
    console.log(command === "get" ? dir : summaryPath(dir, arg));
  } else {
    console.error("usage: summary-dir.mjs get | set <dir|off> | path <name>");
    process.exit(1);
  }
}
