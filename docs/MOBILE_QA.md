# Mobile conversion implementation and verification

The compact workspace is selected below 1024px. Desktop keeps the studio layout
from 1024px upward; the crowded desktop title/command labels are reduced at
intermediate widths. This breakpoint was checked at 320, 360, 390, 430, 768
(landscape), 1024, and 1440px.

## Implemented

- Full-width Edit/Preview panels, persistent text/caret across tab switches,
  reading preview with optional page layout, scrollable table/code blocks.
- Compact document navigation and shared native modal sheets. Desktop sidebar
  preference does not open a mobile drawer. Keyboard focus is trapped and restored.
- Native input remains mounted through the first character. Paste permission
  denial focuses it with long-press instructions. Importing into existing content
  offers a new document or a replacement with a restorable backup.
- Markdown/text file extension and 1 MB import/paste limits, with visible errors
  and no truncation. The size limit is a conservative product guard tested with
  browser fixtures; physical-device performance at that limit is not certified.
- Destination defaults apply on route entry, not every edit. Root visits remember
  explicit choices, including HTML. Document name, style, size, signature, and
  versions are available in options.
- Safe-area and dynamic viewport sizing. Soft-keyboard detection uses actual
  viewport shrink plus input focus; hardware focus alone leaves export visible.
- Shared source-based export preparation. The preview tree is never reused for
  an export, avoiding stale text and destination-specific destructive transforms.
- Ready artifacts invalidate when source, document, destination, theme, title,
  font size, or signature changes. Copy/share has a deliberate second tap.
- File sharing is capability checked; cancellation keeps the ready file and never
  auto-downloads. Clipboard failure exposes Word-file/plain-Markdown alternatives.
- PDF remains the browser print/save flow. No completed-PDF-save claim or counter
  increment is made. File downloads use safe meaningful names and delayed URL cleanup.
- Full/disabled browser storage leaves editing and export usable and displays
  an explicit unsaved warning instead of claiming the draft was saved.
- Bounded delivery/preview analytics contain no document content or raw exceptions.
  The optional telemetry endpoint is not configured by this change.

## Reproduce automated verification

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @mdtodocs/validation test
pnpm --filter @mdtodocs/fidelity-lab test
pnpm --filter web lint
pnpm exec playwright install --with-deps chromium
pnpm test:browser
```

Playwright serves the built app on port 4173. Build first. For an existing system
Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. CI installs
Playwright's matching browser on Ubuntu and Windows and retains failure traces.

The source-freshness regression deliberately delays asset resolution and supplies
an older preview tree, then inspects the resulting DOCX XML for the new text.
Browser checks inspect downloaded DOCX content, not just a toast or button state.
Browser focus, import, route, cancellation, print-media, layout, and diagram tests
exercise the rendered app. The keyboard test simulates a VisualViewport resize;
it is not physical keyboard evidence.

Local visual evidence is generated under ignored `artifacts/mobile/`:
`before-390.png`, `empty-390.png`, `editor-390.png`, and `after-<width>.png`.
The baseline reproduced the open sidebar covering the workspace and clipped
header actions. It does not establish the deployed production commit.

## Review limits and release checklist

This work used the pinned gstack digest/reuse ladder and source review. A formal
`/autoplan`, outside-model review, or gstack-browser QA run is not claimed.
Playwright browser evidence is separate from gstack's installed workflows.

Before production rollout, record real-device results for:

- iPhone Safari and Android Chrome soft keyboard, rotation, browser chrome,
  screen-reader behavior, 200% text sizing, app switching, and safe-area insets.
- Copy from an AI app, native long-press paste, Files picker, download location,
  share cancellation, and sharing a generated Word file into another app.
- Google Docs app rich paste and Word-file import. Rich clipboard API support
  alone does not guarantee receiving-app formatting.
- Native Print / Save as PDF and diagrams/images in the printed output.
- Representative phones at the import-size limit; lower the guard if needed.

Record OS/browser/receiving-app versions and outcomes. Headless Chromium or WebKit
cannot establish these handoff behaviors. Production deployment remains separate;
rollback can restore the prior app build without changing persisted documents.

## Supplemental WebKit attempt

The WebKit browser downloaded, but launch in this Linux workspace was blocked by
missing system libraries: libgtk-4, libgraphene-1.0, libharfbuzz-icu, libmanette,
libhyphen, and libGLESv2. WebKit checks did not run; Chromium results must not be
presented as Safari-engine coverage. No system package installer/sudo was available.

## Local results

| Check | Result |
| --- | --- |
| Frozen-lockfile install | Passed |
| Full monorepo build and prerender | Passed |
| Validation suite | 146 tests across 26 files passed |
| Fidelity regression harness | 20 checks passed |
| Web lint | Passed; pre-existing diagram/canvas warnings remain |
| Chromium browser suite | 24 scenarios passed |
| WebKit | Launch blocked by missing system libraries |
| Physical iPhone / Android handoff | Not run |

Browser coverage includes retaining all six saved documents on hydration,
preventing duplicate downloads on a double tap, storage quota failure, native
paste size rejection, current-source DOCX output, and valid/invalid Mermaid.
The recorded walkthrough is `artifacts/mobile/walkthrough.webm`. It demonstrates
the automated desktop-browser mobile viewport, not a physical phone keyboard.
