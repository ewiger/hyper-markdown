"""hyper-markdown — a strict, machine-checkable markdown dialect.

The reference implementation of HMD-0001. Semantics live here, in Python;
every consumer (CLI, MkDocs plugin, future language server) is a thin client,
so there is no second implementation to drift out of sync (P5).
"""

from .config import Config, ConfigError
from .model import Diagnostic, Document, Link, Span
from .resolve import Outcome, Resolution, Workspace

__version__ = "0.1.0"

__all__ = [
    "Config",
    "ConfigError",
    "Diagnostic",
    "Document",
    "Link",
    "Outcome",
    "Resolution",
    "Span",
    "Workspace",
    "__version__",
]
