"""Masking scanner: find the constructs the format owns (HMD-0001 §1, §2).

The scanner does not parse CommonMark. It masks the regions where markup must
not be interpreted, then extracts constructs from what is left. Masking replaces
characters with spaces and preserves newlines, so every byte offset, line, and
column in the masked text still refers to the original source.
"""

from __future__ import annotations

import re

# A fence opener/closer: three or more backticks or tildes, optionally indented.
_FENCE_RE = re.compile(r"^(?P<indent>[ \t]*)(?P<fence>`{3,}|~{3,})(?P<info>.*)$")
_HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
# A code span: a run of N backticks, then the shortest text, then N backticks.
_CODE_SPAN_RE = re.compile(r"(?P<ticks>`+)(?P<body>.+?)(?P=ticks)", re.DOTALL)

_ATX_HEADING_RE = re.compile(r"^[ \t]{0,3}(?P<hashes>#{1,6})[ \t]+(?P<text>.*?)[ \t]*$", re.MULTILINE)
_ANCHOR_RE = re.compile(r"[ \t]+\^(?P<id>[A-Za-z0-9][A-Za-z0-9_-]{0,63})[ \t]*$", re.MULTILINE)
# A wikilink target may not contain "[", "]" or a newline (HMD-0001 §2).
_LINK_RE = re.compile(r"(?P<bang>!?)\[\[(?P<inner>[^\[\]\n]*)\]\]")
_OPEN_RE = re.compile(r"!?\[\[")


def mask(text: str) -> str:
    """Return `text` with uninterpreted regions blanked out, offsets preserved.

    Masked: fenced code blocks, HTML comments, and inline code spans.

    Indented code blocks are deliberately NOT masked. This tree ships the
    `admonition` and `footnotes` extensions, under which a four-space indent
    marks callout bodies and footnote continuations rather than code; masking it
    would silently drop real links from ordinary prose.
    """
    chars = list(text)
    for start, end in _masked_regions(text):
        for i in range(start, end):
            if chars[i] != "\n":
                chars[i] = " "
    return "".join(chars)


def _masked_regions(text: str) -> list[tuple[int, int]]:
    regions = list(_fenced_regions(text))
    blanked = _blank(text, regions)

    # Comments and code spans are found in text that already has fences removed,
    # so a "<!--" inside a code block cannot open a comment.
    for m in _HTML_COMMENT_RE.finditer(blanked):
        regions.append((m.start(), m.end()))
    blanked = _blank(blanked, regions)

    for m in _CODE_SPAN_RE.finditer(blanked):
        if "\n\n" in m.group(0):  # a code span cannot span a blank line
            continue
        regions.append((m.start(), m.end()))
    return regions


def _blank(text: str, regions: list[tuple[int, int]]) -> str:
    chars = list(text)
    for start, end in regions:
        for i in range(start, end):
            if chars[i] != "\n":
                chars[i] = " "
    return "".join(chars)


def _fenced_regions(text: str):
    """Yield (start, end) for each fenced code block, closed or not."""
    open_fence: str | None = None
    open_start = 0
    offset = 0
    for line in text.splitlines(keepends=True):
        stripped = line.rstrip("\r\n")
        m = _FENCE_RE.match(stripped)
        if open_fence is None:
            if m and not m.group("info").strip().startswith(m.group("fence")[0]):
                open_fence = m.group("fence")
                open_start = offset
        else:
            # A closer is the same character, at least as long, with no info string.
            if (
                m
                and m.group("fence")[0] == open_fence[0]
                and len(m.group("fence")) >= len(open_fence)
                and not m.group("info").strip()
            ):
                yield (open_start, offset + len(line))
                open_fence = None
        offset += len(line)
    if open_fence is not None:  # unterminated fence runs to end of file
        yield (open_start, len(text))


def line_col(text: str, offset: int) -> tuple[int, int]:
    """1-indexed line and column for a byte offset."""
    line = text.count("\n", 0, offset) + 1
    last_nl = text.rfind("\n", 0, offset)
    return line, offset - last_nl


def find_headings(masked: str):
    """Yield (level, text, span_start, span_end) for each ATX heading."""
    for m in _ATX_HEADING_RE.finditer(masked):
        text = m.group("text")
        # Drop a closing hash run, then any trailing block anchor.
        text = re.sub(r"[ \t]+#+[ \t]*$", "", text)
        text = re.sub(r"[ \t]+\^[A-Za-z0-9][A-Za-z0-9_-]{0,63}[ \t]*$", "", text)
        yield len(m.group("hashes")), text.strip(), m.start(), m.end()


def find_anchors(masked: str):
    """Yield (block_id, span_start, span_end) for each trailing ``^id``."""
    for m in _ANCHOR_RE.finditer(masked):
        yield m.group("id"), m.start(), m.end()


def find_links(masked: str):
    """Yield (bang, inner, span_start, span_end) for each well-formed link."""
    for m in _LINK_RE.finditer(masked):
        yield m.group("bang") == "!", m.group("inner"), m.start(), m.end()


def find_unterminated(masked: str):
    """Yield the offset of every ``[[`` that does not open a complete link."""
    closed = {m.start() + (1 if m.group("bang") else 0) for m in _LINK_RE.finditer(masked)}
    for m in _OPEN_RE.finditer(masked):
        start = m.start() + (1 if m.group(0).startswith("!") else 0)
        if start not in closed:
            yield m.start()
