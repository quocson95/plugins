#!/bin/sh
# Links the motion-ui skills into pi's global skills folder, so every project sees them.
# Safe to rerun. Set PI_SKILLS_DIR to install somewhere else, such as a test folder.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
skills=$(cd "$here/../../skills" && pwd)
root="${PI_SKILLS_DIR:-$HOME/.pi/agent/skills}"
mkdir -p "$root"

for dir in "$skills"/*/; do
  name=$(basename "$dir")
  target="$root/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "skip $name: $target is a real directory" >&2
    continue
  fi
  ln -sfn "${dir%/}" "$target"
  echo "linked $name -> $target"
done

echo "motion-ui linked into $root. Start a new pi session to load it."
