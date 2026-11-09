# Iteration 02 — progressive loading and startup performance

Implemented locally on `seo/iteration-02-performance`, starting at
`04a0e75a59a1d9a60ee574e36bb73ae9399fee58` from `Seo-fixes`. Iteration 01's
route registry, metadata, sitemap, links, 404 configuration and tests are retained.
No push, merge or deployment is authorized for this iteration.

## Root causes established by production bundle analysis

The opt-in Vite `performance-module-report` plugin records chunk imports,
dynamic imports, gzip estimates and per-module rendered source lengths. Run with
`PERF_ANALYZE=/tmp/bundle.json` during the production build. It adds no production
dependency and does not impose manual vendor partitions.

Largest modules in the starting entry graph (rendered source, before final
minification; these are not additive gzip-attribution estimates):

| Module | Rendered source bytes | Why present |
| --- | ---: | --- |
| Ondine embedded all-diagram module | 1,970,781 | Asset/diagram imports reached the entire app |
| DOCX library | 567,676 | Header export hook imported all preparation/renderers |
| React DOM client | 529,611 | Required for the interactive React shell |
| KaTeX 0.16 | 466,343 | Eager document preview |
| KaTeX 0.18 | 457,945 | Eager document renderers |
| JSZip | 135,581 | Export/reconciliation import paths |

The application also requested an approximately 4 MB Material Symbols font.
That was larger than the compressed initial JavaScript itself. Its replacement
is a transport subset of the **same** family and existing variable axes, containing
all 96 referenced glyphs, including component `icon` props. Text fonts, their
imports, weights, sizes, tracking, fallback order and line heights are unchanged.
`node scripts/check-material-symbols.cjs` verifies the list against the TS/TSX AST.

## What loads and when

- Initial converter landing: React shell, shared existing desktop/mobile input,
  lightweight store/document management/theme data, metadata and landing guidance.
  The network test rejects eager workspace, preview, DOCX and diagram engines.
- Markdown entry: desktop studio or mobile background compilation. Once activated, the mobile compiler stays available to reset diagnostics on clears and document switches. The mobile
  editor stays mounted; desktop hands off selection, focus and logical scroll
  position through the existing editable terminal, with empty hints suppressed.
- Preview: document preview and its KaTeX/markdown/code styles. The browser loads
  those styles before rendering the deferred capability. Preview component types
  remain stable across diagnostic updates.
- Mermaid: diagram UI on actual Mermaid content; Ondine engine at render time.
  Identical concurrent diagram renders share one in-flight promise. Unsupported
  diagram types retain the existing standard Mermaid fallback.
- Export: preparation code on Prepare, then destination-specific DOCX, HTML or
  clipboard renderer. PDF print snapshot/styles load only for PDF. Existing
  request IDs, source/document guards, cancellation and stale-print disposal remain.
  Delivery uses the existing separate Copy/Print/Download gesture, without an
  asynchronous import inserted into the clipboard gesture.
- Optional global tools: command palette, history, reconciliation, templates and
  About load when opened. Mobile sheets load when invoked. Small existing studio
  panels remain together once the desktop workspace is required.

The store is still the sole document owner. Runtime theme/document-management
imports use their narrow source entries; type-only imports stay erased. No new
state manager, worker, service worker, framework or production dependency.

## Important changed files

| Files | Purpose |
| --- | --- |
| `App.tsx`, `MobileWorkspace.tsx`, `FeatureBoundary.tsx` | Feature loading boundaries and recoverable module errors |
| `Workspace.tsx`, `hooks/useDocumentCompilation.ts` | Shared compiler lifecycle, revision guards and diagnostic cleanup |
| `DocumentPreview.tsx`, `DocumentEditor.tsx`, `EmptyState.tsx`, `utils/editorHandoff.ts` | Deferred preview, matching image assets and seamless editable source handoff |
| `store/index.ts`, `utils/exportHelpers.ts`, `utils/exportPreparation.ts`, `hooks/useDocumentExport.ts` | Narrow imports and destination-specific preparation with existing delivery gestures |
| `landingStatic.tsx`, `main.tsx`, `scripts/prerender.ts`, `scripts/startup-bootstrap.js` | Shared initial markup, viewport selection, saved state and safe pre-mount interaction |
| `packages/asset-pipeline/src/mermaid.ts`, `ondineEngine.ts` | On-demand engine loading and identical-render deduplication |
| `apps/web/materialSymbols.ts`, `vite.config.ts`, `scripts/check-material-symbols.cjs` | Same-family font subset, coverage check and opt-in bundle graph |
| `tests/browser/performance.spec.ts`, `scripts/measure-*.mjs`, `scripts/performance-server.mjs`, `scripts/summarize-performance.mjs`, `scripts/capture-performance-ui.mjs` | Startup/failure regressions and repeatable measurements/captures |
| `docs/WORKSTATE.md`, this report and results JSON | Implementation state and measured evidence |

Component paths above are relative to `apps/web/src/` unless fully qualified.

## Initial rendering and early interaction

The prerenderer uses the existing Header, EmptyState, MobileWorkspace,
HomeIntroduction and landing content. A small inline bootstrap selects the
matching mobile tree and restores actual saved source before showing the input.
A short head/body visibility guard covers the HTML streaming interval, **not**
the download of the application or engines. Without JavaScript the guard never
activates, and descriptive content and links remain visible.

Native typing, paste and import are accepted before the entry module loads. A
transient buffer transfers them to Zustand when React commits; there is no second
persistent document model. Route defaults precede that transfer, so an early paste
on the Word page still selects Word. Existing nonempty saved documents retain their
chosen destination. Pending startup clipboard/file results carry the original
document ID and cannot land in a different document selected during startup.

A held-entry browser test covers both 375px and 1440px. A held-workspace test
checks readable source and one route introduction. Failed optional-module loading
has an explicit retry; prepared exports retain cancellation and version guards.

## Visual preservation

No source typography scale, text font import, palette, home copy, wordmark,
editor/preview layout or component library was replaced. The icon subset preserves
existing glyph shapes and axes. Optional loading/retry text is the visible change
on a slow or failed feature request. The desktop loading terminal remains editable;
its empty prompts are hidden when it contains source, and the route heading is
shown once. No new marketing section or conversion step was introduced.

52 baseline/final captures cover six routes, edit/preview and restored workspaces
at 375, 768 and 1440px. They are retained under
`/workspace/seo-iteration-02-evidence/screenshots/`. Reviewed home, destination,
Mermaid and workspace captures preserve the established layout. Exact screenshot
comparison differences were 0–0.25% of pixels, including caret, font paint and
compilation-status timing. This is diagnostic evidence, not a new regression
threshold. Existing identity assertions were not changed. A computed-style check
also matched the baseline diagram control's Newsreader, 12px, weight 500,
16px line height and normal tracking; SVG text remains Newsreader.

## Measurement methodology and reproducibility

Chromium 156.0.8078.79; Node 24.22.1. Actual Vite production output plus prerender,
served with gzip. Every cold sample uses a fresh browser context and disabled HTTP
cache. Baseline captured November 8 and final isolated run November 9, 2026.
Three samples per route at 375×900 and 1440×900. Mobile CDP controls:
209,715 B/s download (1.6×1024² bits/s), 96,000 B/s upload, 150ms latency and 4× CPU.
Desktop: 2,621,440 B/s download, 20ms latency, 1× CPU. Local/shared-host synthetic
results are not Lighthouse, production, physical-device or CrUX measurements.

Transfer counts use CDP `encodedDataLength`, including response headers. Initial
capture waits through page load, 1.5 seconds, and outstanding script downloads;
it does not mistake an in-flight diagram engine for a transfer saving. External
JS is reported separately from HTML, which carries the inline startup code.
Charging the entire HTML response to JavaScript gives a conservative startup
budget as well. Automatically preloaded scripts count toward transfer.

Coverage/readiness/DOCX profiling is a separate controlled three-sample Word-route
run. V8 source coverage measures parsed source and covered source bytes, not CPU
instructions. Preview time is measured **after** the scripted paste; it exposes
the first-use cost rather than concealing it in startup. Repeat-visit samples use
immutable asset caching and also reload an existing locally saved document.

Commands (from repository root unless indicated):

```sh
(cd apps/web && ./node_modules/.bin/tsc -b && PERF_ANALYZE=/tmp/bundle.json ./node_modules/.bin/vite build)
TSX_TSCONFIG_PATH=apps/web/tsconfig.app.json node --import tsx scripts/prerender.ts
node scripts/performance-server.mjs /path/to/baseline/dist 4180
node scripts/performance-server.mjs apps/web/dist 4181
PERF_SAMPLES=3 node scripts/measure-performance.mjs http://127.0.0.1:4180 /tmp/before.json
PERF_SAMPLES=3 node scripts/measure-performance.mjs http://127.0.0.1:4181 /tmp/after.json
node scripts/measure-interactions.mjs /tmp/interactions.json
node scripts/measure-repeat-visits.mjs /tmp/repeat.json
node scripts/summarize-performance.mjs /tmp/before.json /tmp/after.json /tmp/summary.json
node scripts/capture-performance-ui.mjs /tmp/ui-captures
```

The direct binaries avoid this environment's pnpm 11 launcher attempting to
self-manage the repository's pinned pnpm 9 via an unavailable sandbox store.
No lockfile or package version was changed. The production build steps themselves
are the same TypeScript/Vite/prerender steps used by deployment.

## Verification and limits

Production build/prerender, validation, fidelity, lint and browser results are
recorded with the final metrics below. Lint retains pre-existing diagram/canvas
warnings. Broken intermediate builds and failed experiments were corrected and
are not counted as final passing evidence.

The regression checks found and fixed: invalid pending file-input binding,
assistant unmount losing stale-review guards, clearing source retaining old notes, a null fallback showing an extra
status, scroll position loss during studio loading, delayed/offscreen image
layout, duplicate diagram error timing, streamed mobile input loss, and late
startup reads reaching a newly selected document. Preview now reuses the
compiler's completed image bytes for the matching document/source/destination;
o new external image request is needed to settle those offscreen assets.

Functional checks cover real DOCX/HTML artifacts, native browser HTML/plain-text
clipboard writing, print snapshot preparation, SVG/PNG/JPEG output, Mermaid
repair and image copy, history, local persistence, keyboard actions, import,
mobile sheets, appearance and synchronized scrolling. They do **not** establish
real Microsoft Word/Google Docs receipt, physical iOS/Android behavior, Safari
behavior, PDF saving or production Netlify status. Templates retain their existing
state-driven entry, but have no currently exposed UI opener in the starting source;
no new product entry was added for this optimization.

Deferred first use needs a connection to fetch modules that have not yet loaded.
Preview and DOCX preparation can take longer after a paste/click than in the
already-heavy starting app; report those costs explicitly. KaTeX versions were
not unified without fidelity evidence. Diagram routes legitimately retain a
larger engine payload. Retry reloads persisted state; with unavailable browser
storage, keep a source backup before reloading. No full-offline or universal
fidelity claim is made.

## Iteration 03 handoff — not implemented

Use real destination-app benchmarks to establish which equations, table layouts,
footnotes, code styles and diagrams survive Word/Google Docs handoff. Publish only
reviewed downloadable artifacts with source, destination, engine version and
verification provenance. Compare competitor outputs on the same fixtures and
separate automated XML/HTML checks from manual receiving-app inspection. Those
results should guide any KaTeX consolidation or claims about native equations,
clipboard compatibility, pagination and vector fidelity. This iteration adds no
public benchmark pages, testimonials or unsupported trust claims.

## Final before/after results

Primary timing table: median of three cold mobile homepage samples unless marked
Word. Sizes use decimal kB. External JS includes all initially requested scripts,
including preloads. HTML includes the inline bootstrap. The table uses the final
isolated timing run; the earlier overlapping regression/timing run is also retained
and showed a 3.02s homepage LCP median. Shared-host contention is a material source
of timing variance. Production/device results require deployment and field testing.

| Metric | Before | After | Change |
| --- | ---: | ---: | --- |
| Initial external JS | 1,350.3 kB | 104.1 kB | -92.3% |
| Largest initial JS response | 1,350.3 kB | 103.2 kB | -92.4% |
| JS + entire HTML (conservative inline-inclusive budget) | 1,354.1 kB | 111.5 kB | -91.8% |
| Total initial transfer | 5.568 MB | 0.389 MB | -93.0% |
| LCP | 14.312s | 0.964s | -93.3% |
| FCP | 1.116s | 0.964s | -13.6% |
| CLS | 0.05685 | 0.00144 | -97.5% |
| Lighthouse TBT (separate single audit per build) | 0ms | 16.89ms | +16.89ms |
| Observed blocking in main sample window | 630ms | 48ms | -92.4% |
| First reliable input (Word) | 14.641s | 0.846s | -94.2% |
| Usable preview after paste | 0.445s | 2.623s | +2.178s first-use cost |
| DOCX preparation (Word) | 0.437s | 1.620s | +1.183s first-use cost |
| Parsed JS source (Word) | 3,793,739 B | 344,585 B | -90.9% |
| Covered JS source (Word) | 2,572,271 B | 109,774 B | -95.7% |
| Initial request count | 11 | 12 | +1 small helper |

The final HTML preloads one runtime helper (858 transferred bytes in the homepage
sample); the other initial script is the entry. There is no startup preload of
the studio, preview, DOCX or diagram engine. Initial CSS is 97.77 kB raw versus
126.55 kB at the starting revision. The full-feature code still exists in deferred
chunks; reducing the entry does not remove supported capabilities.

The separate Lighthouse pair used the same 375×900 viewport, devtools throttling,
150ms request latency, 1638.4 Kbps download, 750 Kbps upload and 4× CPU settings.
It reported LCP 14.129s → 1.203s, FCP 0.971s → 1.051s, CLS 0.05333 → 0.00144,
and Speed Index 1.111s → 1.103s. Both audits completed without runtime errors or
warnings. TBT is reported as observed, without asserting an improvement. These
single supporting audits are separate from the three-sample CDP timing table.
The Lighthouse CLI was installed only in a temporary npm cache; no project
package or lockfile changed.

All route medians (cold mobile, three samples each):

| Route | LCP before | LCP after | CLS after | Initial external JS after |
| --- | ---: | ---: | ---: | ---: |
| / | 14.312s | 0.964s | 0.00144 | 104.1 kB |
| /markdown-to-word/ | 14.760s | 0.968s | 0.00203 | 104.1 kB |
| /markdown-to-google-docs/ | 15.224s | 0.964s | 0.02998 | 104.1 kB |
| /markdown-to-pdf/ | 15.048s | 0.940s | 0.00089 | 104.1 kB |
| /mermaid-to-svg/ | 10.700s | 2.312s | 0.05250 | 988.4 kB |
| /mermaid-to-png/ | 10.760s | 2.296s | 0.02750 | 988.4 kB |

All measured after routes remained below 0.1 CLS. The isolated LCP medians met
2.5s; the retained concurrent/stress run did not meet that target on every route.
Diagram routes still require about 988 kB of JavaScript, a roughly 27% reduction,
because the existing renderer is genuinely required there. LCP measures landing
paint, not completion of every diagram or export. Standard converter routes meet
the 60% reduction target and the under-300-kB aspiration even when their entire
HTML response is charged to JavaScript.

Cached Word-route reloads transferred zero JS bytes in all six before/after
samples. Median warm LCP was 556ms → 360ms; restored-document LCP was 476ms →
340ms, with CLS 0.05333 → 0 and the saved source retained. First preview and DOCX
preparation are slower after the explicit action because their code is now loaded
when needed. This is the material tradeoff; native input remains usable during
loading and the existing preparation/copy/print workflow remains intact.

## Executed checks and git handoff

- Production TypeScript/Vite build and eight-route prerender: passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test`:
  **90 passed**, including 12 new startup/loading/clipboard/import cases.
- `(cd packages/validation && ./node_modules/.bin/vitest run --maxWorkers=2)`:
  **167 tests in 29 files passed**.
- `(cd packages/fidelity-lab && node --import tsx src/runner.ts)`:
  **20 fixtures passed**.
- `(cd apps/web && ./node_modules/.bin/oxlint)`: passed with existing warnings;
  no new application lint warnings retained.
- `node scripts/check-material-symbols.cjs`: all **96 glyphs covered**.
- The offscreen-image/scroll regression passed three repeated cold contexts and
  the full final suite. The original stale-read regression failed before its fix
  and passed after binding startup reads to their document.

Important changed-file groups are described in the architecture sections above.
Additional artifacts and reproduction scripts are under `scripts/`; the compact
machine-readable summary is `docs/qa/seo-iteration-02-results.json`. Full raw
measurements, dependency graphs, screenshots, test logs and Lighthouse JSON are
retained under `/workspace/seo-iteration-02-evidence/`.

Implementation commits: `33625e2` (loading/rendering boundaries and startup),
`7c8a58c` (startup import limits and readable source), and `3cd4e32`
(mobile diagnostic reset after clearing source); the test/report commit follows.
Three fixture DOCX files already modified at the starting checkout remain
uncommitted and excluded. No push, merge, production deployment, physical-device
or receiving-application verification occurred.
