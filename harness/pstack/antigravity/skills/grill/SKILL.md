---
name: grill
description: "Interview the user in rounds until a plan has no silent assumptions, and write the project's domain language and hard-to-reverse decisions down as they settle (GLOSSARY.md, docs/adr/). Use for /grill, 'grill me', 'stress-test this plan', or before a Feature or multi-phase plan whose product calls are still open."
---

# Grill

In Antigravity, read [the Antigravity adapter](../../docs/harness/antigravity.md) once per session before you follow this skill. It maps the Cursor names in pstack skills to Antigravity.

Settle a plan's open decisions with the user, one round at a time, and leave the settled language and decisions in the repo where later agents read them.

## The design tree

Every decision branches into the decisions that hang off it. The **frontier** is each open decision whose prerequisites are already settled. Ask only the frontier. A question whose answer depends on another question still open belongs to a later round.

## Before each round

Classify every frontier question per the `AskQuestion` trigger in the **poteto-mode** skill.

- A fact you can look up in the code, docs, or tools is yours. Send a subagent for it (the **guard-the-context-window** principle skill). Only the questions downstream of it wait. Ask the rest now.
- A fact you can observe by running something is yours. Settle it with `../poteto-mode/playbooks/prototype.md`.
- A product or preference call goes to the user.

## A round

Number each question and give your recommended answer. Word it so "yes" accepts the recommendation.

```
**Q1. <title>.** <question, with the options when there are several>
Recommended: <answer and the one reason that decides it>
```

Wait for the answers. Recompute the frontier from them and ask the next round. Stop when the frontier is empty. Do not act on the plan until the user confirms you share one understanding of it.

## Domain language

Read `GLOSSARY.md` first, or `GLOSSARY-MAP.md` when the repo has several contexts. During the rounds:

- When the user's term conflicts with the glossary, say so in the next round. "The glossary defines cancellation as X. You seem to mean Y. Which is it?"
- When a term is vague or overloaded, propose one canonical term.
- Test each relationship with a concrete edge-case scenario that forces the boundary.
- When the user states how something works, check the code. Raise any contradiction as a question.

Write each term into `GLOSSARY.md` the round it settles, in the format in `references/glossary-format.md`. Create the file when the first term settles, not before. The glossary holds domain terms only. Implementation detail and general programming concepts stay out.

## Decisions

Offer an ADR only when the decision is hard to reverse, surprising to a later reader, and the result of a real trade-off. Missing any one, skip it. Write it in `docs/adr/` in the format in `references/adr-format.md`. The **why** skill reads these later as design rationale.

**Reply:** the settled decisions in one list, each term and ADR written with its path, and anything the user left open.

Adapted from `grilling` and `domain-modeling` in [mattpocock/skills](https://github.com/mattpocock/skills), MIT licensed, copyright Matt Pocock.
