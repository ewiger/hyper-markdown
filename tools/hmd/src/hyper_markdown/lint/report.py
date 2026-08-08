"""Text and JSON reporters (HMD-0001 §7).

JSON output is identical in content to the text output, so CI and a future
editor client consume the same data.
"""

from __future__ import annotations

import json

from ..model import ERROR, WARNING, Diagnostic


def summarize(diagnostics: list[Diagnostic], strict: bool = False) -> tuple[int, int]:
    """Return (errors, warnings). Under `strict` every warning counts as an error."""
    errors = sum(1 for d in diagnostics if d.severity == ERROR)
    warnings = sum(1 for d in diagnostics if d.severity == WARNING)
    if strict:
        return errors + warnings, 0
    return errors, warnings


def format_text(diagnostics: list[Diagnostic], strict: bool = False) -> str:
    lines = [
        f"{d.path}:{d.line}:{d.column}: {d.severity}[{d.rule}] {d.message}" for d in diagnostics
    ]
    errors, warnings = summarize(diagnostics, strict)
    if not diagnostics:
        lines.append("clean: no diagnostics")
    else:
        lines.append("")
        lines.append(f"{errors} error(s), {warnings} warning(s)")
    return "\n".join(lines)


def format_json(diagnostics: list[Diagnostic], strict: bool = False) -> str:
    errors, warnings = summarize(diagnostics, strict)
    payload = {
        "diagnostics": [d.to_dict() for d in diagnostics],
        "errors": errors,
        "warnings": warnings,
    }
    # sort_keys for byte-identical output across runs (P1).
    return json.dumps(payload, indent=2, sort_keys=True)
