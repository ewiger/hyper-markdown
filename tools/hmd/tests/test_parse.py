"""Grammar, frontmatter, and heading slugs (HMD-0001 §2, §3)."""

from __future__ import annotations

from pathlib import Path

import pytest

from hypermarkdown.parse import parse

PATH = Path("/tmp/page.hmd")


def doc(text: str):
    return parse(PATH, text, "page.hmd")


def rules(document) -> list[str]:
    return [d.rule for d in document.diagnostics]


# -- links ---------------------------------------------------------------


def test_plain_wikilink():
    (link,) = doc("[[Page]]\n").links
    assert (link.page_ref, link.fragment, link.display, link.is_embed) == ("Page", None, None, False)


def test_aliased_link_splits_on_the_first_pipe_only():
    (link,) = doc("[[Page|a | b]]\n").links
    assert link.page_ref == "Page" and link.display == "a | b"


def test_heading_and_block_fragments():
    heading, block = doc("[[P#Section]] [[P#^id-1]]\n").links
    assert (heading.fragment, heading.fragment_kind) == ("Section", "heading")
    assert (block.fragment, block.fragment_kind) == ("id-1", "block")


def test_embed_forms():
    assert all(link.is_embed for link in doc("![[A]] ![[B#S]] ![[C#^d]]\n").links)


def test_trailing_extension_is_kept_verbatim_for_the_resolver():
    (link,) = doc("[[Page.hmd]]\n").links
    assert link.page_ref == "Page.hmd"


@pytest.mark.parametrize(
    "text",
    [
        "[[]]\n",
        "[[Page|]]\n",
        "[[#tag]]\n",
        "[[#area/auth]]\n",
        "[[a^b]]\n",
        "[[P#^bad id]]\n",
        "[[P#^-leading]]\n",
        "[[P#]]\n",
        "[[unterminated\n",
    ],
    ids=["empty", "empty-display", "tag", "nested-tag", "caret", "space-in-id",
         "leading-dash", "empty-fragment", "unterminated"],
)
def test_malformed_links_raise_hmd010(text):
    assert "HMD010" in rules(doc(text))


def test_block_id_length_boundary():
    ok = "a" * 64
    assert doc(f"[[P#^{ok}]]\n").links[0].fragment == ok
    assert "HMD010" in rules(doc(f"[[P#^{'a' * 65}]]\n"))


def test_tags_are_never_link_targets():
    """`#` is reserved for fragments, which is what keeps the two axes apart."""
    assert doc("[[#area/auth]]\n").links == ()


# -- headings and slugs --------------------------------------------------


def test_slug_matches_python_markdown_toc():
    headings = doc("# My Section\n## Rotation\n").headings
    assert [h.slug for h in headings] == ["my-section", "rotation"]


def test_colliding_slugs_are_deduped_in_document_order():
    headings = doc("# Dup\n# Dup\n# Dup\n").headings
    assert [h.slug for h in headings] == ["dup", "dup_1", "dup_2"]


def test_heading_text_drops_closing_hashes_and_anchors():
    headings = doc("## Title ##\n### Other ^anchor-id\n").headings
    assert [h.text for h in headings] == ["Title", "Other"]


def test_heading_slug_uses_original_text_not_masked_text():
    (heading,) = doc("## The `hmd` CLI\n").headings
    assert heading.slug == "the-hmd-cli"


# -- anchors -------------------------------------------------------------


def test_anchor_extraction():
    assert [a.block_id for a in doc("Some text. ^my-id\n").anchors] == ["my-id"]


# -- frontmatter ---------------------------------------------------------


def test_frontmatter_is_parsed_and_body_offsets_stay_exact():
    document = doc("---\ntags: [a]\n---\n\n[[Target]]\n")
    assert document.card.tags == ("a",)
    assert document.links[0].span.line == 5


def test_frontmatter_must_start_at_byte_zero():
    document = doc("\n---\ntags: [a]\n---\n")
    assert document.frontmatter == {} and document.card.tags == ()


def test_empty_frontmatter_is_an_empty_mapping():
    assert doc("---\n---\n").frontmatter == {}


@pytest.mark.parametrize(
    "text", ["---\n: : :\n---\n", "---\n- a\n- b\n---\n", "---\njust a string\n---\n"]
)
def test_bad_frontmatter_raises_hmd009(text):
    assert "HMD009" in rules(doc(text))


def test_unknown_use_feature_raises_hmd013():
    assert "HMD013" in rules(doc("---\nuse: [autodiscovry]\n---\n"))


def test_no_prefix_disables_a_feature():
    assert doc("---\nuse: [no_autodiscovery]\n---\n").card.use == {"autodiscovery": False}


def test_use_accepts_a_bare_string():
    assert doc("---\nuse: autodiscovery\n---\n").card.use == {"autodiscovery": True}


def test_malformed_tags_raise_hmd013():
    assert "HMD013" in rules(doc("---\ntags: not-a-list\n---\n"))


def test_user_owned_keys_pass_through_untouched():
    document = doc("---\nauthor: yy\nweird_key: {a: 1}\n---\n")
    assert document.frontmatter["author"] == "yy"
    assert document.frontmatter["weird_key"] == {"a": 1}
    assert document.diagnostics == []


def test_links_inside_frontmatter_are_not_links():
    assert doc("---\ntitle: '[[not-a-link]]'\n---\n\nbody\n").links == ()
