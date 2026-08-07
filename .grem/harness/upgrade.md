# Upgrade this scaffold

grem has verified that the Git worktree was clean, generated the target
template in a temporary directory, and overlaid its template-owned files onto
this project. Paths listed in `.gremignore` are project-owned and were left
untouched. The resulting unstaged Git diff is the upgrade record.

1. Read every file under `doc/memory/`.
2. Inspect `git status`, `git diff --stat`, and the complete `git diff`.
3. Summarize the template changes by purpose, including newly generated files
   and directories.
4. Identify committed project customizations that the template overlay replaced
   or conflicts with.
5. Help merge or reapply those customizations where they remain intentional.
   Do not blindly accept either side.
6. Verify `.grem/config.yaml`, agent instruction targets, and the project
   structure after merging.
7. Run the relevant project tests or checks.
8. Report the final merged result and any unresolved decision. Leave committing
   to the user.

Do not discard changes with destructive Git commands. Git is the rollback and
comparison mechanism for this upgrade.
