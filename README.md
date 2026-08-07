<p align="center">
  <img src="https://raw.githubusercontent.com/ewiger/hyper-markdown/main/doc/wiki/assets/logo.svg" width="76" height="76" alt="">
</p>

<h1 align="center">hyper-markdown</h1>

<p align="center"><b>Markdown with a link that means something.</b></p>

<p align="center">
  <a href="https://pypi.org/project/hyper-markdown/"><img alt="PyPI" src="https://img.shields.io/pypi/v/hyper-markdown.svg"></a>
  <a href="https://pypi.org/project/hyper-markdown/"><img alt="Python versions" src="https://img.shields.io/pypi/pyversions/hyper-markdown.svg"></a>
  <a href="https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://ewiger.github.io/hyper-markdown/"><img alt="Documentation" src="https://img.shields.io/badge/docs-ewiger.github.io-ffb300"></a>
  <a href="https://github.com/ewiger/hyper-markdown/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
</p>

> **The simplicity of Markdown. The visual appeal of modern HTML.**

## Markdown already won

It is what a README is written in, what notes are kept in, what issues and pull
requests are argued in, and — since the machines started writing back — what an
AI chat answers in. It is the plain text everyone types without being told to.

What it never got is the part HTML had on its first day: a link that means
something, a page that can be made out of other pages, a document that is part
of a web rather than a file in a folder. Hyper-markdown (`.hmd`) adds exactly
that, and stops.

Every `.md` file is already valid `.hmd`. You adopt it one rename at a time, and
nothing you have written is ever wrong.

## A card

A **card** is one `.hmd` file: one idea, ordinary markdown, and links to its
neighbours. Open it anywhere — GitHub, an editor, `less`, a chat window — and it
reads fine.

```markdown
---
tags: [area/auth, status/accepted]
use: [autodiscovery]
import:
  - from /shared import tokens as shared-tokens
  - from /glossary import *
---

# Login

- `[[tokens]]` → the sibling card, found on the spine
- `[[shared-tokens]]` → `shared/tokens.hmd`, a named import under an alias
- `[[token]]` → `glossary/token.hmd`, via the imported search path

See [[shared-tokens#Rotation|the rotation window]], and embed one block rather
than restating it:

![[token#^definition]]
```

That is close to the whole surface. Six constructs are the dialect's own —
wikilinks, aliased links, heading links, block anchors, block references, and
the three embed forms — and everything else on the page is ordinary
GitHub-flavored markdown. Four frontmatter keys mean something to the toolchain:
`tags`, `use`, `import`, and `nav`. Every other key is yours, and nothing will
inspect it.

## Install

```bash
pip install hyper-markdown       # or: uv pip install hyper-markdown
```

## Sixty seconds

Point `hmd` at a tree of cards and lint it:

```bash
hmd lint --root examples/small
```

```text
glossary/index.hmd:11:3: warning[HMD001] [[idempotency]] does not resolve to a page

0 error(s), 1 warning(s)
```

Exit codes are pinned for CI: `0` clean, `1` diagnostics, `2` usage error. Add
`--strict` to fail on warnings, `--format json` for machine-readable output.

[`examples/small/`](examples/small/) is that runnable wiki. It exercises the
spine walk, both import forms, `use` inheritance, folder notes, and most of the
syntax, and it lints with zero errors and exactly one deliberate warning — the
red link above, showing what an unwritten page looks like.

## What you get

### Write a name, get a link

You do not write a path and you do not count `../` hops. You write the name of
the card you mean, and it is found for you: beside you first, then the folder
above, then above that. A card nearby wins over a card far away, which is what
lets a folder keep its own local vocabulary — `[[logging]]` written in the
billing folder means *your* logging card, not somebody else's.

### Say it once, use it everywhere

Put a `!` in front of any link and the content comes to you instead of you going
to it:

```markdown
![[glossary/token]]              the whole card
![[glossary/token#Rotation]]     one section of it
![[glossary/token#^definition]]  one named block
```

That last one is the sharp tool. Tag a single paragraph with a caret and a name,
and that paragraph is addressable on its own:

```markdown
A token is valid for exactly one rotation window. ^definition
```

Write the definition in one place; embed it in the API reference, the onboarding
page, and the incident runbook. Correct it once and all three are correct. Cards
stop being pages and start being parts.

### A folder is a module

Resolution runs in phases and stops at the first hit: explicit imports, then the
**spine** — this folder, then each folder above it, probed without recursion —
then imported search paths, then one sweep of the whole tree. A bare name
therefore means *"an import, or here, or a folder above me."* It can never reach
sideways into a sibling's namespace.

Reach a sibling on purpose with `[[/shared/tokens]]` and you are naming another
module rather than hoping a search finds it. That is closer to how a programming
language treats a package than to how a wiki treats a directory, and it is
deliberate: a tree of cards should be read outward from where you are standing.

### Ambiguity is an error, not a tie-break

A wiki that guesses is a wiki that quietly rots, because a link that silently
changes meaning is indistinguishable from one that did not. So the toolchain
refuses to guess:

```text
specs/auth/login.hmd:14:5: error[HMD002] [[tokens]] matches 2 pages; qualify it
  (candidates: shared/tokens.hmd, specs/auth/tokens.hmd)
```

The distinction the linter draws is a compiler's. A link to a page you have not
written yet is a **warning** — writing forward is how a wiki grows, so it
renders as a red link instead of breaking the build. An ambiguous or malformed
link is an **error**. Everything else about your prose is left entirely alone.

### The rich layer, bought rather than rebuilt

TeX mathematics, D2 diagrams, callouts, tables, task lists, footnotes,
strikethrough. None of these are hyper-markdown's own — they are the tier the
wider markdown world settled on, and the format assumes them present and renders
them as first-class content. That is why the feature list keeps growing while
the six owned constructs do not have to.

Diagrams go through the `d2` binary, which is deliberately not a Python
dependency: without it a diagram degrades to its own labelled source rather than
failing the build.

## Markdown is JavaScript. Hyper-markdown is TypeScript.

That is the shortest way to say what this is — a superset that adds structure a
machine can check, erases back down to the thing it extends, and is adopted one
file at a time.

```markdown
<!-- notes.md — valid markdown, and already valid hyper-markdown -->
Tokens rotate hourly. See [the token format](../shared/tokens.md).
```

```markdown
<!-- notes.hmd — the same file, with the graph filled in -->
Tokens rotate hourly. See [[tokens]], and here is the rule itself:

![[tokens#^rotation-rule]]
```

Rename the file and nothing breaks; the second version is what you get when you
decide the link is worth being checked. `hmd lint` is `tsc --noEmit`, and
`hmd render --to markdown` is compilation — one-way on purpose, because
flattening a card erases the embed boundary and the provenance of every link.
That is exactly right for something you are shipping and exactly wrong for
something you are still editing.

The argument in full is
[MD ↔ HMD interoperability](doc/wiki/md-hmd-interop.hmd).

## Publish it: a book with a wiki in it

Plain text in, a real website out. A tree of cards builds as a MkDocs site — the
plugin registers `.hmd` files, derives the nav from the namespace tree, expands
embeds, and rewrites every wikilink to a real link:

```bash
pip install "hyper-markdown[mkdocs]"
mkdocs build --strict     # or: mkdocs serve
```

The namespace does not have to be the whole site, and a wiki on its own is not
the interesting case — a **book with a wiki inside it** is. Point `docs_dir` at
a documentation tree and `root` at the part of it that is a namespace: the book
is hand-ordered markdown, the wiki is generated, and `hmd://wiki` says where the
generated section belongs in your nav.

```yaml
# mkdocs.yml
docs_dir: doc
plugins:
  - hyper-markdown:
      root: doc/wiki        # only this subtree is a namespace
exclude_docs: |
  *.hmd

nav:
  - Home: index.md
  - Introduction: public/introduction.md
  - Wiki:
      - Overview: wiki/README.md
      - hmd://wiki          # ← the derived section lands here
```

An authored nav wins everywhere except where it names the wiki. Omit the
placeholder and your nav is used verbatim; omit `nav` entirely and the whole
thing is derived from the namespace tree. A card at `a/b.hmd` serves at `a/b/`,
and so does a folder note at `a/b/index.hmd` — two names for one page, one URL.
Unresolved links render red rather than failing the build, so a wiki stays
publishable while it is still being written.

**[ewiger.github.io/hyper-markdown](https://ewiger.github.io/hyper-markdown/) is
that build.** This repository is its own example: [`doc/`](doc/) is the site
[`mkdocs.yml`](mkdocs.yml) produces, with [`doc/public/`](doc/public/) as the
book and [`doc/wiki/`](doc/wiki/) as the wiki section inside it.

## Commands

| Command | What it does |
| --- | --- |
| `hmd lint` | Parse, resolve, and report — all 16 rules, text or JSON |
| `hmd render` | Expand embeds and rewrite links, to flat markdown or HTML |
| `hmd graph` | Dump the resolved link graph as JSON |
| `hmd info` | Show the resolved root and discovery policy |
| `hmd --version` | Print the installed version |

Each takes `--root` to override the namespace root, which otherwise comes from
the `wiki` setting in `.hmd/config.toml` (defaulting to `doc/wiki`). A `.hmd/`
directory doubles as the project root marker, so any subtree can be
self-contained.

## Where this is going

Three lines of work. Two of them are records rather than code, written down so
the shape is fixed before anything implements it:

- **HQL, the Hyper Query Language.** A card that *computes* its content from the
  graph instead of listing it by hand — every card tagged `area/backend`, every
  page linking here. [HMD-0003](doc/proposals/HMD-0003/README.md) reserves the
  name and fixes the constraints any grammar must satisfy, and deliberately
  specifies no syntax.
- **The hyper web.** Today a namespace is one local tree. The form
  `namespace:path/to/card` names a place to look up front, and what answers for
  that ID is a server that speaks hyper-markdown — which need not stay local,
  static, or singular. [HMD-0004](doc/proposals/HMD-0004/README.md) fixes what a
  module is, what a namespace is, and why the two are not the same thing. No
  binding syntax and no wire protocol yet.
- **A VS Code extension**, in TypeScript on the `feat/vsc-ext` branch. Its
  load-bearing difference from a published site is that a preview *keeps* the
  embed boundary — content that arrived from another card is shown as visibly
  embedded, with its source attached. Python stays canonical for the semantics;
  the specification and its conformance corpus are the contract between the two.

## Status

The format and the site are both specified, implemented, and covered by the test
suite: scanner, resolver, linter, embed expander, renderer, and MkDocs plugin.
All four proposals are still `drafted` and the format will move before `1.0` —
until then treat a minor bump as potentially breaking for `.hmd` sources, not
only for the Python API. What each release changed, and what is deliberately not
implemented, is in [CHANGELOG.md](CHANGELOG.md).

Progress is tracked per proposal, in a `STATUS.md` beside each one — what is
done, what is broken, which limitations are deliberate, and which questions are
still open:

- [HMD-0001](doc/proposals/HMD-0001/STATUS.md) — the format and the CLI
- [HMD-0002](doc/proposals/HMD-0002/STATUS.md) — the site
- [HMD-0003](doc/proposals/HMD-0003/STATUS.md) — HQL
- [HMD-0004](doc/proposals/HMD-0004/STATUS.md) — the hyper web

## Documentation

Start with the book, published at
[ewiger.github.io/hyper-markdown](https://ewiger.github.io/hyper-markdown/):

- [Introduction](doc/public/introduction.md) — the format at a glance
- [Features](doc/public/features.md) — what a page can be, shown working
- [Namespaces](doc/public/namespaces.md) — how a name becomes a page
- [Presentation](doc/public/presentation.md) — one card, many formats and viewers
- [The hyper-markdown language](doc/wiki/hmd-lang-specification.hmd) — every
  construct, start to finish; read it once and you can write the format

The normative records live under [`doc/proposals/`](doc/proposals/).
[HMD-0001](doc/proposals/HMD-0001/README.md) is the specification — grammar,
resolution algorithm, configuration, rule IDs — with
[worked examples](doc/proposals/HMD-0001/examples.md) beside it, and
[HMD-0002](doc/proposals/HMD-0002/README.md) covers book-mode rendering.

## Development

```bash
uv venv
uv pip install -e ".[dev,mkdocs]"
python -m pytest
```

[DEVELOP.md](DEVELOP.md) is the contributor's guide: the gates CI applies, how
the documentation tree is organised, where progress is tracked, and how the site
is published.

## License

MIT — see [LICENSE](LICENSE).
