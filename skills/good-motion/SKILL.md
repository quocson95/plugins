---
name: good-motion
description: Six GSAP interaction patterns from the Good Motion collection: a circle-reveal page loader, a googly-eye cursor, an elastic trail cursor, a Y2K bloom headline, inverted X-RAY text, and a WebGL text distortion. Ships runnable vanilla mounts with the published API surface, defaults and timing, plus React/Next wiring. Use when a page needs a signature entrance or route transition, a playful or premium custom cursor, glowing display type, text that inverts as content scrolls under it, or a shader-warped headline; also when someone asks for "Good Motion"-style components, a Framer-grade flourish, or to "make it feel expensive" without naming a technique.
---

# Good Motion

Six effects, taken from the public Good Motion collection (https://goodmotion.vercel.app, read 2026-11-12). Each entry carries what the site publishes, meaning category, tags, prop names and their defaults. It also carries a working implementation whose motion values reproduce the demo.

The vendor source is behind a login. `assets/good-motion.js` is a re-build from the published behaviour and defaults, not a copy. It runs unmodified in a browser with GSAP 3.12+ and no other dependency.

## Catalog

| Component | Category | Reach for it when | Numbers that define it | Read |
|:--|:--|:--|:--|:--|
| Circle Reveal Loader | Loading screen | First paint, route change, any moment that needs a deliberate curtain instead of a spinner | 3 layers, 0.85 s per wave, 0.58 s overlap, `power3.inOut` | [loaders.md](references/loaders.md) |
| Googly Eye Cursor | Cursor | Playful brand, portfolio, 404, kids' or creative product, anywhere a pointer can have a face | 60 px pill, 0.32 s follow, blink every 2.4–5 s | [cursors.md](references/cursors.md) |
| Elastic Trail Cursor | Cursor | Premium/editorial product where a plain dot is too quiet but a full trail would be noisy | 22 px lead + 6 colour stops, drag 0.9, sleep when idle | [cursors.md](references/cursors.md) |
| Y2K Dreamy Text Glow | Typography | Display headline that has to bloom: launch pages, music, fashion, event microsites | stroke 0→6 px, scale→1.21, 150 px proximity, 10 s sweep | [typography.md](references/typography.md) |
| X-RAY Text | Typography | A word that has to survive over photography, video or mixed backgrounds | `mix-blend-mode: difference`, white text, portal | [typography.md](references/typography.md) |
| Text Distortion | Typography (WebGL) | One hero word, held still, that reacts to the pointer like liquid | force 2.0, RGB shift 0.06, 140 px radius, decay 0.06 | [webgl-distortion.md](references/webgl-distortion.md) |

Two rules of thumb for choosing: a loader and a hero effect compete for the same first second. Ship one, not three. And a custom cursor plus a hover-heavy UI is a tax on every click; if the interface has more than a handful of controls, use X-RAY or the loader instead.

## Workflow

1. Match the brief to a row above. If nothing matches, stop. This skill is six specific effects, not a general animation library.
2. Read that reference file end to end. It carries the beat sheet (what happens, in what order, at what duration), the full prop table with defaults, the tuning knobs and the pitfalls that make the effect look cheap.
3. Copy `assets/good-motion.js` into the project (or the single function out of it). Mount it in a `useEffect` / `onMount`; never call a mount during render.
4. Keep the numbers. Change the colours, the copy, the size and the easing only when the brand requires it, and say so in the commit message. The proportions are what make these read as designed rather than animated.
5. Build it, then check it against the acceptance list at the bottom of the reference file. That list covers pointer hygiene, reduced motion, unmount, and the effect surviving a resize.

## Wiring

The mounts are framework-agnostic: they take a DOM node (or nothing, for the two cursors) and return `{ element, destroy }`.

```jsx
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { mountGooglyEyeCursor } from '@/lib/good-motion';

export function BrandCursor() {
  useEffect(() => {
    const cursor = mountGooglyEyeCursor({ gsap, size: 60 });
    return () => cursor.destroy();
  }, []);
  return null;
}
```

Framer code components take the same shape: `const ref = useRef()`, mount against `ref.current` in `useEffect`, destroy on unmount. The mounts never assume React, Next or a bundler. Any DOM node will do.

For the loader, the callback is the hand-off:

```js
const loader = mountCircleRevealLoader({
  gsap,
  onComplete: () => setReady(true), // fires after the overlay is removed
});
```

Do not pass `gsap` from a different copy of GSAP than the one the rest of the page tweens with. Two runtimes means two tickers and duplicated plugins. One import, passed down.

## Verify before calling it done

```bash
python3 -m http.server 8781 -d skills/good-motion/assets
open 'http://localhost:8781/preview.html'          # click through all six
open 'http://localhost:8781/preview.html?selftest=1'  # PASS/FAIL per component
```

The self-test asserts each mount actually animates, that the shader receives pointer input, that blending survives the portal, and that every mount leaves nothing behind on unmount. Run it in a real browser: `requestAnimationFrame` does not fire in every embedded or headless pane, and without frames nothing here can be judged.

## Shared rules

Details and code in [references/baseline.md](references/baseline.md). The short version:

- **Pointers are optional.** Both cursors and the shader must no-op on `(hover: none)` and leave the native cursor alone on touch.
- **Reduced motion means less, not none.** Kill the sweep, blink and shader warp; keep the end state visible.
- **Destroy is part of the component.** Every ticker callback, listener, injected style and portal node gets removed.
- **Never animate layout.** These effects move transforms, opacity, `clip-path` and shader uniforms, not width, top or font-size.
- **One ticker.** `gsap.ticker` for continuous effects, tweens for entrances; do not run your own `requestAnimationFrame` loop beside it.

## Provenance

Sourced from the public catalog pages on goodmotion.vercel.app on 2026-11-12: six components, with description, category, tags and API reference read directly from each page. Defaults are quoted as published. One published number cannot mean what its label says, the trail cursor's 4.5 px spacing against 22 px dots. The reference file says so and gives the value used instead.
