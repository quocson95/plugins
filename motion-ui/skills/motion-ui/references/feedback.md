# Feedback

Four moments where the interface answers a person: a yes, a press, a success, a failure.

Status marks: `verified` read from a standard, a spec or a vendor document; `observed` measured in a shipping library’s source; `derived` computed from a formula; `recommended` an editorial default where no primary source exists.

In this file: [Pop on yes](#pop-on-yes), [Sink, then spring](#sink-then-spring), [Draw the win](#draw-the-win), [Shake, don't shout](#shake-dont-shout).

## Pop on yes

`heart-like` · Feedback · Celebration · bounce 0.3

**Numbers.**

- pop 400 ms, bounce 0.3 (recommended) — the CSS samples the spring over 630 ms, its settle time
- 6 burst dots, 400 ms (recommended)
- overshoot 4.6% (derived from bounce 0.3)
- `aria-pressed` carries the state (verified)

**Why.** The pop and the burst mark the moment the person said yes. Unliking gets no celebration, so the reward stays tied to the positive action.

**Wire it.** Toggle `aria-pressed` on the button and leave the CSS to react to it. Increment the count in the same tick. The burst dots sit at fixed angles through `--a`; six is the whole fan.

**Reduced motion.** Colour change only: no pop, no burst, no press scale.

```css
.m-like {
  display: inline-flex; align-items: center; gap: 10px;
  min-height: 56px; padding: 0 22px 0 16px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: var(--m-surface, #16263a); color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums;
  cursor: pointer; touch-action: manipulation;
  transition: border-color 150ms;
}
.m-like-icon { position: relative; display: grid; place-items: center; width: 28px; height: 28px; }
.m-like svg {
  width: 28px; height: 28px;
  fill: transparent; stroke: currentColor; stroke-width: 2; stroke-linejoin: round;
  transition: fill 150ms, stroke 150ms, scale 120ms cubic-bezier(0.23, 1, 0.32, 1);
}
.m-like:active svg { scale: 0.85; }
.m-like[aria-pressed="true"] { border-color: var(--m-danger, #ff8f85); }
/* Liking pops the heart on a spring; unliking only changes the colour. */
.m-like[aria-pressed="true"] svg {
  fill: var(--m-danger, #ff8f85); stroke: var(--m-danger, #ff8f85);
  animation: m-pop 630ms linear(
    0, 0.022, 0.078, 0.157, 0.251, 0.35, 0.45, 0.546, 0.636, 0.717,
    0.788, 0.849, 0.9, 0.942, 0.975, 1, 1.019, 1.032, 1.04, 1.045,
    1.046, 1.045, 1.043, 1.039, 1.035, 1.03, 1.026, 1.021, 1.017, 1.013,
    1.01, 1.007, 1.005, 1.003, 1.001, 1, 0.999, 0.999, 0.998, 0.998,
    0.998, 0.998, 0.998, 0.998, 0.998, 1
  );
}
@keyframes m-pop { from { scale: 0.6; } }
.m-like-burst { position: absolute; inset: 0; pointer-events: none; }
.m-like-burst i {
  position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px;
  border-radius: 50%; background: var(--m-danger, #ff8f85);
  rotate: var(--a); opacity: 0;
}
.m-like[aria-pressed="true"] .m-like-burst i { animation: m-burst 400ms cubic-bezier(0.23, 1, 0.32, 1); }
@keyframes m-burst {
  from { opacity: 1; transform: translateY(-10px) scale(1); }
  to { opacity: 0; transform: translateY(-26px) scale(0.4); }
}
@media (prefers-reduced-motion: reduce) {
  .m-like svg { transition: none; }
  .m-like:active svg { scale: none; }
  .m-like[aria-pressed="true"] svg, .m-like[aria-pressed="true"] .m-like-burst i { animation: none; }
}
```

```html
<button class="m-like" type="button" aria-pressed="false" aria-label="Like">
  <span class="m-like-icon">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
    <span class="m-like-burst" aria-hidden="true">
      <i style="--a: 0deg"></i>
      <i style="--a: 60deg"></i>
      <i style="--a: 120deg"></i>
      <i style="--a: 180deg"></i>
      <i style="--a: 240deg"></i>
      <i style="--a: 300deg"></i>
    </span>
  </span>
  <span class="m-like-count">128</span>
</button>
```

## Sink, then spring

`button-press` · Feedback · Press feedback · scale 0.97

**Numbers.**

- scale 0.97 (observed)
- in 120 ms ease-out (observed)
- out: spring, bounce 0.3 (recommended) — sampled to 550 ms
- overshoot 4.6% (derived)

**Why.** The response starts inside the 100 ms window in which an effect reads as caused by the touch. The small overshoot on release gives the control weight.

**Wire it.** `:active` covers pointer and touch. Mirror it with `[data-pressed]` for presses fired from the keyboard or from code, and clear the attribute on release.

**Reduced motion.** Duration 0 ms: the button changes state without moving.

```css
.m-press {
  min-height: 44px;
  padding: 0 28px;
  border: 0;
  border-radius: 999px;
  background: var(--m-accent, #6ee7b7);
  color: var(--m-on-accent, #0a2e21);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  /* release: spring back to rest */
  transition: transform 550ms linear(
    0, 0.028, 0.1, 0.199, 0.311, 0.427, 0.539, 0.642, 0.734, 0.813,
    0.878, 0.93, 0.97, 1, 1.021, 1.035, 1.043, 1.046, 1.045, 1.043,
    1.039, 1.034, 1.028, 1.023, 1.018, 1.014, 1.01, 1.007, 1.004, 1.002,
    1, 0.999, 0.999, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998, 1
  );
}
.m-press:active,
.m-press[data-pressed] {
  transform: scale(0.97);
  /* press: answer inside 120 ms */
  transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
}
@media (prefers-reduced-motion: reduce) {
  .m-press, .m-press:active { transition-duration: 0ms; }
}
```

```html
<button class="m-press" type="button">Continue</button>
```

## Draw the win

`success-check` · Feedback · Success state · ring 300 ms + tick 170 ms

**Numbers.**

- ring 300 ms (recommended)
- tick 170 ms, after the ring (recommended)
- `pathLength="1"` on both shapes, so one dash unit equals the whole stroke (verified)

**Why.** Drawing the mark in the order a hand would, ring and then tick, turns a state flag into a short moment of completion.

**Wire it.** Add `.is-done` when the server confirms; the two animations run on the class, in sequence, totalling 470 ms. Keep the mark in the DOM at rest, hidden by `stroke-dashoffset`.

**Reduced motion.** Both animations drop to 1 ms with no delay, so the mark appears complete and immediately.

```css
.m-check-demo { display: grid; justify-items: center; gap: 16px; }
.m-check {
  width: 60px; height: 60px;
  fill: none; stroke: var(--m-accent, #6ee7b7); stroke-width: 3;
  stroke-linecap: round; stroke-linejoin: round;
}
/* pathLength="1" on both shapes makes one dash equal the whole stroke. */
.m-check circle, .m-check path { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }
.m-check circle { transform: rotate(-90deg); transform-origin: center; }
.m-check.is-done circle { animation: m-draw 300ms cubic-bezier(0.65, 0, 0.35, 1) forwards; }
.m-check.is-done path { animation: m-draw 170ms cubic-bezier(0.23, 1, 0.32, 1) 300ms forwards; }
@keyframes m-draw {
  from { opacity: 1; }
  to { opacity: 1; stroke-dashoffset: 0; }
}
.m-check-trigger {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .m-check.is-done circle, .m-check.is-done path { animation-duration: 1ms; animation-delay: 0ms; }
}
```

```html
<div class="m-check-demo">
  <svg class="m-check" viewBox="0 0 52 52" role="img" aria-label="Done">
    <circle cx="26" cy="26" r="23" pathLength="1"></circle>
    <path d="M15 27l8 8 15-17" pathLength="1"></path>
  </svg>
  <button class="m-check-trigger" type="button">Confirm payment</button>
</div>
```

## Shake, don't shout

`error-shake` · Feedback · Validation · ±6 px, 400 ms

**Numbers.**

- x 6 px, three swings (recommended)
- 400 ms (recommended)
- error text required (verified): the shake never carries the message alone

**Why.** A horizontal shake borrows the gesture for no and points at the exact field that failed, without a modal.

**Wire it.** Set `aria-invalid="true"` and fill the live message. The animation hangs off the attribute, so a second failed submit on an already-invalid field will not replay: toggle a class off and on, or restart the animation, before re-setting it.

**Reduced motion.** No shake; the red border and the message still carry the error.

```css
.m-shake-form { display: grid; gap: 8px; width: min(280px, 100%); }
.m-shake-form label { font-size: 13px; color: var(--m-muted, #b4bdc9); }
.m-shake-row { display: flex; gap: 8px; }
.m-shake {
  flex: 1; min-width: 0; height: 44px; padding: 0 12px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 8px;
  background: var(--m-track, #0d1725); color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 15px;
  transition: border-color 150ms;
}
.m-shake-form button {
  min-height: 44px; padding: 0 16px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 8px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
.m-shake-msg { min-height: 20px; margin: 0; font-size: 13px; color: var(--m-danger, #ff8f85); }

.m-shake[aria-invalid="true"] {
  border-color: var(--m-danger, #ff8f85);
  animation: m-shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
@keyframes m-shake {
  10%, 90% { translate: -1px; }
  20%, 80% { translate: 2px; }
  30%, 50%, 70% { translate: -6px; }
  40%, 60% { translate: 6px; }
}
/* Without motion, the border colour and the message still carry the error. */
@media (prefers-reduced-motion: reduce) {
  .m-shake[aria-invalid="true"] { animation: none; }
}
```

```html
<form class="m-shake-form" novalidate>
  <label for="m-pin">Passcode</label>
  <div class="m-shake-row">
    <input class="m-shake" id="m-pin" type="password" inputmode="numeric" autocomplete="off" value="1234" aria-describedby="m-pin-error">
    <button type="submit">Unlock</button>
  </div>
  <p class="m-shake-msg" id="m-pin-error" role="alert"></p>
</form>
```
