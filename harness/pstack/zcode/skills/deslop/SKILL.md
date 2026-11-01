---
name: deslop
description: "Deslop a diff or files: remove narrating comments, unsupported guards, dead compatibility paths, and unrelated edits. Invoke with /deslop, optionally with files or a diff scope as the argument."
disable-model-invocation: true
---

# Deslop

Strip slop from code. Slop is code that exists without doing work the task needs: it makes diffs harder to review and ships risk for nothing. Every item below is removed on evidence, not vibes.

## Scope

Use the caller's files or diff scope. Otherwise use the current diff against the base branch, default `main`, including the working tree. If there is no diff and no target, ask. Read the full scope before deleting anything.

## The four kinds

### 1. Narrating comments

Comments that restate the code or narrate the authoring process. The code already says what it does; git history is the change log.

Delete:
- Restatement: `// increment the counter`, `# loop over users`, `// call the API and parse the response`
- Process narration: `// First, ...`, `// Now we validate ...`, `// Finally, return`
- Change-log comments: `// changed from X to Y`, `// updated for the new API`, `// added for <feature>`
- Doc comments that repeat the signature: `// getUser returns the user`
- Banners and section dividers added to fence off a small change

Keep comments that say why: a constraint, a link to an issue or spec, a warning about a trap, the source of a magic number.

### 2. Unsupported guards

Defensive code for states nothing can produce. A guard is supported only if you can name a concrete way it fires: a caller, an input, a failure mode. If you cannot name one, it is unsupported.

Delete:
- Null/empty checks on values the type system, the constructor, or every call site already guarantees
- try/catch around code that cannot throw, or catch blocks that swallow errors nothing in the block raises
- Re-validation of inputs produced by trusted internal callers
- Fallback defaults for fields that are always present

Keep:
- Guards at trust boundaries: user input, network, files, IPC, third-party responses, persisted data
- Guards the type checker or linter requires
- Guards against a reachable failure the proper fix is out of scope for — and flag the proper fix in the report instead of letting the guard stand forever

Before deleting a guard, trace its removal through types, call sites, and every path through the function. Deleting an unsupported guard must not change behavior on any reachable path.

### 3. Dead compatibility paths

Code kept for callers, formats, or config that no longer exist.

Delete:
- Backward-compat shims, aliases, and wrappers with no remaining callers
- Branches on deprecated flags or config keys nothing sets anymore
- Read or serialization support for formats nothing writes anymore
- Legacy implementations kept alongside their replacements

Before deleting, grep the whole repo for references, including tests and scripts. Zero references outside the definition is the bar. Migrate small caller sets, then delete. Keep the shim only when live callers exist and migrating them is out of scope — and say so in the report. Format support that must still read persisted data is not dead.

### 4. Unrelated edits

Changes the task did not ask for, riding along in the same diff.

Revert:
- Drive-by refactors and renames in code the task did not require touching
- Reformatting of lines with no other change
- Extra features, "improvements", dependency bumps, and config changes outside the task

Keep what the task requires or forces, such as a signature change legitimately rippling to its callers. If a reverted edit looks valuable, propose it as a follow-up in the report instead of keeping it here.

## Steps

1. Determine the scope and read all of it.
2. Classify every hunk: task work, or slop of one of the four kinds. Uncertain means keep.
3. Delete the clear-cut narrating comments and unrelated edits.
4. For each guard and compatibility candidate, verify with types, call sites, and grep before deleting. This is the step that separates deslop from breakage.
5. Verify on the real artifact: build and run the tests that cover the touched code. A failing test after a removal means the removal was wrong — restore it and record why.
6. Report grouped by kind: what was deleted, with one-line evidence for each removal ("no callers outside tests", "type guarantees non-null"). List keeps you are unsure about and any follow-ups you propose. Do not silently keep.

## Rules

- Behavior must be identical after deslopping, except for paths proven unreachable.
- Never delete something you cannot explain. Unexplained code gets flagged, not removed.
- Deslop only the given scope. Widening the fence is itself slop of kind 4.
- Deslop subtracts; it does not restyle. Do not rewrite working code to be prettier.
