# Hyper-markdown { .hmd-hero }

!!! info "The simplicity of Markdown. The visual appeal of modern HTML."

    30 years ago, HTML was not more complex than plain text, yet made it possible to write websites and link them together. Markdown was a step back toward plain text, and it succeeded because it was simple enough to read in any editor. Hyper-markdown is a step towards reinventing HTML, and it succeeds because it is simple enough to read in any browser, terminal, editor, or AI chat.

Markdown already won. It is what a README is written in, what notes are kept in,
what issues and pull requests are argued in, and — since the machines started
writing back — what an AI chat answers in. It is the plain text everyone types
without being told to.

What it never got is the part HTML had on its first day: a link that means
something, a page that can be made out of other pages, a document that is part
of a web rather than a file in a folder. Hyper-markdown (`.hmd`) adds exactly
that, and stops. Every `.md` file is already valid `.hmd`. You adopt it one file
at a time, and nothing you have written is ever wrong.

## Still just markdown

A **card** is one `.hmd` file: one idea, ordinary Markdown, and links to its
neighbours. Open it anywhere — GitHub, an editor, `less`, a chat window — and it
reads fine; the wikilinks show as `[[bracketed text]]` and nothing is broken.
The dialect owns only a handful of constructs, and they are all variations on
one idea: *naming another card, or a part of one*.

```markdown
See [[tokens]] for the token format, or pull the definition in whole:

![[glossary/token#^definition]]
```

That is the entire surface. The whole language fits on one page and can be
learned in one sitting:
[the hyper-markdown language](wiki/hmd-lang-specification.hmd).

## Documents that assemble themselves

An embed is a link with a `!` in front: `![[glossary/token]]` splices the card
in where you wrote it, `![[glossary/token#Rotation]]` one section,
`![[glossary/token#^definition]]` one named block. Write a definition once and
embed it everywhere it is needed — cards stop being pages and start being parts.

The step after that is already reserved: **HQL**, a query language that lets a
card *compute* its content from the graph — every card tagged `area/backend`,
every page linking here — instead of listing it by hand. The design constraints
are fixed in [HMD-0003](proposals/HMD-0003/README.md); the syntax is
deliberately not.

## It looks like a real website

Plain text in, a real website out. Mathematics in TeX, callouts, diagrams,
tables, footnotes — a page can carry all of it, and the site you are reading is
the proof: a hand-ordered **book** with a generated **wiki** inside it, built
from this repository.

What that looks like in practice is [Features](public/features.md).

## The web, again — made of markdown

A folder is a **module**. It is the home base a set of cards belongs to, and the
boundary a bare name cannot cross sideways: write inside your own folder and
`[[tokens]]` reaches you or the folders above you, never a sibling's private
cards. Reach a sibling on purpose with `[[/shared/tokens]]` and you are naming
another module rather than hoping a search finds it. That is closer to how a
programming language treats a package than to how a wiki treats a directory,
and it is deliberate — a tree of cards should be read the way you read an
unfamiliar codebase, outward from where you are standing, on purpose.

Inside one module you can trust the answer, because a name that could mean two
pages is an **error** rather than a coin flip:

```text
specs/auth/login.hmd:14:5: error[HMD002] [[tokens]] matches 2 pages; qualify it
```

A **namespace** is the step outward, and it is where the *hyper* in the name
starts meaning something. A namespace ID names a place to look up front —
`namespace:path/to/card` — and what answers for that ID is a server that speaks
hyper-markdown. This site already runs one, unnamed: its own build, serving the
default namespace out of a local tree. Nothing says the binding has to stay
local, static, or singular. An ID could be remapped to an entirely different
server without a single link in your cards changing.

Follow that far enough and it is the worldwide web again — pages that live
somewhere, name each other across the gap, and compose — except that what you
type is markdown rather than HTML, and what you get back still opens in a text
editor. That is the bet, and it is genuinely unfinished: what a namespace is,
and how far an ID-to-server binding can go, is sketched rather than built in
[HMD-0004](proposals/HMD-0004/README.md). The rules as they stand today are
[Namespaces](public/namespaces.md).

## Where to go next

1. [Introduction](public/introduction.md) — the format at a glance.
2. [Features](public/features.md) — what a page can be, shown working.
3. [Namespaces](public/namespaces.md) — how a name becomes a page.
4. [Presentation](public/presentation.md) — one card, many formats and viewers.
5. [The hyper-markdown language](wiki/hmd-lang-specification.hmd) — learn to
   write it, start to finish.
6. [The wiki](wiki/README.md) — the living example, generated from `.hmd`.

## Status

Pre-release. The scanner, resolver, linter, embed expander, renderer, and
MkDocs plugin are implemented and tested. The specifications
([HMD-0001](proposals/HMD-0001/README.md),
[HMD-0002](proposals/HMD-0002/README.md),
[HMD-0003](proposals/HMD-0003/README.md),
[HMD-0004](proposals/HMD-0004/README.md)) are still `drafted`, and the format
will move before 1.0.
