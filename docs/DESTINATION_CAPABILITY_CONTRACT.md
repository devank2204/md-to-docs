# md.to.docs: Destination Capability Contract & Structured Warning Model

This document defines the formal destination capability contract, fallback mappings, diagnostic rules, and fidelity guarantees across all output destinations in `md.to.docs`: **Google Docs (rich clipboard)**, **Microsoft Word (.docx)**, **PDF (print/vector)**, and **Universal Clipboard**.

---

## 1. Core Architecture & Product Promise

The primary architectural guarantee of `md.to.docs` is:
> **Zero Silent Drops**: No Markdown element, table row, equation, diagram, or raw HTML construct shall ever vanish or be silently dropped during export. If a target format cannot represent a construct natively, the compiler applies an explicit, deterministic transformation with a structured warning diagnostic.

### Destination Matrix Overview

| Feature Category | Markdown Syntax | Google Docs | Word (.docx) | PDF (Vector) | Clipboard HTML |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headings (H1–H6)** | `# ... ######` | Native | Native (Styles 1–6) | Native | Native |
| **Typography** | `**b**`, `*i*`, `~~s~~`, `` `code` `` | Native | Native (OOXML runs) | Native | Native |
| **Lists & Nesting** | `- `, `1. ` (up to 9 levels) | Native | Native (numPr) | Native | Native |
| **Task Lists** | `- [x]`, `- [ ]` | Styled (Ballot glyphs) | Styled (Ballot glyphs) | Native | Styled (Ballot glyphs) |
| **Tables (Standard)** | `\| Col \|` (<= 20 cols) | Native (thead/tbody) | Native (proportional) | Native | Styled HTML |
| **Tables (Wide)** | `\| Col \|` (> 20 cols) | **Transformed** (List) | Native (up to 63) / List | **Transformed** (List) | **Transformed** (List) |
| **Code Blocks** | ` ```lang ` | Styled (Shaded/indent) | Styled (Shaded/indent) | Native | Styled |
| **Callouts** | `:::note`, `:::warning`, etc. | Styled (Accent table) | Styled (Accent table) | Styled | Styled |
| **Equations (Inline)** | `$E=mc^2$` | Transformed (MathML/KaTeX)| Styled (Cambria Math) | Native (KaTeX) | Transformed (MathML/KaTeX)|
| **Equations (Display)**| `$$ \int ... $$` | Transformed (MathML/KaTeX)| Styled (Cambria Math) | Native (KaTeX) | Transformed (MathML/KaTeX)|
| **Footnotes** | `[^1]` & `[^1]: ...` | Transformed (Super links)| Native (Endnotes) | Native | Transformed (Super links)|
| **Mermaid Diagrams** | ` ```mermaid ` | Image (Vector SVG) | Image (Vector SVG) | Native (SVG) | Image (Vector SVG) |
| **Images** | `![alt](url)` | Native | Native (OOXML Image) | Native | Native |
| **Raw HTML** | `<video>`, `<canvas>`, etc. | **Transformed** (Code) | **Transformed** (Code) | Styled | **Transformed** (Code) |

---

## 2. Structured Diagnostic & Warning Model

All destination planning warnings and compiler notices conform to the `DocumentDiagnostic` interface defined in `@mdtodocs/compiler-core` and `@mdtodocs/capability-graph`:

```typescript
export interface DocumentDiagnostic {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'error';
  destination: DestinationType;
  message: string;
  nodeType?: string;
  position?: { line: number; column: number };
  suggestedAction?: string;
  fixAction?: {
    label: string;
    description: string;
    autoFixable: boolean;
    apply?: (tree: Root) => void;
  };
}
```

### Diagnostic Rules Inventory

| Rule ID | Severity | Trigger Condition | Automated Fallback |
| :--- | :--- | :--- | :--- |
| `wide-table-overflow` | `warning` | Table columns exceed destination limit (> 20 for Google Docs/PDF/Clipboard, > 63 for Word) | Automatically linearizes table rows into hierarchical bullet lists (`data.polyfill = 'table-to-list'`) |
| `unsupported-html-element`| `warning` | Raw HTML element (e.g. `<video>`, `<canvas>`, `<iframe>`) detected | Converted into a visible, styled code block (`data.polyfill = 'html-to-code'`) so raw text and attributes are never lost |
| `missing-image-source` | `warning` | Image node has empty or unresolvable URL | Converted into fallback text link preserving alt text (`[Missing Image: alt]`) |
| `mermaid-asset-conversion`| `info` | Mermaid diagram block compiled | Compiles into standalone vector SVG asset with inlined theme colors and solid background |
| `math-equation-typesetting`| `info` | Math expression detected | Dual-renders MathML and KaTeX HTML for clipboard, or Cambria Math runs for Word |
| `callout-styling` | `info` | Container directive detected | Wraps block in a single-cell table with left accent border and cantSplit protection |

---

## 3. Fallback Strategies (Zero Silent Drop Guarantee)

### 3.1 Wide Table Linearization (`table-to-list`)
- **Problem**: When a table with 20+ columns is pasted into Google Docs or exported to printable PDF/Word, cells are crushed to sub-millimeter widths, causing text truncation and unusable layouts.
- **Contract Fallback**: The compiler's planner (`planRepresentation`) detects columns exceeding the profile threshold and automatically restructures the table into an indented, hierarchical list:
  ```markdown
  * Row 1:
    * Col 1 Value
    * Col 2 Value
  * Row 2:
    * Col 1 Value
  ```
- **Fidelity Guarantee**: 100% of the table's text and values are preserved in readable order.

### 3.2 Raw HTML Preservation (`html-to-code`)
- **Problem**: In standard Markdown-to-Word or Markdown-to-Docs pipelines, raw HTML elements like `<video>`, `<canvas>`, or `<audio>` are dropped into the void by AST visitors that only handle native Markdown nodes.
- **Contract Fallback**:
  - The planner converts raw HTML into a styled code block with `lang: 'html'`.
  - The exporters (`docx.ts`, `clipboard.ts`, `html.ts`) implement fallback handlers: if an unhandled node arrives, its inner text is preserved in shaded monospace paragraphs or escaped `<pre><code>`.
- **Fidelity Guarantee**: Raw markup and human-readable text are never silently dropped.

### 3.3 Unknown Node Traversal (`fallbackNode`)
- **Problem**: Custom remark plugins or future AST node extensions can produce unrecognized nodes. If a renderer lacks an explicit handler, it might omit the node and its children.
- **Contract Fallback**: All core renderers (`docxRenderer`, `clipboardRenderer`, `htmlRenderer`) define a recursive `fallbackNode`:
  - If the node has a string `value`, it is rendered as text.
  - If the node has `children`, the renderer recursively renders all children.
- **Fidelity Guarantee**: Even unknown wrapper nodes preserve their full child content.

---

## 4. Pre-Export Quality UI Integration

In `apps/web/src/components/Header.tsx`, a Preflight Quality Indicator is integrated alongside the destination selector:

1. **Quiet When Clean**: When a document has 0 warnings for the chosen destination, the indicator displays a subtle check icon with `Ready` state without demanding attention.
2. **Actionable When Degraded**: When warnings exist (e.g. 1 linearized wide table, 1 raw HTML block), a compact amber badge (`[ ⚠️ 1 warning ]`) appears.
3. **Interactive Flyout**: Clicking the badge reveals a glassmorphic flyout detailing:
   - Target destination format.
   - Specific warnings with exact line numbers (`Line 42`).
   - Active fallback applied (e.g., `Table linearized to list to prevent overflow`).
   - Direct link to open the full Document Inspector.
4. **Non-Blocking Workflow**: The primary action button remains 1-step and fully clickable at all times. Preflight warnings never lock or prevent immediate export.

---

## 5. Verification & Regression Coverage

The capability contract is tested deterministically in:
- `packages/validation/tests/capability-contract.test.ts` (Rules, wide table warnings, HTML preservation, missing image fallback, exporter zero-drop assertions).
- `packages/validation/tests/capability-inspector.test.ts` (Feature capabilities and destination profiles).
- `packages/fidelity-lab/fixtures/018-long-lines-and-overflow/` (Wide table and token stress testing).
- `packages/fidelity-lab/fixtures/019-unsupported-constructs/` (Raw HTML and unsupported directives).
