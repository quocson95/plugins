#!/bin/sh
# Installs this tree into ZCode: links it at ~/.zcode/pstack, links each skill into ~/.zcode/skills,
# and registers the SessionStart hook in ~/.zcode/cli/config.json. Safe to rerun.
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
command = 'sh "$HOME/.zcode/pstack/hooks/pstack-session-start.sh"'
hooks = config.setdefault("hooks", {})
hooks["enabled"] = True
starts = hooks.setdefault("events", {}).setdefault("SessionStart", [])
for group in starts:
    group["hooks"] = [h for h in group.get("hooks", []) if "pstack-session-start.sh" not in h.get("command", "")]
starts[:] = [g for g in starts if g["hooks"]]
starts.append({
    "matcher": "startup|resume|clear|compact",
    "hooks": [{"type": "command", "command": command, "timeout": 10, "statusMessage": "pstack session start"}],
})
json.dump(config, open(path, "w"), indent=2)
PY

echo "pstack linked into $root. Start a new ZCode session to load it."
