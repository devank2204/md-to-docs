# Current workstate

Updated: 2026-11-07. Branch: v3.

## Current implementation

The latest user request authorizes starting the ambitious UX implementation.
See [implementation and evidence](designs/studio-implementation.md) for concrete
behavior, reproduction commands and remaining scope.

- Shared current-source preparation/delivery on desktop and mobile, including
  command and reading-view entry points, cancellation and recoverable failures.
- Isolated PDF print snapshot with resource readiness and explicit print gesture.
- Optional Cream/Dark/System app appearance, independent of document styling.
- Source-linked formatting review, object markers, outline, proposed rescue
  changes, backups and guarded undo; exact duplicate/nested source selection.
- Independent abortable image requests prevent preview cancellation from
  canceling another export. Desktop check status is source-revision-bound.
- Cream palette and existing typography are protected. Home and desktop control
  typography have browser assertions; appearance does not invalidate artifacts.

## Executed verification

Final full build/prerender passed. All 35 Chromium browser scenarios passed;
149 validation tests across 28 files passed; all 20 fidelity fixtures passed.
Lint passed with pre-existing diagram/canvas warnings; no new warnings. Actual
cream/dark captures and control-bound measurements cover 390, 1024 and 1440px.
No page overflow or offscreen header controls were observed in those captures.
The broader browser layout scenarios cover 320, 360, 390, 430, 768, 1024 and 1440px.

New cancellation regression failed against the old shared abortable image cache
and passed after the fix. Earlier development failures were corrected (test
selectors, prerender build order, source-range return typing); they were not counted
as passing runs. Visual review caught an inherited desktop button font and restored
the existing 11px JetBrains Mono control role before the final typography check.

## Constraints and remaining evidence

DESIGN.md and the decision register remain authoritative. No future typography
change without explicit user instruction. Continuous source/preview scroll sync,
universal transformed-node mapping, handoff kits and large-document performance
research remain outside this completed foundation. Kits still require evidence
of repeated multi-format work.

Physical iPhone/Android, receiving-app paste and native print/save checks remain
pending. WebKit could not launch because Linux libraries were missing; Chromium
emulation is not Safari evidence. Automated print inspection/stubbing does not
prove a PDF was saved. No production or usability-study outcome is claimed.

## Git / continuity

50478c0 is the last verified pushed v3 revision (implementation and prior planning/
identity commits included). The current domain investigation has not been pushed.

## Active incident: office access to the custom domain

2026-11-07: investigated mdtodocs.com versus mdtodocs.netlify.app. Public DNS,
Netlify domain association, HTTP redirects and independent origin TLS passed;
SSL Labs rated apex A+ with trusted normal SNI certificate paths. Domain/category
filtering, office DNS and TLS inspection remain hypotheses pending the affected
browser's exact error. No production records, certificates or application config
were changed. No company IT or vendor message was sent.

See [investigation and repair decision](operations/domain-access-investigation.md)
and [public evidence snapshot](operations/domain-access-evidence.json). The incident
is not resolved until an affected company user can load and use the site. The next
necessary input is the office browser error/block category; local read-only DNS/
HTTP comparison commands and an unsent IT draft are in the investigation document.

## Mermaid repair and image actions — 2026-11-07

The user paused the office DNS incident and requested Mermaid compatibility
repair, copy-image and working diagram options. Implemented a local renderer-
validated review/apply/batch/undo assistant; exact source ranges and stale guards
protect document edits. Azure import normalization and conservative flowchart
repairs preserve valid syntax. Shared strict rendering/image actions cover
inline preview, Canvas and both utility routes. Existing typography and cream
palette remain protected.

See [implementation, research and test-gap report](qa/mermaid-repair-and-actions.md).
No new AI provider or dependency. No production DNS change. No push authorized
in this prompt; completion is local to v3 until a subsequent explicit push.

Final source commit `901403e`: build/prerender and lint passed (existing warnings),
49 Chromium browser scenarios, 166 validation tests and 20 fidelity fixtures passed.
Pinned gstack manual review found two additional layout defects; native regressions
verify their fixes. Its formal manual pass remains inconclusive after two client
timeouts; see the report for evidence and physical-device/paste limitations.

## Document actions and compact mobile layout — 2026-11-08

The user's feedback work was restarted on their newly pushed `d534754` (including
`901403e` Mermaid repair/image improvements). Local changes were rebased and
conflicts resolved around the updated diagram implementation; no repair, renderer
or shared image-action code was replaced with the older version.

Implemented one Export entry with a desktop anchored panel/mobile sheet, secondary
exact-source Markdown download, import after New document, recoverable Clear all,
a 52px mobile document header, reduced preview/heading/diagram spacing and no
persistent mobile export footer. Page layout is under Document options. Diagram
options now use the existing native sheet on mobile and preserve the current
portalled popup on desktop. Narrow desktop editor/table toolbars wrap whole
controls so Import/Clear all remain reachable. Existing cream and typography
assertions are preserved.

See [implementation and bounded evaluation](qa/document-actions-and-mobile-layout.md).
Build and prerender passed. All 166 validation tests across 29 files passed on
the integrated implementation. Lint passed with existing warnings. All 59 Chromium browser scenarios passed
(1.4m), including the new narrow-editor bounds regression and all latest Mermaid
image/repair scenarios. No physical-device, Safari,
receiving-app or production deployment claim. No push was requested or performed.
