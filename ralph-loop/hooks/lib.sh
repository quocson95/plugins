#!/bin/bash

# Shared by the Ralph Loop hooks.

# The loop belongs to one conversation. The state file has no owner when the skill writes it, so the
# first hook call that carries a conversation_id claims it. Returns 1 when the hook input comes from
# another conversation, so a second chat in the same workspace neither advances the loop nor ends it.
# Usage: ralph_bind_conversation "$HOOK_INPUT" "$STATE_FILE"
ralph_bind_conversation() {
  local input="$1" state="$2" conv bound tmp
  conv=$(jq -r '.conversation_id // empty' <<< "$input" 2>/dev/null || true)
  [[ -n "$conv" ]] || return 0
  bound=$(sed -n '/^---$/,/^---$/p' "$state" | sed -n 's/^conversation_id: *//p' | head -n 1)
  if [[ -z "$bound" ]]; then
    tmp="${state}.tmp.$$"
    awk -v conv="$conv" 'NR == 1 && /^---$/ { print; print "conversation_id: " conv; next } { print }' "$state" > "$tmp"
    mv "$tmp" "$state"
    return 0
  fi
  [[ "$bound" == "$conv" ]]
}
