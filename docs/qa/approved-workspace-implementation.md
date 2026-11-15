# Approved workspace implementation · 2026-11-15

Starting commit: `d498b61`; branch: `ux/direct-handoff-version-review`.
Latest user implementation request authorizes reviewed rename/export/history,
global file drops with expanding capacity, code formatting, contained logo snow,
and the mobile defects shown in screenshots. D010 records the resulting behavior.

## Actual changes and evidence

- One Export menu on desktop/mobile with Word, browser Print/Save PDF, Google Docs,
  Markdown, HTML, rich copy and advanced options. Existing delivery preparation,
  revision guards and clipboard gesture handling remain. No cloud Doc claim.
- One-outline title/check, Material Symbols ellipsis/link icons, neutral ordinary
  hover/selection, tabbed history, small Save version disclosure, contained diff
  scrolling and clear copy/restore hierarchy. History uses actual document names.
- Mobile's crowded two-row action header and duplicate name form are removed.
  Options use compact checkboxes and a fixed heading/scrolling body bounded by
  visualViewport/dvh and safe areas. Touch controls fit at 320px. Title input uses
  the incumbent 16px mobile input role to avoid Safari focus zoom.
- Global Markdown drops prevent native file navigation and always create a new
  internal document, including early startup drops and drops from diagram routes.
  Files are serialized through capacity decisions. Initial limit 5; explicit Open
  anyway persists 6, then 7, etc. Cancel skips import; Remove verifies a separate
  recovery write before replacing the selected document. Existing source is synced
  before switching. Creation, duplication, warnings and hydration share the saved
  limit. Legacy documents are never truncated. File size/nonempty checks remain.
- The old preview fallback rendered original children instead of formatted text.
  Corrected that path and implemented on-demand Prettier parsers for JS/TS, CSS,
  HTML, YAML and Markdown. JSON comment removal now respects quoted URLs/escapes;
  invalid JSON reports an error without losing source. Unsupported languages use
  Normalize spacing, not a universal formatting claim. Preview formatting leaves
  Markdown source unchanged and resets safely when the source block changes.
- Existing local Piixpal snow loads on logo hover only, is contained/removed on
  leave, and respects reduced motion/Save-Data. No CDN scripts or new font imports.
  Home, brand, document preview and cream/dark identity remain; screenshots were
  reviewed at 375/1440 in both appearances. Identity assertions were retained.

## Production verification

Actual commands (from repository root unless a directory is specified):

```sh
cd apps/web
./node_modules/.bin/tsc -b
PERF_ANALYZE=/tmp/approved-bundle.json ./node_modules/.bin/vite build
./node_modules/.bin/oxlint
cd ../..
TSX_TSCONFIG_PATH=apps/web/tsconfig.app.json node --import tsx scripts/prerender.ts
node scripts/performance-server.mjs apps/web/dist 4173
# Separate terminal, production server running:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium ./node_modules/.bin/playwright test --reporter=line
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium ./node_modules/.bin/playwright test tests/browser/approved-ux.spec.ts tests/browser/identity.spec.ts tests/browser/seo.spec.ts --reporter=line
# In packages/validation:
./node_modules/.bin/vitest run
# From repository root:
node --import tsx packages/fidelity-lab/src/runner.ts
```

- Production TypeScript/Vite build and all eight prerendered routes: pass.
- Full Chromium suite: **128 passed**. Final affected/identity/SEO rerun after
  touch sizing and decoration containment: **35 passed**.
- Validation: **173 passed across 30 files**, including six JSON regressions.
- Fidelity fixtures: **20 passed**, no baseline updates.
- Lint: success with existing DiagramCanvas/Mermaid React warnings; no new warnings
  in changed title/controls/application paths. Material glyph check: all 86 covered.
- New tests cover dynamic capacity/reload/cancel/recovery, direct diagram import,
  genuine formatting and invalid JSON, rename cancellation/blank names, snow
  containment/cleanup/reduced motion, and widths 320/375/390/768/1024/1440.
- Existing suites retain exports, persistence, early typing/paste, startup delays,
  navigation, SEO, advanced actions and responsive flows.

## Loading cost

Same production-build methodology on starting and final output: collect the entry
and modulepreload JavaScript files from `dist/index.html`, gzip each at level 9,
then sum. This is reproducible artifact compression, not measured HTTP transfer.

| Initial static JavaScript | Before | After | Change |
| --- | ---: | ---: | ---: |
| Sum of entry + runtime gzip bytes | 105,153 | 106,572 | +1,419 (+1.35%) |
| KiB | 102.7 | 104.1 | +1.4 |

Decimal kB are 105.2 → 106.6. New parser engines and snow are dynamic imports, absent from the
initial entry/preload set. First formatting action loads standalone plus relevant
parser chunks; first eligible logo hover loads local core/weather. No eager fetching
of every formatter. No new LCP/FCP/CLS or real-user performance claims are made.

## Evidence and limits

Fourteen production screenshots plus `capture.mjs`, build/lint/test logs, dependency
graph and bundle summary are archived in `/workspace/approved-ux-evidence.zip`.
This is local Chromium automation, not physical iPhone/Safari or destination-app
verification. DOCX fixture checks establish structural assertions, not visual Word
fidelity. Browser print does not prove a PDF was saved. Real receiving-app clipboard
verification and physical keyboard/browser chrome behavior remain external checks.
No deployment or merge is performed. Three unrelated dirty DOCX output fixtures
are excluded from the commits.

Next SEO work remains Iteration 03: measured destination fidelity, downloadable
fixtures/artifacts and evidence-based compatibility claims. This task does not
start that iteration or create additional SEO pages.
