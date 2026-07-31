# Synchronize project scopes

Reconcile the two project scopes named in the prompt header. Neither side is
automatically authoritative: use evidence, project memory, and user decisions
to determine the intended truth.

Run the complete loop:

1. Read every file under `doc/memory/`.
2. Perform the semantic comparison defined by `.grem/harness/diff.md`.
3. Present the numbered inconsistencies and obtain the user's disposition for
   material items: feature, bug, follow-up, accepted difference, or no action.
4. Plan the selected work with explicit acceptance checks.
5. Implement the approved changes in the appropriate scope.
6. Run or add focused tests that demonstrate the intended behavior.
7. Update the relevant declarations and documentation so they describe the
   resulting system.
8. Repeat the semantic diff between the same scopes.
9. Continue the plan → implement → test → document → diff loop until the
   approved inconsistencies are resolved or a concrete blocker requires user
   input.

Preserve intentional differences. Report completed work, test evidence,
remaining inconsistencies, and decisions still needed.
