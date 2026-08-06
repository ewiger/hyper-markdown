# The format

Hyper-markdown owns exactly six constructs. Everything else on the page —
tables, footnotes, callouts, math, task lists — is ordinary Markdown, provided
by Python-Markdown and its extensions. The dialect buys those rather than
building them, which is what keeps its own surface small enough to specify.

## The six constructs

| Written | Means |
| --- | --- |
| `[[page]]` | a link to a page, resolved by name |
| `[[page\|display text]]` | the same link, showing different words |
| `[[page#Section]]` | a link to a heading inside that page |
| `text ^block-id` | a **block anchor**, naming one block |
| `[[page#^block-id]]` | a link to that named block |
| `![[…]]` | an **embed** — any of the above, inlined |

An embed is the same target with a `!` in front. `![[glossary/token]]` pulls in
the whole card, `![[glossary/token#Rotation]]` pulls in one section, and
`![[glossary/token#^definition]]` pulls in one anchored block.

Embeds compose: a card can embed a card that embeds another. Expansion is
textual and does not shift heading levels, so what you get is what the source
said. Cycles are caught, and depth is capped at 16.

## Frontmatter

A card may open with a YAML block. Four keys are reserved; everything else is
yours and the toolchain will not look at it.

```yaml
---
tags: [area/auth, status/accepted]     # what the card is about
use: [no_autodiscovery]                # per-card feature toggles
import:                                # explicit name bindings
  - from /shared import tokens as shared-tokens
  - from /glossary import *
nav: 10                                # position in the generated site nav
---
```

- **`tags`** answer *what a card is about*; namespaces answer *where it lives*.
  The two axes stay separate on purpose. A tag is never a link target.
- **`use`** turns features on and off for one card, `vim`-style: `autodiscovery`
  and `no_autodiscovery`. It **inherits** — a `use` in a folder's `index.hmd`
  governs that whole subtree, which is what makes a namespace a module rather
  than a naming convention.
- **`import`** binds names explicitly. See [Namespaces](namespaces.md).
- **`nav`** orders the card in a generated nav. See [Publishing](publishing.md).

## What is deliberately absent

No inline properties (`key:: value`), no highlights (`==text==`), no Mermaid, no
templates, and no query language — yet. Each is either deferred to a later
specification or rejected outright. A small construct set is what makes the
resolver checkable, and a checkable resolver is the point.

## Reading a card without the tooling

A `.hmd` file is still Markdown. Open one in any editor and it reads fine; the
wikilinks show as `[[bracketed text]]` and nothing is broken. That is the
superset property, and it is why adoption can be gradual: rename one `.md` to
`.hmd`, add one link, run `hmd lint`.
