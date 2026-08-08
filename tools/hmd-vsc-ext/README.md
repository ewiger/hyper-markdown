<img src="media/logo.png" width="64" alt="">

# Hyper-Markdown for VS Code

Live preview for [hyper-markdown](https://github.com/ewiger/hyper-markdown)
(`.hmd`) knowledge bases: source on the left, the rendered card on the right,
keeping up as you type.

Specified by [HMD-0021](../../doc/proposals/HMD-0021/README.md); the parser,
resolver, and renderer come from
[`@hyper-markdown/core`](../hmd-ts-core/README.md), specified by
[HMD-0020](../../doc/proposals/HMD-0020/README.md).

## What it does

- **Rendered preview**, updating from the unsaved buffer, scroll-synced with the
  editor in both directions.
- **Embeds render as cards** — labelled with the card and fragment they came
  from, collapsible, and navigating to the embedded card rather than the
  embedding one. An embed flattened into anonymous prose is a defect here.
- **Red links** for targets that do not resolve, with a create-the-card action.
- **Backlinks** for the current card, listing link and embed edges separately.
- **Diagnostics** in the Problems panel using the `HMD001`–`HMD016` rule IDs,
  identical to `hmd lint`.
- **Syntax highlighting** for `.hmd` as its own language.

## No Python required

The extension carries its own implementation of the format. There is no
interpreter to find, no virtualenv to activate, and no subprocess between a
keystroke and the preview. The `hmd` CLI remains the canonical implementation
and CI checks the two against a shared conformance corpus.

## Settings

| Setting | Default | Effect |
| --- | --- | --- |
| `hyperMarkdown.root` | `""` | Namespace root. Empty discovers it from `.hmd/config.toml`, falling back to `doc/wiki`. |
| `hyperMarkdown.preview.scrollSync` | `true` | Keep preview and editor on the same source line. |
| `hyperMarkdown.preview.embeds` | `expanded` | Whether embed cards start expanded. |
| `hyperMarkdown.diagnostics.scope` | `workspace` | Publish diagnostics for every indexed card, or only open ones. |

## Commands

- **Hyper-Markdown: Open Preview in This Column** — a preview tab in the editor
group you are in
- **Hyper-Markdown: Open Preview to the Side** — the same, in the group beside it
- **Hyper-Markdown: Pin Preview to This Card** — stop following the active editor
- **Hyper-Markdown: Create Missing Card** — write the card a red link points at
- **Hyper-Markdown: Rebuild Index** — re-scan the namespace root

## Where the preview appears

The preview is an editor tab, not a side-bar view. Click the ⚡ at the top right
of any editor group and a preview opens **in that group** — including when the
neighbouring group is locked, which is where "open to the side" gives up and
splits a third group instead.

A preview follows the active editor: click another card in the Explorer or the
tab bar and the preview re-renders on it. Clicking a `[[wikilink]]` moves the
preview to the target and opens its source alongside, leaving focus in the
preview so the next link is one click away.

Open as many as you like — each is titled after its card. To hold one on a card
while you read elsewhere, click the 📌 in its title bar; the breadcrumb shows
`pinned` while it is held. Tabs come back on their own cards after a window
reload.

## Known gaps

Tracked in [`conformance-xfail.json`](../hmd-ts-core/conformance-xfail.json):
collapsible `???` details blocks, D2 diagrams, math, and `admonition` callouts
render as plain markdown for now. Raw HTML in a card is escaped rather than
passed through — a deliberate divergence from the MkDocs build, because a
webview rendering workspace HTML is a script-injection surface.

## License

MIT.
