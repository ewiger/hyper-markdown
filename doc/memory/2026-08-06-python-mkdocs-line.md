# 2026-08-06 — the Python and MkDocs line

Real-time decisions taken while drafting
[HMD-0002](../proposals/HMD-0002/README.md) and creating
[STATUS.md](../../STATUS.md). None are derivable from the code or git history.

## STATUS.md is the milestone tracker

A single `STATUS.md` at the repo root indexes every work point against its
milestone and its spec section. `doc/issues/kanban.yaml` stays for granular,
short-lived cards; it is currently empty. Update the STATUS row in the same
commit that changes the code.

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
