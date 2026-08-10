"""Lint rules HMD001..HMD017 (HMD-0001 §8)."""

from .report import format_json, format_text, summarize
from .rules import check

__all__ = ["check", "format_json", "format_text", "summarize"]
