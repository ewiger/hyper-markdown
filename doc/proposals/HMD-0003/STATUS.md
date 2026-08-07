# HMD-0003 — Status

Progress tracking for [HMD-0003](README.md): HQL, the Hyper Query Language.

**This file is the only place work against this proposal is tracked.** Not the
memos under `doc/memory/`, not the cards under `doc/wiki/`, not the proposal
itself. A decision that needs discussion is named here as an open question and
argued wherever it belongs; nothing else may hold a task list. Update the row in
the same commit that changes the code.

**Snapshot** (2026-08-07) — a stub. The record reserves the name **HQL** and
fixes the constraints any grammar must satisfy. No syntax is specified and no
code exists. Every work point below is blocked on the grammar, which is Q1.

HQL reads the resolved graph, so it cannot precede the resolver that builds it
([HMD-0001](../HMD-0001/STATUS.md)).

## Done

Nothing is implemented. The record itself is the only deliverable so far.

| ID | Work point | Spec |
| --- | --- | --- |
| Q0.1 | The name **HQL** reserved, and this number reserved for it | Abstract |
| Q0.2 | Scope fixed: inline properties, templates, and queries are one design problem, not three | Motivation |
| Q0.3 | Determinism, purity, and shared depth limits stated ahead of syntax | Specification |
| Q0.4 | Fence modes fixed: `hmq#eval` evaluates, bare `hmq` highlights only | The fence and its two modes |

## TODO

### Planned work

Nothing is planned in the sense of "agreed and unbuilt" — the grammar is
undesigned, and everything below depends on it. Listed so the shape is visible,
not as a commitment.

| ID | Work point | Blocked on |
| --- | --- | --- |
| W1 | The grammar itself, as a normative specification | Q1 |
| W2 | Inline properties — spelling, parse, and the property model | Q3, Q4 |
| W3 | Evaluator over the resolved graph | W1 |
| W4 | Materialization — writing results back into a card | Q7 |
| W5 | Templates as HQL's expression layer plus iteration | W1, Q6 |
| W6 | `hmd query`, deferred from [HMD-0001](../HMD-0001/README.md) | W3 |
| W7 | Fence rendering in the MkDocs layer — `#eval` evaluates, bare highlights | W3, and a grammar to highlight |
| W8 | Live preview of results before materialization (Layer 2) | W3, and the editor line |

### Broken

Nothing. Nothing is built.

### Limitations

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | The record specifies no syntax | Deliberate. Naming the language and fixing its constraints is cheap and useful now; choosing a grammar under-informed is expensive and hard to reverse. See Q1 |
| L2 | HQL is the first construct whose output depends on files other than the card containing it | Inherent to a query language. It is also what makes deterministic output hard, which is why the constraints are stated before any grammar exists |
| L3 | The MVP may not include HQL at all | `hmd lint` comes first, and the format is meant to be compelling on transclusion alone. See Q8 |

### Open questions and blockers

Q1 blocks every work point above; the rest block `drafted → accepted`.

**This table is the only copy.** [The record](README.md#open-questions) points
here rather than mirroring the list, departing from `TEMPLATE.md` deliberately —
a mirrored list drifts, and then neither copy can be trusted without opening
both.

| ID | Question |
| --- | --- |
| Q1 | What is the grammar? Where SQL's clauses, Python's comprehensions, and Scala's combinators conflict, which wins? |
| Q2 | Does the fence tag stay `hmq` or become `hql`? The modes (§3) are decided; only the language name in the info string is open |
| Q3 | How are inline properties written? `key:: value` is Logseq's spelling and unconfirmed |
| Q4 | How are property vocabularies declared? Unanswered in the sketch too, and needs a config schema |
| Q5 | How does a query import from another namespace — reuse the `import:` key, or its own mechanism? |
| Q6 | Is **Topic** (template + query + namespace) a first-class construct or a convention? |
| Q7 | What triggers materialization, and may a build ever write to a source file? |
| Q8 | Does HQL belong in the MVP line (`HMD-0003`–`HMD-0019`) or past it? |
| Q9 | Is frontmatter a data block or a declaration space? See below |
| Q10 | How are query-local variables bound and scoped? Ties to Q9 — frontmatter is the candidate binding site |

**On Q9.** The open idea is that frontmatter could be a small programming
surface rather than a static mapping — a place to bind variables and
definitions the way a Python module's top level does, which the body and its
queries then reference. That would make query-local variables a frontmatter
feature rather than a query-only one, and it is the natural home for the import
question in Q5.

It cuts against two things now standing, and the tension is the question. The
reserved frontmatter keys are pinned as a *closed* set — `tags`, `use`,
`import` — with `nav` already outstanding as an amendment; user-owned keys are
allowed but carry no semantics. And executable frontmatter strains the purity
rule: bindings that are pure data are safe, while anything evaluable reopens
determinism. A middle position exists — declarative bindings and named
definitions, no control flow — but it has not been argued.

## Gates

None. There is nothing to run.

## Changelog

- 2026-08-07: drafted alongside [the record](README.md). Stub — name and
  constraints reserved, grammar undesigned, no code.
- 2026-08-07: fence modes decided ([§3](README.md)); Q2 narrowed from "what
  fence?" to "`hmq` or `hql`?".
- 2026-08-07: this table became the only copy of the open questions. Q10 added
  (query-local variable scoping), which the record had carried and the tracker
  had not — the drift this change exists to prevent.
