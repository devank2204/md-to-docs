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
* **Next Allowed Prompt:** Task P10: Stabilization & Polish

---

## Task P10: Stabilization & Polish
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Investigate and resolve root causes of document overflow across live preview, clipboard HTML, DOCX, and print/PDF exports.
  - Fix DOCX image and Mermaid diagram overflow by bounding dimensions strictly to standard printable page width (6.5 inches / 468 pt / 5,943,600 EMUs / 9360 twips) and capping maximum height.
  - Sanitize tabs (`\t`) in DOCX code blocks to 4 spaces to prevent Word tab stops from pushing code past page margins.
  - Fix Clipboard HTML overflow by adding `word-break:break-word` and `overflow-wrap:break-word` to table cells, callouts, and document wrappers, and `white-space:pre-wrap` to `<pre>` blocks.
  - Fix Standalone HTML print pagination and overflow with `@media print` page-break-inside rules and word-break styling.
  - Fix Live Preview container overflow by constraining page card width (`max-w-[816px]`), wrapping tables in horizontal scroll containers, and applying `break-words` and `[overflow-wrap:anywhere]`.
  - Fix Print / PDF export by introducing `@media print` CSS hiding all UI chrome (editor, toolbars, header, status bar, zoom controls) and printing document content cleanly at 100% printable width.
  - Improve editor and workspace responsiveness with soft wrap, vertical scrolling, and clear actions.
  - Add comprehensive regression test suite in `packages/validation/tests/overflow-protection.test.ts` without mutating test snapshots.
* **Files Changed:**
  - `packages/renderers/src/docx.ts` (Calibrated image and diagram max bounds to 468 pt / 6.5 inches; sanitized tabs in code blocks)
  - `packages/renderers/src/clipboard.ts` (Added word-break and overflow-wrap to table cells and callouts; pre-wrap to pre blocks; structured container wrapper)
  - `packages/renderers/src/html.ts` (Added word-break, pre-wrap, and @media print page-break-inside rules)
  - `apps/web/src/components/DocumentPreview.tsx` (Enforced max-w-[816px] page bounds, table overflow container, pre overflow-x-auto, break-words)
  - `apps/web/src/components/DocumentEditor.tsx` (Added soft wrap, clean overflow, and clear document action)
  - `apps/web/src/components/Workspace.tsx` (Responsive workspace grid layout)
  - `apps/web/src/index.css` (Complete @media print stylesheet for clean PDF export)
  - `packages/validation/tests/overflow-protection.test.ts` (Added 5 regression test assertions for overflow protection)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 11/11 test files, 46/46 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed with 0 snapshot mutations**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 14.16s)
* **Acceptance Criteria:**
  - [x] Wide tables, unbroken strings, long URLs, and code lines wrap or scroll cleanly without clipping or breaking layout.
  - [x] Images and Mermaid diagrams are bounded to printable margins in DOCX and live preview.
  - [x] Print / PDF export prints only the document without UI chrome.
  - [x] Regression tests verify overflow protection across clipboard HTML, DOCX, and standalone HTML.
  - [x] All 46 validation tests and 17 fidelity lab fixtures pass.
  - [x] Oxlint and web production build succeed with zero errors.

* **Next Allowed Prompt:** Task P11: Workspace Scroll Restoration & Interactive Sanity Suite

---

## Task P11: Workspace Scroll Restoration & Interactive Sanity Suite
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Investigate and fix root causes of blocked scrolling and layout degradation across the application workspace.
  - Fix grid item height propagation: CSS Grid items default to `min-height: auto`. In `DocumentPreview.tsx` and `DocumentEditor.tsx`, root elements expanded to match full content height instead of being constrained by the grid row, making inner scroll containers calculate `clientHeight === scrollHeight` with zero scrollable delta.
  - Fix split-screen breakpoint: The desktop split pane was previously gated behind `lg` (1024px). Users snapping windows side-by-side on standard 1080p monitors have viewports of 958px-960px, which caused the editor and preview to collapse into a vertical stack with nested competing scrollbars. Lowered split-pane threshold to `md` (768px) with `md:col-span-5` and `md:col-span-7` (`lg:col-span-4` and `lg:col-span-8`), keeping the panes side-by-side on all half-screen desktop and tablet viewports without outer vertical stacking or double scrollbars.
  - Fix Mermaid container nesting: In `DocumentPreview.tsx`, `<pre>` was wrapping `<MermaidDiagram>`, causing double outer borders, monospace font styling, and clipped rendering. Prevented `<pre>` from wrapping `language-mermaid` code blocks.
  - Add `data-editor-pane` and `data-preview-pane` data attributes to cleanly target print styles without fragile Tailwind class names.
  - Replace `::-webkit-scrollbar { display: none; }` in `index.css` with sleek, modern 8px custom scrollbars (`scrollbar-width: thin` and subtle semi-transparent thumbs) so users can see scroll progress and drag scrollbars.
  - Execute full interactive browser sanity suite covering split-pane layout at 958px and 1920px, preview and editor scrolling, zoom scaling, destination switching, inspector drawer tabs, document clearing, sample loading, and DOCX download with zero console errors.
* **Files Changed:**
  - `apps/web/src/components/Workspace.tsx` (Added overflow-hidden to workspace container, min-h-0 to grid, and set md:overflow-hidden)
  - `apps/web/src/components/DocumentPreview.tsx` (Added min-h-0, overflow-hidden, md:col-span-7 responsive height, data-preview-pane, and removed pre wrapper from Mermaid diagrams)
  - `apps/web/src/components/DocumentEditor.tsx` (Added min-h-0, overflow-hidden, md:col-span-5 responsive height, and data-editor-pane)
  - `apps/web/src/index.css` (Replaced scrollbar hiding with sleek, modern custom scrollbars and calibrated print selectors)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - Interactive Browser Sanity Suite: **PASS** (13/13 actions verified, side-by-side layout verified at 958px and 1920px, preview and editor scrolling verified > 0, zero console errors)
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 11/11 test files, 46/46 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed with 0 snapshot mutations**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 16.14s)

### Task P12: Paper Sheet Dynamic Expansion and Card Clipping Fix (Completed)
* **Goal:** Resolve document content (Mermaid diagram, math formulas, and sections) spilling past the bottom of the white paper card into the workspace gray background.
* **Root Cause:** In `DocumentPreview.tsx`, the scroll container (`div.flex-1.flex.justify-center`) defaulted to `align-items: stretch` in flexbox without `items-start`. The paper card flex child had `min-h-[1056px]` without `h-auto`, causing its layout height to be constrained rather than growing to fit inner content exceeding 1056px.
* **Implementation Details:**
  - Added `items-start` to preview container flexbox in `apps/web/src/components/DocumentPreview.tsx`.
  - Added `h-auto` and `mb-space-xxl` to the paper card container to allow natural expansion and preserve comfortable bottom margin on scroll.
* **Files Modified:**
  - `apps/web/src/components/DocumentPreview.tsx`
  - `docs/EXECUTION_LEDGER.md`
* **Tests Executed and Results:**
  - Browser Verification: **PASS** (Paper card expands to enclose entire diagram, section 3, math equations, and footer cleanly).
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 11/11 test files, 46/46 tests passed**).
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed with 0 snapshot mutations**).
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**).
  - `npx pnpm --filter web build` (**PASS: 0 errors**, built in 3.46s).
* **Acceptance Criteria:**
  - [x] Paper sheet dynamically grows to contain all content regardless of document length.
  - [x] No diagram, formula, or text nodes spill into the gray background.
  - [x] All 46 validation tests and 17 fidelity lab fixtures pass.
  - [x] Web lint and production build pass with zero errors.
