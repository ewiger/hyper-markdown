# Hyper-markdown { .hmd-hero }

Hyper-markdown (`.hmd`) is Markdown with a hypertext layer: links that resolve by
name rather than by path, documents composed out of parts of other documents, and
a toolchain that checks both instead of trusting them. Every `.md` file is
already valid `.hmd`.

## TL;DR

* **A superset of CommonMark.** Rename a `.md` file to `.hmd` and it is already
  valid — nothing breaks, and the format is adopted one file at a time.

* **Names, not paths.** `[[tokens]]` is looked up beside the card and then upward
  through its parent folders. A name that could mean two documents is an error
  rather than a guess.

* **Documents made of documents.** `![[glossary/token#^definition]]` splices one
  named block into another page. Write a definition once and embed it everywhere
  it is needed.

* **The specification is the artifact.** The Python CLI, the MkDocs plugin, and
  the VS Code extension are implementations around it; they conform to it rather
  than define it.

* **Version 0.x is a stage, not the scope.** The resolver, linter, embed
  expander, renderer, and MkDocs plugin work today. Queries over the document
  graph and namespaces beyond one tree are specified in outline and unbuilt.

## Language

Three layers stack in one file. At the base, **CommonMark**, inherited whole —
nothing redefined and nothing taken away, which is why a `.md` file is already
a valid card. Above it a **rich layer** — tables, footnotes, task lists,
callouts, TeX mathematics, D2 diagrams — taken from the wider Markdown
ecosystem rather than invented here, and assumed present rather than optional.
And the **hyper layer** — arguably the most innovative part, and the reason the
format exists at all: a small set of constructs that are all variations on one
idea, *naming another document or a part of one*. Those upper two layers are
what hyper-markdown adds, and a specification is what fixes them, not
convention.

```markdown
See [[tokens]] for the format, or pull one block in whole:

![[glossary/token#^definition]]
```

A card may open with YAML frontmatter, where four keys mean something to the
toolchain — `tags`, `use`, `import`, `nav` — and every other key belongs to the
author. The whole language fits on one page and can be learned in one sitting:
[the hyper-markdown language](wiki/hmd-lang-specification.hmd).

## Features

Wiki links to documents, headings, and named blocks; transclusion of any of
them; filesystem-shaped modules with explicit imports; TeX mathematics, D2
diagrams, callouts, collapsible sections, footnotes, tables, and the GitHub-
flavoured Markdown baseline. HQL, a query language over the document graph, is
reserved and not yet designed.

What a page can carry, shown working rather than described, is
[Features](public/features.md). How a bare name becomes a page — the spine walk,
imports, ambiguity as an error, and the module/namespace distinction — is
[Namespaces](public/namespaces.md).

## Tools

`hmd` lints a tree, renders a card to markdown or HTML, and dumps the resolved
graph. A missing target is a warning, because writing forward is how a wiki
grows; an ambiguous or malformed one is an error, because that is the one thing
the format refuses to guess at.

Presentation is not part of the language. A card is plain text, so an editor,
GitHub, or a chat window already shows it. The MkDocs plugin builds a tree of
cards into a published site — this one, a hand-ordered book with a generated
wiki inside it — and a VS Code extension is in development. The trade-offs
between them are [Presentation](public/presentation.md).

## Specification

The normative text lives in numbered proposals, in the style of lightweight ADRs
or RFCs. Two are implemented: [HMD-0001](proposals/HMD-0001/README.md) fixes the
grammar, the deterministic resolver, and `hmd lint`;
[HMD-0002](proposals/HMD-0002/README.md) maps a tree of cards onto a MkDocs site.
Two are experimental and specify no mechanism:
[HMD-0003](proposals/HMD-0003/README.md) reserves HQL and its constraints without
choosing a syntax, and [HMD-0004](proposals/HMD-0004/README.md) reserves
`namespace:path/to/card` for documents served by another namespace without
defining how a namespace ID is bound.

All four are `drafted`, and the format will move before 1.0. The index is
[Specifications](proposals/README.md).

## Vision

Markdown became the default plain text, and never got the part HTML had on its
first day — a link that means something, a page that is part of a web rather than
a file in a folder. Almost none of the ideas here are new; what is being
attempted is a coherent specification of them.

The longer argument is that this should not stop at one repository: independently
authored and independently served hyper-markdown, named across the gap, read from
the same source by humans, tools, and AI. That argument, and how much of it is
still unbuilt, is [Vision](public/vision.md).

## Status

Pre-release. The scanner, resolver, linter, embed expander, renderer, and MkDocs
plugin are implemented and tested. The specifications are still `drafted`. The
living example is [the wiki](wiki/README.md), generated from `.hmd` cards in this
repository; the exhaustive inventory of every feature, where the idea came from,
and what is deferred or turned down is
[the feature list](wiki/hmd-feature-list.hmd).
