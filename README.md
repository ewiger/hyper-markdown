# 🔗 hyper-markdown

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
| `hmd graph` | Dump the resolved link graph as JSON |
| `hmd info` | Show the resolved root and discovery policy |

Each takes `--root` to override the namespace root, which otherwise comes from
the `wiki` setting in `.hmd/config.toml` (defaulting to `doc/wiki`). A `.hmd/`
directory doubles as the project root marker, so any subtree can be
self-contained.

## Example

[`examples/small/`](examples/small/) is a runnable wiki that exercises the spine
walk, both import forms, `use` inheritance, folder notes, and most of the
syntax. It lints with zero errors and exactly one deliberate warning — the red
link that shows what an unwritten page looks like.

## Status

Pre-release, and the spec is still `drafted`. The scanner, resolver, and linter
are implemented and covered by the test suite; `hmd render` and the MkDocs
plugin are planned. Expect the format to move before 1.0.

## Documentation

- [HMD-0001](doc/proposals/HMD-0001/README.md) — the normative specification:
  grammar, resolution algorithm, configuration, rule IDs
- [HMD-0001 worked examples](doc/proposals/HMD-0001/examples.md) — resolution
  tables and a syntax-coverage map for the fixture above

## Development

```bash
uv venv
uv pip install -e ".[dev]"
python -m pytest
```

## License

MIT — see [LICENSE](LICENSE).
