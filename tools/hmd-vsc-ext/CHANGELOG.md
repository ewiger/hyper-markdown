# Changelog — Hyper-Markdown for VS Code

Notable changes to the extension, newest first. This file covers **the extension
only**; the parser, resolver, and renderer under it are
[`@hyper-markdown/core`](https://github.com/ewiger/hyper-markdown/blob/main/tools/hmd-ts-core/CHANGELOG.md),
and the `hmd` CLI is
[`hyper-markdown`](https://github.com/ewiger/hyper-markdown/blob/main/tools/hmd/CHANGELOG.md)
on PyPI.
[The repository's index](https://github.com/ewiger/hyper-markdown/blob/main/CHANGELOG.md)
lists all three.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The extension carries **its own version**, independent of the language's and of
the `hmd` tool's, and is released on its own tag — `vsc-ext-vX.Y.Z`, where the
Python tool uses `vX.Y.Z`. Implementation state is tracked per work point in
[`doc/vsc-ext/STATUS.md`](https://github.com/ewiger/hyper-markdown/blob/main/doc/vsc-ext/STATUS.md),
against
[HMD-0021](https://github.com/ewiger/hyper-markdown/blob/main/doc/proposals/HMD-0021/README.md).

## [Unreleased]

## [0.1.0] — 2026-08-10

First public release, on the VS Marketplace and Open VSX as
`hyper-markdown.hmd-vsc-ext`. Flagged **preview**: the preview surface is
complete and gated by tests, the graph tab and the publication model are not
built yet, and the flag comes off when they are.

### Added

- **Rendered preview**, updating from the unsaved buffer rather than from the
  last save, scroll-synced with the editor in both directions. The DOM is patched
  per block rather than rebuilt, so selection and scroll survive a keystroke.
- **Embeds render as cards** — labelled with the card and fragment they came
  from, collapsible, nested, and navigating to the embedded card rather than the
  embedding one. An embed flattened into anonymous prose is a defect here, which
  is the load-bearing difference between a preview and a published page.
- **Red links** for targets that do not resolve, with a create-the-card action
  that writes the file through a `WorkspaceEdit`.
- **Backlinks** for the current card, listing link and embed edges separately.
- **Diagnostics** in the Problems panel using the same rule IDs as `hmd lint`,
  debounced at 500 ms and suppressed on the line the cursor is on, so a
  half-typed link does not squiggle under your hands.
- **Syntax highlighting** for `.hmd` as its own language, embedding the markdown
  grammar and YAML inside frontmatter.
- **The preview is an editor tab, not a side-bar view.** The ⚡ at the top right
  of any editor group opens a preview *in that group* — including when the
  neighbouring group is locked, which is where "open to the side" gives up and
  splits a third group instead. Open as many as you like, each titled after its
  card; pin one with the 📌 to hold it while you read elsewhere; tabs come back
  on their own cards after a window reload.
- **A preview follows the active editor** and its own links: clicking a
  `[[wikilink]]` moves the preview to the target and opens its source alongside,
  leaving focus in the preview so the next link is one click away.
- **Math, callouts, and D2 diagrams.** Diagrams render through the `d2` binary,
  falling back to Docker, with a 64-entry cache keyed by content; KaTeX ships its
  stylesheet and fonts inside the VSIX rather than fetching them.
- **The preview renders without Python.** The extension carries its own
  implementation of the format — no interpreter to find, no virtualenv to
  activate, and no subprocess between a keystroke and the preview. Completion
  and the other language-server features are not in this release; they arrive
  with the Python server, and the preview stays independent of it.

### Security

- The webview runs under a content security policy with a per-load nonce, and
  raw HTML in a card is escaped rather than passed through. That is a deliberate
  divergence from the MkDocs build: a webview rendering HTML out of a workspace
  is a script-injection surface reachable from any cloned repository.
- Indexing and preview are read-only and work in untrusted workspaces. Creating
  a missing card requires trust.

### Changed

- **Renamed from `vscode-hyper-markdown` to `hmd-vsc-ext`**, making the
  marketplace identifier `hyper-markdown.hmd-vsc-ext`. That identifier is
  permanent from the first publish — renaming afterwards means a second listing
  and every install of the first one stranded on it — so the rename was taken
  while nothing was published. Only the identity moved: the displayed name, the
  `hmd` language id, the TextMate scope, every command id, and every setting key
  are unchanged, because those are what a user and a theme author see.
- This extension carries its own README, changelog, and license, rather than
  borrowing the repository's.

### Not yet built

- **The graph tab** is specified and unstarted.
- **The integration suite** under `@vscode/test-cli` is written and parked, on
  two blockers in the harness rather than in this code: `@vscode/test-electron`
  2.5.2 spawns `Contents/MacOS/Electron` where VS Code 1.132.0 ships that binary
  as `Code`, and symlinking around the rename invalidates the `.app` signature
  so macOS kills the process. Neither blocker exists on a Linux runner. The unit
  suites (`protocol`, `renderer`, `panel`) run on every push.
- **`HMD017` and the publication model** — `nav.visibility` in the canonical
  implementation — are unported in the core, so the extension has no notion of a
  card being published and never warns about a public card linking to a private
  one.

[Unreleased]: https://github.com/ewiger/hyper-markdown/compare/vsc-ext-v0.1.0...HEAD
[0.1.0]: https://github.com/ewiger/hyper-markdown/releases/tag/vsc-ext-v0.1.0
