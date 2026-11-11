#!/bin/sh
# Links the motion-ui skills into ZCode's global skills folder, so every workspace sees them.
# Safe to rerun. Set ZCODE_CONFIG_DIR to install somewhere else, such as a test folder.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
skills=$(cd "$here/../../skills" && pwd)
root="${ZCODE_CONFIG_DIR:-$HOME/.zcode}"
mkdir -p "$root/skills"

for dir in "$skills"/*/; do
  name=$(basename "$dir")
  target="$root/skills/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "skip $name: $target is a real directory" >&2
    continue
  fi
  ln -sfn "${dir%/}" "$target"
  echo "linked $name -> $target"
done

echo "motion-ui linked into $root/skills. Start a new ZCode session to load it."
