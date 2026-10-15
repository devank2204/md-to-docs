# md.to.docs — Baseline Repository Audit

**Date:** October 16, 2026  
**Auditor:** Staff Frontend & Document-Rendering Engineer  
**Repository:** `devank2204/md-to-docs`  
**Working Tree Status:** Clean baseline preserved; 3 tracked web files modified in prior turn ([apps/web/index.html](file:///d:/mdtodocs/md-to-docs/apps/web/index.html), [apps/web/src/App.tsx](file:///d:/mdtodocs/md-to-docs/apps/web/src/App.tsx), [apps/web/src/components/DocumentPreview.tsx](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentPreview.tsx)).

---

## 1. Verified Current Architecture

### 1.1 Workspace Structure
The repository is managed with `pnpm` workspaces (`pnpm-workspace.yaml`):

```
md-to-docs/
├── apps/
│   └── web/                   # React 19 + Vite + Tailwind frontend
├── packages/
│   ├── compiler-core/         # Markdown parsing (remark), planner, diagnostics, themes
│   ├── capability-graph/      # Destination constraints and capability matrix
│   ├── asset-pipeline/        # Image fetching & client-side Mermaid rendering
│   ├── renderers/             # HTML clipboard and DOCX export renderers
│   ├── validation/            # Document validation & fidelity score engine
│   └── fidelity-lab/          # 14 AST snapshot regression fixtures
└── docs/                      # Canonical product specs (00_CONTEXT_INDEX to 16_CURRENT_DESIGN_REVIEW)
```

### 1.2 Intermediate Representation (IR) Reality vs Claims
* **Claim:** [README.md](file:///d:/mdtodocs/md-to-docs/README.md#L14) and [docs/06_DOCUMENT_IR_SPEC.md](file:///d:/mdtodocs/md-to-docs/docs/06_DOCUMENT_IR_SPEC.md) claim an independent, strongly-typed semantic `Document IR` exists with `metadata`, `sections`, `assets`, and `diagnostics`.
* **Reality:** No dedicated `Document IR` or `src/normalizer` exists in [@mdtodocs/compiler-core](file:///d:/mdtodocs/md-to-docs/packages/compiler-core/src/parser/index.ts). The compiler stages operate directly on raw `mdast` (`Root` from `@types/mdast`). Node mutations (such as table-to-list degradation or attaching `resolvedAsset`) occur directly on mdast nodes in-place.

---

## 2. Complete Input-to-Export Flow

```
[User Input]
  ├── Paste / Buffer Drop (App.tsx / EmptyState.tsx)
  └── Monaco-style Textarea (DocumentEditor.tsx -> zustand store)
         │
         ├───▶ [Workspace.tsx Live Preview Pipeline] (Runs on EVERY keystroke, un-debounced)
         │       ├── parseMarkdown(markdown) -> raw mdast Root
         │       ├── resolveAssets(doc) -> network fetch for remote images + mermaid.render()
         │       ├── planRepresentation(doc, destination, collector) -> in-place mdast mutation
         │       ├── validateDocument(doc, destination) -> computes fidelity score (0-100)
         │       └── renderToClipboardHtml(doc, activeTheme) -> COMPUTED & DISCARDED!
         │
         ├───▶ [DocumentPreview.tsx Visible Preview]
         │       └── ReactMarkdown (remark-gfm, remark-math, rehype-katex)
         │             └── MermaidPreview (isolated mermaid.render(), theme='neutral')
         │             * NOTE: DIVERGENT! Preview does NOT use compiled mdast or renderers!
         │
         └───▶ [Header.tsx Export Actions] (Repeats entire pipeline from scratch)
                 ├── 'google-docs' / 'clipboard':
                 │     └── parseMarkdown -> resolveAssets -> planRepresentation -> renderToClipboardHtml
                 │           └── navigator.clipboard.write([text/html, text/plain])
                 ├── 'word':
                 │     └── parseMarkdown -> resolveAssets -> planRepresentation('word') -> renderToDocxBlob
                 │           └── download 'document.docx'
                 └── 'pdf':
                       └── window.print() (Triggers browser print dialog on preview DOM)
```

### Pipeline Breakdown by File and Function:
1. **Input Handling:**
   - Global clipboard paste: `handleGlobalPaste` in [apps/web/src/App.tsx:L32-L43](file:///d:/mdtodocs/md-to-docs/apps/web/src/App.tsx#L32-L43).
   - Editor typing: `DocumentEditor` in [apps/web/src/components/DocumentEditor.tsx:L30-L40](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentEditor.tsx#L30-L40) updating zustand store (`useStore.setMarkdown`).
   - File upload: `handleFileChange` in [apps/web/src/components/EmptyState.tsx:L10-L21](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/EmptyState.tsx#L10-L21).
2. **Parser:**
   - `parseMarkdown(source)` in [packages/compiler-core/src/parser/index.ts:L8-L14](file:///d:/mdtodocs/md-to-docs/packages/compiler-core/src/parser/index.ts#L8-L14). Uses `remark`, `remark-gfm`, `remark-math`, `remark-directive`. Returns raw `Root`.
3. **Asset Resolution:**
   - `resolveAssets(doc)` in [packages/asset-pipeline/src/index.ts:L5-L45](file:///d:/mdtodocs/md-to-docs/packages/asset-pipeline/src/index.ts#L5-L45).
   - Processes `image` via `processImage(url)` (performs network `fetch()`).
   - Processes `code` with `lang === 'mermaid'` via `renderMermaid(source)` in [packages/asset-pipeline/src/mermaid.ts:L34-L104](file:///d:/mdtodocs/md-to-docs/packages/asset-pipeline/src/mermaid.ts#L34-L104).
4. **Planning & Capability Mapping:**
   - `planRepresentation(doc, destination, collector)` in [packages/compiler-core/src/planner/index.ts:L7-L62](file:///d:/mdtodocs/md-to-docs/packages/compiler-core/src/planner/index.ts#L7-L62).
   - Consults `evaluateCapability` in [packages/capability-graph/src/index.ts:L118-L158](file:///d:/mdtodocs/md-to-docs/packages/capability-graph/src/index.ts#L118-L158).
   - Transforms tables exceeding column limits into unordered lists (`transformTableToList`).
5. **Validation:**
   - `validateDocument(doc, destination)` in [packages/validation/src/index.ts:L27-L87](file:///d:/mdtodocs/md-to-docs/packages/validation/src/index.ts#L27-L87). Generates `ValidationReport` with `fidelityScore`.
6. **Visible Preview:**
   - `DocumentPreview` in [apps/web/src/components/DocumentPreview.tsx:L174-L187](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentPreview.tsx#L174-L187). Renders `<ReactMarkdown>` with `rehype-katex` and `MermaidPreview` component ([DocumentPreview.tsx:L25-L51](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentPreview.tsx#L25-L51)).
7. **Destination Renderers:**
   - Clipboard / Google Docs: `renderToClipboardHtml` in [packages/renderers/src/clipboard.ts:L147-L190](file:///d:/mdtodocs/md-to-docs/packages/renderers/src/clipboard.ts#L147-L190).
   - Word (.docx): `renderToDocxBlob` in [packages/renderers/src/docx.ts:L423-L550](file:///d:/mdtodocs/md-to-docs/packages/renderers/src/docx.ts#L423-L550).
   - PDF: `window.print()` in [apps/web/src/components/Header.tsx:L55-L57](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/Header.tsx#L55-L57).

---

## 3. Findings Ranked by Severity

### Critical Severity

#### CRIT-1: Preview / Export Split Brain
* **Evidence:** [DocumentPreview.tsx:L174-L187](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentPreview.tsx#L174-L187) renders raw uncompiled `markdown` using `react-markdown` + `rehype-katex` + isolated `MermaidPreview`, completely bypassing `compiler-core`, `asset-pipeline`, `planner`, and `renderers`.
* **Impact:** The preview gives users a completely false sense of destination fidelity:
  - Math renders as beautiful KaTeX in preview, but exports as raw LaTeX text inside `<pre><code>` in Google Docs clipboard, and as raw text in Cambria Math font in Word.
  - Wide tables appear as full tables in preview, but degrade into bulleted lists in the exported document when `planRepresentation` polyfills them.
  - Mermaid theme in preview (`theme: 'neutral'`) diverges from the asset pipeline's theme.
  - What the user sees is NOT what the user gets.

#### CRIT-2: Export Pipeline Redundancy & Diagnostics Dropped
* **Evidence:** [Header.tsx:L22-L53](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/Header.tsx#L22-L53).
* **Impact:**
  - Clicking "Download .docx" or "Copy for Google Docs" re-executes `parseMarkdown`, `resolveAssets` (re-fetching remote images over the network), and `planRepresentation` from scratch, throwing away the already-compiled state in `Workspace.tsx`.
  - The `new DiagnosticsCollector()` created in `Header.tsx` is discarded upon completion; export errors and planner warnings are never communicated to the user.

#### CRIT-3: Severe UI Keystroke Thrashing & Network Flooding
* **Evidence:** [Workspace.tsx:L119-L166](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/Workspace.tsx#L119-L166) and [asset-pipeline/src/index.ts:L68-L75](file:///d:/mdtodocs/md-to-docs/packages/asset-pipeline/src/index.ts#L68-L75).
* **Impact:**
  - `compile()` runs on every single keystroke with **0ms debounce**.
  - No cancellation (`AbortController`): concurrent async keystroke compilations race, causing stale state overwrites.
  - `processImage()` fetches remote images over HTTP on every single keystroke without caching.
  - `renderToClipboardHtml()` is generated on every keystroke in `Workspace.tsx:L136` and stored in `compiledState.htmlContent`, but is **never passed to any DOM component**.

---

### High Severity

#### HIGH-1: Vitest Test Suite Completely Broken in `@mdtodocs/validation`
* **Evidence:** `npx pnpm --filter @mdtodocs/validation test` fails 4 out of 5 tests (Exit code 1).
  - `mermaid.test.ts`, `mermaid-integration.test.ts`, `mermaid-test-2.test.ts`: Fail with `TypeError: childNodeEl.node(...)?.getBBox is not a function` because jsdom does not implement SVG layout methods required by Mermaid v12.
  - `stress.test.ts:L78`: Fails with `TypeError: Cannot read properties of undefined (reading 'find')` because the test expects `doc.assets` on the AST `Root`, which does not exist in the implementation.

#### HIGH-2: Fidelity Lab Side Effects & Dirty Working Tree Overwrites
* **Evidence:** [packages/fidelity-lab/src/runner.ts:L49-L69](file:///d:/mdtodocs/md-to-docs/packages/fidelity-lab/src/runner.ts#L49-L69).
* **Impact:**
  - The test runner unconditionally writes `.output/preview.html`, `.output/clipboard.html`, and `.output/document.docx` to disk.
  - All 14 fixture `.output/` directories contain files that are **tracked in git** (`git ls-files packages/fidelity-lab/fixtures/001-core-headings/.output`).
  - Running `pnpm test` mutates binary `.docx` files (new zip timestamps), polluting `git status` with dirty tracked changes.
  - If `expected-ir.json` is missing, `runner.ts` silently auto-generates it without failing the run.

#### HIGH-3: Fidelity Lab Fails to Validate Rendered Outputs
* **Evidence:** [packages/fidelity-lab/src/runner.ts:L41-L78](file:///d:/mdtodocs/md-to-docs/packages/fidelity-lab/src/runner.ts#L41-L78).
* **Impact:**
  - `runner.ts` ONLY tests `expectedIr.trim() === actualIr.trim()`.
  - The generated `clipboard.html` and `document.docx` are written to disk but **never asserted against expected snapshots**.
  - `preview.html` generation is stubbed with a static string: `<p>HTML preview rendering via ReactMarkdown is handled by frontend</p>`.

#### HIGH-4: Misleading Capability Matrix & Fake Equations
* **Evidence:**
  - [capability-graph/src/index.ts:L105](file:///d:/mdtodocs/md-to-docs/packages/capability-graph/src/index.ts#L105) declares `math: { 'google-docs': 'image', word: 'native', pdf: 'native', clipboard: 'image' }`.
  - [clipboard.ts:L109-L114](file:///d:/mdtodocs/md-to-docs/packages/renderers/src/clipboard.ts#L109-L114) actually renders math as raw LaTeX inside `<pre><code>`.
  - [docx.ts:L322-L330](file:///d:/mdtodocs/md-to-docs/packages/renderers/src/docx.ts#L322-L330) renders math as raw LaTeX text inside a `TextRun` styled with `font: 'Cambria Math'`. It does NOT emit Office Math Markup Language (OMML) or equation images.
  - `capability-graph` declares `supportsMermaid: false` for all destinations, yet `docx.ts` and `clipboard.ts` explicitly embed resolved Mermaid SVG images.

---

### Medium Severity

#### MED-1: Cyclic Workspace Dependency
* **Evidence:** [packages/capability-graph/package.json:L9](file:///d:/mdtodocs/md-to-docs/packages/capability-graph/package.json#L9) depends on `@mdtodocs/compiler-core`, and [packages/compiler-core/package.json:L9](file:///d:/mdtodocs/md-to-docs/packages/compiler-core/package.json#L9) depends on `@mdtodocs/capability-graph`.
* **Impact:** `pnpm` issues cyclic dependency warnings. `capability-graph` does not import anything from `compiler-core` in code.

#### MED-2: Mermaid Fence Recognition Fragility
* **Evidence:** [packages/asset-pipeline/src/index.ts:L18](file:///d:/mdtodocs/md-to-docs/packages/asset-pipeline/src/index.ts#L18) checks strictly `node.type === 'code' && node.lang === 'mermaid'`.
* **Impact:** Blocks formatted as ````mermaid {title="..."}````, ````Mermaid````, or with trailing attributes are ignored by the compiler pipeline and rendered as plain text code blocks.

#### MED-3: Lack of Diagram Controls in UI
* **Evidence:** [DocumentPreview.tsx:L25-L51](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/DocumentPreview.tsx#L25-L51).
* **Impact:** Diagrams have no controls to copy source, copy SVG, or download as SVG/PNG, despite diagrams being a core product pillar.

#### MED-4: PDF Export is Browser Print Stub
* **Evidence:** [Header.tsx:L55-L57](file:///d:/mdtodocs/md-to-docs/apps/web/src/components/Header.tsx#L55-L57) simply invokes `window.print()`.
* **Impact:** There is no dedicated PDF layout engine, deterministic pagination, header/footer geometry, or page-margin control.

---

### Low Severity

#### LOW-1: Missing README Components
* **Evidence:** [README.md:L17](file:///d:/mdtodocs/md-to-docs/README.md#L17) claims `@mdtodocs/renderers` contains `html.ts`, which does not exist in the codebase.

#### LOW-2: Oxlint Warnings in Web Application
* **Evidence:** 5 warnings from `oxlint`:
  - `DocumentPreview.tsx:L179`: Unused `node` parameter.
  - `DocumentPreview.tsx:L27`: Impure `Math.random()` in `useRef` initialization.
  - `segmented-control.tsx:L53`: Mutating ref during render (`emit.current = onValueChange`).
  - `loading-button.tsx:L16`: Exporting non-component `useAsyncAction`.
  - `loading-button.tsx:L276`: Redundant logical condition `{face.icon && face.icon}`.

---

## 4. Build, Lint, and Test Audit Results

| Target / Package | Command | Exit Code | Result | Key Details / Output |
| :--- | :--- | :---: | :---: | :--- |
| `web` (Build) | `npx pnpm --filter web build` | `0` | **PASS** | TypeScript + Vite compiled successfully in 2.67s. |
| `compiler-core` | `npx pnpm --filter @mdtodocs/compiler-core build` | `0` | **PASS** | `tsc` passed without errors. |
| `capability-graph` | `npx pnpm --filter @mdtodocs/capability-graph build` | `0` | **PASS** | `tsc` passed without errors. |
| `renderers` | `npx pnpm --filter @mdtodocs/renderers build` | `0` | **PASS** | `tsc` passed without errors. |
| `web` (Lint) | `npx pnpm --filter web lint` | `0` | **PASS (5 warnings)** | 5 warnings detected by `oxlint`, 0 errors. |
| `validation` (Tests) | `npx pnpm --filter @mdtodocs/validation test` | `1` | **FAIL** | 4 failed, 1 passed (jsdom getBBox missing + `doc.assets` undefined). |
| `fidelity-lab` (Tests) | Dry-run inspected | N/A | **BLOCKED** | Side-effects: overwrites tracked fixture `.output/` files and auto-generates missing snapshots. |

---

## 5. Missing Test Coverage & Misleading Claims

1. **No Output Assertions in Fidelity Lab:** The test harness writes HTML and DOCX to disk but does not assert their validity, XML structure, or styles.
2. **Missing Normalizer & Semantic IR:** The repository does not have an independent `Document IR`. Remark AST is mutated directly.
3. **Missing `html.ts` Renderer:** Listed in `README.md` under `@mdtodocs/renderers`, but missing from disk.
4. **Equation Rendering:** Claimed as native Word equations and Google Docs images; implemented only as raw LaTeX code blocks and text runs.

---

## 6. Prioritized Work Sequence

1. **Stage 1: Fidelity Lab & Validation Test Harness Hardening**
   - Mock/shim `SVGElement.prototype.getBBox` in jsdom for `vitest` in `@mdtodocs/validation`.
   - Fix `stress.test.ts` to access AST nodes properly instead of undefined `doc.assets`.
   - Ensure `fidelity-lab` does not mutate tracked files during test execution (redirect `.output/` to a temporary directory or ignore it in git).
2. **Stage 2: Pipeline Consolidation & Keystroke Throttling**
   - Debounce compiler execution in `Workspace.tsx` (e.g. 250-300ms) with `AbortController` cancellation.
   - Cache fetched remote image data URIs in `asset-pipeline`.
   - Remove dead `renderToClipboardHtml` execution from `Workspace.tsx`.
   - Reuse compiled AST state during export in `Header.tsx` instead of recompiling and re-fetching assets.
3. **Stage 3: Visible Preview & Export Unification**
   - Align `DocumentPreview` to consume the compiled and planned representation so destination polyfills (e.g. table linearization) are accurately shown.
   - Add diagram action controls (Copy SVG, Download SVG/PNG) to diagram previews.
4. **Stage 4: Math & Equations Rendering Accuracy**
   - Update capability graph to honestly reflect math support.
   - Investigate MathML / SVG rendering for clipboard and OMML for Word.
5. **Stage 5: Architecture Hygiene & Cyclic Dependency Cleanup**
   - Remove unused `@mdtodocs/compiler-core` dependency from `packages/capability-graph/package.json`.
   - Clean up oxlint warnings in `apps/web`.

---

## 7. Uncertainties Requiring Manual Browser Testing

1. **Google Docs Clipboard Ingestion:** How does Google Docs actually interpret the inline CSS generated by `renderToClipboardHtml` for callouts, tables, and SVG diagrams across Chrome, Firefox, and Safari on Windows/macOS?
2. **Word Native Paste:** Does Word desktop preserve SVG data URIs pasted via the HTML clipboard, or does it require Word OpenXML (`.docx`) file download?
3. **Browser Print Fidelity:** How does `window.print()` paginate across different browser print drivers when multi-page documents containing KaTeX math and Mermaid diagrams are printed?
