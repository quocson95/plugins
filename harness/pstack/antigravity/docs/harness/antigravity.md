# pstack in Antigravity

pstack skills use Cursor names. In Antigravity, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | Antigravity |
| --- | --- |
| `Task` | `invoke_subagent`. Takes `TypeName`, `Role`, `Prompt`, `Model`, and `Workspace`. |
| `AskQuestion` | `ask_question`. Takes `questions[]` with `options[]`. When asking simple binary confirmations, ask directly in plain text. |
| Open a todolist | Track tasks and checklists using markdown checklists in your reply or write them to an artifact (`<appDataDir>/brain/<conversation-id>/...`). |
| Run another pstack skill (`/name` or "the **name** skill") | Read `<pstack>/skills/<name>/SKILL.md` or invoke `/name`. Antigravity progressively discloses installed skills. When telling the user, write `/<name>`. |
| `Grep`, `Glob` | `run_command` with `grep` or `rg` / `find`, or native file tools. |
| `Read`, `Write`, `Edit` | `read_file`, `write_file`, `edit_file`. |
| `Bash` | `run_command`. |
| Fetch a URL / Search the web | `search_web`. |

## Subagent fields

| Cursor | Antigravity |
| --- | --- |
| `subagent_type: generalPurpose` | `TypeName: "self"` (inherits parent configuration, system prompt, and tools). |
| `poteto-agent`, `comment-sicko` | `TypeName: "poteto-agent"`, `TypeName: "comment-sicko"` (discovered from the plugin's `agents/` folder, or registered dynamically with `define_subagent`). |
| `readonly: true` | `TypeName: "research"`, which provides read-only codebase and web search tools. In the brief, also instruct: "do not edit files". |
| `readonly: false` | `TypeName: "self"`. |
| `environment: "cloud"` | `Workspace: "branch"` (isolated git branch) or `Workspace: "share"` (shared worktree). |
| `environment: "local"` | `Workspace: "inherit"`. |
| `cloud_base_branch: <b>` | Tell the worker to check out or branch from `<b>` in its `Prompt`. |
| `run_in_background: true` | Omit. All `invoke_subagent` calls run in the background by default and wake you reactively on completion. |
| `resume` | Use `send_message` targeting the existing subagent's conversation ID. |
| `file_attachments` | Include file links (`[file](file:///...)`) or absolute paths in `Prompt`. |
| `model` on a spawn | Map to `Model`: `"inherit"`, `"flash_lite"`, `"flash"`, or `"pro"`. |
| `effort` on a spawn | Handled by model tier (`pro` for deep reasoning, `flash` for fast reasoning). |

## Models

| Cursor | Antigravity |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | `Model: "pro"` on subagents, or Gemini Pro in the main session. |
| A `grok-*`, `gpt-*`, or other non-Claude slug | `Model: "flash"` or `Model: "inherit"`. |
| `auto` or `inherit-parent` | `Model: "inherit"`. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.gemini/config/rules/pstack-models.md` (global) or `.agents/rules/pstack-models.md` (workspace). |
| A role value `<model> <effort>`, such as `opus high` | Set `Model` on subagents: `pro` for max/xhigh/high effort, `flash` for high/medium, `flash_lite` for low. |

## setup-pstack

Antigravity automatically discovers and loads rules from `~/.gemini/config/rules/` and `.agents/rules/`. Follow the skill's steps with these changes:

- Detect. The detected subagent models are the ones `invoke_subagent` accepts: `inherit`, `pro`, `flash`, and `flash_lite`. The main session models are `auto`, `gemini-3.8-pro`, and `gemini-3.8-flash`.
- Defaults. Map each default slug with the rows above: `claude-opus-5-5-xhigh` is `pro`, and `grok-4.7-xhigh-fast` is `flash` (or `inherit-parent`).
- Write. Write `~/.gemini/config/rules/pstack-models.md` (or `.agents/rules/pstack-models.md`) with no frontmatter, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. Antigravity loads it automatically.

## Paths

| Cursor | Antigravity |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.agents/skills/`, `~/.gemini/config/skills/`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.gemini/config/plugins/` or `.agents/plugins/`, with `plugin.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md`, `GEMINI.md`, or `.agents/rules/*.md`. Antigravity never reads `.mdc` files. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The plugin ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `<appDataDir>/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`. Subagent transcripts live under their own conversation ID and can be referenced via `conversation://<id>`. |

## Cursor-only features

Antigravity handles background execution and scheduling natively, but has no Cursor Automations webhook routines, Bugbot, or Cursor cloud agents. When a step needs one, put one line in your reply, `Skipped in Antigravity: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | Antigravity |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line, or use Antigravity's `schedule` tool if the task needs a local scheduled/recurring background timer. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives (`gh pr view`). Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to `Workspace: "branch"`, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
