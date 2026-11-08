# Document actions and mobile layout

2026-11-08 · v3 · based on remote `d534754`.

## Scope and decisions

The feedback identifies repeated export choices, too much persistent mobile
chrome, missing import after New document, and the need to retrieve pasted
Markdown. The implementation keeps the cream identity and existing type roles.

- A single Export entry opens an anchored desktop panel or a mobile bottom sheet.
  Format selection lives there. The mobile destination chooser remains a sheet;
  desktop uses its native select. Preparation and explicit delivery still share
  the current-source export pipeline. Readiness is not an extra CTA.
- Download Markdown is secondary inside Export, available from Preview and Edit,
  and downloads the exact current source without compiling or reformatting it.
- Mobile has a 52px title/documents/options/export header and one Edit/Preview
  row. Keeping the mode row separate preserves touch targets at 320px. The
  document title row, preview metadata row and persistent export footer are gone.
  Page layout moves to Document options. Document heading margins and preview/
  diagram padding shrink; document font sizes and families remain unchanged.
- Import remains visible after creating a blank document. Desktop import creates
  a new document when there is existing content; mobile retains explicit new/
  replace choices and its snapshot backup. Both guard async document switches.
- Clear all text is available on both platforms and saves a version first.
- Diagram options use the existing native sheet on mobile and the updated
  portalled popup on desktop. The user's latest renderer, reviewed repair,
  image actions, source guards and toolbar geometry remain authoritative.

## Reference selection and bounded evaluation

Existing [reference research](../research/reference-repositories.md) supplied the
mechanisms: Impeccable's action hierarchy and context, React Aria's keyboard/
focus expectations, and Floating UI's viewport-bound popup behavior. The native
WorkspaceSheet already supplies modal semantics, safe areas, focus containment
and Escape. No dependency, design system or hook installation was needed.

| Hypothesis | Baseline | Change | Checks | Guardrails | Result |
| --- | --- | --- | --- | --- | --- |
| Put export behind one entry to recover reading space without losing output options | Three stacked persistent phone export controls and separate title/metadata rows | On-demand delivery, compact chrome, secondary Markdown download and retained import/clear actions | Browser layout, real downloads, exact source roundtrip, version restore, focus, freshness, clipboard/print recovery and latest Mermaid scenarios | Cream/fonts; source/version safety; renderer/image/repair behavior | Final execution results recorded in WORKSTATE.md |

Initial verification corrected a home-editor test selector, a native-sheet versus
outside-click handler conflict, and a detached-element style read. The latest
remote Mermaid code was fetched and the local changes rebased; older diagram
implementation was not retained over that update. A remaining review-sheet
transition was fixed so navigating to source does not reopen Export over it.

## Executed verification

Final production build/prerender passed; lint passed with existing warnings.
All 59 Chromium browser scenarios passed (1.4m), including 10 new document/action
checks plus the latest remote Mermaid suite. All 166 validation tests across 29
files passed. Viewports include 320, 360, 390, 430, 768, 1024 and 1440px.
Actual Markdown bytes, DOCX content, HTML, image signatures, clipboard PNG,
print snapshot isolation, guarded source changes, clear/version restore and
focus containment/return are covered. Fidelity fixtures were not rerun for this
UI-only change; no new renderer or export-format implementation was introduced.

The first validation attempt lacked prerender output and local-server permission;
it failed. After building/prerendering and running with server access the full
validation suite passed. Package-manager auto-install blocked the browser runner
once; starting the same built Vite preview directly resolved that setup issue.
The final checks use unchanged behavior assertions after adapting entry points
to the requested Export sheet. Identity assertion values were not relaxed.

## Captured layout evidence

Chromium snapshots of the long-title/table/code fixture:
[390px](../designs/evidence/document-actions/workspace-390.png) and
[1024px](../designs/evidence/document-actions/workspace-1024.png).
The 1024px check also measures Import, Clear all and Review button bounds within
the editor pane; page overflow alone would not have detected toolbar clipping.

## Evidence limits

Chromium viewport testing is not physical iPhone/Android or Safari evidence.
Print dialog inspection does not prove that a PDF was saved; downloaded files
and clipboard readback establish only the corresponding browser behavior.
No production deployment or push is part of this work.
