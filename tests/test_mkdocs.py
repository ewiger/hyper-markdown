"""URL policy and the MkDocs plugin (HMD-0002 §1-§4)."""

from __future__ import annotations

from pathlib import Path

import yaml

import pytest

from hyper_markdown import urls

mkdocs_build = pytest.importorskip("mkdocs.commands.build")
mkdocs_config = pytest.importorskip("mkdocs.config")

REPO_ROOT = Path(__file__).resolve().parents[1]
FIXTURE = REPO_ROOT / "examples" / "small"


# -- §1 URL policy -------------------------------------------------------


def test_a_card_serves_at_a_directory_url(tmp_path):
    assert urls.url_for(tmp_path, tmp_path / "a" / "b.hmd") == "a/b/"


def test_a_folder_note_and_a_card_share_one_url(tmp_path):
    """Two names for one page must not become two URLs for one page."""
    assert urls.url_for(tmp_path, tmp_path / "a" / "b" / "index.hmd") == "a/b/"
    assert urls.url_for(tmp_path, tmp_path / "a" / "b.hmd") == "a/b/"


def test_the_root_folder_note_is_the_site_home(tmp_path):
    assert urls.url_for(tmp_path, tmp_path / "index.hmd") == ""


def test_pages_are_registered_as_markdown(tmp_path):
    assert urls.dest_for(tmp_path, tmp_path / "a" / "b.hmd") == "a/b.md"
    assert urls.dest_for(tmp_path, tmp_path / "a" / "b" / "index.hmd") == "a/b.md"


@pytest.mark.parametrize(
    ("source", "target", "expected"),
    [
        ("a/one.hmd", "a/two.hmd", "two.md"),
        ("a/b/deep.hmd", "top.hmd", "../../top.md"),
        ("top.hmd", "a/b/deep.hmd", "a/b/deep.md"),
        ("a/one.hmd", "a/folder/index.hmd", "folder.md"),
    ],
)
def test_hrefs_are_relative_to_the_source_path(tmp_path, source, target, expected):
    """MkDocs resolves and validates links against the source tree, so it is
    handed a source-relative path rather than a finished URL."""
    assert urls.href_for(tmp_path, tmp_path / source, tmp_path / target) == expected


# -- the build -----------------------------------------------------------


def build(tmp_path: Path, docs_dir: Path, **extra) -> Path:
    """Build `docs_dir` into a temporary site and return the site directory."""
    site_dir = tmp_path / "site"
    config_file = tmp_path / "mkdocs.yml"
    settings = {
        "site_name": "test",
        "docs_dir": str(docs_dir),
        "site_dir": str(site_dir),
        "plugins": ["hyper-markdown"],
        "exclude_docs": "*.hmd",
        **extra,
    }
    config_file.write_text(yaml.safe_dump(settings), encoding="utf-8")
    mkdocs_build.build(mkdocs_config.load_config(str(config_file)))
    return site_dir


def test_every_card_reaches_the_site(tmp_path):
    site = build(tmp_path, FIXTURE)
    assert (site / "index.html").is_file()
    assert (site / "specs" / "auth" / "login" / "index.html").is_file()
    # A folder note serves at its directory's URL, not at `.../index/`.
    assert (site / "specs" / "auth" / "index.html").is_file()
    assert not (site / "specs" / "auth" / "index" / "index.html").exists()


def test_a_wikilink_becomes_a_real_href(tmp_path):
    site = build(tmp_path, FIXTURE)
    html = (site / "specs" / "auth" / "login" / "index.html").read_text()
    assert 'href="../tokens/"' in html


def test_a_red_link_keeps_the_build_green(tmp_path):
    """The fixture's deliberate red link renders, and does not fail the build."""
    site = build(tmp_path, FIXTURE)
    html = (site / "glossary" / "index.html").read_text()
    assert 'class="hmd-redlink"' in html
    assert "idempotency" in html


def test_embeds_are_expanded_into_the_page(tmp_path):
    site = build(tmp_path, FIXTURE)
    html = (site / "specs" / "auth" / "login" / "index.html").read_text()
    assert "A bearer credential presented on every request" in html
    assert "^definition" not in html


def test_page_urls_match_the_policy(tmp_path):
    """What §1 says a page's URL is, is where the build actually puts it."""
    site = build(tmp_path, FIXTURE)
    for page in FIXTURE.rglob("*.hmd"):
        if any(part.startswith(".") for part in page.relative_to(FIXTURE).parts):
            continue
        expected = site / urls.url_for(FIXTURE, page) / "index.html"
        assert expected.is_file(), f"{page} is not served at {urls.url_for(FIXTURE, page)}"


def test_page_urls_are_directory_urls_only(tmp_path):
    from mkdocs.exceptions import Abort

    with pytest.raises((Abort, SystemExit)):
        build(tmp_path, FIXTURE, use_directory_urls=False)


# -- §2 nav --------------------------------------------------------------


def test_nav_orders_by_the_nav_key_then_by_path(tmp_path):
    docs = tmp_path / "docs"
    (docs / "sub").mkdir(parents=True)
    (docs / "index.hmd").write_text("# Home\n", encoding="utf-8")
    (docs / "aaa.hmd").write_text("---\nnav: 20\n---\n\n# Aaa\n", encoding="utf-8")
    (docs / "zzz.hmd").write_text("---\nnav: 10\n---\n\n# Zzz\n", encoding="utf-8")
    (docs / "mmm.hmd").write_text("# Mmm\n", encoding="utf-8")

    site = build(tmp_path, docs)
    html = (site / "index.html").read_text()
    # `nav: 10` sorts ahead of `nav: 20`, and both ahead of the unkeyed card.
    assert html.index(">Zzz<") < html.index(">Aaa<") < html.index(">Mmm<")


def test_a_card_title_comes_from_its_first_heading(tmp_path):
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "index.hmd").write_text("# Home\n", encoding="utf-8")
    (docs / "some-card.hmd").write_text("# A Proper Title\n", encoding="utf-8")

    html = (build(tmp_path, docs) / "index.html").read_text()
    assert "A Proper Title" in html


def test_an_explicit_nav_wins(tmp_path):
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "index.hmd").write_text("# Home\n", encoding="utf-8")
    (docs / "hidden.hmd").write_text("# Hidden\n", encoding="utf-8")

    site = build(tmp_path, docs, nav=[{"Home": "index.md"}])
    html = (site / "index.html").read_text()
    assert "Hidden" not in html
    # The page still builds; it is simply absent from the nav.
    assert (site / "hidden" / "index.html").is_file()


# -- §4 plain markdown ---------------------------------------------------


def test_plain_markdown_builds_alongside_cards(tmp_path):
    docs = tmp_path / "docs"
    docs.mkdir()
    (docs / "index.hmd").write_text("# Home\n\n[[plain]]\n", encoding="utf-8")
    (docs / "plain.md").write_text("# Plain\n\nordinary markdown\n", encoding="utf-8")

    site = build(tmp_path, docs)
    assert (site / "plain" / "index.html").is_file()
    # `.md` is invisible to the resolver, so a wikilink naming one stays red.
    assert 'class="hmd-redlink"' in (site / "index.html").read_text()
