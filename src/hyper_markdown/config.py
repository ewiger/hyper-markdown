"""Root discovery and `.hmd/config.toml` (HMD-0001 §4, §5.3)."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass
from pathlib import Path

MARKER_DIR = ".hmd"
CONFIG_NAME = "config.toml"
DEFAULT_WIKI = "doc/wiki"
DEFAULT_MODE = "both"
VALID_MODES = frozenset({"both", "recursive"})


@dataclass(frozen=True)
class Config:
    """Resolved project configuration."""

    root: Path  # the namespace root, absolute
    autodiscovery: bool = True
    mode: str = DEFAULT_MODE
    source: Path | None = None  # the config file actually read, if any


class ConfigError(Exception):
    """An unusable root or config file — exit code 2, not a lint finding."""


def find_project_root(start: Path) -> Path | None:
    """Nearest ancestor holding `.hmd/`, else nearest holding `.git`."""
    start = start.resolve()
    candidates = [start, *start.parents] if start.is_dir() else list(start.parents)
    for parent in candidates:
        if (parent / MARKER_DIR).is_dir():
            return parent
    for parent in candidates:
        if (parent / ".git").exists():
            return parent
    return None


def load(root_override: Path | None = None, start: Path | None = None) -> Config:
    """Resolve the namespace root and discovery policy.

    Absent `.hmd/config.toml` entirely, the root is `doc/wiki`, autodiscovery is
    on, and the mode is `both` — a tree with no configuration behaves the way a
    new author expects.
    """
    if root_override is not None:
        root = root_override.resolve()
        if not root.is_dir():
            raise ConfigError(f"root is not a directory: {root}")
        project = find_project_root(root) or root
        data, source = _read(project)
        return Config(
            root=root,
            autodiscovery=_autodiscovery(data),
            mode=_mode(data),
            source=source,
        )

    start = (start or Path.cwd()).resolve()
    project = find_project_root(start)
    if project is None:
        raise ConfigError(
            f"no project root above {start}: expected a .hmd/ or .git directory. "
            f"Pass --root to name the namespace root directly."
        )

    data, source = _read(project)
    wiki = data.get("wiki", DEFAULT_WIKI)
    if not isinstance(wiki, str):
        raise ConfigError(f"`wiki` must be a string in {source}")

    root = (project / wiki).resolve()
    if not root.is_dir():
        raise ConfigError(f"namespace root does not exist: {root}")

    return Config(root=root, autodiscovery=_autodiscovery(data), mode=_mode(data), source=source)


def _read(project: Path) -> tuple[dict, Path | None]:
    path = project / MARKER_DIR / CONFIG_NAME
    if not path.is_file():
        return {}, None
    try:
        with path.open("rb") as handle:
            return tomllib.load(handle), path
    except (OSError, tomllib.TOMLDecodeError) as exc:
        raise ConfigError(f"cannot read {path}: {exc}") from exc


def _discovery(data: dict) -> dict:
    section = data.get("discovery", {})
    return section if isinstance(section, dict) else {}


def _autodiscovery(data: dict) -> bool:
    value = _discovery(data).get("autodiscovery", True)
    if not isinstance(value, bool):
        raise ConfigError("[discovery] autodiscovery must be a boolean")
    return value


def _mode(data: dict) -> str:
    value = _discovery(data).get("mode", DEFAULT_MODE)
    if value not in VALID_MODES:
        raise ConfigError(f"[discovery] mode must be one of {sorted(VALID_MODES)}, got {value!r}")
    return value
