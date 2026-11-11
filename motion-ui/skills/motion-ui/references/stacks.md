# One spring, four stacks

A spring is stored once, with its numbers. Each stack then either takes those numbers directly or takes a sampled copy of the curve. The sampling matters: `cubic-bezier()` cannot express an overshoot, so a spring becomes a CSS `linear()` list.

## Read a spring

Two numbers define it: a response `duration` and a `bounce` between 0 and 0.3.

- Damping ratio: `ζ = 1 − bounce`. Bounce 0.3 means `ζ = 0.7`.
- Overshoot: `exp(−πζ / √(1 − ζ²))`. At `ζ = 0.7` that is 4.6%; at `ζ = 0.85` it is 0.6%. Both match the library's own figures.
- Angular frequency: `ω0 = 2π / duration`, with the duration in seconds.
- Stiffness: `k = ω0²`. Damping coefficient: `c = 2ζω0`.
- Settle time: `ln(1000) / (ζ ω0)` — the point where the motion is within 0.1% of rest.

| duration | bounce | ζ | stiffness | damping | overshoot | settles in | used by |
|:--|:--|:--|:--|:--|:--|:--|:--|
| 350 ms | 0.3 | 0.70 | 322.3 | 25.13 | 4.6% | 550 ms | press release |
| 400 ms | 0.3 | 0.70 | 246.7 | 21.99 | 4.6% | 628 ms → 630 ms | like pop |
| 300 ms | 0.15 | 0.85 | 438.6 | 35.60 | 0.6% | 388 ms → 390 ms | tab pill |
| 500 ms | 0.15 | 0.85 | 157.9 | 21.36 | 0.6% | 647 ms → 650 ms | rolling digits |

The last column is rounded to 10 ms, which is how the sampled CSS writes it.

## CSS: the settle time is the duration

The `linear()` transition runs for the settle time, not the nominal duration. A 350 ms spring with bounce 0.3 settles at 550 ms, so the CSS says `550ms`. Writing `350ms` there cuts the spring off before it comes to rest and the overshoot disappears.

```css
/* duration: 350 ms, bounce: 0.3: sampled into linear() over the 550 ms it takes to settle */
.element {
  transition: transform 550ms linear(
    0, 0.028, 0.1, 0.199, 0.311, 0.427, 0.539, 0.642, 0.734, 0.813,
    0.878, 0.93, 0.97, 1, 1.021, 1.035, 1.043, 1.046, 1.045, 1.043,
    1.039, 1.034, 1.028, 1.023, 1.018, 1.014, 1.01, 1.007, 1.004, 1.002,
    1, 0.999, 0.999, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998, 1
  );
}
```

The list is the spring sampled at even intervals: 40 to 50 points is enough, and the values above are read straight off the library's own sample. Copy a list whole; do not edit it by hand, and do not rebuild it from the formulas above unless you can check the result in a browser.

Non-overshooting motion does not need any of this: a single `cubic-bezier(0.23, 1, 0.32, 1)` carries it.

## Tailwind v4

A sampled curve becomes a theme token, then a utility:

```css
@theme {
  --ease-press: linear(
    0, 0.028, 0.1, 0.199, 0.311, 0.427, 0.539, 0.642, 0.734, 0.813,
    0.878, 0.93, 0.97, 1, 1.021, 1.035, 1.043, 1.046, 1.045, 1.043,
    1.039, 1.034, 1.028, 1.023, 1.018, 1.014, 1.01, 1.007, 1.004, 1.002,
    1, 0.999, 0.999, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998, 1
  );
}
```

`ease-press` then works where the release animates: `class="transition-transform duration-[550ms] ease-press"`. The duration stays 550 ms for the same reason as above, and the press half keeps its own 120 ms `ease-out` rule — the two halves are different curves and should not share one utility.

## React Motion

The spring keeps its original parameters; the library samples it for you.

```jsx
const press = { type: "spring", duration: 0.35, bounce: 0.3 };

<motion.button whileTap={{ scale: 0.97 }} transition={press}>
  Continue
</motion.button>
```

`stiffness` and `damping` from the table are the equivalent pair when a component asks for them instead of `duration` and `bounce`.

## GSAP

GSAP has no `bounce` parameter, so it cannot take the spring as-is. Two honest options: use `ease: "power3.out"` for the non-overshooting half of a motion, or feed the sampled points through `CustomEase` when the overshoot is the point. Do not substitute `elastic` — its curve is not this spring.

## Values from shipping libraries

Calibration for when a project has no pattern and no budget: these are the durations those libraries actually ship, each read from its source. The full library holds 726 records from 125 sources.

| record | source | duration |
|:--|:--|:--|
| Dialog enter | Material Web | 500 ms |
| Sonner toast enter | Sonner | 400 ms |
| Switch thumb | Material UI | 150 ms |
| Dropdown open (slide-up) | Ant Design | 200 ms |
| Checkbox check (enter) | Material Web | 350 ms |
| Bell ring | lucide-animated | 500 ms |
| Digit roll transform | NumberFlow | 450 ms |
| Badge count zoom in | Ant Design | 300 ms |
| Rating select pop | daisyUI | 200 ms |
| Heart beat | lucide-animated | 450 ms |
| Zoom/open animation | PhotoSwipe | 333 ms |
| Sheet enter (four sides) | shadcn/ui | 500 ms |
| Toast stack | Base UI | 500 ms |
| Button press scale | HeroUI | 250 ms |
| Gallery swipe to next slide | PhotoSwipe | spring 900 / 60 |
| Skeleton pulse | Chakra UI | 1200 ms |
| Modal enter (zoom) | Ant Design | 300 ms |
| OTP slot value fill | HeroUI | 250 ms |
| Blur-up image reveal | react-lazy-load-image-component | 300 ms |
| Swiper coverflow effect | Swiper | 300 ms |
| Slider thumb and value label | Material UI | 150 ms |
| Select enter | shadcn/ui | 150 ms |
| Accordion open | tw-animate-css | 200 ms |
| Tab indicator | Material UI | 300 ms |
| 90-ring and 180-ring rotation | svg-spinners | 750 ms |
| Word rotate | Magic UI | 250 ms |

Read the column as a sanity check, not a spec: a 150 ms press and a 300 to 500 ms surface entry are the industry's own range, and anything far outside it needs a reason.
