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

* **Next Allowed Roadmap:** AI-Native Workspace Expansion (Tasks P13 - P17, documented in [17_AI_WORKSPACE_STRATEGY_AND_PLAN.md](file:///d:/mdtodocs/md-to-docs/docs/17_AI_WORKSPACE_STRATEGY_AND_PLAN.md))

---

## Task P13: Table Copy-Paste Fidelity Engine
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the Table Copy-Paste Fidelity Engine to eliminate friction when moving Markdown tables into spreadsheet tools (Excel, Google Sheets, Numbers) or documents (Word, Docs).
  - Created `packages/renderers/src/tableClipboard.ts`:
    - `serializeTableToTsv`: Formats table as Tab-Separated Values (`text/plain`), flattening multiline cells to spaces so columns don't shift. Pastes directly into spreadsheet cell grids.
    - `serializeTableToCsv`: RFC 4180 compliant CSV serializer with comma and quote escaping.
    - `serializeTableToHtml`: Self-contained styled HTML table (`text/html`) with light gray borders, shaded header rows, and cell alignment.
    - `serializeTableToMarkdown`: Clean GFM table serializer with column padding, alignment markers (`:---`, `:---:`, `---:`), and `<br />` cell newline preservation.
    - `copyTableToClipboard`: Multi-mime clipboard writer supporting `text/html` + `text/plain` for spreadsheet grids and rich docs.
  - Created `apps/web/src/components/InteractiveTable.tsx`:
    - Floating action pill above rendered tables with buttons: `[Copy for Excel/Sheets]`, `[CSV]`, `[TSV]`, and `[Markdown]`.
    - Real-time feedback state displaying checkmark and confirmation (`Copied Excel!`, etc.).
    - Annotated with `data-print-hide` so print and PDF export remain clean.
  - Integrated `InteractiveTable` into `DocumentPreview.tsx`.
* **Files Changed:**
  - `packages/renderers/src/tableClipboard.ts` (New module: table parsers, serializations, clipboard handler)
  - `packages/renderers/src/index.ts` (Exported table clipboard functions)
  - `packages/validation/tests/table-clipboard.test.ts` (New test suite: 4 unit tests covering TSV, CSV, HTML, and Markdown)
  - `apps/web/src/components/InteractiveTable.tsx` (New component: table wrapper with action pill)
  - `apps/web/src/components/DocumentPreview.tsx` (Replaced basic table renderer with `InteractiveTable`)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 12/12 test files, 50/50 tests passed**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 10.54s)
  - Browser Subagent Verification: **PASS** (Verified all 4 copy buttons in live app, verified clipboard actions and visual confirmation states)
* **Acceptance Criteria:**
  - [x] Floating action pill appears above preview tables with Excel, CSV, TSV, and Markdown copy actions.
  - [x] TSV, CSV, HTML, and Markdown serializations correctly format table structure and alignments.
  - [x] Multi-mime clipboard copy writes HTML and TSV for Excel/Sheets paste.
  - [x] Action pill is hidden on print/PDF export (`data-print-hide`).
  - [x] All 50 validation tests pass and production build succeeds.

* **Next Allowed Prompt:** Task P14: Mermaid Export Suite & Theme Selector

---

## Task P14: Mermaid Export Suite & Theme Selector
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Complete the Mermaid diagram export suite and syntax debugging system to solve diagram rendering failures and export friction for developers.
  - Created `apps/web/src/components/MermaidDiagram.tsx`:
    - **Multi-Format Export & Clipboard**:
      - `Copy Image`: Writes PNG blob directly to system clipboard via `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` for instant pasting into Slack, Linear, Google Docs, or Word.
      - `Copy SVG` & `Copy Source`: Single-click clipboard actions with checkmark feedback.
      - `Download SVG`: Vector export with UTF-8 XML encoding.
      - `Download PNG`: High-resolution 2x Retina canvas rasterization with transparent/white background.
      - `Download JPEG`: Compressed rasterization on solid `#ffffff` canvas background.
    - **Theme Selector**: Dynamic dropdown supporting `neutral`, `default`, `dark`, `forest`, and `base` with real-time re-rendering and theme-matched background containers.
    - **Interactive Syntax Error Debugger with Line-Number Highlighting**:
      - Parses Mermaid runtime exception messages to extract the failing line number (e.g., `Line 5`).
      - Renders numbered code lines and highlights the exact syntax error line in red with an explicit arrow indicator (`← Syntax error here`).
      - Offers toggleable `Debug Source` / `Hide Details` view.
    - **Print & PDF Safety**: Tagged with `data-print-hide` so export buttons never bleed into printed documents.
  - Modularized `DocumentPreview.tsx` by extracting inline Mermaid logic into `MermaidDiagram.tsx`.
* **Files Changed:**
  - `apps/web/src/components/MermaidDiagram.tsx` (New component with theme selector, JPEG/PNG/SVG export, and syntax debugger)
  - `apps/web/src/components/DocumentPreview.tsx` (Cleaned up imports and wired `MermaidDiagram`)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.42s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 12/12 test files, 50/50 tests passed**)
  - Browser Subagent Verification: **PASS** (Verified Theme dropdown, 'dark' and 'forest' themes, 'Copy Image', 'JPEG' export, and verified the interactive syntax error debugger with line 5 highlight and error banner).
* **Acceptance Criteria:**
  - [x] JPEG export with white canvas background downloads cleanly.
  - [x] Theme selector dynamically switches between neutral, default, dark, and forest palettes.
  - [x] Copy Image writes image/png directly to clipboard.
  - [x] Mermaid syntax error displays exact line number and highlights offending code line.
  - [x] Web build, lint, and all 50 validation tests succeed.

* **Next Allowed Prompt:** Task P15: JSON & Code Block Live Formatter

---

## Task P15: JSON & Code Block Live Formatter
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the JSON & Code Block Live Formatter to prevent broken copy-pasted code snippets, handle JSON comments, and provide rich syntax highlighting and line numbering.
  - Created `packages/renderers/src/codeFormatter.ts`:
    - `stripJsonComments`: Strips single-line (`//`) and multi-line (`/* */`) comments from JSON-like text.
    - `formatJsonCode`: Validates, parses, detects comments, and auto-indents JSON strings with 2 spaces.
    - `beautifyCode`: Normalizes tabs to spaces and trims trailing whitespace across code languages.
  - Created `packages/validation/tests/code-formatter.test.ts`:
    - Added 5 unit tests covering comment stripping, auto-indentation, comment detection for API requests, invalid JSON handling, and tab beautification.
  - Created `apps/web/src/components/InteractiveCodeBlock.tsx`:
    - Integrated with Prism.js for syntax highlighting (JavaScript, TypeScript, Python, Bash, SQL, JSON, YAML, Markdown, CSS, HTML).
    - Header displays language tag, line count, and dynamic `valid json` / `syntax error` status.
    - **Actions**:
      - `Copy Clean JSON`: Appears when JSON has comments; strips comments before copying to prevent 400 Bad Request API errors.
      - `Copy`: Copies formatted code to clipboard with real-time checkmark confirmation.
      - `Format`: Toggles between formatted/pretty-printed and raw code.
      - `Lines`: Toggles numbered line gutter on and off.
    - Tagged with `data-print-hide` for clean print/PDF export.
  - Integrated `InteractiveCodeBlock` into `DocumentPreview.tsx` for all `<pre><code>` blocks.
* **Files Changed:**
  - `packages/renderers/src/codeFormatter.ts` (New module: JSON comment stripping, validation, formatting, beautification)
  - `packages/renderers/src/index.ts` (Exported code formatting utilities)
  - `packages/validation/tests/code-formatter.test.ts` (New test suite: 5 unit tests)
  - `apps/web/src/components/InteractiveCodeBlock.tsx` (New component with syntax highlighting, line numbers, and action bar)
  - `apps/web/src/components/DocumentPreview.tsx` (Wired `InteractiveCodeBlock`)
  - `apps/web/src/index.css` (Added Prism syntax highlighting color tokens)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 13/13 test files, 55/55 tests passed**)
  - `npx pnpm --filter web lint` (**PASS: 0 warnings, 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 27.14s)
  - Browser Subagent Verification: **PASS** (Verified language pill, line count, `valid json` badge, `Lines` toggle on/off, `Copy Clean JSON` feedback, `Copy` feedback, and Prism syntax coloring).
* **Acceptance Criteria:**
  - [x] Code blocks render with language pill, line counts, and line numbers.
  - [x] JSON blocks detect validity and presence of comments.
  - [x] "Copy Clean JSON" strips comments for clean API usage.
  - [x] "Lines" toggles line numbering.
  - [x] Web build, lint, and all 55 validation tests succeed.

* **Next Allowed Prompt:** Task P16: Headless Agent API

---

## Task P16: Headless Agent API
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the Headless Agent API (`apps/api` - `@mdtodocs/api`) designed for AI pipelines, CI/CD document validation, and programmatic rendering without requiring a browser UI.
  - Created `apps/api/package.json` and `apps/api/tsconfig.json`:
    - Configured `@mdtodocs/api` with module resolution and types for Node globals and workspace dependencies.
  - Created `apps/api/src/validator.ts`:
    - `extractMarkdownMetrics`: Computes word count, lines, headings, tables, diagrams, code blocks, math expressions, and reading time.
    - `validateHeadlessDocument`: Validates Markdown AST, identifies ragged-row tables, catches empty or malformed Mermaid code blocks, and evaluates destination planning against `google-docs`, `word-docx`, or `clipboard`.
  - Created `apps/api/src/server.ts`:
    - Pure lightweight Node `http.createServer` with zero extra web framework overhead.
    - Comprehensive CORS headers and JSON body parser.
    - Endpoints:
      - `GET /api/v1/health`: Server health check, uptime, and version.
      - `POST /api/v1/validate`: Validates markdown, returning `{ valid, errors, warnings, metrics }`.
      - `POST /api/v1/render`: Renders to `docx` (base64 DOCX binary), `html` (standalone HTML document), or `clipboard` (Google Docs paste-optimized HTML), returning file payload, mimeType, and document metrics.
      - `POST /api/v1/repair`: Accepts `originalMarkdown` and `wordDocx` (or comments array), reconciles comment anchors and resolutions, and returns repaired markdown with patch changelog.
  - Created `apps/api/src/index.ts`: Executable entrypoint supporting `PORT` environment variable.
  - Created `packages/validation/tests/headless-api.test.ts`:
    - Added 6 comprehensive integration tests against ephemeral server instances testing:
      1. `/health` ping.
      2. `/validate` with clean Markdown.
      3. `/validate` flagging ragged tables and malformed Mermaid syntax.
      4. `/render` producing base64 DOCX binary.
      5. `/render` producing HTML markup.
      6. `/repair` applying comment updates and patch reconciliation.
* **Files Changed:**
  - `apps/api/package.json` (New package config)
  - `apps/api/tsconfig.json` (New TS config)
  - `apps/api/src/validator.ts` (Markdown validation & metrics extraction)
  - `apps/api/src/server.ts` (HTTP server & endpoint routes)
  - `apps/api/src/index.ts` (Server launcher)
  - `packages/validation/tests/headless-api.test.ts` (New test suite: 6 integration tests)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/api build` (**PASS: 0 errors**, compiled cleanly to `dist/`)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 14/14 test files, 61/61 tests passed in 27.64s**)
* **Acceptance Criteria:**
  - [x] Lightweight Node HTTP server supports `/api/v1/health`, `/api/v1/validate`, `/api/v1/render`, and `/api/v1/repair`.
  - [x] Table validation detects ragged rows without throwing crashes.
  - [x] Mermaid block validation flags malformed/empty diagrams.
  - [x] Render endpoint supports DOCX base64, HTML, and clipboard outputs.
  - [x] Repair endpoint reconciles comment annotations back to Markdown.
  - [x] All 61 validation tests pass.

* **Next Allowed Prompt:** Task P17: Stakeholder Review Mode

---

## Task P17: Stakeholder Review Mode
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the Stakeholder Review Mode for clean, distraction-free executive review and collaboration:
    - URL query toggle (`?mode=review` / `?view=review`) and top-bar toggle in the UI.
    - Deep-linking support: initializing directly with `?mode=review` activates presentation mode on page load.
    - When active, hides the editor pane, raw markdown, and sidebars, centering the document sheet as the visual hero (adhering to Law 165: "Document as hero").
    - Created `apps/web/src/components/ReviewActionBar.tsx`:
      - Sticky glassmorphic bar positioned cleanly above the document sheet.
      - Displays `Review Mode` pill with live pulsing indicator, reading time, word count, quick export buttons (`Google Docs`, `Word`, `PDF`), and `Exit` button.
      - Includes `data-print-hide` so controls are never printed or exported to PDF.
    - Created `apps/web/src/components/SuggestEditModal.tsx`:
      - Allows non-technical stakeholders to highlight document passages and propose revisions or feedback.
      - Includes `Open GitHub Issue` (generates pre-filled issue link with quoted passage and markdown suggestion) and `Copy Suggestion` (copies structured Markdown review note to clipboard with real-time checkmark confirmation).
    - Updated `apps/web/src/store/index.ts` to manage `isReviewMode` state and synchronize with browser `window.history`.
    - Updated `apps/web/src/components/Header.tsx` to include the Review Mode toggle button with icon and tooltip.
    - Updated `apps/web/src/components/DocumentPreview.tsx` to adapt container styling in review mode.
    - Updated `apps/web/src/components/Workspace.tsx` to switch seamlessly between two-pane authoring and distraction-free presentation.
* **Files Changed:**
  - `apps/web/src/store/index.ts` (Added `isReviewMode` state and URL search param synchronization)
  - `apps/web/src/components/SuggestEditModal.tsx` (New component: stakeholder feedback modal and GitHub issue generator)
  - `apps/web/src/components/ReviewActionBar.tsx` (New component: floating review mode toolbar and quick actions)
  - `apps/web/src/components/Header.tsx` (Added review mode toggle button to header actions)
  - `apps/web/src/components/DocumentPreview.tsx` (Added `isReviewMode` prop and adaptive container styling)
  - `apps/web/src/components/Workspace.tsx` (Wired review mode presentation layout, modal, and action bar)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 9.39s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**, 1 non-blocking warning in Mermaid)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 14/14 test files, 61/61 tests passed in 25.55s**)
  - Browser Subagent Verification: **PASS**
    - Verified Header `Review Mode` button toggle.
    - Verified centered presentation layout, hidden editor pane, hidden status bar, and floating `ReviewActionBar` with reading time and word count.
    - Verified `SuggestEditModal` opens, accepts feedback input, and executes `Copy Suggestion` with confirmation.
    - Verified smooth return to split editor layout via `Exit`.
    - Verified direct URL navigation (`?mode=review`) automatically activates review mode.
* **Acceptance Criteria:**
  - [x] Review Mode toggle works in Header and ReviewActionBar.
  - [x] Review layout hides editor pane and centers document sheet cleanly.
  - [x] URL synchronizes with `?mode=review` and supports direct deep-linking.
  - [x] Suggest Edit modal allows feedback submission, GitHub issue creation, and Markdown copying.
  - [x] All 61 validation tests and web build pass.

* **Next Allowed Prompt:** Task P18: Cmd+K / Ctrl+K Command Palette

---

## Task P18: Cmd+K / Ctrl+K Command Palette
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the keyboard-driven Command Palette (`apps/web/src/components/CommandPalette.tsx`) according to `docs/13_COMMAND_PALETTE.md`:
    - Global keyboard shortcut: `⌘K` on macOS, `Ctrl+K` on Windows/Linux.
    - Trigger button in Header with `⌘K` badge, and trigger button on ReviewActionBar.
    - Search input with instant filtering across title, description, category, and keywords.
    - Categorized actions:
      - **Export & Share**: Copy for Google Docs (`Alt+C`), Download Word Document (`Alt+W`), Export PDF (`Alt+P`), Copy Plain Markdown.
      - **Destination**: Switch destination between Google Docs, Microsoft Word, PDF, and Rich Clipboard with active indicator.
      - **View & Modes**: Enter/Exit Stakeholder Review Mode, Suggest an Edit, Open Document Inspector, Open Fidelity Check Panel.
      - **Theme & Typography**: Modern Default (Corporate), Clean Editorial (Minimalist), Technical Dark, compact/standard/large font sizes, and Document Signature toggle.
      - **Document Headings (Dynamic Navigation)**: Parses `#`, `##`, `###` headings from active markdown; selecting jumps and scrolls the preview smoothly to that heading.
    - Full keyboard navigation: ArrowUp/ArrowDown, Enter to run, Escape to dismiss.
    - Print safety: `data-print-hide` so the palette never appears in exports.
  - Centralized export helpers created in `apps/web/src/utils/exportHelpers.ts` to deduplicate logic across `Header.tsx`, `ReviewActionBar.tsx`, and `CommandPalette.tsx`.
* **Files Changed:**
  - `apps/web/src/utils/exportHelpers.ts` (New module: centralized export, clipboard, and print routines)
  - `apps/web/src/components/CommandPalette.tsx` (New component: command palette modal, fuzzy search, heading extractor)
  - `apps/web/src/store/index.ts` (Added `isCommandPaletteOpen`, `isInspectorOpen`, `isFidelityPanelOpen`, `isSuggestModalOpen`)
  - `apps/web/src/App.tsx` (Global `Cmd+K` / `Ctrl+K` keyboard event listener, CommandPalette wiring)
  - `apps/web/src/components/Header.tsx` (Added Command Palette accelerator button, cleaned up exports)
  - `apps/web/src/components/ReviewActionBar.tsx` (Added Command Palette trigger button, cleaned up exports)
  - `apps/web/src/components/Workspace.tsx` (Connected modal visibility hooks to store)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.63s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 14/14 test files, 61/61 tests passed in 16.83s**)
  - Browser Subagent Verification: **PASS**
    - Verified Header `Commands ⌘K` button.
    - Verified opening modal with auto-focused search and category organization.
    - Verified keyword filtering ('word', 'heading', 'review').
    - Verified dynamic document heading extraction (`1. Overview`, `2. Request Routing Architecture`).
    - Verified running 'Enter Stakeholder Review Mode' from palette.
    - Verified opening palette from Review Mode via `Ctrl+K` and executing 'Exit Review Mode'.
* **Acceptance Criteria:**
  - [x] Command Palette opens via `⌘K` / `Ctrl+K` or Header button.
  - [x] Commands categorized by Export, Destination, View, Theme, and Headings.
  - [x] Arrow key navigation and Enter execution work seamlessly.
  - [x] Document headings are extracted dynamically and allow quick jumping.
  - [x] All 61 validation tests and web build pass.

* **Next Allowed Prompt:** Task P19: Executive Template Gallery

---

## Task P19: Executive Template Gallery
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the Executive Template Gallery featuring production-grade, highly structured starter templates across engineering, product, architecture, reliability, and project management.
  - Created `apps/web/src/data/templates.ts`:
    - 5 executive templates:
      1. **Technical RFC & System Design** (Architecture): Distributed Job Queue system design with Mermaid topology, LaTeX queue throughput equation, REST endpoints, and security model.
      2. **Architecture Decision Record ADR-042** (Decisions): Event-driven architecture selection with Mermaid state diagram, trade-off matrix table, and implementation stages.
      3. **Executive PRD** (Product): Multi-tenant enterprise audit log product requirement document with user journey diagram, feature scope table, and OKRs.
      4. **Incident Post-Mortem SEV-1** (Reliability): Database connection pool exhaustion post-mortem with incident chronology, Mermaid sequence diagram, root cause analysis, and remediation action items.
      5. **Engineering Sprint Retrospective** (Process): Bi-weekly engineering retrospective with velocity chart, sprint scorecard, what went well / didn't go well, and commitments.
  - Created `apps/web/src/components/TemplateGalleryModal.tsx`:
    - Modal dialog displaying category filter pills (`All`, `Architecture`, `Decisions`, `Product`, `Reliability`, `Process`).
    - Search input filtering template title, description, tags, and category.
    - Template cards displaying category badges, word/line counts, tags, preview summary, and `Load Template` action.
    - Safe replacement confirmation modal: if editor has unsaved content, prompts user before overwriting (`Replace & Load` vs `Cancel`).
    - Annotated with `data-print-hide`.
  - Enhanced `apps/web/src/components/EmptyState.tsx`:
    - Added "Start with an Executive Template" 3-card showcase directly beneath the file upload dropzone.
    - One-click loading of RFC, ADR, or PRD directly from empty state.
  - Enhanced `apps/web/src/components/CommandPalette.tsx`:
    - Added `Templates & Starters` category.
    - Added `Browse Executive Template Gallery...` command to open the modal.
    - Added instant direct commands for each template: `Load RFC Template`, `Load ADR Template`, `Load PRD Template`, `Load Post-Mortem Template`, `Load Retrospective Template`.
  - Updated `apps/web/src/components/Header.tsx`:
    - Added `Templates` button with icon `collections_bookmark` and badge.
  - Updated `apps/web/src/store/index.ts`:
    - Added `isTemplateGalleryOpen` state and action setter `setIsTemplateGalleryOpen`.
* **Files Changed:**
  - `apps/web/src/data/templates.ts` (New module: 5 executive templates and metadata)
  - `apps/web/src/components/TemplateGalleryModal.tsx` (New component: template gallery modal with category filter, search, preview, and safe replacement confirmation)
  - `apps/web/src/components/EmptyState.tsx` (Added executive template cards showcase)
  - `apps/web/src/components/CommandPalette.tsx` (Added template commands and quick loading)
  - `apps/web/src/components/Header.tsx` (Added Templates button in header navigation)
  - `apps/web/src/store/index.ts` (Added template gallery modal visibility state)
  - `apps/web/src/App.tsx` (Wired `TemplateGalleryModal` component)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.47s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 14/14 test files, 61/61 tests passed in 12.58s**)
  - Browser Subagent Verification: **PASS** (`verify_template_gallery_1792215997005.webp`)
    - Verified Header `Templates` button opens Template Gallery modal.
    - Verified category filter buttons (`Decisions`, `Reliability`, etc.).
    - Verified selecting ADR-042 prompts replacement confirmation when editor is dirty.
    - Verified `Replace & Load` cleanly replaces editor content and updates live document preview with Mermaid state diagram and decision matrix.
    - Verified Command Palette search ('incident', 'template') shows template actions.
* **Acceptance Criteria:**
  - [x] Template Gallery modal provides 5 executive templates across Architecture, Decisions, Product, Reliability, and Process.
  - [x] Filtering by category and searching by title/tag works instantaneously.
  - [x] Replacement confirmation protects active editor content from accidental loss.
  - [x] Empty state showcases top executive templates for instant 1-click start.
  - [x] Command Palette integrates template browsing and direct loading.
  - [x] All 61 validation tests and web build pass.

* **Next Allowed Prompt:** Task P20: In-Browser Word / Comment Reconciliation UI

---

## Task P20: In-Browser Word / Comment Reconciliation UI
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the In-Browser Word / Comment Reconciliation UI & Engine to solve the primary stakeholder review roundtrip:
    - Ingest review feedback from 3 distinct sources:
      1. **Word (.docx) files**: Extracts reviewer comments from `word/comments.xml` and anchors from `word/document.xml`, as well as OpenXML Track Changes (`<w:del>` + `<w:ins>`).
      2. **Pasted Review Notes**: Automatically parses JSON arrays, `SuggestEditModal` markdown notes, Key-Value pairs (`Target:` / `Replacement:` / `Comment:`), and blockquote diffs (`> target\nreplacement`).
      3. **Manual Patches**: Fast form with target text, replacement text, reviewer name, and comment reason.
    - Heuristically infers replacements from comment text (e.g., `Replace with: 250ms p99 SLA`, `Change to: PostgreSQL 16`, `Did you mean "TLS 1.3"?`).
    - Evaluates match status against active editor Markdown:
      - `Ready to Apply` with exact line number in source Markdown.
      - `Already in Document` if the proposed replacement text is already present.
      - `Target Not Found` with warning badge if target text was moved or modified.
    - Visual Diff Cards:
      - Red strikethrough for original text in document.
      - Green highlight for proposed replacement text.
      - Inline editable replacement input allowing author to fine-tune wording before applying.
      - Author tag and comment reason.
      - Single-click patch removal or selection.
    - Full Document Diff Preview:
      - Toggles a complete markdown preview showing the document with accepted patches applied.
    - Batch Operations:
      - `Accept All Matched (N)`: Updates active editor Markdown immediately in `useStore` and closes modal.
      - `Apply Selected (N)`: Applies only checked patches.
      - Filter pills: `All`, `Matched`, `Unmatched`, `Applied`.
    - Integrations:
      - `Reconcile` button in Header navigation with `sync_alt` icon.
      - `Reconcile Word Comments & Review Edits...` command in `Cmd+K` / `Ctrl+K` Command Palette.
      - Enhanced `/api/v1/repair` in Headless API (`apps/api/src/server.ts`) to support `docxBase64`, `reviewNotes`, and `edits`.
    - Annotated with `data-print-hide` so review chrome is omitted from exports.
* **Files Changed:**
  - `packages/renderers/src/reconciliation.ts` (New module: docx comment extractor, review notes parser, replacement inferrer, and markdown reconciler)
  - `packages/renderers/src/index.ts` (Exported reconciliation engine functions and types)
  - `packages/validation/tests/reconciliation.test.ts` (New test suite: 10 unit tests for docx parsing, track changes, review notes, and markdown reconciliation)
  - `apps/api/src/server.ts` (Enhanced `/api/v1/repair` route to support docxBase64, reviewNotes, and structured edits)
  - `apps/web/src/components/ReconciliationModal.tsx` (New component: full reconciliation studio modal with Word dropzone, notes parser, visual diff cards, and diff preview)
  - `apps/web/src/components/Header.tsx` (Added Reconcile button)
  - `apps/web/src/components/CommandPalette.tsx` (Added Reconcile command)
  - `apps/web/src/store/index.ts` (Added `isReconciliationModalOpen` state and setter)
  - `apps/web/src/App.tsx` (Wired `ReconciliationModal` component)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**, compiled cleanly with JSZip)
  - `npx pnpm --filter @mdtodocs/api build` (**PASS: 0 errors**, compiled cleanly to `dist/`)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 15/15 test files, 71/71 tests passed in 20.08s**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed with 0 snapshot mutations**)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**, 1 Mermaid warning)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.22s)
  - Browser Subagent Verification: **PASS** (`verify_reconciliation_ui_1792216713822.webp`)
    - Verified Header `Reconcile` button with `sync_alt` icon.
    - Verified opening `Reconciliation & Review Patch Studio` modal.
    - Verified 'Try Sample Edits' button parses 3 review patches and renders visual diff cards with red/green strikethrough/highlighting and reviewer author badges.
    - Verified 'Preview Changes' button displays resulting markdown preview.
    - Verified 'Accept All Matched' applies patches to the active editor Markdown and closes modal.
    - Verified Command Palette search ('reconcile') shows 'Reconcile Word Comments & Review Edits...'.
* **Acceptance Criteria:**
  - [x] In-browser Word and comment reconciliation engine extracts Word comments and track-changes from `.docx` files.
  - [x] Review notes parser handles JSON, SuggestEditModal markdown, key-value pairs, and blockquote diffs.
  - [x] Visual diff cards show original strikethrough and proposed replacement with editable inputs.
  - [x] Full document preview shows patched markdown before accepting.
  - [x] Accept All Matched updates active document and live preview in real time.
  - [x] Headless API `/api/v1/repair` supports docxBase64, reviewNotes, and edits payloads.
  - [x] All 71 validation tests and 17 fidelity lab tests pass.

* **Next Allowed Prompt:** Task P21: Multi-Document Local Workspace & History

---

## Task P21: Multi-Document Local Workspace & History
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build the Multi-Document Local Workspace & History system to support multi-document authoring, project switching, and version rollback entirely in-browser:
    - Pure Document Management Engine (`packages/renderers/src/documentManager.ts`):
      - `extractDocumentTitle`: Parses Markdown AST / regex to extract first `# Heading` or frontmatter title, falling back to first non-empty line or untitled default.
      - `createDocumentItem`: Generates fresh document item with unique UUID, timestamp, title, and initial Markdown.
      - `duplicateDocumentItem`: Clones existing document with `(Copy)` suffix, new ID, and current timestamp.
      - `createDocumentSnapshot`: Captures timestamped version snapshot with custom label, word count, line count, and character metrics.
      - `restoreDocumentSnapshot`: Safely restores document content from snapshot, automatically generating a pre-restore safety backup to eliminate accidental data loss.
    - Zustand Store Architecture (`apps/web/src/store/index.ts`):
      - Multi-document state: `documents: DocumentItem[]`, `activeDocumentId: string`, `snapshots: DocumentSnapshot[]`, `isHistoryModalOpen: boolean`.
      - Actions: `createDocument`, `switchDocument`, `renameDocument`, `duplicateDocument`, `deleteDocument`, `createSnapshot`, `restoreSnapshot`, `deleteSnapshot`, `setHistoryModalOpen`.
      - Auto-migration: Automatically migrates single-document `markdown` state into `documents[0]` on initial load without data loss.
      - Live keystroke synchronization: Synchronizes `setMarkdown` with the active document entry in `documents` so tab titles and storage stay updated.
    - Document Tab Bar (`apps/web/src/components/DocumentTabBar.tsx`):
      - Sleek horizontal tab bar positioned above the split panes.
      - Active tab styling with live title, inline rename input on double-click, and close button (`✕`) guarded against closing the sole remaining document.
      - `+ New Doc` button for instant document creation.
      - `📸 Snapshot` button for 1-click snapshot creation with visual feedback.
      - `🕐 History (N)` button with dynamic snapshot count badge opening the History modal.
      - Duplicate document action.
      - Tagged with `data-print-hide` to ensure 100% clean Word and PDF exports.
    - Document History Modal (`apps/web/src/components/DocumentHistoryModal.tsx`):
      - Chronological timeline of all version snapshots for the active document.
      - Snapshot cards displaying title, label, relative timestamp, word count, and line count.
      - Collapsible markdown excerpt preview.
      - `Restore Version` action with pre-restore safety snapshot.
      - `Copy Content` action for copying snapshot text without rolling back.
      - Snapshot deletion action.
    - Global Integrations:
      - `apps/web/src/components/Workspace.tsx`: Integrated `<DocumentTabBar />` above editor/preview grid.
      - `apps/web/src/components/Header.tsx`: Displays active document title dynamically next to logo.
      - `apps/web/src/components/CommandPalette.tsx`: Added `Documents & Workspace` category with commands (`Create New Document`, `Duplicate Current Document`, `Capture Document Snapshot`, `Browse Document History & Snapshots...`) and dynamic open tabs switcher.
      - Pre-mutation safety snapshots: Wired automatic snapshot capture before loading templates (`TemplateGalleryModal.tsx`) and before applying reconciliation patches (`ReconciliationModal.tsx`).
* **Files Changed:**
  - `packages/renderers/src/documentManager.ts` (New module: document title extraction, cloning, snapshots, and pre-restore backups)
  - `packages/renderers/src/index.ts` (Exported document manager functions and types)
  - `packages/validation/tests/multi-document.test.ts` (New test suite: 8 unit tests for multi-document operations)
  - `apps/web/src/store/index.ts` (Added multi-document and snapshot state, actions, and auto-migration)
  - `apps/web/src/components/DocumentTabBar.tsx` (New component: horizontal tab strip with inline rename, snapshot trigger, and history badge)
  - `apps/web/src/components/DocumentHistoryModal.tsx` (New component: version history timeline modal with snapshot restore and excerpt preview)
  - `apps/web/src/components/Workspace.tsx` (Integrated DocumentTabBar above editor/preview panes)
  - `apps/web/src/components/Header.tsx` (Synced active document title display)
  - `apps/web/src/components/CommandPalette.tsx` (Added Documents & Workspace commands and open document tab switcher)
  - `apps/web/src/components/TemplateGalleryModal.tsx` (Added pre-template safety snapshot)
  - `apps/web/src/components/ReconciliationModal.tsx` (Added pre-reconciliation safety snapshot)
  - `apps/web/src/App.tsx` (Wired DocumentHistoryModal)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/renderers build` (**PASS: 0 errors**, compiled cleanly)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 16/16 test files, 79/79 tests passed in 14.18s**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 tests passed with 0 snapshot mutations**)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 8.01s)
  - Browser Subagent Verification: **PASS** (`verify_multidoc_workspace_1792217976525.webp`)
    - Verified initial tab bar with active document title and `+ New Doc` button.
    - Verified clicking `+ New Doc` opens a clean new tab, and typing `# Distributed Tracing Architecture (RFC-404)` dynamically updates the tab title and header.
    - Verified opening Document History modal, capturing `Draft v1 Checkpoint` snapshot, and displaying timeline card with word/line counts.
    - Verified switching back to original document tab seamlessly restores original Markdown and preview.
    - Verified Command Palette search for 'document' lists document actions and open tabs for quick switching.
* **Acceptance Criteria:**
  - [x] Multi-document tab bar supports creating, switching, renaming, duplicating, and closing documents.
  - [x] Auto-migration preserves user's existing markdown seamlessly in localStorage.
  - [x] Version history captures timestamped snapshots with custom labels and word/line counts.
  - [x] Restoring snapshots automatically captures a pre-restore backup to prevent accidental loss.
  - [x] Template and reconciliation actions take automatic safety snapshots before document mutation.
  - [x] Command Palette integrates document switching and snapshot commands.
  - [x] All 79 validation tests, 17 fidelity lab fixtures, and web production build pass.

* **Next Allowed Prompt:** Task P22: Impeccable Design Overhaul & Publication Craft

---

### Task P22: Impeccable Design Overhaul & Publication Craft
* **Status:** Completed
* **Implementation Summary:**
  - Audited Paul Bakaus' `pbakaus/impeccable` design methodology (Operate, Craft Floor, Distill, Colorize, Depth, Typeset, Onboard, Delight, Polish).
  - **Phase 1: Workspace Architecture & Toolbar Distillation (`/impeccable distill` & `layout`)**:
    - Consolidated 3 stacked toolbar rows (120px+ vertical clutter) into 2 cohesive bands:
      1. Unified Header (`Header.tsx`): Grouped `Commands ⌘K`, `Templates`, and `Reconcile` into an ergonomic tool cluster. Kept clean active doc title and high-contrast primary export button.
      2. Studio Control Strip (`DocumentTabBar.tsx`): Open tabs on left; Appearance popover (`tune` icon), Zoom stepper (`- 100% +`), Snapshot trigger, History badge, and Details inspector on right.
    - Purged redundant secondary `Target: PDF` dropdown and 4 raw native `<select>` tags (`Theme`, `Size`, `Signature`) from `DocumentPreview.tsx`.
    - Implemented floating `Document Appearance` popover with theme selection (`Default`, `Clean`, `Dark`), font size stepper (`- [N] pt +`), and signature placement.
    - Streamlined `DocumentEditor.tsx`: Clean `Markdown [GFM]` subheader with tabular-num counters; removed redundant bottom status bar.
    - Added `zoom: number` and `setZoom` to Zustand `useStore` (`apps/web/src/store/index.ts`).
  - **Phase 2 & 3: Palette Harmonization, Paper Elevation & Browser Surface Theming (`/impeccable colorize`, `depth`, `typeset`, `craft-floor`)**:
    - `apps/web/src/index.css`: Injected themed browser surfaces (`::selection` with soft dark tint, `caret-color: #1b1c1d`, `:focus-visible` offset ring, `.tabular-nums` for counters/time/code, `text-underline-offset: 3px`).
    - `DocumentPreview.tsx`: Set preview pane background to subtle architectural cool-gray canvas (`bg-[#f1f3f5]`).
    - `DocumentPreview.tsx`: Applied multi-layered diffused paper elevation to rendered document: `shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_28px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] bg-[#ffffff]`.
    - `DocumentPreview.tsx`: Replaced screen-flashing 50% opacity compiling spinner overlay with an elegant top hairline compiler progress indicator (`h-0.5 bg-primary animate-pulse`).
    - `DocumentEditor.tsx`: Set editor container background to crisp `#ffffff` with `border-r border-outline-variant/30` for optical separation between editor, canvas, and stationery.
  - **Phase 4: Authentic Onboarding (`/impeccable onboard`)**:
    - `EmptyState.tsx`: Purged fake macOS traffic-light window chrome (`#dbdad7`).
    - Redesigned `EmptyState.tsx` into an executive drafting studio with native drag-and-drop file upload (`.md`, `.markdown`, `.txt`), direct typing canvas, and 1-click starter templates.
    - Added comprehensive keyboard accelerator guide (`⌘K` Command Palette, `Alt+N` New Tab, `Alt+W` Close, `Alt+C` Copy).
  - **Phase 5: Delight, Micro-Interactions & Final Audit (`/impeccable delight` & `polish`)**:
    - Verified cross-fade motion in `loading-button.tsx`, tactile feedback, and theme persistence.
    - Fixed Header border boundary rule to `border-b border-outline-variant/30`.
* **Files Changed:**
  - `apps/web/src/index.css` (Browser surface theming: selection, caret, focus rings, tabular numbers)
  - `apps/web/src/store/index.ts` (Added zoom state and actions to useStore)
  - `apps/web/src/components/Header.tsx` (Grouped tools cluster, corrected bottom border)
  - `apps/web/src/components/DocumentTabBar.tsx` (Appearance popover with theme, font size, signature, and zoom stepper)
  - `apps/web/src/components/DocumentEditor.tsx` (Crisp white drafting background, optical border separation, GFM subheader)
  - `apps/web/src/components/DocumentPreview.tsx` (Cool-gray canvas, multi-layered paper shadow, hairline compile indicator)
  - `apps/web/src/components/EmptyState.tsx` (Authentic studio drafting canvas, dropzone, starter templates, keyboard cheatsheet)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.75s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 16/16 test files, 79/79 tests passed in 12.67s**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 fixtures passed**)
  - Browser Subagent Verification: **PASS** (`impeccable_phase2_4_verify_1792225791887.webp`)
    - Screenshot 1 (`workspace_canvas_elevation_1792225806726.png`): Cool-gray drafting canvas with multi-layered diffused paper shadow and clean two-band toolbar layout.
    - Screenshot 2 (`emptystate_onboarding_screen_1792225817900.png`): Authentic executive drafting studio, zero fake window chrome, drag-and-drop file dropzone, starter templates, and keyboard accelerator chips.
    - Screenshot 3 (`document_loaded_workspace_1792225831014.png`): 1-click template loading back into workspace without screen flashing.
* **Acceptance Criteria:**
  - [x] Toolbar sprawl distilled into two clean bands (Header + Studio Control Strip).
  - [x] Fake OS window chrome / traffic lights removed from EmptyState.
  - [x] Studio canvas contrast and multi-layered paper elevation implemented.
  - [x] Compiling indicator converted to non-intrusive hairline progress indicator.
  - [x] Browser surfaces themed (selection, caret, focus rings, tabular numbers).
  - [x] All 79 validation tests, 17 fidelity lab fixtures, and web production build pass.

* **Next Allowed Prompt:** Task P22: UX Refinements

---

## Task P22: UX Refinements (Headline Group Closing, Subtle Bookmark Prompt, Secondary Mermaid Controls)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Headline Group Closing:**
    - Researched established interaction pattern and visual language in `json-toolkit` (`JSONWorkspace.tsx`).
    - Created reusable accessible `apps/web/src/components/HeadlineGroup.tsx` component with uppercase tracked typography (`font-code-sm text-[11px] font-semibold text-secondary tracking-wider uppercase`), animated chevron indicator (`material-symbols-outlined` with `expand_more` rotating 90 degrees), hover state, badge tones (`default`, `error`, `warning`, `primary`), and full keyboard navigation (`aria-expanded`, Enter/Space).
    - Integrated `HeadlineGroup` across `DocumentInspector.tsx` (collapsible sections for Active Polyfills & Protections, Compiler Diagnostics & Warnings, Document Elements, Export Recommendations) and `FidelityCheckPanel.tsx` (Document Health Summary, Transformations & Diagnostics).
  - **2. Subtle Bookmark Prompt:**
    - Implemented `apps/web/src/components/BookmarkPrompt.tsx` with non-blocking corner notice.
    - Session export tracking: added `sessionExportCount` counter and `recordSuccessfulExport` action to `apps/web/src/store/index.ts` (tracked purely in memory, unpersisted).
    - Wired `recordSuccessfulExport()` across all export trigger points in `apps/web/src/components/Header.tsx` and `apps/web/src/components/ReviewActionBar.tsx`.
    - Gating rule: requires >= 2 successful exports in current session, >= 60 seconds of active session usage, user not currently typing (debounced idle buffer of 2.5s), no active input/textarea/Monaco focus, and compiler not running.
    - Copy: *"Handy little tool, right? Bookmark it for next time."* with platform-aware shortcut hint (`⌘D` on macOS, `Ctrl+D` on Windows/Linux) and directional arrow pointing toward the browser bookmark control.
    - Non-blocking layout: quiet top-right corner notice (`fixed top-14 right-4 z-40`), no modal/backdrop/audio/flashing animation, clear close button.
    - Dismissal persistence: remembers dismissal in `localStorage` under `mdtodocs_bookmark_prompt_dismissed` so it appears at most once per browser.
  - **3. Secondary Mermaid Controls:**
    - Refactored `apps/web/src/components/MermaidDiagram.tsx` to remove the heavy 40px fixed top toolbar bar that pushed diagrams down and cluttered the reading view.
    - Replaced with an unobtrusive floating action pill in the top-right corner (`absolute top-2.5 right-2.5 z-20`) with hover/focus/touch reveal (`opacity-100 [media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100`).
    - Quick primary action: 1-click `Copy` image button with checkmark confirmation.
    - Secondary actions in accessible overflow menu (`more_vert`):
      - Diagram theme picker (Neutral, Default, Dark, Forest, Base).
      - Downloads: SVG (vector), PNG (2x Retina), JPEG (white background).
      - Clipboard: Copy SVG XML, Copy Mermaid Source.
    - Keyboard navigation: Enter/Space to open menu, Escape to close, focus returned to trigger button, outside click detection.
    - Preserved errors: syntax errors remain immediately visible and prominent in the diagram viewport with line number badges and interactive source code debugger.
* **Files Changed:**
  - `apps/web/src/components/HeadlineGroup.tsx` (New component: accessible collapsible section header modeled after JSON workspace)
  - `apps/web/src/components/DocumentInspector.tsx` (Replaced static headers with interactive HeadlineGroups)
  - `apps/web/src/components/FidelityCheckPanel.tsx` (Replaced static headers with interactive HeadlineGroups)
  - `apps/web/src/store/index.ts` (Added `sessionExportCount` and `recordSuccessfulExport` to Zustand store)
  - `apps/web/src/components/Header.tsx` (Wired `recordSuccessfulExport()` to export triggers)
  - `apps/web/src/components/ReviewActionBar.tsx` (Wired `recordSuccessfulExport()` to review export triggers)
  - `apps/web/src/components/BookmarkPrompt.tsx` (New component: subtle value-gated bookmark encouragement)
  - `apps/web/src/App.tsx` (Mounted `BookmarkPrompt`)
  - `apps/web/src/components/MermaidDiagram.tsx` (Refactored controls to secondary floating toolbar and overflow menu)
  - `packages/validation/tests/ux-refinement.test.ts` (New test suite: 8 tests for prompt eligibility, persistence, and headline group contracts)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 31.26s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 87/87 tests passed in 17.27s**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 fixtures passed in 7.0s**)
  - Browser Subagent Verification: **PASS** (`md_to_docs_ux_refinement`)
    - Mermaid diagram prominent, readable, uncluttered by top bar.
    - Floating action pill visible on hover/focus/touch; `more_vert` menu opens with complete download/copy/theme options; Escape dismisses menu.
    - Document Inspector and Fidelity Panel sections collapse and expand with chevron animation and keyboard support.
* **Acceptance Criteria:**
  - [x] Headline group closing replicates established JSON tool interaction and visual language.
  - [x] Subtle bookmark prompt triggers after 2 successful exports and 60s active use, never interrupts typing/preview/export, persists dismissal in localStorage, shows at most once.
  - [x] Mermaid diagram is prominent and readable; controls moved to secondary subtle floating toolbar and overflow menu; keyboard accessibility and errors preserved.
  - [x] All 87 validation tests, 17 fidelity lab fixtures, and web production build pass.

* **Next Allowed Prompt:** Task P23: UI De-Slop & Simplification

---

## Task P23: UI De-Slop & Simplification (VS Code / Raycast Minimalist Turnaround)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Purged Corporate Jargon & Pretentious Marketing Elements:**
    - Removed *"Drafting Studio & Document Engine"* badge and pulsing green dot.
    - Removed *"Markdown → Publication-Grade Documents"* and *"Transform technical Markdown into formatted..."*.
    - Removed *"Executive Starter Templates"* grid and cards from landing screen.
    - Removed hardcoded default document title `"RFC 9110: HTTP Architecture & Semantics"` from `store/index.ts`. Initialized default document as clean `"Untitled Document"`.
    - Removed *"Load Sample RFC"* CTA button and background RFC watermarks.
    - Replaced the 400-line distributed systems RFC sample in `data/templates.ts` with a clean, friendly 30-line **Product Launch Plan** template featuring a simple Mermaid workflow diagram (`graph LR`), milestone table, and task checklist.
    - Streamlined tooltips and headers in `Header.tsx`, `ReviewActionBar.tsx`, and `CommandPalette.tsx` (e.g. replaced *"Stakeholder review mode"* with *"Reading View"*, replaced *"Executive Template Gallery"* with *"Document Templates"*).
  - **2. Rebuilt Empty State into a Sleek, Mac-Inspired Window:**
    - Crisp, direct headline: **Markdown to Docs**
    - Subtitle: *Paste Markdown or drop a file. Diagrams, tables, and formatting convert cleanly to Google Docs, Word, and PDF.*
    - Mac window frame with traffic light controls (red, yellow, green window dots), `untitled.md`, and format indicators.
    - Large, focused dropzone/canvas where user can type immediately, paste markdown, or drag & drop a file.
    - Clean central prompt with two clean action buttons: **Browse file** and **Try an example**.
    - Minimal footer cheatsheet: `⌘V Paste` · `⌘K Command Palette` · `Drag & drop anytime`.
* **Files Changed:**
  - `apps/web/src/components/EmptyState.tsx` (Rebuilt with Mac window frame, clean typography, zero slop)
  - `apps/web/src/data/templates.ts` (Replaced default sample RFC with Product Launch Plan template)
  - `apps/web/src/store/index.ts` (Reset default title to 'Untitled Document')
  - `apps/web/src/components/Header.tsx` (Simplified tooltips and review mode label)
  - `apps/web/src/components/ReviewActionBar.tsx` (Simplified 'Review Mode' to 'Reading View')
  - `apps/web/src/components/TemplateGalleryModal.tsx` (Simplified modal title and description)
  - `apps/web/src/components/CommandPalette.tsx` (Simplified command descriptions)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.92s)
  - `npx pnpm --filter web lint` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 87/87 tests passed**)
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 fixtures passed**)
  - Browser Subagent Verification: **PASS** (`clean_ui_verification`)
    - Screenshot `clean_landing_screen_1792482537681.png`: Clean Mac-inspired editor window, zero jargon, zero green light.
    - Screenshot `product_launch_plan_loaded_1792482670369.png`: Clean Product Launch Plan template loaded with flowchart diagram, table, and checklist.
* **Acceptance Criteria:**
  - [x] All pretentious corporate jargon, pulsing lights, and RFC 9110 watermarks removed.
  - [x] Empty state redesigned into a sleek, clean, Mac-inspired developer window.
  - [x] "Try an example" loads a clean, relatable document instead of an academic paper.
  - [x] All 87 validation tests, 17 fidelity lab fixtures, and web build pass.

* **Next Allowed Prompt:** Task P24: Navigation Streamlining & Reading View De-Cluttering

---

## Task P24: Navigation Streamlining & Reading View De-Cluttering
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Removed Primary Navbar Clutter:**
    - Removed `Templates` button from the top navbar (templates are accessible via `⌘K` or empty state).
    - Demoted `Reconcile` from the primary navbar (kept inside `⌘K` command palette where it belongs for Word comment/track-changes diffing).
  - **2. Streamlined Reading View Navigation:**
    - Removed duplicate floating `ReviewActionBar` from `Workspace.tsx` that previously rendered 3 competing primary CTAs below the header.
    - Updated top `Header.tsx` in Reading View to render a clear **`← Back to Editor`** button on the left, document title, and single primary export action + format selector on the right.
    - Clicking `← Back to Editor` cleanly returns immediately to the split editor.
  - **3. Eliminated Layout Jitter & Spring Transforms in SegmentedControl:**
    - Stripped `motion/react` spring physics from `segmented-control.tsx`. Replaced with instant CSS pill selector.
    - Set stable `min-w-[145px]` on the adjacent primary CTA button so changing format labels ("Export PDF" vs "Copy for Google Docs") never shifts or glitches neighboring elements.
  - **4. Typography Integrity:**
    - Maintained project typography system: **Newsreader** (`font-serif`) for headings and editorial copy, **JetBrains Mono** (`font-code-*`) for code, tokens, and metadata.
* **Files Changed:**
  - `apps/web/src/components/interior/segmented-control.tsx` (Removed `motion/react`, instant CSS pill toggle)
  - `apps/web/src/components/Header.tsx` (Removed Templates/Reconcile from top bar, added Back to Editor mode, decoupled button width)
  - `apps/web/src/components/Workspace.tsx` (Removed duplicate `ReviewActionBar`, clean single DocumentPreview layout)
  - `apps/web/src/components/EmptyState.tsx` (Restored Newsreader and JetBrains Mono typography tokens)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 25.26s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 87/87 tests passed**)
  - Browser Subagent Verification: **PASS** (`ux_polish_verification`)
    - Screenshot `editor_view_initial_1792497297114.png`: Uncluttered header with only Commands ⌘K, format toggle, and Reading View. Zero templates/reconcile noise.
    - Screenshot `reading_view_1792497320775.png`: Clean single header with `← Back to Editor` and single export CTA; zero floating duplicate toolbar.
    - Screenshot `returned_to_editor_1792497333270.png`: Instant return to editor mode on back click.
* **Acceptance Criteria:**
  - [x] Navbar stripped of secondary distractions (Templates & Reconcile moved to ⌘K).
  - [x] Reading View displays a single clear `← Back to Editor` button and 1 primary export CTA.
  - [x] Zero layout jitter or spring jumps on format change.
  - [x] Newsreader serif and JetBrains Mono typography tokens preserved.
  - [x] All 87 validation tests and production web build pass.

* **Next Allowed Prompt:** Task P25: VS Code Left Sidebar, Single Logo Fix, Canvas Zoom, and Bloat Elimination

---

## Task P25: VS Code Left Sidebar, Single Logo Fix, Canvas Zoom, and Bloat Elimination
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Fixed Double Logo Bug:**
    - In `Header.tsx`, removed the redundant unconditional logo render. The header now renders strictly a single `mdtodocs.com` brand logo in editor mode.
  - **2. Replaced Second Horizontal Navbar with VS Code-Style Collapsible Left Sidebar:**
    - Deleted horizontal tab bar (`DocumentTabBar.tsx`) that caused scrolling and visual clutter.
    - Built `WorkspaceSidebar.tsx`:
      - 44px Activity Rail with Document Explorer (`description`), New Document (`add`), History (`history`), Inspector (`info`), and Theme toggle (`dark_mode`/`light_mode`).
      - Collapsible 208px File Explorer drawer with clean vertical document list, active indicator, double-click rename, and close button.
      - Removed the confusing duplicate/copy button that previously spawned 20+ bloated tabs.
  - **3. Moved Zoom Control to Preview Canvas:**
    - Relocated Zoom stepper (`[-] 100% [+]`) directly onto the preview canvas (`bottom-5 right-5` floating glassmorphism pill) beside the document sheet.
  - **4. Deleted Attribution Signature & Implemented Theme Reactivity:**
    - Permanently removed the childish attribution signature footer ("made with mdtodocs.com") and its UI controls from `DocumentPreview.tsx` and `CommandPalette.tsx`.
    - Wired theme reactivity into `DocumentPreview.tsx` (`#111827` dark background and light text in Dark mode, dynamic font sizing), ensuring theme changes take immediate visual effect.
  - **5. Frontend Deflation & Tab Safeguards:**
    - Added workspace cap (max 6 documents) in `store/index.ts` to prevent tab proliferation.
    - Implemented automatic rehydration pruning to deflate bloated tab lists down to active + recent documents.
* **Files Changed:**
  - `apps/web/src/components/Header.tsx` (Fixed duplicate logo rendering bug)
  - `apps/web/src/components/WorkspaceSidebar.tsx` (New component: VS Code activity rail + collapsible file explorer)
  - `apps/web/src/components/Workspace.tsx` (Integrated `WorkspaceSidebar`, eliminated horizontal tab bar)
  - `apps/web/src/components/DocumentTabBar.tsx` (Deleted obsolete horizontal tab bar)
  - `apps/web/src/components/DocumentPreview.tsx` (Floating canvas zoom, dynamic theme styling, deleted signature footer)
  - `apps/web/src/components/CommandPalette.tsx` (Removed signature toggle command)
  - `apps/web/src/store/index.ts` (Document cap at 6, rehydration deflation)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.93s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 87/87 tests passed in 12.96s**)
  - Browser Subagent Verification: **PASS** (`vscode_sidebar_verification`)
    - Screenshot `layout_verification_1792498174827.png`: Single header logo, clean VS Code sidebar, no horizontal tab bar, clean document sheet.
    - Screenshot `sidebar_collapsed_1792498185929.png`: Collapses cleanly to 44px slim activity rail giving full width to editor.
    - Screenshot `dark_mode_verification_1792498227084.png`: Theme toggle switches preview sheet to dark mode.
* **Acceptance Criteria:**
  - [x] Only one brand logo in the top navbar.
  - [x] Horizontal tab bar and duplicate copy icon completely removed.
  - [x] VS Code-style collapsible vertical sidebar on the left.
  - [x] Zoom control relocated to floating pill on preview canvas.
  - [x] Attribution signature deleted from UI and preview.
  - [x] Themes visually react and re-render document sheet.
  - [x] All 87 validation tests and production web build pass.

* **Next Allowed Prompt:** Task P26: Command Palette Overhaul, Platform Shortcuts & Discoverable Sidebar Duplicate

---

## Task P26: Command Palette Overhaul, Platform Shortcuts & Discoverable Sidebar Duplicate
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Platform-Aware Keyboard Shortcuts:**
    - Created `apps/web/src/utils/platform.ts` with `isMac()`, `getModifierKey()`, and `getCommandShortcut()`.
    - Automatically displays `Ctrl+K` on Windows and Linux, and `⌘K` on macOS in the top header and footer cheatsheets.
    - Updated keyboard shortcuts across the app to display platform-native keys (`Ctrl+...` vs `⌘...`).
  - **2. Command Palette Decluttering & Human Copy:**
    - Purged all 10 pre-baked template rows from `CommandPalette.tsx`.
    - Removed redundant `Target: ...` format switchers (which duplicated the segmented control).
    - Removed redundant `Copy Plain Markdown`.
    - Replaced pompous *"Enter Stakeholder Review Mode"* with clean **"Toggle Reading View"** (`Ctrl+R`).
    - Unified the overlapping `Document Inspector` and `Fidelity Check Panel` into a single **"Document Details & Fidelity Report"** action.
    - Simplified theme commands into a single, clean **"Switch to Dark / Light Theme"** toggle.
    - Improved Reconcile copy to human-readable **"Sync Word Comments & Track Changes (.docx)"** with a `NEW` badge.
  - **3. Discoverable Visual Duplication in Sidebar:**
    - Added a clean `content_copy` duplicate button on hover for each document in `WorkspaceSidebar.tsx` with clear tooltip *"Duplicate this document"*.
    - Allows users to duplicate any document visually with 1 click in the sidebar where files are managed, without needing Command Palette or risking navbar button misclicks.
* **Files Changed:**
  - `apps/web/src/utils/platform.ts` (New platform utility: detects OS and formats shortcuts)
  - `apps/web/src/components/Header.tsx` (Dynamic platform shortcut display)
  - `apps/web/src/components/EmptyState.tsx` (Dynamic platform shortcut display)
  - `apps/web/src/components/CommandPalette.tsx` (Overhauled commands, human copy, template purge)
  - `apps/web/src/components/WorkspaceSidebar.tsx` (Visual duplicate button on document hover)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.58s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 87/87 tests passed in 17.05s**)
  - Browser Subagent Verification: **PASS** (`command_palette_overhaul`)
    - Header verified showing `Ctrl+K` for Windows environment.
    - Command Palette verified with zero template rows, zero target switchers, clean Word Sync with `NEW` badge, and unified reports.
    - Sidebar hover duplicate button verified: cloned document cleanly into vertical list without freeze or bloat.
* **Acceptance Criteria:**
  - [x] Header dynamically renders `Ctrl+K` on Windows/Linux and `⌘K` on Mac.
  - [x] Command Palette stripped of template bloat, mode duplication, and jargon.
  - [x] Word feedback sync copy improved with `NEW` badge.
  - [x] Document duplication is visually discoverable on hover in the sidebar file drawer.
  - [x] All 87 validation tests and production web build pass.

* **Next Allowed Prompt:** Task P27: UX Polish, Add-New-Doc Fix, Glassmorphism, Eye Animation & Mermaid Auto-Fix

---

## Task P27: UX Polish, Add-New-Doc Fix, Glassmorphism, Eye Animation & Mermaid Auto-Fix
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Critical Bug Fix: "Add New Document" (`+`) Blank Sheet UX:**
    - Root cause: `App.tsx` computed `appState = markdown.trim().length > 0 ? 'WORKSPACE' : 'EMPTY'`. Creating an empty document (`markdown = ''`) collapsed the workspace into the landing page.
    - Decoupled view state in Zustand (`apps/web/src/store/index.ts`) with `currentView: 'landing' | 'workspace'`.
    - Clicking `+` now creates an empty document and maintains `currentView = 'workspace'`, rendering a clean "Untitled Document" sheet ready for immediate typing.
  - **2. Clubbed Navigation: "Back to Home Page" & "Reset Workspace":**
    - Logo (`mdtodocs.com`) replaced with a sleek glass dropdown menu.
    - Unified "Back to Home Page (Start Fresh)" which safely resets state while leaving open documents manageable.
    - Added "About mdtodocs" dialog modal detailing architecture, supported destinations, and author attribution.
  - **3. Homepage Terminal & Code Window Overhaul:**
    - Redesigned `EmptyState.tsx` into a sleek dark macOS code terminal.
    - Features line numbers gutter (`01`-`06`), comment line `# Start by pasting here :)` with pulsing block cursor `▋`, and instant clipboard paste button with shortcut badge (`Ctrl+V` / `⌘V`).
    - Added `Copyright: Yours truly DC` attribution in homepage footer, workspace status bar, and about modal.
  - **4. Reading View Eye Icon Micro-Animation:**
    - Added a smooth tactile eye-blink/wink animation to the Reading View toggle button in `Header.tsx` (`scale-y-[0.05]` squash and transition) triggered before switching views.
  - **5. "Copy for Google Docs" Glassmorphism & Spring Checkmark:**
    - Replaced flat green `#22c55e` state in `loading-button.tsx` with a dark frosted glass mirror surface, specular highlight reflection line, luminous emerald ambient glow, and a spring-animated SVG checkmark (`pathLength` draw).
  - **6. Mermaid Inspector & Auto-Fix Repair Engine:**
    - Implemented `autoFixMermaidCode` in `MermaidDiagram.tsx` to automatically resolve syntax errors: unquoted labels containing brackets/parentheses (`[Task (v1)]` -> `["Task (v1)"]`), unclosed subgraphs, and typographic smart quotes.
    - Added an active **"✨ Auto-Fix Diagram"** button in the diagram error banner that mutates the active document in real time.
  - **7. Collapsible Headings in Document Preview:**
    - Implemented `rehypeCollapsibleHeadings` wrapping H1-H6 in `<details open class="collapsible-section">` with smooth rotating chevrons.
    - Preserved 100% expansion on `@media print` and left DOCX/Google Docs clipboard generators unpolluted.
* **Files Changed:**
  - `apps/web/src/store/index.ts` (View decoupled from markdown length; clubbed home reset; about modal state)
  - `apps/web/src/App.tsx` (Bound appState to currentView; mounted AboutModal)
  - `apps/web/src/components/AboutModal.tsx` (New glassmorphic About dialog with attribution)
  - `apps/web/src/components/StatusBar.tsx` (Attribution in footer status bar)
  - `apps/web/src/components/Header.tsx` (Logo glass dropdown menu; eye blink animation)
  - `apps/web/src/components/EmptyState.tsx` (Terminal code editor landing screen; prompt line + cursor)
  - `apps/web/src/components/interior/loading-button.tsx` (Dark glass mirror, emerald glow, spring checkmark)
  - `apps/web/src/components/MermaidDiagram.tsx` (Auto-fix repair engine and action button)
  - `apps/web/src/components/DocumentPreview.tsx` (Rehype collapsible headings & blank untitled sheet state)
  - `apps/web/src/index.css` (Collapsible section styling, chevron rotation, and print rules)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, bundled cleanly in 3.65s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 92/92 tests passed**)
  - `npx pnpm --filter web lint` (`oxlint`) (**PASS: 0 errors**)
  - Browser Subagent Verification: **PASS** (`ux_touchup_verification` & `new_doc_verification`)
    - Verified new document creation (`+`) leaves user in workspace with blank sheet and empty editor.
    - Verified logo dropdown menu with "Back to Home Page (Start Fresh)" and "About mdtodocs".
    - Verified terminal code window with blinking cursor and clipboard action.
    - Verified collapsible headings folding and expanding smoothly.
    - Verified multi-document switching without data loss.
* **Acceptance Criteria:**
  - [x] Adding a new document stays in workspace with clean blank sheet.
  - [x] "Back to Home Page" and "Clear / Start Fresh" clubbed into logo dropdown.
  - [x] Landing page overhauled into code terminal with `# Start by pasting here :)` and blinking cursor.
  - [x] Reading view button exhibits playful eye blink animation.
  - [x] Copy button features glass specular reflection, luminous emerald glow, and spring checkmark.
  - [x] Mermaid diagrams include an auto-fix CTA that repairs common syntax issues.
  - [x] Headings are collapsible in preview and Reading View, 100% expanded on print/export.
  - [x] All 92 validation tests, typecheck, and production web build pass.

* **Next Allowed Prompt:** Task P28: Workspace Sidebar Expand Icon, Border Tab, Header Toggle & Platform Shortcut

---

## Task P28: Workspace Sidebar Expand Icon, Border Tab, Header Toggle & Platform Shortcut
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Missing Sidebar Expand Icon Resolution:**
    - Root cause: `WorkspaceSidebar.tsx` previously housed `isDrawerOpen` in local state. When `isDrawerOpen` was collapsed via the header `chevron_left` button (`title="Collapse sidebar"`), the entire drawer unmounted, leaving behind only the activity rail with zero expand chevron icons.
    - Decoupled and lifted sidebar visibility to Zustand store (`isSidebarOpen`, `setIsSidebarOpen`, `toggleSidebar`) and added it to persistence (`partialize`).
    - Added an explicit **"Expand sidebar"** button featuring `chevron_right` at the top of the activity rail whenever the sidebar is collapsed.
    - Added a sleek floating circular tab on the vertical boundary between the sidebar and editor that renders `chevron_right` when collapsed and reveals `chevron_left` on hover when open.
  - **2. Top Header Sidebar Toggle:**
    - Added a platform-aligned sidebar toggle button (`dock_to_left` / `view_sidebar`) right next to the brand logo in `Header.tsx` with clear tooltip `Collapse sidebar (Ctrl+B)` / `Expand sidebar (Ctrl+B)`.
  - **3. Global Keyboard Shortcut & Command Palette:**
    - Handled `Ctrl+B` (and `⌘B` on macOS) globally in `App.tsx` to toggle the sidebar without conflicting with text input.
    - Added a dedicated `"Toggle Sidebar"` action (`Ctrl+B`) under "View & Navigation" in `CommandPalette.tsx`.
* **Files Changed:**
  - `apps/web/src/store/index.ts` (Lifted isSidebarOpen and toggleSidebar to store and partialize)
  - `apps/web/src/components/WorkspaceSidebar.tsx` (Added rail expand button, border floating tab, and synced state)
  - `apps/web/src/components/Header.tsx` (Added top navbar sidebar toggle button next to logo)
  - `apps/web/src/App.tsx` (Added global Ctrl+B / ⌘B keyboard shortcut handler)
  - `apps/web/src/components/CommandPalette.tsx` (Added toggle sidebar command item)
  - `docs/EXECUTION_LEDGER.md` (Updated execution ledger)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, built cleanly)
  - `npx pnpm --filter web lint` (`oxlint`) (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 92/92 tests passed**)
  - Browser Subagent Verification: **PASS** (`sidebar_expand_icon_verification`)
    - Captured `sidebar_open_1792506782817.png`: verified open drawer with `chevron_left` collapse icons.
    - Captured `sidebar_collapsed_shortcut_1792506903919.png`: verified collapsed state showing explicit `chevron_right` expand button at the top of the rail, floating circular tab on the rail boundary, and top navbar toggle button.
    - Verified smooth expansion and collapse via button clicks and `Ctrl+B`.
* **Acceptance Criteria:**
  - [x] Prominent `chevron_right` expand button visible in rail when sidebar is collapsed.
  - [x] Floating circular expand tab on rail/editor border.
  - [x] Top header navbar toggle button next to brand logo.
  - [x] `Ctrl+B` / `⌘B` global shortcut toggles sidebar.
  - [x] Command Palette provides Toggle Sidebar command.
  - [x] All 92 validation tests, lint, and production web build pass.

* **Next Allowed Prompt:** Task P29: Ondine Engine Migration & Fullscreen Diagram Canvas Studio Modal UX

---

## Task P29: Ondine Engine Migration & Fullscreen Diagram Canvas Studio Modal UX
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Migration to Ondine WASM Engine (`wevm/ondine`):**
    - Migrated Mermaid compilation in `@mdtodocs/asset-pipeline` from heavy legacy `mermaid.js` to pure Rust/WASM `ondine`.
    - Zero browser DOM dependency during headless/SSR compilation; sub-millisecond execution.
    - Preserved and enhanced `autoFixMermaidCode` syntax repair engine for parentheses quoting, smart quote normalization, and unclosed subgraph auto-closing.
    - Added `inlineOndineColors` to replace Ondine CSS variables (`var(--_s)`, `var(--_b)`, `var(--_fg)`, `var(--_l)`) with concrete theme hex colors (`#ffffff`, `#0f172a`, etc.) and inject a solid background `<rect>`, preventing Word (.docx) and Google Docs clipboard paste from stripping CSS custom properties.
  - **2. Fullscreen Diagram Canvas Studio Modal UX:**
    - Solved the user pain point of large/wide/complex diagrams being trapped inside cramped 4x4 scrollable boxes.
    - In-sheet document preview remains clean and bounded (`max-h-[460px] overflow-hidden`) with a subtle gradient mask and hover pill: `[ ⛶ Inspect in Canvas Studio (Pan & Zoom) ]`.
    - Modal renders via `createPortal(..., document.body)` with background scroll locking (`document.body.style.overflow = 'hidden'`).
    - Infinite canvas with Figma/Miro tactile dot-matrix grid that scales and pans naturally with the diagram.
    - Direct-manipulation pan (pointer drag with `cursor-grab` / `cursor-grabbing`) and cursor-centered zoom (mouse wheel / trackpad pinch from 0.15x to 5.0x).
    - Floating Island HUD dock at the bottom:
      - Quick actions: `Fit to Screen`, `100%`, `Zoom Out / Zoom In` with numeric percentage.
      - High-fidelity export: `Copy PNG (2x High-DPI with solid background)`, `Download SVG`, `Copy SVG Code`, `Copy Source`.
      - Interactive Radar Minimap toggle in bottom-right corner with live illuminated viewport boundary box.
    - Global keyboard navigation: `Esc` to close, `0` / `F` to fit, `1` for 100%, `+` / `-` to zoom, arrow keys to pan. Double-click to toggle fit.
* **Files Changed:**
  - `packages/asset-pipeline/src/mermaid.ts` (Ondine WASM compilation, concrete color inlining, SVG sanitization, and export compatibility)
  - `packages/asset-pipeline/package.json` (Added `ondine` dependency)
  - `apps/web/package.json` (Added `ondine` dependency)
  - `apps/web/src/components/MermaidDiagram.tsx` (In-browser Ondine WASM compilation, bounded sheet container, Canvas Studio launch pill)
  - `apps/web/src/components/DiagramCanvasModal.tsx` (Complete Diagram Canvas Studio modal with createPortal, dot grid, pan/zoom, floating HUD, and radar minimap)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 fixtures passed**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 10.35s)
  - Browser Subagent Verification: **PASS** (`ondine_canvas_demo`)
    - Captured `canvas_studio_modal_1792724938272.png`: verified full viewport lightbox with dot grid, centered diagram, top header with dimensions and Ondine badge, floating HUD dock, and overview radar minimap.
    - Verified Esc key closes canvas and returns smoothly to document sheet.
* **Acceptance Criteria:**
  - [x] Ondine WASM compiler replaces legacy mermaid.js in asset pipeline and web app.
  - [x] Inlined concrete hex colors and solid background ensure Word DOCX and Google Docs clipboard fidelity.
  - [x] Diagram Canvas Studio renders at full viewport (100vw × 100vh) via `createPortal`.
  - [x] Figma/Miro dot grid, pointer drag pan, and cursor-centered wheel zoom.
  - [x] Floating Island HUD with Fit, 100%, Zoom, 2x PNG, SVG, and Source copy.
  - [x] Overview Radar Minimap with illuminated viewport box.
  - [x] All 93 validation tests, 17 fidelity fixtures, and production build pass.

* **Next Allowed Prompt:** Prompt 30: Piixpal Pixel Creature Companion Bookmarking UX.

---

## Task P30: Piixpal Pixel Creature Companion Bookmarking UX
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Piixpal Engine & Ecosystem Evaluation (`diiviikk5/Piixpal`):**
    - Audited Piixpal web component ecosystem for micro-companions.
    - Classified pal actors vs sprite figures: `pip`, `moss`, `lurk`, `kitty` provide living personalities, eye blinks, physics bobbing, and poke interactions.
    - Built native 16×16 vector integer renderer (`PixelCreature`) with `shapeRendering: crispEdges` for razor-sharp Retina/High-DPI rendering without canvas blur or hydration timing delays.
  - **2. Creature Cast & Personalities:**
    - 🐦 **Pip** (*The Percher Bird*): Sky-blue plumage, golden belly, orange beak, flapping wing animation.
    - 🍄 **Moss** (*The Reading Mushroom*): Crimson cap with white spores, tiny reading document, and blush.
    - 👀 **Lurk** (*The Card Peeker*): Shadow silhouette with giant glowing cyan eyes peeking over the card boundary.
    - 🐱 **Kitty** (*The Desk Companion*): Marmalade ginger coat with emerald slit eyes, pink nose, and twitching ears.
  - **3. Micro-Interactions & UX Polish:**
    - **Perched Posture:** Sits elevated at `top-20 right-5 z-50` outside the `h-14` (56px) top navbar to eliminate stacking conflicts.
    - **Poke & Dialogue:** Clicking the creature or the avatar card triggers an immediate bounce/tilt with a speech bubble (`"Chirp! Don't lose this tool!"`, `"Keep this doc bookmarked!"`).
    - **Companion Switcher Pill:** `[ ⟳ PalName ]` allows instant interactive toggling across all 4 creatures.
    - **Celebratory Bookmark Flow:** Triggered via `Ctrl+D` / `⌘D`, dragging the link to the bookmark bar, or clicking "Done, I Saved It!"; creature bursts into celebratory jumping with sparkle stars (`✨ ⭐`), dynamic success copy, and smooth auto-dismissal.
  - **4. Genuine Browser Bookmarking Mechanics:**
    - Resolved the technical constraint where modern browser sandboxes block client-side JavaScript from silently adding bookmarks or opening native bookmark dialogs.
    - Integrated native **Drag to Bookmark Bar** (`<a draggable="true">`): users can drag the button directly onto Chrome/Edge/Firefox Bookmarks Bar to create an actual bookmark.
    - Added **Guidance Mode & Address Bar Star Beacon**: clicking the hotkey CTA automatically copies the clean workspace URL to clipboard and points users to the browser's address bar star icon (`★`) or `Ctrl+D` / `⌘D`.
    - Added **Desktop App Shortcut Download**: generates a 1-click `md-to-docs.url` Windows launcher shortcut.
* **Files Changed:**
  - `apps/web/package.json` (Added `piixpal` package)
  - `apps/web/src/components/BookmarkPrompt.tsx` (Complete Piixpal-inspired companion engine, 4 creature definitions, poke dialogue, companion switcher, real bookmarking drag/guide/celebration flow)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/fidelity-lab test` (**PASS: 17/17 fixtures passed**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 21.23s)
  - Visual Subagent Audits: **PASS**
    - `bookmark_prompt_initial.png`: Initial state showing Pip creature, "Drag to Bookmark Bar" draggable anchor link, and Ctrl+D hotkey button.
    - `bookmark_prompt_guidance.png`: Guidance state showing address bar star instructions, clipboard URL copy badge, and "Done, I Saved It!" + "Desktop App" action buttons.
    - `bookmark_celebration_1792769399758.png`: Celebratory state with confetti stars, checkmark, and victory message.
* **Acceptance Criteria:**
  - [x] Piixpal inspected and integrated with high-performance pixel-art engine.
  - [x] 4 distinct creatures (Pip, Moss, Lurk, Kitty) with unique quotes and celebration states.
  - [x] Perched layout positioned at `top-20` avoiding navbar overlap.
  - [x] Micro-interactions: poke hopping, speech bubble, and switcher pill.
  - [x] Genuine browser bookmarking options: drag to bookmark bar, address bar beacon guide, and desktop shortcut.
  - [x] Keyboard shortcut `Ctrl+D` / `⌘D` and drag completion trigger celebration animation.
  - [x] All 93 validation tests, 17 fidelity fixtures, and production build pass.

* **Next Allowed Prompt:** Prompt 31: Primary Copy CTA Micro-Interaction Revamp.

---

## Task P31: Emil Kowalski Design Engineering Primary CTA Revamp
* **Status:** Complete
* **Scope and Intended Behavior:**
  - **1. Applied Emil Kowalski Design Engineering Philosophy (`emilkowalski/skills`):**
    - Audited against `skills/emil-design-eng/SKILL.md` and `skills/animate/SKILL.md`.
    - Eradicated all over-engineered decorative fluff: removed laser scanning beams, shockwave ripples, particle stars, and oversized dropdown capsules.
    - Designed with quiet, restrained minimalism (matching Perplexity / Vercel / Linear craft).
  - **2. Review Table (Emil Kowalski Review Format):**
    | Before | After | Why |
    | --- | --- | --- |
    | Laser beam & shockwave ripple | Removed completely | Functional actions seen repeatedly must not have decorative noise ("If the purpose is just 'it looks cool' and the user will see it often, don't animate") |
    | Floating Dropdown HUD capsule | Removed; simple in-button text swap | Oversized popup balloons clutter the interface; confident software provides quiet, inline feedback |
    | Hardcoded muddy green `#062c1e` with neon glow | Restrained zinc palette (`bg-zinc-900 text-white` / `dark:bg-zinc-100 dark:text-zinc-900`) | Eliminates AI slop; harmonizes with Perplexity/Vercel quiet aesthetics |
    | No `:active` physical feedback | `transform: scale(0.97)` on `:active` with 160ms `ease-out` | Buttons must feel physically responsive to press, confirming the interface heard the user |
    | `filter: blur(3px)` text crossfade | Crisp 150ms `scale(0.95)` and opacity crossfade with custom `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) | Blur transitions feel cheap and synthetic; 150ms `ease-out` gives instant feedback without visual sludge |
    | Animate from `scale(0)` | Animate from `scale(0.95)` with `opacity: 0` | Nothing in the real world appears from scale(0); entering from `scale(0.95)` feels natural |
    | Generic 850ms spinner | Fast 600ms linear spinner | Faster-spinning spinner improves perceived performance |
* **Files Changed:**
  - `apps/web/src/components/interior/loading-button.tsx` (Complete rewrite adhering to Emil Kowalski design engineering principles)
  - `apps/web/src/components/Header.tsx` (Updated LoadingButton integration)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 11.59s)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest**)
  - Visual Subagent Audits: **PASS** (`emil_clean_cta`)
    - `emil_resting_cta.png`: Clean, quiet, minimal resting button with proper proportions and zero clutter.
    - `emil_success_cta.png`: Fast, crisp in-button checkmark with `Copied!` label and zero over-engineered artifacts.
* **Acceptance Criteria:**
  - [x] Emil Kowalski design engineering skill philosophy strictly applied.
  - [x] All decorative lasers, shockwaves, sparkles, and dropdown capsules removed.
  - [x] Responsive `:active` state with `scale(0.97)` and 160ms custom `ease-out`.
  - [x] Fast perceived performance with 600ms spinner and 1500ms reset.
  - [x] Clean Before/After review table generated.
  - [x] All 93 validation tests and production builds pass.

* **Next Allowed Prompt:** Prompt 00: Repository Reconnaissance & Master Execution Map (v2 Foundation)

---

## Prompt 00: Repository Reconnaissance & Master Execution Map (v2 Foundation)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Audit the live repository line-by-line without relying on speculative PRD claims.
  - Inspect monorepo structure, package scripts, conversion engine, AST IR, renderers (docx/html/clipboard), Ondine WASM engine, test runners, and web workspace.
  - Produce canonical `docs/EXECUTION_MAP.md` covering implemented vs partial vs absent capabilities, exact file paths, critical bugs/debt, architectural leverage, license/security audit, verified baseline commands, dependency graph, and a 30-day implementation plan.
  - Maintain strict freeze on production runtime code during this iteration.
* **Files Changed:**
  - `docs/PRD.md` (Committed canonical v2 PRD per Section 11 protocol)
  - `docs/MASTER_IMPLEMENTATION_PLAN_V2.md` (Committed master implementation plan)
  - `docs/EXECUTION_MAP.md` (Created execution map and repository audit baseline)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 17/17 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest in 33.18s**, exit code 0)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 11.43s, exit code 0)
* **Acceptance Criteria:**
  - [x] Zero production runtime code modified during Iteration 0.
  - [x] Complete inventory of implemented, partial, and absent capabilities with exact file paths.
  - [x] License and security boundaries audited.
  - [x] Monorepo dependency graph and 30-day implementation plan documented.
  - [x] Baseline commands executed and exact results recorded.
  - [x] `docs/PRD.md`, `docs/MASTER_IMPLEMENTATION_PLAN_V2.md`, and `docs/EXECUTION_MAP.md` created.

* **Next Allowed Prompt:** Prompt 01: Destination-Aware Fidelity Test Harness & CI Workflow Automation

---

## Prompt 01: Destination-Aware Fidelity Test Harness & CI Workflow Automation
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Expand `packages/fidelity-lab` with representative golden fixtures for Unicode/multilingual scripts, long continuous lines/wide data matrices, and unsupported raw HTML constructs.
  - Implement destination-aware assertions in `packages/fidelity-lab/src/runner.ts` for clipboard HTML (verifying CJK/emojis, smart quotes, continuous tokens, table cell structure) and DOCX (verifying OOXML document.xml tags).
  - Automate continuous integration with `.github/workflows/ci.yml` matrix testing across Ubuntu and Windows.
  - Produce canonical documentation `docs/FIDELITY_REGRESSION_HARNESS.md` detailing the dual-verification architecture (Structural Validity vs Visual Fidelity).
* **Files Changed:**
  - `packages/fidelity-lab/fixtures/017-unicode-and-symbols/input.md` (New fixture: CJK, Arabic, accents, smart quotes, technical symbols, emojis)
  - `packages/fidelity-lab/fixtures/017-unicode-and-symbols/expected-ir.json` (Golden AST snapshot)
  - `packages/fidelity-lab/fixtures/018-long-lines-and-overflow/input.md` (New fixture: Unbroken URLs, continuous monospace tokens, 12-column table)
  - `packages/fidelity-lab/fixtures/018-long-lines-and-overflow/expected-ir.json` (Golden AST snapshot)
  - `packages/fidelity-lab/fixtures/019-unsupported-constructs/input.md` (New fixture: Raw video/canvas tags, unknown directives, deep 5-level list nesting)
  - `packages/fidelity-lab/fixtures/019-unsupported-constructs/expected-ir.json` (Golden AST snapshot)
  - `packages/fidelity-lab/src/runner.ts` (Added destination-aware structural assertions for new fixtures)
  - `.github/workflows/ci.yml` (New CI workflow: Node 20 matrix, install, build, vitest, fidelity-lab, oxlint)
  - `docs/FIDELITY_REGRESSION_HARNESS.md` (Canonical test methodology specification)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
    - Fixtures 001 to 016 (PASS)
    - Fixture 017-unicode-and-symbols (PASS)
    - Fixture 018-long-lines-and-overflow (PASS)
    - Fixture 019-unsupported-constructs (PASS)
    - Assertion mermaid-asset-preservation (PASS)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest in 28.84s**, exit code 0)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 11.27s, exit code 0)
* **Acceptance Criteria:**
  - [x] Representative golden fixtures for Unicode, long lines/overflow, and unsupported constructs added.
  - [x] Destination-aware assertions validate exported OOXML and clipboard HTML structures.
  - [x] CI workflow wired to `.github/workflows/ci.yml` testing Linux and Windows.
  - [x] Documentation `docs/FIDELITY_REGRESSION_HARNESS.md` distinguishes structural validity vs visual fidelity.
  - [x] All 20 fidelity fixtures, 93 validation unit tests, and production web build pass.

* **Next Allowed Prompt:** Prompt 02: Viewport Overflow & Responsive Quality (320px to 1440px)

---

## Prompt 02: Viewport Overflow & Responsive Quality (320px to 1440px)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Audit live UI at 320px, 375px, 768px, 1280px, and 1440px viewports.
  - Fix horizontal page overflow, clipped header controls, oversized tables, and crushed workspace panes.
  - Implement mobile segmented control labels (`shortLabel`), overlay drawer for workspace file sidebar, and responsive `[ Editor | Preview ]` tab switcher on small screens (< 768px) granting 100% width to the active pane.
  - Preserve desktop side-by-side workspace split without regression.
  - Calibrate paper sheet margins (`p-4 sm:p-space-md md:p-space-xxl`) for mobile viewports.
  - Verify zero horizontal page scroll (`document.documentElement.scrollWidth === window.innerWidth`) across all target breakpoints via interactive browser subagent.
* **Files Changed:**
  - `apps/web/src/components/interior/segmented-control.tsx` (Added responsive `shortLabel` rendering for mobile screens)
  - `apps/web/src/components/Header.tsx` (Responsive header layout, compact mobile labels, hidden non-essential secondary actions on mobile)
  - `apps/web/src/components/WorkspaceSidebar.tsx` (Converted sidebar into mobile overlay drawer with backdrop blur on `< md:`)
  - `apps/web/src/components/Workspace.tsx` (Mobile tab switcher granting 100% full width to Editor or Preview on `< md:`)
  - `apps/web/src/components/DocumentPreview.tsx` (Calibrated sheet margins across responsive breakpoints)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - Browser Subagent Verification across 5 viewports: **PASS** (`viewport_responsive_verification`)
    - 1440px desktop: Verified clean side-by-side workspace (`scrollWidth === innerWidth: 1440 === 1440`)
    - 1280px desktop: Verified clean side-by-side workspace (`scrollWidth === innerWidth: 1280 === 1280`)
    - 768px tablet: Verified clean side-by-side workspace (`scrollWidth === innerWidth: 768 === 768`)
    - 375px phone: Verified mobile Editor tab and Preview tab (`scrollWidth === innerWidth: 375 === 375`)
    - 320px small phone: Verified zero horizontal scroll (`scrollWidth === innerWidth: 320 === 320`)
    - Captured artifacts: `viewport_1440_1792777435730.png`, `viewport_375_preview_1792777499430.png`, `viewport_320_1792777524749.png`
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 17/17 test files, 93/93 tests passed in vitest in 29.11s**, exit code 0)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 10.82s, exit code 0)
* **Acceptance Criteria:**
  - [x] Zero horizontal page overflow at 320px, 375px, 768px, 1280px, and 1440px.
  - [x] Header controls adapt without text clipping or overlapping buttons.
  - [x] Mobile editor and preview both have 100% full-width usability via segmented tab switcher.
  - [x] File sidebar acts as an overlay drawer on mobile rather than squishing document panes.
  - [x] All 20 fidelity fixtures, 93 validation unit tests, and production web build pass.

* **Next Allowed Prompt:** Prompt 03: Destination Capability Contract & Structured Warning Model

---

## Prompt 03: Destination Capability Contract & Structured Warning Model
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Formalize shared destination capability contract in `@mdtodocs/capability-graph` with typed `DocumentDiagnostic`, `DiagnosticFixAction`, and `CAPABILITY_RULES` inventory.
  - Strengthen `@mdtodocs/compiler-core/diagnostics` and `planner` with deterministic rule evaluation, line/col tracking, and explicit non-dropping fallbacks:
    - `wide-table-overflow`: Linearizes wide tables (> 20 cols for Google Docs/PDF, > 63 for Word) into structured lists (`data.polyfill = 'table-to-list'`) with actionable warning diagnostics.
    - `unsupported-html-element`: Preserves raw HTML tags (`<video>`, `<canvas>`, `<iframe>`, etc.) as styled code blocks (`data.polyfill = 'html-to-code'`) to guarantee zero content is silently dropped.
    - `missing-image-source`: Converts empty image URLs to styled placeholder links preserving alt text.
  - Strengthen core renderers (`docx.ts`, `clipboard.ts`, `html.ts`) with explicit `html` node handlers and recursive/value `fallbackNode` implementations so unhandled AST constructs never vanish into the void.
  - Integrate quiet, non-blocking Preflight Quality Indicator and glassmorphic popover in `apps/web/src/components/Header.tsx` without cluttering the 1-step export workflow.
  - Create canonical documentation `docs/DESTINATION_CAPABILITY_CONTRACT.md`.
  - Add dedicated test suite `packages/validation/tests/capability-contract.test.ts` (6 new unit tests).
* **Files Changed:**
  - `packages/capability-graph/src/index.ts` (Defined `CAPABILITY_RULES`, `DocumentDiagnostic`, `DiagnosticFixAction`, `html` capability key, and helper functions)
  - `packages/compiler-core/src/diagnostics/index.ts` (Implemented typed `DocumentDiagnostic` model and `DiagnosticsCollector` query methods)
  - `packages/compiler-core/src/index.ts` (Exported diagnostics types and fix actions)
  - `packages/compiler-core/src/planner/index.ts` (Added structured diagnostics with line/column position, auto-fix actions, and `html-to-code` fallback)
  - `packages/renderers/src/docx.ts` (Added `html` handler and safe recursive `fallbackNode`)
  - `packages/renderers/src/clipboard.ts` (Added `html` handler and safe recursive `fallbackNode`)
  - `packages/renderers/src/html.ts` (Added `html` handler and safe recursive `fallbackNode`)
  - `apps/web/src/store/index.ts` (Added `diagnostics` state to Zustand store)
  - `apps/web/src/components/Workspace.tsx` (Synchronized compiled diagnostics with store)
  - `apps/web/src/components/interior/loading-button.tsx` (Supported `ReactNode` labels and ensured `aria-label` string safety)
  - `apps/web/src/components/Header.tsx` (Integrated Preflight Quality Indicator button and glassmorphic popover)
  - `docs/DESTINATION_CAPABILITY_CONTRACT.md` (Created canonical capability contract documentation)
  - `packages/validation/tests/capability-contract.test.ts` (Created 6 new unit tests)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 18/18 test files, 99/99 tests passed in vitest in 11.72s**, exit code 0)
    - `tests/capability-contract.test.ts` (**6/6 tests PASS**)
    - `tests/capability-inspector.test.ts` (**6/6 tests PASS**)
    - All other 16 test files (**PASS**)
  - `npx pnpm --filter web build` (**PASS: 0 errors**, TypeScript 5.5 + Vite bundled client production build in 2.88s, exit code 0)
  - Browser Subagent Verification: **PASS** (`preflight_indicator_demo`)
    - Captured `preflight_zero_degradation_1792778605376.png`: Verified Preflight button in header, verified zero-degradation checkmark state for Google Docs and Word destinations, verified 1-step primary action button remains unaffected.
* **Acceptance Criteria:**
  - [x] Destination capability contract formalized across all 4 destinations (`google-docs`, `word`, `pdf`, `clipboard`).
  - [x] Typed `DocumentDiagnostic` model with line/column positions, rule IDs, and automated fix actions.
  - [x] Zero silent drop guarantee: raw HTML and unknown AST nodes preserved as code/text rather than dropped.
  - [x] Pre-export preflight indicator integrated in header without cluttering default UI or blocking 1-step exports.
  - [x] Canonical documentation `docs/DESTINATION_CAPABILITY_CONTRACT.md` created.
  - [x] All 20 fidelity fixtures, 99 validation unit tests, and web production build pass.
* **Next Allowed Prompt:** Prompt 04: Technical SEO Foundation & Netlify SSR/Prerendering (Phase B: Acquisition Foundation)

---

## Prompt 04: Technical SEO Foundation & Netlify SSR/Prerendering
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Prerender static HTML for all primary conversion routes (`/`, `/markdown-to-word`, `/markdown-to-pdf`, `/markdown-to-google-docs`, `/markdown-to-html`, `/markdown-to-rich-text`) and `404.html` with full meta tags, Open Graph, Twitter cards, canonical tags, and JSON-LD structured data (`SoftwareApplication`).
  - Create static crawl files: `apps/web/public/sitemap.xml` and `apps/web/public/robots.txt` declaring all canonical URLs and crawl directives.
  - Implement static prerender pipeline in `scripts/prerender.ts` and wire into `apps/web/package.json` build step.
  - Create `netlify.toml` with build commands, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP), immutable asset caching for `/assets/*`, and 200 SPA rewrite fallback for client routing.
  - Integrate client-side pathname detection in `apps/web/src/App.tsx` to automatically preselect the corresponding export destination (`word`, `pdf`, `google-docs`, `html`, `clipboard`) and set document title and meta descriptions upon hydration.
  - Add comprehensive unit test suite in `packages/validation/tests/technical-seo.test.ts` (4 new unit tests).
* **Files Changed:**
  - `scripts/prerender.ts` (Static HTML prerender generator for 6 routes and 404.html with JSON-LD schema)
  - `package.json` (Added workspace `prerender` script)
  - `apps/web/package.json` (Integrated `pnpm prerender` into post-build flow)
  - `apps/web/public/robots.txt` (Standard search engine crawl directives)
  - `apps/web/public/sitemap.xml` (Canonical sitemap listing all 6 destination landing pages)
  - `netlify.toml` (Netlify build, security headers, asset caching, and SPA redirects)
  - `apps/web/src/App.tsx` (Route pathname detection, document title updates, and destination preselection)
  - `packages/validation/tests/technical-seo.test.ts` (Automated tests for sitemap, robots, prerendered files, and Netlify config)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 19/19 test files, 103/103 tests passed in vitest**, exit code 0)
    - `tests/technical-seo.test.ts` (**4/4 tests PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: Workspace build + prerender completed cleanly in ~10s**, generated all 6 route HTML files and 404.html in `apps/web/dist`)
  - Browser Subagent Verification: **PASS** (`seo_routes_verification`)
    - Captured `markdown_to_word_preselected_1792779104394.png`: Navigating to `/markdown-to-word` sets title `Markdown to Word Converter (.docx) | mdtodocs` and preselects `Word` export destination.
    - Captured `markdown_to_pdf_preselected_1792779118584.png`: Navigating to `/markdown-to-pdf` sets title `Markdown to PDF Converter | mdtodocs` and preselects `PDF` export destination.
* **Acceptance Criteria:**
  - [x] Prerender script generates fully populated static HTML files for `/` and all 5 conversion routes.
  - [x] Each route HTML includes custom title, description, canonical link, Open Graph, and JSON-LD `SoftwareApplication`.
  - [x] `sitemap.xml` and `robots.txt` present in `public/` and verified by tests.
  - [x] `netlify.toml` configures headers, cache policy, and SPA rewrite fallback.
  - [x] Client-side hydration reads pathname and preselects the targeted destination.
  - [x] All 20 fidelity fixtures, 103 validation unit tests, and production build pass.

* **Next Allowed Prompt:** Prompt 05: Five Core Conversion Landing Pages

---

## Prompt 05: Five Core Conversion Landing Pages
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build distinct, intent-tailored landing page experiences for the 5 core conversion routes (`/markdown-to-word`, `/markdown-to-pdf`, `/markdown-to-google-docs`, `/markdown-to-html`, `/markdown-to-rich-text`) using ONE shared conversion engine.
  - Create centralized specification module `apps/web/src/routes/landingData.ts` as the single source of truth for both static prerendering and dynamic client hydration.
  - Deliver original, high-quality technical examples, limitation boundaries, and format compatibility verification matrices for each conversion intent:
    - **Word (`/markdown-to-word`)**: Bounded 9,360-twip table margin enforcement, Cambria Math (OMML), 63-column max with automated list linearization polyfill, HTML elements preserved as code.
    - **PDF (`/markdown-to-pdf`)**: Calibrated print typography, `@media print` engine with `@page { margin: 20mm; }`, infinite-resolution vector SVG diagrams, anti-split page breaks, zero-upload local privacy.
    - **Google Docs (`/markdown-to-google-docs`)**: Dual MathML `<math>` XML and KaTeX HTML clipboard payloads for native Docs equation creation, border-preserved table styles, ballot-box checklist characters, high-DPI PNG diagram fallback to bypass Google Docs SVG drop bug.
    - **Standalone HTML (`/markdown-to-html`)**: Self-contained valid HTML5 single-file output with embedded CSS variables, inline SVG diagrams, semantic heading IDs, and zero external CDN trackers.
    - **Universal Rich Text (`/markdown-to-rich-text`)**: Simultaneous multi-MIME (`text/html` + `text/plain`) clipboard writer, TSV/CSV spreadsheet grid formatting for instant cell pasting into Excel/Sheets.
  - Build `apps/web/src/components/LandingPageContent.tsx` rendering destination switcher pills, intent guides, capability boundaries & handled limits, technical verification matrix, and FAQ accordion.
  - Integrate route awareness into `EmptyState.tsx` to display tailored hero titles, intent-specific badges, route-specific sample markdown loaders, and the rich landing guide without obstructing the instant-paste terminal.
  - Connect client-side routing and HTML5 History API (`window.history.pushState` & `popstate` listener) in `App.tsx` for seamless tab switching and browser back/forward navigation.
  - Add standalone HTML export support (`downloadHtml`, `copyHtmlCode`) in `apps/web/src/utils/exportHelpers.ts` and `Header.tsx`.
  - Create comprehensive automated test suite `packages/validation/tests/landing-pages.test.ts` (4 new tests).
* **Files Changed:**
  - `apps/web/src/routes/landingData.ts` (Created canonical route specifications, sample markdowns, format matrices, boundaries, and FAQs)
  - `apps/web/src/components/LandingPageContent.tsx` (Created structured SEO landing component with switcher, boundary cards, matrix table, and FAQs)
  - `apps/web/src/components/EmptyState.tsx` (Adapted hero, route-aware sample loading, and embedded LandingPageContent)
  - `apps/web/src/App.tsx` (Integrated route state, navigation handlers, popstate listening, and synchronized destination preselection)
  - `apps/web/src/utils/exportHelpers.ts` (Added `downloadHtml` and `copyHtmlCode` helpers)
  - `apps/web/src/components/Header.tsx` (Added HTML export handling when on `/markdown-to-html` route)
  - `scripts/prerender.ts` (Synchronized prerender generation with `landingData.ts` and made base template reconstruction idempotent)
  - `packages/validation/tests/landing-pages.test.ts` (Created unit test suite verifying route specs, destination preselection, boundary documentation, and shared engine compilation)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 20/20 test files, 107/107 tests passed in vitest**, exit code 0)
    - `tests/landing-pages.test.ts` (**4/4 tests PASS**)
    - `tests/technical-seo.test.ts` (**4/4 tests PASS**)
    - All other 18 test files (**PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: TypeScript check + Vite bundle + static prerender completed cleanly in ~12s**, exit code 0)
  - Browser Subagent Verification: **PASS** (`landing_pages_verification`)
    - Captured `landing_markdown_to_word_view_1792780111371.png`: Verified Word landing page hero, badge ("Word .docx Specialist"), preselected Word destination, and LandingPageContent sections.
    - Captured `landing_markdown_to_pdf_view_1792780122259.png`: Verified in-app navigation to `/markdown-to-pdf`, title update, hero change to "Convert Markdown to PDF", badge "Print & PDF Engine", and segmented control switching to "PDF".
    - Captured `workspace_pdf_sample_loaded_1792780139950.png`: Clicked "Load Print & PDF Engine Sample", verified instant transition into WORKSPACE mode with the PDF sample markdown, rendered preview, and PDF destination preselected.
* **Acceptance Criteria:**
  - [x] Distinct, functional routes for `/markdown-to-word`, `/markdown-to-pdf`, `/markdown-to-google-docs`, `/markdown-to-html`, and `/markdown-to-rich-text`.
  - [x] ONE shared conversion engine powers all routes and sample exports.
  - [x] Each route preselects the right workflow and displays authentic examples, limitations, and intent-specific guidance.
  - [x] Formats that truly work are exposed natively; limitations and boundaries are clearly documented with evidence.
  - [x] Direct URL navigation and in-app route switching hydrate cleanly and preserve state.
  - [x] All 20 fidelity fixtures, 107 validation unit tests, and production build pass.

* **Next Allowed Prompt:** Prompt 06: Privacy-First Product Analytics (Phase B: Acquisition Foundation)

---

## Prompt 06: Privacy-First Product Analytics
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Implement zero-cookie, privacy-respecting product analytics tracking the full document conversion funnel.
  - Deliver rigorous privacy guarantees: zero raw document text, zero markdown headings/fences/tables, and zero file names are ever captured or transmitted.
  - Implement coarse privacy bucketing for document length (`<500`, `500-2k`, `2k-10k`, `>10k`) and repeat usage (`1`, `2-5`, `6-20`, `>20`).
  - Create typed telemetry client `apps/web/src/utils/analytics.ts` supporting events:
    - `page_view` (debounced on path)
    - `editor_action` (`paste`, `sample`, `type`, `clear`, `drop`)
    - `destination_change` (`from` -> `to`)
    - `export_attempt` (`destination`, `format`, `hasWarnings`)
    - `export_success` (`destination`, `format`, `durationMs`)
    - `export_failure` (`destination`, `format`, `errorType`)
    - `repeat_usage` (`exportCountBucket` tracked via local increment)
  - Instrument client interactions across `App.tsx`, `Header.tsx`, and `EmptyState.tsx`.
  - Author canonical documentation `docs/PRIVACY_AND_ANALYTICS.md` detailing regulatory alignment (GDPR/CCPA/ePrivacy), measurement limitations, consent architecture, and conversion funnel dashboard specifications.
  - Create automated test suite `packages/validation/tests/analytics.test.ts` (6 new unit tests).
* **Files Changed:**
  - `apps/web/src/utils/analytics.ts` (Created typed analytics service with content sanitization, debouncing, and sendBeacon dispatch)
  - `apps/web/src/App.tsx` (Instrumented `page_view` on route change and `editor_action` on typing/clearing)
  - `apps/web/src/components/EmptyState.tsx` (Instrumented `editor_action` on paste, file drop, and sample loading)
  - `apps/web/src/components/Header.tsx` (Instrumented `destination_change`, `export_attempt`, `export_success`, and `export_failure`)
  - `docs/PRIVACY_AND_ANALYTICS.md` (Created canonical documentation for telemetry contract, privacy guarantees, and dashboard specification)
  - `packages/validation/tests/analytics.test.ts` (Created 6 unit tests covering bucketing, sanitization, deduplication, funnel logging, and ad-blocker resilience)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 21/21 test files, 113/113 tests passed in vitest**, exit code 0)
    - `tests/analytics.test.ts` (**6/6 tests PASS**)
    - `tests/landing-pages.test.ts` (**4/4 tests PASS**)
    - `tests/technical-seo.test.ts` (**4/4 tests PASS**)
    - All other 18 test files (**PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: Full workspace build + static prerender completed cleanly in ~12s**, exit code 0)
* **Acceptance Criteria:**
  - [x] Privacy-respecting events added for landing-page view, editor interaction, destination selection, export attempt, export success/failure, and repeat usage.
  - [x] Zero pasted document content, headings, formulas, or raw filenames are transmitted.
  - [x] Document event schema, consent requirements, retention, and measurement limitations authored in `docs/PRIVACY_AND_ANALYTICS.md`.
  - [x] Conversion funnel dashboard specification provided.
  - [x] Event deduplication implemented; app remains 100% usable if analytics is blocked.
  - [x] All 20 fidelity fixtures, 113 validation unit tests, and production build pass.

* **Next Allowed Prompt:** Prompt 07: AI-Generated Document Presets (Phase C: AI-Native Workflows)

---

## Prompt 07: AI-Generated Document Presets
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build 4 AI-native document presets tailored to common LLM outputs plus the default standard preset:
    1. `Product Spec (PRD)` — clean Inter typography, royal blue accents, boxed callout requirements, alternating table fills.
    2. `Technical Architecture` — high-contrast code blocks, JetBrains Mono calibration, full-bleed diagrams, uppercase muted section hierarchy.
    3. `Research & Analysis Report` — Newsreader serif body & headings, academic formal table borders, tinted callouts, generous 1.65 line height.
    4. `Executive Deliverable` — Söhne modern typography, deep navy accents, generous 1.7 line height, and minimalist borderless tables.
    5. `Default Balanced` — Clean standard balanced styling.
  - Deliver immutable source guarantee: presets influence typography, colors, and layout rules for renderers and preview, but NEVER modify the source Markdown string.
  - Keep default workflow 1-step; presets are optional enhancements.
  - Implement preset store management in `apps/web/src/store/index.ts` with `activePresetId` and `setActivePreset`.
  - Connect dynamic preset theming into `App.tsx` (`applyPresetTheme`), `DocumentPreview.tsx`, `Header.tsx`, and `CommandPalette.tsx`.
  - Build sleek Preset Selector dropdown pill in `apps/web/src/components/Header.tsx` showing active preset badge, icon, and preview styling indicators.
  - Author automated test suite `packages/validation/tests/presets.test.ts` (7 new unit tests).
* **Files Changed:**
  - `packages/compiler-core/src/presets/index.ts` (Defined `DocumentPresetId`, `DocumentPreset`, preset themes, and `applyPresetTheme`)
  - `packages/compiler-core/src/index.ts` (Exported presets package)
  - `apps/web/src/store/index.ts` (Added `activePresetId` and `setActivePreset` with persistence and rehydration default)
  - `apps/web/src/App.tsx` (Wired `applyPresetTheme` to `activeTheme` computation)
  - `apps/web/src/components/Header.tsx` (Added Document Preset Selector dropdown pill with glassmorphic popover)
  - `apps/web/src/components/DocumentPreview.tsx` (Connected dynamic preset font family, text colors, border colors, and striped table styles)
  - `apps/web/src/components/CommandPalette.tsx` (Added preset switching commands under Theme & Appearance)
  - `packages/validation/tests/presets.test.ts` (Authored 7 unit tests covering metadata, distinct rules, base font scaling, and AST export styling without source mutation)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 22/22 test files, 120/120 tests passed in vitest**, exit code 0)
    - `tests/presets.test.ts` (**7/7 tests PASS**)
    - `tests/analytics.test.ts` (**6/6 tests PASS**)
    - `tests/landing-pages.test.ts` (**4/4 tests PASS**)
    - All other 19 test files (**PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: TypeScript check + Vite bundle + static prerender completed cleanly in ~12s**, exit code 0)
  - Browser Subagent Verification: **PASS** (`presets_flow_demo`)
    - Captured `presets_dropdown_menu_1792781258865.png`: Verified open presets dropdown displaying all 5 presets with badges (`Standard`, `PRD Spec`, `Tech Spec`, `Research Report`, `Executive Brief`), icons, descriptions, and "Zero content edits" guarantee.
* **Acceptance Criteria:**
  - [x] 4 AI-native document presets defined (PRD, Tech Arch, Research Report, Executive Brief) + Default Balanced.
  - [x] Presets influence typography, colors, and layout rules without modifying the source Markdown string.
  - [x] Default workflow remains 1-step; presets are optional.
  - [x] Preset selector dropdown pill accessible in header with live preview update.
  - [x] Command Palette supports preset switching.
  - [x] Tests assert presets apply correct styles without content corruption.
  - [x] All 20 fidelity fixtures, 120 validation unit tests, and production build pass.

* **Next Allowed Prompt:** Prompt 08: Reliable PDF Engineering (Phase C: AI-Native Workflows)

---

## Prompt 08: Reliable PDF Engineering
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Production-grade PDF print stylesheet overhaul across web app (`apps/web/src/index.css`) and standalone HTML exports (`packages/renderers/src/html.ts`):
    - CSS Paged Media setup with calibrated `@page { size: letter portrait; margin: 20mm 15mm 20mm 15mm; }` and running page numbers via `counter(page)` and `counter(pages)`.
    - Multi-page table splitting: repeating table header group across split pages (`thead { display: table-header-group !important; }`), `tfoot { display: table-footer-group !important; }`.
    - Anti-split page containment: `break-inside: avoid !important; page-break-inside: avoid !important;` on tables, table rows (`tr`), code blocks, callouts, blockquotes, and diagrams.
    - Orphaned heading avoidance: `h1, h2, h3, h4, h5, h6 { break-after: avoid !important; page-break-after: avoid !important; }`.
    - Diagram print optimization: Mermaid vector SVGs and images scaled to 100% printable page width avoiding cutoff.
  - Explicit pagination controls:
    - Support `<!-- pagebreak -->`, `<!-- page-break -->`, `<div class="page-break"></div>`, and `\pagebreak`.
    - Transformed in AST planner into `page-break` nodes without triggering raw HTML warnings.
    - Word `.docx` renderer converts pagebreaks to native `PageBreak` paragraphs.
    - Clipboard HTML renderer converts pagebreaks to `<div class="page-break" style="page-break-after:always;break-after:page;"></div>`.
    - Standalone HTML renderer converts pagebreaks to `<div class="page-break" data-pagebreak="true"></div>`.
    - Web editor preview renders an interactive dashed divider with a centered `PAGE BREAK` indicator badge.
  - Pre-print verification:
    - Added preflight diagnostic rule `pdf-table-width-overflow` warning users when a table exceeds 7 columns on portrait PDF prints.
  - Authored automated unit test suite `packages/validation/tests/reliable-pdf.test.ts` (6 new unit tests).
* **Files Changed:**
  - `apps/web/src/index.css` (Added screen pagebreak divider and comprehensive `@media print` rules with paged media, thead repeating headers, and break containment)
  - `packages/renderers/src/html.ts` (Synchronized `@media print` rules, `@page` margin counters, and pagebreak node generation)
  - `packages/renderers/src/docx.ts` (Added native `PageBreak` paragraph emission for pagebreak tokens and deduplicated `html` key)
  - `packages/renderers/src/clipboard.ts` (Added pagebreak inline style emission in clipboard HTML)
  - `packages/compiler-core/src/planner/index.ts` (Added pagebreak detection for comments, divs, and `\pagebreak`, and added PDF wide-table pre-print check)
  - `packages/compiler-core/src/diagnostics/index.ts` (Added `getDiagnostics()` compatibility method)
  - `apps/web/src/components/DocumentPreview.tsx` (Handled clean pagebreak element rendering in ReactMarkdown preview)
  - `packages/validation/tests/reliable-pdf.test.ts` (Created 6 automated unit tests)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 23/23 test files, 126/126 tests passed in vitest**, exit code 0)
    - `tests/reliable-pdf.test.ts` (**6/6 tests PASS**)
    - `tests/presets.test.ts` (**7/7 tests PASS**)
    - `tests/analytics.test.ts` (**6/6 tests PASS**)
    - All other 20 test files (**PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: Full monorepo build + static prerender completed cleanly in ~12s**, exit code 0)
  - Browser Subagent Verification: **PASS** (`pdf_pagebreak_demo`)
    - Captured `final_task_state_1792782096071.png`: Verified inserting `<!-- pagebreak -->` dynamically renders a stylish dashed `PAGE BREAK` divider in the live preview; Preflight check verifies `Zero Fidelity Degradations` for PDF destination.
* **Acceptance Criteria:**
  - [x] Print stylesheet overhaul with `@media print`, `@page` margins, and running page counters.
  - [x] Multi-page table repeating headers (`thead { display: table-header-group }`).
  - [x] Anti-split page containment (`break-inside: avoid`) on tables, code, callouts, and diagrams.
  - [x] Explicit pagination controls (`<!-- pagebreak -->`, `<div class="page-break">`, `\pagebreak`).
  - [x] Pre-print verification warning for wide tables on PDF destination.
  - [x] Standalone HTML export embeds identical print rules.
  - [x] All 20 fidelity fixtures, 126 validation unit tests, and production build pass.

* **Next Allowed Prompt:** Prompt 09: Document Rescue MVP (Preflight Diagnostics & Auto-Repair)

---

## Prompt 09: Document Rescue MVP (Preflight Diagnostics & Auto-Repair)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Build deterministic pre-export diagnostic engine that detects layout risks and offers 1-click safe repairs without fabricating confidence scores.
  - Implement deterministic rules catalog in `@mdtodocs/compiler-core/src/diagnostics/rescue.ts`:
    - `mermaid-syntax`: Detects unquoted bracket/parenthesis node labels (`[Label (info)]`, `{Choice (A/B)}`), unclosed subgraphs, typographic curly quotes, and malformed arrows. Automated repair applies `autoFixMermaidCode` directly to markdown code blocks.
    - `table-overflow`: Detects tables exceeding column thresholds (> 6 columns for Word, > 7 for PDF). Automated repair linearizes wide tables into itemized bullet lists with key-value pairs.
    - `missing-image-source`: Detects empty or whitespace image destination URLs (`![]()`). Automated repair converts broken empty images into accessible text link placeholders (`[Missing Image: alt](#missing-image)`).
    - `consecutive-pagebreaks`: Detects duplicate adjacent pagebreak tokens (`<!-- pagebreak -->\n<!-- pagebreak -->`) that create blank pages. Automated repair collapses them into a single clean pagebreak.
    - `unsupported-html-element`: Detects unsupported raw HTML tags (`<marquee>`, `<video>`, `<canvas>`) on Word/Google Docs destinations and safely wraps them in code blocks to prevent silent drops.
    - `heading-orphan`: Detects trailing orphan headings at the end of sections or files and badges `requiresVisualVerification: true`.
    - `math-equation-typesetting`: Informs user of Cambria Math XML / MathML typesetting fidelity and flags visual verification for complex nested structures.
  - UI Integration:
    - Floating Document Rescue status pill at the bottom-left of `DocumentPreview.tsx`: dynamically reports `✨ Document Ready`, `⚠️ X Suggestions`, or `🛑 X Errors`.
    - Slide-over drawer `DocumentRescuePanel.tsx`: displays all detected issues with line numbers, severity chips, verification badges (`⚡ 1-Click Auto-Repair` vs `👁️ Visual Verification Required`), individual `[Apply Fix]` buttons, and a header `[Apply All Safe Fixes]` button.
    - Linked from both the floating preview status pill and the Header Preflight flyout (`Open Document Rescue`).
    - Added shortcut command in `CommandPalette.tsx` under Tools & Workflows.
  - Authored automated unit test suite `packages/validation/tests/document-rescue.test.ts` (12 new unit tests).
* **Files Changed:**
  - `packages/compiler-core/src/diagnostics/mermaidFix.ts` (Pure autoFixMermaidCode syntax repair)
  - `packages/compiler-core/src/diagnostics/rescue.ts` (Deterministic rules catalog, DocumentRescueEngine, auto-repair text transformers)
  - `packages/compiler-core/src/diagnostics/index.ts` (Exported rescue engine, rules, and types)
  - `packages/compiler-core/src/index.ts` (Re-exported rescue diagnostics from compiler-core)
  - `packages/asset-pipeline/src/mermaid.ts` (Re-exported shared autoFixMermaidCode from compiler-core)
  - `apps/web/src/store/index.ts` (Added isRescuePanelOpen state and setter)
  - `apps/web/src/components/DocumentRescuePanel.tsx` (Slide-over rescue drawer component)
  - `apps/web/src/components/DocumentPreview.tsx` (Added floating Document Rescue status pill)
  - `apps/web/src/components/Header.tsx` (Added link to Document Rescue in Preflight popover)
  - `apps/web/src/components/Workspace.tsx` (Integrated rescue analyzer and rendered DocumentRescuePanel)
  - `apps/web/src/components/CommandPalette.tsx` (Added Open Document Rescue command)
  - `packages/validation/tests/document-rescue.test.ts` (12 unit tests for all rules, repairs, idempotency, and false positive controls)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/compiler-core build` (**PASS: 0 errors**)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 24/24 test files, 138/138 tests passed in vitest**, exit code 0)
    - `tests/document-rescue.test.ts` (**12/12 tests PASS**)
    - `tests/reliable-pdf.test.ts` (**6/6 tests PASS**)
    - `tests/presets.test.ts` (**7/7 tests PASS**)
    - All other 21 test files (**PASS**)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: Full monorepo build + static prerender 6 routes completed cleanly in ~11s**, exit code 0)
  - Browser Subagent Verification: **PASS** (`document_rescue_flow`)
    - Captured `document_rescue_verified_1792783253574.png`: Verified inserting test markdown with intentional issues triggered floating status pill and Preflight alert; opened Document Rescue slide-over drawer; clicked `[Apply All Safe Fixes]`; verified markdown in editor was atomically repaired; verified status updated to `100% Export Ready / Document Ready`.
* **Acceptance Criteria:**
  - [x] Pre-export diagnostic engine detects likely overflow, unsupported constructs, missing image assets, diagram fallback, and pagination problems.
  - [x] Concise, actionable warnings with safe repairs; zero fabricated confidence scores.
  - [x] Diagnostics are unobtrusive, optional, and available via floating pill and header preflight flyout.
  - [x] Explicit reporting of which issues require visual verification rather than automatic fixing.
  - [x] Tests cover each rule, false positive controls, and idempotent multi-issue batch repairs.
  - [x] All 20 fidelity fixtures, 138 validation unit tests, and production build pass.

---

## Fix: Revert to Original Font
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Fully restore original document typography across the application and live document preview sheet.
  - Revert `apps/web/src/components/DocumentPreview.tsx`:
    - Remove inline `fontFamily` and `lineHeight` style overrides from the paper container (`w-full max-w-[816px]`).
    - Restore original paper text and border colors (`#1a1a1a` / `#e5e7eb`).
    - Restore `font-serif` class (`Newsreader, serif`) to the inner markdown container.
    - Remove inline `fontFamily` style from the inner markdown container.
  - Revert `apps/web/src/App.tsx`:
    - Restore `activeTheme` to default to `THEMES[themeId]` (`DEFAULT_THEME` with `baseFontSizePt`).
  - Restore `font-code-sm text-code-sm font-medium` styling in `apps/web/src/components/interior/loading-button.tsx`.
* **Files Changed:**
  - `apps/web/src/components/DocumentPreview.tsx` (Reverted inline font overrides and restored `font-serif`)
  - `apps/web/src/App.tsx` (Reverted `activeTheme` to `THEMES[themeId]` and cleaned unused imports)
  - `apps/web/src/components/interior/loading-button.tsx` (Restored `font-code-sm text-code-sm` font styling)
  - `docs/EXECUTION_LEDGER.md` (Documented typography restoration)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 24/24 test files, 138/138 tests passed in vitest**, exit code 0)
  - `npx pnpm build` (**PASS: Full monorepo build + static prerender 6 routes completed cleanly**, exit code 0)
  - Browser Subagent Verification: **PASS** (`verify_original_font`)
    - Computed body font on document paragraph: `'Newsreader', serif`.
    - Computed heading font on document h1: `'Söhne', ui-sans-serif, system-ui...`.
    - Captured `original_font_restored_1792786172219.png` showing the original Newsreader serif font faithfully displayed in the live document sheet.

* **Next Allowed Prompt:** Prompt 10: Mermaid Utility Cluster (`/mermaid-to-svg`, `/mermaid-to-png`) (Phase D: Developer Distribution)

---

## Prompt 10: Mermaid Utility Cluster (`/mermaid-to-svg`, `/mermaid-to-png`)
* **Status:** Complete
* **Scope and Intended Behavior:**
  - Audit and extend Mermaid rendering and export pipeline in `@mdtodocs/asset-pipeline`:
    - Add transparent background export (`transparent: true`), stripping background rect and setting `background-color: transparent`.
    - Support custom background palettes: `transparent`, `white` (`#ffffff`), and `dark` (`#1e1e24`).
    - Add SVG sanitization (`sanitizeMermaidSvg`) to ensure valid XML namespace, clean viewBox bounds, and strip malicious scripts or inline handlers.
    - Add accessible semantic transcript extraction (`extractMermaidAccessibleText`) for screen reader alternatives and accessible document fallbacks.
  - Implement dedicated routes and interactive utility workspace in `apps/web`:
    - Routes: `/mermaid-to-svg` and `/mermaid-to-png`.
    - Split-pane workspace: Code editor on the left with templates (`Architecture`, `Sequence`, `State Machine`, `Class Diagram`), syntax error reporting, and 1-click `[Auto-Fix]` button.
    - Live vector canvas on the right with zoom/pan controls, background selector, and resolution multiplier (1x, 2x Retina, 4x Ultra HD).
    - Instant actions: `[Download SVG]`, `[Download PNG]`, `[Copy SVG Code]`, `[Copy PNG Image]`, `[Open in Document Studio]`.
    - Collapsible "Accessibility & Diagram Metadata" section with 1-click accessible transcript copy.
  - Add SEO routing & prerendering:
    - Added `/mermaid-to-svg` and `/mermaid-to-png` to `LANDING_ROUTES` in `landingData.ts` with canonical URLs, unique titles, descriptions, format matrices, limitations, and FAQs.
    - Updated `scripts/prerender.ts` to statically prerender all 8 routes to crawlable HTML with sitemap and robots.txt.
  - Unit test suite authored in `packages/validation/tests/mermaid-utility.test.ts` (6 tests).
* **Files Changed:**
  - `packages/asset-pipeline/src/mermaid.ts` (Added transparent export, custom background, SVG sanitization, and accessible text extraction)
  - `packages/asset-pipeline/src/index.ts` (Exported new mermaid utilities)
  - `apps/web/src/routes/landingData.ts` (Added `/mermaid-to-svg` and `/mermaid-to-png` specifications)
  - `apps/web/src/components/MermaidUtilityView.tsx` (Standalone utility workspace component)
  - `apps/web/src/components/LandingPageContent.tsx` (Added utility routes to destination switcher)
  - `apps/web/src/App.tsx` (Routed `/mermaid-to-svg` and `/mermaid-to-png` to `MermaidUtilityView`)
  - `scripts/prerender.ts` (Added navigation links in SSR template)
  - `packages/validation/tests/mermaid-utility.test.ts` (6 unit tests)
  - `docs/EXECUTION_LEDGER.md` (Updated tracker)
* **Tests Executed and Results:**
  - `npx pnpm --filter @mdtodocs/validation test tests/mermaid-utility.test.ts` (**PASS: 6/6 tests passed**, exit code 0)
  - `npx pnpm --filter @mdtodocs/validation test` (**PASS: 25/25 test files, 144/144 tests passed in vitest**, exit code 0)
  - `npx pnpm test` (`packages/fidelity-lab`) (**PASS: 20/20 fixtures passed in isolated temp dir**, exit code 0)
  - `npx pnpm build` (**PASS: Full monorepo build + static prerender 8 routes completed cleanly**, exit code 0)
  - Browser Subagent Verification: **PASS** (`mermaid_utility_demo`)
    - Loaded `http://localhost:5173/mermaid-to-svg` and verified live code editor and vector preview.
    - Loaded Sequence template and switched to Dark mode palette.
    - Navigated to `http://localhost:5173/mermaid-to-png` and verified resolution scaling (1x, 2x, 4x) and export actions.
    - Verified expanded Accessibility accordion with generated screen reader text.
    - Captured `mermaid_utility_workspace_1792787385829.png`.
* **Acceptance Criteria:**
  - [x] Functional Mermaid-to-SVG and Mermaid-to-PNG workflows with immediate preview.
  - [x] Transparent and solid background options with zero diagram clipping.
  - [x] Resolution selector for PNG (1x, 2x Retina, 4x Ultra HD).
  - [x] Accessible text alternatives extracted and presented in collapsible UI.
  - [x] Syntax error management with 1-click safe auto-fix.
  - [x] Dedicated SEO routes added and statically prerendered (8 total routes).
  - [x] All 20 fidelity fixtures, 144 validation tests, and full production build pass.

* **Next Allowed Prompt:** Prompt 11: README and GitHub Markdown Workflow (Phase D: Developer Distribution)





