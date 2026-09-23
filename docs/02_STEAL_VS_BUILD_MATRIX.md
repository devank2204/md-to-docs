# Steal vs Build Matrix

## Operating rule

> Borrow the world's solved work. Own the unsolved problems. Obsess over
> the experience. Measure the result.

"Steal" means legally reuse, adapt or learn from code under its
applicable license. It does not mean ignoring license obligations.

## Matrix

  Area                       Decision          Why
  -------------------------- ----------------- --------------------------------------
  Markdown parsing           USE DIRECTLY      solved, mature
  GFM                        USE DIRECTLY      solved syntax
  Math parsing               USE DIRECTLY      solved syntax
  DOCX primitives            USE DIRECTLY      commodity packaging
  Math rendering             USE DIRECTLY      mature ecosystem
  Diagram engine             USE/STUDY         expensive to recreate
  Syntax highlighting        USE DIRECTLY      commodity
  PDF pagination             USE/STUDY         mature pagination primitives
  Rich clipboard             STUDY/ADAPT       behavior is important but not unique
  Google Docs API            USE DIRECTLY      official destination API
  Drive Markdown import      USE DIRECTLY      official destination path
  Markdown→DOCX edge cases   STUDY/ADAPT       mine proven fixes
  Broad conversion           BENCHMARK/STUDY   Pandoc is the oracle
  Document IR                BUILD             strategic core
  Capability graph           BUILD             strategic core
  Destination planner        BUILD             strategic core
  Table layout solver        BUILD             major fidelity differentiator
  Pagination policy          BUILD             cross-destination intelligence
  Loss accounting            BUILD             trust + diagnostics
  Provenance                 BUILD             round-trip + explainability
  Diagnostics                BUILD             compiler intelligence becomes UX
  Fidelity corpus            BUILD             long-term moat
  Cleanup metric             BUILD             product KPI
  Round-trip model           BUILD             strategic differentiator

## Proprietary compiler layer

### Normalization

Convert source AST into a stable semantic tree with:

-   stable node IDs,
-   source positions,
-   normalized headings/lists/tables,
-   asset references,
-   feature classification.

### Document IR

The IR is the contract between semantics and destinations.

It must understand:

-   document structure,
-   semantics,
-   assets,
-   layout intent,
-   provenance,
-   diagnostics.

It must not understand Word XML, Google Docs indices or CSS
implementation details.

### Capability graph

Each destination declares whether a feature is:

-   native,
-   native-with-style,
-   transformed,
-   image fallback,
-   text fallback,
-   unsupported.

Never silently discard semantics.

### Destination planner

The planner chooses:

-   representation,
-   layout,
-   pagination,
-   fallback,
-   warning/diagnostic.

### Layout solver

Especially for tables:

1.  measure,
2.  wrap,
3.  prioritize columns,
4.  try landscape,
5.  split if appropriate,
6.  warn when necessary.

### Loss accounting

Every transformation should preserve why it happened and whether
recovery is possible.

Example:

``` json
{
  "nodeId": "diagram-17",
  "destination": "docx",
  "original": "mermaid",
  "representation": "svg-image",
  "recoverable": true
}
```

### Diagnostics

Compiler facts should become contextual UI:

> Wide table · landscape recommended

not:

> TABLE_WIDE capability failure.

## What not to build first

Do not spend early effort on:

-   a new Markdown parser,
-   a GFM parser,
-   a basic DOCX ZIP writer,
-   a generic syntax highlighter,
-   a basic KaTeX renderer,
-   a generic Mermaid engine,
-   a generic clipboard serializer.

Build the intelligence immediately above these primitives.
