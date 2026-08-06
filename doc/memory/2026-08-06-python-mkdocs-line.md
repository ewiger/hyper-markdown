# 2026-08-06 — the Python and MkDocs line

Real-time decisions taken while drafting
[HMD-0002](../proposals/HMD-0002/README.md) and creating
[STATUS.md](../../STATUS.md). None are derivable from the code or git history.

## STATUS.md is the milestone tracker

A single `STATUS.md` at the repo root indexes every work point against its
milestone and its spec section. `doc/issues/kanban.yaml` stays for granular,
short-lived cards; it is currently empty. Update the STATUS row in the same
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
