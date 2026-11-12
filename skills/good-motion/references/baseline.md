# Baseline: the rules all six share

Everything below applies to every component in this skill. Read it once; each component file assumes it.

## Contents

- [Loading GSAP](#loading-gsap)
- [The mount contract](#the-mount-contract)
- [Ticker, tweens and quickTo](#ticker-tweens-and-quickto)
- [Portals and stacking contexts](#portals-and-stacking-contexts)
- [Pointer hygiene](#pointer-hygiene)
- [Reduced motion](#reduced-motion)
- [Performance budget](#performance-budget)
- [What "done" means](#what-done-means)

## Loading GSAP

One copy, one ticker. Either import it and pass it in:

```js
import { gsap } from 'gsap';
mountElasticTrailCursor({ gsap });
```

or load it globally and let the mounts read `window.gsap`. Never both. Two GSAP runtimes mean two `gsap.ticker` loops and plugins registered against the wrong one.

No plugin is required. These effects use core tweens, `quickTo`, `ticker` and CSS properties only; SplitText is deliberately avoided (the Y2K glow tokenises graphemes itself, which also handles CJK and emoji).

## The mount contract

Every function returns:

```js
{ element, destroy() }   // cursors: element is null on touch devices
```

- Call a mount from `useEffect`, `onMount`, or after the DOM node exists. Never during render.
- Call `destroy()` in cleanup. It removes the node, the listeners, the ticker callback, the injected stylesheet and the `cursor: none` class.
- A mount that throws must leave nothing behind. In `good-motion.js` the throw happens before insertion for that reason.
- Remounting is supported and expected: the preview page mounts and unmounts each effect dozens of times per session.

React:

```jsx
useEffect(() => {
  const effect = mountXRayText('X-RAY', { usePortal: true, mode: 'fixed', top: 96 });
  return () => effect.destroy();
}, []);
```

## Ticker, tweens and quickTo

| Need | Use | Why |
|:--|:--|:--|
| Continuous simulation (trail, shader, sweep) | `gsap.ticker.add(fn)`, `gsap.ticker.remove(fn)` | one rAF for the whole page |
| Entrance, collapse, hold | `gsap.timeline()` | seekable, killable, and `onComplete` is exact |
| Pointer-following position | `gsap.quickTo(el, 'x', {...})` | reuses one tween per property instead of allocating per event |

`gsap.ticker` hands you `(time, deltaTime)`. Normalise deltas before using them in physics, or the effect runs at double speed on a 120 Hz display:

```js
const update = (_time, deltaTime) => {
  const dt = Math.min(3, deltaTime / 16.666); // 1.0 at 60 fps
  // ...integrate by dt
};
```

The trail cursor also **sleeps**: after roughly 90 idle frames it removes its callback and re-adds it on the next `pointermove`. An idle page should cost zero animation frames.

## Portals and stacking contexts

Two components need to escape their parent: the loader (must cover the page) and X-RAY text (blending is blocked by isolation). Both append to `document.body`.

- `mix-blend-mode` only blends against the backdrop inside its stacking context. A parent with `transform`, `filter`, `opacity < 1`, `isolation: isolate` or `will-change` silently kills the effect. The portal wrapper uses `display: contents` so it does not create a context of its own.
- `position: fixed` inside a transformed ancestor behaves like `absolute`. The loader avoids this by living on `body`.
- Give overlays `aria-hidden="true"` and `pointer-events: none`; they are decoration, not interface.

## Pointer hygiene

- Check `matchMedia('(hover: none)').matches` and return a no-op controller. A custom cursor on a phone is a bug, not a feature.
- Never hide the native cursor globally without a way back. The shipped code adds a `gm-cursor-hidden` class plus one injected rule, and removes both on destroy:

```css
.gm-cursor-hidden, .gm-cursor-hidden * { cursor: none !important; }
```

- Leave the native cursor alone over `input`, `textarea` and `select` even on desktop: text selection needs the I-beam.
- `pointermove` listens with `{ passive: true }`. Never call `preventDefault` on move.

## Reduced motion

`prefers-reduced-motion: reduce` is not "no component". It is the same end state, reached without movement:

| Component | Reduce to |
|:--|:--|
| Circle Reveal Loader | covered immediately, plain 200 ms fade out, `onComplete` still fires |
| Googly / Elastic cursor | no movement, no blink; the lead dot may stay as a static accent |
| Y2K glow | static bloom, no sweep, no proximity scaling |
| X-RAY text | unchanged (no motion at all) |
| Text Distortion | static texture, shader time and force pinned to zero |

## Performance budget

- Transform, opacity, `clip-path` and shader uniforms only. If a property triggers layout, do not animate it.
- `will-change` on the two or three elements that actually move, never on a container of hundreds.
- The glow tokenises per grapheme and writes inline styles every frame. Under ~200 glyphs it is fine; for a paragraph, split into words instead of graphemes, or drop the per-frame update and use one CSS animation.
- The shader caps device pixel ratio at 2 and rasterises the text once per resize, not per frame.
- `clip-path` animation runs on the main thread in every current browser. A full-screen loader is fine; a grid of twenty is not.

## What "done" means

1. It runs on a 60 Hz laptop and a 120 Hz phone without speeding up.
2. Touch devices get the native experience.
3. `prefers-reduced-motion` produces a still, finished-looking page.
4. Mount, navigate away, mount again: no duplicate nodes, no leaked listeners.
5. A resize mid-animation does not strand the element off-screen or leave a half-drawn overlay.
6. `?selftest=1` in `assets/preview.html` still reports PASS for the component you touched.
