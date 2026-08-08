"""Frontmatter parsing and the reserved keys (HMD-0001 §5.3, HMD-0002 §2).

`tags`, `use`, `import`, and `nav` are reserved for the toolchain. The set is
closed and enumerated here; every other key stays user-owned and unexamined
(P3). `nav` was added by HMD-0002, which is an amendment to that closed set
rather than an extension of it — worth noticing, not repeating casually.
"""

from __future__ import annotations

import yaml

from .imports import ImportError_, parse_statement
from .model import CardConfig, ImportStmt

RESERVED_KEYS = frozenset({"tags", "use", "import", "nav"})

#: Features nameable in `use`. Prefixing `no_` disables, as in vim's `set no…`.
KNOWN_FEATURES = frozenset({"autodiscovery"})

_FENCE = "---"


def split_frontmatter(text: str) -> tuple[str | None, str, int]:
    """Split `text` into (raw_yaml, body, body_offset).

    The fence must begin at byte 0 and close with a `---` line; anything else is
    a document with no frontmatter at all.
    """
    if not text.startswith(_FENCE):
        return None, text, 0

    lines = text.splitlines(keepends=True)
    if not lines or lines[0].rstrip("\r\n") != _FENCE:
        return None, text, 0

    offset = len(lines[0])
    for line in lines[1:]:
        if line.rstrip("\r\n") == _FENCE:
            raw = text[len(lines[0]) : offset]
            end = offset + len(line)
            return raw, text[end:], end
        offset += len(line)

    return None, text, 0  # unterminated fence: not frontmatter


def parse_yaml(raw: str) -> dict:
    """Parse frontmatter YAML, or raise `ValueError` (HMD009)."""
    try:
        data = yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        raise ValueError(f"invalid YAML: {_one_line(exc)}") from exc
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ValueError(f"frontmatter must be a mapping, got {type(data).__name__}")
    return data


def parse_card_config(data: dict) -> tuple[CardConfig, list[tuple[str, str]]]:
    """Read the reserved keys out of `data`.

    Returns the config plus a list of (rule_id, message) problems, so the caller
    can attach them to a span. Unrecognized input is reported rather than
    ignored: silently dropping a misspelled `no_autodiscovry` would hand the
    author the default while they believe they configured something else.
    """
    problems: list[tuple[str, str]] = []

    tags = _parse_tags(data.get("tags"), problems)
    use = _parse_use(data.get("use"), problems)
    imports = _parse_imports(data.get("import"), problems)
    nav = _parse_nav(data.get("nav"), problems)

    return CardConfig(tags=tags, use=use, imports=imports, nav=nav), problems


def _parse_nav(value, problems) -> int | None:
    """`nav` orders a card within its directory (HMD-0002 §2)."""
    if value is None:
        return None
    # `True` is an int in Python, and `nav: yes` is a mistake worth naming.
    if isinstance(value, bool) or not isinstance(value, int):
        problems.append(("HMD013", f"`nav` must be an integer, got {value!r}"))
        return None
    return value


def _parse_tags(value, problems) -> tuple[str, ...]:
    if value is None:
        return ()
    if not isinstance(value, list):
        problems.append(("HMD013", f"`tags` must be a list, got {type(value).__name__}"))
        return ()
    tags = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            problems.append(("HMD013", f"`tags` entries must be non-empty strings, got {item!r}"))
            continue
        tags.append(item.strip())
    return tuple(tags)


def _parse_use(value, problems) -> dict[str, bool]:
    if value is None:
        return {}
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        problems.append(("HMD013", f"`use` must be a string or list, got {type(value).__name__}"))
        return {}

    use: dict[str, bool] = {}
    for item in value:
        if not isinstance(item, str):
            problems.append(("HMD013", f"`use` entries must be strings, got {item!r}"))
            continue
        name, enabled = item.strip(), True
        if name.startswith("no_"):
            name, enabled = name[3:], False
        if name not in KNOWN_FEATURES:
            known = ", ".join(sorted(KNOWN_FEATURES))
            problems.append(("HMD013", f"unknown feature {item.strip()!r} in `use` (known: {known})"))
            continue
        use[name] = enabled
    return use


def _parse_imports(value, problems) -> tuple[ImportStmt, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        problems.append(("HMD014", f"`import` must be a string or list, got {type(value).__name__}"))
        return ()

    stmts: list[ImportStmt] = []
    for item in value:
        try:
            stmts.append(parse_statement(item))
        except ImportError_ as exc:
            problems.append(("HMD014", str(exc)))
    return tuple(stmts)


def _one_line(exc: Exception) -> str:
    return " ".join(str(exc).split())
