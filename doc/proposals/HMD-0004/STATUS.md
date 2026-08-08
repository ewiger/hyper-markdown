# HMD-0004 — Status

Progress tracking for [HMD-0004](README.md): the hyper web, namespaces beyond
one tree.

**This file is the only place work against this proposal is tracked.** Not
the memos under `doc/memory/`, not the cards under `doc/wiki/`, not the
proposal itself. A decision that needs discussion is named here as an open
question and argued wherever it belongs; nothing else may hold a task list.
Update the row in the same commit that changes the code.

**Snapshot** (2026-08-08) — a stub, with the vocabulary now settled. A folder is
a **module**; a rooted tree of cards is a **namespace**, of which the project's
own tree is the default one; another namespace is reached by binding an ID to a
**provider**. Bindings live in `.hmd/config.toml` and nowhere else, which is a
security property as much as an ergonomic one. The `namespace:path` address form
stays reserved. No binding schema, no fetch mechanism, and no code exist. Every
work point below is blocked on how a binding is expressed, which is Q1.

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
| Q0.6 | Vocabulary settled, answering Q3: a folder is a module, a rooted tree is a namespace, and the project's own tree is the default namespace. HMD-0001 needed no amendment — its "namespace root" is the root of that default namespace | Motivation; Namespace: a named tree, not a folder |
| Q0.7 | Bindings fixed to `.hmd/config.toml` — granted and revoked in one reviewable file, never inferred from a link, never widened by a card. The key schema stays open | Namespace: a named tree, not a folder; Constraints on any resolution mechanism |
| Q0.8 | Provider abstraction opened beyond three shapes: a folder, a web server, a database, or anything answering "given a path, hand back a card". A web provider is expected to publish an `hmd.yaml` route configuration, whose specification is named and scoped out | What may provide a namespace |
| Q0.9 | `doc/public/namespaces.md` rewritten to teach module, namespace, path, and URL apart, with ordinary markdown URLs kept as the way to address anything that is not a card, and the unbuilt half marked per section. Closes W7 | Backwards Compatibility |

## TODO

### Planned work

Nothing is planned in the sense of "agreed and unbuilt" — the binding
mechanism is undecided, and everything below depends on it. Listed so the
shape is visible, not as a commitment.

| ID | Work point | Blocked on |
| --- | --- | --- |
| W1 | A binding schema — the keys that express "namespace ID X means this provider" in `.hmd/config.toml` | Q1 |
| W2 | Second-local-tree resolution: `bind()` against a second root once it has an ID | W1 |
| W3 | Remote namespace fetch/vendoring mechanism | Q4 |
| W4 | Resolver support for `namespace:` targets in `hmd lint` and `hmd render` | W1, W2 |
| W5 | HQL cross-namespace import, resolving HMD-0003's Q5 | W1 |
| W6 | Copy-edit the sentences that still say "namespace" where they mean a folder — four in HMD-0001, one in the repository `README.md`. Prose only; nothing they specify changes | nothing, and it is not a decision |

### Broken

Nothing. Nothing is built.

### Limitations

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | The record specifies no binding schema, only where a binding lives | Deliberate — naming the concepts, the address form, and the file is cheap now; a syntax chosen under-informed is expensive to reverse. See Q1 |
| L2 | Four sentences in HMD-0001 and one in the repository `README.md` still say "namespace" where they mean a folder | The word is settled and the public chapter teaches it, so what remains is a copy-edit rather than a disagreement. HMD-0001 needs no spec change: its "namespace root" is correct as written under the settled vocabulary. Tracked as W6 |
| L3 | Remote namespaces have no fetch, cache, or trust story at all | The vision (many small `.hmd` projects linkable by name) needs one, but committing to a mechanism before a second real project exists to link to would be designing against a sample size of zero |
| L4 | This may not be built inside the MVP line at all | HMD-0001 through HMD-0003 (grammar, rendering, queries) are more load-bearing for a single project's usefulness; namespaces beyond one tree only matter once there is more than one to link to |
| L5 | An unbound prefix is indistinguishable from a typo today: `[[design:tokens]]` parses as an ordinary bare name and produces the HMD001 red-link warning | Nothing reads the prefix yet, so there is nothing to raise a better diagnostic from. Whether a missing binding eventually becomes its own error is Q12 |

### Open questions and blockers

Q1 blocks every work point above; the rest block `drafted → accepted`.

**This table is the only copy.** [The record](README.md#open-questions)
points here rather than mirroring the list.

| ID | Question |
| --- | --- |
| Q1 | Which keys express a binding in `.hmd/config.toml`? The file is settled; the schema is not — one table per ID, and what distinguishes a folder from a URL from some third provider |
| Q2 | What characters are legal in a namespace ID, and how does `namespace:path` stay visually distinct from a bare name and from a literal URL scheme? |
| Q4 | What fetches/binds a remote namespace, when, and is the result always a pinned snapshot rather than a live fetch? |
| Q5 | What makes a namespace provider "dynamic," concretely — is a build tool like MkDocs already an instance, or does dynamic imply resolving at request time rather than build time? |
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
