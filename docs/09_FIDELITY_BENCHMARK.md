# mdtodocs.com Fidelity Benchmark

## Purpose

Build a permanent corpus that measures whether mdtodocs.com actually produces destination-ready documents.

The benchmark is part of the product moat.

---

# 100-fixture corpus

## 001–020: Core Markdown

Examples:

- headings
- paragraphs
- emphasis
- links
- nested lists
- blockquotes
- thematic breaks
- inline code
- escaping
- metadata

## 021–035: Tables

Examples:

- simple tables
- wide tables
- long cells
- multiline content
- repeating headers
- page splits
- alignment
- mixed content
- extreme column ratios

## 036–043: Code

Examples:

- languages
- long lines
- whitespace
- multiline code
- code near page boundaries
- code with tables/headings

## 044–050: Images

Examples:

- inline images
- large images
- small images
- captions
- aspect ratios
- missing assets
- mixed text/image layouts

## 051–065: Professional documents

Examples:

- technical specification
- research paper
- proposal
- report
- meeting notes
- README
- policy document
- multi-section document

## 066–080: AI-generated documents

Examples:

- irregular headings
- excessive nesting
- malformed tables
- inconsistent lists
- callouts
- unusual spacing
- generated diagrams
- mixed math/code

## 081–095: Pagination torture

Examples:

- orphan headings
- widow paragraphs
- long tables
- large code blocks
- image near page boundary
- section transitions
- repeated headers
- page breaks

## 096–100: Monster documents

Large, mixed-content documents combining many difficult features.

---

# Fixture structure

Preferred:

```text
fixture/
  input.md
  manifest.json
  expected-ir.json
  expected/
    google/
    docx/
    pdf/
  diagnostics.json
  screenshots/
```

---

# Measurement

Internal score dimensions:

- Semantic fidelity: 35%
- Structural fidelity: 25%
- Visual fidelity: 20%
- Behavioral fidelity: 10%
- Controlled degradation: 10%

Also measure:

> Manual Cleanup Minutes

A high weighted score with high cleanup time is not a product success.

---

# Benchmark competitors / baselines

Benchmark against:

- Google native Markdown import/paste
- Pandoc
- MarkCopy
- representative Markdown→DOCX implementations
- mdtodocs.com

Do not use competitor scores as marketing claims without rigorous methodology.

---

# Regression process

Every production fidelity bug:

1. becomes a fixture
2. gets expected output
3. gets regression test
4. gets destination-specific validation
5. remains permanently in the corpus

---

# Fidelity types

## Semantic

Did meaning survive?

## Structural

Did hierarchy, tables, lists, sections, and assets survive?

## Visual

Does the document look right?

## Behavioral

Does the destination behave correctly when edited?

## Degradation

When perfect preservation is impossible, did mdtodocs.com make the best controlled transformation and explain it?

---

# North-star quality

The strongest internal quality signal is:

> Manual Cleanup Minutes

The product should move this toward zero for supported documents.
