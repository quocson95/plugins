# ADR format

ADRs live in `docs/adr/` as `NNNN-slug.md`. Take the highest existing number and add one. Create the folder with the first ADR.

```md
# <Short title of the decision>

<One to three sentences. The context, what was decided, and why.>
```

A paragraph is enough. Add a section only when it changes what a later reader does.

- `Status`, one of `proposed`, `accepted`, `deprecated`, or `superseded by NNNN`, when the decision may be revisited.
- `Considered options`, when a rejected alternative will be proposed again.
- `Consequences`, when a downstream effect is not obvious.

## What earns one

- Architectural shape. "The write model is event-sourced. Reads project into Postgres."
- How contexts talk. "Ordering and Billing exchange domain events, not synchronous calls."
- A technology with lock-in that would take a quarter to swap.
- An ownership or scope boundary, including the explicit no.
- A deliberate deviation a reader would otherwise "fix".
- A constraint the code cannot show, such as compliance or a partner's latency contract.
