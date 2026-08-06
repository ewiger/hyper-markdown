# Hyper-Markdown for VS Code

Live preview for [hyper-markdown](https://github.com/ewiger/hyper-markdown)
(`.hmd`) knowledge bases: source on the left, the rendered card on the right,
keeping up as you type.

Specified by [HMD-0021](../../doc/proposals/HMD-0021/README.md); the parser,
resolver, and renderer come from
[`@hyper-markdown/core`](../hmd-core/README.md), specified by
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

- **Hyper-Markdown: Open Preview** — focus the sidebar preview
- **Hyper-Markdown: Open Preview to the Side** — the same preview as an editor tab
- **Hyper-Markdown: Pin Preview to This Card** — stop following the active editor
- **Hyper-Markdown: Create Missing Card** — write the card a red link points at
- **Hyper-Markdown: Rebuild Index** — re-scan the namespace root

## Where the view appears

The extension contributes its view container to the activity bar. VS Code's
manifest offers `activitybar` and `panel` as contribution points, so an
extension cannot place a container in the secondary side bar by default — drag
the Hyper-Markdown container there once and VS Code remembers it.

## Known gaps

Tracked in [`conformance-xfail.json`](../hmd-core/conformance-xfail.json):
collapsible `???` details blocks, D2 diagrams, math, and `admonition` callouts
render as plain markdown for now. Raw HTML in a card is escaped rather than
passed through — a deliberate divergence from the MkDocs build, because a
webview rendering workspace HTML is a script-injection surface.

## License

MIT.
