# Installing motion-ui

One plugin, two skills, four harnesses. Install it once per harness: a second copy with the same skill names shadows the first and points at the wrong references.

| Harness | Install | Update |
|:--|:--|:--|
| Cursor | `/add-plugin motion-ui` | Cursor updates the plugin. |
| Claude Code | `/plugin marketplace add quocson95/plugins`, then `/plugin install motion-ui@cursor-plugins` | `claude plugin update motion-ui@cursor-plugins` |
| ZCode | `git clone https://github.com/quocson95/plugins ~/.local/share/quocson95-plugins`, then `sh ~/.local/share/quocson95-plugins/motion-ui/harness/zcode/install.sh` | `git -C ~/.local/share/quocson95-plugins pull`, then rerun `install.sh` |
| pi | same clone, then `sh ~/.local/share/quocson95-plugins/motion-ui/harness/pi/install.sh` | `git -C ~/.local/share/quocson95-plugins pull`; the links follow the checkout on their own |

The plugin is listed as `motion-ui` in both marketplace manifests, so a checkout of this repo is enough for Cursor and Claude Code.

## Claude Code

The repo ships `.claude-plugin/plugin.json` next to the Cursor manifest, so the same folder installs in both. Commands are namespaced by plugin, but these two are skills, not commands: the agent picks them up from the plugin, and you can also name one in a prompt, as in "use motion-ui for the toast".

Auto-update is off for third-party marketplaces. Turn it on in `/plugin`, under **Marketplaces**, by selecting the marketplace and choosing **Enable auto-update**.

## ZCode

```sh
sh ~/.local/share/quocson95-plugins/motion-ui/harness/zcode/install.sh
```

The script links each skill into `~/.zcode/skills/`, which every workspace reads, and refuses to overwrite a real directory of the same name. Set `ZCODE_CONFIG_DIR` to install somewhere else. Start a new session afterwards; an open one keeps the skill list it started with.

Do not also copy these skills into `~/.agents/skills/`: OpenCode reads that folder as well, and two copies of `motion-ui` shadow each other.

## pi

```sh
sh ~/.local/share/quocson95-plugins/motion-ui/harness/pi/install.sh
```

The script links each skill into `~/.pi/agent/skills/`, next to the other global skills, and takes `PI_SKILLS_DIR` as an override. Links mean a `git pull` is the whole update.

If you would rather pin a copy than follow a checkout, pi also loads a package folder registered in `~/.pi/agent/settings.json` under `packages`: a directory with `package.json` and a `skills/` folder. The pstack port ships that way.

## Skills only, any harness

When a harness reads a plain skills folder and you do not want the plugin, copy the two skill folders:

```sh
cp -r <path-to>/plugins/motion-ui/skills/motion-ui        ~/.claude/skills/
cp -r <path-to>/plugins/motion-ui/skills/motion-ui-audit  ~/.claude/skills/
```

Swap the destination for `~/.zcode/skills/`, `~/.pi/agent/skills/`, or the project-local `.cursor/skills/`. Copying trades the link for a snapshot: rerun the copy after a `git pull`.

## Check the install

```sh
ls ~/.zcode/skills | grep motion      # ZCode
ls ~/.pi/agent/skills | grep motion   # pi
```

Then, in a session, ask for one of the patterns without giving numbers — "add the toast entrance" or "make this switch feel right" — and check the reply uses a duration from the reference rather than an invented one. The audit skill answers to "review the motion in this component".
