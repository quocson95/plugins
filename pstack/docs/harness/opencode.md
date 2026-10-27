# pstack in OpenCode

pstack skills use Cursor names. In OpenCode, the pstack plugin ships the skills, the agents, one `/name` command per skill, the poteto-mode mandate, and the model sheet, so this file only maps names. Read it once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | OpenCode |
| --- | --- |
| `Task` | `subagent`. It takes `agent`, `description`, `prompt`, and `background`. |
| `AskQuestion` | `question`. It takes `questions[]` with `options[]` and a free-form answer. |
| Open a todolist | OpenCode V2 has no todolist tool. Keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | Run `/name`. The pstack plugin registers one command per skill, and it attaches that skill to the prompt. You can also call the `skill` tool with the skill ID. |
| `Grep`, `Glob` | `grep`, `glob`. |
| `Read`, `Write`, `Edit` | `read`, `write`, `edit`. |
| `Bash` | `shell`. Set `workdir` instead of `cd`, and `background` for a server. |
| Fetch a URL | `webfetch`. |
| Search the web | `websearch`. |
| Combine parallel calls | `execute`, the Code Mode runtime, with `tools` and `Promise.allSettled`. |

## Subagent fields

| Cursor | OpenCode |
| --- | --- |
| `subagent_type: generalPurpose` | `agent: "general"`. |
| `poteto-agent`, `comment-sicko` | `agent: "poteto-agent"`, `agent: "comment-sicko"`. The pstack plugin registers both. |
| `readonly: true` | `agent: "explore"`, and say "do not edit files" in the brief. |
| `readonly: false` | Omit `agent`, or set `agent: "general"`. |
| `environment: "cloud"` | No isolation flag on `subagent`. Create a worktree first with `worktree_create` in Code Mode, or `git worktree add`, give the worker that directory, and name the branch or commit it checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | `background: true`. The parent keeps working and is notified when the child finishes. |
| `resume` | Pass the child's `sessionID` back to `subagent` to continue that child conversation. |
| `file_attachments` | List the paths in the brief. |
| `model` on a spawn | `subagent` has no per-call model. Set `model` on the agent, in its Markdown file or under `agents.<id>.model` in `opencode.json(c)`, or let the child inherit the session model. |
| `effort` on a spawn | `subagent` has no per-call effort. Set a model variant on the agent, such as `provider/model#high`. |

## Models

| Cursor | OpenCode |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | A real OpenCode selector, `provider/model`, with an optional `#variant` suffix. OpenCode knows none of the Cursor slugs. |
| A `grok-*`, `gpt-*`, or other non-Claude slug | A real OpenCode selector for that family. A slug OpenCode does not list does not resolve. |
| `auto` or `inherit-parent` | Omit the model, so the child inherits the session model. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.config/opencode/pstack-models.md`, injected into every session by the pstack plugin. `$XDG_CONFIG_HOME` moves it when set. |
| A role value `<model> <effort>`, such as `opus high` | `provider/model#variant`, where the variant names the reasoning level. |

List the selectors this session can use with `opencode models`. Never write a slug you have not seen listed.

## setup-pstack

OpenCode has no always-applied rule file that names a model sheet, so the pstack plugin reads the sheet itself. Follow the skill's steps with these changes:

- Detect. The detected models are the selectors `opencode models` lists, each with the variants its model supports. A role value is `provider/model#variant`.
- Defaults. Map each default slug with the rows above. A family OpenCode cannot reach becomes `inherit-parent`, which runs the role on the session model.
- Write. Write `~/.config/opencode/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. The plugin injects the role lines into every session, so no include line is needed. Remove a `pstack-models.md` entry from `instructions` in `opencode.json(c)` if one is there, so the sheet arrives once.

## Paths

| Cursor | OpenCode |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.opencode/skills/`, `~/.config/opencode/skills/`. OpenCode also reads `.claude/skills/` and `.agents/skills/`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | The `plugins` array in `opencode.json(c)`, or unstamped plugin packages under `.opencode/plugins/`. The pstack tree is a plugin package at `harness/pstack/opencode`. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md`, or the `instructions` array in `opencode.json(c)`. OpenCode never reads `.mdc` files. The model sheet is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The plugin ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `opencode session list`, then `opencode session export <id>` for the JSON. Sessions live in the state database at `~/.local/share/opencode/opencode.db`. Read only the current project's sessions. |

## Cursor-only features

OpenCode has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in OpenCode: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | OpenCode |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line, or use a plugin, command, or shell timer when the task only needs a recurring local job. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
