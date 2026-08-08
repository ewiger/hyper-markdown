# Developer guide

Procedural notes: how to build, run, and test each half of the project. The
rest of `doc/` is declarative — models declare what the system is, proposals
record decisions, the wiki explains concepts. This file is the one place that
says *which command to type*.

Two implementations live in this repository:

Every tool lives under `tools/`, one directory each:

- **`tools/hmd`** — the Python line: parser, resolver, linter, graph checker,
  and the MkDocs plugin, published to PyPI as `hyper-markdown`. Canonical for
  the format's semantics, and the future home of the `pygls` language server.
- **`tools/hmd-ts-core`** — `@hyper-markdown/core`, the TypeScript half of the
  conformance contract. A second implementation, not extension code.
- **`tools/hmd-vsc-ext`** — the VS Code extension. Documented below.

---

## VSC-EXT — the VS Code extension

Specified by [HMD-0021](proposals/HMD-0021/README.md); its parser, resolver, and
renderer come from `@hyper-markdown/core`, specified by
[HMD-0020](proposals/HMD-0020/README.md). Implementation status lives in
[`tools/STATUS.md`](../tools/STATUS.md).

### Layout

```text
package.json                 npm workspaces root
tools/hmd-ts-core/           @hyper-markdown/core — parser, resolver, IR
tools/hmd-vsc-ext/           the extension
conformance/cases/           the shared corpus (HMD-0020 §10)
```

The TypeScript half touches no file under `tools/hmd/`, which is what lets it
develop on its own branch and merge back mechanically.

### Prerequisites

Node 20 or later. Python is **not** required to run the extension — that is a
design constraint (VSX-060), not an oversight. It *is* required to run the
conformance gate, which asks the canonical implementation what the right answer
is.

```bash
npm ci                       # both packages
uv sync                      # only for the parity check
```

`uv sync` runs at the repository root, which is a uv workspace root: it installs
`tools/hmd` into one `.venv` and puts `hmd` on `uv run`'s path.

### Build

```bash
npm run build                # core (tsc) then the extension (esbuild)
npm run typecheck            # both packages, no emit
npm run -w hmd-vsc-ext watch # rebuild both bundles on save
```

The extension produces two bundles: `dist/extension.js` for the Node extension
host, and `media/webview.js` for the sandboxed webview. Both are gitignored.

### Testing

#### Automated

```bash
npm test                              # both packages, 151 tests
npm run -w @hyper-markdown/core test  # 107: scanner, resolver, IR, corpus, parity
npm run -w hmd-vsc-ext test           # 44: renderer under jsdom, protocol, CSP
```

Two of those suites are doing more than they look:

- **`test/parity.test.ts`** shells out to `hmd lint --format json` and requires
  byte-identical diagnostics on `examples/small`, `examples/cs-alg-sorting`, and
  `doc/wiki`. It skips if the `hmd` CLI is unavailable, so a contributor without
  a Python environment can still work. Set `HMD_REQUIRE_PARITY=1` and the skip
  becomes a failure instead — CI sets it, because a job that installs Python in
  order to ask the canonical implementation should not be able to pass by
  quietly not asking.
- **`test/corpus.test.ts`** runs every case in `conformance/cases/`. Each
  `expected.json` was generated from `hmd lint` and `hmd graph`, never written
  by hand. Known divergences live in
  [`conformance-xfail.json`](../tools/hmd-ts-core/conformance-xfail.json), and a
  ledgered case that *starts passing* fails the build.

#### Manual — the Extension Development Host

```bash
npm run example            # examples/cs-alg-sorting — callouts, math, diagrams
npm run example:small      # examples/small — namespaces, imports, a red link
npm run example:wiki       # this repository's own doc/wiki
```

Each builds both bundles, then opens a second VS Code window with the example
as its workspace and every other extension disabled. Add `--print` to see the
command without running it:

```bash
node scripts/launch-example.mjs small --print
```

**Why a script and no `launch.json`.** F5 runs whichever launch configuration
VS Code last remembered, and that memory lives in workspace storage — invisible,
and not resettable from a file. Reducing the file to a single entry did not help,
because the stored pointer survives. A command has no memory, so the launch
configurations were deleted rather than maintained alongside something that
works.

The script passes `-n`. Without it `code` hands its arguments to an
already-running instance, which ignores `--extensionDevelopmentPath` and quietly
opens an ordinary window — the most likely reason a manual `code
--extensionDevelopmentPath=…` appears to do nothing.

**Do not target `examples/` itself.** `examples/small` uses absolute refs such
as `/shared/tokens`, which are absolute to *its own* root. A root one level up
turns every one of them red: `hmd lint --root examples` reports 3 errors and 12
warnings that do not exist when each tree is linted on its own.

**If you need breakpoints.** No debugger configuration ships. Add a throwaway
`.vscode/launch.json` of `type: extensionHost` with
`--extensionDevelopmentPath` and an `outFiles` glob over
`tools/hmd-vsc-ext/dist`; the bundles carry source maps, so
breakpoints in TypeScript resolve. It is deliberately not committed — one
person's debugger setup is not worth the F5 ambiguity it reintroduces for
everyone else.

While a host window is running:

- **Cmd+R** in it reloads the extension after a rebuild. Much faster than
  relaunching, but it does not rebuild — keep
  `npm run -w hmd-vsc-ext watch` in a terminal for a tight loop.
- **Help → Toggle Developer Tools** in the host window shows the extension
  host's console, including anything the extension logs or throws.
- The webview is a separate context. Its breakpoints and console need
  **Developer: Open Webview Developer Tools** from the command palette *in the
  host window*.

#### Manual — installing the VSIX

Use this to test under real conditions, or to hand someone a build. It does
modify your editor; uninstall from the Extensions panel afterwards.

```bash
npm run -w hmd-vsc-ext package
code --install-extension tools/hmd-vsc-ext/hmd-vsc-ext-0.1.0.vsix
```

Reload the window afterwards. The VSIX is ~440 KB — mostly KaTeX's fonts —
and carries no `node_modules`.

#### Regenerating the gallery icon

`media/logo.svg` is the bolt, copied byte-for-byte from `feat/mvp`'s
`doc/wiki/assets/logo.svg`. `vsce` will not accept an SVG for the manifest's
`icon` field, so a PNG is committed beside it. It is generated once, not on
every build — the CI runner has no guaranteed librsvg, and the source does not
change:

```bash
cd tools/hmd-vsc-ext
sed 's/viewBox="0 0 24 24"/viewBox="-4 -4 32 32"/' media/logo.svg > /tmp/padded.svg
rsvg-convert -w 128 -h 128 -b none /tmp/padded.svg -o media/logo.png
```

The widened `viewBox` is the padding: rendered from the original the bolt runs
edge to edge, which reads as clipped at gallery size.

#### What to exercise

In order, against `examples/small`:

1. **The ⚡ is in the editor title bar before you open anything.** The extension
   activates on a workspace that contains `.hmd` files, so the button is there
   on any editor, not only on a card. Open `specs/auth/login.hmd` and click it:
   a preview tab opens **in that column**, titled `login`.
2. **Split the window and lock the right group** (`View: Toggle Editor Group
   Lock`), then click the ⚡ in the left group. The tab must land in the left
   group. A third group appearing means something reverted to
   `ViewColumn.Beside` — see HMD-0021 §3 and issue 0103.
3. **Line 38, `![[token#^definition]]`.** It must render as a bordered card
   headed `glossary/token.hmd`, with a `▾` toggle and an "embed" badge — not as
   anonymous inline prose. Clicking the header opens the *embedded* card.
4. **`glossary/index.hmd` line 11.** `[[idempotency]]` renders red with a dashed
   underline; clicking it offers to create the card where the resolver would
   next have looked.
5. **The Problems panel.** Exactly one entry, `HMD001` at
   `glossary/index.hmd:11:3`. Cross-check with
   `uv run hmd lint --root examples/small`.
6. **Type without saving.** The preview follows about 150 ms behind. Type
   `[[to` and stop: the preview keeps rendering with `[[to` as literal text, and
   no squiggle appears on the cursor's line. Move away and wait ~500 ms — the
   diagnostic then arrives.
7. **Scroll either pane.** They track each other without fighting.
8. **Backlinks tab** on `glossary/token.hmd`: inbound cards listed, link and
   embed edges labelled differently.
9. **Collapse an embed card, then edit the source.** The card stays collapsed
   and the preview does not jump to the top. This is keyed DOM patching
   (VSX-019) and it is the behaviour most likely to regress silently.

#### The feature-rich fixture

`examples/cs-alg-sorting` is what `npm run example` opens: five sorting
algorithms, seven D2 flowcharts, KaTeX throughout, `!!!` and `???` callouts,
block embeds, and cross-card links. It lints clean under `--strict`, and every
diagram in it compiles with `d2`.

#### Diagrams need `d2`

A ```` ```d2 ```` fence draws only if a renderer is available: `d2` on `PATH`, then
`docker run terrastruct/d2:latest`. With neither, the block shows its source and
says which two things were looked for — a diagram that is not drawn is not a
defect in the card. Everything else on a card renders without any external tool.

```bash
brew install d2      # or see https://d2lang.com
```

#### Expected rough edges

`login.hmd` exercises callouts, math, task lists, tables, footnotes, code
fences, all six link constructs, and a D2 diagram; all of them should render.
What remains ledgered is narrower: `~x~` subscript, setext headings, raw HTML
(escaped here by design), and column numbers after astral-plane characters. The
full list is in
[`conformance-xfail.json`](../tools/hmd-ts-core/conformance-xfail.json).

#### The integration suite

Parked on branch `feat/vsc-ext-1`, not merged. It runs the extension inside a
real VS Code via `@vscode/test-cli` and covers what unit tests cannot:
activation, the language id, diagnostics reaching the Problems panel, command
registration, and a re-lint of an unsaved buffer.

It does not run on macOS today. `@vscode/test-electron` 2.5.2 spawns
`Contents/MacOS/Electron`, VS Code 1.132 ships that binary as `Code`, and
symlinking around the rename invalidates the `.app` signature so macOS kills the
process. Neither blocker exists on a Linux runner. Note also that the harness
downloads ~305 MB (~912 MB unpacked) on first run, which is why it is not part
of `npm test`. See the integration suite's own README on that branch, which
still names the package `packages/vscode-hyper-markdown` — that branch predates
the `tools/` layout and will need the rename when it is unparked.

### CI

`.github/workflows/ci.yml` runs two independent jobs so neither half blocks the
other's merge:

- **test** — pytest across Python 3.11–3.14, plus the two `hmd lint` gates.
- **typescript** — typecheck, build, `npm test` (corpus and parity included),
  and `vsce package`, uploading the VSIX as an artifact.
