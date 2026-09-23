# FOLIO Engineering Architecture

## Architecture

```text
Markdown
   ↓
remark / unified / mdast
   ↓
Normalization
   ↓
Document IR
   ↓
Destination Planner
   ↓
Destination Renderer
   ├── Google Docs / rich clipboard
   ├── DOCX
   └── PDF
   ↓
Validation / diagnostics
```

---

# Parsing primitives

Use mature open-source primitives rather than reinventing Markdown parsing.

Relevant ecosystem:

- unified
- remark
- mdast
- remark-gfm
- remark-math

The parser should produce a semantic source tree which is then normalized into FOLIO IR.

---

# Normalization

Normalization is responsible for turning parser output into a stable internal representation.

It should:

- normalize heading hierarchy
- normalize lists
- preserve table semantics
- preserve code whitespace
- normalize links
- attach provenance
- detect unsupported constructs
- build asset references
- normalize metadata

---

# Destination planner

The planner chooses how each semantic element should be represented for a target.

It consults a capability graph.

Example:

```text
Feature: Mermaid

Google Docs:
  fallback image / SVG

Word:
  fallback image / SVG

PDF:
  native/vector representation
```

---

# Destination capability graph

Each feature/target pair can have a state such as:

- native
- styled
- fallback
- transformed
- unsupported

The planner must make this decision before rendering.

---

# Renderer law

> **Renderers never parse Markdown.**

They consume IR.

This prevents destination-specific parsing divergence.

---

# Preview law

> **Browser preview is not source of truth.**

Preview is another renderer of the same IR.

This prevents a visually correct browser representation from masking a broken DOCX/PDF renderer.

---

# Loss law

> **Never silently discard unsupported semantics.**

Every meaningful loss or transformation should be:

- recorded
- diagnosable
- recoverable where practical

---

# Bug law

> **Every bug becomes a permanent fixture.**

When a fidelity bug is discovered:

1. create fixture
2. record expected behavior
3. fix renderer
4. add regression test
5. rerun corpus

---

# Initial vertical slice

Build:

```text
Markdown
 → mdast
 → normalized IR
 → Google rich clipboard
 → DOCX
 → PDF
```

Initial content:

- headings
- paragraphs
- emphasis
- links
- lists
- blockquotes
- code
- tables
- images

---

# Useful primitives to investigate

Potential implementation components identified during research include:

- `docx` / dolanmiu/docx for DOCX generation
- Paged.js for pagination experiments
- Pandoc as a benchmark/baseline
- MarkCopy as a benchmark/reference for rich clipboard and broad Markdown handling
- md2office as a rich clipboard reference
- md-to-docx / markdown-docx implementations as references for style/template approaches
- md2gdoc-style projects for Google Docs workflows

These are reference/benchmark candidates, not assumed architectural dependencies.

---

# Open-source principle

Do not copy a project wholesale because it appears feature-rich.

Study:

- algorithms
- edge-case handling
- compatibility techniques
- test fixtures
- renderer patterns
- style systems

Then integrate only what fits FOLIO's architecture and licensing requirements.

---

# Security / privacy

Do not make privacy claims in UI unless the implementation actually guarantees them.

If compilation is client-side, document the exact boundary.

Do not expose telemetry/engine implementation as primary product UI.
