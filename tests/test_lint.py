"""Lint rules HMD001..HMD016 (HMD-0001 §8)."""

from __future__ import annotations

import json

from hyper_markdown.lint import check, format_json, format_text, summarize

BASE = {
    "index.hmd": "# Root\n",
    "target.hmd": "# Target\n\n## Section\n\nblock ^anchor-id\n",
}


def rules_for(ws) -> list[str]:
    return [d.rule for d in check(ws)]


def test_clean_tree_has_no_diagnostics(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[target#Section]] [[target#^anchor-id]]\n"})
    assert check(ws) == []


def test_hmd001_unresolved_link_is_a_warning(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[nope]]\n"})
    (diag,) = [d for d in check(ws) if d.rule == "HMD001"]
    assert diag.severity == "warning"


def test_hmd002_ambiguous_link_lists_sorted_candidates(build_workspace):
    ws = build_workspace(
        {**BASE, "index.hmd": "# Root\n\n[[dup]]\n", "b/dup.hmd": "# B\n", "a/dup.hmd": "# A\n"}
    )
    (diag,) = [d for d in check(ws) if d.rule == "HMD002"]
    assert diag.severity == "error" and diag.candidates == ("a/dup.hmd", "b/dup.hmd")


def test_hmd003_link_escaping_the_root(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[../../../etc/passwd]]\n"})
    assert "HMD003" in rules_for(ws)


def test_hmd003_import_ref_escaping_the_root(build_workspace):
    """A wildcard import reads a directory listing, so an unchecked ref would
    disclose filenames outside the tree."""
    ws = build_workspace({**BASE, "a.hmd": "---\nimport:\n  - from ../../../etc import *\n---\n"})
    assert "HMD003" in rules_for(ws)


def test_hmd004_missing_heading_fragment(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[target#Nope]]\n"})
    assert "HMD004" in rules_for(ws)


def test_hmd004_accepts_either_heading_text_or_slug(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[target#Section]] [[target#section]]\n"})
    assert "HMD004" not in rules_for(ws)


def test_hmd005_missing_block_id(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[target#^nope]]\n"})
    assert "HMD005" in rules_for(ws)


def test_hmd006_duplicate_block_anchor(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\none ^dup\n\ntwo ^dup\n"})
    assert "HMD006" in rules_for(ws)


def test_hmd007_embed_cycle(build_workspace):
    ws = build_workspace({"a.hmd": "# A\n\n![[b]]\n", "b.hmd": "# B\n\n![[a]]\n"})
    assert "HMD007" in rules_for(ws)


def test_hmd007_self_embed(build_workspace):
    ws = build_workspace({"a.hmd": "# A\n\n![[a]]\n"})
    assert "HMD007" in rules_for(ws)


def test_hmd008_embed_depth_limit(build_workspace):
    tree = {f"p{i}.hmd": f"# P{i}\n\n![[p{i + 1}]]\n" for i in range(20)}
    tree["p20.hmd"] = "# End\n"
    ws = build_workspace(tree)
    assert "HMD008" in rules_for(ws)


def test_deep_but_bounded_embeds_are_fine(build_workspace):
    tree = {f"p{i}.hmd": f"# P{i}\n\n![[p{i + 1}]]\n" for i in range(5)}
    tree["p5.hmd"] = "# End\n"
    ws = build_workspace(tree)
    assert "HMD008" not in rules_for(ws)


def test_hmd009_invalid_frontmatter(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "---\n- not\n- a mapping\n---\n"})
    assert "HMD009" in rules_for(ws)


def test_hmd010_malformed_link(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[]]\n"})
    assert "HMD010" in rules_for(ws)


def test_hmd011_duplicate_heading_slug(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# Dup\n\n# Dup\n"})
    (diag,) = [d for d in check(ws) if d.rule == "HMD011"]
    assert diag.severity == "warning"


def test_hmd012_page_beside_folder_note(build_workspace):
    ws = build_workspace({**BASE, "dup.hmd": "# File\n", "dup/index.hmd": "# Note\n"})
    assert "HMD012" in rules_for(ws)


def test_hmd013_unknown_use_feature(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "---\nuse: [no_discovery]\n---\n"})
    assert "HMD013" in rules_for(ws)


def test_hmd014_malformed_import(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "---\nimport:\n  - from shared import x\n---\n"})
    assert "HMD014" in rules_for(ws)


def test_hmd015_import_ref_does_not_exist(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "---\nimport:\n  - from /nowhere import *\n---\n"})
    assert "HMD015" in rules_for(ws)


def test_hmd015_import_name_does_not_exist(build_workspace):
    ws = build_workspace({**BASE, "sub/x.hmd": "# X\n", "a.hmd": "---\nimport:\n  - from /sub import nope\n---\n"})
    assert "HMD015" in rules_for(ws)


def test_hmd015_duplicate_local_binding(build_workspace):
    tree = {
        **BASE,
        "one/x.hmd": "# One\n",
        "two/x.hmd": "# Two\n",
        "a.hmd": "---\nimport:\n  - from /one import x\n  - from /two import x\n---\n",
    }
    ws = build_workspace(tree)
    assert "HMD015" in rules_for(ws)


def test_hmd016_shadowed_search_path(build_workspace):
    tree = {
        **BASE,
        "one/x.hmd": "# One\n",
        "two/x.hmd": "# Two\n",
        "a.hmd": "---\nimport:\n  - from /one import *\n  - from /two import *\n---\n\n[[x]]\n",
    }
    ws = build_workspace(tree)
    (diag,) = [d for d in check(ws) if d.rule == "HMD016"]
    assert diag.severity == "warning" and diag.candidates == ("two/x.hmd",)


# -- reporting -----------------------------------------------------------


def test_diagnostics_are_sorted(build_workspace):
    ws = build_workspace({**BASE, "z.hmd": "# Z\n\n[[nope]]\n", "a.hmd": "# A\n\n[[nope]]\n"})
    diagnostics = check(ws)
    assert [d.path for d in diagnostics] == sorted(d.path for d in diagnostics)


def test_strict_promotes_warnings_without_changing_diagnostics(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[nope]]\n"})
    diagnostics = check(ws)
    assert summarize(diagnostics, strict=False) == (0, 1)
    assert summarize(diagnostics, strict=True) == (1, 0)


def test_json_output_matches_text_content(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[nope]]\n"})
    diagnostics = check(ws)
    payload = json.loads(format_json(diagnostics))
    assert payload["warnings"] == 1 and payload["errors"] == 0
    assert payload["diagnostics"][0]["rule"] == "HMD001"
    assert "HMD001" in format_text(diagnostics)


def test_json_output_is_byte_identical_across_runs(build_workspace, tmp_path):
    from hyper_markdown import config
    from hyper_markdown.resolve import Workspace

    tree = {**BASE, "a.hmd": "# A\n\n[[nope]] [[dup]]\n", "x/dup.hmd": "# X\n", "y/dup.hmd": "# Y\n"}
    first = format_json(check(build_workspace(tree)))
    second = format_json(check(Workspace(config.load(root_override=tmp_path))))
    assert first == second


def test_linting_a_subset_of_paths(build_workspace):
    ws = build_workspace({**BASE, "a.hmd": "# A\n\n[[nope]]\n", "b.hmd": "# B\n\n[[nope]]\n"})
    diagnostics = check(ws, [ws.root / "a.hmd"])
    assert {d.path for d in diagnostics} == {"a.hmd"}
