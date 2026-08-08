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

This repository is the monorepo that implements the format.

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

- **[DEVELOP.md](DEVELOP.md)** — setup, the gates CI applies, how the
  documentation tree is organised, and how a release is cut. Read this first.
- **[`doc/proposals/`](doc/proposals/)** — numbered specifications. A change to
  the format or the tooling starts as one; reserve its number in
  [`doc/proposals/README.md`](doc/proposals/README.md).
- **Progress is tracked per proposal**, in `doc/proposals/HMD-NNNN/STATUS.md`,
  and updated in the same commit that changes the code.

```bash
git clone https://github.com/ewiger/hyper-markdown
cd hyper-markdown
uv sync --locked && uv run python -m pytest   # the Python tool
npm install && npm test                       # the TypeScript tools
```

Issues and pull requests are welcome at
[github.com/ewiger/hyper-markdown](https://github.com/ewiger/hyper-markdown).

## License

MIT — see [LICENSE](LICENSE).
