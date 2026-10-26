# Syncing the pstack Antigravity port

This fork includes an Antigravity port of pstack under `harness/pstack/antigravity/`.
The port is generated from `pstack/`, so syncing an upstream pstack release is a merge plus one script run.

## What is hand-written and what is generated

Hand-written, in `pstack/`:

| File | Why |
| --- | --- |
| `pstack/docs/harness/antigravity.md` | The Cursor-to-Antigravity mapping adapter. |
| `pstack/harness/antigravity/rules/AGENTS.md` | Injects the poteto-mode mandate and points the model at the adapter. |
| `pstack/harness/antigravity/plugin.json` | The Antigravity plugin manifest. |
| `pstack/harness/antigravity/SYNC.md` | Sync procedure and install documentation. |
| `scripts/generate-pstack-harness-trees.mjs` | The generator configuration for the Antigravity harness tree. |

Generated, never edited by hand:

| Path | Produced by |
| --- | --- |
| `harness/pstack/antigravity/` | `node scripts/generate-pstack-harness-trees.mjs` |

## Sync procedure

Run from the repository root:

### 1. Merge upstream

```sh
git fetch upstream
git merge upstream/main
```

Resolve any conflicts in `scripts/generate-pstack-harness-trees.mjs` by preserving the `antigravity` entry in `HARNESSES`.

### 2. Review the upstream pstack diff

Watch for:
- New Cursor tools, models, or paths in `pstack/skills/`. If a new term is added to the generator's `TERMS` check, add its mapping row in `pstack/docs/harness/antigravity.md`.
- New skills: automatically wrapped and copied by the generator.
- Changes to `pstack/agents/`: automatically verified and copied.

### 3. Regenerate and verify

```sh
node scripts/generate-pstack-harness-trees.mjs
node scripts/generate-pstack-harness-trees.mjs --check
node scripts/validate-plugins.mjs
node scripts/check-pstack-docs.mjs
```

All commands must pass with zero errors.

### 4. Bump the version, commit, push

Keep versions in lockstep across:
- `pstack/plugin.json`
- `pstack/.cursor-plugin/plugin.json`
- `pstack/harness/antigravity/plugin.json`
- Other harness manifests (`pstack/harness/omp/package.json`, etc.)

Then regenerate and commit:

```sh
node scripts/generate-pstack-harness-trees.mjs
git add -A
git commit -m "chore(pstack): sync upstream pstack <version> and antigravity port"
git push origin main
```

## Install paths in Antigravity

Antigravity discovers plugins and skills in workspace and global directories:

### Option A: Project Workspace Plugin (Recommended for teams)

Link or copy the generated harness tree into the `.agents/plugins/` folder of your project:

```sh
mkdir -p .agents/plugins
cp -r <path-to>/harness/pstack/antigravity .agents/plugins/pstack
```

### Option B: Global Machine Plugin

Install for all projects under your user configuration:

```sh
mkdir -p ~/.gemini/config/plugins
cp -r <path-to>/harness/pstack/antigravity ~/.gemini/config/plugins/pstack
```

### Option C: Direct Skills Folder

If you prefer using standalone workspace skills without the plugin bundle:

```sh
mkdir -p .agents/skills
cp -r <path-to>/harness/pstack/antigravity/skills/* .agents/skills/
cp <path-to>/harness/pstack/antigravity/rules/AGENTS.md .agents/rules/pstack.md
```
