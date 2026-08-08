"""Checks on the project's own documentation — its prose sources, and the site
its own `mkdocs.yml` builds.

Most of these gate authored content rather than rendered output. Issue 0003 and
issue 0005 both needed the opposite — assert the HTML, because the defect was
produced by the toolchain. Issue 0006 is authored: the renderer is correct and
will not change, so the source is the right place to catch it.

The branding test at the bottom is of the first kind and belongs here rather
than in `test_mkdocs.py`, which builds synthetic fixtures: the logo, the palette,
and the hero are settings in *this repository's* `mkdocs.yml`, so only a build
of the real site can tell whether they reached a page.
"""

import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent

# A code span, and the escape the table forces. These are two patterns rather
# than one because a single `[^`]*\|[^`]*` is free to start matching at a
# *closing* backtick, which makes the gap between two spans look like the inside
# of one: `` `a` \| `b` `` renders as a bare pipe and is not the defect. Pairing
# the spans left to right the way markdown pairs them, then testing each body,
# is what tells the two apart.
CODE_SPAN = re.compile(r"`[^`\n]+`")
ESCAPED_PIPE = re.compile(r"\\\|")
FENCE = re.compile(r"^\s*(```|~~~)")


def _prose_sources() -> list[Path]:
    """Tracked *and* new-but-not-ignored files.

    `git ls-files` alone lists only what is already committed, which makes a
    guard blind to the file being written — the case it most needs to catch.
    `--exclude-standard` keeps `.gitignore` honoured, so `site/` stays out.
    """
    out = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "*.md", "*.hmd"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    # .grem/ is dormant control data the project does not maintain.
    return sorted({ROOT / p for p in out if not p.startswith(".grem/")})


def _offending_lines(text: str):
    """Table rows carrying the defect, with fenced blocks masked.

    Two narrowings, both load-bearing. Only a **table row** is a defect: a pipe
    has to be escaped in a table cell and nowhere else, so `` `\\|` `` in
    running prose is an author quoting the sequence deliberately — issue 0006's
    own title does exactly that. And a fenced block is a quotation too, which is
    how an issue shows the broken syntax without tripping the check that exists
    because of it.
    """
    in_fence = False
    for lineno, line in enumerate(text.splitlines(), start=1):
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence or not line.lstrip().startswith("|"):
            continue
        if any(ESCAPED_PIPE.search(span.group()) for span in CODE_SPAN.finditer(line)):
            yield lineno, line.strip()


def test_no_escaped_pipe_inside_a_table_code_span():
    offenders = [
        f"{path.relative_to(ROOT)}:{lineno}: {line}"
        for path in _prose_sources()
        for lineno, line in _offending_lines(path.read_text(encoding="utf-8"))
    ]

    assert not offenders, (
        "a table cell cannot escape a pipe inside a code span — the table needs"
        " the backslash and the code span shows it (issue 0006). Write the cell"
        " as raw <code>…&#124;…</code> instead:\n  " + "\n  ".join(offenders)
    )


def test_the_guard_catches_the_original_defect_and_nothing_else():
    """Pin the three judgement calls, so a rewrite of the pattern stays honest."""
    defect = r"| `[[page\|display text]]` | the same link |"
    assert list(_offending_lines(defect))

    # The accepted fix.
    assert not list(
        _offending_lines("| <code>[[page&#124;display text]]</code> | the same link |")
    )
    # Prose quoting the sequence — issue 0006's own title.
    assert not list(_offending_lines(r"# `\|` inside a table code span"))
    # A fenced block showing the defect on purpose.
    assert not list(_offending_lines("```markdown\n" + defect + "\n```"))


@pytest.fixture(scope="module")
def built_home(tmp_path_factory) -> str:
    """The real site's home page, built from the repository's own `mkdocs.yml`.

    Built into a temporary directory rather than `site/`, so running the suite
    never clobbers whatever a `mkdocs serve` is holding.
    """
    if shutil.which("mkdocs") is None:
        pytest.skip("mkdocs is not installed; the site extra is optional")

    out = tmp_path_factory.mktemp("site")
    subprocess.run(
        ["mkdocs", "build", "--strict", "--site-dir", str(out)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return (out / "index.html").read_text(encoding="utf-8")


def test_the_bolt_reaches_the_page_as_a_logo_and_a_favicon(built_home):
    """The mark is the README's `⚡`, shipped as an asset rather than a glyph.

    Asserting the HTML and not `mkdocs.yml` is the standing lesson of issues
    0003 and 0005: a green build is not evidence of correct output. A logo path
    that is merely *set* proves nothing — `--strict` would catch a missing file,
    but not a theme that stopped emitting the tag.
    """
    assert 'src="wiki/assets/logo.svg"' in built_home, "no logo in the header"
    assert 'href="wiki/assets/favicon.svg"' in built_home, "no favicon"

    # Both SVGs carry an explicit fill, and neither may use `currentColor`.
    # Material references the logo as `<img src=…>`, not as inline markup, and
    # an externally-referenced SVG is an isolated document: there is no parent
    # to inherit from, so `currentColor` resolves to the initial black and the
    # bolt disappears against the near-black header. Material's own
    # `.md-logo img { fill: currentcolor }` cannot help — `fill` does nothing
    # to an `<img>` element. A favicon has no inherited color either.
    for name in ("logo.svg", "favicon.svg"):
        svg = (ROOT / "doc" / "wiki" / "assets" / name).read_text(encoding="utf-8")
        assert "currentColor" not in svg, (
            f"{name} is referenced as <img>, which inherits no color —"
            " currentColor renders it black on a black header"
        )
        assert 'fill="#' in svg, f"{name} needs an explicit fill"


def test_the_cover_renders_its_hero(built_home):
    """`attr_list` is what puts the class on the heading; without the extension
    the marker degrades to literal `{ .hmd-hero }` text on the page."""
    assert 'class="hmd-hero"' in built_home
    assert "{ .hmd-hero }" not in built_home, "attr_list is not enabled"


def test_the_site_names_its_repository(built_home):
    assert "ewiger/hyper-markdown" in built_home
    # `extra.generator: false` leaves the project's own copyright alone in the
    # footer.
    assert "Made with" not in built_home
