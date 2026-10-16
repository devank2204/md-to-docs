# md.to.docs: Execution Ledger

This ledger tracks the progressive implementation and verification of the `md.to.docs` compiler and web application across discrete, auditable prompts.

---

## Prompt 1: Repository Audit and Execution Baseline

* **Status:** Complete
* **Scope and Intended Behavior:**
  - Audit the entire repository without implementing production features or refactoring production code.
  - Protect the working tree and preserve existing user changes.
  - Trace the real application pipeline from input through AST, assets, planning, preview, and destination exports.
  - Investigate 10 explicit pipeline characteristics (split preview, asset caching, math representation, capability declarations, etc.).
  - Safely audit root and workspace builds, lints, and test scripts.
  - Establish `docs/BASELINE_AUDIT.md` and `docs/EXECUTION_LEDGER.md`.
* **Files Changed:**
  - `docs/BASELINE_AUDIT.md` (Created baseline audit)
  - `docs/EXECUTION_LEDGER.md` (Created execution tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (Pass, exit code 0)
  - `npx pnpm --filter @mdtodocs/compiler-core build` (Pass, exit code 0)
  - `npx pnpm --filter @mdtodocs/capability-graph build` (Pass, exit code 0)
  - `npx pnpm --filter @mdtodocs/renderers build` (Pass, exit code 0)
  - `npx pnpm --filter web lint` (`oxlint`) (Pass, exit code 0, 5 warnings)
  - `npx pnpm --filter @mdtodocs/validation test` (`vitest`) (Fail, exit code 1: jsdom missing getBBox + `doc.assets` undefined in stress test)
  - `packages/fidelity-lab/src/runner.ts` (Inspected and identified side-effects: overwrites tracked `.output/` files; deferred destructive execution)
* **Acceptance Criteria:**
  - [x] Existing working tree inspected and preserved without blanket restores.
  - [x] Input-to-export pipeline traced with exact files, functions, and line numbers.
  - [x] All 10 specific questions investigated and answered with concrete evidence.
  - [x] Build, lint, and test scripts executed and cataloged.
  - [x] Discrepancies between documentation/README claims and code verified.
  - [x] `docs/BASELINE_AUDIT.md` created with ranked findings and engineering sequence.
  - [x] `docs/EXECUTION_LEDGER.md` established.
* **Regressions & Unresolved Issues:**
  - `@mdtodocs/validation` Vitest tests are currently failing in the working repository due to jsdom SVG method limitations and an incorrect AST assumption in `stress.test.ts`.
  - `packages/fidelity-lab` has tracked binary `.docx` files in `.output/` that will cause git pollution if run naively.
  - Visible preview is completely decoupled from compiler planner and destination renderers.
* **Next Allowed Prompt:** Prompt 2: Test Harness Stabilization & Fidelity Isolation (Fixing jsdom SVG/Mermaid mocks in `@mdtodocs/validation` and isolating `fidelity-lab` output generation to prevent dirtying tracked git files).

---

## Prompt 2: Test Harness Stabilization & Fidelity Isolation
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Provide isolated jsdom mocks for `SVGElement.prototype.getBBox`, `getScreenCTM`, `createSVGPoint`, and `createSVGMatrix` in `@mdtodocs/validation` test configuration so Mermaid tests pass deterministically in CI/local runs.
  - Fix `stress.test.ts` to inspect node-attached AST data rather than non-existent `doc.assets`.
  - Fix Windows file URL resolution bug in `packages/fidelity-lab/src/runner.ts` using `fileURLToPath`.
  - Isolate `fidelity-lab` output generation to `process.env.FIDELITY_OUTPUT_DIR || path.join(os.tmpdir(), 'mdtodocs-fidelity-output')` so running tests never touches or dirties tracked git repository files.
  - Guard snapshot generation in `runner.ts` behind an explicit `--update` / `-u` CLI flag to prevent accidental fixture mutations.
* **Files Changed:**
  - `packages/validation/tests/setup.ts` (Created SVG/DOM mocks for jsdom)
  - `packages/validation/vitest.config.ts` (Configured `setupFiles: ['./tests/setup.ts']`)
  - `packages/validation/tests/stress.test.ts` (Fixed AST node assertion for mermaid diagrams)
  - `packages/fidelity-lab/src/runner.ts` (Cross-platform path resolution, isolated output dir, guarded snapshot update)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 4/4 test files, 5/5 tests passed in 7.60s**)
    - `tests/mermaid.test.ts` (PASSED)
    - `tests/mermaid-integration.test.ts` (PASSED)
    - `tests/mermaid-test-2.test.ts` (PASSED)
    - `tests/stress.test.ts` (PASSED)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: Isolated execution verified**; output written to OS temporary directory without touching or modifying any tracked git files)
  - `git status --short` (Verified 100% clean fixture tree, zero unintended tracked changes)
* **Acceptance Criteria:**
  - [x] All `@mdtodocs/validation` tests pass cleanly without jsdom getBBox errors.
  - [x] `fidelity-lab` test runner runs without dirtying or modifying the git working tree.
  - [x] Windows file URL resolution in `runner.ts` works cross-platform.
  - [x] Accidental fixture auto-generation is prevented unless `--update` is explicitly provided.
* **Regressions & Unresolved Issues:**
  - `fidelity-lab` fixtures (`expected-ir.json`) still contain the pre-commit `beff8e7` Document IR structure, whereas `parseMarkdown` outputs remark mdast. Re-aligning the IR or fixture baselines will be addressed in architectural planning.
* **Next Allowed Prompt:** Prompt 3: Pipeline Consolidation & Live Workspace Optimization (Debouncing compilation, caching image assets, removing dead `renderToClipboardHtml` keystroke calls, and passing compiled state to export).

---

## Prompt 3: Pipeline Consolidation & Live Workspace Optimization
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Introduce 250ms debouncing and `AbortController` cancellation to the live compilation effect in `Workspace.tsx`.
  - Cache fetched image blobs/URIs in `@mdtodocs/asset-pipeline` via in-memory `imageCache` map with error eviction to stop redundant HTTP requests on typing.
  - Remove dead `renderToClipboardHtml` calculation from the live keystroke loop in `Workspace.tsx`.
  - Store in-memory `compiledDoc: Root | null` and `isCompiling: boolean` in Zustand (`useStore`), excluded from localStorage persistence.
  - Pass compiled document state from `Workspace.tsx` to `Header.tsx` to eliminate duplicate parsing and asset fetching on export.
* **Files Changed:**
  - `packages/asset-pipeline/src/index.ts` (In-memory image cache, AbortSignal support, graceful fallback dimensions)
  - `apps/web/src/store/index.ts` (Added in-memory `compiledDoc` and `isCompiling` to state)
  - `apps/web/src/components/Workspace.tsx` (250ms debounce, AbortController, removed dead clipboard HTML calculation, shared `compiledDoc` with store)
  - `apps/web/src/components/Header.tsx` (Reused `compiledDoc` during export to eliminate redundant parsing and asset loading)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled cleanly in 3.29s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 4/4 test files, 5/5 tests passed in 7.78s**)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**, 5 oxlint warnings)
* **Acceptance Criteria:**
  - [x] Typing in editor does not trigger compilation until 250ms quiet period.
  - [x] In-flight compilations are canceled via `AbortController` when new keystrokes arrive.
  - [x] Remote images are cached and not re-fetched on every keystroke.
  - [x] Dead `renderToClipboardHtml` call is eliminated from `Workspace.tsx`.
  - [x] `Header.tsx` reuses already-compiled AST and resolved assets for Google Docs and Word exports.
* **Next Allowed Prompt:** Prompt 4: Preview & Export Unification (Aligning `DocumentPreview.tsx` to render the destination-planned document representation and adding diagram action controls for SVG/PNG).

---

## Prompt 4: Preview & Export Unification
* **Status:** Completed
* **Scope and Intended Behavior:**
  - Align `DocumentPreview.tsx` to render the destination-planned document representation so capability polyfills and warnings are accurately visualized.
  - Add diagram action controls (copy SVG, copy Mermaid code, download SVG, download PNG via high-res canvas) to Mermaid diagram blocks with error display and interactive zoom.
* **Files Changed:**
  - `packages/compiler-core/src/planner/index.ts` (Attached `data.polyfill = 'table-to-list'` on linearized table AST nodes and `data.polyfill = 'image-to-link'` on fallback links)
  - `apps/web/src/components/DocumentPreview.tsx` (Injected destination planning remark plugin into `ReactMarkdown`; customized `ul` and `a` renderers for visual polyfill notifications; implemented interactive `MermaidDiagram` action controls for Copy SVG, Copy Source, Download SVG, Download PNG at 2x scale, and error fallback UI)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/compiler-core build` (**PASS: 0 errors**, TypeScript compiled cleanly)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite production bundle succeeded)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**, 0 warnings in `DocumentPreview.tsx`)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 4/4 test files, 5/5 tests passed in 6.73s**)
* **Acceptance Criteria:**
  - [x] Destination-planned transformations (e.g. table linearization) are reflected directly in the live preview.
  - [x] Destination polyfills and degradation warnings are styled and visibly distinct in preview.
  - [x] Mermaid diagrams offer copy SVG and copy source actions with clipboard feedback.
  - [x] Mermaid diagrams offer direct SVG and rasterized 2x high-resolution PNG download options.
  - [x] Diagram syntax errors fail gracefully with collapsible source preview.
* **Next Allowed Prompt:** Prompt 5: Math & Equation Rendering Accuracy / Quality Benchmark (Evaluating KaTeX math rendering, inline/display equation alignment, and destination-specific math export fidelity).

---

## Prompt 5: Math & Equation Rendering Accuracy / Quality Benchmark
* **Status:** Completed
* **Scope and Intended Behavior:**
  - Validate and optimize KaTeX math equation rendering in live preview and clipboard/HTML exporters.
  - Implement dual MathML (`<math xmlns="http://www.w3.org/1998/Math/MathML">`) and KaTeX HTML markup in `renderToClipboardHtml` for Google Docs native formula translation and rich visual clipboard previews.
  - Address display vs. inline math alignment and baseline typography across target destinations.
  - Ensure syntax error resilience via safe KaTeX options and try/catch fallback markup.
  - Add automated test coverage in `@mdtodocs/validation` for math parsing, rendering, error tolerance, and export.
* **Files Changed:**
  - `packages/renderers/package.json` (Added `katex` dependency)
  - `packages/renderers/src/clipboard.ts` (Implemented dual MathML and KaTeX HTML rendering with centered display math and baseline-aligned inline math)
  - `packages/compiler-core/src/planner/index.ts` (Added math destination planning diagnostic notifications for Google Docs and clipboard)
  - `apps/web/src/components/DocumentPreview.tsx` (Configured safe `rehypeKatex` options with `strict: false, throwOnError: false`)
  - `apps/web/src/index.css` (Added calibrated KaTeX and math typography rules for `.katex-display`, `.katex`, `.math-inline`, and `.katex-error`)
  - `packages/validation/tests/math.test.ts` (Created comprehensive 5-test suite for math parsing, clipboard HTML, error tolerance, destination planning, and Word export)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**, TypeScript compiled cleanly)
  - `npx pnpm --filter @mdtodocs/compiler-core build` (**PASS: 0 errors**, TypeScript compiled cleanly)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite production bundle succeeded in 10.37s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**, 0 warnings in modified files)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 5/5 test files, 10/10 tests passed in 19.40s**)
* **Acceptance Criteria:**
  - [x] Inline math ($...$) and display math ($$...$$) render accurately in live preview without layout jitter.
  - [x] Display equations are centered with horizontal overflow scrolling and vertical breathing room.
  - [x] Inline equations align naturally with the text baseline typography.
  - [x] Clipboard HTML exports MathML `<math>` tags for Google Docs formula compatibility alongside visual KaTeX HTML.
  - [x] LaTeX syntax errors degrade safely to styled fallback blocks without breaking or crashing the application.
  - [x] Automated test suite covers math parsing, clipboard rendering, error recovery, and Word export.
* **Next Allowed Prompt:** Task P1: Establish Trustworthy Regression Tests for md.to.docs

---

## Task P1: Establish Trustworthy Regression Tests for md.to.docs
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Audit and verify all public-main fidelity test suite issues (silent generation, missing structural assertions, placeholder previews, IR-only pass/fail, and git pollution).
  - Make normal tests strictly non-mutating: missing golden snapshots fail with clear actionable diagnostics; snapshot generation requires explicit `--update` / `-u` CLI flag.
  - Route all temporary test artifacts exclusively to isolated OS temporary directory (`tmpdir/mdtodocs-fidelity-output`).
  - Preserve all existing parser regression fixtures and add representative coverage for images (`015-images`) and math expressions (`016-math-expressions`).
  - Implement deterministic assertions on actual repository renderers:
    - Clipboard HTML: verify semantic container, headings, paragraphs, lists, links, code blocks, tables, inline formatting, callouts, images, and math formulas.
    - DOCX: verify valid PKZIP archive structure, `[Content_Types].xml`, and `word/document.xml` containing expected text and structural XML tags.
    - Mermaid: verify asset preservation when resolved SVG assets are attached and graceful diagnostics on syntax errors.
  - Implement useful, deterministic failure reporting detailing fixture name, failed assertion, expected behavior, actual behavior, and artifact location.
  - Fix context state propagation in `DocumentRenderer` and `renderToDocxBlob` for nested inline formatting (`strong`, `emphasis`, `delete`).
* **Files Changed:**
  - `packages/fidelity-lab/src/runner.ts` (Complete non-mutating fidelity runner with real clipboard HTML and DOCX assertions, isolated output, and detailed failure reports)
  - `packages/fidelity-lab/fixtures/015-images/input.md` (Added dedicated image test fixture)
  - `packages/fidelity-lab/fixtures/015-images/expected-ir.json` (Generated golden AST snapshot)
  - `packages/fidelity-lab/fixtures/016-math-expressions/input.md` (Added dedicated math expressions fixture)
  - `packages/fidelity-lab/fixtures/016-math-expressions/expected-ir.json` (Generated golden AST snapshot)
  - `packages/fidelity-lab/fixtures/*/expected-ir.json` (Updated golden AST baselines to match current mdast Root format)
  - `packages/fidelity-lab/package.json` (Added `test:update` script)
  - `package.json` (Updated root `test` and added `test:update` script)
  - `packages/renderers/src/core/Renderer.ts` (Fixed context state propagation across nested context clones)
  - `packages/renderers/src/docx.ts` (Harmonized inline text formatting state in docx renderer)
  - `packages/validation/vitest.config.ts` (Set `testTimeout: 30000` to prevent premature Vitest timeouts on Windows jsdom)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed**; 16 fixtures + 1 mermaid asset integration assertion verified with zero git pollution)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 5/5 test files, 10/10 tests passed**)
  - `npx pnpm --filter @mdtodocs/compiler-core build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/capability-graph build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 16.38s)
  - `git status --short` (Verified 100% non-mutating normal test execution)
* **Acceptance Criteria:**
  - [x] Normal tests do not silently generate or overwrite expected fixtures.
  - [x] Existing parser coverage is preserved and expanded with missing representative cases (images, math).
  - [x] Clipboard HTML and DOCX receive real structural assertions.
  - [x] Test failures identify the failing fixture, assertion, expected behavior, actual behavior, and artifact path.
  - [x] The build and test results are reported accurately.
  - [x] Limitations recorded honestly: DOCX XML assertions verify OpenXML structural conformance rather than Word visual rendering; PDF rendering is omitted as no server-side renderer exists in the codebase.
* **Next Allowed Prompt:** Prompt 6: Word / DOCX Table Calibration & Heading/List Nesting Fidelity

---

## Prompt 6: Word / DOCX Table Calibration & Heading/List Nesting Fidelity
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Calibrate DOCX tables to standard printable page width (6.5 inches / 9360 twips) with proportional column width calculations based on cell content length.
  - Enforce minimum column widths (720 twips / 0.5 inch) and exact total width distribution.
  - Configure repeating header rows (`tableHeader: true`) and prevent row splitting across page breaks (`cantSplit: true`) on all DOCX table rows.
  - Calibrate cell padding margins (`margins: { left: 140, right: 140, top: 120, bottom: 120 }`).
  - Respect column alignments (`left`, `center`, `right`) across both DOCX paragraphs (`AlignmentType`) and Clipboard HTML cells (`text-align`).
  - Add semantic `<thead>` and `<tbody>` separation for clipboard HTML tables.
  - Define complete paragraph styles for `Heading1` through `Heading6` with calibrated point sizes, fonts, text colors, `keepNext: true`, and proportional spacing before/after.
  - Add task list checkbox support with universal ballot box glyphs (`☑ ` for checked, `☐ ` for unchecked) across both DOCX (`mdtodocs-task-list` numbering reference) and Clipboard HTML (`list-style-type: none`).
  - Support list nesting up to level 8 (9 levels) with proper indentations.
* **Files Changed:**
  - `packages/renderers/src/docx.ts` (Dynamic table column width calculation, cantSplit, tableHeader, column alignment, cell padding margins, complete Heading1-Heading6 styles, and task list numbering)
  - `packages/renderers/src/clipboard.ts` (Column alignment support in table cells, thead/tbody structure, and task list item formatting with ballot box symbols)
  - `packages/validation/tests/table-calibration.test.ts` (Added 7 unit and regression test assertions covering DOCX table XML, widths, alignments, margins, heading styles 1-6, task lists, and clipboard HTML)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 7/7 test files, 24/24 tests passed**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.50s)
* **Acceptance Criteria:**
  - [x] Word / DOCX tables have proportional column widths totaling 9360 twips with 720 twips minimum per column.
  - [x] Table rows do not awkwardly split across page breaks (`cantSplit: true`).
  - [x] Table header rows repeat cleanly across page breaks (`tableHeader: true`).
  - [x] Table cells have calibrated padding margins (top/bottom: 120 twips, left/right: 140 twips).
  - [x] Markdown column alignments (`left`, `center`, `right`) are respected in DOCX paragraphs and Clipboard HTML cells.
  - [x] Full heading hierarchy (Heading 1 to Heading 6) is styled in DOCX with proper fonts, sizes, keepNext, and spacing.
  - [x] Task lists render ballot boxes (`☑ ` / `☐ `) in DOCX and clipboard HTML without redundant bullets.
  - [x] Regression test suite in `@mdtodocs/validation` asserts all table, heading, and list capabilities.
* **Next Allowed Prompt:** Prompt 7: Architecture Hygiene, Circular Dependency Cleanup & Standalone HTML Renderer

---

## Prompt 7: Architecture Hygiene, Circular Dependency Cleanup & Standalone HTML Renderer
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Remove circular unused dependency `@mdtodocs/compiler-core` from `packages/capability-graph/package.json` to ensure clean acyclic workspace dependency flow.
  - Eliminate all 3 `oxlint` warnings in `apps/web`:
    - Fix ref mutation during render in `segmented-control.tsx` using `useEffect`.
    - Fix fast-refresh violation by unexporting `useAsyncAction` internal hook in `loading-button.tsx`.
    - Remove redundant `{face.icon && face.icon}` comparison in `loading-button.tsx`.
  - Implement standalone `html.ts` renderer in `@mdtodocs/renderers` with full document wrapping, semantic heading IDs, precise Mermaid SVG injection, table alignment, KaTeX math, task lists, and print styles.
  - Export `renderToHtml` and `HtmlRendererOptions` from `@mdtodocs/renderers`.
  - Add unit test suite in `@mdtodocs/validation` covering `renderToHtml` capabilities.
* **Files Changed:**
  - `packages/capability-graph/package.json` (Removed circular compiler-core dependency)
  - `apps/web/src/components/interior/segmented-control.tsx` (Fixed ref update in render)
  - `apps/web/src/components/interior/loading-button.tsx` (Internalized useAsyncAction and simplified face.icon)
  - `packages/renderers/src/html.ts` (Implemented standalone HTML renderer)
  - `packages/renderers/src/index.ts` (Exported renderToHtml and HtmlRendererOptions)
  - `packages/validation/tests/html-renderer.test.ts` (Added 6 unit tests for standalone HTML renderer)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/capability-graph build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/compiler-core build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.60s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 8/8 test files, 30/30 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed**)
* **Acceptance Criteria:**
  - [x] Workspace graph has no circular dependencies between compiler-core and capability-graph.
  - [x] `oxlint` reports 0 warnings and 0 errors across the entire web application.
  - [x] Standalone `html.ts` renderer is implemented, exported, and tested.
  - [x] Mermaid SVG injection injects pure SVG into HTML without rasterization.
  - [x] All 30 validation tests and 17 fidelity lab fixtures pass.
* **Next Allowed Prompt:** Prompt 8: GFM Footnotes & Callout Styling Fidelity

---

## Prompt 8: GFM Footnotes & Callout Styling Fidelity
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Add GitHub Flavored Markdown (GFM) footnotes support across DOCX, Clipboard HTML, and Standalone HTML renderers:
    - Render `footnoteReference` as superscript run (`superScript: true`) in DOCX and `<sup><a href="#fn-X">[X]</a></sup>` in HTML.
    - Render `footnoteDefinition` as indented block with superscript identifier across DOCX, Clipboard HTML, and Standalone HTML.
  - Elevate Callout Styling Fidelity:
    - Fix directive name resolution where `remark-directive` stores block directive names on `node.name` rather than `node.attributes.type`.
    - Add type-specific icons (`📝 Note`, `💡 Tip`, `⚠️ Warning`, `🛑 Caution`, `❗ Important`) across all renderers.
    - Set `cantSplit: true` on callout table rows in DOCX to prevent page break ruptures.
    - Harmonize border-left accent colors and soft background tints across DOCX, Clipboard HTML, and Standalone HTML.
  - Implement comprehensive regression test suite in `packages/validation/tests/footnotes-and-callouts.test.ts`.
* **Files Changed:**
  - `packages/renderers/src/docx.ts` (Added footnote reference superscript runs, footnote definition indented blocks, callout type resolution fix, callout text icons, and cantSplit row setting)
  - `packages/renderers/src/clipboard.ts` (Added footnote references, footnote definitions, callout icons, and callout colors)
  - `packages/renderers/src/html.ts` (Added footnote references, footnote definitions, and callout icons)
  - `packages/validation/tests/footnotes-and-callouts.test.ts` (Added 5 tests for DOCX footnotes/callouts, HTML footnotes, standalone HTML callouts, cantSplit, and callout icons)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 9/9 test files, 35/35 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.51s)
* **Acceptance Criteria:**
  - [x] Footnote references and definitions render across DOCX, Clipboard HTML, and Standalone HTML without crashing or omitting references.
  - [x] Callout directives recognize proper directive names and render type-specific icons and colors.
  - [x] DOCX callouts enforce `cantSplit: true` to prevent page split ruptures.
  - [x] All 35 validation tests and 17 fidelity lab fixtures pass.
* **Next Allowed Prompt:** Prompt 9: Destination Diagnostics & Capability Inspector UI

---

## Prompt 9: Destination Diagnostics & Capability Inspector UI
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Calibrate `DESTINATIONS` profiles in `@mdtodocs/capability-graph` to accurately reflect verified support for Mermaid, math equations, callouts, task lists, and footnotes across all export destinations.
  - Enhance `evaluateCapability` with precise evaluations for Mermaid code blocks (vector SVG assets), task lists (ballot glyphs), wide tables (linearization), math/KaTeX formulas, callouts, footnotes, and structural nodes (`root`, `tableRow`, `tableCell`).
  - Export `FEATURE_CAPABILITIES` providing a canonical cross-destination capability comparison matrix covering typography, structure, data, assets, and advanced categories.
  - Implement `detectActivePolyfills` in `@mdtodocs/validation` detecting active wide table linearization, MathML & KaTeX formula typesetting, Mermaid vector asset preservation, callout table protection, task list ballot glyph mapping, and footnote superscript runs.
  - Attach `activePolyfills` to `ValidationReport` returned by `validateDocument`.
  - Redesign `DocumentInspector.tsx` into an interactive slide-over drawer featuring:
    - Quick destination switcher pills (`Docs`, `Word`, `PDF`, `Copy`) with real-time fidelity recalculation.
    - 3 interactive tabs:
      - Diagnostics & Health: color-coded fidelity score gauge, preserved/transformed/degraded/unsupported breakdown pills, active polyfill cards, and compiler diagnostics.
      - Capability Matrix: category filter chips (Typography, Structure, Advanced, Assets), per-feature status badges (Native, Styled, Transformed, Vector Asset), cross-destination support dots, and polyfill notes.
      - Audit & Metrics: element count grid (headings, paragraphs, lists, task lists, tables, code blocks, mermaid, math, callouts, blockquotes, footnotes, images), words, reading time, and export recommendation.
  - Wire `countElements` in `Workspace.tsx` to track full element metrics and pass destination props to `DocumentInspector`.
  - Add comprehensive unit test suite in `packages/validation/tests/capability-inspector.test.ts` (6 tests).
* **Files Changed:**
  - `packages/capability-graph/src/index.ts` (Calibrated destination profiles, expanded evaluateCapability, exported FEATURE_CAPABILITIES)
  - `packages/validation/src/index.ts` (Added detectActivePolyfills and attached activePolyfills to ValidationReport)
  - `packages/validation/tests/capability-inspector.test.ts` (Added 6 unit tests for capability matrix, destination profiles, mermaid/table capability evaluation, active polyfills, and validation report)
  - `apps/web/src/components/DocumentInspector.tsx` (Complete redesign with destination switcher, 3 tabs for Diagnostics, Matrix, and Audit)
  - `apps/web/src/components/Workspace.tsx` (Enhanced countElements to track full element metrics and wired destination controls to DocumentInspector)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/capability-graph build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 10/10 test files, 41/41 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.48s)
* **Acceptance Criteria:**
  - [x] Destination profiles accurately declare format capabilities.
  - [x] Active polyfills are detected and displayed with counts, severity, and descriptions.
  - [x] Interactive Destination Diagnostics and Capability Inspector UI provides 3 dedicated tabs (Diagnostics, Matrix, Audit).
  - [x] All 41 validation tests and 17 fidelity lab fixtures pass.


