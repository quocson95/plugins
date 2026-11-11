# Controls

The parts a person operates directly: a switch, a selection, an expansion, an icon that changes meaning.

Status marks: `verified` read from a standard, a spec or a vendor document; `observed` measured in a shipping library’s source; `derived` computed from a formula; `recommended` an editorial default where no primary source exists.

In this file: [Stretch, then glide](#stretch-then-glide), [Slide the pill, don't swap](#slide-the-pill-dont-swap), [Fast, then slow](#fast-then-slow), [Meet, then turn](#meet-then-turn).

## Stretch, then glide

`switch-toggle` · Controls · Toggles · thumb 150 ms

**Numbers.**

- thumb 150 ms, cubic-bezier(0.4, 0, 0.2, 1) (observed)
- press 100 ms (observed)
- stretch 1.25× toward the side it will travel (recommended)
- travel 24 px: 56 − 2 × 3 − 26 (derived from the box)

**Why.** The stretch answers the finger before the state changes, so the switch feels physical. Thumb and track change together, so the state reads at a glance.

**Wire it.** `role="switch"` with `aria-checked`; the track and thumb animate off that attribute. Mirror `:active` with `[data-pressed]` for keyboard activation. Keep the 44 px touch target even though the track is 56 × 32.

**Reduced motion.** No transitions; the thumb jumps to the far side and the track changes colour.

```css
.m-switch-row {
  display: flex; align-items: center; gap: 14px; padding: 6px 8px 6px 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 14px;
  background: var(--m-surface, #16263a);
}
.m-switch-label { font-size: 15px; font-weight: 600; color: var(--m-text, #f7f8f9); white-space: nowrap; }
.m-switch {
  /* a 56 x 32 track inside a 68 x 44 touch target: the border is transparent and the background stops at it */
  flex: none; width: 68px; height: 44px; padding: 3px;
  border: 6px solid transparent; border-radius: 999px;
  background: var(--m-line, #2f425c); background-clip: padding-box;
  cursor: pointer; touch-action: manipulation;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.m-switch[aria-checked="true"] { background: var(--m-accent, #6ee7b7); }
.m-switch-thumb {
  display: block; width: 26px; height: 26px; border-radius: 999px;
  background: var(--m-text, #f7f8f9);
  /* travel = 56 - 2 * 3 - 26 = 24 px; thumb and track move together */
  transition: translate 150ms cubic-bezier(0.4, 0, 0.2, 1),
    scale 150ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.m-switch[aria-checked="true"] .m-switch-thumb { translate: 24px 0; background: var(--m-on-accent, #0a2e21); }
/* Press: the thumb stretches 25% toward the side it will travel to, in 100 ms. */
.m-switch:active .m-switch-thumb,
.m-switch[data-pressed] .m-switch-thumb { scale: 1.25 1; translate: 3.25px 0; transition-duration: 100ms; }
.m-switch[aria-checked="true"]:active .m-switch-thumb,
.m-switch[aria-checked="true"][data-pressed] .m-switch-thumb { translate: 20.75px 0; }
@media (prefers-reduced-motion: reduce) {
  .m-switch, .m-switch-thumb { transition: none; }
  .m-switch:active .m-switch-thumb, .m-switch[data-pressed] .m-switch-thumb { scale: none; translate: none; }
  .m-switch[aria-checked="true"]:active .m-switch-thumb,
  .m-switch[aria-checked="true"][data-pressed] .m-switch-thumb { translate: 24px 0; }
}
```

```html
<div class="m-switch-row">
  <span class="m-switch-label" id="m-switch-label">Notifications</span>
  <button class="m-switch" type="button" role="switch" aria-checked="false" aria-labelledby="m-switch-label">
    <span class="m-switch-thumb"></span>
  </button>
</div>
```

## Slide the pill, don't swap

`tab-indicator` · Controls · Selection · spring 300 ms, bounce 0.15

**Numbers.**

- spring 300 ms, bounce 0.15 (recommended) — sampled over 390 ms
- overshoot 0.6% (derived)
- one shared pill, never destroyed (observed)

**Why.** One element travelling between options shows that the selection moved, instead of one thing dying while another appears.

**Wire it.** One absolutely positioned pill. On select, write `--x` and `--w` from the chosen button’s `offsetLeft` and `offsetWidth`; recompute on resize and on font load. Keep the pill under the labels with `isolation: isolate`.

**Reduced motion.** No transition: the pill moves in the same frame as the label.

```css
.m-tabs {
  position: relative; isolation: isolate;
  display: inline-flex; padding: 4px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: var(--m-track, #0d1725);
}
.m-tabs button {
  position: relative; z-index: 1;
  min-height: 40px; padding: 0 14px;
  border: 0; border-radius: 999px; background: none;
  color: var(--m-muted, #b4bdc9);
  font: inherit; font-size: 13px; white-space: nowrap; cursor: pointer;
  transition: color 150ms;
}
.m-tabs button[aria-pressed="true"] { color: var(--m-text, #f7f8f9); }
/* One pill travels between the options; it is never destroyed and recreated. */
.m-tabs-pill {
  position: absolute; z-index: 0; top: 4px; bottom: 4px; left: 0;
  width: var(--w, 0px);
  translate: var(--x, 0px) 0;
  border-radius: 999px;
  background: var(--m-surface, #16263a);
  transition: translate 390ms linear(
    0, 0.036, 0.121, 0.231, 0.349, 0.464, 0.57, 0.663, 0.742, 0.807,
    0.86, 0.901, 0.933, 0.957, 0.974, 0.986, 0.995, 1, 1.004, 1.005,
    1.006, 1.006, 1.006, 1.005, 1.004, 1.004, 1.003, 1.002, 1
  ),
    width 390ms linear(
    0, 0.036, 0.121, 0.231, 0.349, 0.464, 0.57, 0.663, 0.742, 0.807,
    0.86, 0.901, 0.933, 0.957, 0.974, 0.986, 0.995, 1, 1.004, 1.005,
    1.006, 1.006, 1.006, 1.005, 1.004, 1.004, 1.003, 1.002, 1
  );
}
@media (prefers-reduced-motion: reduce) {
  .m-tabs-pill, .m-tabs button { transition: none; }
}
```

```html
<div class="m-tabs" role="group" aria-label="View">
  <button type="button" aria-pressed="true">Overview</button>
  <button type="button" aria-pressed="false">Activity</button>
  <button type="button" aria-pressed="false">Settings</button>
  <span class="m-tabs-pill" aria-hidden="true"></span>
</div>
```

## Fast, then slow

`accordion` · Controls · Expand and collapse · 0fr → 1fr, 300 ms

**Numbers.**

- rows 0fr to 1fr (verified): the browser supplies the real height
- 300 ms (observed)
- ease-out 0.23, 1, 0.32, 1 (observed)

**Why.** Ease-out spends its speed first, so the panel answers the click at once and settles gently. Animating the grid row lets the browser supply the real height.

**Wire it.** `aria-expanded` on the trigger, panel as its next sibling. The inner wrapper holds `overflow: hidden` and flips `visibility` after the transition, so collapsed content is not focusable.

**Reduced motion.** No row transition; visibility flips at once.

```css
.m-acc { width: min(300px, 100%); border: 1px solid var(--m-line, #2f425c); border-radius: 10px; background: var(--m-surface, #16263a); color: var(--m-text, #f7f8f9); }
.m-acc-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; min-height: 48px; padding: 0 14px;
  border: 0; background: none; color: inherit;
  font: inherit; font-size: 14px; font-weight: 600; text-align: left; cursor: pointer;
}
.m-acc-trigger svg {
  width: 18px; height: 18px; flex: none;
  fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  transition: rotate 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.m-acc-trigger[aria-expanded="true"] svg { rotate: 180deg; }

/* The row animates from 0fr to 1fr, so the browser finds the real height. */
.m-acc-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.m-acc-trigger[aria-expanded="true"] + .m-acc-panel { grid-template-rows: 1fr; }
.m-acc-inner { overflow: hidden; visibility: hidden; transition: visibility 0s 300ms; }
.m-acc-trigger[aria-expanded="true"] + .m-acc-panel .m-acc-inner { visibility: visible; transition-delay: 0s; }
.m-acc-inner p { margin: 0; padding: 0 14px 14px; font-size: 13px; line-height: 1.5; color: var(--m-muted, #b4bdc9); }

@media (prefers-reduced-motion: reduce) {
  .m-acc-panel, .m-acc-trigger svg { transition-duration: 0ms; }
  .m-acc-inner { transition-delay: 0s; }
}
```

```html
<div class="m-acc">
  <button class="m-acc-trigger" type="button" aria-expanded="false" aria-controls="m-acc-panel">Shipping and returns
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
  </button>
  <div class="m-acc-panel" id="m-acc-panel" role="region">
    <div class="m-acc-inner"><p>Free delivery in 2 to 4 days. Returns are free for 30 days.</p></div>
  </div>
</div>
```

## Meet, then turn

`menu-icon` · Controls · Icon morph · 150 + 150 ms

**Numbers.**

- 150 + 150 ms (recommended): meet, then turn
- ease-in-out 0.65, 0, 0.35, 1 (recommended)
- close in reverse order (recommended)
- `aria-expanded` on the button (verified)

**Why.** Two separate moves let the eye follow each line, so the close icon reads as the same three lines rather than a swap. Reversing the order on close keeps it symmetrical.

**Wire it.** Three spans stacked in one grid cell. The transition-delay on `translate` (150 ms) is what sequences the two halves; the close state swaps which property leads.

**Reduced motion.** No transition; the icon swaps instantly.

```css
.m-burger {
  display: grid; place-items: center; width: 72px; height: 72px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 20px;
  background: var(--m-surface, #16263a); cursor: pointer; touch-action: manipulation;
}
.m-burger span {
  grid-area: 1 / 1; width: 30px; height: 3px; border-radius: 2px;
  background: var(--m-text, #f7f8f9);
  /* closing: turn back first, then spread */
  transition: rotate 150ms cubic-bezier(0.65, 0, 0.35, 1),
    translate 150ms cubic-bezier(0.65, 0, 0.35, 1) 150ms,
    opacity 0s 150ms;
}
.m-burger span:nth-child(1) { translate: 0 -9px; }
.m-burger span:nth-child(3) { translate: 0 9px; }
/* opening: meet in the middle first, then turn */
.m-burger[aria-expanded="true"] span {
  translate: 0 0;
  transition: translate 150ms cubic-bezier(0.65, 0, 0.35, 1),
    rotate 150ms cubic-bezier(0.65, 0, 0.35, 1) 150ms,
    opacity 0s 150ms;
}
.m-burger[aria-expanded="true"] span:nth-child(1) { rotate: 45deg; }
.m-burger[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
.m-burger[aria-expanded="true"] span:nth-child(3) { rotate: -45deg; }
@media (prefers-reduced-motion: reduce) {
  .m-burger span, .m-burger[aria-expanded="true"] span { transition: none; }
}
```

```html
<button class="m-burger" type="button" aria-expanded="false" aria-label="Menu">
  <span></span>
  <span></span>
  <span></span>
</button>
```
