# Gestures

Motion the hand owns. While the finger is down the element follows it 1:1; only the release animates.

Status marks: `verified` read from a standard, a spec or a vendor document; `observed` measured in a shipping library’s source; `derived` computed from a formula; `recommended` an editorial default where no primary source exists.

In this file: [Follow, then snap](#follow-then-snap), [Past the line, let go](#past-the-line-let-go), [Resist the pull](#resist-the-pull).

## Follow, then snap

`bottom-sheet` · Gestures · Drawers · settle 500 ms, flick 0.4 px/ms

**Numbers.**

- settle 500 ms, cubic-bezier(0.32, 0.72, 0, 1) (observed)
- flick 0.4 px/ms (observed)
- else the nearest snap point (recommended)

**Why.** The sheet stays under the finger, so it feels like an object rather than a page. Deciding by velocity as well as distance lets a short flick do what a long drag does.

**Wire it.** During the drag the translation follows the pointer with no transition. On release, decide first: past 0.4 px/ms go to the next snap in the flick direction, otherwise the nearest one. Then add `.is-settling` and write that translation in the same frame, so the transition has a start and an end. Remove the class on `transitionend`, or the next drag lags.

**Reduced motion.** The release transition drops to 0 ms: the sheet is at its snap point at once.

```css
.m-sheet-frame {
  position: relative; width: min(260px, 100%); height: 150px; overflow: hidden;
  border: 1px solid var(--m-line, #2f425c); border-radius: 18px;
  background: var(--m-track, #0d1725);
}
.m-sheet-page { display: grid; gap: 8px; padding: 16px; }
.m-sheet-page span { height: 8px; border-radius: 4px; background: var(--m-line, #2f425c); }
.m-sheet-page span:nth-child(2) { width: 70%; }
.m-sheet-page span:nth-child(3) { width: 45%; }
.m-sheet-scrim { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
.m-sheet {
  position: absolute; left: 0; right: 0; top: 0; height: 140px;
  padding: 0 16px 16px;
  border-top: 1px solid var(--m-line, #2f425c); border-radius: 16px 16px 0 0;
  background: var(--m-surface, #16263a);
  translate: 0 98px; /* the peek snap point */
  cursor: grab; touch-action: none; user-select: none;
}
.m-sheet-handle { position: relative; display: block; width: 100%; height: 44px; margin-bottom: -16px; padding: 0; border: 0; background: none; cursor: inherit; }
.m-sheet-handle::before {
  content: ""; position: absolute; left: 50%; top: 10px;
  width: 36px; height: 4px; margin-left: -18px; border-radius: 2px;
  background: var(--m-muted, #b4bdc9);
}
.m-sheet-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--m-text, #f7f8f9); }
.m-sheet-body p { margin: 2px 0 12px; font-size: 12px; color: var(--m-muted, #b4bdc9); }
.m-sheet-body span { display: block; height: 8px; margin-top: 8px; border-radius: 4px; background: var(--m-line, #2f425c); }
.m-sheet-body span + span { width: 60%; }
/* Only the release animates. During the drag the sheet follows the finger 1:1. */
.m-sheet-frame.is-settling .m-sheet { transition: translate 500ms cubic-bezier(0.32, 0.72, 0, 1); }
.m-sheet-frame.is-settling .m-sheet-scrim { transition: opacity 500ms cubic-bezier(0.32, 0.72, 0, 1); }
@media (prefers-reduced-motion: reduce) {
  .m-sheet-frame.is-settling .m-sheet, .m-sheet-frame.is-settling .m-sheet-scrim { transition-duration: 0ms; }
}
```

```html
<div class="m-sheet-frame">
  <div class="m-sheet-page" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="m-sheet-scrim"></div>
  <section class="m-sheet" aria-labelledby="m-sheet-title">
    <button class="m-sheet-handle" type="button" aria-expanded="false" aria-controls="m-sheet-body" aria-labelledby="m-sheet-title"></button>
    <p class="m-sheet-title" id="m-sheet-title">Route details</p>
    <div class="m-sheet-body" id="m-sheet-body"><p>3 stops, 24 min</p><span></span><span></span></div>
  </section>
</div>
```

## Past the line, let go

`swipe-dismiss` · Gestures · Swipe · 45 px or 0.11 px/ms

**Numbers.**

- 45 px or 0.11 px/ms (observed)
- out 200 ms ease-out (observed)
- the gap closes 200 ms after the row leaves (recommended)
- a visible dismiss button too (recommended)

**Why.** The row stays under the finger, so the gesture feels like sliding a card off the table. Accepting a short fast flick as well as a long drag matches how people actually swipe.

**Wire it.** Track horizontal distance on pointermove with `touch-action: pan-y`; below the threshold spring back over 300 ms. Past it, add `.is-gone`: the row slides out 200 ms, then the row collapses over the next 200 ms via `grid-template-rows`. Keep the close button for anyone who cannot swipe, and a restore path for mistakes.

**Reduced motion.** No transitions; the row disappears and the gap closes at once.

```css
.m-swipe { display: grid; justify-items: center; gap: 8px; width: min(300px, 100%); }
.m-swipe-list { width: 100%; margin: 0; padding: 0; list-style: none; }
.m-swipe-item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 200ms cubic-bezier(0.23, 1, 0.32, 1); }
.m-swipe-clip { min-height: 0; overflow: hidden; }
.m-swipe-row {
  display: flex; align-items: center; gap: 4px; height: 46px; margin-bottom: 6px; padding-left: 14px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 10px;
  background: var(--m-surface, #16263a); color: var(--m-text, #f7f8f9); font-size: 13px;
  cursor: grab; touch-action: pan-y; user-select: none;
  transition: translate 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.m-swipe-row span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-swipe-row[data-swiping] { transition: none; cursor: grabbing; }
.m-swipe-x {
  display: grid; place-items: center; flex: none; width: 44px; height: 44px;
  border: 0; border-radius: 8px; background: none; color: var(--m-muted, #b4bdc9); cursor: pointer;
}
.m-swipe-x svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
/* Dismissed: slide out in 200 ms, then close the gap. */
.m-swipe-item.is-gone { grid-template-rows: 0fr; transition-delay: 200ms; }
.m-swipe-item.is-gone .m-swipe-row {
  translate: -110% 0; opacity: 0;
  transition: translate 200ms ease-out, opacity 200ms ease-out;
}
.m-swipe-reset {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
.m-swipe-reset:disabled { opacity: 0.45; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .m-swipe-item, .m-swipe-row, .m-swipe-item.is-gone .m-swipe-row { transition-duration: 0ms; transition-delay: 0ms; }
}
```

```html
<div class="m-swipe">
  <ul class="m-swipe-list">
    <li class="m-swipe-item">
      <div class="m-swipe-clip">
        <div class="m-swipe-row">
          <span>Lin: can you check the brief?</span>
          <button class="m-swipe-x" type="button" aria-label="Dismiss">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
          </button>
        </div>
      </div>
    </li>
    <li class="m-swipe-item">
      <div class="m-swipe-clip">
        <div class="m-swipe-row">
          <span>Build 412 passed</span>
          <button class="m-swipe-x" type="button" aria-label="Dismiss">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
          </button>
        </div>
      </div>
    </li>
  </ul>
  <button class="m-swipe-reset" type="button" disabled>Restore</button>
</div>
```

## Resist the pull

`rubber-band` · Gestures · Drag gesture · c = 0.55

**Numbers.**

- c = 0.55 (observed)
- pull the full limit and the content moves 35% of it (derived)
- return 590 ms, no bounce (recommended)

**Why.** Movement that slows against the finger signals a boundary without a hard stop, so the content still feels attached to the hand.

**Wire it.** While the finger is down, translate by a damped fraction of the pointer delta that shrinks as the pull grows; never let the resistance go negative. On release, remove the inline transform, add `.is-released` for the return, and clear it on `transitionend`.

**Reduced motion.** No return transition: the content is back at rest immediately.

```css
.m-band {
  display: grid; gap: 8px; width: min(260px, 100%); padding: 14px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 10px;
  background: var(--m-surface, #16263a);
  cursor: grab; user-select: none; touch-action: none;
}
.m-band span { height: 10px; border-radius: 5px; background: var(--m-line, #2f425c); }
.m-band span + span { width: 60%; }
.m-band p { margin: 0; font-size: 12px; color: var(--m-muted, #b4bdc9); }
/* Only the return is animated. While the finger is down the content follows it. */
.m-band.is-released {
  transition: transform 590ms linear(
    0, 0.021, 0.072, 0.142, 0.22, 0.301, 0.38, 0.455, 0.525, 0.588,
    0.645, 0.695, 0.74, 0.778, 0.812, 0.841, 0.866, 0.887, 0.905, 0.92,
    0.933, 0.944, 0.954, 0.961, 0.968, 0.973, 0.978, 0.982, 0.985, 0.987,
    0.99, 0.991, 0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998,
    0.999, 0.999, 1
  );
}
@media (prefers-reduced-motion: reduce) {
  .m-band.is-released { transition: none; }
}
```

```html
<div class="m-band"><span></span><span></span><p>Drag down</p></div>
```
