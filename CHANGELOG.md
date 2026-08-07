# Changelog

Notable changes to hyper-markdown, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) with the usual `0.x`
caveat: **the format itself may change between minor versions.** Until `1.0`,
treat a minor bump as potentially breaking for `.hmd` sources, not only for the
Python API.

## [Unreleased]

## [0.1.0] — 2026-08-08

First public release. Everything below is new; there is nothing to compare it
against.

### The format

- **Six owned constructs** on top of GitHub-flavored markdown: wikilinks,
  aliased links, heading links, block anchors, block references, and the three
  embed forms. Everything else is ordinary GFM.
- **Deterministic resolution.** A bare name is resolved against explicit imports
  first, then the *spine* — this folder, then each folder above it, probed
  without recursion — then imported search paths, then a whole-tree sweep. A
  name can never reach sideways into a sibling namespace without an import.
- **Ambiguity is an error, not a tie-break.** If a name could mean two pages,
  the build says so rather than picking one.
- **Frontmatter** carries `tags`, `use`, `import`, and `nav`. Both import forms
  are supported: named with an alias, and star, which contributes a search path.
- **Folder notes.** `a/b/index.hmd` and `a/b.hmd` are two spellings of one page.

### The `hmd` command

- `hmd lint` — parse, resolve, and report. Sixteen rules with stable IDs, text
  or JSON output, `--strict` to count warnings as errors. Exit codes are pinned
  for CI: `0` clean, `1` diagnostics, `2` usage error.
- `hmd render PATH --to markdown|html` — expand embeds and rewrite resolved
  links. Embed depth is capped at 16 (`HMD008`) and cycles are reported
  (`HMD007`).
- `hmd graph` — the resolved link graph as JSON.
- `hmd info` — the resolved root and the discovery policy in force.
- `hmd --version`.
- Every command takes `--root` to override the namespace root, which otherwise
  comes from the `wiki` setting in `.hmd/config.toml` and defaults to
  `doc/wiki`. A `.hmd/` directory doubles as a project-root marker, so any
  subtree can be self-contained.

### Publishing

- A **MkDocs plugin**, registered through the `mkdocs.plugins` entry point and
  installed with the `mkdocs` extra. It registers `.hmd` files as pages, derives
  the nav from the namespace tree, expands embeds, and rewrites every wikilink
  to a source-relative link that MkDocs resolves and validates itself.
- A card at `a/b.hmd` serves at `a/b/`; cards sort by path, or by a `nav:`
  integer in their frontmatter.
- **A book with a wiki in it.** Point `docs_dir` at a documentation tree and the
  plugin's `root` at the subtree that is a namespace. An authored `nav` is used
  verbatim except where it names `hmd://wiki`, which is replaced by the derived
  wiki section.
- An unresolved link renders as a **red link** rather than failing the build, so
  a wiki stays publishable while it is still being written.
- `mkdocs serve` picks up `.hmd` edits — the plugin watches the namespace root,
  which MkDocs would otherwise ignore.
- Math, callouts, footnotes, and **D2 diagrams**. Diagrams render through the
  `d2` binary, which is not a Python dependency: without it a diagram degrades
  to its labelled source instead of failing the build. Rendered SVG reaches the
  page as a `data:` URI.

### Distribution

- Published to PyPI as `hyper-markdown`; `pip install "hyper-markdown[mkdocs]"`
  adds the site extra. Python 3.11 through 3.14.
- Two dependency ceilings, both deliberate and both carrying their reasons
  inline in `pyproject.toml`: `mkdocs>=1.6,<2`, because "MkDocs 2.0" is a
  ground-up rewrite with no plugin system — under it every card would vanish
  from the build rather than merely render worse — and `pygments<2.20`, which
  silently stops `pymdownx.superfences` from matching fences at all, turning
  every code block on every page into inline text while the build stays green.

### Known limitations

Deliberate, and tracked per proposal under `doc/proposals/HMD-NNNN/STATUS.md`:

- `hmd render --to markdown` is **one-way**. Erasure drops the embed boundary
  and the provenance of every link; it is a build product, not an interchange
  format.
- Indented code blocks are not masked, so a `[[link]]` inside one is seen as a
  link. `admonition` and `footnotes` both overload the four-space indent.
- The scanner is a hand-written masker rather than a CommonMark block parser, so
  divergence from CommonMark is possible and currently undetectable. A
  conformance corpus is the planned way to expose it.
- Links out of the namespace root are ordinary markdown links and are not
  checked by `hmd lint`. MkDocs reports them at `info`.
- There is no lint suppression syntax. A finding must be fixed or tolerated at
  the call site.

Both specifications — the format and the site — are still `drafted`. Expect the
format to move before `1.0`.

[Unreleased]: https://github.com/ewiger/hyper-markdown/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ewiger/hyper-markdown/releases/tag/v0.1.0
