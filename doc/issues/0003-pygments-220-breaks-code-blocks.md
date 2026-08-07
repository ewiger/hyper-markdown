# 0003 — Pygments 2.20 silently breaks every code block

**Column**: done
**Opened**: 2026-08-07
**Closed**: 2026-08-07
**Found by**: reading the rendered Publishing page
**Upstream**: `pymdown-extensions` 10.21 with `pygments` 2.20.0

## Symptom

Every fenced code block on every page rendered as running text. The YAML example
on the Publishing page came out as one paragraph of `<code>` with its line
breaks collapsed. No page had a single `<pre>` element.

## Cause

Not our code, and not our markdown. `pymdownx.superfences` registers its
preprocessor, the preprocessor runs, and it matches nothing:

```python
>>> md.preprocessors["fenced_code_block"].run(["```yaml", "a: 1", "```"])
['```yaml', 'a: 1', '```']       # unchanged
```

Bisected against a clean environment: the trigger is **Pygments 2.20.0**. With
2.19.2 the same versions of everything else render fences correctly.

| markdown | pymdown-extensions | pygments | result |
| --- | --- | --- | --- |
| 3.10.2 | 10.21 | 2.19.2 | code blocks |
| 3.10.2 | 10.21 | 2.20.0 | plain text |

## Why it went unnoticed

Nothing failed. `mkdocs build --strict` stayed green, no warning was emitted,
and the pages were all present. The only evidence was in the rendered HTML,
which no gate looked at. A build that is green and wrong is worse than one that
is red.

## Fix

`pygments<2.20` in the `mkdocs` extra of `pyproject.toml`, with the reason
recorded beside it. Lift the ceiling once `pymdown-extensions` ships a fix.

A configuration workaround exists — `pymdownx.highlight` with
`use_pygments: false` restores the fences — but it turns off syntax
highlighting for everyone, including correctly-pinned installs. The pin keeps
the colours.

## Guard

`tests/test_mkdocs.py::test_fenced_code_survives_the_build` asserts a built page
contains `<pre>`. It checks the *output*, not the versions, so it catches any
future recurrence whatever its cause.
