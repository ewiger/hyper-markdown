# Namespaces

## TL;DR

`[[tokens]]` is a **name, not a path**. It is looked up in the card's own
folder, then in each folder above it up to the root, each probed without
recursion — so a bare name reaches you or your parents, never sideways into a
sibling. Resolution runs in a fixed order and stops at the first hit: named
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

Two words carry most of the weight and are easy to confuse. A **module** is a
folder: the boundary a bare name cannot cross sideways. A **namespace** is the
rooted tree that resolution happens inside — and, in the direction the project is
heading, a served identity a card can name from outside as
`namespace:path/to/card`.

## Module, namespace, path

Three words, three different jobs. The rest of the page is easier to read once
they are apart.

**A module is a folder.** It is a resolution boundary rather than something you
declare: any folder of cards is one by virtue of being a folder. Its job is to
answer *where a bare name is looked for* — here, then upward, never sideways.
That is closer to how a programming language treats a package than to how a wiki
treats a directory, and it is deliberate: a tree of cards should be read outward
from where you are standing.

**A namespace is the rooted tree those modules live in.** One root, configured
once — `root: doc/wiki` in this project — and it is the whole world a link can
reach. Every rule below resolves inside it and nothing resolves outside it: a
target that would escape is `HMD003`, and symlinks are not followed out of the
tree. A repository is free to hold ordinary Markdown outside the root; cards
reach that with ordinary relative links, never with `[[…]]`.

**A path is what you write when a name is not enough.** `[[./tokens]]` and
`[[/shared/tokens]]` are paths — the first relative to the card's own folder, the
second absolute from the namespace root. A name is looked up; a path is followed.

### The word "namespace" is doing two jobs

This chapter, [HMD-0001](../proposals/HMD-0001/README.md), and the implementation
all use *namespace* for the rooted tree above. The same word has also been used
for a module — "a folder is a namespace" — which is where the confusion starts.

[HMD-0004](../proposals/HMD-0004/README.md) needs the word for a third thing: a
**served identity**. There, a namespace is an ID bound to whatever answers for it
— something able to resolve and serve hyper-markdown, local or remote, static or
dynamic — and a card names a page inside one by putting the ID in front of the
path:

```text
namespace:path/to/card
```

Once the ID resolves to a server and its tree, the remainder of the address
resolves inside that tree by exactly the rules on this page. Nothing about
within-tree resolution is invented twice. This project's own site is already an
unnamed instance of that shape: a build serving the default namespace out of a
local tree.

The form is **reserved, not implemented**. There is no binding syntax, no fetch
mechanism, and no wire protocol; `hmd lint` and `hmd render` do not resolve a
`namespace:` target, and the resolver performs no network access at all. What the
proposal fixes is the shape and the constraints any future mechanism has to
satisfy — determinism for a fixed set of bindings, a fetch that is explicit
rather than a side effect of linting, and a containment check against whatever
tree a namespace exposes.

Which vocabulary eventually wins is undecided. HMD-0004 calls a folder a *module*
and keeps *namespace* for the served identity; this chapter and HMD-0001 still
describe the behaviour that ships. Whether those documents are ever amended to
match is an open question in [HMD-0004](../proposals/HMD-0004/README.md), left
unanswered on purpose rather than settled quietly here.

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

Three forms, from most local to most explicit:

| Form | Resolved against |
| --- | --- |
| `[[tokens]]` | the four phases above |
| `[[./tokens]]`, `[[../billing/invoices]]` | the source file's own directory |
| `[[/shared/tokens]]` | the namespace root |

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

## Red links are not errors

A link to a page that does not exist yet is a **warning**, not a failure. It
marks something worth writing later, renders as a red link, and keeps the build
green. A wiki is written over years; the toolchain should not demand you finish
it today.
