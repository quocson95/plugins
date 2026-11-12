# Custom cursors: googly eyes and elastic trail

Two cursors from the collection, one playful and one premium. Both replace the OS pointer, both must give it back on touch, over text fields, and on unmount.

## Contents

- [Which one](#which-one)
- [Googly Eye Cursor](#googly-eye-cursor)
- [Elastic Trail Cursor](#elastic-trail-cursor)
- [Shared pitfalls](#shared-pitfalls)

## Which one

| | Googly Eye | Elastic Trail |
|:--|:--|:--|
| Tone | playful, characterful, a little silly | premium, editorial, restrained |
| What the pointer does | reacts: eyes track, blink, wink on click | follows with weight: a short chromatic tail |
| Fits | portfolio, 404, kids, creative tools, launch stunts | fashion, studio, product marketing, "design-forward" SaaS |
| Fails at | enterprise dashboards, anything with dense controls | dark-on-dark UI where the tail disappears |

Both are decoration. The interface must remain fully usable with the cursor removed. Keyboard focus rings, `:hover` states and click targets do not get to depend on them.

---

## Googly Eye Cursor

Source: https://goodmotion.vercel.app/section/googly-eye-cursor

Category: Cursor. Tags: GSAP, Cursor, Interactive, QuickTo, Animation.

A 60 px white pill with two eyes. Pupils are pulled toward the pointer, the pair blinks at human intervals, one eye winks on click, both glance up or down with the scroll direction, and an accent "click" pill appears over interactive elements.

### Published API

| Prop | Type | Default |
|:--|:--|:--|
| `accentColor` | string | `#E53935` |
| `hideDefaultCursor` | boolean | `true` |
| `zIndex` | number | `2147483647` |
| `className` / `style` | string / object | `undefined` |
| `children` | node | `undefined` |

Added here: `size` (px, default `60`), `gsap`. The site also lists a legacy `hideNativeCursor` alias. Accept it if you are porting existing calls.

### Anatomy

| Part | Behaviour | Numbers |
|:--|:--|:--|
| Pill follows pointer | `gsap.quickTo` on `x`/`y` | 0.32 s, `power3` |
| Eye | 36 % of pill | 21.6 px at size 60 |
| Pupil | 13 % of pill | 7.8 px |
| Pupil travel | capped inside the eye | ≈ 5.9 px radius |
| Pupil aim | normalised vector × travel × `min(1, distance / 120)` | 0.18 s `power2` |
| Blink | one eye, `scaleY 1 → 0.08 → 1` | 0.07 s per half, every 2.4–5.0 s |
| Wink | same, on `pointerdown` | 0.08 s |
| Hover pill | accent label under the cursor | 0.18 s `back.out(2)` |
| Scroll glance | pupil `y` biased by scroll delta, then decays | clamp ±travel, 0.9 s decay |

Two details carry the character: the blink is **asymmetric and single-eyed** (both eyes at once reads robotic), and the pupil travel is capped so the eyes never look "unhooked" from their sockets.

### Implementation notes

- `quickTo` is created once per property and re-called on every event. Creating a tween per `pointermove` is the usual way this effect drops frames.
- Eye centres are measured on mount and on `resize`, not on every move. Reading two `getBoundingClientRect()` per pointer event forces layout in a hot path.
- The pill scales to 1.12 over `a, button, [role="button"]`; the label is a separate node so it can outlive the scale.
- `pointerdown` on an interactive element shows the label *and* winks. One gesture, two acknowledgements, which is what makes it feel alive rather than decorative.

### Pitfalls

- **`cursor: none` leaks.** If the class is not removed on destroy, the whole app loses its pointer. The shipped `destroy()` clears it; keep that behaviour if you rewrite.
- **Text selection.** Add `input, textarea, select { cursor: text !important }` overrides or the I-beam disappears over forms.
- **iOS.** `(hover: none)` returns early. No node, no listeners, nothing to clean up.
- **Focus.** A keyboard user never sees this cursor. Hover states are not optional.

### Acceptance

- [ ] On a touch device, `mount` returns a controller and injects nothing.
- [ ] Pupils stay inside the eye at the viewport corners.
- [ ] Blinks happen at irregular intervals; the eye never blinks mid-wink into a squashed state.
- [ ] Unmount restores the system cursor and leaves no rule in `document.head`.

---

## Elastic Trail Cursor

Source: https://goodmotion.vercel.app/section/elastic-trail-cursor

Category: Cursor. Tags: GSAP, Cursor, Trail, Elastic, Physics, Interactive.

A solid lead dot with a six-stop chromatic tail. Fast movement stretches the chain; stopping tucks the tail under the lead and fades it; an idle page runs no frames.

### Published API

| Prop | Type | Default |
|:--|:--|:--|
| `dotSize` | number | `22` |
| `maxSpacing` | number | `4.5` |
| `leadResponsiveness` | number | `0.65` (0.1–0.99) |
| `trailDrag` | number | `0.55` (0.1–0.8) |
| `leadColor` | string | `#0F172A` |
| `trailColors` | string[] | Sunset 6: `#FF9800 → #00BCD4` |
| `hideNativeCursor` | boolean | `true` |
| `zIndex` | number | `999999` |

### Anatomy

1. Lead dot lerps toward the pointer. Per frame: `k = 1 − (1 − leadResponsiveness)^dt`, where `dt` is frame time normalised to 60 fps, so a 120 Hz display does not run the cursor at double speed.
2. Each trailing dot lerps toward the one in front at `trailDrag`, then the link distance is capped. The cap is what turns the chain into a readable trail instead of a smear.
3. Trail opacity ramps with speed: `clamp(0, 1, speed / 3)` scaled by the dot's position in the chain. At rest the tail is invisible and sits under the lead.
4. After ~90 idle frames the ticker callback is removed and re-added on the next `pointermove`.

### The number that does not work as labelled

The published `maxSpacing` is 4.5 px, described as the maximum separation between dots during rapid movement. With 22 px dots, a 4.5 px centre-to-centre gap means every trailing dot hides completely behind the one in front, so the gradient never appears.

This implementation treats it as the *stretch allowance*: neighbouring dots sit `0.9 × dotSize` apart (22 px dots just touch) and `maxSpacing` widens the cap, `24.25 px` at the defaults. Raise `maxSpacing` to 12–18 for a longer, looser tail; the number is the cheapest way to change the cursor's temperament.

| Want | Change |
|:--|:--|
| Longer tail | `maxSpacing` 12–18, or add colours to `trailColors` |
| Heavier, more lag | `leadResponsiveness` 0.45, `trailDrag` 0.45 |
| Tighter, almost no trail | `leadResponsiveness` 0.85, `trailDrag` 0.7, `maxSpacing` 2 |
| Smaller footprint | `dotSize` 14–16 (keep the 0.9 spacing rule) |
| On dark UI | light `leadColor` (`#FFFFFF`) and a darker tail |

### Pitfalls

- **Only one cursor component per page.** Two mounts means two `cursor: none` classes and two overlapping dots.
- **Blend with the lead.** Trail dots paint *under* the lead (this implementation sets `z-index` by chain position). If the lead is semi-transparent, lower the trail opacity instead of reordering.
- **Sleeping is the feature.** A ticker that runs on an idle page is a measurable battery cost; verify with DevTools' rendering FPS meter that frames stop when the pointer rests.
- **`zIndex: 999999`** outranks most modals. That is correct for a cursor and wrong for anything else you copy this pattern into.

### Acceptance

- [ ] Moving fast leaves a visible six-colour tail; stopping makes it disappear within ~0.3 s.
- [ ] After ~1.5 s idle the FPS meter shows no work.
- [ ] A 120 Hz display does not make the cursor faster than a 60 Hz one.
- [ ] No dot escapes the viewport at the edges.
- [ ] Unmount removes the ticker callback, the listener and the class.

---

## Shared pitfalls

- **Do not animate the cursor on scroll events.** Use `requestAnimationFrame`/ticker; scroll-driven tweens fight the compositor.
- **Touch laptops** report `(hover: hover)` but also have a touchscreen. The `pointermove` handler is harmless there; do not hide the native cursor on `pointer: coarse` alone.
- **Screenshot tests** will show the cursor wherever it was last moved. Dispatch an explicit `mouseMoved` in the test rather than relying on the initial position.
