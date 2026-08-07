# ⚡ hyper-markdown

[![PyPI](https://img.shields.io/pypi/v/hyper-markdown.svg)](https://pypi.org/project/hyper-markdown/)
[![Python versions](https://img.shields.io/pypi/pyversions/hyper-markdown.svg)](https://pypi.org/project/hyper-markdown/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ewiger/hyper-markdown/blob/main/LICENSE)
[![CI](https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml/badge.svg)](https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml)

Hyper-Markdown helps you build your own local wiki knowledge base.

It is a strict, machine-checkable markdown dialect: GitHub-flavored markdown
plus six linking constructs, resolved by a deterministic namespace algorithm and
checked by a linter with stable rule IDs. Ambiguity is an error, not a
tie-break — if `[[tokens]]` could mean two pages, the build tells you instead of
guessing.

## Install

```bash
pip install hyper-markdown       # or: uv pip install hyper-markdown
```

## Quickstart

Point `hmd` at a tree of `.hmd` cards and lint it:

```bash
hmd lint --root examples/small
```

```text
glossary/index.hmd:11:3: warning[HMD001] [[idempotency]] does not resolve to a page

0 error(s), 1 warning(s)
```

Exit codes are pinned for CI: `0` clean, `1` diagnostics, `2` usage error. Add
`--strict` to fail on warnings, `--format json` for machine-readable output.

## The format

A card is markdown with a frontmatter header. Names are resolved, not spelled
out as paths:

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

See [[shared-tokens#Rotation|the rotation window]], and embed one block
rather than restating it:

![[token#^definition]]
```

Resolution runs in phases: explicit imports first, then the **spine** (this
folder, then each folder above it, probed non-recursively), then imported search
paths, then a whole-tree sweep. A bare name means *"here, or a folder above
me"* — it can never reach sideways into a sibling namespace.

The six owned constructs are wikilinks, aliased links, heading links, block
anchors, block references, and the three embed forms. Everything else is
ordinary GFM, plus callouts, footnotes, math, and D2 diagrams.

## Commands

| Command | What it does |
| --- | --- |
| `hmd lint` | Parse, resolve, and report — all 16 rules, text or JSON |
| `hmd render` | Expand embeds and rewrite links, to flat markdown or HTML |
| `hmd graph` | Dump the resolved link graph as JSON |
| `hmd info` | Show the resolved root and discovery policy |

Each takes `--root` to override the namespace root, which otherwise comes from
the `wiki` setting in `.hmd/config.toml` (defaulting to `doc/wiki`). A `.hmd/`
directory doubles as the project root marker, so any subtree can be
self-contained.

## Publishing

A tree of cards builds as a MkDocs site. The plugin registers `.hmd` files,
derives the nav from the namespace tree, expands embeds, and rewrites every
wikilink to a real link:

```bash
pip install "hyper-markdown[mkdocs]"
mkdocs build --strict     # or: mkdocs serve
```

A card at `a/b.hmd` serves at `a/b/`, and so does a folder note at
`a/b/index.hmd` — two names for one page, one URL. Cards sort by path, or by a
`nav:` integer in their frontmatter. An unresolved link renders as a red link
rather than failing the build, so a wiki stays publishable while it is still
being written.

### A book with a wiki in it

The namespace does not have to be the whole site. Point `docs_dir` at a
documentation tree and `root` at the part of it that is a namespace: the book is
ordinary Markdown, the wiki is generated, and `hmd://wiki` says where the
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
  - The format: public/format.md
  - Wiki:
      - Overview: wiki/README.md
      - hmd://wiki          # ← the derived section lands here
```

An authored nav wins everywhere except where it names the wiki. Omit the
placeholder and your nav is used verbatim; omit `nav` entirely and the whole
thing is derived from the namespace tree.

This repository is its own example: [`doc/`](doc/) is the site
[`mkdocs.yml`](mkdocs.yml) builds, with [`doc/public/`](doc/public/) as the book
and [`doc/wiki/`](doc/wiki/) as the wiki section inside it.

## Example

[`examples/small/`](examples/small/) is a runnable wiki that exercises the spine
walk, both import forms, `use` inheritance, folder notes, and most of the
syntax. It lints with zero errors and exactly one deliberate warning — the red
link that shows what an unwritten page looks like.

## Status

Pre-release, and both specs are still `drafted`. The scanner, resolver, linter,
embed expander, renderer, and MkDocs plugin are implemented and covered by the
test suite. Expect the format to move before 1.0.

Progress is tracked per proposal, in a `STATUS.md` beside each one — what is
done, what is broken, which limitations are deliberate, and which questions are
still open:

- [HMD-0001 status](doc/proposals/HMD-0001/STATUS.md) — the format and the CLI
- [HMD-0002 status](doc/proposals/HMD-0002/STATUS.md) — the site

## Documentation

- [HMD-0001](doc/proposals/HMD-0001/README.md) — the normative specification:
  grammar, resolution algorithm, configuration, rule IDs
- [HMD-0001 worked examples](doc/proposals/HMD-0001/examples.md) — resolution
  tables and a syntax-coverage map for the fixture above
- [HMD-0002](doc/proposals/HMD-0002/README.md) — MkDocs book-mode rendering:
  URLs, nav, expansion, red links

## Development

```bash
uv venv
uv pip install -e ".[dev]"
python -m pytest
```

## License

MIT — see [LICENSE](LICENSE).
