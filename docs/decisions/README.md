# Active decision register

This is the current register. Latest explicit user instructions win. Implemented
source establishes what exists; it does not retrospectively authorize a change.
Do not read every historical plan to infer today's intent.

| ID | Status / owner | Decision and reason | Evidence / scope |
| --- | --- | --- | --- |
| D001 | Accepted / user | Cream identity and typography are locked until the user explicitly requests typography changes. General polish or ambitious-UX scope does not lift the lock. | User corrections; DESIGN.md; all UI and output roles |
| D002 | Accepted restoration / user request | Restore mobile home to the incumbent web home treatment; share introduction and wordmark rather than maintain a second identity. Keep the working mobile flow and preview. | HomeIntroduction.tsx, BrandWordmark.tsx, browser identity tests |
| D003 | Accepted boundary / user | Plan dark app appearance separately from document styling. No export or source change when app appearance changes. Implementation now provides Cream/Dark/System under the latest implementation request. | User's dark-mode request; PRODUCT.md; current themeId is document styling |
| D004 | Accepted / existing task scope | Local-first conversion remains available without a required account. Never imply clipboard creates a Google Doc or browser print proves a PDF was saved. | Current helpers and browser behavior |
| D005 | Workflow / this task | Borrow documented techniques from reference repos; add a dependency only for a demonstrated gap within authorized scope. No mass installation or hook activation. | docs/research/reference-repositories.md |
| D006 | Workflow / this task | Evaluate bounded changes against a fixed baseline, guardrails and evidence; retain useful changes, revert only the experiment's own changes when worse. | program.md, adapted from autoresearch's documented loop |
| D007 | Accepted / user · 2026-11-08 | Desktop source/preview scrolling synchronizes in both directions by default, with an independent-scrolling toggle. Mobile and reading view remain independent. Preview editing is outside this request. | docs/qa/synchronized-scroll.md; browser geometry checks |

## Implementation scope update · 2026-11-07

The latest user request authorizes starting the proposed implementation. Shared
preparation/delivery, position-based review with guarded patch/undo, and optional
app appearance are implemented in this work. See the [implementation record](../designs/studio-implementation.md)
for evidence and remaining limits. D001/D002 continue to bind all work. This does
not turn unimplemented roadmap items or research goals into completed features.

## Remaining proposals

The remaining studio roadmap, conditional handoff kits and broader persistence
migration remain proposals. Desktop source/preview synchronization was separately
authorized and implemented under D007. Independent review is evidence about the plan, not user consent.
Older docs that discourage dark mode are superseded only by the explicit request
for optional app appearance. Older mobile visual experiments are superseded by D002.

## Recording a new durable decision

Add an ID only for a meaningful behavior, architecture, scope, or identity choice.
Record: date, status (proposed/accepted/superseded), decision owner, evidence,
constraint, consequence, and any superseded ID. Link to implementation/tests when
available. Do not record guesses as accepted decisions or duplicate settled facts
in multiple new policy files. Keep historical evidence; clearly mark its authority.

See [D002 restoration evidence](typography-restoration.md).

Register established: 2026-11-07. Supporting historical discussions remain in docs/.

## D008 — accepted user UX update · 2026-11-14

The attached UX implementation brief supersedes the earlier normal Prepare/Deliver
entry and appearance chooser: primary Copy for Google Docs, a Download menu and
one sun/moon switch. Preparation remains internal; PDF remains browser print.
Device appearance is the initial default; explicit choice persists independently
of document/export styling. D001/D002 typography and identity constraints remain.
Muted semantic green/amber states and bounded native transitions are authorized.

Five documents is the new capacity gate. New/duplicate actions require an explicit
replacement choice at capacity; legacy workspaces with six documents are retained,
never truncated on hydration. Restoration and capacity replacement must verify a
separate local recovery journal write before changing source/removing a document.
Recovery copies are visible in the version browser across document names and IDs;
quota failure cancels the destructive change. jsdiff is loaded with history only.
See `docs/qa/direct-handoff-and-history.md` for actual checks and limitations.
