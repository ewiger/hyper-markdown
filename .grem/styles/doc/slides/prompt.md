# Turn a prose design document into a numbered D2 visual story

Apply this style to the source document identified in the task. Read the source
document in full before planning or editing anything. Follow its terminology and
level of abstraction; do not impose a database, deployment, or organizational
model that the source does not contain.

## Goal

Create a companion folder of small, numbered D2 diagrams that retell a long-form
Markdown document as a coherent visual sequence. The result should read from top
to bottom like a deck:

- one claim, relationship, or transition per diagram;
- a short narrative passage before each rendered image;
- enough context for each diagram to make sense on its own;
- a clear path back to the detailed source document.

The visual story is a concise companion, not a substitute for the source.

## Core principles

- **One idea per diagram.** Do not compress an entire architecture or lifecycle
  into one canvas. Split it into the smallest useful visual units: one state
  transition, one interaction, one comparison, one invariant, or one worked
  example.
- **Let the content choose the visual form.** Use a flow for a process, a
  before/after layout for a state change, parallel lanes for concurrent actors, a
  hierarchy for containment, and a small table-like arrangement for exact
  comparisons. Do not make every topic look like a data model.
- **Use the source document's language.** Preserve the names of actors,
  components, states, operations, and boundaries. Introduce a new visual metaphor
  only when it clarifies the source, and explain it in the diagram note.
- **Show meaning, not decoration.** Every node and edge must support the slide's
  single idea. Omit implementation detail that does not affect that idea.
- **Make important distinctions visible.** Encode differences such as durable
  versus temporary, local versus shared, success versus failure, or current
  versus proposed behavior consistently across the set.
- **Keep claims faithful.** Do not turn an analogy into an implementation claim,
  infer behavior that the source leaves open, or present a planned feature as
  implemented. Mark uncertainty, limitations, and current/future boundaries
  explicitly.
- **Keep source and generated output separate.** The `.d2` files and README
  narrative are hand-edited sources. The rendered `.svg` and `.png` files are
  generated artifacts, but remain committed so the diagrams work in plain
  Markdown viewers. A `.d2` change without updated rendered counterparts is
  incomplete.

## Deliverables and layout

Create one subfolder for each source document, named after the source document.
It contains:

- `NN-short-slug.d2` files, with two-digit numeric prefixes fixing the reading
  order in directory listings (`01-overview.d2`, `02-state-change.d2`, and so
  on);
- matching `NN-short-slug.svg` and `NN-short-slug.png` files;
- a `README.md` that presents the story in the same numbered order;
- a thin `build.sh` that delegates to the repository's shared rendering script.

If a single idea naturally has two beats, such as problem then resolution, it
may use `NN-slug_1.d2` and `NN-slug_2.d2`. Prefer that over crowding both beats
onto one canvas. When inserting an idea, renumber the following files rather
than introducing decimal or letter suffixes.

The README should:

1. open with the purpose of the visual story and link to the full source;
2. alternate a short explanatory paragraph and its diagram image;
3. preserve the source's narrative order unless a different order materially
   improves understanding;
4. end with a **Related documentation** section linking to the source and to any
   documents referenced by name in the story.

Use relative links that work from the companion folder.
Add a reciprocal link from the source document to the visual story so readers
can discover either version first.

## Planning the visual story

Before authoring D2:

1. Outline the source document by section.
2. For each section, identify the one relationship, transition, comparison, or
   invariant it is trying to establish.
3. Decide whether that idea is best explained visually. Combine or omit sections
   that would produce only decorative diagrams; split sections that contain
   multiple independent ideas.
4. Choose a visual form appropriate to the idea.
5. Arrange the slides into a narrative arc, typically:
   motivation or boundary → mental model → mechanism → lifecycle or interactions
   → failure and recovery paths → worked example → compact recap.
6. Check the outline against the source for missing qualifications, open
   questions, and implemented-versus-proposed distinctions.

When two systems or actors evolve independently, use parallel lanes. When their
comparison is the actual point, place them together on one slide with aligned
states or steps. Use a worked example only when concrete names or values make the
mechanism easier to follow.

## D2 authoring conventions

- Make every `.d2` file standalone. Define its classes locally rather than
  relying on an implicit shared palette.
- Use shapes according to their meaning in the current domain. For example:
  rectangles for components or states, containers for boundaries or ownership,
  documents for messages or artifacts, and cylinders only when persistent
  storage is genuinely relevant. These are defaults, not a mandatory schema.
- Use a small, consistent visual vocabulary across the story. Prefer semantic
  roles such as:
  - neutral for context and unchanged elements;
  - one accent for the active path or current focus;
  - green for successful or accepted outcomes;
  - red for failure, rejection, or destructive effects;
  - dashed outlines or edges for temporary, optional, inferred, or planned
    elements.
- Do not rely on color alone. Pair color with labels, line styles, icons, or
  spatial grouping so the meaning survives grayscale rendering and supports
  color-blind readers.
- Label edges with actions or relationships when direction alone is ambiguous.
  Prefer domain verbs from the source over generic labels such as "uses" or
  "handles."
- Group nodes only when the boundary itself matters. Name containers after the
  source's concepts rather than generic categories.
- Give most diagrams a `title` near the top center and a concise explanatory
  `note` near the bottom center. The title states the slide's claim; the note
  supplies the key qualification or takeaway.
- Keep labels short and move explanation into the README. If a node needs a
  paragraph, the slide is probably too broad.
- Keep layouts readable at normal Markdown width. Split a diagram when labels,
  crossings, or nested containers make the main path hard to scan.

## Rendering and regeneration

- Compile `.d2` to `.svg` with `d2`.
- Rasterize `.svg` to `.png` with `rsvg-convert` from librsvg. Prefer this to
  D2's direct PNG export, which requires a headless browser; SVG rasterization is
  smaller and reliably handles D2's embedded fonts.
- Use the repository's shared build script for the actual rendering logic. Each
  companion folder's `build.sh` should only resolve its location and delegate to
  that script.
- Provide and document a Docker fallback using `terrastruct/d2:latest` for
  environments without a local D2 installation.
- Regenerate both formats whenever a `.d2` source changes.

## Final review

Before finishing, verify that:

- the sequence tells a comprehensible story without requiring the reader to open
  every source section;
- each diagram communicates one clear idea and has no unexplained visual
  conventions;
- terminology, direction of effects, and current/future status match the source;
- the set uses domain-appropriate visuals rather than assuming relational
  tables, roles, grants, or schemas;
- README links and image paths resolve from the companion folder;
- every `.d2` file has current `.svg` and `.png` outputs;
- the shared build path and documented fallback are accurate for this
  repository.
