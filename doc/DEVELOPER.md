# Developer guide

An index. The rest of `doc/` is declarative — models declare what the system is,
proposals record decisions, the wiki explains concepts — and this page used to be
the one place that said *which command to type*. Each tool now says that for
itself, beside its own code, because a command and the thing it runs drift apart
the moment they live in different directories.

| Guide | What it covers |
| --- | --- |
| [`DEVELOP.md`](../DEVELOP.md) | The repository: setup, the gates, the layout, the `doc/` conventions, the site and its deploy, proposal numbering |
| [`tools/hmd/DEVELOP.md`](../tools/hmd/DEVELOP.md) | The Python tool: the test loop, dependency policy, packaging, and cutting a release |
| [`tools/hmd-ts-core/DEVELOP.md`](../tools/hmd-ts-core/DEVELOP.md) | `@hyper-markdown/core`: build, the `WorkspaceHost` port, the conformance corpus and its ledger |
| [`tools/hmd-vsc-ext/DEVELOP.md`](../tools/hmd-vsc-ext/DEVELOP.md) | The extension: the two bundles, the Extension Development Host, the manual walkthrough, the VSIX, the parked integration suite |

Every tool lives under `tools/`, one directory each:

- **`tools/hmd`** — the Python line: parser, resolver, linter, graph checker, and
  the MkDocs plugin, published to PyPI as `hyper-markdown`. Canonical for the
  format's semantics, and the future home of the `pygls` language server.
- **`tools/hmd-ts-core`** — `@hyper-markdown/core`, the TypeScript half of the
  conformance contract. A second implementation, not extension code.
- **`tools/hmd-vsc-ext`** — the VS Code extension.

Implementation status for the two TypeScript tools is
[`tools/STATUS.md`](../tools/STATUS.md); everything else is tracked per proposal,
in `doc/proposals/HMD-NNNN/STATUS.md`.
