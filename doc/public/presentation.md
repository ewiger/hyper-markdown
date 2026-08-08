# Presentation

A card is one file, and one file goes many places. Point the converter at a card
and it comes back as another single file — one in, one out, nothing bundled:

- **Plain markdown** — strip it down. Every embed is inlined where it was
  written, every resolved name becomes an ordinary relative link, and what is
  left is a `.md` file that GitHub, Obsidian, or a plain renderer reads without
  knowing the format exists.
- **GFM** — what GitHub renders when it shows a file in a repository, which is
  where a converted card is most likely to be read.
- **HTML** — the whole page, nothing lost. Callouts, mathematics, diagrams,
  footnotes, tables: everything the format can express is expressible here, in
  one self-contained file that needs no site around it.

```bash
hmd render doc/wiki/tokens.hmd --to markdown
hmd render doc/wiki/tokens.hmd --to html
```

Conversion runs one way on purpose. Flattening a card is **erasure**: the
boundary between a card and the content it embedded is gone from the output, and
so is the provenance of every link — whether it was found beside the card, named
in an import, or swept up from the tree. That is exactly right for something you
are shipping and exactly wrong for something you are still editing. Erasure is a
shipping format, not an interchange format.

## A viewer is not a target

Converting gives you a file. *Presenting* is what a viewer does with a card, and
a viewer is free to show more than any file can carry. Three of them matter, and
they differ in what they are willing to keep.

### Anywhere, with nothing installed

The first viewer is the one you already have. An editor, GitHub's file view,
`less`, a terminal, an AI chat: a card is text, so all of them show it. The
wikilinks appear as `[[bracketed text]]` and nothing else is out of place.

This is not a fallback. It is the property the whole format is built to protect
— the reason a card can be adopted one file at a time is that nobody has to
install anything to read it.

### MkDocs — the published book

The site you are reading. A tree of cards builds as a MkDocs site through a
plugin, and the interesting case is not a wiki on its own — it is a **book with
a wiki inside it**: hand-written chapters that explain a subject in order, plus
a generated section of cross-linked cards the book hands you off to.

```text
doc/
  public/      the book — ordinary markdown, hand-ordered
  wiki/        the namespace — .hmd cards, generated nav
  proposals/   reference material, ordinary markdown
```

`docs_dir` covers all of `doc/`, while the `[[…]]` namespace is **restricted**
to `doc/wiki`. Cards resolve names against the wiki and nothing else; the rest
of the tree is reachable by ordinary relative links. That split is what lets one
build hold both kinds of writing without the resolver having an opinion about
the book.

```yaml
docs_dir: doc
use_directory_urls: true          # required

plugins:
  - hyper-markdown:
      root: doc/wiki              # the namespace, restricted

nav:
  - Home: index.md
  - Introduction: public/introduction.md
  - Wiki:
      - Overview: wiki/README.md
      - hmd://wiki                # ← the generated section lands here
```

`hmd://wiki` is the whole integration. An authored nav wins everywhere except
where it asks for the wiki by name, so a book keeps its own order and still says
exactly where the generated cards belong. Omit the placeholder and the authored
nav is used verbatim; omit `nav` entirely and the whole nav is derived.

**URLs.** A card at `wiki/a/b.hmd` serves at `/wiki/a/b/`. A folder note at
`wiki/a/b/index.hmd` serves at that same URL — two names for one page, one URL,
which is why directory URLs are required rather than merely preferred. Cards
sort by path, or by a `nav:` integer in their frontmatter: keyed cards first,
ascending, the rest in path order, so adding `nav:` to one card does not
reshuffle its siblings.

**What the build does.** It registers every `.hmd` file, which MkDocs would
otherwise not see; expands embeds *before* Markdown runs, so the table of
contents and the footnotes see one finished document; rewrites each resolved
wikilink to a real relative link; and renders unresolved links as red links
rather than failing. Nothing is resolved twice — the build reuses the same
resolver `hmd lint` uses, so a link that lints clean and a link that renders
correctly are the same fact.

**Two settings that are easy to miss.** Without the first, MkDocs copies the raw
`.hmd` sources into the site beside the pages generated from them; without the
second, every ordinary link a card makes out to the repository is a fatal error
rather than a note.

```yaml
exclude_docs: |
  *.hmd

validation:
  links:
    not_found: info
```

**Live editing.** `mkdocs serve` works, and the plugin watches the namespace
root — which MkDocs would otherwise ignore, leaving a `.hmd` edit to trigger no
rebuild and the preview quietly stale.

This viewer erases the embed boundary, the same way conversion does. On a
published page, content that came from another card is simply part of the page.
For a site that is the correct answer.

### The editor — live preview

The other viewer under construction is a VS Code extension, developed on the
`feat/vsc-ext` branch: a TypeScript document model (HMD-0020), the extension and
its preview surface (HMD-0021), and D2 rendering inside the webview's content
security policy (HMD-0022).

The load-bearing difference is the one MkDocs gives up. A preview **keeps** the
embed boundary — it shows content that arrived from another card as visibly
embedded, with its source attached, so you can see what you are editing and what
you are merely including. That is the one thing a plain markdown previewer
cannot do, and it is why the editor line rejected flat markdown as its transport
even while erasure stays the right build output.

Python stays canonical for the semantics. A second parser that resolved a name
differently from the command line would be worse than no second parser, so the
specification and its conformance corpus are the contract between the two
surfaces rather than a shared runtime.
