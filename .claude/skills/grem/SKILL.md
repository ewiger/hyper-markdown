---
name: grem
description: Execute a grem CLI workflow in this repo. Use when the user asks to align agent instructions (grem agent), semantically diff or sync two project scopes (grem diff / grem sync), apply a documentation style (grem new), scaffold a project (grem init), or upgrade the template (grem upgrade) — or hands you a grem-generated prompt to carry out.
---

# grem workflows

`grem` is a deterministic scaffolding CLI. Its workflow subcommands do **not**
call an LLM — they print a Markdown **prompt to stdout** that an agent (you) then
carries out. This skill is how you execute those prompts without the user having
to copy-paste them anywhere.

## First, always

Read every file under `doc/memory/` and fold those small real-time decisions
into the work.

## How to run a workflow

1. Run the requested grem subcommand and capture its stdout. If `grem` is not on
   `PATH`, use `uv run grem ...` from the repo root.
2. Treat the printed Markdown as your instructions: the header lines name the
   scopes / files involved, and the body is the task. Do exactly what it says,
   scoped to this repository.
3. Make the changes, run any tests the prompt calls for, and report what you did.

## Subcommands

- `grem agent [PROJECT]` — prompt to align the configured agent instruction
  files (e.g. `AGENTS.md`, `CLAUDE.md`) with the central instructions.
- `grem diff A B` — prompt to find semantic inconsistencies between two
  project-local scopes. Return a numbered list; do **not** change files.
- `grem sync A B` — the full plan → implement → test → document → diff loop for
  reconciling two scopes.
- `grem new PATH --type TYPE --style STYLE` — prompt to apply a stored
  documentation style to a source file.
- `grem init [TARGET]` — scaffold a new project tree (defaults to the `python`
  template in the current directory). Refuses if a `.grem/` folder exists.
- `grem upgrade [PROJECT]` — overlay a newer template in a clean Git worktree,
  then review and merge the resulting diff per the printed prompt.

## Notes

- Every prompt command also accepts `--copy`/`-c` to place the prompt on the
  clipboard. You don't need it — read stdout directly.
- Ignore `.grem/**` during ordinary work. Only inspect it while executing a grem
  workflow like this one.
