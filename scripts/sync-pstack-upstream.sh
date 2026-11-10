#!/usr/bin/env bash
# Merge upstream cursor/plugins into this fork and rebuild the pstack ports.
# See pstack/harness/README.md for what each failure means.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
REMOTE="${1:-upstream}"
BRANCH="${2:-main}"

# Untracked files do not block a merge, and git refuses the merge itself if one would be overwritten.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "The working tree has changes. Commit or stash them first." >&2
  exit 1
fi

git fetch "$REMOTE"
if ! git merge --no-edit "$REMOTE/$BRANCH"; then
  echo >&2
  echo "Resolve the conflicts, commit the merge, then rerun $0 to rebuild and check." >&2
  exit 1
fi

node scripts/generate-pstack-harness-trees.mjs
node scripts/generate-pstack-harness-trees.mjs --check
node scripts/validate-plugins.mjs
node scripts/check-pstack-docs.mjs
# The same command CI runs. It needs fast-check: npm install --no-save fast-check@4.5.3
node --disable-warning=ExperimentalWarning --test pstack/skills/*/scripts/test/*.test.ts

if [[ -n "$(git status --porcelain -- harness/pstack)" ]]; then
  git add harness/pstack
  git commit -m "chore(pstack): regenerate the harness trees after the upstream merge"
fi
echo "Synced with $REMOTE/$BRANCH at pstack $(node -p 'require("./pstack/plugin.json").version'). Check each port in its harness, then push."
