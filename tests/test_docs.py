"""Checks on the project's own prose sources.

These gate authored content rather than rendered output. Issue 0003 and issue
0005 both needed the opposite — assert the HTML, because the defect was produced
by the toolchain. Issue 0006 is authored: the renderer is correct and will not
change, so the source is the right place to catch it.
"""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# A code span whose body contains a backslash-escaped pipe.
ESCAPED_PIPE_IN_CODE_SPAN = re.compile(r"`[^`\n]*\\\|[^`\n]*`")
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
        if ESCAPED_PIPE_IN_CODE_SPAN.search(line):
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
