# Mobile conversion workspace: implementation plan

Status: proposed implementation contract; product code has not been changed.
Baseline: v3, after the CI/runtime fixes. Prepared 2026-11-07.
Method: gstack digest, design principles, product/engineering challenge, and
repository source inspection. Formal autoplan, outside review, live browser
diagnosis, visual mockups, and device QA have not been performed.

## 1. Product decision

Primary hypothesis: a phone visitor brings existing Markdown from an AI chat,
notes, or a file, checks it, and sends a usable document onward. Optimize that
journey before long-form authoring or document management. The screenshot is
evidence of a usability failure, not evidence of market demand or user frequency.

Success means a first-time visitor can paste, preview, and initiate a useful
export without opening settings. Claiming that a document reached another app
requires actual handoff evidence; a successful browser API call is insufficient.

Reuse the compiler, renderers, asset pipeline, Zustand document persistence,
destination model, themes, and desktop workspace. Build a mobile shell over those
capabilities. Do not introduce a second compiler, document store, or UI framework.

### Scope

- Full-width input and preview, compact header, destination sheet, bottom action.
- Paste/file import with visible recovery paths.
- Accessible document/options sheets, mobile reading preview, keyboard behavior.
- Reliable current-content export, clipboard/download/share result states.
- Route-aware defaults, document retention, behavioral regression coverage.

Deferred: Google account integration, direct Docs creation, server PDF rendering,
PWA installation/share-target registration, native apps, account sync, redesign
of the Mermaid studio, and a new design system. Existing mobile access to diagram
utilities must remain reachable, but those utilities need their own later audit.

## 2. Evidence and risks, in priority order

| Priority | Evidence | Decision / verification |
| --- | --- | --- |
| P0 | Screenshot leaves almost no width for the task; Header contains many controls | Reproduce at phone widths; inspect computed layout and deployed revision before naming the root cause |
| P0 | Workspace already has mobile tabs and Sidebar already has an overlay | Audit rendered breakpoint/CSS behavior; do not assume missing mobile classes explain production |
| P0 | store/index.ts defaults and persists isSidebarOpen | Separate transient mobile-sheet state from persisted desktop preference |
| P0 | Workspace compiles after 250ms; Header passes store compiledDoc to exportHelpers | Prevent export of stale content after edits, target changes, or document switches |
| P0 | App route initialization depends on markdown and calls setDestination | Apply route defaults at navigation/initialization, not every keystroke |
| P1 | EmptyState clipboard rejection only logs to console | Show recovery instructions and focusable native paste input |
| P1 | exportDocx uses document.docx and immediately revokes object URL | Use a safe meaningful filename and verify URL lifetime/download fallback |
| P1 | printPdf calls window.print | Label Print / Save as PDF; never report that a PDF file was saved |
| P1 | Preview uses minimum 1056px paper height; editor font token is 12px | Add reading layout; use 16px mobile input to avoid iOS focus zoom |
| P1 | analytics records export API success | Distinguish prepared, handoff initiated, canceled, failed, and actual unknown completion |

## 3. Screen and interaction contract

### Empty input

Compact brand/menu header, short task heading, editable Markdown input, Paste
text button, Choose .md/.markdown/.txt file, and a quieter Try an example link.
Keep file selection as a visible action rather than relying on drag/drop.
No autofocus or keyboard on initial arrival. No permanent library or rail.
No conversion score or claim of preservation before non-empty content is checked.

Clipboard permission denied/unavailable: show “Touch and hold in the text box,
then tap Paste”; focus the input without discarding content. File read errors
remain visible and retryable. Define a documented input-size limit after testing
representative phones; do not silently truncate. Reject unsupported files clearly.
Import into a non-empty document offers a new document or explicit replacement.
Avoid switching screens on the first character or remounting the focused input.

### Editing and preview

Header contains document title and menu. Below it: Edit / Preview tabs, one
full-width pane at a time. Both tabs have accessible names, selected state,
keyboard operation, and visible focus. Keep each pane's scroll/caret state.
Typing or pasting never unexpectedly selects Preview. An explicit Preview tap
ends text editing and displays the current compilation state.

Default preview is a readable full-width document, with optional Page layout.
Scope table/code horizontal scrolling to those blocks. Diagrams support an
accessible expand action. No page-level horizontal scrolling or clipped text.
Styles must distinguish reading layout from print/export geometry.

### Destination and action area

When the keyboard is closed, show a destination selector and one primary action.
Use the route's target on entry; otherwise remember the user's last choice.
Allow later explicit selection to survive edits. Disable export for whitespace
input and expose a meaningful preparing state while fresh assets are unresolved.

| Destination | Primary action | Fallback / truthful outcome |
| --- | --- | --- |
| Word | Prepare Word document, then Share or Download | Download when file sharing is unavailable; do not claim the receiving app opened it |
| Google Docs | Copy for Google Docs | Explain paste handoff; offer Word file import if rich paste fails |
| PDF | Print / Save as PDF | Browser-managed print flow; success of final save is unknown |
| HTML | Download HTML | Visible error and retry |
| Formatted text | Copy formatted text | Explicitly labelled plain-text option when rich clipboard is unsupported |

File preparation precedes a separate Share tap to retain user activation.
Call navigator.canShare with the actual File before offering file share.
Treat AbortError as cancellation, leave the file ready, and do not auto-download
on cancel. Keep the generated artifact available for retry until content/options
change. Clipboard writing must occur under valid user activation; if preparation
is needed, present Ready to copy and require the deliberate Copy tap.

Show a brief formatting summary after content is checked: “Ready to export” or
“2 formatting notes — Review”. Detailed diagnostics live in a sheet. Do not
equate a structural score with guaranteed formatting in another mobile app.

### Keyboard, viewport, and sheets

Use dynamic viewport units with fallback and safe-area padding. Avoid relying on
100vh for the phone workspace. Use CSS sizing first; use visualViewport only for
tested keyboard behavior that CSS cannot supply. Focus alone is not reliable
keyboard detection (hardware keyboards and browser chrome change the viewport).
Collapse the large action area during text entry; keep Preview/Done reachable.

Documents, destination, and options open as accessible sheets/dialogs: labelled
heading, close button, focus containment, inert background, Escape dismissal,
scroll containment, and focus restoration. Reuse one sheet primitive for mobile
entry points. Document selection closes the sheet. Desktop sidebar preference
must not auto-open a mobile sheet on hydration or resizing. Never auto-focus an
editing field when closing a sheet unless that field originally owned focus.

Reuse existing color, typeface, and spacing tokens. Provisional dimensions:
16px minimum input text, 44px minimum control hit area, 16px page inset, roughly
52–56px compact header. Final spacing and breakpoint follow visual checks.
Start with existing md (768px) boundaries; explicitly test cramped tablet widths
before deciding whether the mobile shell should extend to 1024px.

## 4. Engineering design and file map

- App.tsx: compose responsive shells; route initialization separated from edits;
  preserve one active document and avoid duplicate focusable mobile/desktop UI.
- Header.tsx: retain desktop controls; extract shared export orchestration so
  mobile buttons do not duplicate analytics, renderer, or success-count logic.
- Workspace.tsx: retain compilation pipeline; associate results with document ID,
  content revision, destination, theme/font settings, and signature configuration.
  Abort obsolete work and invalidate prepared artifacts on relevant changes.
- store/index.ts: retain documents and desktop sidebar preference; mobile tab,
  sheets, focus, and keyboard state remain transient. Handle existing persisted
  sessions without deleting documents or overwriting explicit preferences.
- EmptyState.tsx / DocumentEditor.tsx: shared import/paste handling, visible
  errors, input focus continuity, readable mobile text, non-destructive replace.
- DocumentPreview.tsx / StatusBar.tsx: reading layout and contextual mobile
  summary, with existing print behavior and desktop presentation preserved.
- utils/exportHelpers.ts + proposed shared useDocumentExport hook: prepare from
  a current source snapshot. Reuse compiledDoc only when its revision and target
  match; otherwise compile for the requested target from source. A Word export
  must not inherit irreversible Google Docs planner transformations.
- Proposed MobileHeader, MobileExportBar, DestinationSheet, and shared
  WorkspaceSheet: presentation and interaction only, no renderer logic.
- utils/analytics.ts: bounded viewport/input-method/result metadata; no content,
  filenames, document titles, clipboard payloads, or raw exception messages.

Export lifecycle: idle → preparing → ready → copying/sharing/downloading →
handoff initiated / copied / canceled / failed. Content or configuration changes
invalidate ready artifacts. Never deliver an old artifact as the latest document.
Show errors with retry; don't replace user input with an error screen.

## 5. Delivery slices

1. **Baseline and shell:** reproduce screenshot, capture desktop/phone baseline,
   confirm deployed revision, implement viewport sizing, full-width tabs, compact
   navigation, mobile drawer-state isolation. Exit: no global overflow at all
   target widths and keyboard does not hide editing controls.
2. **Input and reading:** native paste fallback, file import recovery, uninterrupted
   typing, preview scrolling, block overflow, empty/compiling/error states, sheet
   accessibility. Exit: first-time and returning-document journeys work.
3. **Delivery correctness:** current-revision compilation, shared orchestration,
   destination initialization fix, file preparation/share/download, clipboard
   recovery, print labelling. Exit: rapid edits and target switches export the
   expected content, and cancellation never masquerades as successful delivery.
4. **QA and rollout:** behavioral/browser tests, desktop regression, physical
   iOS/Android handoff checks, evidence bundle, measured rollout and follow-up.

Each slice should be independently reviewable. No production deployment is part
of this planning task. Browser evidence and physical-device handoff remain
release requirements, not tasks that an emulator screenshot can satisfy.

## 6. Verification matrix

Automate real interactions rather than tests that grep CSS/source strings.
Add a dedicated browser-test setup (Playwright if no existing equivalent) only
as part of implementation; retain the Vitest validation and fidelity suites.

| Area | Required cases / pass criterion |
| --- | --- |
| Layout | 320, 360, 390, 430, 768, 1024, 1440px; portrait/landscape; page scrollWidth ≤ clientWidth; controls remain reachable |
| Entry | empty first visit, direct destination URL, existing persisted session, imported file, denied clipboard, blank input |
| Editing | multiline paste, first-character focus continuity, long text, emoji, undo, caret/scroll on tab switches, app switch/return |
| Navigation | desktop sidebar persisted open → phone; rotate/resize; document switch; browser back and route defaults |
| Export | immediate edit→export, document/target/theme switch during preparation, API unavailable/rejected, double tap, share cancel, repeated retry |
| Content | headings, nested lists, long tables/code, math, valid/invalid Mermaid, missing/failed images |
| Accessibility | keyboard, focus restoration/trap, screen-reader tab/dialog labels, live status, 44px targets, contrast, 200% text zoom, reduced motion |
| Desktop | split panes, documents, shortcuts, themes, inspector, DOCX/HTML/clipboard and print remain functional |

Use deterministic deferred compilation in a regression test: edit A to B while
A is compiled, export immediately, and inspect output for B. Also verify
changing destination once is not undone by the next keystroke.

Run `pnpm install --frozen-lockfile`, `pnpm build`, validation tests, fidelity
tests, web lint, and the added browser suite. Browser tests require built and
prerendered pages where applicable. Test both supported CI OS jobs.

Physical devices: Safari on iPhone and Chrome on Android, using a real copied AI
answer, native paste menu, soft keyboard, file picker, downloads/share sheet,
Google Docs app paste/import, and print flow. Record OS/browser/receiving-app
versions, outcome and known formatting limits. Emulated WebKit is supplemental.

## 7. Measurement and open decisions

Instrument the funnel input received → preview opened → export prepared →
copy/handoff initiated, segmented by coarse viewport and destination. Compare
failure/cancel rates and time to first export. Do not infer abandonment from
app switching or assert receipt from a download click. Check telemetry endpoint
configuration first; existing local events do not establish collected analytics.
Set numerical improvement targets after a baseline, not invented percentages.

Open before implementation: verify the production layout root cause; validate
the exact mobile Google Docs paste/import behavior; produce visual mockups for
empty/edit/preview/destination/error/keyboard states; choose final breakpoint
from measured layouts; establish a tested input-size budget.

Release evidence: before/after phone screenshots, keyboard recording, automated
check results, actual device handoff matrix, documented remaining limitations,
and a reversible deployment plan. Until these exist, describe the design as
proposed and the relevant device/browser behavior as unverified.
