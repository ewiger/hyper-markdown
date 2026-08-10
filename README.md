<div align="center">

<img src="https://raw.githubusercontent.com/ewiger/hypermarkdown/main/doc/wiki/assets/logo.png" width="76" height="76" alt="">

# HyperMarkDown

**Build your own local wiki knowledge base**

[![Documentation](https://img.shields.io/badge/docs-hypermarkdown.org-ffb300)](https://hypermarkdown.org/)
[![Spec](https://img.shields.io/badge/spec-0.1-blue)](https://hypermarkdown.org/wiki/hmd-lang-spec/)
[![CI](https://github.com/ewiger/hypermarkdown/actions/workflows/ci.yml/badge.svg)](https://github.com/ewiger/hypermarkdown/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

📖 **[hypermarkdown.org](https://hypermarkdown.org/) — the documentation.**
What the format is, why it exists, and every construct in it. Start there.

HyperMarkDown (`.hmd`) is ordinary markdown plus links to knowledge graph: you
write the *name* of a card and it is resolved for you, a card can be built out of
other cards, and a linter checks the whole graph. Every `.md` file is already
valid `.hmd`, so a tree is adopted one rename at a time.

```markdown
See [[tokens#Rotation|the rotation window]], and say it once rather than twice:

![[tokens#^definition]]
```

This repository is both halves of the project: 
- the **language** — its
specification, the records that argue it, and the website they are published as 
- and the **tools** that implement it, one package each under `tools/`.

## The tools

Each carries its own version, README, changelog, and license.

### [`hmd`](tools/hmd/) — the CLI, the library, the MkDocs plugin

[![PyPI](https://img.shields.io/pypi/v/hypermarkdown.svg)](https://pypi.org/project/hypermarkdown/)
[![Python versions](https://img.shields.io/pypi/pyversions/hypermarkdown.svg)](https://pypi.org/project/hypermarkdown/)
[![Changelog](https://img.shields.io/badge/changelog-tools%2Fhmd-informational)](tools/hmd/CHANGELOG.md)

The Python line, published to PyPI as
[`hypermarkdown`](https://pypi.org/project/hypermarkdown/): the `hmd` command
(`lint`, `render`, `graph`), the library under it, and a MkDocs plugin that
builds a tree of cards into a website. **Canonical** — where two implementations
disagree, this one defines the answer. It will also host the language server.

### [`@hypermarkdown/core`](tools/hmd-ts-core/) — the TypeScript implementation

[![npm](https://img.shields.io/badge/npm-not%20yet%20published-lightgrey)](tools/hmd-ts-core/README.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-5fa04e)](tools/hmd-ts-core/DEVELOP.md)
[![Changelog](https://img.shields.io/badge/changelog-tools%2Fhmd--ts--core-informational)](tools/hmd-ts-core/CHANGELOG.md)

A second implementation of the format, not extension code. It answers to the
same [conformance corpus](examples/conformance/) the canonical tool does.

### [VS Code extension](tools/hmd-vsc-ext/) — live preview for `.hmd`

[![VS Marketplace](https://vsmarketplacebadges.dev/version-short/hypermarkdown.hmd-vsc-ext.svg?color=007acc&label=marketplace)](https://marketplace.visualstudio.com/items?itemName=hypermarkdown.hmd-vsc-ext)
[![Open VSX](https://img.shields.io/open-vsx/v/hypermarkdown/hmd-vsc-ext?color=c160ef&label=open%20vsx)](https://open-vsx.org/extension/hypermarkdown/hmd-vsc-ext)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.90-007acc)](https://hypermarkdown.org/tools/vscode/)
[![Changelog](https://img.shields.io/badge/changelog-tools%2Fhmd--vsc--ext-informational)](tools/hmd-vsc-ext/CHANGELOG.md)

Live preview that keeps the embed boundary visible, backlinks, red links, and
diagnostics. Today it is the preview and the viewer, rendered in TypeScript, so
there is nothing to install to see a card. Completion and the rest of the
language-server features arrive with the Python server.

```
ext install hypermarkdown.hmd-vsc-ext
```

![The VS Code extension previewing a card: source on the left, rendered card on
the right, with resolved links, a table, a callout, and a d2
diagram.](https://raw.githubusercontent.com/ewiger/hypermarkdown/main/doc/assets/hmd-vsc-ext-screenshot-1.png)

## What else is in here

- [`examples/`](examples/) — runnable fixture wikis, linted by both, and
  [`examples/conformance/cases/`](examples/conformance/) — the language-neutral
  corpus that arbitrates between the two implementations
- [`doc/`](doc/) — the knowledge base the website is built from: the book, the
  `.hmd` wiki, and the numbered proposals that specify everything
- [`tests/`](tests/) — the repository's own guards, for its prose and its site

## Contributing

- **[DEVELOP.md](DEVELOP.md)** — the language and the website: how the
  documentation tree is organised, the four versions, and how
  hypermarkdown.org is published. Read this first.
- **A tool's own guide** for its code — [the Python
  tool](tools/hmd/DEVELOP.md), [the TypeScript
  core](tools/hmd-ts-core/DEVELOP.md), [the
  extension](tools/hmd-vsc-ext/DEVELOP.md). Each carries that tool's test loop,
  gates, and release.
- **[`doc/proposals/`](doc/proposals/)** — numbered specifications. A change to
  the format or the tooling starts as one; reserve its number in
  [`doc/proposals/README.md`](doc/proposals/README.md).
- **Progress is tracked per proposal**, in `doc/proposals/HMD-NNNN/STATUS.md`,
  and updated in the same commit that changes the code.
- **Kanban board** - in `doc/issues/**`, for the repository's own work, and for the language and the
  website, as well as the tools. The board is public, but the issues are owned by the contributors team.

### Getting set up

Most contributions are to the language and the site — the prose, the proposals,
the `.hmd` wiki — and that work needs Python even though none of it is Python:
this repository's documentation *is* a wiki, built by the MkDocs plugin the
Python tool ships. The sync installs that toolchain; the serve gives you a local
preview on `127.0.0.1:8000` that rebuilds as you edit.

```bash
git clone https://github.com/ewiger/hypermarkdown
cd HyperMarkDown
uv sync --locked      # MkDocs, the plugin, and the `hmd` command
uv run mkdocs serve   # preview the book and the wiki as you write
```

Writing `.hmd` in a tree of your own needs none of that today — the [VS Code
extension](tools/hmd-vsc-ext/) previews a card beside the file you are typing
in, and the preview is TypeScript end to end. Install it from the marketplace,
or build the VSIX from this clone: [its
README](tools/hmd-vsc-ext/README.md#install).

Before opening a PR, run whichever half you touched:

```bash
uv run python -m pytest    # the Python tool and the site
npm install && npm test    # the TypeScript tools
```

## Feature requests, issues and PRs
Feature requests, issues and PRs are welcome at
[GitHub issues](https://github.com/ewiger/hypermarkdown/issues).
Once accepted, a PR should be merged into the `main` branch, and the issue closed. Again, **Kanban board** - in `doc/issues/**`, for the contributors (or agents) to track the progress of the issue and the PR internally.

## License

MIT — see [LICENSE](LICENSE).
