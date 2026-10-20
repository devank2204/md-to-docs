# 17: AI-Native Document Workspace Strategy & GStack Review

## Status
- **Current State:** Comprehensive Strategy Review Completed via GStack Multi-Phase Framework (CEO, Design, DevEx, Eng).
- **Target Architecture:** Monorepo Integration into `@mdtodocs/*` and `apps/web` (Rejecting throwaway standalone prototypes).
- **Execution State:** Ready for Phase 1 Implementation.

---

## Part 1: GStack Multi-Phase Plan Review

We reviewed the proposed `md-tocs-strategy.md` document across all four gstack evaluation pillars:

### 1. CEO & Product Thesis Review (Founder Perspective)
- **Verdict: Strong Strategic Direction, Reject Prototype Degradation.**
  - **The Pivot is Right:** A pure Markdown-to-DOCX converter is a commodity. Positioning `mdtodocs` as the **AI-Native Document Workspace** (single source of truth in Markdown, zero-repair stakeholder outputs, AI-agent validation and repair pipeline) captures high enterprise and developer value.
  - **The Prototype Trap:** The raw prompt pack in `md-tocs-strategy.md` suggests creating a toy standalone directory `outputs/md-tocs-mvp/` with CDN scripts and a throwaway Express backend. **This is rejected.** `mdtodocs` already has a sophisticated monorepo with `@mdtodocs/compiler-core` (AST IR), `@mdtodocs/capability-graph`, `@mdtodocs/renderers`, `@mdtodocs/validation` (46 tests), `@mdtodocs/fidelity-lab` (17 fixtures), and a modern React+Vite workspace in `apps/web`.
  - **Decision:** Execute the strategic roadmap directly on top of the established production monorepo.
  - **Moats & Defensibility:**
    1. *Daily Developer Stickiness:* Mermaid 1-click downloads (SVG/PNG/JPEG), Table Excel/CSV copy, and Code beautifier.
    2. *Stakeholder Translation Bridge:* Read-only stakeholder view with "Suggest Edit" linked to GitHub issues.
    3. *Headless AI-Agent API:* Automated `/validate`, `/render`, and `/repair` endpoints for programmatic workflows.

### 2. Design Review (Design Constitution & 10-Dimension Rubric)
- **Verdict: High-Impact Enhancements Aligned with Design Constitution.**
  - **Adherence to Constitution:**
    - *Law 1:* "Hide complexity, not capability."
    - *Law 165:* "Document as hero" — controls must never obscure document content.
    - *Law 180:* "Contextual intelligence — put intelligence next to the object it explains."
  - **Component Ergonomics:**
    - **Mermaid Diagram Suite:** Extend the existing diagram header to support:
      - 1-click Download for **SVG**, **PNG** (2x Retina), and **JPEG** (white background).
      - Theme switching (Neutral, Dark, Forest, Default) directly on the preview card.
      - Inline error diagnosis highlighting the exact error line.
    - **Table Copy-Paste Fidelity Engine:**
      - Do not inject clutter into tables. Use a sleek, floating action bar visible on table hover/focus: `[Copy as Excel]` (HTML table with styling), `[Copy CSV]`, and `[Copy TSV]`.
    - **Code Block Formatting & Actions:**
      - Contextual header on code fences displaying language badge, line count, `Format` button (Prettier-in-browser for JSON/JS/TS/Markdown), and `Copy Code` button.
    - **Stakeholder Presentation Mode:**
      - Seamless URL route or toggle (`?mode=review` or `/view/:id`) that strips editor panes and inspector chrome to show a clean, high-fidelity document sheet with a "Suggest Edit" button.

### 3. Developer Experience (DX) Review
- **Verdict: Zero-Latency Client-First Architecture.**
  - **Client-Side vs Server-Side Rendering:**
    - The original prompt proposed running `mermaid-cli` on a Node.js server. This introduces Puppeteer/Chromium server dependencies, slow cold-starts, latency, and operational cost.
    - **DX Decision:** Run diagram export client-side in the browser using HTML5 `<canvas>` and SVG serialization. It renders in <20ms, works offline, and requires zero cloud infrastructure.
  - **Time To Hello World (TTHW):**
    - 0 seconds. Users paste Markdown and immediately get interactive diagrams, formatted tables, and copy-ready snippets without logging in or running a CLI.
  - **Agent Headless Pipeline:**
    - Package a dedicated API service in `apps/api` (or `@mdtodocs/cli`) providing structured JSON endpoints (`/validate`, `/render`, `/repair`) so agents can validate Markdown documents in CI/CD or local loops.

### 4. Engineering & Architecture Review
- **Verdict: Clean Monorepo Expansion with Strict Verification.**
  - **Package Division:**
    - `apps/web`: Client-side UI enhancements (Mermaid JPEG/Theme, Table Action Bar, Code Block Formatter, Review Mode).
    - `packages/renderers`: Clipboard TSV/Excel/HTML table serialization (`clipboard.ts`).
    - `packages/compiler-core`: Syntax validation routines and table IR extraction.
    - `apps/api`: Express/Fastify headless endpoint runner for AI agents.
  - **Error Boundaries & Resilience:**
    - Canvas rasterization safety for tainted SVGs (inline styles and clean data URLs).
    - Clipboard fallbacks for secure context vs iframe execution.
    - Complete test suites in `packages/validation` and `packages/fidelity-lab`.

---

## Part 2: Phased Implementation Roadmap

This implementation plan is structured into discrete, verifiable tasks. If priorities shift or execution pauses, refer to this ledger to resume from the current task checkpoint.

### Phase 1: Interactive Productivity Engines (Immediate / Non-Negotiable)

#### [Task P13] Table Copy-Paste Fidelity Engine
- **Goal:** Enable developers to copy any Markdown table in the live preview directly into Excel, Google Sheets, or CSV with full structure, alignment, and formatting preserved.
- **Components to Modify:**
  - `apps/web/src/components/DocumentPreview.tsx`: Add floating Table Action Bar on table hover/focus (`[Excel / Sheets]`, `[CSV]`, `[TSV]`).
  - `packages/renderers/src/clipboard.ts`: Add helper functions to convert Markdown table AST into:
    1. Formatted HTML table with cell borders and styling (`text/html`).
    2. Tab-separated values (`text/plain` TSV) for seamless paste into Excel/Sheets cells.
    3. Comma-separated values (CSV) with proper quote escaping.
- **Verification:**
  - Unit tests verifying table TSV and CSV serialization.
  - Browser verification copying table into clipboard and checking clipboard data MIME types.

#### [Task P14] Mermaid Export Suite & Theme Selector
- **Goal:** Complete the Mermaid export suite with JPEG export, theme selector, and precise line-number error reporting.
- **Components to Modify:**
  - `apps/web/src/components/DocumentPreview.tsx`:
    - Add **JPEG export** with clean white canvas background.
    - Add **Mermaid Theme selector** (`neutral`, `default`, `dark`, `forest`) with immediate re-render.
    - Improve error display: Parse Mermaid error messages to extract line numbers and show an inline code excerpt with the failing line highlighted.
- **Verification:**
  - Browser test: Export SVG, PNG (2x), and JPEG files. Verify file sizes and integrity.
  - Test syntax error state with broken Mermaid code: verify line number is identified and rendered clearly without UI crash.

#### [Task P15] JSON & Code Block Live Formatter
- **Goal:** Provide one-click formatting, syntax beautification, and clean copying for code blocks (especially JSON, TS, JS, CSS, HTML).
- **Components to Modify:**
  - `apps/web/src/components/DocumentPreview.tsx`: Enhance the `<pre>` / `<code>` renderer with a contextual Code Action Bar:
    - Language tag badge.
    - `Copy` button with feedback.
    - `Format` button: For JSON, auto-format with indentation; strip comments on copy if needed.
    - Line numbering toggle.
- **Verification:**
  - Test with unformatted JSON code fence: click Format, verify pretty-printed output.
  - Test copy action: verify clipboard receives formatted text.

---

### Phase 2: AI-Agent Document Pipeline & Headless Endpoints

#### [Task P16] Headless Agent API (`apps/api`)
- **Goal:** Expose high-performance programmatic endpoints for AI agents and CI/CD pipelines.
- **End-points:**
  - `POST /api/v1/validate`: Accepts `{ markdown: string }`. Returns `{ valid: boolean, errors: Diagnostic[], warnings: Diagnostic[] }` (broken local/remote links, invalid Mermaid, formatting issues).
  - `POST /api/v1/render`: Accepts `{ markdown: string, format: 'docx' | 'pdf' | 'html' }`. Returns `{ file: base64, report: DocumentMetrics }`.
  - `POST /api/v1/repair`: Accepts `{ originalMarkdown: string, comments: EditComment[] }`. Reconciles review comments and returns updated Markdown source.
- **Package Location:** `apps/api` (or integrated Vite server / `@mdtodocs/cli`).
- **Verification:**
  - Automated integration test suite exercising `/validate` and `/render` with fixtures from `packages/fidelity-lab`.

---

### Phase 3: Stakeholder Review & Collaboration

#### [Task P17] Stakeholder Review Mode & GitHub Issue Suggestions
- **Goal:** Allow developers to share a clean, distraction-free document view with non-technical stakeholders, featuring an integrated "Suggest Edit" mechanism.
- **Components to Modify:**
  - `apps/web/src/components/Workspace.tsx` and router/query state:
    - Support `?view=review` parameter to activate Stakeholder Presentation Mode (hides editor, toolbars, and debug machinery; centers the document as hero).
    - Add a sleek "Suggest Edit" floating button in review mode that opens a pre-filled GitHub issue or copies a structured edit suggestion with selected text.
- **Verification:**
  - Browser test: Toggle review mode, verify clean document presentation and functional "Suggest Edit" modal.

---

## Resume Marker & Next Action
- **Current Task:** Ready to implement **Task P13: Table Copy-Paste Fidelity Engine**.
- **Reference Files:**
  - `packages/renderers/src/clipboard.ts`
  - `apps/web/src/components/DocumentPreview.tsx`
  - `docs/EXECUTION_LEDGER.md`
