---
name: motion-ui
description: Sourced motion specs for interface work — exact durations, curves and springs for 18 common patterns (celebration, press, success, validation, switch, tabs, accordion, menu icon, tooltip, toast, menu, rolling number, page progress, skeleton, list entry, bottom sheet, swipe, rubber band), each with copy-ready CSS, markup and a reduced-motion fallback. Use when adding, specifying or changing animation in a UI, when a component needs to feel right, or when a request says "make it smooth", "add a transition", "animate this" or "give it some polish" without giving a number.
---

# Motion UI

Interface motion, with numbers instead of adjectives. Each value carries how it is known:

- `verified` — read from a standard, a spec or a vendor document.
- `observed` — measured in the source of a shipping component library.
- `derived` — computed from a formula, such as overshoot from damping.
- `recommended` — an editorial default, used where no primary source exists.

## Decide first whether to animate

- Animate to give feedback, to show where something came from or went, or to mark a state change. Otherwise do not animate.
- Do not animate actions a person repeats all day or triggers from the keyboard. They must feel instant.
- If the motion would only make a screenshot look better, it is not motion. Skip it and say why in one line.

## Workflow

1. Name the moment: something was pressed, confirmed, rejected, selected, expanded, revealed, loaded, dragged, or dismissed.
2. Find the nearest row in the index below. Read that entry in its file — it carries the numbers, the CSS, the markup and the wiring.
3. Keep the numbers and the reduced-motion block exactly as written; rename the classes and swap the demo text for real content. A demo's spacings and colours are scaffolding, its durations and curves are the spec.
4. If two patterns meet on one element, the press half keeps its own small budget (120 ms here) and the surface half takes its own. Never add the durations together to get one number.
5. Check the result against the budgets below, then against `prefers-reduced-motion: reduce`.

## Pattern index

| Moment | Pattern | Numbers to copy |
|:--|:--|:--|
| Celebration | [Pop on yes](references/feedback.md#pop-on-yes) | bounce 0.3, sampled 630 ms |
| Press feedback | [Sink, then spring](references/feedback.md#sink-then-spring) | scale 0.97 in 120 ms; release 550 ms |
| Success state | [Draw the win](references/feedback.md#draw-the-win) | ring 300 ms + tick 170 ms |
| Validation | [Shake, don't shout](references/feedback.md#shake-dont-shout) | ±6 px, 400 ms |
| Toggles | [Stretch, then glide](references/controls.md#stretch-then-glide) | thumb 150 ms; stretch 100 ms |
| Selection | [Slide the pill, don't swap](references/controls.md#slide-the-pill-dont-swap) | spring 300 ms, bounce 0.15 |
| Expand and collapse | [Fast, then slow](references/controls.md#fast-then-slow) | 0fr → 1fr, 300 ms |
| Icon morph | [Meet, then turn](references/controls.md#meet-then-turn) | 150 + 150 ms |
| Tooltips | [Wait once, then follow](references/overlays.md#wait-once-then-follow) | 600 ms wait, 300 ms skip |
| Toasts | [Slide in, step back](references/overlays.md#slide-in-step-back) | 400 ms in, 200 ms out |
| Menus and popovers | [Grow, don't pop](references/overlays.md#grow-dont-pop) | 0.9 → 1, 220 ms in |
| Number change | [Roll, don't jump](references/data-loading.md#roll-dont-jump) | spring 500 ms, digits 60 ms apart |
| Page loading | [Crawl, then finish](references/data-loading.md#crawl-then-finish) | 8% start, 99.4% cap |
| Loading placeholders | [Shimmer, then settle in place](references/data-loading.md#shimmer-then-settle-in-place) | 1.5 s sweep, 200 ms fade |
| Lists | [Stagger, then stop](references/data-loading.md#stagger-then-stop) | 50 ms apart, capped at 5 |
| Drawers | [Follow, then snap](references/gestures.md#follow-then-snap) | settle 500 ms, flick 0.4 px/ms |
| Swipe to dismiss | [Past the line, let go](references/gestures.md#past-the-line-let-go) | 45 px or 0.11 px/ms |
| Drag boundary | [Resist the pull](references/gestures.md#resist-the-pull) | c = 0.55, return 590 ms |

Four of these entries also carry a **common mistake** line — the version that ships most often, and the one number that fixes it. Read it before changing the pattern.

## Budgets when nothing in the index fits

- Press and hover feedback: 100 to 150 ms. Respond within 100 ms, before any network result.
- Small elements entering (tooltip, menu, toast): 150 to 250 ms.
- Dialogs and panels: 200 to 300 ms. Large surfaces: 300 to 400 ms.
- Exits are about two thirds of the enter.
- Entering: ease-out, default `cubic-bezier(0.23, 1, 0.32, 1)`. Leaving: ease-in. Moving within the screen: ease-in-out. Linear only for colour, opacity or constant rotation.
- Springs for gestures and for anything interruptible; keep bounce between 0 and 0.3. Never overshoot opacity or colour.
- Scale from 0.9 or above, never from 0, and set `transform-origin` on the element that triggered the change.
- Stagger 20 to 60 ms apart, whole sequence under 500 ms, delay capped after about five items.
- Animate `transform`, `opacity`, `filter`, `clip-path`. Not `width`, `height`, `top`, `left`, `margin`. For auto height, animate `grid-template-rows` from `0fr` to `1fr`.
- No `transition: all`. Never start above-the-fold content at `opacity: 0`.
- Under `prefers-reduced-motion: reduce`, replace movement with a short fade or an instant change and keep the state change visible. Anything that moves on its own for over five seconds needs a pause control. Motion is never the only signal.

The full text these budgets come from is in [references/rules.md](references/rules.md) — paste that block into a project's `AGENTS.md` so the numbers outlive the session.

## When the stack is not plain CSS

A spring is stored once and sampled per stack; the CSS duration is the settle time, not the nominal duration. Formulas, the Tailwind token, the Motion parameters and a table of durations read from shipping libraries are in [references/stacks.md](references/stacks.md).

## Rules of the trade

- Never invent a duration. Take one from the index or stay inside the budgets, and say which you took.
- Keep one motion per state change. Two effects on one press read as noise.
- Ship the reduced-motion branch in the same edit as the motion, not after.
- When the numbers cannot be kept — a legacy stack without `linear()`, a canvas renderer — say which value was approximated and what replaced it.
