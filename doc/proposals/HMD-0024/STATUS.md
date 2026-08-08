# HMD-0024 — Status

Progress tracking for [HMD-0024](README.md): the `tools/` layout and a Python
language server.

**This file is the only place work against this proposal is tracked.** Not
the memos under `doc/memory/`, not the cards under `doc/wiki/`, not the
proposal itself. A decision that needs discussion is named here as an open
question and argued wherever it belongs; nothing else may hold a task list.
Update the row in the same commit that changes the code.

**Snapshot** (2026-08-08) — the layout is done and every gate is green on it.
The language server is decided and unbuilt. The one finding worth carrying
forward is L1: the Python leaf functions already take text, and the workspace
index does not, so the constraint the server depends on holds everywhere except
the single layer that ingests documents.

## Done

| ID | Work point | Spec |
| --- | --- | --- |
| W1.1 | Three units moved under `tools/` with history preserved — `tools/hmd`, `tools/hmd-ts-core`, `tools/hmd-vsc-ext` | What each tool owns |
| W1.2 | `@hyper-markdown/core` kept as its own tool rather than folded into the extension | What each tool owns |
| W2.1 | `tools/hmd/pyproject.toml` builds the `hyper-markdown` distribution; name, script, and MkDocs entry point unchanged | The repository root is a workspace, not a project |
| W2.2 | Root `pyproject.toml` is a uv workspace root with no `[project]` table, a `dev` group, and both test roots in `testpaths` | The repository root is a workspace, not a project |
| W2.3 | `README.md`, `LICENSE`, `CHANGELOG.md`, and `examples` symlinked into `tools/hmd`; sdist verified to carry real bytes for all four | The packaging inputs the tool does not own |
| W2.4 | `uv build --package hyper-markdown` on both the release path and the pull-request package check | The repository root is a workspace, not a project |
| W3.1 | Python suite split: nine unit files plus the CLI and worked-example suites to `tools/hmd/tests`, the prose and site guards left at `tests/` | Where tests live, and what they answer for |
| W4.1 | Extension renamed to `hmd-vsc-ext`; publisher, display name, language id, commands, and settings unchanged | The extension's identity |
| W4.2 | `repoRoot` in the core's tests searches upward for `conformance/cases` and `examples` and throws with the search printed, replacing a fixed `../../..`; the ledger is named relative to the package | Test Plan |
| W4.3 | Parity suite reports a real skip through `ctx.skip()` and fails instead when `HMD_REQUIRE_PARITY` is set; CI sets it | Test Plan |
| W4.4 | Workflows, example launcher, npm workspace list, extension path mapping, and all developer documentation repointed | Backwards Compatibility |

## TODO

### Planned work

| ID | Work point | Blocked on |
| --- | --- | --- |
| W5 | Text overrides on the Python workspace index: per-path text supplied by a caller, consulted ahead of any read | nothing — see L1 |
| W6 | Per-card invalidation on the Python workspace index, replacing the whole-tree load performed once at construction | W5 |
| W7 | `pygls` server in `tools/hmd`, and where it is declared as a dependency | W5, W6, Q2 |
| W8 | Rename the package in the parked integration suite on `feat/vsc-ext-1`, which still says `packages/vscode-hyper-markdown` | that branch being unparked |

### Broken

Nothing. Every gate passes on the new layout: 236 Python tests, 151 TypeScript
tests with parity required rather than skipped, three `hmd lint` gates,
`mkdocs build --strict`, and a wheel built and smoke-tested from a clean
environment.

### Limitations

| ID | Limitation | Why it stands |
| --- | --- | --- |
| L1 | The Python workspace index reads every card from disk and offers no way to inject an unsaved buffer | Audited on 2026-08-08 against the "text, not paths" requirement. The leaf functions already honour it: `parse(path, text, rel)` takes text, `mask`, `find_fences`, `line_col`, `split_frontmatter`, and `parse_yaml` are all text-in, and `Document` carries its own `text`, so `expand` and every embed region function work from a document rather than a file. The gap is exactly one layer — `Workspace.__init__` calls `_load`, which walks the root and calls `path.read_text()` per card, with no override map and no per-card invalidation. Everything above it (`lint.check`, `graph.build`, `expand`) takes a `Workspace`, so today they can only ever describe what is on disk. This is W5 and W6, and it is a patch to one class rather than the rewrite the requirement warns about, precisely because the layer below already takes text |
| L2 | The TypeScript side already solved this and the Python side has not | Not a defect, just an asymmetry worth knowing: the TypeScript core reads through an injectable host port and the extension layers unsaved-buffer overrides on top of it. The Python side has never had a caller that needed it, which is why it stayed a precaution |
| L3 | `tools/STATUS.md` tracks two tools in one file, against the repository's per-proposal convention | Inherited, not introduced. The milestones genuinely interleave across the two TypeScript tools. Whether that justifies the exception is Q5 |
| L4 | Four symlinks in `tools/hmd` are load-bearing for the build | The alternative is copies that drift, or a package README that is not the project's. Checked-out symlinks are supported on both platforms CI and development use; a checkout that cannot create them would fail loudly at build time rather than ship something wrong |

### Open questions and blockers

Nothing blocks the layout, which is complete. Every question below blocks
`drafted → accepted`, and Q1–Q3 block the language server.

**This table is the only copy.** [The record](README.md#open-questions) points
here rather than mirroring the list.

| ID | Question |
| --- | --- |
| Q1 | Is the server a subcommand of the existing CLI (`hmd lsp`), or its own console script? |
| Q2 | Is `pygls` a base dependency or an `lsp` extra? An extra keeps `pip install hyper-markdown` small; a base dependency means the server exists wherever the CLI does |
| Q3 | Does the VS Code extension stay on the TypeScript implementation permanently, or gain an opt-in setting for users who have Python and want the canonical answers? |
| Q4 | Does canonicity move if a Rust implementation appears, and what is the procedure? Inherited unresolved; the layout does not settle it |
| Q5 | Should `tools/STATUS.md` split into per-proposal trackers, or does the interleaving justify the standing exception? |

## Gates

```bash
npm run typecheck && npm run build
HMD_REQUIRE_PARITY=1 npm test
uv run python -m pytest
uv run hmd lint --root doc/wiki --strict
uv run hmd lint --root examples/small
uv run hmd lint --root examples/cs-alg-sorting --strict
uv run mkdocs build --strict
uv build --package hyper-markdown
```

## Changelog

- 2026-08-08: drafted alongside [the record](README.md). The layout landed with
  every gate green; the language server is decided and unbuilt, and the text
  ingestion audit that gates it is recorded as L1.
