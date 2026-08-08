# Developing hyper-markdown

Everything a contributor needs that a reader does not: how to get the code
running, what the gates are, how the documentation tree is organised, and how
the site reaches the web. The book under [`doc/public/`](doc/public/) explains
the *format*; this file explains the *repository*.

## Setup

```bash
uv sync --locked --all-extras
```

That installs the exact versions in [`uv.lock`](uv.lock) — the ones CI and the
published site are built from — and fails rather than re-resolving if the lock
and [`pyproject.toml`](pyproject.toml) have drifted apart. To change a
dependency, edit the ranges in `pyproject.toml`, run `uv lock`, and commit the
resulting lockfile in the same change: an upgrade should be a diff somebody
approved, not whatever the index happened to serve that morning.

The `mkdocs` extra is optional for the library and required for the site. D2
diagrams render through the [`d2`](https://d2lang.com) binary, which is not a
Python dependency — install it separately, or don't: without it a diagram
degrades to its labelled source rather than failing the build.

## The gates

CI runs four things ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)),
across Python 3.11–3.14. Run them locally before pushing:

```bash
python -m pytest                          # the suite
hmd lint --root doc/wiki --strict         # this repo's own wiki must be clean
hmd lint --root examples/small            # the fixture: exactly one warning
mkdocs build --strict                     # the second consumer of the resolver
```

A fifth job builds the distribution, checks its metadata the way PyPI will, and
installs the wheel into a clean environment to confirm the `hmd` script and the
MkDocs entry point exist. That last part is what an editable install can never
tell you: `uv pip install -e` resolves through `src/`, so a package that would
ship without its entry points still passes every test.

```bash
uv build && uvx twine check --strict dist/*
```

The two `hmd lint` calls are dogfooding gates. The fixture is deliberately *not*
run under `--strict` — it carries one expected warning, the red link in
`glossary/` that demonstrates what an unwritten page looks like.

`mkdocs build --strict` is a gate rather than a convenience: the plugin is the
second consumer of the resolver, so a build that goes red means the model works
for `lint` and not for rendering.

**A green build is not evidence of correct output.** Two issues have now been
green builds with wrong pages — `pygments` 2.20 silently stopped matching code
fences, and strikethrough rendered as its own source. Both slipped because no
test looked at rendered HTML. New rendering work asserts on the HTML, never on
the configuration.

The wheel smoke test is the one job deliberately left unlocked. It resolves
fresh against the ranges in `pyproject.toml`, because its whole purpose is to
exercise what a stranger gets from `pip install`, and a bad bound is invisible
to a run that installs from the lock.

## Layout

```text
src/hyper_markdown/     the library — parse, resolve, embed, urls, lint, render
  mkdocs_plugin.py      the only file that imports MkDocs
tests/                  pytest; test_docs.py gates this repo's own prose
examples/small/         a runnable fixture wiki, exercised by the suite
doc/                    the documentation tree — also the site's docs_dir
mkdocs.yml              the site
```

The library's independence from MkDocs is deliberate and worth preserving:
`parse`, `resolve`, `embed`, `urls`, and `lint` do not import it, so swapping the
renderer is one file plus `mkdocs.yml` rather than a re-specification.

## Working on the documentation

`doc/` is a modular knowledge base, and its parts have different jobs:

| Path | What it holds |
| --- | --- |
| `doc/index.md`, `doc/public/` | **The book** — hand-ordered chapters, ordinary markdown |
| `doc/wiki/` | **The wiki** — `.hmd` cards, the namespace, generated nav |
| `doc/proposals/HMD-NNNN/` | Numbered specifications, ADR/RFC style |
| `doc/models/` | The system through requirements, data, domain, behavior lenses |
| `doc/issues/` | A kanban board of work items, indexed by `kanban.yaml` |
| `doc/memory/` | Small real-time decisions that the code and git history do not record |

Three conventions that are easy to get wrong:

- **Progress is tracked per proposal**, in `doc/proposals/HMD-NNNN/STATUS.md`,
  and nowhere else — not in `doc/memory/`, not in a wiki card, not in a
  proposal's own `README.md`. Update the tracker in the same commit that changes
  the code. A decision that needs discussion becomes an open question in the
  tracker.
- **A proposal is a complete text**, readable start to finish by someone who has
  opened no other file. Do not thread prose with identifiers standing in for the
  claim (`F21`, `Q7`, `§5.3`); restate the constraint instead, and put surviving
  pointers in one *See also* section at the end.
- **The book is not the wiki.** A chapter under `doc/public/` is plain markdown
  outside the namespace, so wikilinks and embeds written there are *not*
  resolved — they pass through as literal brackets. Show the constructs in code
  spans and let the wiki be the live demonstration.

Preview both together:

```bash
mkdocs serve
```

The plugin watches the namespace root, which MkDocs would otherwise ignore — a
`.hmd` edit that triggered no rebuild would leave the preview quietly stale.

Proposal numbers are allocated in fixed ranges so two lines of work can reserve
them without coordinating: `HMD-0002`–`HMD-0019` for the Python and MkDocs line,
now merged and continuing on `main`; `HMD-0020`–`HMD-0099` for the editor and
TypeScript line on `feat/vsc-ext`; and `HMD-0100`+ when the first range is
exhausted. Reserve the number in
[`doc/proposals/README.md`](doc/proposals/README.md) before creating the folder.

## Getting the site onto the web

This site is published to GitHub Pages from a workflow rather than from a
branch: CI runs `mkdocs build --strict` and hands `site/` straight to the Pages
CDN as an artifact, so the rendered HTML never enters version control and there
is no `gh-pages` branch to keep in sync. The workflow is
[`.github/workflows/pages.yml`](.github/workflows/pages.yml), and the repository
must have **Settings → Pages → Source** set to *GitHub Actions* — with the older
*Deploy from a branch* setting the workflow runs green and publishes nothing.

`--strict` is the same gate the test workflow applies. A build that warns is not
published, which keeps the site and the lint result describing the same tree.

**When a deploy fails, dispatch a fresh run — do not re-run the failed one.**
`upload-pages-artifact` writes an artifact named `github-pages`, and a re-run
adds a *second* one to the same run rather than replacing it; `deploy-pages`
then refuses with `Multiple artifacts named "github-pages"`, so the run can
never go green again no matter how often it is retried. `workflow_dispatch` on
`pages.yml` gets a clean artifact namespace. The failure worth retrying this way
is the transient one where deploy queries for the artifact before the metadata
has propagated and reports `Found 0 artifact(s)` moments after a successful
upload.

One pin is worth knowing about: the MkDocs name is being reused for a ground-up
rewrite with no plugin system, no migration path, and a different config format.
A hyper-markdown site *is* a MkDocs plugin, so that release would not degrade it
— it would remove it. The dependency is therefore held at `mkdocs>=1.6,<2`
rather than left open, and which successor to follow is an open question rather
than a decided one.

The `pygments<2.20` ceiling that stood beside it is gone as of 0.1.1. The defect
was never really Pygments': `pymdown-extensions` 10.21.2 fixes it, so the
constraint is now a floor on that package instead — and it moved into the base
dependencies, since `pymdownx.superfences` is loaded by `hmd render --to html`
and not only by the site. Every bound carries its rationale inline in
[`pyproject.toml`](pyproject.toml).

## Cutting a release

Four steps, in this order:

1. Write the entry in [`CHANGELOG.md`](CHANGELOG.md) — promote `Unreleased` to
   the new number and date it.
2. Bump `__version__` in [`src/hyper_markdown/__init__.py`](src/hyper_markdown/__init__.py).
   That is the only place a version literal exists; `pyproject.toml` derives its
   own from it, and `tests/test_cli.py` fails if the two ever disagree or if the
   changelog has no section for the number.
3. Merge, with CI green.
4. Tag `main` and push the tag:

   ```bash
   git tag -a v0.1.0 -m "hyper-markdown 0.1.0"
   git push origin v0.1.0
   ```

The tag is what publishes.
[`.github/workflows/release.yml`](.github/workflows/release.yml) rebuilds from
the tagged tree, refuses to continue if the tag and `__version__` disagree,
uploads to PyPI, and cuts a GitHub release whose notes are that version's
changelog section. Running the workflow by hand builds and verifies without
publishing, or publishes to TestPyPI if you ask it to.

Two things must be configured outside the repository before the first publish,
and neither can be done from a commit:

- **A PyPI trusted publisher** for the project, pointing at owner `ewiger`,
  repository `hyper-markdown`, workflow `release.yml`, environment `pypi`.
  Publication authenticates by OIDC rather than with a stored API token, so
  there is no secret to leak — and no upload at all until the publisher exists.
  A missing one shows up as a `403` on an otherwise green run.
- **The `pypi` environment** in the repository settings, which is worth an
  approval rule: it is the last point at which a release can be stopped.

Versions are semantic with the usual `0.x` caveat, stated in the changelog: the
*format* may move between minor versions, not only the Python API.
