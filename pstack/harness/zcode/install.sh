#!/bin/sh
# Installs this tree into ZCode: links it at ~/.zcode/pstack, links each skill into ~/.zcode/skills,
# and registers the pstack hooks in ~/.zcode/cli/config.json. Safe to rerun.
set -eu

tree=$(cd "$(dirname "$0")" && pwd)
root="${ZCODE_CONFIG_DIR:-$HOME/.zcode}"
mkdir -p "$root/skills" "$root/cli"

ln -sfn "$tree" "$root/pstack"
for dir in "$tree"/skills/*/; do
  name=$(basename "$dir")
  target="$root/skills/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "skip $name: $target is a real directory" >&2
    continue
  fi
  ln -sfn "${dir%/}" "$target"
done

if [ ! -f "$root/pstack-models.md" ]; then
  printf '%s\n' "default effort: session" "session hook: on" > "$root/pstack-models.md"
fi

python3 - "$root/cli/config.json" <<'PY'
import json, os, sys
path = sys.argv[1]
config = json.load(open(path)) if os.path.exists(path) else {}
pstack = '"$HOME/.zcode/pstack/hooks'
# event, matcher, the script that identifies an earlier pstack entry, command, timeout, status message
HOOKS = [
    ("SessionStart", "startup|resume|clear|compact", "pstack-session-start.sh", f'sh {pstack}/pstack-session-start.sh"', 10, "pstack session start"),
    ("SessionStart", "startup", "session-summary.mjs", f'node {pstack}/session-summary.mjs" start', 10, "pstack session summary"),
    ("Stop", None, "session-summary.mjs", f'node {pstack}/session-summary.mjs" stop', 30, "pstack session summary"),
]
hooks = config.setdefault("hooks", {})
hooks["enabled"] = True
events = hooks.setdefault("events", {})
for event in {hook[0] for hook in HOOKS}:
    groups = events.setdefault(event, [])
    scripts = [hook[2] for hook in HOOKS if hook[0] == event]
    for group in groups:
        group["hooks"] = [h for h in group.get("hooks", []) if not any(s in h.get("command", "") for s in scripts)]
    groups[:] = [g for g in groups if g["hooks"]]
for event, matcher, _, command, timeout, status in HOOKS:
    group = {"hooks": [{"type": "command", "command": command, "timeout": timeout, "statusMessage": status}]}
    if matcher:
        group = {"matcher": matcher, **group}
    events[event].append(group)
json.dump(config, open(path, "w"), indent=2)
PY

echo "pstack linked into $root. Start a new ZCode session to load it."
