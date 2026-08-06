# STATUS — the TypeScript line

Where the implementation stands against
[HMD-0020](../doc/proposals/HMD-0020/README.md) and
[HMD-0021](../doc/proposals/HMD-0021/README.md). One row per work point; update
the row in the same commit that changes the code.

The Python line keeps its own [`STATUS.md`](../STATUS.md) on the `feat/mvp`
branch. The two are deliberately separate files so the branches merge without
touching each other.

**Legend** — `done` shipped and gated by a test · `wip` in progress ·
`ready` specified, unblocked, not started · `blocked` waiting on a decision ·
`unspec` no normative text exists yet.

**Snapshot** (2026-08-07): C1–C6 and E1–E5 done. 114 tests green, including
byte-identical diagnostic parity with `hmd lint` on `examples/small` and
`doc/wiki`. E6 (graph tab) and the Python corpus runner are the next blocks.

---

## Milestones

| # | Milestone | State | Gate |
| --- | --- | --- | --- |
| C1 | `@hyper-markdown/core` scaffold | **done** | `npm run -w @hyper-markdown/core typecheck` |
| C2 | Scanner, grammar, slugs, frontmatter | **done** | `test/scan.test.ts`, `test/parse.test.ts` |
| C3 | Four-phase resolver and workspace index | **done** | `test/resolve.test.ts` |
| C4 | Lint rules HMD001–HMD016 | **done** | `test/parity.test.ts` |
| C5 | Conformance corpus and ledger | **done** | `test/corpus.test.ts` |
| C6 | IR, expansion, markdown-it renderer | **done** | `test/render.test.ts` |
| E1 | Extension skeleton, language, grammar | **done** | `npm run -w vscode-hyper-markdown build` |
| E2 | Index, watchers, diagnostics | **done** | `test/protocol.test.ts` |
| E3 | Rendered tab, embeds, scroll sync | **done** | `test/renderer.test.ts` |
| E4 | Backlinks, breadcrumb, create-card, pin | **done** | `test/renderer.test.ts` |
| E5 | Packaging | **done** | `npm run -w vscode-hyper-markdown package` |
| E6 | Graph tab | **ready** | HMD-0021 §10 |

## Work points

### C — `@hyper-markdown/core`

| ID | Work point | Spec | State |
| --- | --- | --- | --- |
| C2.1 | `scan.ts` — masking, offset preservation, construct finders | HMD-0020 §3 | done |
| C2.2 | `slug.ts` — the `toc` slugify and dedup algorithm | §4 | done |
| C2.3 | `frontmatter.ts` — `---` fence, `js-yaml` under JSON_SCHEMA, reserved keys | §5 | done |
| C2.4 | `parse.ts` — grammar of HMD-0001 §2, never throws on partial input | §3, §7 | done |
| C3.1 | `workspace.ts` — phases 0–3, spine walk, sweep, folder notes | §6 | done |
| C3.2 | `WorkspaceHost` port; no Node builtins in `src/` | §1 | done |
| C4.1 | `lint.ts` — all 16 rules, sorted, no new rule IDs | §9 | done |
| C5.1 | `conformance/cases/` generated from the canonical implementation | §10 | done |
| C5.2 | `conformance-xfail.json`, ledger honoured, passing entry fails the build | §10 | done |
| C5.3 | Python corpus runner | §10 | **ready** — belongs to the branch owning `tests/` |
| C6.1 | `expand.ts` — page, `#Section`, `#^id`, depth 16, cycle stack | §8 | done |
| C6.2 | `render.ts` — sentinel substitution, per-block `data-line`, block keys | §3, §7 | done |
| C6.3 | `graph.ts` — nodes, edges, reverse edge map for backlinks | HMD-0021 §9 | done |
| C6.4 | KaTeX, admonition, and details plugins | §3.3 | **ready** — ledgered as gaps |

### E — the extension

| ID | Work point | Spec | State |
| --- | --- | --- | --- |
| E1.1 | Manifest: language `hmd`, grammar, commands, settings | HMD-0021 §1 | done |
| E1.2 | TextMate grammar including `text.html.markdown` | §2 | done |
| E1.3 | esbuild: `dist/extension.js` + `media/webview.js` | §12 | done |
| E2.1 | `VsCodeHost` over `vscode.workspace.fs`, root discovery | §8 | done |
| E2.2 | `Store` — index, watchers, unsaved-buffer overrides | §8, §5.1 | done |
| E2.3 | Diagnostics at 500 ms, suppressed on the cursor's line | §7, §5.1 | done |
| E3.1 | Webview shell, CSP with per-load nonce | §11 | done |
| E3.2 | `patchBlocks` — keyed DOM patching, state preserved | §5.1 | done |
| E3.3 | Embed cards: header, collapse, failure card, nesting | §5 | done |
| E3.4 | Scroll sync: anchors, interpolation, echo lockout | §6 | done |
| E3.5 | Click-through: links, embed headers, reveal-source | §6 | done |
| E4.1 | Backlinks tab, link and embed edges distinguished | §9 | done |
| E4.2 | Breadcrumb, pin toggle | §3 | done |
| E4.3 | `createCard` through `WorkspaceEdit` | §5 | done |
| E5.1 | `.vscodeignore`, VSIX at 96 KB with no `node_modules` | §12 | done |
| E5.2 | Integration suite under `@vscode/test-cli` | Test Plan | **blocked** — see below |
| E6.1 | Graph tab under the §10 contract | §10 | ready |

## Open

- **E5.2 — integration tests.** Written, compiling, and **parked on
  `feat/vsc-ext-1`** (commit `cb8c6e4`). Two blockers, neither in our code:
  `@vscode/test-electron` 2.5.2 spawns `Contents/MacOS/Electron` and VS Code
  1.132.0 ships that binary as `Code`; and symlinking around the rename
  invalidates the `.app` signature, so macOS kills the process with `SIGKILL`.
  Untested next step is `@vscode/test-electron` 3.1.0. Neither blocker exists on
  a Linux runner, so when this is unparked it belongs in CI under `xvfb-run`,
  not on a laptop. The harness also downloads ~305 MB (~912 MB unpacked) on
  first run, which is why it is not in the default test command.
- **C5.3 — the Python corpus runner.** The corpus is written and the TypeScript
  side runs it. Until Python runs it too, the contract is enforced in one
  direction only, and `test/parity.test.ts` is doing the real work by shelling
  out to `hmd lint`.
- **V1 — secondary side bar.** VS Code's `contributes.viewsContainers` accepts
  `activitybar` and `panel`. The container is contributed to the activity bar
  and the user drags it to the secondary side bar once. See HMD-0021 §3.
