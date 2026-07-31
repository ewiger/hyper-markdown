# Agent harness

This directory is dormant by default. Agents must ignore `.grem/**` during
ordinary work. Its contents become active only when the user explicitly asks to
execute a grem workflow or supplies one of these prompts for execution.

Once explicitly activated, this directory is the shared operating manual for
LLM agents such as Claude and Codex.

Before acting on any prompt, read every file under `doc/memory/`. Those files
contain small real-time decisions that must be included in every agent
invocation.

Use:

- `instructions.md` to align tool-specific instruction files.
- `diff.md` to find numbered semantic inconsistencies between project scopes.
- `sync.md` to run the plan → implement → test → document → diff loop across
  two project scopes.
- `upgrade.md` to review and merge a newer template after grem overlays it in a
  clean Git worktree.

System declarations belong under `doc/models/`. Active work belongs under
`doc/issues/`. Numbered technical specifications and substantial decisions
belong under `doc/proposals/`.
