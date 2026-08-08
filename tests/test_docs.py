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

    The index also names files that are no longer on disk: a file moved with
    `mv` rather than `git mv` stays cached at its old path until the deletion
    is staged. Those are dropped, because a path with no bytes behind it has no
    prose to check — reading it would turn every in-progress move into a
    `FileNotFoundError` from a guard that is about content.
    """
    out = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "*.md", "*.hmd"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    # .grem/ is dormant control data the project does not maintain.
    paths = {ROOT / p for p in out if not p.startswith(".grem/")}
    return sorted(p for p in paths if p.is_file())


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


#: The sentence the language specification opens with, which is the only place the
#: language's version is declared. A second literal in a config file or a `VERSION`
#: would be a number free to disagree with the document that defines the format.
SPEC_VERSION = re.compile(r"specifies hyper-markdown (\d+(?:\.\d+)*)")


def test_the_language_version_has_a_changelog_section():
    """The root changelog is the *language's*, and its top section is the version
    the spec card claims.

    This is the counterpart of `tools/hmd/tests/test_cli.py`, which makes the same
    check for the Python tool against `tools/hmd/CHANGELOG.md`. Four things version
    independently here — the language and three tools — and the failure this
    prevents is the quiet one: a construct changes, the card is bumped, and the
    history of what changed is nowhere.
    """
    card = (ROOT / "doc" / "wiki" / "hmd-lang-spec.hmd").read_text(encoding="utf-8")
    match = SPEC_VERSION.search(card)
    assert match is not None, (
        "hmd-lang-spec.hmd no longer says which version of the language it"
        " specifies; that sentence is the version's only declaration"
    )
    version = match.group(1)

    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    assert re.search(rf"^## \[{re.escape(version)}\]", changelog, re.M), (
        f"the spec card specifies hyper-markdown {version}, and CHANGELOG.md has"
        f" no `## [{version}]` section. A language version is the specification"
        " plus the record of what it changed."
    )

    # The README's `spec` badge is the one other place the number is written out,
    # and a shields.io URL is exactly the kind of literal nobody thinks to bump.
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert f"/badge/spec-{version}-" in readme, (
        f"the spec card specifies hyper-markdown {version}, and README.md's `spec`"
        " badge says something else. Either bump the badge or drop it — the card's"
        " opening sentence is the declaration, the badge only repeats it."
    )


@pytest.fixture(scope="module")
def built_site(tmp_path_factory) -> Path:
    """The real site, built from the repository's own `mkdocs.yml`.

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
    return out


@pytest.fixture(scope="module")
def built_home(built_site: Path) -> str:
    """The real site's home page. Most checks here only need this one page."""
    return (built_site / "index.html").read_text(encoding="utf-8")


def _tabs(home: str) -> str:
    """The top-bar nav, which is where a visitor meets the site's structure."""
    match = re.search(r'<nav class="md-tabs".*?</nav>', home, re.S)
    assert match is not None, "the theme emitted no tab bar"
    return match.group(0)


def test_the_top_bar_offers_the_language_specification(built_home):
    """The site's headline deliverable is the specification of the *language*,
    so it gets a tab of its own rather than only a row in the wiki section.

    The title is asserted, not just the href, because it is easy to get wrong:
    MkDocs reuses the `Page` built from a file's **first** appearance in the nav
    and silently discards the title given at any later one. The card is listed
    twice on purpose — here and inside the derived wiki section — so this entry
    has to stay above `Wiki` in `mkdocs.yml` for its title to be the one that
    survives.
    """
    tabs = _tabs(built_home)
    entry = re.search(
        r'<a href="(wiki/hmd-lang-spec/)"[^>]*>(.*?)</a>', tabs, re.S
    )
    assert entry is not None, "no language specification tab"
    assert "Language Specification" in re.sub(r"<[^>]+>", "", entry.group(2))


def test_the_top_bar_does_not_advertise_the_internal_proposals(built_home):
    """The numbered proposals specify the *tools*, not the format. They had a
    "Specifications" tab, which promised a visitor the language's specification
    and delivered implementation notes instead."""
    tabs = _tabs(built_home)
    assert "proposals/" not in tabs, "an HMD-NNNN proposal is back in the top bar"


def test_the_proposals_are_unlisted_but_still_published(built_site: Path):
    """`not_in_nav`, not `exclude_docs`. The cover, the public chapters, and
    several wiki cards link to the proposals with ordinary relative links; under
    `validation.links.not_found: info` those would rot into 404s that no gate
    reports. Unlisted and reachable is the state that costs nothing."""
    for number in ("HMD-0001", "HMD-0002", "HMD-0003", "HMD-0004"):
        assert (built_site / "proposals" / number / "index.html").is_file(), (
            f"{number} stopped being published; links to it now 404 silently"
        )


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
