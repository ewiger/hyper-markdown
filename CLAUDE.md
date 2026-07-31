# Project instructions

Treat `doc/` as a modular knowledge base:

- `doc/models/` declares the system through requirements, data, domain, and
  behavior lenses.
- `doc/wiki/` contains hyper-markdown (`.hmd`) cards.
- `doc/issues/` is active working memory.
- `doc/proposals/` holds numbered ADR/RFC-style technical specifications.
- `doc/memory/` holds small real-time decisions.
- `.grem/` contains dormant grem control data and copyable prompts.

Keep L0, L1, and L2 lens files directly under `doc/models/`.

At the start of every agent invocation, read every file under `doc/memory/` and
include that context in the work.

Ignore `.grem/**` during ordinary work. Do not inspect, summarize, follow, or
modify its contents unless the user explicitly asks to execute a grem workflow
or supplies a grem prompt for execution.
