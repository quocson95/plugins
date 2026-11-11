# Data and loading

Numbers changing, waits being reported, content arriving. The rule in all four is that the interface never hides what it is doing.

Status marks: `verified` read from a standard, a spec or a vendor document; `observed` measured in a shipping library’s source; `derived` computed from a formula; `recommended` an editorial default where no primary source exists.

In this file: [Roll, don't jump](#roll-dont-jump), [Crawl, then finish](#crawl-then-finish), [Shimmer, then settle in place](#shimmer-then-settle-in-place), [Stagger, then stop](#stagger-then-stop).

## Roll, don't jump

`rolling-number` · Data and loading · Number change · spring 500 ms, bounce 0.15

**Numbers.**

- spring 500 ms, bounce 0.15 (recommended) — sampled over 650 ms
- digits 60 ms apart, rightmost first (recommended)
- overshoot 0.6% (derived)

**Why.** A rolling digit shows the direction and the size of the change, so the eye follows one number instead of re-reading a new one.

**Common mistake.** A column that only ever rolls up keeps rolling up while the value drops. The fix: the direction follows the sign of the change.

**Wire it.** One column per digit holding 0 to 9 in one strip. Set the strip with `transform: translateY(-{digit}0%)` — the strip is ten lines tall, so each digit is 10% — and stagger columns 60 ms from the right. Put the final formatted value on the group’s `aria-label` so screen readers get a number, not ten.

**Reduced motion.** No transition: the value swaps in place.

```css
.m-roll { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px 20px; }
.m-roll-label { grid-column: 1 / -1; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--m-muted, #b4bdc9); }
.m-roll-value { font-size: 40px; font-weight: 700; line-height: 1.1; color: var(--m-text, #f7f8f9); }
.m-roll-digits { display: inline-flex; font-variant-numeric: tabular-nums; }
.m-roll-col { display: inline-block; height: 1.1em; overflow: hidden; }
.m-roll-col > span {
  display: block;
  transition: transform 650ms linear(
    0, 0.014, 0.051, 0.104, 0.167, 0.236, 0.308, 0.38, 0.45, 0.516,
    0.579, 0.636, 0.688, 0.736, 0.778, 0.815, 0.847, 0.875, 0.899, 0.92,
    0.938, 0.952, 0.964, 0.974, 0.982, 0.989, 0.994, 0.998, 1.001, 1.003,
    1.004, 1.005, 1.006, 1.006, 1.006, 1.006, 1.006, 1.006, 1.005, 1.005,
    1.004, 1.004, 1.003, 1.003, 1.003, 1.002, 1
  );
}
.m-roll-add {
  min-height: 44px; padding: 0 16px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .m-roll-col > span { transition: none; }
}
```

```html
<div class="m-roll">
  <span class="m-roll-label">Total</span>
  <span class="m-roll-value">$
    <span class="m-roll-digits" role="img" aria-label="486">
      <span class="m-roll-col"><span style="transition-delay: 120ms; transform: translateY(-40%)">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>
      <span class="m-roll-col"><span style="transition-delay: 60ms; transform: translateY(-80%)">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>
      <span class="m-roll-col"><span style="transition-delay: 0ms; transform: translateY(-60%)">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>
    </span>
  </span>
  <button class="m-roll-add" type="button">+ $43</button>
</div>
```

## Crawl, then finish

`page-progress` · Data and loading · Loading · 8% start, 99.4% cap

**Numbers.**

- start at 8% (observed)
- step every 200 ms (observed)
- never past 99.4% (observed)
- show after 80 ms (observed), so fast navigations never flash the bar
- at 100%: hold 200 ms, then fade 200 ms

**Why.** The bar answers at once with a visible stub, and each step is smaller than the last, so the wait feels like it is closing even when the server is slow. It never claims to be finished before the page is.

**Wire it.** Grow with `scaleX`, not `width`. Each step covers a shrinking share of what is left; on completion jump to 1, hold, then fade. Keep `role="progressbar"` and its min/max; report the real value when you have one.

**Reduced motion.** Each step jumps instead of sliding (`steps(1, end)`); the bar still reports progress.

```css
.m-load { display: grid; justify-items: center; gap: 10px; width: min(300px, 100%); }
.m-load-frame {
  position: relative; width: 100%; height: 100px; overflow: hidden;
  border: 1px solid var(--m-line, #2f425c); border-radius: 10px;
  background: var(--m-surface, #16263a);
}
.m-load-bar {
  position: absolute; left: 0; top: 0; width: 100%; height: 3px;
  background: var(--m-accent, #6ee7b7);
  transform-origin: left; scale: 0 1; opacity: 0;
  /* each step moves in 200 ms, linear; the next one starts when it lands */
  transition: scale 200ms linear;
}
/* appear after 80 ms, so fast navigations never flash the bar */
.m-load-frame[data-state="loading"] .m-load-bar { opacity: 1; transition: scale 200ms linear, opacity 0s 80ms; }
/* at 100%: hold 200 ms, then fade over 200 ms */
.m-load-frame[data-state="done"] .m-load-bar { opacity: 0; transition: scale 200ms linear, opacity 200ms linear 200ms; }
.m-load-url {
  margin: 14px 12px 10px; padding: 3px 10px; border-radius: 999px;
  background: var(--m-track, #0d1725); color: var(--m-muted, #b4bdc9);
  font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.m-load-page { display: grid; gap: 7px; padding: 0 14px; transition: opacity 150ms; }
.m-load-page span { height: 7px; border-radius: 4px; background: var(--m-line, #2f425c); }
.m-load-page span:first-child { width: 50%; }
.m-load-page span:last-child { width: 75%; }
.m-load-frame[data-state="loading"] .m-load-page { opacity: 0.5; }
.m-load-go {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  /* the bar still reports progress; each step jumps instead of sliding */
  .m-load-bar, .m-load-frame[data-state] .m-load-bar { transition-timing-function: steps(1, end); }
}
```

```html
<div class="m-load">
  <div class="m-load-frame">
    <div class="m-load-bar" role="progressbar" aria-label="Page loading" aria-valuemin="0" aria-valuemax="100"></div>
    <div class="m-load-url">example.com/pricing</div>
    <div class="m-load-page" aria-hidden="true"><span></span><span></span><span></span></div>
  </div>
  <button class="m-load-go" type="button">Open page</button>
</div>
```

## Shimmer, then settle in place

`skeleton` · Data and loading · Loading · 1.5 s sweep

**Numbers.**

- sweep 1.5 s, ease-in-out, infinite (observed)
- fade in 200 ms (recommended)
- same-size blocks as the real content (recommended)

**Why.** Blocks the size of the real content show what is coming and where, and the layout does not jump when it arrives. The slow sweep shows the wait is alive without pulling the eye.

**Wire it.** `aria-busy` on the container drives everything: bones get the shimmer, the real text stays in the DOM but hidden, and the reveal runs on the false state. Size bones from the text they stand for.

**Reduced motion.** No shimmer; no reveal animation. The content simply appears.

```css
.m-skel { display: grid; justify-items: center; gap: 14px; width: min(270px, 100%); }
.m-skel-card {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 12px;
  background: var(--m-surface, #16263a);
}
.m-skel-lines { display: grid; justify-items: start; gap: 6px; min-width: 0; }
.m-bone { position: relative; overflow: hidden; border-radius: 6px; }
.m-skel-avatar {
  display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%;
  background: var(--m-accent, #6ee7b7); color: var(--m-on-accent, #0a2e21); font-size: 13px; font-weight: 700;
}
.m-skel-name { font-size: 14px; font-weight: 600; color: var(--m-text, #f7f8f9); white-space: nowrap; }
.m-skel-meta { font-size: 12px; color: var(--m-muted, #b4bdc9); white-space: nowrap; }
/* Loading: each block keeps the size of the text it stands for, so nothing shifts when it arrives. */
.m-skel[aria-busy="true"] .m-bone { background: var(--m-line, #2f425c); }
.m-skel[aria-busy="true"] .m-bone > span { visibility: hidden; }
.m-skel[aria-busy="true"] .m-bone::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, var(--m-shine, rgb(255 255 255 / 0.14)), transparent);
  translate: -100% 0;
  animation: m-shimmer 1.5s ease-in-out infinite;
}
@keyframes m-shimmer { to { translate: 100% 0; } }
/* Loaded: the content fades in where the blocks were. */
.m-skel[aria-busy="false"] .m-bone { animation: m-reveal 200ms cubic-bezier(0.23, 1, 0.32, 1); }
@keyframes m-reveal { from { opacity: 0; } }
.m-skel-reload {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .m-skel[aria-busy="true"] .m-bone::after { display: none; }
  .m-skel[aria-busy="false"] .m-bone { animation: none; }
}
```

```html
<div class="m-skel" aria-busy="false">
  <div class="m-skel-card">
    <span class="m-bone m-skel-avatar"><span>AL</span></span>
    <span class="m-skel-lines">
      <span class="m-bone m-skel-name"><span>Ada Lovelace</span></span>
      <span class="m-bone m-skel-meta"><span>Wrote the first program</span></span>
    </span>
  </div>
  <button class="m-skel-reload" type="button">Reload</button>
</div>
```

## Stagger, then stop

`list-stagger` · Data and loading · Lists · 50 ms apart, capped at 5

**Numbers.**

- 50 ms apart (recommended)
- 250 ms each (recommended)
- delay capped at 5 steps (recommended)
- filepond: 75 ms apart (observed)

**Why.** A short stagger lets the eye read the list top to bottom as it arrives. The cap stops a long list from making people wait for the last row.

**Common mistake.** At 0 ms apart a drop of four files lands as one block. At 75 ms apart the last item of four spawns 225 ms after the first, and the drop reads as a sequence.

**Wire it.** Set `--i` per item in DOM order. `calc(min(var(--i), 5) * 50ms)` gives the cap without JS. Animation runs on insert, so a re-render replays it.

**Reduced motion.** No animation; items are present immediately.

```css
.m-list-demo { display: flex; align-items: center; gap: 14px; width: min(330px, 100%); }
.m-list { display: grid; gap: 6px; flex: 1; min-width: 0; margin: 0; padding: 0; list-style: none; }
.m-list-item {
  height: 28px; padding: 0 10px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 8px;
  background: var(--m-surface, #16263a); color: var(--m-text, #f7f8f9);
  font-size: 12px; line-height: 26px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  /* 50 ms apart; from the sixth item on, the rest arrive together */
  animation: m-rise 250ms cubic-bezier(0.23, 1, 0.32, 1) calc(min(var(--i, 0), 5) * 50ms) both;
}
.m-list-item::before {
  content: ""; display: inline-block; width: 6px; height: 6px; margin-right: 8px;
  border-radius: 50%; background: var(--m-accent, #6ee7b7); vertical-align: 1px;
}
@keyframes m-rise { from { opacity: 0; translate: 0 8px; } }
.m-list-load {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .m-list-item { animation: none; }
}
```

```html
<div class="m-list-demo">
  <ul class="m-list" aria-live="polite">
    <li class="m-list-item" style="--i: 0">Design review moved</li>
    <li class="m-list-item" style="--i: 1">Invoice 2048 paid</li>
    <li class="m-list-item" style="--i: 2">New comment on Brief</li>
    <li class="m-list-item" style="--i: 3">Build 412 passed</li>
  </ul>
  <button class="m-list-load" type="button">Load</button>
</div>
```
