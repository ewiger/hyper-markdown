# Write an ADR-style technical decision record

Apply this documentation style to the source document named in the prompt
header. Read that document in full first.

**ADR** stands for [**Architectural Decision Record**](https://en.wikipedia.org/wiki/Architectural_decision)
— a well-known, lightweight format for capturing a technical decision, its
context, and its consequences so the reasoning survives long after the choice is
made. This prompt is a pragmatic, down-to-earth adaptation of it: every claim is
grounded in the actual codebase and written to be implemented, with the
normative precision of an [RFC](https://en.wikipedia.org/wiki/Request_for_Comments)
(exact values, MUST/SHOULD rules). It keeps more ceremony than a classic ADR —
specification, security, deployment, and test sections — but only where that
structure earns its place; omit any section that does not.

**Goal:** Turn that source — a design note, issue, model lens, or rough draft —
into a single decision record that is spec-first, grounded in the code, and DRY:
precise enough that a peer could implement from it without you present.

## Philosophy

- **Spec-first and normative.** Specify behavior precisely enough to implement
  and to test against, not to pitch it. Freeze decisions in the text; do not
  leave them implied.
- **One document, links not copies (DRY).** Reference shared model, wiki, build,
  and workflow docs instead of restating them.
- **Discoverable from both directions.** The record links back to the source it
  was derived from and to the code it changes; the proposals index links forward
  to the record. Neither is reachable only through the other.

## Placement and registry

- Start from the skeleton at `doc/proposals/TEMPLATE.md`: copy it to
  `doc/proposals/HYPERMARKDOWN-NNNN/README.md` (one folder per proposal, named for its
  stable ID) and delete its guidance comments as you fill each section.
- Reserve the number first: add or update the row in `doc/proposals/README.md`
  (`ID | Status | Title`) before writing the record, and keep that row's Status
  in step with the record's `**Status**` on every transition.
- Cross-link relevant `doc/models/` lenses and `doc/wiki/` cards by path rather
  than summarizing them.

## Front matter (exact)
- H1 title: `# HYPERMARKDOWN-NNNN: <Title>` (short, declarative — the change, not a pitch).
- `**Status**: drafted | accepted | rejected | withdrawn`
- `**Created**: YYYY-MM-DD`
- `**Source**`: link to the document this record was derived from.
- Optional: a "Companion notes" block linking sibling docs, one bullet each with a
  half-sentence saying what each covers. Link shared/workflow docs — never paste them in.

## Section order (omit a section only when it truly does not apply)
1. **Abstract** — one dense paragraph, present tense, stating *what changes*. No motivation, no selling.
2. **Motivation** — *why now*; enumerate the concrete purposes as a short bulleted list.
   Call out domain-specific risk (compatibility, security, operational, data-loss).
3. **Goals / Non-goals** (optional) — bound the scope explicitly; list what this does NOT do.
4. **Specification** — the normative core. Numbered subsections `### 1. <name>`, each opening
   with a one-line framing sentence, then rules as bullets.
5. **Backwards Compatibility** — what breaks, what stays, migration requirements.
6. **Security Considerations** — new attack surface, threat-model changes, mitigations, resource bounds.
7. **Deployment / Activation** — rollout as an ordered list (flags, staged environments, activation point).
8. **Reference Implementation** — the real files/modules/functions to change and the tests to add.
9. **Test Plan** — concrete unit + integration coverage; name suites/commands; link shared build/test docs.
10. **Open Questions** — every unresolved decision, each phrased as a question that MUST be
    resolved (values "frozen") before Status moves from drafted to accepted.
11. **Changelog** — dated bullets mirroring status transitions (`- YYYY-MM-DD: drafted`).

## Writing rules
- Use [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) keywords in CAPS — MUST, MUST NOT, SHOULD, MAY — for every normative statement.
  Reserve them for real requirements; use plain prose for rationale.
- Pin constants to exact values (hex, byte layouts, sizes with both units, digests). Never leave
  a consensus-critical value as "TBD" in an accepted doc — if unknown, it lives in Open Questions.
- Put serialization layouts, formulas, and step algorithms in ```text fences. Prefer numbered
  steps for algorithms and field lists (`name  type`) for wire/struct formats.
- State the rule, then justify it in the next sentence ("X instead of Y, because Y would ...").
- List rejected alternatives with a one-line reason each: `- Approach Z. (Rejected: <reason>)`.
- Ground everything in the actual codebase: real file paths, function names, error/reject strings,
  test names. If you cannot name them, say what to search for.
- DRY: link shared workflow/build/style docs instead of restating them.
- Bold inline terms at first definition. Keep paragraphs short; prefer bullets over walls of prose.
- Neutral, precise, engineering register — no marketing, no hedging, no filler.

## Extract from the source
Read the source document and pull each of these. Where the source is silent, search
the codebase; where a value is genuinely undecided, record it in Open Questions and
keep Status at `drafted` rather than inventing it.

- PREFIX / number / title (reserve the number in `doc/proposals/README.md`)
- Status and Created date
- Problem and why it matters now
- The decision / normative behavior
- Constants, formats, algorithms (exact)
- Compatibility & migration impact
- Threats & mitigations
- Rollout / activation path
- Files, tests, and shared docs to reference

Match the surrounding proposals' tone and heading conventions.
