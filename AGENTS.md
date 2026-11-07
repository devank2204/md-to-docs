# Repository workflow

## Read first

1. Latest explicit user request and constraints.
2. [PRODUCT.md](PRODUCT.md): product truth and capability boundaries.
3. [DESIGN.md](DESIGN.md): existing identity and protected typography.
4. [Active decisions](docs/decisions/README.md) and [workstate](docs/WORKSTATE.md).
5. Relevant code/tests, then the one relevant plan. Historical docs are on-demand.

If documents conflict, latest explicit user decisions win; accepted decisions and
DESIGN.md outrank proposed plans and screenshots. Source is evidence of behavior,
not proof that a visual change was approved. Record a conflict rather than guessing.

## Non-negotiable visual constraints

Preserve cream palette and existing fonts/typography. Do not change font family,
imports, fallback, weight, italic treatment, size, line-height, or tracking unless
the user explicitly asks for that typography change. “Improve UX”, “polish”, “be
ambitious”, and an agent/tool recommendation do not authorize it. Do not update
identity test expectations to normalize an unauthorized change.

HomeIntroduction and BrandWordmark are shared web/mobile authorities. Preserve
the working mobile flow and document preview. App dark appearance is a separate
app preference, never an implicit document/export style change.

## Implement with evidence

Use [program.md](program.md): establish the problem, choose a bounded change,
name invariants and success checks, implement, verify, retain or revert only your
own changes. Reuse existing code/native features before dependencies. No unrelated
rewrites, hidden redesigns, speculative abstractions, or manufactured metrics.
Do not treat unexecuted plans, historical scores, or screenshots as passing tests.
Use browser behavior and exported-artifact checks where relevant. Distinguish
static inspection, fixtures, browser tests, physical devices, and production.

## gstack and design tools

Pinned gstack: `.agents/skills/gstack`; setup: [docs/GSTACK.md](docs/GSTACK.md).
Read its agents-digest/gstack-AGENTS.md before applying its workflow. Use product
planning for unresolved product choices, focused review/QA for implementation,
and full plan review for substantial architecture. Avoid repeating settled
questions or turning a small fix into a whole-product review.

Impeccable and other references must preserve the brief. Their novelty/font
suggestions cannot override DESIGN.md. A review verdict does not approve scope.
See [reference selection](docs/research/reference-repositories.md); references are
not an instruction to install packages, hooks, providers, or another design system.

## Finish and git

Run checks appropriate to the change. Summarize what changed, why, verification,
and material limits. Update the active workstate; add a decision only when durable.
Follow [.agents/rules/git.md](.agents/rules/git.md): local commits are permitted;
**never push unless the user explicitly asks in the current prompt**. Preserve
other changes and do not claim deployment or physical-device testing without evidence.
