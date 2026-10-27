# Glossary format

One `GLOSSARY.md` at the repo root holds one context.

```md
# <Context name>

<One or two sentences on what this context is and why it exists.>

## Language

**Order**
A customer's request to buy one or more items.
_Avoid_: purchase, transaction

**Invoice**
A request for payment sent to a customer after delivery.
_Avoid_: bill, payment request
```

## Rules

- Pick one word per concept. List the rejected synonyms under `_Avoid_`.
- Define what the term is, in one or two sentences. Not what it does.
- Include only terms specific to this project. General programming concepts stay out even when the code uses them everywhere.
- Group terms under subheadings when clusters emerge.

## Several contexts

When the repo has several bounded contexts, a `GLOSSARY-MAP.md` at the root lists them and how they relate. Each context keeps its own `GLOSSARY.md` and `docs/adr/` beside its code.

```md
# Glossary map

## Contexts

- [Ordering](./src/ordering/GLOSSARY.md). Receives and tracks customer orders.
- [Billing](./src/billing/GLOSSARY.md). Generates invoices and takes payment.

## Relationships

- **Ordering to Billing.** Ordering emits `OrderPlaced`. Billing consumes it to open an invoice.
```

Infer which context the topic belongs to. Ask only when two fit.
