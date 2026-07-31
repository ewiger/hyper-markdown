# Write a source doc as an L0/L1 model lens

Apply this documentation style to the source document named in the prompt
header. Read that document in full first.

**Goal:** Turn that source — a design note, wiki card, issue, or rough draft —
into a *model lens*: a focused, implementation-free blueprint of one facet of the
system, written in [len](https://github.com/ewiger/len) vocabulary at the two
levels this project actually uses, **L0 (natural spec)** and **L1 (structural
core)**. Read `doc/wiki/models/model-lenses.hmd` and `doc/wiki/models/len.hmd`
first; this prompt applies them.

A lens is a format, not a folder: it captures *how something is defined and
works*, precisely enough to reason about and to test against, but stops short of
production code. The payoff is test generation — every obligation and law you
write becomes a checkable claim.

## Philosophy

- **Zoom in on one facet.** A lens covers one thing — a data structure, a domain
  rule, an algorithm, a protocol — not the whole system. If the source spans
  several, produce one lens per facet and cross-link them.
- **Implementation-free.** State how the model is *defined* and *behaves*, at a
  level any language could implement from. The moment you embed concrete
  production code, it has stopped being a lens.
- **Test-first, proof-shaped.** Write the model as obligations and laws, so the
  lens *is* the specification a test suite verifies. This is how the project does
  [[test-driven-development]]; the formal end aims at machine-checkable proofs.
- **DRY.** Link `doc/models/`, `doc/wiki/`, and `doc/proposals/` docs by path
  rather than restating them. The lens adds precision, not a summary.

## Placement

- Choose the facet and write the lens under it:
  - `doc/models/data/` — data blueprints (schemas, entity-relationship, storage
    and movement of structures).
  - `doc/models/domain/` — domain blueprints (concepts, bounded contexts,
    relations, ontologies).
  - `doc/models/behavior/` — behavioral blueprints (algorithms, state machines,
    protocols, executable-intent specs).
- Name the file for the model: `doc/models/<facet>/<name>.len`, holding both
  levels as `## L0` and `## L1` sections. Split into `<name>.l0.len` /
  `<name>.l1.len` only when a level grows large enough that one file hurts.
- Keep lens files **directly under the facet folder** — do not invent a
  `doc/models/lenses/` folder.
- Cross-link the source it came from and any sibling lens, wiki card, or proposal
  by path, so the lens is discoverable from both directions.

## L0 — Natural Spec

The loosest lens: human intent in prose, written in *len*'s vocabulary.

- **Purpose** — one paragraph: what this facet is and why it exists.
- **Worked examples** — concrete inputs and expected outcomes, named so L1 and
  the tests can refer back to them.
- **Edge cases and rationale** — the boundaries, the "why", the rejected
  alternatives. Diagrams (state, sequence, relations) are welcome here.
- Keep it readable. L0 is [[behavior-driven-development]] documentation, not a
  grammar.

## L1 — Structural Core

The canonical model in **relational logic**. State it exactly, not as a sketch.

- **Types** — the entities and value shapes, as `name  type` field lists.
- **Relations and invariants** — how the types relate and what must always hold.
- **Contracts** — for each operation, its obligations:

  ```text
  operation(args) -> result
    requires:  <preconditions that MUST hold on entry>
    ensures:   <postconditions that MUST hold on return>
  ```

- **Laws** — algebraic or behavioral properties that hold across inputs
  (idempotence, round-trips, ordering, associativity), each phrased as a
  universally checkable claim.
- **Worked examples** — carry the L0 examples through the contracts to show them
  satisfied.

## Make it generate tests

The lens must be actionable as tests, not just readable.

- Give every contract and law a short stable name.
- End the L1 section with a **Test obligations** list: one bullet per named
  contract/law, phrased as the check a test performs — the concrete case, its
  boundaries, and the exact failure it rejects. Laws become property/round-trip
  checks; contracts become per-case unit checks.
- Where a `src/` module or `tests/` suite already exists, name it so the
  obligations map onto real files. Where it does not, say what to create.

## Writing rules

- Use [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords in CAPS
  — MUST, MUST NOT, SHOULD, MAY — inside contracts and invariants; plain prose
  for rationale.
- Put types, contracts, formulas, and step algorithms in ```text fences. Prefer
  `name  type` field lists and `requires`/`ensures` blocks.
- Pin constants to exact values (sizes with units, digests, enumerations); never
  leave a consensus-critical value as "TBD" — record open decisions explicitly.
- Bold each term at first definition; keep the vocabulary consistent between L0
  and L1 so they refine into each other.
- Neutral, precise, engineering register — no marketing, no filler.

## Extract from the source

Read the source and pull each of these; where it is silent, search the codebase,
and where a value is genuinely undecided, record it as an open decision rather
than inventing it.

- The facet and the model's name.
- Purpose, worked examples, edge cases (→ L0).
- Types, relations, invariants, operation contracts, laws (→ L1).
- The obligations each contract/law implies, and the `src/`/`tests/` paths they
  map to.
- The source doc and sibling docs to cross-link.

Match the surrounding lenses' tone and heading conventions.
