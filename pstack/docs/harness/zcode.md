# pstack in ZCode

pstack skills use Cursor names. In ZCode, read this file once per session, then map each Cursor name in a skill with the tables below. ZCode keeps Claude Code's tool names, so most rows match the Claude Code adapter. `<pstack>` means the folder that holds `skills/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | ZCode |
| --- | --- |
| `Task` | `Agent` |
| `AskQuestion` | `AskUserQuestion`. In `-p` mode it is absent, so ask in plain text. |
| Open a todolist | Use `TodoWrite` if the session offers it. Otherwise keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `Read` `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write `/<name>`. |
| `Grep`, `Glob` | `Bash` with `rg` when the session has no `Grep` or `Glob`. |

## Subagent fields

| Cursor | ZCode |
| --- | --- |
| `subagent_type: generalPurpose` | `subagent_type: "general-purpose"` |
| `poteto-agent`, `comment-sicko` | `subagent_type: "poteto-agent"` or `"comment-sicko"` when `.zcode/agents/` defines them. Otherwise `general-purpose`, and paste the agent file's body at the top of the brief. |
| `readonly: true` | `subagent_type: "Explore"`. The brief also says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | `general-purpose`. |
| `environment: "cloud"` | Create a worktree with `git worktree add`, give the worker that directory, and name the branch or commit it checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Omit. Subagents run in the background by default and notify you when they finish. |
| `resume` | Spawn a new agent and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |

## Models

The `Agent` tool has no `model` or `effort` parameter. Apply a role's model by passing it as `subagent_model` on a dynamic workflow, or by defining an agent type in `.zcode/agents/` with that model. Effort levels are `low`, `high`, and `max`.

| Cursor | ZCode |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, `grok-*`, `gpt-*`, or any other slug | The model the role's line in `~/.zcode/pstack-models.md` names, such as `glm-5.3`. Without a line, the session model. Drop `-fast`. |
| `auto` or `inherit-parent` | The session model. |
| An effort of `medium` or `xhigh` | `high`. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.zcode/pstack-models.md`. `~/.zcode/AGENTS.md` repeats its role lines, so they are in context every session. If they are not, read the file. |

## setup-pstack

Follow its steps with these changes:

- Detect. The detected models are the ones the ZCode model picker lists for this account, such as `glm-5.3` and `glm-5.3-flash`.
- Write. Write `~/.zcode/pstack-models.md`, then replace the role lines inside `~/.zcode/AGENTS.md` with the same lines. Never touch `~/.claude/`.

## Paths

| Cursor | ZCode |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.zcode/skills/`, `~/.zcode/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.zcode/skills/`. The pstack install links each skill there. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` in the repository, or `~/.zcode/AGENTS.md` for every project. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | Skip a step that reads transcripts, with the line below. ZCode's session store is not a documented format. |

## Cursor-only features

ZCode has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in ZCode: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | ZCode |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
