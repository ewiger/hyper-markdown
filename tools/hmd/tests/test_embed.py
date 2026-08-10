"""Embed expansion (HMD-0001 §6)."""

from __future__ import annotations

from hypermarkdown.embed import expand


def page(ws, rel):
    return ws.root / rel


def test_whole_page_embed_drops_the_frontmatter_fence(build_workspace):
    ws = build_workspace(
        {
            "a.hmd": "# A\n\n![[b]]\n",
            "b.hmd": "---\ntags: [x]\n---\n\n# B\n\nbody of b\n",
        }
    )
    out = expand(ws, page(ws, "a.hmd")).text
    assert "body of b" in out
    assert "tags:" not in out


def test_section_embed_stops_at_the_next_same_or_higher_heading(build_workspace):
    ws = build_workspace(
        {
            "a.hmd": "# A\n\n![[b#Wanted]]\n",
            "b.hmd": "# B\n\n## Wanted\n\nkeep\n\n### Deeper\n\nalso keep\n\n## Next\n\ndrop\n",
        }
    )
    out = expand(ws, page(ws, "a.hmd")).text
    assert "keep" in out and "also keep" in out
    assert "drop" not in out and "## Next" not in out


def test_block_embed_strips_the_anchor_marker(build_workspace):
    ws = build_workspace(
        {
            "a.hmd": "# A\n\n![[b#^def]]\n",
            "b.hmd": "# B\n\nfirst paragraph\n\nthe definition\nsecond line ^def\n\nafter\n",
        }
    )
    out = expand(ws, page(ws, "a.hmd")).text
    assert "the definition\nsecond line" in out
    assert "^def" not in out
    assert "first paragraph" not in out and "after" not in out


def test_expansion_is_recursive(build_workspace):
    ws = build_workspace(
        {"a.hmd": "# A\n\n![[b]]\n", "b.hmd": "# B\n\n![[c]]\n", "c.hmd": "# C\n\ndeepest\n"}
    )
    assert "deepest" in expand(ws, page(ws, "a.hmd")).text


def test_cycle_reports_hmd007_and_leaves_the_embed_verbatim(build_workspace):
    ws = build_workspace({"a.hmd": "# A\n\n![[b]]\n", "b.hmd": "# B\n\n![[a]]\n"})
    result = expand(ws, page(ws, "a.hmd"))
    assert [d.rule for d in result.diagnostics] == ["HMD007"]
    assert "![[a]]" in result.text


def test_depth_limit_reports_hmd008(build_workspace):
    tree = {f"p{i}.hmd": f"# P{i}\n\n![[p{i + 1}]]\n" for i in range(20)}
    tree["p20.hmd"] = "# End\n"
    ws = build_workspace(tree)
    result = expand(ws, page(ws, "p0.hmd"))
    assert [d.rule for d in result.diagnostics] == ["HMD008"]


def test_a_bounded_chain_expands_without_diagnostics(build_workspace):
    tree = {f"p{i}.hmd": f"# P{i}\n\n![[p{i + 1}]]\n" for i in range(5)}
    tree["p5.hmd"] = "# End\n\nbottom\n"
    ws = build_workspace(tree)
    result = expand(ws, page(ws, "p0.hmd"))
    assert result.diagnostics == [] and "bottom" in result.text


def test_an_unresolved_embed_is_left_as_written(build_workspace):
    ws = build_workspace({"a.hmd": "# A\n\n![[nope]]\n"})
    result = expand(ws, page(ws, "a.hmd"))
    assert "![[nope]]" in result.text and result.diagnostics == []


def test_headings_are_not_shifted(build_workspace):
    """Level shifting changes document outlines and deserves its own decision."""
    ws = build_workspace({"a.hmd": "# A\n\n![[b]]\n", "b.hmd": "# B\n\ntext\n"})
    assert "# B" in expand(ws, page(ws, "a.hmd")).text


def test_an_embed_inside_a_code_fence_is_not_expanded(build_workspace):
    ws = build_workspace({"a.hmd": "# A\n\n```\n![[b]]\n```\n", "b.hmd": "# B\n\nbody\n"})
    assert "body" not in expand(ws, page(ws, "a.hmd")).text
