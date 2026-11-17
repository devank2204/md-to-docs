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

## D009 — accepted user screenshot · 2026-11-15

Owner selected Grouped sidebar, then requested its exact UI/look and the same text
font for mdtodocs.com. Supersedes the header-only Tools proposal and D001's brand
typography lock only for the scoped sidebar/shared wordmark. Reference is the
owner-attached image.png from this conversation; no other typography is changed.
Use Inter Variable, the screenshot's 248px rail-free sidebar and Lucide outline
icons. Keep existing document identities, capacity/recovery, exports, mobile shell
and SEO URLs. Markdown editor opens the existing source editor; Mermaid entries
reuse the existing SVG/PNG utility routes. No speculative editor routes or engines.
History and Close remain in document overflow menus; global command access remains.
Implementation/verification: docs/qa/grouped-sidebar-reference.md.

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

## D010 — accepted screenshot/mockup feedback · 2026-11-15

Owner: user. Latest implementation request and reviewed rename/export reference
supersede D008's primary Copy/Download composition and fixed capacity rule.
Use a single Export menu, an editable title with one outline and explicit check,
Material Symbols actions, neutral ordinary hover/selection, and tabbed history
with a restrained save disclosure. Preserve home, brand and document typography.

Markdown dropped anywhere opens a new internal document, never replaces current
source or opens a browser tab. Initial capacity is five; Open anyway explicitly
accepts an extra document and persists the increased capacity. All gates and
warning counts derive from that capacity. Cancel skips import; Remove verifies
recovery before replacing the chosen document and closing the prompt. Legacy
workspaces remain intact.

The user explicitly authorized contained logo snow: local, hover-triggered,
reduced-motion/Save-Data aware, with no whole-page effect. Code formatting uses
lazy language parsers where supported; unsupported languages say Normalize
spacing. Preview formatting never silently changes source Markdown.

Evidence: [implementation and checks](../qa/approved-workspace-implementation.md).
D001/D002 identity constraints and verified recovery remain binding.

## D011 — accepted quiet workspace corrections · 2026-11-15

Owner: user. Latest explicit feedback supersedes D010's outlined title and advanced
export entry. The title uses available navbar width without pill/border; explicit
save and cancellation remain. Direct exports are the only normal export flow;
remove duplicate delivery modals. Header controls share neutral hover surfaces.
Reading entry uses a reduced-motion-aware CSS wink; no animation dependency added.
History and diagram review are visible in the secondary document toolbar, including
mobile. Logo menu omits session status and redundant command access. The command
palette exposes seven core actions and no heading jump list. Supporting Privacy,
About and Feedback use shared dialogs. Feedback is a local draft/copy interface
until an endpoint is supplied, never a fake successful submission. Existing
recovery, exports, document styling, home and scoped Inter wordmark remain.

## D012 — accepted mobile reading refinement · 2026-11-15

Owner: user. Tools replaces mobile ellipsis; appearance is directly visible.
Mobile heading collapse is removed, with 12px paper padding. Desktop disclosure
remains. Smaller title at rest (14px) uses 16px editing to preserve iOS behavior;
compact accessible Export reserves title space. Shared CSS shimmer, with reduced
motion, adds no runtime dependency. Support content uses the established body role
and native fields with a complete focus outline. Privacy/About dedicated URLs are
recommended pending owner copy; feedback collection service is research only.
See docs/qa/mobile-reading-refinement.md. D011 direct exports/history remain.


## D013 — accepted appearance and comparison update · 2026-11-17

Owner: user. Add an absolute-black app appearance alongside the existing cream
and dark-green appearances. This supersedes D008/D010's two-state appearance
control, not the existing font/sidebar identity or document/export themes.
Use a compact named-choice control, retain device appearance as the initial
fallback, persist explicit choice and keep print/document styling independent.

The user also requested visible synchronized comparison scrolling. JSON links
corresponding fields by default and permits independent scrolling; raw source
order and strings remain intact. Text Compare retains native CodeMirror Merge
scrolling. Additional payload/cURL ideas are research recommendations, not an
approval to silently repair JSON, guess identities, execute requests or persist
payloads. See [research and next priorities](../research/payload-comparison-direction.md)
and [verification](../qa/comparison-tools.md).
