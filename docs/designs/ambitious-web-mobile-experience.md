# md.to.docs: a document studio worth borrowing ideas from

Status: proposed web/mobile UX plan, not implementation approval.
Baseline: v3 at `809a445`. User constraints recorded 2026-11-07.
Target: existing React web app on desktop, tablet, and phones. No native app is implied.

## The direction

Make the path from a rough idea to a document someone is proud to send feel
remarkably considered. The document leads. The interface notices the next useful
action, offers it in context, and gets out of the way when it is not needed.

The ambition is visible in three moments: finding and fixing the exact thing that
will break in the destination; moving between Markdown and the rendered document
without losing one's place; and finishing with an honest, useful handoff. Cream
and the current typography are the identity, not problems to solve.

This is an interaction and capability expansion inside the established identity.
It is not permission to rebrand the product or replace its fonts.

## Non-negotiable identity contract

1. Preserve the current cream palette exactly. Desktop `surface` / `background`
   is `#faf9f6`; mobile currently uses `#fafaf7`. Preserve both incumbent values
   during extraction; do not merge near-matching values by eye. Existing white
   paper, warm surface layers, neutral borders, and green mobile action treatment
   remain recognizable. New cream states reuse existing palette roles.
2. Preserve current cream typography: font families, fallback order, font files,
   weights, italics, sizes, line heights, tracking, and the roles they occupy.
   Changes to composition must not become a covert typography refresh. New
   controls inherit existing role styles. Any demonstrated accessibility conflict
   is brought back with a precise example rather than silently changing the lock.
3. Existing fonts include Newsreader for editorial/reading roles, JetBrains Mono
   for source and selected labels, and the existing Söhne/system stack for UI roles.
   The frontend display, preview, and exported document do not all use the same
   font configuration today. Preserve each; do not replace them with one new face.
4. Add a complete, optional dark app appearance. It must not change document
   theme, source, export options, or generated content. Cream stays the default.
5. Ambition comes from composition, wayfinding, intelligent context, error
   recovery, and craft. No replacement fonts, neon gradients, decorative terminals,
   fake confidence scores, invented testimonials, or compulsory onboarding.

Evidence: `cream-identity-baseline.json`, `apps/web/tailwind.config.js`,
`apps/web/src/index.css`, `apps/web/index.html`, and compiler theme files.
The baseline hashes identify the original source; they do not freeze every line
of these files. Later checks must compare the actual protected role values.

## What is true today

| Evidence | Implication for the plan |
| --- | --- |
| Desktop editor, dominant document preview, sidebar, inspector, command palette | Evolve existing surfaces rather than create a parallel application |
| v3 mobile shell, native sheets, keyboard handling, paste/import recovery | Preserve this foundation; improve its decisions and contextual depth |
| Compiler diagnostics have optional nodeId and source position; rescue rules often identify lines | There is a foundation for linked review, but stable cross-view anchors are not complete |
| Planner transforms depend on destination | Compare source with target projection; never promise pixel-identical results in another app |
| Current export helper compiles fresh source; mobile hook invalidates prepared artifacts | Extend one shared export controller to desktop rather than reintroduce stale preview exports |
| Existing `themeId` chooses a document theme; dark document theme includes Inter | This is not app dark mode; do not reuse it as the appearance toggle |
| Six recent documents persist in browser storage; storage failure is visible | Do not describe the library as durable cloud storage or quietly increase retention promises |
| PDF uses browser print; Google Docs uses rich clipboard | Use truthful actions and retain file/print fallback paths |
| Prior design docs favor quiet contextual capability | Carry the principle forward; the user's current request supersedes historical prohibitions on ambitious UX expansion and optional dark mode |

The last implementation recorded 24 Chromium browser tests, 146 validation tests,
and 20 fidelity checks. Those are prior evidence, not new results for this plan.
No audience analytics, customer interviews, physical-phone validation, or
independent cross-model review was acquired for this planning session.

## Product framing and alternatives

Recommended primary job: **AI output → a document you are proud to send**.
This follows existing product docs and the user's direction; audience frequency
and commercial demand remain hypotheses. An optional priority question was sent;
no unanswered question is treated as approval of a new standing product default.

| Approach | What it gives us | Cost / downside | Recommendation |
| --- | --- | --- | --- |
| A. Precision pass | Dark appearance, cleaner controls, consistent sheets and completion states | Smallest scope, but much of the useful intelligence stays buried | Use as the first deliverable, not the entire ambition |
| B. Context-aware document studio | Linked source/preview, contextual fixes, destination-aware review, dependable delivery | Requires stable source mapping and a shared controller | Recommended target; build through independently useful slices |
| C. Full publishing workspace | Cloud library, collaboration, AI coauthoring, cross-device projects | Backend, identity, pricing/privacy decisions; slower core flow | Defer; preserve an extension seam, not an empty navigation tab |

Premises challenged:

- More visible tools do not demonstrate more intelligence. Relevance does.
- A beautiful preview is not proof that the receiving app preserved formatting.
- Dark app appearance and a dark exported document are different user choices.
- Phone users can need deep tools, but they should open in context rather than
  occupy the input screen. Desktop should also have a fast, quiet conversion path.
- “For vibe coders” means respect for momentum and artifacts worth sharing; it
  does not require a fake terminal, AI chat sidebar, or a developer-only interface.

## The signature experiences

### 1. Follow the problem, not the panel

A wide table gets one quiet marker beside that table, not a wall of unrelated
warnings. Selecting the marker reveals the affected destination, the exact
consequence, and the viable action. “Show source” selects the relevant Markdown;
“Show result” returns to the corresponding rendered block.

Example, proposed: “This table is too wide for Google Docs. Review the list
version, or keep the table in a Word file.” Do not offer landscape/fitting as a
working action until the renderer and destination really support it.

Fixes show before/after changes, preserve a recoverable version, and offer Undo.
If source anchors are stale, re-resolve or say the document changed. Never jump
to an approximate line or apply an old patch to new text. Batch fixes are optional
and list their exact edits; changing meaning is never an automatic cleanup.

### 2. The same place in three representations

Source, document, and destination review feel like views of one object.
Selecting a heading or diagnostic keeps that location while switching views.
An outline opens when a long document makes it useful; it never consumes a phone
screen merely because the document exists.

Desktop may offer opt-in linked scrolling, paused immediately by independent
scrolling. Selection and explicit “show corresponding block” come first because
continuous synchronization can fight the reader. No keyboard focus stealing.
On mobile, the view switch preserves caret, section, and scroll position.

### 3. Finish with confidence, not a toast

A compact delivery panel answers: “What am I getting, what changed, and where do
I put it?” It names the file or clipboard action, shows only actual adaptations,
and preserves a ready artifact for retry. “Copied” is a clipboard fact;
“Download started” is a browser fact. Neither means the document arrived in Docs.

A local export record can show source revision, destination, filename, and time.
Call it “Last prepared” or “Recent exports”, not a delivery receipt. It is not
stored remotely, and an expired artifact offers Regenerate rather than a broken
link. No export history content enters analytics.

### 4. One source, a considered handoff kit (later expansion)

A developer finishes a technical proposal and needs a Word file for a client,
a self-contained HTML copy for a reviewer, and perhaps the original Markdown
for a teammate. A saved delivery recipe prepares those artifacts from the same
immutable source revision. It does not ask them to repeat the conversion ritual.

Keep this in Delivery's advanced menu. The ordinary primary action stays fast.
Source inclusion is an explicit choice, never a default hidden inside a bundle.
Each target reports its own readiness; partial failure keeps successful files
available and names what needs retry. A ZIP, if offered, contains only the files
the user selected and a factual manifest of generated outputs, not a claim of
external delivery. No cloud service or AI provider is needed for this experience.

This is the later creative expansion I would try first after linked review:
make one good piece of thinking ready for several audiences without rewriting it.
It requires a separately reviewed multi-target artifact lifecycle and declared
production ZIP dependency; do not lean on a test-only transitive dependency.

## Ask the user's next question at every state

These are design hypotheses to validate in usability sessions, not invented
quotes from research participants.

| Moment | What the person is likely to need | Interface response | What stays out of the way |
| --- | --- | --- | --- |
| First arrival | “Where do I put my text?” | Immediate editable input, paste, file, useful example | Library expansion, tutorial, login |
| Returning | “Can I carry on?” | Restore local draft and last explicit destination | Welcome tour and repeated help |
| Paste received | “Did it work?” | Immediate text retention and honest preparation state | Animated fake progress steps |
| AI response wrapped in one code fence | “Why is everything code?” | Offer a diff-backed unwrap when the structure is unambiguous | Silent rewriting or removing caveats |
| Short ordinary document | “Can I send this now?” | Quiet Ready state and primary action | A forced review checklist |
| Long technical document | “Where am I?” | Optional outline and section-aware navigation | Persistent document statistics |
| A table/diagram needs attention | “Will this survive?” | One local issue marker with consequence and options | Technical parser language |
| A safe fix is available | “What will you change?” | Preview exact patch, apply, undo | Unexplained Fix all |
| Destination changes | “What will look different?” | Summarize actual target adaptations, preserve source | Marketing capability grids |
| Choosing style | “Will this suit my reader?” | Small live specimen using existing presets | A template gallery blocking input |
| Phone keyboard opens | “Can I keep writing?” | Full input space, reachable Preview/Done | Large export area and extra toolbars |
| Preparing a large artifact | “Is it still working?” | Real stage/cancel when available; input remains safe | Fake percentage progress |
| Clipboard is denied | “How else can I move it?” | Native paste/copy guidance and Word-file path | Generic red toast |
| Sharing is canceled | “Have I lost the file?” | Keep it ready; offer Share again or Download | Automatic fallback download |
| Storage is full | “Is my work saved?” | Explicit unsaved state, keep tab usable, export/backup action | False Saved label |
| Handoff initiated | “What now?” | Destination-specific next step | Claims about another app we cannot verify |
| User comes back tomorrow | “Which version did I send?” | Local revision/export metadata with clear retention policy | Implication of cloud history |

## Desktop composition

Default: compact masthead, a flexible source pane, and a dominant document.
The document library is closed or narrow according to the user's explicit
preference. Destination and primary action stay in a predictable location.

- **Compose:** Source + document; optional outline. A focus control collapses
  secondary chrome while leaving document name, destination, and export reachable.
- **Review:** Document leads; contextual issues and source links open on demand.
  “Needs attention” navigation steps through actual unresolved issues.
- **Delivery:** A temporary side panel or popover, not a new full-screen wizard.
  It shows current output choices and known adaptations, then gets out of the way.

These are optional view arrangements. A small, valid document can go straight
from paste to export without visiting three compulsory stages.

Object tools should share a single action vocabulary. A table need not show
Excel, CSV, TSV, Markdown, and layout controls on every render. Show the likely
primary action and an accessible More menu; reveal on keyboard focus and touch,
not hover alone. Diagrams retain accessible expand/inspect and explicit failure
recovery. Inspector remains the home for depth, not the default work surface.

Command palette: keep local, deterministic commands for actions, destinations,
headings, and documents. Rank context-relevant actions without hiding the complete
searchable list. Include commands for appearance and view arrangements. No AI
service is needed to make command discovery excellent.

## Mobile and tablet composition

Build on v3 rather than restarting:

- Keep one full-width Edit or Preview pane, a compact header, native sheets, and
  the bottom destination/action area when the keyboard is closed.
- Add section-aware Edit/Preview switching and optional outline in a sheet.
- A formatting note opens at the affected object. Its source action selects the
  source range and opens Edit; returning restores the object in Preview.
- Keep one useful next action. Advanced controls live with the selected object,
  and sheets use existing destination/options patterns rather than inventing tabs.
- Larger phones and tablets do not automatically become desktop. Preserve the
  current 1024px boundary until measured layouts justify a different threshold.
- Use hardware keyboard navigation without assuming that focus means the soft
  keyboard is open. Keep orientation, browser chrome, safe area, and app-return
  behavior in the real-device acceptance matrix.
- Preserve text if the user opens a file picker, cancels sharing, changes view,
  loses storage access, or navigates between documents. Never use an invisible
  hover-only interaction as the only way to inspect or fix an object.

Mobile depth should feel like taking a useful tool out of a drawer, not opening
a smaller control room.

## Dark appearance, without touching cream

Introduce `appAppearance: 'cream' | 'dark' | 'system'`, separate from current
`themeId` (document style), destination, and export configuration.
Existing and new users start in Cream unless they explicitly choose Dark/System.
System listens for OS changes only while selected. The explicit setting persists.
Apply it before paint, with a safe fallback when storage is unavailable.

Map app colors through semantic variables while leaving every cream value
unchanged. Preserve current font configuration for dark too, as the recommended
identity-consistent choice. There is no reason to use the existing dark document
theme's Inter stack for the app shell.

Proposed dark roles, subject to contrast and rendered review:

| Role | Candidate | Purpose |
| --- | --- | --- |
| App ground | #141614 | A warm dark field, not blue-black |
| Main surface | #1b1e1b | Editor and sheet separation |
| Raised surface | #252923 | Hover/open controls |
| Main text | #e7e7dd | Warm readable foreground |
| Secondary text | #b4b8ac | Supporting labels with actual contrast checks |
| Border | #46503f | Structural separation |
| Selected/primary accent | #bdc8a5 | A light relative of the incumbent green |

These are proposal values, not new cream tokens and not verified contrast claims.
Audit hover, focus, pressed, selected, disabled, loading, error, success, and
warning states. Avoid arbitrary inversion, glow, glass, and new gradients.

The document page remains its selected output style, normally light paper, in a
dark shell. If a reading-only dimmed page is later added, label it as a screen
preference and keep it out of print/export. Existing user-selected dark document
styles remain possible as a separate output decision.

All overlays, native dialogs, inputs, selections, scroll areas, code toolbars,
empty states, error messages, icon contrast, and browser color-scheme need themed
coverage. Test dark mode with a light document, and cream UI with an explicitly
dark document. App appearance must never invalidate a ready export artifact.

## Craft that earns its place

- Preserve the exact cream font roles. Improve surrounding alignment, grouping,
  spacing, pane balance, and ordering instead of adjusting the font to fix layout.
- Use a consistent existing icon language. Every icon-only action has an
  accessible name and a real touch target; arrows are not a substitute for labels.
- Motion follows a cause: selected block → its source, patch → preview update,
  sheet → retained context. Usually 120–180ms, never a prerequisite to acting;
  reduced motion is immediate. No page-load choreography or celebration confetti.
- Reserve layout space for status so “Ready” and “Preparing” do not shift the
  document. Announce meaningful transitions once, not every keystroke.
- Name outputs sensibly, retain explicit filenames, explain collision behavior,
  and distinguish saved draft, prepared file, download started, and unsaved input.
- Teach one shortcut at a relevant moment, with a dismissal that sticks. Preserve
  native browser shortcuts and never steal writing shortcuts inside inputs.
- Use examples as honest working specimens. A technical proposal demonstrates a
  diagram, table, code fence, and a destination adaptation with actual functionality.
  No decorative feature dashboard pretending to be a document.

## Technical plan

Keep one source of truth for content and one source-based export pipeline.

```text
Document + revision + document options
             |
             +--> parse / resolve assets --> immutable source model
             |                                  |
             |                                  +--> target projection
             |                                         |
             +--> source-range / block anchors --------+--> preview + notes
             |
             +--> export preparation --> ready artifact keyed by revision/options

App appearance + view preference --> shell presentation only
```

### A. Identity and appearance

- Extract existing cream colors into semantic variables with exact value parity.
  Do not rename/reduce type roles or rewrite typography while doing this.
- Add app appearance state, pre-paint initialization, persisted preference, and
  scoped root styling. Avoid a blanket `.dark` cascade that unintentionally
  changes document rendering or exported HTML.
- Keep document options and UI preferences separate in storage and artifact keys.
  Preserve old document-theme choices on migration.

### B. Context and anchors

- Build a revision-scoped block index from the actual parser AST. Keep source
  ranges and mappings through planner transformations, not random diagnostic IDs.
- Start with headings and diagnostic-linked blocks. Expand to full selection
  mapping only once anchor correctness is demonstrated on real fixtures.
- Store view anchors transiently by document and view. Ignore obsolete results
  and respect independent scrolling. Long-document outlines should not require
  rendering every block twice.
- Each fix declares a valid source revision, exact patch range, rationale, and
  inverse/backup strategy. Revalidate before apply; group undo as one action.

### C. Shared review and delivery

- Extend `useDocumentExport` / export helpers into a shared controller consumed
  by desktop Header/CommandPalette and mobile export bar.
- Model idle, preparing, ready, delivering, canceled, failed, and handoff-initiated
  explicitly. Keep “external completion unknown” rather than inventing a receipt.
- Capture immutable source and document options; never reuse a target-mutated
  preview AST as pristine source. Abort or ignore obsolete preparation.
- Keep preview-based adaptation messages tied to the same revision and target
  as the ready artifact. If they differ, refresh before presenting readiness.

Print/PDF needs a dedicated branch, because `window.print()` is not a file
artifact and an ordinary preview DOM may be behind the current edit. Prepare an
isolated, controller-owned print snapshot from the requested source revision,
PDF projection, and document options. Keep its styles independent of app
appearance. Wait for the matching rendered snapshot, resolved diagrams/images,
and required font/image readiness before allowing the deliberate Print action.
A fixed number of animation frames is not a readiness guarantee.

If source, document, destination, or document options change before Print is
invoked, invalidate the snapshot and do not print it. Restart for the latest
explicit request or show Prepare again; never silently print stale content.
Render/asset failure leaves input intact and offers retry. Retry re-renders the
current request rather than retaining an older print snapshot. Retain a prepared
snapshot only while its revision/options still match. The lifecycle's ready value
is a print snapshot, not a downloadable PDF; invoke native print from an explicit
user action after it is ready. Label the observed event Print requested / external
completion unknown, and do not count a saved PDF or imply the browser completed it.

### D. Storage and performance

- Keep app appearance independent from document restoration. Store no document
  text, titles, filenames, or issue text in analytics.
- Replace silent retention eviction with an explicit local policy and exportable
  backup. Larger durable history belongs in a later IndexedDB change with a
  migration, quota recovery, and rollback plan, not in the theme patch.
- Profile representative short, long, table-heavy, and diagram-heavy documents.
  Lazy-load expensive optional tools where safe. Introduce workers only when a
  measured main-thread bottleneck warrants them; preserve current-source checks.
- Reduced-motion, storage-disabled, offline/failed image, and clipboard-denied
  paths are normal product states, not a final polish checklist.

## Delivery sequence

Each slice needs a useful standalone result and its own review evidence.
Estimates are relative effort, not a promise about an agent's wall-clock time.

| Slice | Scope and main files | Dependency / exit criterion | Effort |
| --- | --- | --- | --- |
| 0. Preserve identity | Baseline extractor, cream role snapshots, existing CSS/Tailwind/preview captures | Exact protected palette/typography values recorded; nothing in app changes | S |
| 1. Appearance | App.tsx, store preferences, index.css, native sheets, editor/toolbars | Cream remains exact; dark app is complete; output semantics/exports unchanged | M |
| 2. Workspace clarity | Header, Workspace, sidebar, command palette, mobile sheets | One primary action; no duplicate controls; focus and document context retained | M |
| 3. Linked document review | Parser/diagnostic mapping, DocumentPreview, Inspector/Rescue, new block-index helper | Every tested marker navigates to the correct revision/range; fixes preview and undo safely | L |
| 4. Delivery finish | Shared export controller, Header/CommandPalette, MobileExportBar, target notes | Same fresh-source behavior across devices; truthful copy/download/print/share outcomes | M/L |
| 5. Long-form craft | Outline, view anchors, object tools, meaningful motion, working examples | Large documents stay operable; all core actions have keyboard/touch equivalents | M/L |
| 6. Durable workflows, optional | Local export records, saved delivery recipes/handoff kits, explicit retention/backup | No new account gate; storage limits and recovery tested; keep migration separately reversible | L |

Start with Slice 0 + Slice 1, then prove one complete signature journey in Slice 3
(a wide table from warning → source → exact fix/alternative → fresh export)
before expanding the same pattern to every object. Slice 2 can land independently.
Slice 4 must precede claims of parity between desktop and mobile delivery.

## Component and responsibility map

| Area | Reuse / change |
| --- | --- |
| App and store | Separate appearance from document style; retain content restoration |
| Header / WorkspaceSidebar | Consistent desktop hierarchy and optional library |
| MobileWorkspace / MobileWorkspaceSheets / WorkspaceSheet | Retain native focus behavior and mobile edit/preview foundation |
| DocumentPreview | Revision-aware object anchors and markers; preserve cream type and paper |
| DocumentInspector / DocumentRescuePanel | Connect existing depth to the selected object; share exact patch semantics |
| CommandPalette | Context-aware deterministic discovery and appearance actions |
| exportHelpers / useDocumentExport / MobileExportBar | One current-source artifact lifecycle for both shells |
| compiler parser/planner/diagnostics | Range and transformation mapping, not a second conversion engine |
| tests/browser + validation + fidelity-lab | Add identity/appearance/anchor/undo/desktop-mobile delivery regressions |

Do not introduce a new editor framework, component suite, state library, cloud
backend, or AI provider simply to realize this composition. Reconsider a targeted
dependency only with a demonstrated capability gap and a migration cost.

## Failure and recovery contract

| Failure | User-visible behavior | Implementation obligation |
| --- | --- | --- |
| Stale marker/patch | “This document changed. Review the latest version.” | Revision guard; no approximate edit |
| Unresolvable target transformation | Preserve source; show exact limitation and viable alternative | No dropped nodes or fabricated guarantee |
| Asset/render error | Show useful fallback and retry at that object | Abort/ignore old work; retain input |
| Clipboard denied/unsupported | Explain native route; offer an actual file | No success toast before API resolution |
| Share canceled | Keep prepared file ready | No automatic download or error escalation |
| Storage unavailable/full | Explicit unsaved message and backup path | Editing/export remain usable |
| OS theme changes in System | Update shell only without stealing focus | No content/theme mutation; no export invalidation |
| Source/target changes during preparation | Invalidate old artifact and prepare the current request | No stale file or adaptation summary |
| Partial history migration | Preserve original store and offer recovery | Never delete old data before verified migration |
| Long document over budget | Retain original input and explain usable limits | No silent truncation; measure before increasing limits |

## Validation and evidence

### Identity protection

Record computed font family, fallback declaration, size, weight, style, tracking,
and line-height for existing cream roles on representative screens. Compare
protected role values, not whole-file hashes or a screenshot with all meaningful
regions masked. Verify that existing font imports and actual role use remain.
Screenshot comparisons use controlled font loading and platform-specific baselines.

### Appearance and output isolation

Exercise Cream/Dark/System, reload, OS changes, first paint, storage denial,
portaled/native sheets, code/diagram controls, empty/error states, and focus rings.
Compare normalized DOCX content/styles and exported HTML document configuration
before/after app appearance changes. Do not compare raw ZIP bytes with variable
metadata. A ready artifact stays ready across UI-only appearance changes.

### Behavior

Test valid/stale source anchors; headings with duplicate text; list/table nesting;
transformed blocks; undo/redo; simultaneous compilation and navigation; document
switch during preparation; keyboard focus restoration; long filenames; clipboard
and file-share failures; print media; and retained context across device breakpoints.

For Print/PDF, deterministically delay compilation, fonts, and asset readiness;
edit or switch documents, request Print, and assert no old preview is printed.
Verify the eventual print snapshot contains the matching current revision and
PDF projection before print is invoked, that one gesture produces at most one
invocation, and that failure/retry regenerates the current request without
inventing a downloadable PDF or a completed external save.
Keep the existing regression suites. CI must exercise desktop and compact layouts.

### Devices and performance

Test 320–430px phones, short landscape viewports, tablets, 1024px, and wide desktop;
keyboard navigation, 200% zoom, reduced motion, high contrast, and screen readers.
Use physical iPhone Safari and Android Chrome for clipboard/app handoff, virtual
keyboard, file picker, native share, rotation, and print. Headless Chromium is not
physical-device evidence; the workspace's earlier WebKit launch was blocked by
missing Linux libraries and must not be counted as Safari coverage.

Measure input responsiveness, time to preview, preparation latency, error recovery,
and completed user tasks on representative devices. Proposed budgets are immediate
input feedback, no unresponsive main-thread spans during normal typing, and progress
visible by the next paint; set numerical gates after a measured baseline.
No invented “zero latency”, “100% preserved”, or universal under-N-second claim.

A future usability pass should watch people complete three concrete journeys:
quick AI paste → Word; long technical proposal → inspect an adaptation → export;
phone import → denied clipboard → file fallback. Record hesitations, errors, and
successful handoffs rather than preference ratings alone.

## Scope boundaries

Not part of this plan's first implementation: mandatory sign-in, team spaces,
collaborative editing, direct Google Docs creation, a native app, an AI chat
sidebar, a publishing CMS, server PDF promises, universal cross-device sync,
a giant template marketplace, or a redesign of the cream palette/type.

These are product choices, not missing decorative features. Optional larger
workflows need separate evidence and architecture decisions.

## Tooling, provenance, and decisions still open

- gstack source is pinned in the repo at `6cf00aee9c0fdedc722f35c1f0032c3db9404104`.
  Its office-hours launcher was executed; this plan applies premise challenge,
  alternatives, reuse, and failure-mode thinking. Formal interactive approval
  gates have not been completed; this is a draft, not an approved /autoplan report.
- Impeccable was read at `687bc381bc9091bf252c0a05303640561014a425`.
  Its context engine ran against App.tsx with telemetry disabled. Shape, Operate,
  Read, and established-world guidance inform the plan. Its context loader found
  no PRODUCT.md or DESIGN.md; this is an authority-documentation gap, not license
  to replace the established visual identity.
- No Impeccable hooks, live-edit server, provider integration, or auto-rewrite
  configuration was installed into this repo. No app files changed in this task.
- User-stated cream/type constraints override generic font/palette novelty advice
  from either tool. Historical docs discouraging dark mode are superseded only
  for the explicitly requested optional app dark appearance.
- Approval of the recommended studio direction, exact dark shades, extent of
  persistent local history, and numerical performance budgets remains open.
  These proposals are not silently written as standing product configuration.

Next concrete implementation: capture cream role baselines and build a reversible
app-appearance slice. Then demonstrate the single linked-table journey with the
same real sample document on desktop and a phone before broadening its UI.

## The assignment for the first implementation

Build a reversible Cream/Dark/System appearance slice around the current editor,
preview, and one native sheet. Use the same technical proposal in both appearances
at 390px and 1440px. Demonstrate that every protected cream font/palette value is
unchanged and that switching appearance leaves the document and ready export
unchanged. Then prototype the single linked-table review journey before expanding
object coverage. This is a proposed next build, not authorization to ship it.

## Why this recommendation follows your brief

- You said “not at all touch current font”. The plan freezes existing cream
  typography and places the ambition in behavior and composition.
- You asked “what would a user want at this point”. The state-by-state matrix
  makes that question an acceptance criterion, including recovery and return visits.
- You want work that “inspires other good vibe coders”. The signature moves are
  demonstrable interactions on a real technical document, rather than a new palette
  or a decorative landing page.

<!-- gstack:office-hours:concerns:start -->
## Reviewer Concerns

Disposition: COMPLETED

Stop: PASS

No unresolved findings.
<!-- gstack:office-hours:concerns:end -->
