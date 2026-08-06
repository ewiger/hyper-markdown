# Developer guide

Procedural notes: how to build, run, and test each half of the project. The
rest of `doc/` is declarative — models declare what the system is, proposals
record decisions, the wiki explains concepts. This file is the one place that
says *which command to type*.

Two implementations live in this repository:

- **The Python line** — `src/hyper_markdown/`, the `hmd` CLI, the MkDocs
  plugin. Canonical for the format's semantics.
- **The TypeScript line** — `packages/`, the VS Code extension and the core it
  depends on. Documented below.

---

## VSC-EXT — the VS Code extension

Specified by [HMD-0021](proposals/HMD-0021/README.md); its parser, resolver, and
renderer come from `@hyper-markdown/core`, specified by
[HMD-0020](proposals/HMD-0020/README.md). Implementation status lives in
[`packages/STATUS.md`](../packages/STATUS.md).

### Layout

```text
package.json                        npm workspaces root
packages/hmd-core/                  @hyper-markdown/core — parser, resolver, IR
packages/vscode-hyper-markdown/     the extension
conformance/cases/                  the shared corpus (HMD-0020 §10)
```

The TypeScript half touches no file under `src/` or `tests/`, which is what lets
it develop on its own branch and merge back mechanically.

### Prerequisites

Node 20 or later. Python is **not** required to run the extension — that is a
design constraint (VSX-060), not an oversight. It *is* required to run the
conformance gate, which asks the canonical implementation what the right answer
is.

```bash
npm ci                       # both packages
uv venv && uv pip install -e ".[dev]"   # only for the parity check
```

### Build

```bash
npm run build                # core (tsc) then the extension (esbuild)
npm run typecheck            # both packages, no emit
npm run -w vscode-hyper-markdown watch   # rebuild both bundles on save
```

The extension produces two bundles: `dist/extension.js` for the Node extension
host, and `media/webview.js` for the sandboxed webview. Both are gitignored.

### Testing

#### Automated

```bash
npm test                                  # both packages, 141 tests
npm run -w @hyper-markdown/core test      # 106: scanner, resolver, IR, corpus, parity
npm run -w vscode-hyper-markdown test     # 35: renderer under jsdom, protocol, CSP
```

Two of those suites are doing more than they look:

- **`test/parity.test.ts`** shells out to `hmd lint --format json` and requires
  byte-identical diagnostics on `examples/small` and `doc/wiki`. It skips with a
  warning if the `hmd` CLI is unavailable, so a contributor without a Python
  environment can still work — but CI runs both, and drift fails there.
- **`test/corpus.test.ts`** runs every case in `conformance/cases/`. Each
  `expected.json` was generated from `hmd lint` and `hmd graph`, never written
  by hand. Known divergences live in
  [`conformance-xfail.json`](../packages/hmd-core/conformance-xfail.json), and a
  ledgered case that *starts passing* fails the build.

#### Manual — the Extension Development Host

The recommended route. It touches nothing in your real editor.

**Press F5** from the repository root. There is exactly one configuration, so
there is nothing to select: VS Code remembers the last configuration you picked,
and a list of several means F5 lands wherever you were last rather than where
you meant.

A second VS Code window opens with `examples/cs-alg-sorting` as its workspace
and every other extension disabled — the fixture that exercises callouts, math,
diagrams, embeds, and cross-card links.

For another tree, pass it on the command line rather than adding a
configuration:

```bash
npm run build
code -n --extensionDevelopmentPath=$PWD/packages/vscode-hyper-markdown \
  $PWD/examples/small
```

`-n` matters: without it, `code` hands the arguments to an already-running
instance, which ignores `--extensionDevelopmentPath` and quietly opens an
ordinary window.

**Do not point a configuration at `examples/` itself.** `examples/small` uses
absolute refs such as `/shared/tokens`, which are absolute to *its own* root. A
root one level up turns every one of them red — `hmd lint --root examples`
reports 3 errors and 12 warnings that do not exist when each tree is linted on
its own.

What F5 actually does — the configuration is type `extensionHost`, so instead of
debugging a program VS Code launches a second copy of itself:

| Argument | Effect |
| --- | --- |
| `--extensionDevelopmentPath=packages/vscode-hyper-markdown` | Load the extension from source. Nothing is installed; the marketplace is not involved. |
| `--disable-extensions` | Every other extension off, so anything you see is ours. |
| `examples/small` | The new window's workspace folder. |

The debugger attaches to the new window's extension host, and `outFiles` points
at the source maps, so breakpoints in TypeScript work — you can stop inside the
resolver while the preview waits.

While it is running:

- **Cmd+R** in the dev window reloads the extension after a rebuild. Much faster
  than relaunching.
- The **Debug Console** in your main window carries the extension's output and
  any thrown errors.
- The webview is a separate context. Its breakpoints and console need
  **Developer: Open Webview Developer Tools** from the command palette *in the
  dev window*.

Both configurations declare `preLaunchTask: "build: hyper-markdown extension"`,
which runs `npm run build` — `tsc` for the core, then esbuild for both bundles —
so F5 always launches current code. The whole build is well under a second, and
paying it on every launch is cheaper than the one time you debug a stale bundle
and conclude the fix did not work.

Cmd+R does **not** rerun that task. For a tight edit loop keep
`npm run -w vscode-hyper-markdown watch` in a terminal and reload with Cmd+R;
that path rebuilds the extension bundle only, so a change under
`packages/hmd-core/` still needs `npm run build` or a fresh F5.

#### Manual — installing the VSIX

Use this to test under real conditions, or to hand someone a build. It does
modify your editor; uninstall from the Extensions panel afterwards.

```bash
npm run -w vscode-hyper-markdown package
code --install-extension packages/vscode-hyper-markdown/vscode-hyper-markdown-0.1.0.vsix
```

Reload the window afterwards. The VSIX is ~440 KB — mostly KaTeX's fonts —
and carries no `node_modules`.

#### What to exercise

In order, against `examples/small`:

1. **Open `specs/auth/login.hmd`.** The extension activates on the first `.hmd`
   file. The **Hyper-Markdown icon appears in the activity bar** — two cards
   with a link between them.
2. **Move the view.** VS Code lets an extension contribute a view container to
   the activity bar or the panel, not to the secondary side bar. Drag the icon
   to the right-hand side bar once and VS Code remembers it. This is the answer
   to open question V1 in HMD-0021 §3.
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

`examples/cs-alg-sorting` is the example to open when testing callouts, math,
and diagrams: five sorting algorithms, seven D2 flowcharts, KaTeX throughout,
`!!!` and `???` callouts, block embeds, and cross-card links. It lints clean
under `--strict`, and every diagram in it compiles with `d2`.

Launch it with:

```bash
code --extensionDevelopmentPath=packages/vscode-hyper-markdown examples/cs-alg-sorting
```

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
[`conformance-xfail.json`](../packages/hmd-core/conformance-xfail.json).

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
of `npm test`. See `packages/vscode-hyper-markdown/test/integration/README.md`
on that branch.

### CI

`.github/workflows/ci.yml` runs two independent jobs so neither half blocks the
other's merge:

- **test** — pytest across Python 3.11–3.14, plus the two `hmd lint` gates.
- **typescript** — typecheck, build, `npm test` (corpus and parity included),
  and `vsce package`, uploading the VSIX as an artifact.
