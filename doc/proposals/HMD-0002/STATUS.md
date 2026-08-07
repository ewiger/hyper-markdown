# HMD-0002 — Status

Progress tracking for [HMD-0002](README.md): MkDocs book-mode rendering — URLs,
nav, expansion, red links, and publication.

**This file is the only place work against this proposal is tracked.** Not the
memos under `doc/memory/`, not the cards under `doc/wiki/`, not the proposal
itself. A decision that needs discussion is named here as an open question and
argued wherever it belongs; nothing else may hold a task list. Update the row in
the same commit that changes the code.

**Snapshot** (2026-08-07) — M5 done, published, and branded. `doc/` builds as a
book with the wiki as a section of its nav, green under `mkdocs build --strict`,
deployed to GitHub Pages from a workflow artifact, and carrying the project's
own mark rather than stock Material. Nothing is known broken. What remains is
three open questions blocking `drafted → accepted`, and one deferred decision
about which MkDocs successor to follow.

Section references are to [HMD-0002](README.md) unless marked otherwise.
Prerequisite: [HMD-0001 M4](../HMD-0001/STATUS.md#done) — the plugin expands
embeds, so it could not exist before the expander did.

## Done

### M5 — the MkDocs plugin

| ID | Work point | Spec |
| --- | --- | --- |
| M5.1 | `urls.py` — `a/b.hmd` → `a/b/`, folder notes collapse, source-relative hrefs | §1 |
| M5.2 | Nav derivation, default order, the `nav` frontmatter key (HMD013 on malformed) | §2 |
| M5.3 | `mkdocs_plugin.py` — `on_files` registration of `.hmd` | §5 |
| M5.4 | Expansion and link rewriting at `on_page_markdown` — no `markdown_ext.py` | §3 |
| M5.5 | Red links render as `<a class="hmd-redlink">`, build stays green | §4 |
| M5.6 | Plain `.md` files build as ordinary pages, unlinkable | §4 |
| M5.7 | Expansion-introduced slug collisions dedupe via `toc` and report HMD011 | §3 |
| M5.8 | `on_serve` watcher so `mkdocs serve` livereloads on `.hmd` edits | §5 |
| M5.9 | `mkdocs.yml` at the repo root, extension list of HMD-0001 §9 enabled | §5 |
| M5.10 | `[project.entry-points."mkdocs.plugins"]` in `pyproject.toml` | Reference Impl. |
| M5.11 | `use_directory_urls: false` fails the build with a usage error | §1 |
| M5.12 | Integration test: build succeeds, `.hmd` pages present, red links carry the class | Test Plan |
| M5.13 | Namespace root may be a subtree of `docs_dir`; cards serve under its prefix | §2 |
| M5.14 | `hmd://wiki` nav placeholder splices the derived section into an authored nav | §2 |

### Issues resolved against the built site

Each row links its write-up. A defect only leaves the [Broken](#broken) table
when a gate would catch its return, and every row below has one.

| ID | Work point | Write-up | Guard |
| --- | --- | --- | --- |
| M5.15 | `doc/public/` book, with the wiki as a section of its nav | [0001](../../issues/0001-book-and-wiki-in-one-site.md) | `mkdocs build --strict` |
| M5.16 | Ordinary markdown links to `.hmd` files repointed at the rendered card | [0002](../../issues/0002-md-links-to-cards-404.md) | `tests/test_mkdocs.py` |
| M5.17 | `pygments<2.20` pinned; a built page asserted to contain `<pre>` | [0003](../../issues/0003-pygments-220-breaks-code-blocks.md) | rendered HTML, not the version |
| M5.18 | Callouts, math (MathJax), and D2 diagrams render; `diagram.py` | [0004](../../issues/0004-math-callouts-diagrams.md) | `tests/test_mkdocs.py` |
| M5.19 | Strikethrough, tables, and task lists shown and gated | [0005](../../issues/0005-strikethrough-shown-as-its-own-source.md) | `<del>`, `<table`, task item in built HTML |
| M5.20 | An escaped pipe inside a table code span kept its backslash, on the page whose job is to show what to type; cells rewritten as raw inline HTML | [0006](../../issues/0006-escaped-pipe-in-a-table-code-span.md) | `tests/test_docs.py` |
| M5.21 | Site branding — the README's `⚡` as an SVG logo and favicon, amber-on-black palette, repository and social links, a hero on the cover | — | `tests/test_docs.py` |
| M5.22 | The book's front chapters restructured: the cover carries the vision, `rich-content.md` → `features.md` (what a page can be, shown working), `publishing.md` → `presentation.md` (conversion targets, then viewers). Contributor material — the CI gates, the `doc/` conventions, and Pages deployment — left the book for `DEVELOP.md` at the repo root, referenced from the README | — | `mkdocs build --strict`, `tests/test_docs.py` |

The standing lesson from 0003 and 0005: **a green build is not evidence of
correct output.** 0003 was a green build with wrong output; 0005 was a green
build with right output and a wrong claim. Both slipped because no gate looked
at rendered HTML. New rendering work asserts on the HTML, never on the config.

### Deployment

| ID | Work point | Spec |
| --- | --- | --- |
| D1 | `mkdocs build --strict` added to `.github/workflows/ci.yml` | Deployment |
| D2 | GitHub Pages published from `.github/workflows/pages.yml`, artifact-based, no `gh-pages` branch | Deployment |
| D3 | `mkdocs<2`, `mkdocs-material<10` pinned — MkDocs 2.0 removes the plugin system | Deployment |

D2 requires **Settings → Pages → Source: GitHub Actions** in the repository.
With the older *Deploy from a branch* setting the workflow runs green and
publishes nothing — a silent failure worth knowing about in advance.

## TODO

### Planned work

None. Every specified work point is implemented.

### Broken

None known.

### Limitations

Known, accepted, not being fixed now.

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | MkDocs is pinned `>=1.6,<2` | MkDocs 2.0 is a ground-up rewrite published under the same name and has **no plugin system**. For this project that is not a breaking upgrade but deletion — the entry point is how a `.hmd` card reaches a page at all. It also moves config to TOML with no migration tool and ships without a license. See Q4 |
| L2 | `mkdocs-material` is pinned `>=9,<10` | Material 9 targets MkDocs 1.x and cannot run on 2.0 either. Whatever its next major targets is a decision to take deliberately |
| L3 | `pygments<2.20` is pinned rather than fixed | 2.20 silently stopped `pymdownx.superfences` from matching any fence, so every code block rendered as running text while the build stayed green (issue 0003). Upstream's, not ours |
| L4 | MathJax loads from `unpkg.com` at view time | The only network dependency the site has; the build itself is offline. Without it `arithmatex` emits `\(…\)` and typesets nothing, so a reader offline sees math as its own source |
| L5 | `validation.links.not_found: info` — a missing link target is reported, not fatal | Cards link out to the repository (proposals, styles, source) with ordinary relative links whose targets are real files but not site pages. The cost is that a genuinely broken relative link also only warns; wikilinks are checked by `hmd lint` instead |
| L6 | D2 fences need the `d2` binary; without it a fence degrades to a labelled placeholder and the build stays green | Deliberate — no `mkdocs-d2-plugin`, so a missing binary cannot fail a build. The cost is that an environment without `d2` ships placeholders silently |
| L7 | `use_directory_urls: false` is a hard usage error, not a supported mode | A card and its folder note share one URL, so directory URLs are required rather than merely preferred (§1) |
| L8 | Rendering to the site is one-way | Inherited from [HMD-0001 L1](../HMD-0001/STATUS.md#limitations) — erasure is a shipping format |
| L9 | Branding is config and CSS only — no `theme.custom_dir`, no template partials | A `custom_dir` pins the site to Material 9's internal template structure, which is the thing L2's pin already has to be careful about; a theme override would have to be re-checked against every successor considered in Q4. The cost is that anything needing new markup — an announcement bar, a landing-page card grid — is not reachable by config alone. Material's own `grid cards` via `attr_list` + `md_in_html` is the escape hatch that stays within this limit |

### Open questions and blockers

Q1–Q3 MUST be resolved before Status moves `drafted → accepted`; that transition
is the blocker they hold up. Q4 blocks nothing today and is deferred on purpose.

| ID | Question |
| --- | --- |
| Q1 | Does the plugin own `mkdocs.yml`'s extension list, or only document it? |
| Q2 | Should `nav` inherit down a subtree the way `use` does, so a folder can order itself relative to its siblings in one place? |
| Q3 | Is a red link with no `href` right, or should it link to a "create this page" target once one exists? |
| Q4 | Which MkDocs 1.x successor to follow — **ProperDocs**, **Zensical**, or an own `hmd build`? |
| Q5 | §2 adds `nav` to the reserved frontmatter keys, which [HMD-0001](../HMD-0001/README.md) §5.3 pins as a *closed* set of `tags`, `use`, `import`. Is that amendment accepted, or does the fallback stand — derived order only, plus an explicit `nav:` in `mkdocs.yml`? |

**On Q4.** Three candidates: ProperDocs (oprypin's fork, an exact drop-in that
keeps the plugin API — `mkdocs_plugin.py` would work unchanged and only the
command name changes); Zensical (squidfunk's successor, drop-in for 1.x
*config*, but whether it exposes an equivalent plugin API is the load-bearing
unknown and the only part worth researching before choosing); or an own
renderer, since `urls.py`, `embed.py`, and the resolver already own everything
except templating.

Nothing needs choosing while 1.6 keeps working, and the reason it can wait is
structural: MkDocs touches exactly one file. `parse`, `resolve`, `embed`, `urls`,
and `lint` do not import it, and §1–§4 are renderer-agnostic — only §5 and the
Reference Implementation name MkDocs. A renderer swap is one file plus
`mkdocs.yml`, not a re-specification.

The one decision that genuinely leans on MkDocs is *MkDocs computes URLs; the
plugin only names sources* — we emit source-relative paths and let MkDocs
resolve **and validate** them. A successor has to offer that, or `urls.py` takes
it over.

## Gates

```bash
python -m pytest tests/test_mkdocs.py         # the plugin's own suite
mkdocs build --strict                         # builds the book + wiki into site/
mkdocs serve                                  # live, watching the namespace root
```

`mkdocs build --strict` also runs in `.github/workflows/ci.yml`.

## Changelog

- 2026-08-06: drafted; the five decisions that blocked M5 answered, M5 moves
  from `blocked` to `ready`.
- 2026-08-07: M5 done — `urls.py`, `mkdocs_plugin.py`, `mkdocs.yml`, entry
  point, CI gate. `doc/wiki` is the live example. `nav` became a real reserved
  frontmatter key with HMD013 validation, and `render/markdown_ext.py` was
  dropped as redundant.
- 2026-08-07: issue 0001 — the site became a book with the wiki inside it. The
  namespace root may now be a subtree of `docs_dir`, and `hmd://wiki` marks
  where the derived section belongs in an authored nav.
- 2026-08-07: issue 0002 — ordinary markdown links to `.hmd` files 404'd on the
  site. Every page now has such links repointed at the rendered card, masked so
  fenced paths survive.
- 2026-08-07: published — GitHub Pages, artifact-based, from a separate
  `pages.yml` so a cancelled test run cannot cancel a deploy. MkDocs pinned
  below 2.0 in the same commit.
- 2026-08-07: issue 0003 — Pygments 2.20 silently stopped `pymdownx.superfences`
  from matching any fence. Pinned, and guarded by asserting rendered HTML.
- 2026-08-07: issue 0004 — math, callouts, and D2 implemented. `d2` fences
  render through the binary to a `data:` URI image and degrade to a labelled
  placeholder without it.
- 2026-08-07: issue 0005 — the Rich content page named strikethrough inside a
  code span and never showed a table, so the free half of HMD-0001 §9 read as
  broken while `pymdownx.tilde` worked end to end. The extension list under test
  now matches the one the site ships.
- 2026-08-07: the site got its own identity — the README's `⚡` shipped as
  `logo.svg` and `favicon.svg`, both filled amber explicitly (Material
  references the logo as `<img>`, and an external SVG inherits no color, so
  `currentColor` renders it black on a black header), an amber-on-black
  palette, nav tabs,
  repository and social links, and a hero on the cover via `attr_list`. Config
  and CSS only, no `custom_dir` — see L9. Gated on rendered HTML in
  `tests/test_docs.py`, per the standing lesson above.
- 2026-08-07: split out of the repo-root `STATUS.md`, which tracked both
  proposals at once. Progress is now tracked per proposal, and the to-do list is
  split into planned work, broken, limitations, and open questions.
