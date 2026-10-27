# pstack harness tree

This folder is generated from `pstack/skills`, `pstack/agents`, `pstack/docs/guide`, each harness's adapter under `pstack/docs/harness/`, `pstack/README.md`, `pstack/LICENSE`, and `pstack/plugin.json`. Do not edit it by hand.

Cursor uses `pstack/` directly. Each other harness installs its own tree: `claude-code/` for Claude Code, `antigravity/` for Antigravity, `omp/` for omp, `opencode/` for OpenCode. The trees leave out the rest of `pstack/`, such as `pstack/automations` and `pstack/assets`. A relative link to a pstack file that a tree leaves out points at that file on GitHub `main` instead.

After editing those sources, run `node scripts/generate-pstack-harness-trees.mjs` from the repository root and commit the result.
