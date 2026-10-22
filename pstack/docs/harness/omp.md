# pstack in omp

pstack skills use Cursor names. In omp, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | omp |
| --- | --- |
| `Task` | `task`. It takes `tasks[]` with a shared `context` and one `task` per item, plus `solutionSpace` on each item. |
| `AskQuestion` | `ask`. It takes `questions[]` with `options[]`. In `-p` mode it is absent, so ask in plain text. |
| Open a todolist | `todo`. It takes `items[]` under a `phase`. |
| Run another pstack skill (`/name` or "the **name** skill") | Read `skill://<name>` and follow it. omp loads a skill when its description matches; `/skill:<name>` forces one. |
| `Grep`, `Glob` | `grep`, `glob`. |
| `Read`, `Write`, `Edit` | `read`, `write`, `edit`. |
| `Bash` | `bash`. |
| Fetch a URL | `read` on the URL. |
| Search the web | `web_search`. |

## Subagent fields

| Cursor | omp |
| --- | --- |
| `subagent_type: generalPurpose` | Omit `agent`, or set `agent: task`. The `task` agent is the general-purpose one. |
| `poteto-agent`, `comment-sicko` | `agent: poteto-agent`, `agent: comment-sicko`. This tree ships both agent files, so omp discovers them by name. |
| `readonly: true` | `agent: scout`, and say "do not edit files" in the brief. `scout` is read-only by contract. |
| `readonly: false` | Omit `agent`, or set `agent: task`. |
| `environment: "cloud"` | There is no isolation flag. Give each writing worker its own git worktree, or tell it to create one, and name the branch or commit it checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Omit. `task` spawns return an id immediately and the result arrives on its own. |
| `resume` | Spawn a new agent and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |
| `model` on a spawn | `model` is not a per-call field on `task`. Set the model on the agent file, or let the child inherit the session model. |
| `effort` on a spawn | `effort` is not a per-call field on `task`. Set `thinkingLevel` on the agent file. |

## Models

| Cursor | omp |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | A real omp selector, `provider/model`, with an optional `:level` thinking suffix. omp knows none of the Cursor slugs. |
| A `grok-*`, `gpt-*`, or other non-Claude slug | A real omp selector for that family. A slug omp does not list does not resolve. |
| `auto` or `inherit-parent` | Omit the model, so the child inherits the session model. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.omp/agent/pstack-models.md`, read by the pstack omp extension. |
| A role value `<model> <effort>`, such as `opus high` | `provider/model:high`, where the suffix names the thinking level. |

List the selectors this session can use with `omp models`. Never write a slug you have not seen listed.

## setup-pstack

omp has no always-applied rule file that names a model sheet, so the pstack omp extension reads the sheet itself. Follow the skill's steps with these changes:

- Detect. The detected models are the selectors `omp models` lists, each with the thinking levels that model supports. A role value is `provider/model:level`.
- Defaults. Map each default slug with the rows above. A family omp cannot reach becomes `inherit-parent`, which runs the role on the session model.
- Write. Write `~/.omp/agent/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. The extension injects the role lines into every session, so no include line is needed.

## Paths

| Cursor | omp |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.omp/skills/`, `~/.omp/agent/skills/`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | The omp plugin root, with `.omp-plugin/plugin.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | `~/.omp/agent/RULES.md`, which omp loads as an always-apply rule, or `AGENTS.md` for session-opening context. omp never reads `.mdc` files. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The plugin ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.omp/agent/sessions/--<cwd>--/<session>.jsonl`. The slug is the workspace path with each `/` and `:` changed to `-`, so `/Users/you/proj` is `-Users-you-proj`. Read only this workspace's folder. `omp session` lists the sessions. |

## Cursor-only features

omp has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in omp: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | omp |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
