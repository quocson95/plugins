# Motion UI

Sourced motion specs for interface work. Every duration, curve and spring comes with how it is known, and every pattern ships the CSS, the markup and a reduced-motion fallback.

## Install

| Harness | Install |
|:--|:--|
| Cursor | `/add-plugin motion-ui` |
| Claude Code | `/plugin marketplace add quocson95/plugins`, then `/plugin install motion-ui@cursor-plugins` |
| ZCode | `sh <checkout>/motion-ui/harness/zcode/install.sh` |
| pi | `sh <checkout>/motion-ui/harness/pi/install.sh` |

The two scripts link the skills into `~/.zcode/skills/` and `~/.pi/agent/skills/`, so a `git pull` is the update. Details, overrides and the skills-only fallback are in [harness/README.md](harness/README.md).

## Skills

| Skill | Description |
|:------|:------------|
| `motion-ui` | Build or specify motion: 18 patterns with numbers, CSS and wiring, plus the base rules and the spring-to-stack conversions. |
| `motion-ui-audit` | Review motion that already exists: inventory, ten checks, and a report with one replacement value per finding. |

## The patterns

| Group | Patterns |
|:--|:--|
| Feedback | pop on yes, sink then spring, draw the win, shake don't shout |
| Controls | stretch then glide, slide the pill, fast then slow, meet then turn |
| Overlays | wait once then follow, slide in step back, grow don't pop |
| Data and loading | roll don't jump, crawl then finish, shimmer then settle, stagger then stop |
| Gestures | follow then snap, past the line let go, resist the pull |

Each value is marked `verified` (read from a standard, spec or vendor document), `observed` (measured in a shipping library's source), `derived` (computed, such as overshoot from damping) or `recommended` (editorial default). Two entries carry the common mistake that ships instead, with the single number that fixes it.

## Structure

```
motion-ui/
├── .cursor-plugin/plugin.json
├── .claude-plugin/plugin.json
├── harness/
│   ├── README.md                 install for Cursor, Claude Code, ZCode, pi
│   ├── zcode/install.sh          links the skills into ~/.zcode/skills
│   └── pi/install.sh             links the skills into ~/.pi/agent/skills
└── skills/
    ├── motion-ui/
    │   ├── SKILL.md
    │   └── references/
    │       ├── rules.md          base rules, paste-ready
    │       ├── feedback.md       four states that answer a person
    │       ├── controls.md       switch, tabs, accordion, menu icon
    │       ├── overlays.md       tooltip, toast, menu
    │       ├── data-loading.md   numbers, progress, skeleton, lists
    │       ├── gestures.md       bottom sheet, swipe, rubber band
    │       └── stacks.md         springs, sampled curves, shipping values
    └── motion-ui-audit/
        └── SKILL.md
```

## Provenance

The motion records, CSS, markup and the base rules block come from the motion-ui library at [200lab.io](https://200lab.io), a product of 200Lab. The plugin packaging, the grouped references, the spring formulas and the audit workflow were added here. Sources keep their own licences.
