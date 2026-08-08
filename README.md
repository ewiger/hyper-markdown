<div align="center">

<img src="https://raw.githubusercontent.com/ewiger/hyper-markdown/main/doc/wiki/assets/logo.svg" width="76" height="76" alt="">

# hyper-markdown

**Build your own local wiki knowledge base**

[![CI](https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml/badge.svg)](https://github.com/ewiger/hyper-markdown/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

📖 **[hyper-markdown.org](https://hyper-markdown.org/) — the documentation.**
What the format is, why it exists, and every construct in it. Start there.

Hyper-markdown (`.hmd`) is ordinary markdown plus links to knowledge graph: you
write the *name* of a card and it is resolved for you, a card can be built out of
other cards, and a linter checks the whole graph. Every `.md` file is already
valid `.hmd`, so a tree is adopted one rename at a time.

```markdown
See [[tokens#Rotation|the rotation window]], and say it once rather than twice:

![[tokens#^definition]]
```

This repository is both halves of the project: the **language** — its
specification, the records that argue it, and the website they are published as —
and the **tools** that implement it, one package each under `tools/`.

## The tools

Each carries its own README, changelog, and license.

- **[`tools/hmd/`](tools/hmd/)** — the Python line, published to PyPI as
  [`hyper-markdown`](https://pypi.org/project/hyper-markdown/): the `hmd` command
  (`lint`, `render`, `graph`), the library under it, and a MkDocs plugin that
  builds a tree of cards into a website. **Canonical** — where two
  implementations disagree, this one defines the answer. It will also host the
  language server.
- **[`tools/hmd-ts-core/`](tools/hmd-ts-core/)** —
  [`@hyper-markdown/core`](tools/hmd-ts-core/README.md), the TypeScript
  implementation. A second implementation of the format, not extension code.
- **[`tools/hmd-vsc-ext/`](tools/hmd-vsc-ext/)** — the
  [VS Code extension](tools/hmd-vsc-ext/README.md): live preview that keeps the
  embed boundary visible, backlinks, red links, and diagnostics, with no Python
  required.

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
  hyper-markdown.org is published. Read this first.
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
- **Kanban board** - doc/issues/**, for the repository's own work, and for the language and the
  website, as well as the tools. The board is public, but the issues are owned by the contributors team.

```bash
git clone https://github.com/ewiger/hyper-markdown
cd hyper-markdown
uv sync --locked && uv run python -m pytest   # the Python tool and the site
npm install && npm test                       # the TypeScript tools
```

Feature requests, issues and PRs are welcome at
[github.com/ewiger/hyper-markdown](https://github.com/ewiger/hyper-markdown).

## License

MIT — see [LICENSE](LICENSE).
