# Architecture V2

## Compiler spine

``` text
Markdown
  ↓
Parser
  ↓
Source AST + source map
  ↓
Normalization
  ↓
Document IR
  ↓
Capability negotiation
  ↓
Destination planner
  ├── Google Docs
  ├── DOCX
  ├── PDF
  └── Clipboard
  ↓
Validation
  ↓
Artifact + diagnostics + regression record
```

## Architecture laws

1.  Renderers never parse Markdown.
2.  Document IR, not browser preview, is the source of truth.
3.  Never silently discard semantics.
4.  Every bug becomes a permanent fixture.
5.  Destination behavior belongs in destination profiles.
6.  More compiler intelligence should produce less UI complexity.

## Document IR

``` ts
interface DocumentIR {
  version: string
  metadata: DocumentMetadata
  theme: DocumentTheme
  page: PageConfig
  sections: Section[]
  assets: Asset[]
  diagnostics: Diagnostic[]
  source: SourceMap
}
```

First-class blocks:

``` text
Heading
Paragraph
List
Blockquote
CodeBlock
Table
ImageBlock
Callout
ThematicBreak
PageBreak
MathBlock
DiagramBlock
FootnoteDefinition
```

Inline:

``` text
Text
Strong
Emphasis
Strike
InlineCode
Link
InlineImage
InlineMath
```

## Table model

Tables need explicit layout intent:

``` ts
interface TableLayout {
  widthMode: "auto" | "fit" | "fixed"
  preferredWidths?: number[]
  allowSplitAcrossPages: boolean
  repeatHeader: boolean
  overflowStrategy:
    | "wrap"
    | "landscape"
    | "split"
    | "scale"
    | "warn"
}
```

## Capability graph

``` ts
type Support =
  | "native"
  | "styled"
  | "transformed"
  | "image"
  | "text"
  | "unsupported"
```

Example:

``` text
Mermaid
  Google Docs -> image + provenance
  DOCX        -> image + provenance
  PDF         -> SVG/vector where stable
  Clipboard   -> SVG/PNG according to target
```

## Destination profiles

### Google Docs

Support three delivery paths:

1.  rich clipboard for pasting into an existing Doc,
2.  Drive Markdown conversion for creating a Doc from a file,
3.  direct Docs API for precise programmatic structure.

All three consume the same IR.

Google's Docs API exposes native operations for text insertion, text
style, paragraph style, lists, inline images, tables, page breaks and
table styling.

### DOCX

Use a mature JS/TS DOCX library such as `docx.js`.

Own:

-   semantic styles,
-   numbering,
-   tables,
-   images,
-   headers/footers,
-   page geometry,
-   accessibility semantics,
-   fallback strategy.

### PDF

Use browser/web technology plus a pagination layer such as Paged.js
where appropriate.

Do not assume browser preview HTML is identical to print HTML.

### Clipboard

Emit at least:

``` text
text/html
text/plain
```

Inline critical styles and test real destination applications.

## Validation

Every render returns:

``` text
artifact
render manifest
diagnostics
validation report
```

Validation stages:

-   semantic,
-   structural,
-   visual,
-   behavioral,
-   degradation.

## First vertical slice

Build:

``` text
Markdown
→ remark + GFM
→ normalization
→ Document IR
→ Google rich clipboard
→ DOCX
→ PDF
```

Initial features:

-   H1--H6
-   paragraphs
-   emphasis
-   links
-   ordered/unordered lists
-   blockquotes
-   tables
-   code
-   images

Then add:

-   footnotes,
-   math,
-   Mermaid,
-   captions,
-   headers/footers,
-   advanced pagination.

## Monorepo shape

``` text
packages/
  parser/
  normalizer/
  document-ir/
  capability-graph/
  planner/
  renderer-google/
  renderer-docx/
  renderer-pdf/
  renderer-clipboard/
  assets/
  diagnostics/
  validation/
  fixtures/

apps/
  web/
  benchmark/
```

## UI/compiler boundary

Compiler:

``` json
{
  "nodeId": "table-14",
  "destination": "docx",
  "diagnostic": {
    "code": "TABLE_WIDE",
    "severity": "warning",
    "message": "Table exceeds portrait width",
    "suggestedAction": "USE_LANDSCAPE"
  }
}
```

UI:

> Wide table · landscape recommended

The UI should show consequences and actions, not internal compiler
terminology.

## Final architecture decision

This is a destination-aware document compiler, not a simple format
converter.

Open source supplies syntax and rendering primitives.

Our proprietary layer owns:

-   semantic normalization,
-   Document IR,
-   capability negotiation,
-   destination planning,
-   layout intelligence,
-   loss accounting,
-   diagnostics,
-   fidelity testing,
-   regression corpus,
-   workflow UX.
