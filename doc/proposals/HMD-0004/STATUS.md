# HMD-0004 — Status

Progress tracking for [HMD-0004](README.md): the hyper web, namespaces beyond
one tree.

**This file is the only place work against this proposal is tracked.** Not
the memos under `doc/memory/`, not the cards under `doc/wiki/`, not the
proposal itself. A decision that needs discussion is named here as an open
question and argued wherever it belongs; nothing else may hold a task list.
Update the row in the same commit that changes the code.

**Snapshot** (2026-08-07) — a stub. The record splits "module" (a folder's
resolution scope, HMD-0001's existing "namespace") from "namespace" (a served
identity: an ID bound to whatever server resolves and serves it, static or
dynamic), and reserves the `namespace:path` address form. No binding
mechanism, no fetch mechanism, and no code exist. Every work point below is
blocked on how a namespace ID is bound, which is Q1.

This depends on HMD-0001's module boundary and containment rules
(../HMD-0001/STATUS.md), and touches the same open question HMD-0003 already
surfaced (Q5) about cross-namespace imports for HQL.

## Done

Nothing is implemented. The record itself is the only deliverable so far.

| ID | Work point | Spec |
| --- | --- | --- |
| Q0.1 | "Module" and "namespace" split into two concepts, and the collision with HMD-0001's existing use of "namespace" named explicitly | Motivation |
| Q0.2 | Namespace defined as a served identity — an ID bound to a static or dynamic server — not a tree of cards | Namespace: a served identity, not a folder |
| Q0.3 | Address form fixed: `namespace:path/to/card`, orthogonal to the existing absolute/relative/bare forms | The address form |
| Q0.4 | Three server shapes distinguished — this project's own build, a second local tree, a remote server — all resolving through one address form | What a namespace's server may be |
| Q0.5 | Determinism, explicit fetch, and containment constraints stated ahead of any mechanism | Constraints on any resolution mechanism |

## TODO

### Planned work

Nothing is planned in the sense of "agreed and unbuilt" — the binding
mechanism is undecided, and everything below depends on it. Listed so the
shape is visible, not as a commitment.

| ID | Work point | Blocked on |
| --- | --- | --- |
| W1 | A binding mechanism — how a project declares "namespace ID X means this server" | Q1 |
| W2 | Second-local-tree resolution: `bind()` against a second root once it has an ID | W1 |
| W3 | Remote namespace fetch/vendoring mechanism | Q4 |
| W4 | Resolver support for `namespace:` targets in `hmd lint` and `hmd render` | W1, W2 |
| W5 | HQL cross-namespace import, resolving HMD-0003's Q5 | W1 |
| W6 | Decide whether HMD-0001 and `doc/public/namespaces.md` are ever amended from "namespace" to "module" | Q3 |
| W7 | Second pass over the *Module, namespace, path* section of `doc/public/namespaces.md`. It now teaches all three words and names the collision, but it was written against a vocabulary Q3 has not settled, so which term the chapter leads with is provisional | Q3 |

### Broken

Nothing. Nothing is built.

### Limitations

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | The record specifies no binding mechanism | Deliberate — naming the concepts and the address form is cheap now; a binding syntax chosen under-informed is expensive to reverse. See Q1 |
| L2 | HMD-0001 still calls a module a "namespace". `doc/public/namespaces.md` now defines module, namespace, and path separately and names the collision in the open, but it leads with the shipped wording rather than this record's | The collision is named, not fixed, in this record. Rewriting shipped spec text describing implemented behavior is a separate, later decision — see Q3 and W7 |
| L3 | Remote namespaces have no fetch, cache, or trust story at all | The vision (many small `.hmd` projects linkable by name) needs one, but committing to a mechanism before a second real project exists to link to would be designing against a sample size of zero |
| L4 | This may not be built inside the MVP line at all | HMD-0001 through HMD-0003 (grammar, rendering, queries) are more load-bearing for a single project's usefulness; namespaces beyond one tree only matter once there is more than one to link to |

### Open questions and blockers

Q1 blocks every work point above; the rest block `drafted → accepted`.

**This table is the only copy.** [The record](README.md#open-questions)
points here rather than mirroring the list.

| ID | Question |
| --- | --- |
| Q1 | How is a namespace ID bound to its server — an extension of `import:`, or its own project-level table? |
| Q2 | What characters are legal in a namespace ID, and how does `namespace:path` stay visually distinct from a bare name and from a literal URL scheme? |
| Q3 | Does "module" formally replace "namespace" in HMD-0001 and `doc/public/namespaces.md`, or do those documents keep their current wording while this record's vocabulary stays scoped to itself and future work? |
| Q4 | What fetches/binds a remote namespace, when, and is the result always a pinned snapshot rather than a live fetch? |
| Q5 | What makes a namespace server "dynamic," concretely — is a build tool like MkDocs already an instance, or does dynamic imply resolving at request time rather than build time? |
| Q6 | Should a second local tree ship before a remote server, as the smaller first step? |
| Q7 | Does a remote namespace's own containment root compose with the importing project's — can a two-hop reference exist at all? |
| Q8 | Does this resolve HMD-0003's Q5 (cross-namespace query import), or stay independent of it? |
| Q9 | Does `hmd lint` ever need network access to validate a remote link, or does it only ever validate against a local snapshot? |
| Q10 | Is `namespace:path` the final address form, or does a namespace ID eventually need to be more URL-shaped once a real transport exists, rather than a bare token? |
| Q11 | How far does the ID-to-server binding go — is a static table enough indefinitely, or does the vision genuinely need something as elaborate as content-addressed storage, and if so, when does reaching for that stop being premature? |

## Gates

None. There is nothing to run.

## Changelog

- 2026-08-07: drafted alongside [the record](README.md). Stub — the
  module/namespace split and the `namespace:path` address form reserved,
  binding mechanism undesigned, no code.
- 2026-08-08: W7 added and L2 narrowed. `doc/public/namespaces.md` gained a
  section defining module, namespace, and path apart from each other, stating
  that `namespace:path` is reserved rather than implemented, and pointing at Q3
  for which vocabulary eventually wins. No mechanism changed.
