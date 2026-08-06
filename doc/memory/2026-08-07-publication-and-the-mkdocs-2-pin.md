# 2026-08-07 — publication, and the ceiling on MkDocs

Two decisions taken together, because the second is the reason the first needed
a shape that survives it.

## The site publishes from an artifact, not from a branch

GitHub Pages is fed by `.github/workflows/pages.yml` using
`upload-pages-artifact` + `deploy-pages`. The built HTML never enters git, so
there is no `gh-pages` branch and `site/` stays ignored.

The branch route (`mkdocs gh-deploy`) was rejected for two reasons. It force-
pushes build output into version history, in a repository where the branch
topology is already carrying meaning — `feat/mvp` and `feat/vsc-ext` are two
agent identities, and a third branch that is not a line of work muddies that.
And `gh-deploy` is a MkDocs 1.x CLI subcommand, so it would widen exactly the
dependency we were narrowing on the same day.

`pages.yml` is a separate workflow rather than a job in `ci.yml`. `ci.yml` sets
`cancel-in-progress: true`, which is correct for a test matrix and wrong for a
deploy — a second push would cancel a partly uploaded artifact. Pages gets its
own `concurrency: pages` with cancelling off.

Requires **Settings → Pages → Source: GitHub Actions** in the repository. With
the older *Deploy from a branch* setting the workflow runs green and publishes
nothing, which is a silent failure worth knowing about in advance.

## MkDocs is pinned below 2.0, deliberately

`mkdocs>=1.6,<2` and `mkdocs-material>=9,<10`.

MkDocs 2.0 is a ground-up rewrite published under the same name on PyPI. It has
no plugin system. For most projects that is a breaking upgrade; for this one it
is deletion — `[project.entry-points."mkdocs.plugins"]` is how every `.hmd` card
reaches a page at all, so the release would not make the site worse, it would
make the site not contain the wiki. It also moves config from YAML to TOML with
no migration tool, and ships without a license.

The pin exists because CI installs fresh on every run. Left unbounded, the
migration would have been made for us by a resolver, on an ordinary push, with
no commit to point at.

## What was deliberately *not* decided

Which 1.x line to follow. Three candidates, tracked as X.9 in
[STATUS.md](../../STATUS.md):

- **ProperDocs** — oprypin's fork, an exact drop-in that keeps the plugin API.
  `mkdocs_plugin.py` would work unchanged; only the command name changes.
- **Zensical** — squidfunk's successor, drop-in for 1.x *config*. Whether it
  exposes an equivalent plugin API is the load-bearing unknown, and the only
  question actually worth researching before choosing.
- **An own `hmd build`** — `urls.py`, `embed.py`, and the resolver already own
  everything except templating.

Nothing needs to be chosen while 1.6 keeps working. The reason it can wait is
structural: MkDocs touches exactly one file. `parse`, `resolve`, `embed`,
`urls`, and `lint` do not import it, and HMD-0002 §1–§4 are renderer-agnostic —
only §5 and its Reference Implementation name MkDocs. A renderer swap is one
file and `mkdocs.yml`, not a re-specification.

The one decision that genuinely leans on MkDocs is the one recorded in
[2026-08-06](2026-08-06-python-mkdocs-line.md): *MkDocs computes URLs; the
plugin only names sources*. We emit source-relative paths and let MkDocs resolve
**and validate** them. A successor has to offer that, or `urls.py` takes it
over.
