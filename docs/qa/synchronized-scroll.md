# Desktop synchronized scrolling

2026-11-08 · v3 · baseline `5b2c308`.

The user requested simultaneous Markdown/Preview scrolling. Previously the panes
scrolled independently; review actions could only jump to selected source blocks.

## Behavior

Two-way sync is enabled by default in the desktop split editor. The **Sync scroll**
button turns it off for independent reading and turns it back on from the current
source position. It does not edit Markdown, change document styles or make Preview
editable. Mobile tabs and standalone Reading View remain independent.

The existing preserved Markdown positions supply block anchors. A temporary,
hidden textarea-style mirror measures source positions with the real editor font,
width, padding and soft wrapping. The mirror uses the original Markdown so CRLF
positions remain valid even though textarea values normalize line endings. Between
anchors, scrolling interpolates through the corresponding block. Source/preview
scroll extents supply exact top/bottom endpoints. A block transformed without a
preserved position uses neighboring anchors; this is block alignment, not a
promise of exact line correspondence inside every transformed element.

Geometry refreshes after edits, document switches, resizing, fonts, diagram/image
completion, collapsed sections and preview zoom transitions. Mapping is cached
between layout changes, and scroll work is coalesced into animation frames. Target
scroll events are suppressed to avoid feedback; user input can take control from
either pane. Browser scroll anchoring is disabled only on the synchronized preview
and restored during cleanup. Observers/listeners are removed on disable/unmount.
No dependency or persisted storage schema was added.

## Bounded evaluation

| Hypothesis | Baseline | Change | Checks | Guardrails | Outcome |
| --- | --- | --- | --- | --- | --- |
| Block-position mapping keeps unequal source/preview layouts aligned in both directions | Independent panes, existing jump-only anchors | Scoped synchronization hook, offset metadata and an opt-out button | Real browser geometry through tables/diagrams, endpoints, native caret visibility for wrapped Unicode, resize/zoom, delayed images/collapse, document changes and CRLF imports | Source bytes, cream/type roles, exports and mobile/reading isolation | Execution results in WORKSTATE.md |

Initial tests caught drift at the end of the zoom animation. Rebuilding the map
on transition completion fixed it without weakening the geometry tolerance. A
reading-view test selector was corrected to account for its icon text. Existing
identity expectations remain unchanged. No direct preview editing was added.

Final production build/prerender passed. Lint passed with existing warnings only.
All 65 Chromium browser scenarios passed (1.5m), including six new geometry,
wrapping, lifecycle and CRLF cases. The full run also retained existing identity,
export freshness, real image/clipboard actions, reviewed fixes and mobile checks.
No core renderer or export implementation changed; validation/fidelity suites
were not rerun for this frontend scroll behavior.

Physical-device/Safari behavior and very large-document performance remain
unmeasured; browser checks use bounded synthetic documents.
