# pstack ports

This fork of `cursor/plugins` adds ports of pstack to harnesses upstream does not cover. Upstream ships the Cursor plugin in `pstack/` and a Claude Code tree in `harness/pstack/claude-code/`. This fork adds a tree per port next to it.

| Port | Tree | Adapter |
| --- | --- | --- |
| omp | `harness/pstack/omp/` | `pstack/docs/harness/omp.md` |
| Antigravity | `harness/pstack/antigravity/` | `pstack/docs/harness/antigravity.md` |
| OpenCode | `harness/pstack/opencode/` | `pstack/docs/harness/opencode.md` |
| ZCode | `harness/pstack/zcode/` | `pstack/docs/harness/zcode.md` |

## How a port is built

A port is one folder here, `pstack/harness/<tree>/`, plus one adapter, `pstack/docs/harness/<tree>.md`. `scripts/generate-pstack-harness-trees.mjs` finds every folder that holds a `port.json` and builds `harness/pstack/<tree>/` from it. The tree gets every pstack skill, agent, and guide page, the adapter line in each skill that uses a Cursor name, the adapter, the README, and every file in the port folder except `port.json`.

`port.json` has three fields:

- `label` names the harness in prose, such as the adapter line `In OpenCode, read the OpenCode adapter`.
- `substitutions` lists `{ "from", "to" }` text replacements for a Cursor path the harness does not have. The generator fails when a `from` matches no file, so an upstream rewrite of that text cannot slip through.
- `version` lists the JSON files in the port folder whose `version` the generator sets from `pstack/plugin.json`. Their source value is a `0.0.0` placeholder. An upstream version bump needs no port edit.

The generator also fails when an adapter has no row for a Cursor name a skill uses. That is the check that catches a new Cursor tool or model upstream adds.

## Syncing upstream

```sh
scripts/sync-pstack-upstream.sh
```

The script fetches `upstream`, merges `upstream/main`, regenerates `harness/pstack/`, and runs every check CI runs. It stops at the first failure with the fix to make. A clean run leaves a merge commit and a regenerated tree to commit and push.

Conflicts land in the few upstream files this fork edits:

- `scripts/generate-pstack-harness-trees.mjs` holds the port discovery and the multi-tree loop. Keep both upstream's change and the `ports` discovery.
- `scripts/validate-plugins.mjs` holds the `.omp-plugin/marketplace.json` check.
- `pstack/README.md` and `pstack/docs/guide/01-setup.md` each hold one paragraph that links here.
- `.github/workflows/validate-plugins.yml` holds one path line.

Every other port file lives in this folder or under `pstack/docs/harness/`, which upstream never touches.

When the generator fails after a merge, the message names the fix:

- `adapter has no row for <name>` means upstream added a Cursor name. Add a row to each named adapter.
- `no text matches the substitution` means upstream rewrote the text a port replaces. Update `from` in that port's `port.json` to the new text, and `to` to match.

Then rerun the script, or `node scripts/generate-pstack-harness-trees.mjs` alone. Check each port in its harness with the steps below before you push.

## Adding a port

1. Write `pstack/docs/harness/<tree>.md`. Copy an existing adapter and map every row to the new harness.
2. Create `pstack/harness/<tree>/port.json`, plus the manifest and any session hook the harness needs.
3. Run `node scripts/generate-pstack-harness-trees.mjs` and fix what it reports.
4. Add the port to the table above and a section below.

## omp

The extension `extensions/pstack.ts` injects the poteto-mode mandate and the adapter pointer into every session. `.omp-plugin/plugin.json` is the manifest omp reads. The tree ships no Agent Plugins root `plugin.json`, because omp routes a root that declares that schema to a strict skill validator that rejects pstack's `disable-model-invocation` field.

Install:

```sh
omp plugin marketplace add quocson95/plugins
omp plugin install pstack-omp@quocson95-plugins
```

omp reads a Claude Code plugin registry at priority 70, the same as a marketplace install. If a Claude Code pstack is installed too, its skills win the shared names. Link the tree instead, which installs at priority 90:

```sh
omp plugin link <path-to>/harness/pstack/omp
```

Release a sync with `omp plugin marketplace update quocson95-plugins`, then `omp plugin upgrade pstack-omp@quocson95-plugins`.

Check:

```sh
omp -p --no-session "Which skills can you see? Name the pstack ones."
omp -p --no-session "Do you have pstack? Quote the mandate line you see."
omp -p --no-session "What subagent names are available to you?"
```

## Antigravity

`rules/AGENTS.md` carries the poteto-mode mandate and the adapter pointer. Antigravity inlines it into every session while the plugin is active. `plugin.json` is the manifest.

Install into a workspace or for every project:

```sh
mkdir -p .agents/plugins && cp -r <path-to>/harness/pstack/antigravity .agents/plugins/pstack
mkdir -p ~/.gemini/config/plugins && cp -r <path-to>/harness/pstack/antigravity ~/.gemini/config/plugins/pstack
```

Without the plugin bundle, copy `skills/*` into `.agents/skills/` and `rules/AGENTS.md` to `.agents/rules/pstack.md`.

## OpenCode

`server.ts` is the OpenCode plugin. It registers every skill and one `/name` command per skill, registers `poteto-agent` and `comment-sicko` as subagents, and injects the mandate into each main session plus the adapter pointer and `~/.config/opencode/pstack-models.md` into every session. `package.json` names `server.ts` in `exports`. The plugin needs no dependencies and no build, because its `@opencode/plugin` import is type-only.

Install from Git, or point a config at a checkout:

```sh
opencode plugin add 'github:quocson95/plugins#main::path:harness/pstack/opencode'
```

```jsonc
// ~/.config/opencode/opencode.jsonc, or a project opencode.jsonc
{ "plugins": ["/absolute/path/to/harness/pstack/opencode"] }
```

OpenCode also loads skills from `.agents/skills/`, `.claude/skills/`, and `.opencode/skills/`, and those win over a plugin's skill with the same name. If another harness's pstack copy sits there, the model gets that copy, which names the wrong adapter. Remove it, or keep pstack in one place.

The plugin injects the model sheet itself. Remove any `pstack-models.md` entry from `instructions` in `opencode.json(c)`, or the sheet arrives twice. The sheet's `session hook: off` line stops the mandate.

Check in a scratch project. `opencode api` talks to the background service, and the header points it at the project:

```sh
mkdir -p /tmp/pstack-check && cd /tmp/pstack-check && git init -q
echo '{ "plugins": ["<path-to>/harness/pstack/opencode"] }' > opencode.json
opencode api get /api/agent -H "x-opencode-directory:$PWD" | jq '[.data[] | select(.mode == "subagent") | .id]'
opencode api get /api/command -H "x-opencode-directory:$PWD" | jq '[.data[].name]'
grep 'plugin.id=pstack' ~/.local/share/opencode/log/opencode.log | tail -3
```

The agents include `poteto-agent` and `comment-sicko`, and the commands include `poteto-mode`. A log line that says `disabled plugin after transform failure` names the field OpenCode rejected.

## ZCode

ZCode reads skills from `~/.zcode/skills/` and runs `SessionStart` hooks from `~/.zcode/cli/config.json`. `install.sh` links the tree at `~/.zcode/pstack`, links each skill into `~/.zcode/skills/`, seeds `~/.zcode/pstack-models.md` when it is missing, and registers `hooks/pstack-session-start.sh`, which injects the mandate unless the sheet says `session hook: off`. It replaces an earlier pstack hook entry and leaves the rest of the config alone, so a rerun is safe.

Do not install pstack into `~/.agents/skills/` for ZCode. OpenCode reads that folder too, and its copy there would shadow the OpenCode plugin's.

Install:

```sh
git clone https://github.com/quocson95/plugins ~/.local/share/quocson95-plugins
sh ~/.local/share/quocson95-plugins/harness/pstack/zcode/install.sh
```

Release a sync with `git -C ~/.local/share/quocson95-plugins pull`, then rerun `install.sh` to link any new skill.

Check with `zcode skills list`. Every pstack skill shows as `(user/zcode)`. Then open a new session and ask it to quote the pstack mandate.
