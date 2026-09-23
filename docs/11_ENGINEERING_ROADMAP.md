# FOLIO Engineering Roadmap

## Phase 0: Contract

Create:

- `DOCUMENT_IR_SPEC.md`
- `FIDELITY_BENCHMARK.md`
- architecture contracts
- renderer interfaces
- diagnostic schema

Do this before large renderer implementation.

---

# Phase 1: Vertical slice

Implement:

```text
Markdown
 → mdast
 → normalization
 → IR
 → Google rich clipboard
 → DOCX
 → PDF
```

Initial feature set:

- headings
- paragraphs
- emphasis
- links
- lists
- blockquotes
- code
- tables
- images

Goal:

One complete path from input to three meaningful destinations.

---

# Phase 2: Fidelity lab

Build the fixture harness.

For every fixture:

- parse
- generate IR
- render destinations
- capture diagnostics
- compare expected output
- collect screenshots where useful

---

# Phase 3: Destination intelligence

Implement:

- capability graph
- destination profiles
- representation planner
- table layout strategy
- pagination strategy
- transformations

---

# Phase 4: Advanced content

Add:

- math
- diagrams
- footnotes
- callouts
- advanced tables
- richer metadata

---

# Phase 5: Diagnostics

Build:

- contextual warnings
- Inspector
- transformation explanations
- loss/provenance views
- recovery flows

---

# Phase 6: Fidelity hardening

Run the full 100-fixture corpus.

Track:

- semantic
- structural
- visual
- behavioral
- degradation
- cleanup minutes

Every bug becomes a fixture.

---

# Phase 7: Product polish

Only after fidelity is real:

- empty state
- state transitions
- export success
- responsive behavior
- keyboard workflows
- command palette
- onboarding if evidence requires it

Do not polish UI to hide weak conversion quality.

---

# Phase 8: Expansion

Potential future capabilities:

- reverse conversion
- additional source formats
- additional destinations
- APIs
- templates
- collaborative workflows

These are not required for the first product.
