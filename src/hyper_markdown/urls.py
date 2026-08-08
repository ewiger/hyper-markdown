"""The URL policy (HMD-0002 §1).

One card, one URL, computed in exactly one place. A card at `a/b.hmd` and a
folder note at `a/b/index.hmd` both serve at `a/b/`, because §5.1 of HMD-0001
already makes the two names address the same page — two names for one page must
not become two URLs for one page.

Everything here is pure path arithmetic on root-relative parts. Nothing touches
the filesystem, so a URL is the same on every platform and in every run (P1).
"""

from __future__ import annotations

import posixpath
from pathlib import Path

INDEX_STEM = "index"


def parts_for(root: Path, path: Path) -> tuple[str, ...]:
    """The addressable parts of a page: root-relative, suffix and `index` gone."""
    parts = path.relative_to(root).with_suffix("").parts
    if len(parts) > 1 and parts[-1] == INDEX_STEM:
        parts = parts[:-1]
    return parts


def url_for(root: Path, path: Path) -> str:
    """The site path of a page, as an absolute URL path: `a/b/` or `` for home."""
    parts = parts_for(root, path)
    if not parts or parts == (INDEX_STEM,):
        return ""
    return "/".join(parts) + "/"


def dest_for(root: Path, path: Path) -> str:
    """The MkDocs source path a page is registered under: always a `.md` file.

    MkDocs matches a fixed extension set that does not include `.hmd`, so a page
    enters the build under a name MkDocs already understands. Directory URLs then
    turn `a/b.md` into `a/b/index.html` on their own.
    """
    parts = parts_for(root, path)
    if not parts:
        return f"{INDEX_STEM}.md"
    return "/".join(parts) + ".md"


def href_for(root: Path, source: Path, target: Path) -> str:
    """A link from one page to another, relative to the *source path*.

    Deliberately not relative to `url_for`. MkDocs resolves and validates every
    link against the source tree and computes the final URL itself, so handing
    it a source-relative `.md` path gets `../kanban/` for free — and gets the
    link checked. Emitting the finished URL instead would bypass validation and
    duplicate arithmetic MkDocs is already doing.
    """
    destination = dest_for(root, target)
    directory = posixpath.dirname(dest_for(root, source))
    return posixpath.relpath(destination, directory or ".")
