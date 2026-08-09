# Namespaces

## TL;DR

`[[tokens]]` is a **name, not a path**. It is looked up in the card's own
folder, then in each folder above it up to the root, each probed without
recursion — so a bare name reaches its own folder or one above it, never
sideways into a sibling. Resolution runs in a fixed order and stops at the first hit: named
imports, then that spine walk, then each `from … import *` origin in declaration
order, then one sweep of the whole tree.

The sweep is the strict phase. Two matches is `HMD002`, an error asking you to
qualify the link rather than a tie-break to memorise. Qualify with `[[./tokens]]`
against the card's own folder or `[[/shared/tokens]]` against the root; nothing
may escape the root (`HMD003`). A folder's `index.hmd` is its folder note,
addressed by either name and served at one URL. `import x as y` binds one page to
one name and beats the spine; `import *` only adds a search origin *after* it —
so adding `import *` can resolve links that were previously red, and can never
change what an already-working link means. A link to a page not yet written stays
a warning.

Four words carry the rest of the chapter. A **module** is a folder. A
**namespace** is a named tree of cards — you already have one, and a prefix is
how a link reaches another. A **path** is what you write inside a namespace when
a name is not enough. A **URL** is everything else on the web, addressed by
ordinary markdown that hyper-markdown never touches.

## Four words: module, namespace, path, URL

Four words, four different jobs. The rest of the page is easier to read once
they are apart.

### A module is a folder

It is a resolution boundary rather than something you declare: any folder of
cards is one by virtue of being a folder. Its job is to answer *where a bare
name is looked for* — here, then upward, never sideways. That is closer to how a
programming language treats a package than to how a wiki treats a directory, and
it is deliberate: a tree of cards should be read outward from where you are
standing.

### A namespace is a named tree of cards

A namespace is a whole rooted tree — every module in it, addressable as one
thing. The nearest familiar shapes are a Confluence space and a MediaWiki
interwiki prefix: a label in front of an address that says *which* tree the rest
of the address is resolved in.

You already have one. Your project's own tree is the **default namespace**,
unnamed because there is nothing yet to disambiguate it from. Its root is the
`wiki` setting of `.hmd/config.toml`, defaulting to `doc/wiki` and overridable
per command with `--root`; the MkDocs plugin names the same thing `root`. That
root is the whole world a link can reach today. Every rule below resolves inside
it and nothing resolves outside it: a target that would escape is `HMD003`, and
symlinks are not followed out of the tree. A repository is free to hold ordinary
Markdown outside the root; cards reach that with ordinary relative links, never
with `[[…]]`.

A namespace that is *not* yours works the same way from the inside — it is
someone else's rooted tree, with its own modules and its own root — and it
becomes reachable from your cards by being given a name in your configuration.
That is what the rest of this chapter builds toward, and it is the part that is
reserved rather than implemented.

One thing a namespace is deliberately **not**: a flat bag of pages. The
interwiki precedent is one namespace per wiki, holding long articles with no
structure between them. Hyper-markdown maps onto a filesystem of small cards in
nested folders, so a namespace keeps its tree — a prefix selects a tree, and the
path after it is a path through folders, not an article title.

### A path is what you write when a name is not enough

`[[./tokens]]` and `[[/shared/tokens]]` are paths — the first relative to the
card's own folder, the second absolute from the namespace root. A name is looked
up; a path is followed.

### A URL is everything else

Markdown's own link syntax is untouched and keeps every capability it has.
`[the spec](https://example.org/spec)` addresses any resource on the web, and a
card is free to link to a website, an issue tracker, a file in the repository
outside the namespace root, or a page on a site that has never heard of
hyper-markdown. Nothing in this chapter takes that away.

`[[…]]` is the other kind of address: hyper-markdown's own resource identifier,
for reaching *cards*. The two are worth keeping apart because they are checked
by different parties at different times.

| | `[[card]]` | `[text](https://…)` |
| --- | --- | --- |
| Addresses | a card, inside a namespace | any resource on the web |
| Resolved by | `hmd`, when you lint or build | the browser, when someone clicks |
| Checked | yes — missing, ambiguous, or escaping targets are reported | no |
| Survives a file move | yes, because a name is not a location | no |
| Understands folder notes, heading fragments, block anchors, embeds | yes | no |

So the rule of thumb is short: if it is a card, use `[[…]]` and let the
toolchain keep the link honest. If it is anything else, write a markdown link
and a URL.

A namespace prefix looks like a URL scheme and is not one. `shared:tokens` is
not dereferenced by a browser and carries no location; it names a tree that
*your project* has bound, and the binding is what knows where that tree lives.
The indirection is the point — the same way a package name outlives whichever
registry happens to host it, a namespace ID outlives the folder or server behind
it, and re-pointing it changes no link in any card.

## Resolving a bare name

Given `[[tokens]]` written in `specs/auth/login.hmd`, resolution runs four
phases and stops at the first hit:

```text
0. named imports     an explicit `from … import tokens` in this card
1. the spine         specs/auth/ , then specs/ , then the root
2. imported paths    each `from … import *` origin, in declaration order
3. autodiscovery     one sweep of the whole tree
```

Each directory is probed **non-recursively**. A bare name therefore means
exactly *"an import, or here, or a folder above me"* — it can never reach
sideways into a sibling module. This is the property that makes `[[logging]]`
in `specs/billing/` mean the general card rather than whatever `specs/auth/`
happens to contain.

Phase 3 is the convenience phase, and it is the strict one: if a sweep finds two
matches, that is `HMD002`, an error. All matches rank equally — a shallower one
does not beat a deeper one. The fix is to qualify the link, not to memorize a
tie-break.

## Qualifying a link

Four forms, from most local to most explicit. The first three ship; the fourth
is reserved, and the section on reaching another namespace says exactly what it
does today.

| Form | Resolved against |
| --- | --- |
| `[[tokens]]` | the four phases above |
| `[[./tokens]]`, `[[../billing/invoices]]` | the source file's own directory |
| `[[/shared/tokens]]` | the namespace root |
| `[[design:tokens]]` *(proposed)* | the root of the tree bound to `design` |

A target may never escape the root. `[[../../../../etc/passwd]]` is `HMD003`,
and symlinks are not followed out of the tree.

## Folder notes

A directory's `index.hmd` is its landing page. `[[specs/auth]]` and
`[[specs/auth/index]]` address the same card, and it serves at the same URL.
Two names for one page never become two pages.

## Imports

When the spine is not enough, say what you mean in the header:

```yaml
import:
  - from /shared import tokens as shared-tokens   # binds one name
  - from /glossary import *                       # adds a search origin
```

The two forms do different jobs, and the difference is the point:

- **`import x as y`** binds a single page to a single name. It beats the spine,
  because that is what it is for — it is the author pointing at one page.
- **`import *`** adds a directory to the list of origins a bare name is probed
  against, *after* the spine. It does not bind anything eagerly, so a card added
  to that directory later becomes reachable with no edit here.

That ordering gives a property worth stating plainly: **adding `import *` can
only resolve links that were previously red. It can never change what an
already-working link means.**

Imports do **not** inherit. An import in `index.hmd` binds names for that file
alone, because a bare name resolvable only by reading a file you never opened is
exactly the action-at-a-distance imports exist to remove.

A card's header is its declarative layer, and it is small on purpose: `tags`,
`use`, `import`, and `nav` are reserved for the toolchain, and every other key
stays yours, exposed but unexamined. Reach across a namespace is the same idea
one layer up — declared, never discovered — with one deliberate asymmetry: a
card may widen how its own names are looked up **inside** its tree, but only the
project may grant reach to a **different** tree. That is the subject of the next
three sections.

## Reaching another namespace *(proposed — [HMD-0004](../proposals/HMD-0004/README.md))*

A card names a page in another namespace by putting the namespace's name in
front of the path:

```text
design:tokens/color
```

The prefix selects the tree; everything after the colon is resolved inside that
tree by exactly the rules above — absolute from that tree's own root, with its
folder notes, its fragments, and its containment check. Nothing about
within-tree resolution is invented twice, and no rule already on this page
changes.

Two properties follow, and both are the reason the form is a name rather than a
location:

- **Rebinding does not change meaning.** If `design` moves from a folder on your
  disk to a server on the other side of the world, `design:tokens/color` is
  still the same address in every card that wrote it.
- **A prefix stays visibly a prefix.** `[[tokens]]` must never leave a reader
  wondering whether `tokens` is secretly a namespace name. Exactly which
  characters a namespace name may use is still open.

**What happens today:** a colon is not a reserved character in a link target, so
`[[design:tokens]]` currently parses as an ordinary bare name, matches no card,
and renders as a red link. `hmd lint` and `hmd render` do not treat the prefix
as a prefix, and the resolver performs no network access of any kind. What is
fixed so far is the shape of the address and the constraints any mechanism
behind it has to satisfy — not a mechanism.

## A namespace must be granted, not guessed *(proposed — [HMD-0004](../proposals/HMD-0004/README.md))*

A namespace name means nothing until the project says what it is bound to.
Bindings live in `.hmd/config.toml` — the configuration for the whole wiki
space, next to the root and the discovery policy that are already there:

```toml
wiki = "doc/wiki"                # the default namespace: this project's own tree

[namespaces.design]              # a second tree on this filesystem
folder = "../design-wiki"

[namespaces.upstream]            # a namespace served over HTTP
url = "https://wiki.example.org/"
```

That block is a **sketch, not a schema**. It shows where bindings live and what
they have to say — a name, and what answers for it — while the exact keys stay
undecided until there is a second real tree to link to.

What is *not* provisional is that the table is the only place a namespace can
come from. The reason is security first, ergonomics second:

- **A prefix is a permission.** The set of trees a build may read is fixed by
  configuration, in one file, reviewable in one diff. No card can widen it, and
  no link can introduce a namespace by mentioning one. An unbound prefix is not
  a lookup that should try harder; it is simply not addressable.
- **No silent dereference.** Linting or rendering a card that links into a
  remote namespace must never fetch anything as a side effect. Whatever
  mechanism eventually crosses the network does it as a visible step — a
  vendoring command, a pinned snapshot, an explicit flag.
- **Containment still applies on the far side.** A resolved target must lie
  inside whatever tree the namespace exposes. A namespace boundary is a second
  root, not an exemption from the escape check, and content fetched from someone
  else's project is untrusted input on arrival.
- **Determinism survives.** For a fixed set of bindings, the same inputs produce
  the same answer on every run and every machine — the property the local
  resolver already guarantees, carried one layer out.

Revocation follows from the same design: remove the binding and every link that
used it stops reaching, in one edit, without hunting through cards.

## What can provide a namespace *(proposed — [HMD-0004](../proposals/HMD-0004/README.md))*

Deliberately open-ended. A namespace is defined by what it answers, not by what
it is made of: given a path, hand back a card. Anything that can do that is a
**namespace provider**.

- **This project's own tree.** The default namespace, resolved off the local
  filesystem. This is the provider that exists today.
- **Another folder.** A second rooted tree on the same filesystem, or a checkout
  beside yours, given a name of its own. The smallest step outward, because
  resolution against a second root is the machinery that already ships.
- **A web server.** A namespace published by another project entirely. No new
  REST protocol is invented for this — HTTP is already there and does the job.
  What such a server adds is an `hmd.yaml` alongside its content: a route
  configuration, with rewrites, describing how card paths map onto what it
  serves, so a client can resolve against it without guessing its layout. That
  file is its own specification and is out of scope here.
- **A database, or anything else.** A content store, a generated tree, a service
  in front of something that was never a filesystem. The contract is small on
  purpose so that the list is never closed.

Whichever provider answers, a card's links do not change, and the resolution
rules on this page are the ones that apply once the tree is in hand. That is the
whole point of naming the tree instead of pointing at it.

## Red links are not errors

A link to a page that does not exist yet is a **warning**, not a failure. It
marks something worth writing later, renders as a red link, and keeps the build
green. A wiki is written over years; the toolchain should not demand you finish
it today.

## See also

- [HMD-0001](../proposals/HMD-0001/README.md) — the shipped half: the grammar,
  the resolution phases, the root, and the containment rule.
- [HMD-0004](../proposals/HMD-0004/README.md) — the reserved half: the prefixed
  address form, what a namespace provider must satisfy, and the open questions
  behind every mechanism sketched above.
- [Features](features.md) and [Vision](vision.md) — what this buys an author
  today, and where the many-trees idea is heading.

!!! tip "Read next"

    [The HMD Tutorial](../wiki/hmd-tutorial.hmd) — resolution is one chapter of
    it. The rest of the language is taught the same way, and the whole thing
    takes one sitting.
