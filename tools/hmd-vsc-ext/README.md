<div align="center">

<img src="https://raw.githubusercontent.com/ewiger/hyper-markdown/main/doc/wiki/assets/logo.svg" width="76" height="76" alt="">

# Hyper-Markdown for VS Code

</div>

Live preview for [hyper-markdown](https://github.com/ewiger/hyper-markdown)
(`.hmd`) knowledge bases: source on the left, the rendered card on the right,
keeping up as you type.

![The extension previewing a card: source on the left, rendered card on the
right, with resolved links, a table, a callout, and a d2 diagram.](https://raw.githubusercontent.com/ewiger/hyper-markdown/main/doc/assets/hmd-vsc-ext-screenshot-1.png)

Specified by [HMD-0021](../../doc/proposals/HMD-0021/README.md); the parser,
resolver, and renderer come from
[`@hyper-markdown/core`](../hmd-ts-core/README.md), specified by
[HMD-0020](../../doc/proposals/HMD-0020/README.md).

The format itself — every construct, the resolution rules, the rule IDs — is
documented at [hyper-markdown.org](https://hyper-markdown.org/). This page is
about the extension.

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

## What it needs

The extension is the preview and the viewer, and it carries its own
implementation of the format for them. Nothing has to be installed to render a
card: no interpreter to find, no virtualenv to activate, and no subprocess
between a keystroke and the preview. The `hmd` CLI remains the canonical
implementation and CI checks the two against a shared conformance corpus.

Completion and the other language-server features are not here yet. They arrive
with the Python language server, which lives with the canonical implementation
— so a later version will want Python for those, while the preview keeps
rendering without it.

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

## Install

Not on the marketplace yet. Build the VSIX from a clone of the
[monorepo](../../README.md) and install it:

```bash
npm install
npm run -w hmd-vsc-ext package
code --install-extension tools/hmd-vsc-ext/hmd-vsc-ext-0.1.0.vsix
```

## Known gaps

Every divergence from the canonical `hmd` CLI is ledgered with its reason in
[`conformance-xfail.json`](../hmd-ts-core/conformance-xfail.json), and a ledgered
entry that stops diverging fails the build. The ones worth knowing about while
you write:

- **Raw HTML in a card is escaped** rather than passed through. Deliberate, and
  a divergence from the MkDocs build: a webview rendering HTML out of a
  workspace is a script-injection surface reachable from any cloned repository.
- **`HMD017` is never reported.** The publication model behind it —
  `nav.visibility`, which the CLI inherits down a subtree and defaults to
  private — is unported, so nothing here knows whether a card is published.
- **A setext heading** (a title underlined with `=====`) gets a slug here and
  none in the CLI, so `[[Card#Section]]` against one resolves in the preview and
  not in a build. Write ATX headings.
- **Math is typeset by KaTeX** rather than by the site's MathJax, and `~x~`
  subscript is unsupported.
- **The graph tab** is specified and not built yet.

What has changed is in [CHANGELOG.md](CHANGELOG.md); work points are tracked in
[`doc/vsc-ext/STATUS.md`](../../doc/vsc-ext/STATUS.md).

## Working on it

[DEVELOP.md](DEVELOP.md) is this extension's guide: the two bundles, the
Extension Development Host and why it is a script rather than an F5
configuration, what to walk through by hand, and how the VSIX is built.

## License

MIT — see [LICENSE](LICENSE).
