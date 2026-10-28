---
name: session-summary
description: "Write a summary of the current session to the user's local summary folder: the goal, what changed, decisions, verification, and open threads. Asks for the folder the first time and reuses it after. Use for /session-summary, 'summarize this session', 'save a session summary', 'write up what we did', or when a session hook says the summary folder is not set."
---

# Session summary

In Claude Code, read [the Claude Code adapter](../../docs/harness/claude-code.md) once per session before you follow this skill. It maps the Cursor names in pstack skills to Claude Code.

**You write what this session did to a markdown file in the user's own summary folder, so the next session, or the user next week, can pick it up without the chat.**

The folder is one setting shared by this skill and the pstack session hooks. `scripts/summary-dir.mjs` in this skill's folder owns it. Never guess the folder or write the summary anywhere else.

## Find the folder

1. Run `node <this skill>/scripts/summary-dir.mjs get`.
   - Exit 0 prints the folder. Use it and do not ask.
   - Exit 2 means the user has not chosen one. Ask once with `AskQuestion`: where should session summaries go? Offer `~/notes/sessions` as the default, and "off" to never save them. Then run `summary-dir.mjs set <answer>`. Every later session reuses it.
   - Exit 3 means the user turned summaries off. Tell them `summary-dir.mjs set <dir>` turns them back on, and stop unless they asked for a summary in this message. If they did, ask for a folder as in exit 2.
2. If you came here because a session hook said the folder is not set, ask at the next natural pause, not in the middle of the user's task, and only once per session. Choosing the folder is all the hook asked for. Write a summary only if the user also wants one now.

## Write the summary

1. Run `node <this skill>/scripts/summary-dir.mjs path <YYYY-MM-DD-HHMM>-<topic>`, where `<topic>` is two to four words in kebab case. It prints the file path under a subfolder named for the project and creates the folder. If the file already exists, add to it instead of replacing it.
2. Write the file from what happened in this session. Check live state first: `git status`, `git log` for this session's commits, and any PR you opened. Do not write from memory alone.
3. Tell the user the path in one line.

Use these sections, and drop any that would be empty:

```markdown
# <topic in plain words>

- **Date:** <YYYY-MM-DD HH:MM>
- **Project:** <repo path>, branch `<branch>`

## Goal
What the user asked for, in one or two sentences.

## Done
What changed, one bullet per change, each with its evidence: commit SHA, PR number, or `file:line`.

## Decisions
Each fork taken and the reason, one line each.

## Verification
What you ran and what it showed. Name anything you did not verify.

## Open threads
What is left, what is blocked and on what, and the first step for whoever picks it up.
```

Write it for a reader who was not in the chat. Plain words, no transcript excerpts, no secrets or tokens. The **unslop** skill applies.
