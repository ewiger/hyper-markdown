# Introduction

A `.hmd` file is a Markdown file that has learned to do more. Reading one
requires nothing — any editor, any renderer, GitHub's file view all show you a
sensible page. Writing one is a single page of new syntax on top of what you
already know. And underneath both sits a toolchain that treats your writing the
way a compiler treats a program: names resolve, references are checked, and
ambiguity is an error rather than a guess.

This chapter is the format at a glance. Every layer appears here briefly, with
a pointer to where it is treated properly; none is specified here.

## Three layers of syntax

**The Markdown you know.** Paragraphs, emphasis, headings, lists, blockquotes,
fenced code. All of it works, unchanged — hyper-markdown neither redefines nor
restricts it, and a fenced block stays literal all the way down, which is the
escape hatch for showing syntax instead of invoking it.

**The rich layer.** Tables, footnotes, task lists, callouts, TeX mathematics,
D2 diagrams. None of these are original Markdown, and none are
hyper-markdown's own — they are the conventional tier the wider Markdown world
settled on, and the format assumes them present and renders them as
first-class content:

!!! note "This callout is real"

    So is $e^{i\pi} + 1 = 0$ beside it. What a page can carry, shown working,
    is [Features](features.md).

**The hyper layer.** What hyper-markdown itself adds, and the part that is
genuinely new. It is all variations on one idea — *naming another card, or a
part of one*:

| Written | Means |
| --- | --- |
| `[[card]]` | a link to a card, resolved by name |
| <code>[[card&#124;words]]</code> | the same link, showing different words |
| `[[card#Heading]]` | a link to a section inside that card |
| `text ^name` | a block anchor, naming one block |
| `[[card#^name]]` | a link to that named block |
| `![[…]]` | an embed — any of the above, spliced in |

The surface hyper-markdown defines is kept deliberately small — small enough to
specify, and small enough that the resolver behind it stays checkable. The
richness comes from everywhere else on the page, bought from the Markdown
ecosystem rather than rebuilt, which is why the feature set keeps growing
while the table above does not have to.

## Names, and how they are found

`[[card]]` is a name, not a path. A folder is a *module*, the card beside you
wins over a card far away, and a name that could mean two pages is an error
you are asked to qualify. This is the part that makes hyper-markdown feel like
a language rather than a convention, and it has its own chapter:
[Namespaces](namespaces.md).

## Frontmatter

A card may open with a YAML block. Four keys mean something to the toolchain —
`tags` for what a card is about, `use` for per-subtree feature toggles,
`import` for explicit name bindings, `nav` for its place in a published site —
including `nav.visibility`, which decides whether it is published at all.
Every other key is yours, and nothing will inspect it.

## The check

`hmd lint` reads the tree and reports what it could not resolve — file, line,
rule ID. The distinction it draws is a compiler's: a link to a card that does
not exist yet is a **warning**, because writing forward is how a wiki grows; a
link that is ambiguous or malformed is an **error**, because that is the one
thing the language refuses to guess at. Everything else about your prose is
left alone.

## Adopting it

A `.hmd` file is still Markdown — that is the superset property, and it is why
adoption can be gradual: rename one `.md` to `.hmd`, add one link, run
`hmd lint`. Nothing you have written is ever wrong, and nothing forces the
rest of the tree to follow.

## Where the full picture lives

- [The HMD Language Specification](../wiki/hmd-lang-spec.hmd) is the normative
  text behind it: the grammar, the resolution algorithm, and the diagnostics,
  stated exactly.
- [The feature list](../wiki/hmd-feature-list.hmd) is the exhaustive
  inventory: every feature, what provides it, and where it stands — including
  what is deferred or deliberately absent, so nothing gets re-argued from
  scratch.
- [MD ↔ HMD interoperability](../wiki/md-hmd-interop.hmd) makes the argument
  that `.hmd` stands to `.md` as TypeScript stands to JavaScript.
- [HMD-0001](../proposals/HMD-0001/README.md) is the normative specification
  behind all of the above.

!!! tip "Read next"

    [The HMD Tutorial](../wiki/hmd-tutorial.hmd) — every construct sketched on
    this page, taught properly and in order. Read it once and you can write the
    format.
