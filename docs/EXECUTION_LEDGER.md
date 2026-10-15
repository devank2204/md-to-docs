# md.to.docs — Execution Ledger

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
* **Next Allowed Prompt:** Prompt 2 — Test Harness Stabilization & Fidelity Isolation (Fixing jsdom SVG/Mermaid mocks in `@mdtodocs/validation` and isolating `fidelity-lab` output generation to prevent dirtying tracked git files).

---

## Prompt 2: Test Harness Stabilization & Fidelity Isolation
* **Status:** Queued
* **Scope and Intended Behavior:**
  - Provide jsdom mocks for `SVGElement.prototype.getBBox` in `@mdtodocs/validation` test configuration so Mermaid tests pass deterministically in CI/local runs.
  - Fix `stress.test.ts` to access AST properties correctly.
  - Isolate `fidelity-lab` runner so `.output/` does not dirty tracked repository files or auto-generate snapshots unexpectedly.
* **Files Changed:** (None yet)
* **Tests Executed:** (Pending)
* **Acceptance Criteria:**
  - [ ] All `@mdtodocs/validation` tests pass cleanly.
  - [ ] `fidelity-lab` test runner can run without dirtying git working tree.

---

## Prompt 3: Pipeline Consolidation & Live Workspace Optimization
* **Status:** Queued
* **Scope and Intended Behavior:**
  - Introduce debounce and `AbortController` cancellation to the live compilation effect in `Workspace.tsx`.
  - Cache fetched image blobs/URIs in `@mdtodocs/asset-pipeline` to stop redundant HTTP requests.
  - Remove dead `renderToClipboardHtml` calculation from the live keystroke loop.
  - Pass compiled document state from `Workspace.tsx` to `Header.tsx` to eliminate duplicate parsing and asset fetching on export.
* **Files Changed:** (None yet)
* **Tests Executed:** (Pending)

---

## Prompt 4: Preview & Export Unification
* **Status:** Queued
* **Scope and Intended Behavior:**
  - Align `DocumentPreview.tsx` to render the destination-planned document representation so capability polyfills and warnings are accurately visualized.
  - Add diagram action controls (copy SVG, download SVG/PNG) to Mermaid diagram blocks.
* **Files Changed:** (None yet)
* **Tests Executed:** (Pending)
