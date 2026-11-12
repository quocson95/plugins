# Circle Reveal Loader

Source: https://goodmotion.vercel.app/section/circle-reveal-loader

Category: Loading screen. Tags: GSAP, Loading, Page Transition, Reveal, Mask, Clip Path.

Three solid layers ripple out from the centre of the viewport, cover the page in sequence, hold, then collapse back to the centre. The page is revealed by a closing circle rather than a fade. Reads as a shutter: deliberate, physical, and short enough to sit in front of real content.

## Contents

- [Beat sheet](#beat-sheet)
- [Published API](#published-api)
- [How it is built](#how-it-is-built)
- [Profiles](#profiles)
- [Wiring it to a route change](#wiring-it-to-a-route-change)
- [Pitfalls](#pitfalls)
- [Acceptance](#acceptance)

## Beat sheet

| Beat | What happens | Numbers |
|:--|:--|:--|
| 1. Cover | Layer 1 (outer) expands from `circle(0)` at centre to `circle(0.55 × viewport diagonal)` | 0.85 s, `power3.inOut`, starts at 0 |
| 2. Overlap | Layer 2 starts before layer 1 lands | +0.58 s |
| 3. Overlap | Layer 3 (inner, the colour that holds) starts | +1.16 s |
| 4. Hold | Screen is flat colour | 300 ms default |
| 5. Collapse | Layer 3 → 2 → 1 shrink back to the centre, page appears from the middle out | 0.68 s each, staggered 0.29 s |
| 6. Cleanup | Node removed, `onComplete()` fires | immediately after |

Cover takes 2.01 s at the defaults, collapse 1.26 s, so a full pass is ~3.6 s. That is a *statement* loader, correct for a first visit, wrong for every internal navigation.

Colour order matters: `color1` is the outer wave (first, sits at the bottom), `color3` is the inner one that holds the screen. Put the darkest at `color3` if the collapse should read as an iris closing on light content.

## Published API

| Prop | Type | Default | Notes |
|:--|:--|:--|:--|
| `color1` | string | `#F5C225` | primary outer wave |
| `color2` | string | `#F05C15` | middle wave |
| `color3` | string | `#CE2518` | inner wave that holds |
| `duration` | number | `0.85` | seconds per wave |
| `staggerOverlap` | number | `0.58` | seconds between layer starts |
| `ease` | string | `power3.inOut` | expansion and collapse |
| `onComplete` | `() => void` | `undefined` | after removal |
| `className` / `style` | string / object | `undefined` | extra hooks on the root |
| `children` | node | `undefined` | rendered above the colour, inside the overlay |

Added by this implementation: `hold` (ms, default `300`; `null` waits for `controller.reveal()`), `zIndex` (default `9999`), `gsap`.

## How it is built

- The overlay is `position: fixed; inset: 0` on `document.body`, `pointer-events: none`, `aria-hidden="true"`.
- Each layer is a full-bleed `<div>` with a `clip-path: circle()` mask. The radius is computed in px, not percent: `0.55 × hypot(vw, vh)`. A percentage radius resolves against a diagonal-derived reference box and will not reach the corners on wide screens.
- GSAP interpolates the `circle()` string numerically, with no plugin:

```js
tl.fromTo(layer,
  { clipPath: 'circle(0px at 50% 50%)' },
  { clipPath: `circle(${radius}px at 50% 50%)`, duration, ease },
  i * staggerOverlap);
```

- The collapse runs in reverse layer order and uses `duration × 0.8` with half the stagger, so the exits feel quicker than the entries without a second set of numbers to maintain.
- `onComplete` is attached to the timeline, so it fires after the node is gone. Do not unmount the loader's parent from inside it.

## Profiles

| Use | duration | staggerOverlap | hold | Total |
|:--|:--|:--|:--|:--|
| First paint, signature | 0.85 | 0.58 | 300 | ~3.6 s |
| Route change, frequent | 0.45 | 0.18 | 0 | ~1.1 s |
| Reduced motion | n/a | n/a | 300 | 0.5 s fade |

Below ~0.35 s per wave the three layers stop reading as separate waves and look like a stutter. Use a single-layer fade instead.

## Wiring it to a route change

Cover immediately, release when the next view has painted. Pass `hold: null` and control stays with you:

```js
const loader = mountCircleRevealLoader({
  gsap, hold: null, duration: 0.45, staggerOverlap: 0.18,
});

router.push('/studio');
await nextPaint();      // new route rendered, images above the fold decoded
loader.reveal();        // collapse begins; onComplete fires once the overlay is gone
```

`reveal()` is idempotent. Call it from a timeout, a suspense boundary and a route event without guarding. Never mount a loader for a navigation that resolves under ~150 ms: an 80 ms flash is worse than no loader at all.

## Pitfalls

- **Transformed ancestor.** `position: fixed` degrades to `absolute` inside `transform`, `filter` or `backdrop-filter`. Mount on `body` and keep it there.
- **Percent radius.** `circle(100% at 50% 50%)` will not cover a wide viewport. Use px.
- **Blocking clicks.** Without `pointer-events: none` the overlay eats the first interaction after it finishes if the timeline is killed early.
- **Double mount.** React 18 StrictMode mounts effects twice in development. The `destroy()` return value is what prevents two overlays stacking their colours.
- **Colour banding.** Three flat fills at 8-bit can band on large gradients; keep the three colours close in hue or add a 2 % noise layer if the brand can afford it.

## Acceptance

- [ ] On a 2560 × 1440 viewport the circle reaches all four corners at the end of beat 1.
- [ ] The page is never visible between layers, with no gap at the seams.
- [ ] Clicking during the animation does nothing to the page underneath.
- [ ] With reduced motion the page is covered instantly and fades in 200 ms.
- [ ] Mounting twice in a row leaves exactly one overlay.
- [ ] `reveal()` called twice collapses once, and `onComplete` fires once.
