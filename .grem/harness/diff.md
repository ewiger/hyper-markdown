# Find semantic inconsistencies

Compare the two project scopes named in the prompt header. This is a semantic
comparison, not a textual diff: determine what truth, behavior, constraints,
and intent can be learned from each side.

1. Read every file under `doc/memory/`.
2. Inspect both scopes recursively, following relevant internal references.
3. Extract the declarations and observable claims made by each scope.
4. Identify contradictions, missing counterparts, stale declarations, and
   behavior that is specified but not evidenced.
5. Support every inconsistency with concrete paths and concise evidence from
   both sides.

Return a numbered list. Each item must contain:

- the inconsistency;
- what scope A says or implies;
- what scope B says or demonstrates;
- why the difference matters;
- the decision needed from the user.

Do not plan or change files. Do not classify an item as a feature, bug, or
follow-up until the user decides how it should be handled. If there are no
material inconsistencies, say so explicitly.
