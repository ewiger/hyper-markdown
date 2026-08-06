# Publishing

A hyper-markdown tree builds as a MkDocs site. This page describes the build
that produced the site you are reading.

## The shape of a site

The interesting case is not a wiki on its own. It is a **book with a wiki inside
it**: hand-written pages that explain a subject in order, plus a generated
section of cross-linked cards that the book hands you off to.

```text
doc/
  public/      the book — ordinary markdown, hand-ordered
  wiki/        the namespace — .hmd cards, generated nav
  proposals/   reference material, ordinary markdown
```

`docs_dir` covers all of `doc/`, while the `[[…]]` namespace is **restricted**
to `doc/wiki`. Cards resolve names against the wiki and nothing else; the rest
of the tree is reachable by ordinary relative Markdown links. That split is what
lets one build hold both kinds of writing without the resolver having an opinion
about the book.

## Configuration

```yaml
docs_dir: doc
use_directory_urls: true          # required

plugins:
  - hyper-markdown:
      root: doc/wiki              # the namespace, restricted

nav:
  - Home: public/index.md
  - The format: public/format.md
  - Wiki:
      - Overview: wiki/README.md
      - hmd://wiki                # ← the generated section lands here
```

`hmd://wiki` is the whole integration. An authored nav wins everywhere except
where it asks for the wiki by name, so a book keeps its own order and still says
exactly where the generated cards belong. Omit the placeholder and the authored
nav is used verbatim; omit `nav` entirely and the whole nav is derived.

## URLs

A card at `wiki/a/b.hmd` serves at `/wiki/a/b/`. A folder note at
`wiki/a/b/index.hmd` serves at that same URL — two names for one page, one URL,
which is why directory URLs are required rather than merely preferred.

Cards sort by path, or by a `nav:` integer in their frontmatter. Keyed cards
come first, ascending; the rest follow in path order, so adding `nav:` to one
card does not reshuffle its siblings.

## What the build does

1. Registers every `.hmd` file, which MkDocs would otherwise not see.
2. Expands embeds **before** Markdown runs, so the table of contents and
   footnotes see one finished document.
3. Rewrites each resolved wikilink to a real relative link.
4. Renders unresolved links as red links rather than failing.

Nothing is resolved twice: the build reuses the same resolver `hmd lint` uses,
so a link that lints clean and a link that renders correctly are the same fact.

## Two settings that are easy to miss

```yaml
exclude_docs: |
  *.hmd                           # or the raw sources ship beside the pages

validation:
  links:
    not_found: info               # cards link out to the repository
```

Cards link to files that are real but are not site pages — proposals, source,
styles. Those misses are reported, not fatal. Wikilinks are checked by
`hmd lint`, which is the tool that actually understands them.

## Live editing

```bash
mkdocs serve
```

The plugin watches the namespace root, which MkDocs would otherwise ignore — a
`.hmd` edit that triggered no rebuild would leave the preview quietly stale.

## Deployment

This site is published to GitHub Pages from a workflow, not from a branch. CI
builds `site/` and hands it straight to the Pages CDN as an artifact, so the
rendered HTML never enters version control and there is no `gh-pages` branch to
keep in sync:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write     # deploy-pages authenticates by OIDC

steps:
  - run: mkdocs build --strict
  - uses: actions/upload-pages-artifact@v3
    with: { path: site }
  - uses: actions/deploy-pages@v4
```

The repository must have **Settings → Pages → Source** set to *GitHub Actions*
for this to work; with the older *Deploy from a branch* setting the workflow
runs and publishes nothing.

`--strict` is the same gate the test workflow applies. A build that warns is not
published, which keeps the site and the lint result describing the same tree.

## A note on MkDocs 2.0

The MkDocs name is being reused for a ground-up rewrite with no plugin system, no
migration path, and a different config format. A hyper-markdown site is a MkDocs
*plugin*, so that release would not degrade it — it would remove it. The
dependency is therefore pinned to `mkdocs>=1.6,<2` rather than left open, and
which 1.x successor to follow is an open question rather than a decided one.
