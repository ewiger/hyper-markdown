# Developing the VS Code extension

The loop for *this* tool: two bundles, an Extension Development Host, and a
manual walkthrough for the things unit tests cannot see.
[The repository's `DEVELOP.md`](../../DEVELOP.md) covers what is shared, and
[`tools/hmd-ts-core/DEVELOP.md`](../hmd-ts-core/DEVELOP.md) covers the
implementation this extension renders with — a preview bug is as likely to live
there as here.

Specified by [HMD-0021](../../doc/proposals/HMD-0021/README.md); work points are
tracked in [`doc/vsc-ext/STATUS.md`](../../doc/vsc-ext/STATUS.md).

## Prerequisites

Node 20 or later. Python is **not** required to run the extension — that is a
design constraint, not an oversight. It *is* required for the conformance gate in
the core package, which asks the canonical implementation what the right answer
is.

```bash
npm install          # from the repository root — both TypeScript tools
uv sync --locked     # only for the core's parity check
```

## Build

```bash
npm run build                  # core (tsc) then this extension (esbuild)
npm run typecheck              # both packages, no emit
npm run -w hmd-vsc-ext watch   # rebuild both bundles on save
```

Two bundles come out, both gitignored: `dist/extension.js` for the Node
extension host, and `media/webview.js` for the sandboxed webview. They are
separate contexts and neither can reach the other's globals — the message
protocol between them is the whole interface.

## Test

```bash
npm run -w hmd-vsc-ext test    # renderer under jsdom, protocol, panel, CSP
```

The unit suites cover the parts that can be exercised without an editor: the
webview renderer against jsdom, the store-to-webview protocol, panel and pin
behaviour, and the content security policy. Everything that needs a real VS Code
window is the integration suite, which is parked — see the bottom of this file.

## Run it — the Extension Development Host

```bash
npm run example            # examples/cs-alg-sorting — callouts, math, diagrams
npm run example:small      # examples/small — namespaces, imports, a red link
npm run example:wiki       # this repository's own doc/wiki
```

Each builds both bundles, then opens a second VS Code window with the example as
its workspace and every other extension disabled. Add `--print` to see the
command without running it:

```bash
node scripts/launch-example.mjs small --print
```

**Why a script and no `launch.json`.** F5 runs whichever launch configuration VS
Code last remembered, and that memory lives in workspace storage — invisible, and
not resettable from a file. Reducing the file to a single entry did not help,
because the stored pointer survives. A command has no memory, so the launch
configurations were deleted rather than maintained alongside something that
works.

The script passes `-n`. Without it `code` hands its arguments to an
already-running instance, which ignores `--extensionDevelopmentPath` and quietly
opens an ordinary window — the most likely reason a manual
`code --extensionDevelopmentPath=…` appears to do nothing.

**Do not target `examples/` itself.** `examples/small` uses absolute refs such as
`/shared/tokens`, which are absolute to *its own* root. A root one level up turns
every one of them red: `hmd lint --root examples` reports 3 errors and 12
warnings that do not exist when each tree is linted on its own.

While a host window is running:

- **Cmd+R** reloads the extension after a rebuild. Much faster than relaunching,
  but it does not rebuild — keep `npm run -w hmd-vsc-ext watch` in a terminal for
  a tight loop.
- **Help → Toggle Developer Tools** shows the extension host's console, including
  anything the extension logs or throws.
- The webview is a separate context. Its breakpoints and console need
  **Developer: Open Webview Developer Tools** from the command palette *in the
  host window*.

**If you need breakpoints.** No debugger configuration ships. Add a throwaway
`.vscode/launch.json` of `type: extensionHost` with `--extensionDevelopmentPath`
and an `outFiles` glob over `dist`; the bundles carry source maps, so breakpoints
in TypeScript resolve. It is deliberately not committed — one person's debugger
setup is not worth the F5 ambiguity it reintroduces for everyone else.

## What to exercise by hand

In order, against `examples/small`. These are the behaviours no unit test sees:

1. **The ⚡ is in the editor title bar before you open anything.** The extension
   activates on a workspace containing `.hmd` files, so the button is there on any
   editor, not only on a card. Open `specs/auth/login.hmd` and click it: a preview
   tab opens **in that column**, titled `login`.
2. **Split the window and lock the right group** (`View: Toggle Editor Group
   Lock`), then click the ⚡ in the left group. The tab must land in the left
   group. A third group appearing means something reverted to `ViewColumn.Beside`.
3. **Line 38, `![[token#^definition]]`.** It must render as a bordered card headed
   `glossary/token.hmd`, with a `▾` toggle and an "embed" badge — not as anonymous
   inline prose. Clicking the header opens the *embedded* card.
4. **`glossary/index.hmd` line 11.** `[[idempotency]]` renders red with a dashed
   underline; clicking it offers to create the card where the resolver would next
   have looked.
5. **The Problems panel.** Exactly one entry, `HMD001` at
   `glossary/index.hmd:11:3`. Cross-check with
   `uv run hmd lint --root examples/small`.
6. **Type without saving.** The preview follows about 150 ms behind. Type `[[to`
   and stop: the preview keeps rendering with `[[to` as literal text, and no
   squiggle appears on the cursor's line. Move away and wait ~500 ms — the
   diagnostic then arrives.
7. **Scroll either pane.** They track each other without fighting.
8. **Backlinks tab** on `glossary/token.hmd`: inbound cards listed, link and
   embed edges labelled differently.
9. **Collapse an embed card, then edit the source.** The card stays collapsed and
   the preview does not jump to the top. This is keyed DOM patching, and it is the
   behaviour most likely to regress silently.

`examples/cs-alg-sorting` is the feature-rich fixture and what `npm run example`
opens: five sorting algorithms, seven D2 flowcharts, KaTeX throughout, `!!!` and
`???` callouts, block embeds, and cross-card links. It lints clean under
`--strict`, and every diagram in it compiles with `d2`.

**Diagrams need `d2`.** A `d2` fence draws only if a renderer is available: `d2`
on `PATH`, then `docker run terrastruct/d2:latest`. With neither, the block shows
its source and says which two things were looked for — a diagram that is not drawn
is not a defect in the card. Everything else renders with no external tool.

```bash
brew install d2      # or see https://d2lang.com
```

**Expected rough edges.** `login.hmd` exercises callouts, math, task lists,
tables, footnotes, code fences, all six link constructs, and a D2 diagram; all of
them should render. What remains ledgered is narrower — `~x~` subscript, setext
headings, raw HTML (escaped here by design), and column numbers after
astral-plane characters — and the full list with reasons is
[`conformance-xfail.json`](../hmd-ts-core/conformance-xfail.json).

## Package the VSIX

```bash
npm run -w hmd-vsc-ext package
code --install-extension tools/hmd-vsc-ext/hmd-vsc-ext-0.1.0.vsix
```

Reload the window afterwards, and uninstall from the Extensions panel when you
are done — this one modifies your editor, unlike the development host. The VSIX
is ~440 KB, mostly KaTeX's fonts, and carries no `node_modules`:
[`.vscodeignore`](.vscodeignore) keeps it to the two bundles and the static
assets they need. `README.md`, `CHANGELOG.md`, and `LICENSE` travel too — the
marketplace renders the first two as its Details and Changelog tabs, which is why
this tool has its own rather than borrowing the repository's.

**The identifier is `hyper-markdown.hmd-vsc-ext` and is permanent from the first
publish.** Renaming afterwards means a second listing and every install of the
first one stranded on it. Nothing is published yet, so nothing needs a rename —
but do not change `name` or `publisher` casually now that they are settled.

## Regenerating the gallery icon

`media/logo.svg` is the bolt, copied byte-for-byte from
`doc/wiki/assets/logo.svg`. `vsce` will not accept an SVG for the manifest's
`icon` field, so a PNG is committed beside it. It is generated once, not on every
build — the CI runner has no guaranteed librsvg, and the source does not change:

```bash
sed 's/viewBox="0 0 24 24"/viewBox="-4 -4 32 32"/' media/logo.svg > /tmp/padded.svg
rsvg-convert -w 128 -h 128 -b none /tmp/padded.svg -o media/logo.png
```

The widened `viewBox` is the padding: rendered from the original the bolt runs
edge to edge, which reads as clipped at gallery size.

## Before you open a pull request

```bash
npm run typecheck && npm run build
HMD_REQUIRE_PARITY=1 npm test        # both TypeScript suites
npm run -w hmd-vsc-ext package       # the VSIX is a CI gate too
```

Then walk the manual list above if you touched the preview, the protocol, or the
panel surface.

## The integration suite is parked

Written, compiling, and parked on branch `feat/vsc-ext-1` rather than merged. It
runs the extension inside a real VS Code via `@vscode/test-cli` and covers what
unit tests cannot: activation, the language id, diagnostics reaching the Problems
panel, command registration, and a re-lint of an unsaved buffer.

It does not run on macOS today, and neither blocker is in this code:
`@vscode/test-electron` 2.5.2 spawns `Contents/MacOS/Electron`, VS Code 1.132
ships that binary as `Code`, and symlinking around the rename invalidates the
`.app` signature so macOS kills the process with `SIGKILL`. Untested next step is
`@vscode/test-electron` 3.1.0. Neither blocker exists on a Linux runner, so when
this is unparked it belongs in CI under `xvfb-run`, not on a laptop. The harness
also downloads ~305 MB (~912 MB unpacked) on first run, which is why it is not
part of `npm test`.

That branch's own README still names the package `packages/vscode-hyper-markdown`
— it predates the `tools/` layout and will need the rename when it is unparked.
