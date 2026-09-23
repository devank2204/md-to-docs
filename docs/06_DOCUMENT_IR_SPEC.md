# FOLIO Document IR Specification

## Purpose

Document IR is the canonical semantic representation between source parsing and destination rendering.

It is the source of truth.

The browser preview is not the source of truth.

Renderers must never parse Markdown.

---

# Conceptual schema

```text
Document
 ├── metadata
 ├── theme
 ├── sections
 ├── assets
 ├── diagnostics
 └── source/provenance
```

---

# Document

Required conceptual fields:

- version
- metadata
- theme
- sections
- assets
- diagnostics
- source

Metadata may include:

- title
- author
- date
- classification
- revision
- audience

---

# Section

A section may contain:

- id
- page configuration
- header
- footer
- blocks

---

# Page configuration

Support conceptually:

- size
- orientation
- margins
- content width
- header/footer geometry

Examples:

- Letter
- A4
- portrait
- landscape

---

# Block types

Initial:

- Heading
- Paragraph
- List
- Blockquote
- CodeBlock
- Table
- ImageBlock
- ThematicBreak
- PageBreak

Planned:

- Callout
- MathBlock
- DiagramBlock
- FootnoteDefinition

---

# Inline types

Initial:

- Text
- Strong
- Emphasis
- Strike
- InlineCode
- Link
- InlineImage

Planned:

- InlineMath
- FootnoteReference

---

# Heading

Fields conceptually:

- level
- text/inlines
- id
- source provenance
- destination mapping hints

Native destination semantics should be preferred.

---

# Table

Conceptual structure:

```text
Table
 ├── columns
 ├── rows
 ├── headerRows
 ├── layout
 └── style
```

Layout includes:

- widthMode
- allowSplitAcrossPages
- repeatHeader
- overflowStrategy

Table behavior is a major fidelity area.

---

# CodeBlock

Must preserve:

- source text
- whitespace
- language
- pagination intent

Do not allow accidental semantic mutation during rendering.

---

# Image

Fields:

- assetId
- source
- dimensions
- sizing
- placement
- alt text
- provenance

---

# Asset

Assets should retain:

- identity
- source/provenance
- type
- dimensions
- binary/reference location where applicable

---

# Diagnostics

Every diagnostic should conceptually contain:

- severity
- code
- message
- nodeId
- destination
- suggestedAction
- provenance

---

# Provenance

Transformations should retain enough source identity to explain:

- what source node produced this output
- what transformation happened
- why the transformation was necessary
- what destination limitation caused it

This enables diagnostics and eventual round-trip behavior.

---

# Versioning

The IR must be versioned.

Breaking changes require explicit migration strategy.

---

# Example conceptual transformation

```text
Markdown Mermaid block
        ↓
IR DiagramBlock
        ↓
Destination capability check
        ↓
Word cannot render Mermaid natively
        ↓
Convert to SVG
        ↓
Word ImageBlock
        ↓
Diagnostic:
"Diagram preserved as SVG"
```
