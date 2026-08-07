# Project agent instructions

Read and follow `CLAUDE.md` before doing any work in this repository.

At the start of every agent invocation, read every file under `doc/memory/` and
include that real-time decision context in the work.

Ignore `.grem/**` during ordinary work. Do not inspect, summarize, follow, or
modify its contents unless the user explicitly asks to execute a grem workflow
or supplies a grem prompt for execution.
