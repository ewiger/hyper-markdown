# Rich content

Hyper-markdown owns six linking constructs and nothing else. Everything on this
page is *bought*, not built: callouts, math, and diagrams come from
Python-Markdown extensions and an external renderer, and the format's own
scanner treats them as opaque. This page exists so you can see them working, and
so a change that breaks them is visible rather than silent.

## Callouts

From the `admonition` and `pymdownx.details` extensions.

!!! note "Namespaces are structural"

    A folder is a namespace. A tag is not. `[[…]]` answers *where a page lives*;
    a tag answers *what it is about*. Collapsing the two axes breaks both.

!!! warning "Ambiguity is an error"

    If a bare name matches two pages, the build tells you instead of guessing.
    The fix is to qualify the link, not to memorise a tie-break.

??? tip "Collapsed by default"

    A `???` callout starts folded. Useful for the long-winded justification that
    a reader does not need on the first pass — like this one.

## Math

From `pymdownx.arithmatex`, typeset by MathJax in the browser.

Inline: a retry after attempt $n$ is delayed by $t_n$, bounded by $t_{max}$.

Display:

$$
t_n = U\bigl(0,\; \min(t_{max},\; b \cdot 2^n)\bigr)
$$

That is the backoff the example fixture's `retry-policy` card describes — jitter
across the whole interval rather than a fixed doubling, so that clients which
failed together do not retry together.

## Diagrams

A ```` ```d2 ```` fence is a **diagram**, not a code block. Its body is opaque to
the resolver: it produces no links and no graph edges, because the scanner masks
fenced regions before it looks for constructs.

```d2
direction: right

client -> edge: credentials
edge -> auth: verify
auth -> edge: token
edge -> client: token + rotation window
```

Rendering needs the [`d2`](https://d2lang.com) binary. When it is missing the
diagram degrades to its labelled source rather than to a blank or a build
failure — a diagram that is merely not drawn is not a defect in the card, and
must not look like one.

The rendered SVG reaches the page as a `data:` URI inside an `<img>`, never as
inline markup. Diagram source arrives from a cloned repository and SVG is a
scripting context, so an `<img>` — which cannot execute its payload — converts
the whole class of SVG-injection attacks into a rendering limitation. The cost
is that diagrams are static and their hyperlinks do not work, which is the right
trade for a documentation diagram. See
[HMD-0022](../proposals/HMD-0002/README.md) for the parallel decision on the
editor side.

## The rest

Task lists, footnotes[^1], tables, and ~~strikethrough~~ are all present for the
same reason: they cost nothing and the format does not have to own them.

- [x] Buy the free syntax
- [ ] Build any of it twice

| Construct | Renders as |
| --- | --- |
| `~~text~~` | ~~text~~ |
| `- [x] item` | a checked box |

The numbered list of every feature the format supports, with which extension
provides it and where it stands, is the
[language specification](../wiki/hmd-lang-specification.hmd).

[^1]: Footnotes come from the `footnotes` extension, and the four-space indent
    they use is exactly why the scanner does *not* mask indented blocks — doing
    so would silently drop real links out of footnote bodies and callouts.
