# Real-time decisions

Small decisions that are not derivable from the code or git history. Newest
sections last. Progress is *not* tracked here — see
[the tracking rule](#where-work-is-tracked).

## Where work is tracked

Progress lives in `doc/proposals/HMD-NNNN/STATUS.md`, one tracker per proposal,
its TODO split into planned work, broken, limitations, and open questions.
`doc/issues/kanban.yaml` indexes the granular cards under `doc/issues/`. A repo-
root `STATUS.md` that indexed every work point for both proposals at once was
removed on 2026-08-07: two overlapping trackers meant a task could hide in
either. A proposal owns its own state.

The part that has held since the beginning: update the tracker in the same
commit that changes the code.

## Proposal number ranges, including the overflow

Three ranges, fixed:

- **`HMD-0002`–`HMD-0019`** — Python, MkDocs, the MVP. This branch.
- **`HMD-0020`–`HMD-0099`** — editor and JavaScript, on `feat/vsc-ext`.
- **`HMD-0100`+** — the MVP line again, once `0019` is exhausted.

The overflow to `0100` is decided in advance so nobody has to renegotiate mid-
stream. Eighteen proposals is the budget the MVP is expected to fit in; passing
it is a signal worth noticing rather than an error. The gap at `0020`–`0099`
leaves the editor line the same room.

## Two agent identities, two branches

`feat/mvp` is Python, MkDocs, and `HMD-0002`–`HMD-0019`. `feat/vsc-ext` is
TypeScript, the VS Code extension, and `HMD-0020+`; its decisions live in
`doc/memory/2026-08-06-typescript-editor-line.md` on that branch. `feat/mvp` is
the merge target. `doc/proposals/README.md` is the one file both streams append
to, so expect a mechanical conflict there and nowhere else.

## MkDocs needed a spec before it needed code

M5 could not start because three of its work points had no normative text —
output URL, nav order, and where embeds expand. HMD-0002 exists to answer those
five decisions, not to describe a plugin that was already obvious.

## The `nav` key opens a set HMD-0001 closed

HMD-0001 §5.3 pins the reserved frontmatter keys as a closed set of `tags`,
`use`, `import`. HMD-0002 §2 adds `nav`, which is an amendment rather than an
extension. The fallback, if that trade is rejected, is derived order only plus
an explicit `nav:` in `mkdocs.yml`.

## MkDocs computes URLs; the plugin only names sources

Links are rewritten to a path relative to the **source file** (`kanban.md`), not
to the page's URL (`../kanban/`). MkDocs resolves and validates every link
against the source tree and derives the URL itself, so a source-relative path
gets the URL for free and gets the link checked. Emitting the finished URL made
MkDocs report every wikilink as an unrecognized relative link — it was correct
output that bypassed validation.

Two settings a hyper-markdown site needs, both non-obvious: `exclude_docs:
"*.hmd"`, or MkDocs copies the raw sources in as static files beside the pages
the plugin generated; and `validation.links.not_found: info`, because cards link
out to the repository with ordinary relative links whose targets are real files
but not site pages.

## The site is a book with a wiki in it

`docs_dir` is `doc/`; the namespace is restricted to `doc/wiki` by the plugin's
`root`. `doc/public/` holds the book's chapters and `doc/index.md` is its cover
— the cover sits at the docs root rather than in `public/` because MkDocs serves
the site home from `docs_dir/index.md`, and a book whose `/` is a 404 is worse
than one whose cover is one directory up from its chapters.

`hmd://wiki` in an authored nav is replaced by the derived wiki section. Without
it the plugin could only derive the whole nav or none of it, which forced a
choice between a book and a wiki.

## Erasure is a shipping format, not an interchange format

`hmd → md` drops the embed boundary and the provenance of every link. That is
fine for a built site and fatal for a preview, which is why the editor line
rejected flat markdown as its transport while MkDocs output stays one-way. The
broader idea — `.md` is to `.hmd` as JavaScript is to TypeScript, with `md →
hmd` as a conversion step that doubles as the fast authoring loop (draft in
plain markdown, convert, let the resolver report what it could not place) — is
sketched without consequence in
[`doc/wiki/md-hmd-interop.hmd`](../wiki/md-hmd-interop.hmd). No proposal owns
it.

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

Which 1.x line to follow was deliberately *not* decided — only that it waits.
The candidates and trade-offs are live state, so they live in the tracker as
[HMD-0002 Q4](../proposals/HMD-0002/STATUS.md#open-questions-and-blockers).

Nothing needs to be chosen while 1.6 keeps working. The reason it can wait is
structural: MkDocs touches exactly one file. `parse`, `resolve`, `embed`,
`urls`, and `lint` do not import it, and HMD-0002 §1–§4 are renderer-agnostic —
only §5 and its Reference Implementation name MkDocs. A renderer swap is one
file and `mkdocs.yml`, not a re-specification. The one decision that genuinely
leans on MkDocs is *MkDocs computes URLs; the plugin only names sources* above:
a successor has to offer resolution **and** validation, or `urls.py` takes it
over.
