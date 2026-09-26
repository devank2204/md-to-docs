# mdtodocs.com Product Context

## Purpose

This directory is the canonical product, UX, design, architecture, and engineering context for mdtodocs.com.

mdtodocs.com is a destination-aware document compiler whose first visible workflow is:

**Markdown → professional document → destination**

The product is not positioned internally as a trivial Markdown converter. Its core problem is that Markdown-to-document workflows often produce output that users must manually repair, especially when moving content into Word or Google Docs.

The north-star experience is:

> **Turn Markdown into documents you don't have to fix.**

## Reading order for Antigravity

1. `01_PRD.md` — canonical product requirements and current scope.
2. `02_PRODUCT_THESIS.md` — why the product exists and the product/market insight.
3. `03_DESIGN_CONSTITUTION.md` — non-negotiable UX and visual laws.
4. `04_UX_FLOW.md` — user journey and state transitions.
5. `05_UI_SPEC.md` — current workspace and first-use interface specification.
6. `06_DOCUMENT_IR_SPEC.md` — canonical internal document model.
7. `07_ARCHITECTURE.md` — compiler architecture and engineering laws.
8. `08_DESTINATION_RENDERING.md` — destination-specific rendering strategy.
9. `09_FIDELITY_BENCHMARK.md` — benchmark corpus and quality measurement.
10. `10_DIAGNOSTICS_AND_LOSS.md` — diagnostics, transformations, and controlled degradation.
11. `11_ENGINEERING_ROADMAP.md` — implementation sequence.
12. `12_PRODUCT_STATES.md` — UI states and interaction choreography.
13. `13_COMMAND_PALETTE.md` — power-user interaction model.
14. `14_DECISIONS_AND_NON_GOALS.md` — decisions, rejected directions, and scope boundaries.
15. `15_ANTIGRAVITY_EXECUTION.md` — instructions for using this context during development.

## Canonicality

When documents conflict:

1. `01_PRD.md` governs product scope.
2. `03_DESIGN_CONSTITUTION.md` governs UX/design.
3. `06_DOCUMENT_IR_SPEC.md` governs the semantic model.
4. `07_ARCHITECTURE.md` governs implementation architecture.
5. More recent explicit product decisions supersede exploratory ideas in historical discussion.

Do not resurrect rejected ideas merely because they appear in older exploratory material.
