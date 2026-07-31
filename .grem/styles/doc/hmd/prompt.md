# Write a hyper-markdown (`.hmd`) wiki card

Apply this documentation style to the source document named in the prompt
header. Read that document in full first.

**Goal:** Turn that source — a note, a section of a larger doc, a concept that
keeps coming up — into one or more **hyper-markdown cards** under `doc/wiki/`.
Hyper-markdown is this project's most generic and most-used knowledge format:
plain Markdown extended with **wiki features**, above all `[[wikilinks]]` between
cards. It is the default home for cross-linked, reusable explanations of a single
idea.

Hyper-markdown is a young format — think of it as extended Markdown plus a wiki
graph, nothing more exotic. There is no external toolchain to satisfy; a card is
a `.hmd` file that also reads fine as Markdown. Follow the conventions below,
which capture how the existing `doc/wiki/` cards are already written.

## Philosophy

- **One concept per card.** A card explains a single thing — a component, a term,
  a format, a rule — and nothing else. If the source covers several, split it into
  one card per concept and link them.
- **A card is a node in a graph.** Its value is the links. Cross-reference other
  cards liberally with `[[slug]]`; a whole model emerges from small, connected
  cards rather than one long document.
- **DRY and bidirectional.** Never restate what another card owns — link to it.
  Make each idea discoverable from both directions: the card links out to related
  cards, and they link back.
- **Prose over ceremony.** No front matter, no fixed section template. Explain the
  idea in clear prose; add structure only where it helps.

## File and naming conventions

- One card per file: `doc/wiki/<slug>.hmd`, where `<slug>` is the concept in
  kebab-case (`grem-config.hmd`, `model-lenses.hmd`).
- Group a related set in a subfolder named for the topic
  (`doc/wiki/models/model-lenses.hmd`). The slug still names the concept.
- The filename slug is the link target: a `[[grem-config]]` link resolves to
  `grem-config.hmd` regardless of subfolder.

## Card structure

- **H1 title = the concept**, in the reader's words (`# grem CLI`, `# Model
  Lenses`, `` # `.grem/config.yaml` ``). One H1 per card.
- **Open with a definition.** The first paragraph says what the thing *is*, tight
  and preamble-free — a reader who reads only that sentence should come away with
  the gist.
- **`##` sections**, each a short noun phrase, used only when the card has
  genuinely distinct parts. Keep paragraphs short.
- **Close with pointers.** End on the neighbouring cards a reader should follow
  next (`See [[grem-config]].`).

## Wiki and Markdown features

The wiki graph is **closed to `doc/wiki/`**: a `[[ ]]` link resolves only to a
card in the wiki space (any subfolder), never to a file elsewhere in the repo.

- **`[[slug]]`** links a concept to its card. Link the first, most meaningful
  mention of any concept another card owns.
- **`[[slug|display text]]`** links while showing different surface text
  (`[[model-lenses|lens]]`), so the sentence reads naturally.
- **Forward links are fine.** Link a concept that has no card yet — the `[[link]]`
  marks it as worth writing later; it is not an error.
- **Repo files and paths** use ordinary relative Markdown links
  (`[doc/lenses](../../.grem/styles/doc/lenses/prompt.md)`), reserving `[[ ]]` for
  card-to-card links.
- Standard Markdown otherwise: `inline code` for identifiers and paths, bulleted
  lists, and fenced code blocks with a language (```text, ```yaml, ```python,
  ```console) for formats, examples, and diagrams.

## Writing rules

- **Bold** each term at its first definition; keep terminology consistent with
  the cards you link to.
- Neutral, precise, engineering register — no marketing, no hedging, no filler.
- Short paragraphs; prefer a bulleted list over a wall of prose.
- Wrap prose at roughly 80 columns, matching the surrounding cards.

## Extract from the source

Read the source and pull each of these; where it is silent, search the codebase
rather than inventing.

- The concept(s) the card is about, and the right slug for each.
- The one-sentence definition that opens the card.
- The related concepts to link with `[[ ]]`, and the repo files/paths to link
  with relative Markdown links.
- Whether the source is really several concepts that should become several cards.

Match the surrounding `doc/wiki/` cards' tone and heading conventions.
