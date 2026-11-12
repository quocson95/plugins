# Typography: Y2K bloom and X-RAY inversion

Two display treatments. One adds light; the other subtracts it. Neither is a text animation in the "letters fly in" sense. They are surfaces that respond to the page.

## Contents

- [Y2K Dreamy Text Glow](#y2k-dreamy-text-glow)
- [X-RAY Text](#x-ray-text)
- [Choosing between them](#choosing-between-them)

---

## Y2K Dreamy Text Glow

Source: https://goodmotion.vercel.app/section/y2k-dreamy-text-glow

Category: Typography. Tags: GSAP, Typography, Y2K, Glow, Text Effect, Retro.

A headline where every glyph carries a rim light that swells as a slow band sweeps across the line, and again wherever the pointer comes within 150 px. Tight tracking, sub-1 line-height, heavy weight: the type is deliberately cramped so the bloom reads as light spilling between letters.

### Published API

| Prop | Type | Default | Meaning |
|:--|:--|:--|:--|
| `text` | string | `"code component..."` | content, `\n` breaks a line |
| `color` | string | `#FFFFFF` | fill and glow tint |
| `fontSize` | number \| string | `58` | px |
| `fontWeight` | number \| string | `700` | |
| `letterSpacing` | number \| string | `-6` | negative: letters touch |
| `lineHeight` | number \| string | `0.85` | lines overlap slightly |
| `rimLightRadius` | number | `5.5` | base glow radius |
| `maxStrokeWidth` | number | `6` | stroke added at full intensity |
| `scaleBoost` | number | `1.21` | max glyph scale |
| `hoverProximity` | number | `150` | pointer radius in px |
| `autoSweepDuration` | number | `10` | seconds per sweep |
| `edgeBlur` | number | `1` | gaussian blur on glyph edges |

### Anatomy

Per frame, for every glyph:

```
proximity = max(0, 1 − distance(pointer, glyph) / hoverProximity)
sweep     = max(0, sin(2π × glyphX/width − 2π × t/autoSweepDuration))
intensity = max(proximity, sweep² × 0.9)
```

Then four properties follow that one number:

| Property | Range |
|:--|:--|
| `-webkit-text-stroke-width` | 0 → `maxStrokeWidth` (6 px) |
| `transform: scale()` | 1 → `scaleBoost` (1.21) |
| `filter: blur()` | 0 → `edgeBlur × 0.35` px |
| `text-shadow` | `rimLightRadius` → `rimLightRadius + maxStrokeWidth`, plus a second wider shadow |

Squaring the sweep keeps the band narrow and makes the leading edge brighter than the trailing one. That is the difference between "a light passed over the text" and "the text breathes".

### Tokenising without SplitText

The component splits into **graphemes**, not characters: `Intl.Segmenter(undefined, { granularity: 'grapheme' })`. That keeps emoji, combining accents and Devanagari clusters intact, and handles CJK without a word-breaking pass. Lines split on `\n`; spaces become non-breaking spaces so trailing spaces keep their width.

This is also the limit: one DOM node per grapheme, restyled per frame. At 60 glyphs it is free; at 600 it will cost you a frame budget. For body copy, switch to word-level spans or drop to a CSS-only glow.

### Pitfalls

- **Light on light.** A white bloom on a white page is invisible. This effect assumes a dark surface. Give it a `#0B0B0B`-and-below backdrop or it will look like a rendering bug.
- **Font loading.** Glyph boxes are measured on mount. If the webfont swaps afterwards, the proximity map is wrong until the next resize. Measure after `document.fonts.ready`.
- **Negative tracking + stroke.** At `letterSpacing: -6` and 6 px stroke, neighbouring glyphs overlap; that is the intended look, but it clips on `overflow: hidden` parents. Give the container padding.
- **`will-change` on every glyph** is what makes this janky on low-end machines. The shipped code sets it once per span and never animates layout.
- **Reduced motion.** Static bloom, no sweep, no proximity. The headline still looks designed.

### Acceptance

- [ ] The sweep crosses the full line in `autoSweepDuration`, including on a resized window.
- [ ] Hovering the far end of a long line only lights the nearest ~150 px.
- [ ] Nothing shifts when glyphs scale. The scale origin is `50% 50%` and the line box does not reflow.
- [ ] With reduced motion, no ticker callback is registered at all.

---

## X-RAY Text

Source: https://goodmotion.vercel.app/section/x-ray-text

Category: Typography. Tags: CSS, Typography, Inverted, X-Ray, BlendMode, Minimal.

White text, `mix-blend-mode: difference`. Whatever passes underneath is inverted: dark copy turns white, photography turns to its negative, the whole word reads as a hole in the page. No JavaScript runs after mount.

### Published API

| Prop | Type | Default | Meaning |
|:--|:--|:--|:--|
| `text` | node/string | n/a | content |
| `as` | string | `h1` | `h1`–`h4`, `p`, `span`, `div` |
| `mode` | string | `inline` | `inline`, `sticky`, `fixed` |
| `fontSize` | string \| number | `inherit` | |
| `fontWeight` | number \| string | `900` | |
| `letterSpacing` | string | `normal` | |
| `lineHeight` | number | `1` | |
| `textTransform` | string | `uppercase` | |
| `textAlign` | string | `left` | |
| `top` / `left` / `right` / `bottom` | number \| string | n/a | offsets for `sticky` / `fixed` |
| `usePortal` | boolean | `false` | mount on `document.body` |
| `pointerEvents` | string | `none` | |
| `zIndex` | number | `9999` | |

### Why the portal matters

`mix-blend-mode` blends against the backdrop **inside its stacking context**. Any ancestor with `isolation: isolate`, `transform`, `filter`, `opacity < 1` or `backdrop-filter` creates a new context and the text stops inverting. It just renders white.

`usePortal: true` appends to `body` through a `display: contents` wrapper: no new stacking context, and the element sees the whole page as its backdrop. Use it whenever the text lives inside a card, a grid item or anything with a transform-based animation.

The shipped mount walks the ancestors in dev and `console.warn`s the first one that isolates. Read that warning before debugging the CSS.

### Choosing sticky vs fixed

| Mode | Behaviour | Use |
|:--|:--|:--|
| `inline` | normal flow, blends where it sits | editorial pages, section headers |
| `sticky` | pins within its scroll container | a word that rides along one chapter |
| `fixed` | pins to the viewport | full-screen hero over photography or video |

`fixed` plus a page that scrolls underneath is the canonical effect, and the reason the component ships a portal.

### Pitfalls

- **Pure white only.** `#FFF` inverts exactly; any tint produces a coloured cast on every background. Set the colour, do not theme it.
- **Print and forced-colors.** `mix-blend-mode` is dropped in print and in Windows high-contrast mode, where the text becomes white on white. Add a `@media print` and `@media (forced-colors: active)` rule that sets `color: currentColor; mix-blend-mode: normal`.
- **Selection.** With `pointer-events: none` the word cannot be selected; that is usually right, but it also means it is not announced twice to a screen reader if you mark the visual copy `aria-hidden` and keep a real heading in the DOM.
- **Video underneath.** Blending over a `<video>` is GPU work on every frame; test on the low-end target, not just the laptop.
- **Two copies.** An X-RAY headline is usually a design duplicate of a real `<h1>`; keep exactly one of them in the accessibility tree.

### Acceptance

- [ ] Over a black block the word is white; over white it is black.
- [ ] It still inverts when the parent is animated with `transform`.
- [ ] High-contrast mode shows readable text.
- [ ] The heading text exists once for assistive tech.

---

## Choosing between them

| If the page is… | Use |
|:--|:--|
| dark, loud, a launch or campaign | Y2K bloom, which needs darkness to exist |
| image-led, editorial, full-bleed media | X-RAY, which thrives on changing backgrounds |
| light and minimal | neither; a plain typeface with real hierarchy will beat both |
