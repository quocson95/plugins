# Install pstack

Each harness installs its own generated tree from [`harness/pstack/`](../harness/pstack/). Install pstack in one place per harness, because a second copy with the same skill names shadows the first and points at the wrong adapter. [The ports guide](./harness/README.md) explains how each port differs.

| Harness | Install | Update |
| --- | --- | --- |
| Cursor | `/add-plugin pstack` | Cursor updates the plugin. |
| Claude Code | `/plugin marketplace add quocson95/plugins`, then `/plugin install pstack@cursor-plugins` | `claude plugin update pstack@cursor-plugins` |
| omp | `omp plugin marketplace add quocson95/plugins`, then `omp plugin install pstack-omp@quocson95-plugins` | `omp plugin marketplace update quocson95-plugins`, then `omp plugin upgrade pstack-omp@quocson95-plugins` |
| OpenCode | `opencode plugin add 'github:quocson95/plugins#main::path:harness/pstack/opencode'` | `opencode plugin remove pstack`, then rerun the install command. `opencode plugin update` fails on a GitHub plugin. |
| Antigravity | `agy plugin install https://github.com/quocson95/plugins/tree/pstack-antigravity` | Rerun the install command. |
| ZCode | `git clone https://github.com/quocson95/plugins ~/.local/share/quocson95-plugins`, then `sh ~/.local/share/quocson95-plugins/harness/pstack/zcode/install.sh` | `git -C ~/.local/share/quocson95-plugins pull`, then rerun `install.sh` |
| Any, skills only | `npx skills add quocson95/plugins -a <agent>` | Rerun the command. |

## Claude Code

Claude Code prefixes plugin commands, so `/poteto-mode` is `/pstack:poteto-mode`. Auto-update is off for third-party marketplaces. Turn it on in `/plugin`, under **Marketplaces**, by selecting `cursor-plugins` and choosing **Enable auto-update**.

## omp

If a Claude Code pstack is installed too, its skills win the shared names, because omp reads both at priority 70. Link a checkout instead, which installs at priority 90:

```sh
omp plugin link <path-to>/harness/pstack/omp
```

## OpenCode

OpenCode loads skills from `.agents/skills/`, `.claude/skills/`, and `.opencode/skills/` ahead of a plugin's. Remove any pstack copy there. Remove any `pstack-models.md` entry from `instructions` in `opencode.json(c)` too, because the plugin injects the sheet itself.

## Antigravity

The `pstack-antigravity` branch holds only the Antigravity tree, because `agy` needs `plugin.json` at the root of what it clones. A workflow rebuilds the branch on every push to `main` that changes the tree. Every pstack skill is model-invocable in Antigravity, because Antigravity hides skills marked `disable-model-invocation`.

## ZCode

`install.sh` links each skill into `~/.zcode/skills/` and registers the session hook in `~/.zcode/cli/config.json`. A rerun is safe. Do not put pstack in `~/.agents/skills/`, because OpenCode reads that folder too.

## Skills only

[`npx skills`](https://github.com/vercel-labs/skills) copies the skills into the agent's skills folder. Use `claude-code`, `opencode`, `antigravity`, or `zcode` for `<agent>`, add `-g` for every project, and `--skill <name>` for one skill. It installs no hooks, agents, or extensions, so the poteto-mode mandate is not injected and `poteto-agent` is missing. Prefer the harness install above when one exists.

## After installing

Run `/setup-pstack` to choose your models, then start a task with `/poteto-mode`.
