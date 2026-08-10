from __future__ import annotations

from pathlib import Path

import pytest

from hypermarkdown import config
from hypermarkdown.resolve import Workspace

# `tools/hmd/tests` → `tools/hmd` → `tools` → the repository. `examples/` is
# shared: the TypeScript parity suite lints the same trees, so the fixture
# stays at the root rather than moving under the tool that happens to test it.
REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "examples" / "small"


@pytest.fixture
def build_workspace(tmp_path):
    """Write a tree of `.hmd` files and return a Workspace over it."""

    def _build(files: dict[str, str], config_toml: str | None = None) -> Workspace:
        for rel, text in files.items():
            path = tmp_path / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        if config_toml is not None:
            marker = tmp_path / ".hmd"
            marker.mkdir(exist_ok=True)
            (marker / "config.toml").write_text(config_toml, encoding="utf-8")
        return Workspace(config.load(root_override=tmp_path))

    return _build


@pytest.fixture(scope="session")
def example_workspace() -> Workspace:
    """The HMD-0001 example fixture at `examples/small/`."""
    return Workspace(config.load(root_override=FIXTURE))
