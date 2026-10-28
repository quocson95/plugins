#!/usr/bin/env node

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PSTACK = join(ROOT, "pstack");
const SKILLS = join(PSTACK, "skills");
// Outside pstack/ so Cursor, which copies the whole plugin folder, does not install this tree too.
const OUT = join(ROOT, "harness", "pstack");
const GUIDE = "docs/guide";
const COMMAND = "node scripts/generate-pstack-harness-trees.mjs";
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;

// One tree per harness. `tree` is the directory the harness installs; `adapter` is the
// pstack-relative path of the harness mapping doc; `label` names the harness in prose.
// `manifests` lists pstack's own manifest files the tree ships.
// `substitutions` rewrites harness-specific paths in the copied text, so a tree never
// points at a directory the harness does not have.
const PORTS = join(PSTACK, "harness");
// pstack/harness/claude-code/ holds this fork's Claude Code additions, such as its hooks. It has no
// `port.json`, so it is an overlay on upstream's tree rather than a port.
const CLAUDE_CODE = {
  tree: "claude-code",
  adapter: "docs/harness/claude-code.md",
  label: "Claude Code",
  manifests: ["plugin.json", ".claude-plugin/plugin.json"],
  substitutions: [],
  ...(existsSync(join(PORTS, "claude-code")) && { overlay: join(PORTS, "claude-code"), version: [] }),
};

// Every other harness is a port: a folder pstack/harness/<tree>/ that holds a `port.json`
// descriptor and the files the tree needs beyond pstack/ (its manifest, a session hook).
// The generator copies the folder into the tree and stamps pstack's version into each
// JSON file the descriptor names under `version`, so an upstream version bump needs no
// port edit. A new port is a new folder plus its adapter, with no change to this script.
const ports = existsSync(PORTS)
  ? readdirSync(PORTS)
      .filter((tree) => existsSync(join(PORTS, tree, "port.json")))
      .sort()
      .map((tree) => {
        const { label, substitutions = [], version = [] } = JSON.parse(readFileSync(join(PORTS, tree, "port.json"), "utf8"));
        return { tree, adapter: `docs/harness/${tree}.md`, label, manifests: [], substitutions, overlay: join(PORTS, tree), version };
      })
  : [];
const HARNESSES = [CLAUDE_CODE, ...ports];
const VERSION = JSON.parse(readFileSync(join(PSTACK, "plugin.json"), "utf8")).version;
const VERSION_FIELD = /("version"\s*:\s*)"[^"]*"/;

const README = `# pstack harness tree

This folder is generated from \`pstack/skills\`, \`pstack/agents\`, \`pstack/${GUIDE}\`, each harness's adapter under \`pstack/docs/harness/\`, \`pstack/README.md\`, \`pstack/LICENSE\`, and \`pstack/plugin.json\`. Do not edit it by hand.

Cursor uses \`pstack/\` directly. Each other harness installs its own tree: ${HARNESSES.map((h) => `\`${h.tree}/\` for ${h.label}`).join(", ")}. The trees leave out the rest of \`pstack/\`, such as \`pstack/automations\` and \`pstack/assets\`. A relative link to a pstack file that a tree leaves out points at that file on GitHub \`main\` instead.

After editing those sources, run \`${COMMAND}\` from the repository root and commit the result.
`;

const TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: "`environment: \"cloud\"`", re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  { key: "Cursor-only features", re: /Bugbot|Cursor [Aa]utomation|cursor\.(sh|com)\/automations|[Cc]loud [Aa]gent|built-in PR tool/ },
];
const ROUTE_KEY = "Run another pstack skill";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function file(path) {
  return { bytes: readFileSync(path), executable: (statSync(path).mode & 0o111) !== 0 };
}

const skills = readdirSync(SKILLS).filter((name) => existsSync(join(SKILLS, name, "SKILL.md")));

function classify(skill) {
  const dir = join(SKILLS, skill);
  const others = skills.filter((name) => name !== skill).join("|");
  const route = new RegExp(`the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``, "g");
  const linksToSkill = (line, name) => line.includes(`(../${name}/`);
  const namesBareSkill = (line) =>
    [...line.matchAll(route)].some(({ groups }) => !linksToSkill(line, groups.bold ?? groups.command));
  const usesCursorNames = new Set();
  for (const path of walk(dir).filter((path) => path.endsWith(".md"))) {
    const text = readFileSync(path, "utf8");
    for (const term of TERMS) if (term.re.test(text)) usesCursorNames.add(term.key);
    if (text.split("\n").some(namesBareSkill)) usesCursorNames.add(ROUTE_KEY);
  }
  const text = readFileSync(join(dir, "SKILL.md"), "utf8");
  const wrap = usesCursorNames.size > 0 && /^# /m.test(text);
  return { usesCursorNames, wrap };
}

const classes = new Map(skills.map((skill) => [skill, classify(skill)]));
const problems = [];
const users = new Map();
for (const [skill, { usesCursorNames, wrap }] of classes) {
  if (usesCursorNames.size > 0 && !wrap) problems.push(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
  for (const key of usesCursorNames) users.set(key, [...(users.get(key) ?? []), skill]);
  // Cursor runs a skill by its folder name and Claude Code lists it by its frontmatter `name`, so the two must match. The Agent Skills spec limits both to SKILL_NAME.
  const frontmatter = readFileSync(join(SKILLS, skill, "SKILL.md"), "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const name = frontmatter.match(/^name:(.*)$/m)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  if (name !== skill) problems.push(`skills/${skill}/SKILL.md has name ${JSON.stringify(name ?? "")}, not its folder name ${skill}`);
  if (!SKILL_NAME.test(skill) || skill.length > 64) problems.push(`skills/${skill} is not lowercase words joined by hyphens, at most 64 characters`);
}
// Every harness adapter must map every Cursor name the tree uses.
for (const harness of HARNESSES) {
  const adapter = readFileSync(join(PSTACK, harness.adapter), "utf8");
  for (const [key, using] of users) {
    if (!adapter.includes(key)) {
      problems.push(`${harness.label} adapter has no row for ${key}, used by ${using.join(", ")}`);
    }
  }
}
for (const problem of problems) console.log(`FAIL ${problem}`);
if (problems.length > 0) process.exit(1);

// The pstack-relative path that a relative link in `from` points at, if that path exists.
function resolve(from, href) {
  const target = href.replace(/[#?].*/, "");
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
  return existsSync(join(PSTACK, path)) ? path : undefined;
}

function has(files, path) {
  return files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
}

function render(harness) {
  // Skills read the adapter, the guide, and the README at runtime, so a harness never fetches them.
  const copies = [
    ...walk(SKILLS),
    ...walk(join(PSTACK, "agents")),
    ...walk(join(PSTACK, GUIDE)),
    join(PSTACK, harness.adapter),
    join(PSTACK, "README.md"),
  ];
  const files = new Map(copies.map((path) => [relative(PSTACK, path), file(path)]));
  const line =
    `In ${harness.label}, read [the ${harness.label} adapter](../../${harness.adapter}) once per session before you follow this skill. ` +
    `It maps the Cursor names in pstack skills to ${harness.label}.`;
  for (const [skill, { wrap }] of classes) {
    const path = `skills/${skill}/SKILL.md`;
    const text = files.get(path).bytes.toString("utf8");
    if (wrap) files.get(path).bytes = Buffer.from(text.replace(/^(# .*)\n+/m, `$1\n\n${line}\n\n`));
  }
  files.set("LICENSE", file(join(PSTACK, "LICENSE")));
  for (const manifest of harness.manifests) files.set(manifest, file(join(PSTACK, "plugin.json")));
  if (harness.overlay) {
    for (const path of walk(harness.overlay)) {
      const target = relative(harness.overlay, path);
      if (target !== "port.json") files.set(target, file(path));
    }
    for (const path of harness.version) {
      const entry = files.get(path);
      if (!entry) {
        problems.push(`${harness.label} port: port.json versions ${path}, which pstack/harness/${harness.tree}/ does not have`);
        continue;
      }
      // Replace the value in place, so the source's formatting reaches the tree unchanged.
      const text = entry.bytes.toString("utf8");
      if (!VERSION_FIELD.test(text)) problems.push(`${harness.label} port: ${path} has no "version" field to stamp`);
      entry.bytes = Buffer.from(text.replace(VERSION_FIELD, `$1${JSON.stringify(VERSION)}`));
    }
  }
  const matched = new Set();
  for (const [path, entry] of files) {
    if (!path.endsWith(".md")) continue;
    let text = entry.bytes.toString("utf8");
    for (const substitution of harness.substitutions) {
      if (!text.includes(substitution.from)) continue;
      matched.add(substitution);
      text = text.replaceAll(substitution.from, substitution.to);
    }
    text = text.replace(LINK, (link, href) => {
      const target = resolve(path, href);
      if (!target || target.split("/")[0] === ".." || has(files, target)) return link;
      const kind = statSync(join(PSTACK, target)).isDirectory() ? "tree" : "blob";
      return `](${GITHUB}/${kind}/main/pstack/${target}${href.slice(href.search(/[#?]|$/))})`;
    });
    entry.bytes = Buffer.from(text);
  }
  // An upstream edit to the text a substitution targets leaves the tree pointing at a Cursor path.
  for (const substitution of harness.substitutions) {
    if (!matched.has(substitution)) {
      problems.push(`${harness.label} tree: no text matches the substitution for ${JSON.stringify(substitution.from.slice(0, 60))}`);
    }
  }
  return files;
}

// A harness installs only its tree, so a relative link that works from pstack/ has to work inside the tree too.
// Links to pstack files that the tree leaves out already point at GitHub, so a failure here is a link that leaves pstack/.
const rendered = new Map([["README.md", { bytes: Buffer.from(README), executable: false }]]);
const dangling = [];
for (const harness of HARNESSES) {
  const files = render(harness);
  for (const [path, entry] of files) {
    rendered.set(`${harness.tree}/${path}`, entry);
    if (!path.endsWith(".md")) continue;
    for (const [, href] of entry.bytes.toString("utf8").matchAll(LINK)) {
      const target = resolve(path, href);
      if (target && !has(files, target)) {
        dangling.push(`harness/pstack/${harness.tree}/${path} links to ${href}, which is not in the tree`);
      }
    }
  }
}
for (const problem of [...problems, ...dangling]) console.log(`FAIL ${problem}`);
if (problems.length + dangling.length > 0) process.exit(1);

if (process.argv.includes("--check")) {
  const onDisk = new Map(existsSync(OUT) ? walk(OUT).map((path) => [relative(OUT, path), file(path)]) : []);
  const drifted = [...new Set([...rendered.keys(), ...onDisk.keys()])].sort().filter((path) => {
    const [want, have] = [rendered.get(path), onDisk.get(path)];
    return !want || !have || !want.bytes.equals(have.bytes) || want.executable !== have.executable;
  });
  for (const path of drifted.slice(0, 20)) console.log(`harness/pstack/${path}`);
  if (drifted.length > 0) {
    console.log(`harness/pstack is out of date. Run \`${COMMAND}\` and commit the result.`);
    process.exit(1);
  }
  console.log("harness/pstack is up to date.");
} else {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, { bytes, executable }] of rendered) {
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), bytes);
    chmodSync(join(OUT, path), executable ? 0o755 : 0o644);
  }
  const wrapped = [...classes.values()].filter(({ wrap }) => wrap).length;
  console.log(`${skills.length} skills, ${wrapped} SKILL.md files with the adapter line`);
}
