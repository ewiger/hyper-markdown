# Hyper-markdown { .hmd-hero }

**Markdown is JavaScript. Hyper-markdown is TypeScript.**

Hyper-markdown (`.hmd`) is a strict, machine-checkable superset of Markdown for
knowledge bases you intend to keep. It adds one thing Markdown does not have: a
**graph** that a machine can check. Which page a name means, which block a
reference points at, which namespace a card belongs to — all decided by an
algorithm, not by a search box.

Every `.md` file is already valid `.hmd`. You adopt it one file at a time.

## The one idea

A folder is a namespace, and a name is resolved relative to where it is written:

```markdown
See [[tokens]] for the token format.
```

In `specs/auth/login.hmd`, `[[tokens]]` means `specs/auth/tokens.hmd` — the card
next to it. In `specs/billing/invoices.hmd`, the same three words mean whatever
`tokens` means *there*. A bare name searches the folder it was written in, then
each folder above it, and never sideways into a sibling namespace.

If a name could mean two pages, that is an **error**, not a coin flip:

```text
specs/auth/login.hmd:14:5: error[HMD002] [[tokens]] matches 2 pages; qualify it
  (candidates: shared/tokens.hmd, specs/auth/tokens.hmd)
```

This is the whole bet. A wiki that guesses is a wiki that quietly rots, because
a link that silently changes meaning is indistinguishable from one that did not.

## What you get

- **`hmd lint`** — parse, resolve, report. Sixteen rules with stable IDs, JSON
  output, and CI-usable exit codes. Useful before you render anything.
- **`hmd render`** — expand embeds and rewrite links into flat Markdown that any
  renderer reads.
- **A MkDocs plugin** — this site is built by it. The book you are reading is
  ordinary Markdown; the [wiki](wiki/README.md) section is generated from `.hmd`
  cards, and both are in one nav.

## Where to go next

1. [The format](public/format.md) — the six constructs the dialect owns.
2. [Namespaces](public/namespaces.md) — how a name becomes a page.
3. [Publishing](public/publishing.md) — building a book with a wiki inside it.
4. [The wiki](wiki/README.md) — the cards themselves, generated from `.hmd`.

## Status

Pre-release. The scanner, resolver, linter, embed expander, renderer, and MkDocs
plugin are implemented and tested. The specifications
([HMD-0001](proposals/HMD-0001/README.md),
[HMD-0002](proposals/HMD-0002/README.md)) are still `drafted`, and the format
will move before 1.0.
