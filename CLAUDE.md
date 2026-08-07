# Project instructions

Treat `doc/` as a modular knowledge base:

- `doc/models/` declares the system through requirements, data, domain, and
  behavior lenses.
- `doc/wiki/` contains hyper-markdown (`.hmd`) cards.
- `doc/issues/` is just a kanban board of work items with cards.
- `doc/proposals/` holds numbered ADR/RFC-style technical specifications.
- `doc/memory/` holds small real-time decisions.
- `.grem/` contains dormant grem control data and copyable prompts.

Keep L0, L1, and L2 lens files directly under `doc/models/`.

Track progress **per proposal**, in `doc/proposals/HMD-NNNN/STATUS.md`. That
file is the only place work is tracked: Done, then a TODO split into planned
work, broken, limitations, and open questions/blockers. Never record progress in
`doc/memory/`, in `doc/wiki/` cards, or in a proposal's `README.md` — a decision
that needs discussion becomes an open question in the tracker.

At the start of every agent invocation, read every file under `doc/memory/` and
include that context in the work.

Ignore `.grem/**` during ordinary work. Do not inspect, summarize, follow, or
modify its contents unless the user explicitly asks to execute a grem workflow
or supplies a grem prompt for execution.
