# Wiki

`doc/wiki/` is the project's knowledge base: a graph of cross-linked
**hyper-markdown** (`.hmd`) cards, one concept per file. Each card defines a
single thing and links to its neighbours with `[[wikilinks]]`, so understanding
emerges from small, connected cards rather than one long document.

Start from any card and follow the links; see
[hyper-markdown.hmd](hyper-markdown.hmd) for the format itself. Related cards can
be grouped in topic subfolders.

## Writing a card

The authoring convention — naming, structure, and register — is the `doc/hmd`
documentation style, not repeated here:
[.grem/styles/doc/hmd/prompt.md](../../.grem/styles/doc/hmd/prompt.md). Render it
against a source document with `grem new --type doc --style hmd <source>` and an
agent applies it.
