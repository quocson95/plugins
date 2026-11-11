---
name: motion-ui-audit
description: Audit the motion already in a UI against sourced numbers — timing budgets, easing direction, spring bounce, transform origin, stagger caps, exit ratios, performance cost and reduced-motion coverage — and report each problem with the exact replacement value. Use when reviewing animation code, when a design "feels off" or "janky" or "slow", for a reduced-motion compliance pass, or before shipping motion.
---

# Motion audit

Review motion that already exists. Report numbers, not adjectives: every finding names a current value, the value it should be, and how that value is known.

## 1. Take the inventory

Find every motion in the changed surface before judging any of it:

- `transition`, `animation`, `@keyframes`, `will-change`, inline `style` with a duration.
- JS animation: Web Animations API `animate(`, Motion or framer-motion `type: "spring"`, `gsap.`, CSS-in-JS transition objects.
- States that change with no transition at all — those are findings too, once the change is one a person should see move.

For each, record: file and line, what triggers it, which properties move, duration, easing, and whether a reduced-motion branch exists. Judging motion from a description rather than the code is where audits go wrong.

## 2. Check, in this order

1. **Should it exist.** Feedback, provenance, or a state change. A repeated all-day action or a keyboard-triggered one should feel instant. If the motion earns nothing, the finding is "remove", not "shorten".
2. **Timing.** Press and hover 100 to 150 ms; small elements entering 150 to 250 ms; dialogs and panels 200 to 300 ms; large surfaces 300 to 400 ms. A press must answer inside 100 ms. Exits about two thirds of the matching enter.
3. **Easing direction.** Entering: ease-out, default `cubic-bezier(0.23, 1, 0.32, 1)`. Leaving: ease-in. Moving within the screen: ease-in-out. Linear only for colour, opacity or constant rotation.
4. **Springs.** Bounce between 0 and 0.3, never on opacity or colour. A spring sampled into `linear()` must run for its settle time — a 350 ms spring with bounce 0.3 settles at 550 ms, so `350ms` cuts off the overshoot. Stiffness, damping and settle time per pair are in the `motion-ui` skill's `references/stacks.md`.
5. **Space.** Scale from 0.9 or above, never from 0. `transform-origin` on the element that triggered the change. Nothing that should stay put arrives from off-screen.
6. **Stagger.** 20 to 60 ms apart, whole sequence under 500 ms, delay capped after about five items.
7. **Repetition.** Hover, focus and press feedback on controls used all day: present but instant-feeling. Entrances replayed on every re-render: a bug.
8. **Cost.** Only `transform`, `opacity`, `filter`, `clip-path`. `width`, `height`, `top`, `left`, `margin` mean layout on every frame; auto height belongs to `grid-template-rows: 0fr → 1fr`. No `transition: all`. `will-change` only while the animation runs. Above-the-fold content must not start at `opacity: 0` — it delays the largest paint.
9. **Accessibility.** A `prefers-reduced-motion: reduce` branch that keeps the state change visible: a short fade or an instant change, not a removed affordance. Motion over five seconds that runs on its own needs a pause control. Motion is never the only signal — pair it with text, an icon or colour.
10. **Consistency.** The same moment uses the same numbers everywhere: one press scale, one toast duration, one exit ratio.

## 3. The mistakes that ship most

- Tooltip with no delay: five tooltips flash on one sweep. 600 to 700 ms delay, then instant for the next one inside a 300 ms skip window.
- List items inserted with no stagger: they land as one block. Space them 50 to 75 ms apart and cap the delay.
- Menu scaled from 0: it pops out of a point. Scale 0.9 to 1 with the same fade and the same duration.
- Digits or counters that only roll one way: they keep rolling up while the value drops. Direction follows the sign of the change.
- Exit longer than enter: the next action waits for the last animation.
- `transition: all` at 300 ms on a large surface: every property, including layout.

## 4. Report

| Where | Now | Problem | Change to | Why |
|:--|:--|:--|:--|:--|
| `toast.css:12` | `transform 400ms ease` | no reduced-motion branch | add one at 150 ms opacity, no rise | `recommended` |

Then, in prose and briefly: how many findings by severity, what is already correct, and what you could not judge — a value that depends on a designer's intent, or on a browser you did not run.

Rules of the report:

- Cite file and line. A finding without a location is a guess.
- Offer one replacement value per finding, taken from the budgets or the `motion-ui` pattern files, and name its status.
- Do not "fix" motion nobody asked you to touch. Audit first; change only what the request covers.
- A value that differs from a library is not automatically wrong — say it breaks a budget, or leave it alone.
- Say what you did not verify. A static read cannot prove that a spring settles as intended in a real browser.
