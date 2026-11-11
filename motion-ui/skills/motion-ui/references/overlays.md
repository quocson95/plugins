# Overlays

Things that arrive over the page: tooltips, toasts, menus. Each one needs an origin, a delay and a shorter exit.

Status marks: `verified` read from a standard, a spec or a vendor document; `observed` measured in a shipping library’s source; `derived` computed from a formula; `recommended` an editorial default where no primary source exists.

In this file: [Wait once, then follow](#wait-once-then-follow), [Slide in, step back](#slide-in-step-back), [Grow, don't pop](#grow-dont-pop).

## Wait once, then follow

`tooltip-delay` · Overlays · Tooltips · 600 ms wait, 300 ms skip

**Numbers.**

- open after 600 ms (observed)
- skip window 300 ms (observed)
- in 150 ms from scale 0.95 (observed)
- out 100 ms (recommended)

**Why.** The delay keeps tooltips from flashing while the pointer crosses the toolbar on its way somewhere else. Once a person is reading tooltips, the skip window makes the next one answer at once.

**Common mistake.** At 0 ms delay, a sweep across five buttons flashes five tooltips. The fix: open after 700 ms of rest, then open at once while the previous one closed under 300 ms ago.

**Wire it.** No JS timer: the 600 ms lives in a `transition-delay`, so leaving the trigger cancels it. Set `[data-instant]` on the toolbar for 300 ms after a close. Open on keyboard focus without the delay.

**Reduced motion.** Opacity only: the scale is dropped, the timing stays.

```css
.m-tips {
  display: inline-flex; gap: 4px; margin-top: 40px; padding: 4px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 12px;
  background: var(--m-surface, #16263a);
}
.m-tip-wrap { position: relative; }
.m-tip-trigger {
  width: 44px; height: 44px; border: 0; border-radius: 8px; background: none;
  color: var(--m-text, #f7f8f9); font: inherit; font-size: 17px; cursor: pointer;
  transition: background-color 120ms;
}
.m-tip-trigger:hover, .m-tip-trigger[data-open] { background: var(--m-track, #0d1725); }
.m-tip {
  position: absolute; left: 50%; bottom: calc(100% + 8px);
  padding: 5px 9px; border-radius: 6px;
  background: var(--m-text, #f7f8f9); color: var(--m-track, #0d1725);
  font-size: 12px; font-weight: 600; line-height: 1.4; white-space: nowrap; pointer-events: none;
  translate: -50% 0; transform-origin: 50% 100%; /* grows from the edge nearest the button */
  opacity: 0; scale: 0.95; visibility: hidden;
  /* closing: no delay, shorter than the entrance */
  transition: opacity 100ms cubic-bezier(0.4, 0, 1, 1), scale 100ms cubic-bezier(0.4, 0, 1, 1), visibility 0s 100ms;
}
/* Opening waits 600 ms. The delay lives in the transition, so it can be cancelled by leaving. */
.m-tip-trigger[data-open] + .m-tip {
  opacity: 1; scale: 1; visibility: visible;
  transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1) 600ms,
    scale 150ms cubic-bezier(0.23, 1, 0.32, 1) 600ms, visibility 0s 600ms;
}
/* Inside the skip window the next tooltip opens without the wait. */
.m-tips[data-instant] .m-tip-trigger[data-open] + .m-tip { transition-delay: 0s; }
@media (prefers-reduced-motion: reduce) {
  .m-tip, .m-tip-trigger[data-open] + .m-tip { scale: none; transition-property: opacity, visibility; }
}
```

```html
<div class="m-tips" role="toolbar" aria-label="Text style">
  <span class="m-tip-wrap">
    <button class="m-tip-trigger" type="button" aria-labelledby="m-tip-bold"><b>B</b></button>
    <span class="m-tip" id="m-tip-bold" role="tooltip">Bold</span>
  </span>
  <span class="m-tip-wrap">
    <button class="m-tip-trigger" type="button" aria-labelledby="m-tip-italic"><i>I</i></button>
    <span class="m-tip" id="m-tip-italic" role="tooltip">Italic</span>
  </span>
  <span class="m-tip-wrap">
    <button class="m-tip-trigger" type="button" aria-labelledby="m-tip-under"><u>U</u></button>
    <span class="m-tip" id="m-tip-under" role="tooltip">Underline</span>
  </span>
</div>
```

## Slide in, step back

`toast-stack` · Overlays · Toasts · 400 ms in, 200 ms out

**Numbers.**

- y 100% → 0, 400 ms (observed)
- older toasts: −10 px and scale −0.05 each (observed)
- exit 200 ms (recommended)
- `@starting-style` (verified) for the entry state

**Why.** The new toast enters from the edge it lives on. Older ones step back instead of vanishing, so nothing disappears without being seen to go.

**Wire it.** Newest toast gets `--depth: 0`; each older one increments it, and the CSS derives the offset and scale. Set `[data-leaving]`, then remove the node after 200 ms. `aria-live="polite"` on the list, not on each toast.

**Reduced motion.** Opacity only, 150 ms; no rise, no step back.

```css
.m-toast-add {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
.m-toasts { position: fixed; right: 16px; bottom: 16px; width: 200px; margin: 0; padding: 0; list-style: none; }
.m-toast {
  --depth: 0; /* 0 is the newest toast */
  position: absolute; right: 0; bottom: 0; width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 10px;
  background: var(--m-surface, #16263a); color: var(--m-text, #f7f8f9);
  font-size: 13px; white-space: nowrap;
  transform: translateY(calc(var(--depth) * -10px)) scale(calc(1 - var(--depth) * 0.05));
  transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1), opacity 400ms cubic-bezier(0.23, 1, 0.32, 1);
}
/* Entry state: where a toast comes from when it is inserted. */
@starting-style {
  .m-toast { transform: translateY(100%); opacity: 0; }
}
.m-toast[data-leaving] { opacity: 0; transition-duration: 200ms; }
@media (prefers-reduced-motion: reduce) {
  .m-toast { transition: opacity 150ms; }
  @starting-style { .m-toast { transform: none; opacity: 0; } }
}
```

```html
<button class="m-toast-add" type="button">Save changes</button>
<ol class="m-toasts" aria-live="polite"></ol>
```

## Grow, don't pop

`menu-origin` · Overlays · Menus and popovers · 0.9 → 1

**Numbers.**

- scale 0.9 to 1 (observed)
- enter 220 ms (observed)
- exit 150 ms (observed)
- origin: the trigger (observed)

**Why.** Growing out of the trigger shows where the menu came from and where it will return. A shorter exit keeps the next action from waiting.

**Common mistake.** Scaling from 0 makes the menu pop out of a point. Scaling from 0.9 with the same fade and the same 400 ms makes it grow out of the trigger.

**Wire it.** `aria-expanded` on the trigger, menu as the next sibling, `transform-origin` at the corner nearest the trigger. On pointer, focus the first item; on Escape, return focus to the trigger.

**Reduced motion.** No transform; the menu fades in 120 ms.

```css
.m-menu-wrap { position: relative; }
.m-menu-trigger {
  min-height: 44px; padding: 0 18px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 999px;
  background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 14px; white-space: nowrap; cursor: pointer;
}
.m-menu {
  position: absolute; top: calc(100% + 6px); left: 0;
  min-width: 168px; padding: 4px;
  border: 1px solid var(--m-line, #2f425c); border-radius: 10px;
  background: var(--m-surface, #16263a);
  transform-origin: top left;       /* the corner nearest the trigger */
  opacity: 0; transform: scale(0.9); visibility: hidden;
  /* closing: shorter, accelerating */
  transition: opacity 150ms cubic-bezier(0.4, 0, 1, 1), transform 150ms cubic-bezier(0.4, 0, 1, 1), visibility 0s 150ms;
}
.m-menu-trigger[aria-expanded="true"] + .m-menu {
  opacity: 1; transform: scale(1); visibility: visible;
  /* opening: decelerating */
  transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1), visibility 0s;
}
.m-menu button {
  display: block; width: 100%; min-height: 36px; padding: 0 10px;
  border: 0; border-radius: 6px; background: none; color: var(--m-text, #f7f8f9);
  font: inherit; font-size: 13px; text-align: left; white-space: nowrap; cursor: pointer;
}
.m-menu button:hover { background: var(--m-track, #0d1725); }
@media (prefers-reduced-motion: reduce) {
  .m-menu, .m-menu-trigger[aria-expanded="true"] + .m-menu { transform: none; transition: opacity 120ms, visibility 0s; }
}
```

```html
<div class="m-menu-wrap">
  <button class="m-menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="m-menu">Options</button>
  <div class="m-menu" id="m-menu" role="menu">
    <button type="button" role="menuitem">Rename</button>
    <button type="button" role="menuitem">Duplicate</button>
    <button type="button" role="menuitem">Archive</button>
  </div>
</div>
```
