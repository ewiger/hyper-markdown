# Update agent instructions

Update the agent instruction files listed in `.grem/config.yaml` from the
configured central instruction file.

1. Read every file under `doc/memory/` before making changes.
2. Read `.grem/config.yaml` for `agent_instructions.central` and
   `agent_instructions.targets`.
3. Treat the central file as the shared source of truth.
4. Update every target with the shared instructions while preserving necessary
   tool-specific syntax or guidance.
5. Ensure every target explicitly requires `doc/memory/` to be read at the
   start of every agent invocation.
6. Ensure every target says to ignore `.grem/**` unless the user explicitly
   activates a grem workflow or prompt.
7. Report updated targets and any instruction that could not be represented
   consistently.

Do not modify source code or unrelated project documentation.
