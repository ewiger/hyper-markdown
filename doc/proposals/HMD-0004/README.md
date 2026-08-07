# HMD-0004: The hyper web — namespaces beyond one tree

**Status**: drafted
**Created**: 2026-08-07

## Abstract

This proposal names the layer that sits outside a single project's own tree of
cards, and it needs two concepts to do it, not one. A **module** is what
[HMD-0001](../HMD-0001/README.md) §4–§5 already builds — a folder acting as a
resolution boundary a bare name cannot cross sideways — given its own name
here because the resolver's own text currently calls that same thing a
"namespace," and this record needs that word for something else. A
**namespace**, in this record, is a served identity: a namespace ID bound to
whatever server answers for it — static or dynamic, local or remote — capable
of resolving and serving hyper-markdown content for that ID. A card names a
page in another namespace with the form `namespace:path/to/card`, a namespace
ID in front of the path resolution HMD-0001 already defines. The binding from
an ID to a server MAY be a fixed table today and something far more elaborate
later; this record deliberately leaves that open. It specifies no binding
syntax, no fetch mechanism, and no wire protocol. It fixes what a module is,
what a namespace is, that the two are not the same thing, and the constraints
any future mechanism for either must satisfy.

## Motivation

Hyper-markdown is named for hypertext, and a single tree resolved against
itself is not yet hypertext in the sense the name claims — it is one document
with good internal cross-references, not a web of documents. Three things push
this record to exist now, even unbuilt:

- **A word is doing two jobs.** [HMD-0001](../HMD-0001/README.md) and
  [Namespaces](../../public/namespaces.md) already use *namespace* for a
  folder's resolution scope — "a folder is a namespace" is the first line of
  that chapter. This record needs a different concept at a different layer: a
  served identity, not a resolution scope. Reusing one word for both would
  make every future sentence about either one ambiguous, so this record calls
  the folder-scoped concept a **module** and reserves *namespace* for the new
  layer. The two shipped documents still say "namespace" for what this record
  calls "module" — that collision is named here, not silently resolved; see
  Non-goals and Open Questions.
- **The gap is not hypothetical.** HQL's own tracker already asks how a query
  imports from another namespace, with no answer available because no such
  namespace has been defined anywhere in the project. See
  [HMD-0003 Q5](../HMD-0003/STATUS.md#open-questions-and-blockers).
- **The shape matters as much as the existence.** The obvious precedent for
  cross-project linking is MediaWiki's interwiki namespace — one flat
  namespace per wiki, long articles rather than folders. That is the wrong
  model here. This project maps directly onto a filesystem of small `.hmd`
  files in nested folders — closer to a Confluence space than a Wikipedia
  namespace — and the addressing scheme has to stay that pragmatic and that
  filesystem-shaped, or it stops matching how the format is actually written.

## Goals

- Separate **module** (a folder's resolution boundary) from **namespace** (a
  served identity), and name the collision with HMD-0001's existing use of
  "namespace" explicitly rather than let two meanings coexist unremarked.
- Fix one address form — `namespace:path` — so other work can cite it instead
  of inventing its own.
- State the constraints any namespace-binding or namespace-serving mechanism
  must satisfy, ahead of designing that mechanism.

## Non-goals

- **No binding mechanism.** How a project declares "the ID `shared` means this
  server" is not decided here — see Open Questions.
- **No wire protocol, no fetch mechanism, no caching or vendoring story** for a
  namespace backed by a remote server.
- **No change to resolution inside one module.** Every rule in
  [HMD-0001](../HMD-0001/README.md) §4–§5 stands exactly as written; this
  record adds an orthogonal address form, not a replacement.
- **No renaming of the shipped documents.** [HMD-0001](../HMD-0001/README.md)
  and [Namespaces](../../public/namespaces.md) keep saying "namespace" for a
  folder's resolution scope. Whether that prose is ever amended to say
  "module" instead is a separate, later decision — this record introduces its
  own vocabulary and flags the collision; it does not rewrite text describing
  shipped, implemented behavior.
- **No commitment on how elaborate the ID-to-server binding becomes.** A
  static table and something as elaborate as content-addressed storage are
  both left open; this record commits to neither.
- **No authentication, availability, or trust model** for a namespace's
  server. Those are real questions once a mechanism exists and are out of
  scope for a record that only reserves the shape.

## Specification

### Module: this record's word for a folder's resolution scope

A module is exactly what [HMD-0001](../HMD-0001/README.md) §4–§5 and
[Namespaces](../../public/namespaces.md) already build: a folder acting as a
boundary a bare name cannot cross sideways, an `index.hmd` speaking for it,
and `import` reaching across it on purpose. Nothing about that mechanism
changes here — this record only gives the concept a name that does not
collide with the one below. Every existing rule about resolution, containment,
and import continues to apply to a module exactly as written today.

### Namespace: a served identity, not a folder

A namespace is a name — a namespace ID — bound to whatever server answers for
it: something able to resolve and serve hyper-markdown content for that ID,
static or dynamic. A project's own published site is already an unnamed
instance of this: its MkDocs build is a static-enough server, resolving and
serving the default namespace out of the project's own module tree — the
right tool for exactly that job today. What this record adds is that the
binding does not have to be singular, local, or fixed:

- A namespace ID MUST be bound explicitly, by the project, never inferred
  from a link. This is the same principle that makes `import` a statement
  rather than a search, applied one layer up.
- The binding from an ID to a server MAY be **static** — a fixed table mapping
  an ID to a location — or **dynamic** — resolved at request or build time by
  something that understands hyper-markdown well enough to serve it. Both
  satisfy the same address form; which one backs a given ID is a deployment
  detail a card's links never need to know.
- Rebinding a namespace ID to a different server MUST NOT change the meaning
  of a link that names it. `namespace:path/to/card` stays the same text
  whether the namespace behind it moved from a static host to a dynamic
  resolver — the indirection is the point, the way a package name outlives
  the particular registry that happens to host it today.

### The address form

A card refers to a page in a bound namespace with the namespace ID named up
front, separated from the path by a colon:

```text
namespace_ref := namespace ":" page_ref
namespace     := segment
```

- `namespace:path/to/card` names the page `path/to/card` inside whatever
  module tree the server for `namespace` serves. This is the one syntactic
  form this record fixes. Once `namespace` resolves to a server and that
  server's tree, resolving `path/to/card` inside it reuses `page_ref` exactly
  as [HMD-0001](../HMD-0001/README.md) §2 already defines it — nothing about
  within-tree resolution is invented twice.
- The existing absolute (`/path`), relative (`./path`), and bare (`path`)
  forms of HMD-0001 §2 are unaffected. `namespace:path` is an additional,
  orthogonal form, not a replacement, and it MUST remain visually
  distinguishable from a bare name — a reader seeing `[[tokens]]` must never
  wonder whether `tokens` is secretly a namespace ID. The exact character
  rules that guarantee this are open; see Open Questions.

### What a namespace's server may be

This record deliberately widens the question rather than answering it,
because the shapes below need very different amounts of missing machinery:

- **This project's own build.** The default namespace, served today by
  MkDocs out of the local module tree, with no ID needed because there is
  nothing yet to disambiguate it from.
- **A second local tree.** A server serving a different rooted module tree on
  the same filesystem, bound to its own namespace ID. Nearly free: `bind()`
  ([HMD-0001](../HMD-0001/README.md) §5.1) run against a second root, once
  that root has an ID.
- **A remote server.** A namespace served by another project entirely, at a
  URL it publishes, static or dynamic. This is the shape the vision is
  reaching for — many small `.hmd` projects, each its own namespace, linkable
  by name instead of copied into your own tree — and the shape with no fetch
  mechanism, no caching story, and no trust model defined anywhere yet.
- All three MUST resolve through the one address form above, so a card's
  links do not have to change if what backs a namespace ID later changes.

### Constraints on any resolution mechanism

Stated now, independent of syntax, so that whatever mechanism eventually binds
a namespace ID to a server is built inside these rules rather than around
them — the same move [HMD-0001](../HMD-0001/README.md) made by fixing
determinism before the resolver that had to satisfy it existed.

- Resolution MUST be deterministic for a fixed set of namespace bindings: the
  same inputs produce the same answer on every run, on every machine. This is
  HMD-0001's determinism principle applied to a namespace that is not the
  project's own.
- A remote namespace's server MUST NOT be dereferenced silently.
  [HMD-0001](../HMD-0001/README.md) pins "no network access" for the MVP
  resolver; any mechanism that fetches from a remote namespace crosses that
  boundary and MUST do so as an explicit, visible step — a pinned snapshot, a
  vendoring command, an explicit build flag — never as a side effect of
  linting or rendering a card that happens to link there.
- A namespace binding MUST be declared by the project, never inferred from a
  link. `namespace:path` written in prose means nothing until the project says
  what `namespace` is bound to — the same principle that makes `import` a
  statement rather than a search.
- A resolved target MUST still satisfy the containment check of
  [HMD-0001](../HMD-0001/README.md) §4, against whatever module tree the
  namespace's server exposes, even when that tree is not the project's own
  root. A namespace boundary is a second root, not an exemption from the
  escape check.

## Backwards Compatibility

Nothing existing changes meaning. `namespace:path` introduces a colon inside a
link target, a character HMD-0001's grammar does not reserve today — a target
containing one currently falls through as an ordinary bare name and, absent a
card coincidentally titled with a literal colon in it, resolves to nothing and
renders as a red link. The new form is additive: it gives that previously
meaningless shape a meaning, and changes no link that resolves today. The
module/namespace vocabulary split is likewise additive prose — it changes no
shipped document; see Non-goals.

## Security Considerations

A remote namespace is the first construct this project would define that
crosses a trust boundary, and it inherits the resolver's existing surface
before it adds a new one:

- Once fetched, a remote namespace's content is untrusted input. The
  containment check above applies to it exactly as to a local root and MUST
  NOT be relaxed because the source is "someone else's project" — trust is a
  governance question, decided by whoever configures the binding, not a
  parser exemption.
- Fetching from a remote namespace would be the first network-touching
  operation this project defines anywhere. Whatever mechanism eventually
  performs it needs its own resource bounds and its own security review; this
  record only fixes that the fetch must be explicit and never silent — see
  *Constraints on any resolution mechanism* above.

## Open Questions

Every mechanism question is open by design. They are tracked in
[STATUS.md](STATUS.md#open-questions-and-blockers) and only there, following
the same departure from `TEMPLATE.md` that [HMD-0003](../HMD-0003/README.md)
took: a list mirrored in two files drifts, and then neither copy can be
trusted without opening both.

## See also

- [STATUS.md](STATUS.md) — work points, limitations, and the open questions.
- [HMD-0001](../HMD-0001/README.md) — the module boundary (called "namespace"
  there), containment check, and `import` mechanism this record builds on and
  extends outward.
- [HMD-0003](../HMD-0003/README.md), specifically
  [Q5 of its tracker](../HMD-0003/STATUS.md#open-questions-and-blockers) — the
  cross-namespace query question this record's binding mechanism, once
  designed, is expected to answer.
- [Namespaces](../../public/namespaces.md) — the within-module resolution
  rules that `namespace:path` reuses once a namespace ID resolves to a server.

## Changelog

- 2026-08-07: drafted as a stub — the module/namespace split, the
  `namespace:path` address form, and the constraints on any future binding or
  fetch mechanism reserved; no binding syntax and no code specified.
