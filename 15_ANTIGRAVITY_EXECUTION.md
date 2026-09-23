# Antigravity Execution Instructions

## Role

Treat the FOLIO context documents as the product constitution.

Do not infer product requirements from generic SaaS conventions.

When implementing, optimize for:

1. document fidelity
2. semantic correctness
3. destination-native behavior
4. cognitive clarity
5. deterministic behavior
6. regression safety

---

# Before coding

Read:

- `01_PRD.md`
- `03_DESIGN_CONSTITUTION.md`
- `06_DOCUMENT_IR_SPEC.md`
- `07_ARCHITECTURE.md`
- `09_FIDELITY_BENCHMARK.md`
- `14_DECISIONS_AND_NON_GOALS.md`

Understand the architecture before adding features.

---

# Engineering rules

### Rule 1

Do not let individual destination renderers parse Markdown.

### Rule 2

Do not make the browser preview the source of truth.

### Rule 3

Do not silently discard unsupported content.

### Rule 4

Every fidelity bug should become a fixture.

### Rule 5

Prefer mature open-source parsing/rendering primitives where they fit.

### Rule 6

Do not introduce a dependency solely because it makes a demo look good.

### Rule 7

Preserve source provenance where transformations occur.

### Rule 8

Destination behavior must be explicit.

---

# UX rules

Before adding a UI element, ask:

1. Does the user need it to understand where they are?
2. Does the user need it for the current task?
3. Is it a current state that requires attention?
4. Can it appear contextually instead?
5. Can it belong in Inspector?
6. Is it only useful to power users?
7. Does it exist merely to demonstrate engineering sophistication?

If the answer to 1–6 is no and 7 is yes, do not add it.

---

# Implementation workflow

For a new capability:

1. Define semantic representation in IR.
2. Define destination capability.
3. Define planner behavior.
4. Implement renderer.
5. Add fixture.
6. Add expected output.
7. Add diagnostics.
8. Validate all existing fixtures.
9. Update documentation if the product contract changed.

---

# UI workflow

For a new UI state:

1. Identify the user's current question.
2. Show only information required to answer it.
3. Identify next action.
4. Make one primary action obvious.
5. Move advanced information into contextual UI or Inspector.
6. Test the state without explanatory documentation.
7. Verify responsive behavior.
8. Verify keyboard/accessibility behavior.

---

# Quality gate

Do not call a feature complete merely because:

- the page looks good
- the export file exists
- the demo works once

It is complete when:

- semantics are correct
- destination behavior is appropriate
- edge cases are tested
- diagnostics are meaningful
- regression fixtures exist
- primary workflow is clear
- no unnecessary UI complexity was introduced
