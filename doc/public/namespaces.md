# Namespaces

A folder is a namespace. That sentence carries the whole resolution algorithm,
so it is worth being precise about what it buys and what it costs.

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
sideways into a sibling namespace. This is the property that makes `[[logging]]`
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
