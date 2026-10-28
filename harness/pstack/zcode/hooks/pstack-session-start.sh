#!/bin/sh
# ZCode parses hook stdout as strict JSON, so the mandate is emitted as {"additionalContext": ...}.
set -eu

root="${ZCODE_CONFIG_DIR:-$HOME/.zcode}"
sheet="$root/pstack-models.md"
mandate="$root/pstack/pstack-session-start-context.md"

[ -f "$mandate" ] || exit 0
if [ -r "$sheet" ] && grep -Eqi '^[[:space:]]*session hook:[[:space:]]*off[[:space:]]*$' "$sheet"; then
  exit 0
fi

exec python3 -c 'import json, sys; print(json.dumps({"additionalContext": open(sys.argv[1]).read()}))' "$mandate"
