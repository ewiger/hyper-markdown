# HMD-0002: MkDocs book-mode rendering

**Status**: drafted
**Created**: 2026-08-06
**Source**: [HMD-0001 §9](../HMD-0001/README.md), open questions 8 and 9

## Abstract

This proposal maps a hyper-markdown namespace onto a MkDocs site. It pins the
output URL for a card, derives the nav from the namespace tree with an optional
`nav` frontmatter key, fixes embed expansion at `on_page_markdown` so the `toc`
extension sees the finished document, and defines how unresolved links and plain
`.md` files behave in a build. It adds `hmd render` and the embed expander that
the plugin depends on. Wiki mode, backlinks, and generated pages stay out.

## Motivation

`hmd lint` proves a tree resolves; it does not produce anything a reader can
use. MkDocs is the shortest path from a linted tree to a site, and the plugin is
small because §5 already decided every link's destination.

The gap is that a resolver answers *which file* a name means, and a site needs
*which URL*. Nothing in HMD-0001 answers that, so the plugin cannot be written
without deciding it here.

## Goals

- One card maps to one stable URL, and a link rewrite is pure arithmetic on it.
- Nav order is derived by default and declarable when the default is wrong.
- A tree with red links still builds green.

## Non-goals

- Wiki mode, backlinks, category and special pages, health reports.
- Templates, queries, and the plugin API.
- Round-tripping flat markdown back into `.hmd`. Sketched, without consequence
  for this proposal, in [`md-hmd-interop`](../../wiki/md-hmd-interop.hmd).

## Specification

### 1. Output URLs

- A card at root-relative `a/b.hmd` MUST render to `a/b/index.html`, served at
  `a/b/`. A folder note `a/b/index.hmd` MUST render to the same URL, since
  §5.1 already makes the two names address the same page.
- The plugin MUST therefore require `use_directory_urls: true`, and MUST fail
  the build with a usage error otherwise rather than emitting links it knows are
  wrong.
- Link rewriting MUST emit a relative path from the source page's URL to the
  target's, so a site is servable from a subdirectory.
- A fragment MUST be appended unchanged; §3 of HMD-0001 already guarantees the
  slug the resolver matched is the slug the renderer emits.

### 2. Nav

- Nav MUST be derived from the namespace tree. A directory becomes a section,
  its `index.hmd` becomes that section's landing page, and cards become entries.
- Default order within a directory is folder notes first, then cards sorted by
  root-relative POSIX path. Deterministic, and stable under filesystem
  iteration order (P1).
- A fourth reserved frontmatter key, **`nav`**, MAY carry an integer. Cards with
  `nav` sort ahead of cards without, ascending; ties fall back to the default
  order. This amends the closed reserved set of HMD-0001 §5.3 to `tags`, `use`,
  `import`, `nav`.
- A malformed `nav` value MUST be reported as HMD013.
- An explicit `nav:` in `mkdocs.yml` MUST win; the plugin only fills an absent
  one.

### 3. Expansion

- Embeds MUST be expanded in `on_page_markdown`, before Python-Markdown runs, so
  `toc`, `footnotes`, and the rest see one finished document.
- Expansion is textual and MUST NOT shift heading levels (HMD-0001 §6).
- Heading slugs introduced by expansion MUST participate in the page's normal
  `toc` deduplication. A section embedded twice therefore yields `#s` and
  `#s_1`, and the page reports HMD011.

### 4. Red links and `.md`

- An unresolved link MUST render as `<a class="hmd-redlink">` carrying the link
  text and no `href`, and MUST NOT fail the build. Lint tracks the work item;
  the site stays viewable.
- Plain `.md` files under the docs dir MUST build as ordinary MkDocs pages. They
  remain invisible to the resolver (§4) and are therefore not wikilink targets;
  a `[[…]]` naming one is a red link.

### 5. Commands

- **`hmd render PATH [--to markdown|html]`** — expand embeds and rewrite
  resolved links. `markdown` is a one-way build product with no round-trip
  guarantee.
- `mkdocs serve` MUST watch the namespace root for `.hmd` changes via `on_serve`.

## Backwards Compatibility

`nav` is a new reserved key, so a card already using `nav` for its own purposes
changes meaning. Nothing is released and no card in this tree uses it.

## Security Considerations

The build reads the same tree `hmd lint` already reads under the containment
rules of HMD-0001 §4. Expansion is bounded by the depth limit of 16 and cycle
detection, which the plugin inherits rather than reimplements.

## Deployment / Activation

1. **M4** — `embed.py` (expansion, HMD007, HMD008), `render/flat.py`,
   `hmd render`. Independently testable, no MkDocs involved.
2. **M5** — `mkdocs_plugin.py` (`on_files`, nav, `on_page_markdown`, `on_serve`),
   `render/markdown_ext.py`, `mkdocs.yml`, the entry point in `pyproject.toml`.
3. Add `mkdocs build --strict` to CI.

## Reference Implementation

- `src/hyper_markdown/embed.py` — expansion, cycle detection, depth limit
- `src/hyper_markdown/render/flat.py`, `render/markdown_ext.py`
- `src/hyper_markdown/mkdocs_plugin.py` — `on_files`, nav, `on_page_markdown`
- `src/hyper_markdown/urls.py` — §1, the one place a URL is computed
- `pyproject.toml` — `[project.entry-points."mkdocs.plugins"]`

## Test Plan

Unit tests MUST include:

- URLs: `a/b.hmd` and `a/b/index.hmd` produce the same URL; a rewrite between
  two cards is relative and correct in both directions.
- Nav: default order is deterministic; `nav: 10` sorts ahead of an unkeyed
  sibling; a malformed value raises HMD013.
- Expansion: section embed stops at the next same-or-higher heading; a two-page
  cycle raises HMD007; a 17-deep chain raises HMD008.
- A section embedded twice yields `#s` and `#s_1` and reports HMD011.

Integration tests MUST include:

- A build of `examples/small/` succeeding, with every `.hmd` present in the
  output and the deliberate red link carrying `class="hmd-redlink"`.
- `use_directory_urls: false` failing the build with a usage error.

```bash
python -m pytest
hmd render examples/small/specs/auth/login.hmd --to markdown
mkdocs build --strict
```

## Open Questions

- Does the plugin own `mkdocs.yml`'s extension list, or only document it?
- Should `nav` inherit down a subtree the way `use` does, so a folder can order
  itself relative to its siblings in one place?
- Is a red link with no `href` right, or should it link to a "create this page"
  target once one exists?

## Changelog

- 2026-08-06: drafted
