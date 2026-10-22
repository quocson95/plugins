# Syncing the pstack omp port

This fork is `cursor/plugins` with one addition: an omp port of pstack, under
`harness/pstack/omp/`. The port is generated, so syncing an upstream pstack
release is a merge plus one script run.

## What is hand-written and what is generated

Hand-written, in `pstack/`:

| File | Why |
| --- | --- |
| `pstack/docs/harness/omp.md` | The Cursor-to-omp mapping. It is the port's only real content. |
| `pstack/harness/omp/extensions/pstack.ts` | The omp extension: it injects the poteto-mode mandate and points the model at the adapter. |
| `pstack/harness/omp/package.json` | The omp plugin manifest, which names the extension entry. |
| `pstack/harness/omp/.omp-plugin/plugin.json` | The omp plugin manifest omp reads. |
| `scripts/generate-pstack-harness-trees.mjs` | The generator. It now emits one tree per harness. |

Generated, never edited by hand:

| Path | Produced by |
| --- | --- |
| `harness/pstack/omp/` | `node scripts/generate-pstack-harness-trees.mjs` |
| `harness/pstack/claude-code/` | The same script. |

`harness/pstack/README.md` says the tree is generated. A diff there is drift, not
a change.

## Sync procedure

Run from the repository root.

### 1. Merge upstream

```sh
git fetch upstream
git merge upstream/main
```

Upstream may change `pstack/`, `scripts/generate-pstack-harness-trees.mjs`, and
`harness/pstack/`. Expect merge conflicts in the generator: upstream added the
Claude Code tree, this fork added the omp tree on top. Resolve them by keeping
both harnesses in the `HARNESSES` list. The list is the single source of truth
for which trees exist.

### 2. Review the upstream pstack diff

Read the diff for `pstack/` before regenerating. Watch for:

- A new Cursor tool, model, or path in a skill. The generator's `TERMS` list
  decides which skills get the adapter line. A new Cursor name that the omp
  adapter does not map fails the generator's check, so add the row to
  `pstack/docs/harness/omp.md` in the same change.
- A new skill. It needs no omp work: the generator copies the whole `skills/`
  tree and the adapter line is inserted automatically.
- A change to `pstack/agents/`. The generator copies agents verbatim. If the
  agent file names a harness-specific path, add a `substitutions` entry to the
  omp harness in the generator.

### 3. Regenerate and verify

```sh
node scripts/generate-pstack-harness-trees.mjs
node scripts/generate-pstack-harness-trees.mjs --check
node scripts/check-pstack-docs.mjs
```

The first command rewrites `harness/pstack/`. The second proves the tree matches
the sources, and the third checks the pstack docs against the tree. All three
must pass.

### 4. Check the omp port still holds

The generator cannot check the omp tree against omp itself. Verify by hand:

```sh
# The omp tree's skills load, and the mandate reaches the session.
omp -p --no-session "Which skills can you see? Name the pstack ones."

# The extension injects the mandate and the adapter pointer.
omp -p --no-session "Do you have pstack? Quote the mandate line you see."

# The pstack task agents register.
omp -p --no-session "What subagent names are available to you?"
```

### 5. Bump the version, commit, push

The version lives in three places that must agree:

- `pstack/plugin.json` `version`
- `pstack/.cursor-plugin/plugin.json` `version`
- `pstack/harness/omp/package.json` `version` and `pstack/harness/omp/.omp-plugin/plugin.json` `version`

The generator copies `pstack/plugin.json` into the claude-code tree, and the omp
tree's manifests are hand-written, so all four need the bump. Then:

```sh
node scripts/generate-pstack-harness-trees.mjs
git add -A
git commit -m "chore(pstack): sync upstream pstack <version> and the omp port"
git push origin main
```

### 6. Release to omp users

```sh
omp plugin marketplace update quocson95-plugins
omp plugin upgrade pstack-omp@quocson95-plugins
```

`omp plugin upgrade` reinstalls every scope of the plugin. A new session picks
up the new skills.

## Install paths, and which one to use

omp reads a plugin's skills through one of two providers.

| Install | Provider | Priority |
| --- | --- | --- |
| `omp plugin link <dir>` | `omp-plugins` | 90 |
| `omp plugin install name@marketplace` | `claude-plugins` | 70 |

A higher priority wins when two installs ship the same skill name. That matters
when a Claude Code plugin registry also holds a pstack, because omp reads the
Claude Code registry at priority 70 and its `pstack` copy would shadow the
marketplace-installed omp port for every shared skill.

So the recommended install links the tree:

```sh
omp plugin link <path-to>/harness/pstack/omp
```

A link wins at priority 90, so the omp port's skills resolve even when a
Claude Code pstack is installed.

The marketplace install is the convenient one for a user who has no Claude Code
pstack:

```sh
omp plugin marketplace add quocson95/plugins
omp plugin install pstack-omp@quocson95-plugins
```

It works alone. It loses the shared skill names to a Claude Code pstack, and
the losing copy is the Claude Code one, whose adapter names Claude Code, Codex,
Pi, Copilot, and Muse rather than omp.

A user with both installs can drop the Claude Code pstack, or link the omp tree
alongside it.

## Adding another harness later

A harness is one entry in the generator's `HARNESSES` list plus one adapter
under `pstack/docs/harness/`. The generator then produces
`harness/pstack/<tree>/` and the CI check covers it.

Two rules the trees depend on:

- The tree ships its own manifest when the harness reads a different one. The
  omp tree ships `.omp-plugin/plugin.json` and not pstack's Agent Plugins root
  `plugin.json`, because omp routes a root that declares the Agent Plugins
  schema to its strict skill validator, which rejects pstack's
  `disable-model-invocation` frontmatter field.
- A tree never points at a path the harness does not have. The `substitutions`
  list rewrites harness-specific paths in the copied text.
