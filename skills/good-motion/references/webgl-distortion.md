# Text Distortion (WebGL)

Source: https://goodmotion.vercel.app/section/text-distortion

Category: Typography. Tags: WebGL, Shader, Typography, Distortion, Chromatic, Interactive.

The word is rasterised once into a texture, then a fragment shader samples that texture three times with slightly different offsets: one warp driven by the pointer, plus a per-channel split that fringes the edges in colour. Pointer velocity pushes the sample; inertia decays it back.

## Contents

- [Published API](#published-api)
- [The pipeline](#the-pipeline)
- [The shader, line by line](#the-shader-line-by-line)
- [Tuning](#tuning)
- [Pitfalls](#pitfalls)
- [Acceptance](#acceptance)

## Published API

| Prop | Type | Default |
|:--|:--|:--|
| `text` | string | `GOODMOTION` |
| `textColor` | hex string | `#000000` |
| `fontFamily` | string | `Impact, sans-serif` |
| `fontWeight` | number \| string | `900` |
| `displacementForce` | number | `2.0` |
| `rgbShiftStrength` | number | `0.06` |
| `mouseRadius` | number | `140` (px) |
| `decaySpeed` | number | `0.06` (0.01–0.2) |
| `width` / `height` | string \| number | `100%` / `100%` |

The vendor component renders its own container, so `100%/100%` is correct there. The mount in `assets/good-motion.js` takes an existing node instead: give that node a height (or pass `height`) or the canvas will be zero pixels tall. That silent failure looks like "nothing renders".

## The pipeline

1. A `<canvas>` fills the host. Context: `webgl`, `alpha: true`, `premultipliedAlpha: false`.
2. The text is drawn into an offscreen 2D canvas at device resolution (DPR capped at 2), shrunk until it fits 92 % of the width, then uploaded as a texture with `UNPACK_FLIP_Y_WEBGL = true`. Canvas rows run top-down, GL texture rows bottom-up; without the flip the word renders upside down.
3. A single full-screen triangle is drawn: three vertices, no index buffer, one draw call.
4. Per frame: pointer position is smoothed, velocity is integrated with `decaySpeed`, and the uniforms are written.
5. On resize the texture is re-rasterised at the new size. Nothing else reallocates.

No WebGL means no effect: the mount appends the plain HTML word instead. That is the fallback, not an error state. Check for it in your tests rather than assuming a canvas exists.

## The shader, line by line

```glsl
vec2 d = vUv - uMouse;
d.x *= uAspect;
float dist = length(d);
float infl = 1.0 - smoothstep(0.0, uRadius, dist);      // 1 at the pointer, 0 at the radius
vec2 dir = normalize(d);                                 // pushes outward from the cursor
float wave = sin(vUv.y * 16.0 + uTime * 2.2) * 0.5 + 0.5;

vec2 warp = dir * infl * uForce * 0.008 * wave           // radial swell
          + uVel * 0.00022 * infl;                       // velocity drag
float s = uShift * infl + 0.0015 + 0.004 * wave;         // chromatic split, never zero

vec4 cr = texture2D(uTex, vUv + warp + dir * s);
vec4 cg = texture2D(uTex, vUv + warp);
vec4 cb = texture2D(uTex, vUv + warp - dir * s);
```

| Uniform | Comes from | Note |
|:--|:--|:--|
| `uMouse` | pointer in UV, y up | `1 − (clientY − top) / height` |
| `uVel` | smoothed pointer delta × 1200 | decays at `decaySpeed` per frame |
| `uForce` | `displacementForce` | multiplied by 0.008, not used raw |
| `uShift` | `rgbShiftStrength × 0.02` | 0.0012 UV at the default |
| `uRadius` | `mouseRadius / textureHeight` | px converted to UV so the radius is honest |
| `uAspect` | width / height | keeps the influence circular on wide canvases |

Three details make it read as liquid rather than as a filter:

- The influence is **radial and smoothstepped**, so there is no seam at the edge of the cursor's reach.
- The colour split is **signed along `dir`**, so the fringe appears on opposite sides of the warp instead of ghosting the whole glyph.
- A **small constant split** (`0.0015 + 0.004 × wave`) stays even with no pointer, so the text never looks flat. It looks held in glass.

The shader discards fragments with `alpha < 0.01`, which keeps the transparent regions out of the blend. With `premultipliedAlpha: false` the RGB values are not attenuated by alpha, so edges stay crisp.

## Tuning

| Want | Change |
|:--|:--|
| Bigger, slower swell | `mouseRadius` 220–320, `displacementForce` 2.5–3.5 |
| Sharper, more broken glass | `rgbShiftStrength` 0.12–0.2, `decaySpeed` 0.12 |
| Subtle, premium | `displacementForce` 1.2, `rgbShiftStrength` 0.03, `mouseRadius` 180 |
| Thick display face | keep `fontWeight: 900`; thin faces disappear at 1 px of displacement |
| Long words | the raster shrinks to fit; check the result rather than trusting `fontSize` |

## Pitfalls

- **Zero-height host.** The most common failure: canvas exists, size 1 × 1, nothing visible. Give the host an explicit height.
- **WebGL context limits.** Browsers cap live contexts (often 8–16). Every mount you leak is a context; `destroy()` calls `WEBGL_lose_context` for a reason.
- **DPR.** At DPR 3 and a 1200 px wide canvas the texture is 7200 px wide, so memory and fill rate both suffer. Cap at 2.
- **Accessibility.** A canvas word is invisible to screen readers. Keep a real heading in the DOM (`sr-only`) and mark the canvas `aria-hidden`.
- **Selection and copy.** Text in a canvas cannot be selected. For a headline, that is usually acceptable; for anything a user might quote, it is not.
- **Reduced motion.** `uForce` and `uShift` go to zero and time stops: a still, slightly glassy word.
- **Fonts.** The raster happens once. If the webfont arrives later, re-rasterise (remount) after `document.fonts.ready` or the word renders in the fallback face.

## Acceptance

- [ ] The word is upright, centred and fits with a margin on a 320 px viewport and on 2560 px.
- [ ] Moving the pointer across a glyph warps it; stopping decays the warp within ~0.5 s.
- [ ] Colour fringing is visible at rest, subtle, and only around letter edges.
- [ ] No WebGL → an HTML word of the same size appears instead.
- [ ] Ten mount/unmount cycles leave no lost contexts in `chrome://gpu`.
