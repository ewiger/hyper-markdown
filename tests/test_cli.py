"""The `hmd` entry point, and the release claims that ride on it.

The rest of the suite drives the library directly, which is right — the CLI is
argument parsing and formatting only. What it cannot cover is the packaging
side: that a tag, the module, and the changelog are all talking about the same
version. Those checks live here because there is nowhere better, and because
the failure they prevent is unfixable once it has happened — PyPI refuses to
replace a filename it has already accepted.
"""

from __future__ import annotations

import re
import tomllib
from pathlib import Path

from typer.testing import CliRunner

from hyper_markdown import __version__
from hyper_markdown.cli import app

ROOT = Path(__file__).resolve().parent.parent
runner = CliRunner()


def test_version_flag_reports_the_module_version():
    result = runner.invoke(app, ["--version"])

    assert result.exit_code == 0
    assert result.stdout.strip() == f"hmd {__version__}"


def test_bare_invocation_is_help_and_not_an_error():
    """`no_args_is_help` plus a callback is an easy combination to break."""
    result = runner.invoke(app, [])

    assert "lint" in result.stdout
    assert result.exit_code in (0, 2)


def test_the_version_is_declared_once():
    """`pyproject.toml` must derive the version, never restate it.

    Two literals drift, and they drift silently until the day one of them is
    published.
    """
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))

    assert "version" not in pyproject["project"], "pyproject pins a literal version; it must stay dynamic"
    assert "version" in pyproject["project"]["dynamic"]
    assert pyproject["tool"]["setuptools"]["dynamic"]["version"] == {"attr": "hyper_markdown.__version__"}


def test_the_changelog_has_an_entry_for_the_current_version():
    """A bump without a changelog entry fails here rather than on the tag."""
    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")

    assert re.search(rf"^## \[{re.escape(__version__)}\]", changelog, re.M), (
        f"CHANGELOG.md has no `## [{__version__}]` section. Releasing is a"
        " changelog entry, a version bump, and a tag — in that order."
    )
