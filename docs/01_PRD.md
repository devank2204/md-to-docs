# mdtodocs.com Product Requirements Document

**Status:** Canonical working PRD  
**Product:** mdtodocs.com  
**Category:** Destination-aware document compiler / structured-content interoperability tool  
**Primary source:** Markdown  
**Initial destinations:** Google Docs, Word/DOCX, PDF

---

# 1. Executive Summary

mdtodocs.com turns Markdown into destination-ready professional documents with minimal or zero manual formatting repair.

The visible product should feel simple:

**Paste Markdown → review document → choose destination → export**

The underlying system is intentionally much more sophisticated:

**Markdown → parse → normalize → semantic Document IR → destination planning → destination-specific rendering → fidelity checks → export**

The product's central insight is that users do not primarily have a "conversion" problem. They have a **document cleanup problem**.

A converter that technically produces a DOCX or PDF is not enough. mdtodocs.com should preserve document meaning, structure, editability, layout intent, and destination behavior as far as the target permits.

The product should hide this complexity rather than expose it.

> **More intelligence underneath should produce less cognitive burden above.**

---

# 2. Problem

Existing Markdown conversion workflows commonly create output that requires repair:

- heading hierarchy is visually correct but not semantically native
- Word styles are wrong or inconsistent
- tables overflow, wrap badly, or lose repeating headers
- images are resized or positioned poorly
- code blocks break across pages
- equations and diagrams lose fidelity
- copied content into Google Docs behaves differently from a DOCX
- pagination changes unexpectedly
- formatting looks acceptable in one renderer but poor in the destination
- users must manually repair the document after conversion

The real cost is **Manual Cleanup Minutes**.

mdtodocs.com should optimize toward:

> **Manual Cleanup Minutes → 0**

for normal supported documents.

---

# 3. Product Thesis

mdtodocs.com is not merely "Markdown to PDF/DOCX."

It is a **destination-aware document compiler**.

The semantic pipeline is:

```text
Markdown
   ↓
Parser
   ↓
Normalization
   ↓
Document IR
   ↓
Destination Capability / Planning
   ↓
Destination Renderer
   ↓
Fidelity Validation
   ↓
Google Docs / DOCX / PDF
```

The browser preview is not the source of truth.

The Document IR is the source of truth.

Renderers must never parse Markdown independently.

---

# 4. Target User Outcome

A user should be able to bring an existing Markdown document into mdtodocs.com and obtain a professional destination document without manually repairing formatting.

The primary mental model must remain simple:

> "I have Markdown. mdtodocs.com understands it. Here is the document. Where do I want it?"

---

# 5. Product Principles

1. **Outcome over implementation**
2. **Native destination semantics over visual imitation**
3. **Hide complexity, not capability**
4. **One primary task per surface**
5. **One primary action per state**
6. **Persistent visibility must be earned**
7. **Show state, not machinery**
8. **Put intelligence next to the object it explains**
9. **Default to recognition, not recall**
10. **Use user-facing language instead of implementation terminology**
11. **Advanced capability should remain discoverable**
12. **Never expose engineering sophistication merely to prove sophistication**
13. **Every persistent element competes for attention**
14. **Every extra control must justify its cognitive cost**
15. **More intelligence underneath should mean less cognitive burden above**

---

# 6. Primary User Journey

## First use

1. User lands in mdtodocs.com.
2. Immediately understands "Markdown → Document."
3. Pastes Markdown or drops a `.md` file.
4. mdtodocs.com analyzes the document.
5. mdtodocs.com presents the resulting document preview.
6. User chooses Google Docs, Word, or PDF.
7. User exports/copies.
8. mdtodocs.com reports success and what was preserved.

## Returning use

The user should reach the same workflow with minimal friction.

The interface should remember familiarity without becoming a dashboard.

---

# 7. First-Use Requirements

The empty state has exactly one job:

> **Get Markdown into mdtodocs.com.**

The first-use surface should show only:

- mdtodocs.com identity
- `Markdown → Document`
- concise product promise
- Markdown input area
- paste instruction
- file browse/drop affordance
- optional `Try an example`
- quiet destination hint: Word · Google Docs · PDF

It must NOT expose:

- AST
- IR
- OpenXML
- compiler internals
- parser pipeline
- repository/manuscript trees
- engine latency
- build target
- telemetry implementation details
- feature grids
- marketing testimonials
- AI badges
- decorative AI patterns

No account creation should be required before experiencing the core workflow.

---

# 8. Active Workspace Requirements

The active workspace is the core product screen.

The visual hierarchy is:

1. Document preview
2. Markdown source
3. Destination selection
4. Primary export action
5. Lightweight current status
6. Contextual intelligence
7. Advanced document information

The document is the visual protagonist.

The current composition is conceptually:

**Markdown Source | Document Preview**

with destination and export in the top-right.

Do not turn the product into a generic dashboard.

---

# 9. Destination Workflow

Initial destinations:

### Google Docs

Primary action:

> Copy formatted document

The output should use rich clipboard semantics where appropriate and preserve native Google Docs-friendly structure.

### Word

Primary action:

> Download Word (.docx)

The output should be a real editable DOCX with native Word semantics wherever possible.

### PDF

Primary action:

> Export PDF

The output should be print-ready and pagination-aware.

Do not present all destinations as competing primary actions. Destination selection determines one primary action.

---

# 10. Progressive Disclosure

mdtodocs.com should have three information layers.

## Layer 1: Immediate cognition

Always visible:

- current document
- current state
- source
- preview
- destination
- primary action

## Layer 2: Contextual intelligence

Appears only when relevant:

- wide table warning
- image issue
- diagram transformation
- page-layout recommendation
- unsupported feature
- transformation explanation

## Layer 3: Expert information

Available through an Inspector / Details surface:

- structure
- assets
- page count
- styles
- tables
- transformations
- compatibility
- typography
- geometry
- diagnostics
- renderer information
- advanced fidelity information

A command palette can expose power-user actions.

---

# 11. Document Inspector

A single secondary surface should contain advanced information instead of permanently showing it.

Suggested sections:

- Overview
- Structure
- Compatibility
- Layout
- Transformations
- Diagnostics

Example information:

- word count
- page count
- headings
- tables
- images
- code blocks
- diagrams
- heading hierarchy status
- destination readiness
- transformations applied
- page size
- margins
- typography
- layout checks

Implementation terminology can appear here when useful, not in the primary workspace.

---

# 12. Contextual Intelligence

mdtodocs.com should reveal intelligence next to the object it explains.

Examples:

### Wide table

> Wide table  
> May require landscape orientation in Word.

Actions:

- Fit to page
- Landscape
- Keep as is

### Diagram

> Diagram preserved as SVG.

Details may explain why.

### Image issue

> Image needs attention.

Then explain:

- what failed
- what was preserved
- what transformation occurred
- what the user can do

### Healthy table

> Table auto-fits 6.5" portrait bounds.  
> Layout options

Do not maintain a permanent diagnostics dashboard.

---

# 13. Status Language

The default UI should communicate outcomes, not implementation.

Prefer:

- `Document analyzed`
- `Ready`
- `Ready to download`
- `1 issue needs attention`
- `Diagram preserved`
- `Long table · headers repeat on new pages`

Avoid primary-surface wording such as:

- AST synchronized
- deterministic mapping
- target spec OpenXML
- certainty manifest
- renderer internals
- parser pipeline ready

Technical details can exist in the Inspector.

---

# 14. Design Direction

The visual system is:

- editorial
- precise
- restrained
- professional
- technical without being developer-console-like
- document-first
- high readability
- deliberate spacing
- restrained borders
- selective shadows
- typography-driven hierarchy

The document preview should resemble a real professional document.

Realistic content should be used for product demonstrations. Avoid lorem ipsum.

---

# 15. Anti-Patterns

Do not introduce:

- purple/blue AI gradients
- glowing blobs
- glassmorphism
- giant centered marketing heroes
- decorative 3D
- stock illustrations
- fake testimonials
- fake usage statistics
- excessive cards
- excessive pills
- "10x" claims
- AI sparkle icons/badges
- random terminal decorations
- decorative code
- unnecessary dark mode
- excessive shadows
- excessive border radius
- giant empty marketing spaces
- dashboard-like information density
- engineering jargon in primary UI

The design must survive the "Taj Mahal test":

> It should feel excellent because of structure, proportion, typography, and interaction, not because of decoration.

---

# 16. Accessibility and Interaction

Accessibility is a first-class requirement.

Requirements include:

- clear focus states
- keyboard accessibility
- sufficient contrast
- semantic controls
- predictable tab order
- meaningful labels
- no color-only status communication
- reduced-motion consideration
- responsive mobile behavior

Mobile is not a squeezed desktop. It should become a focused workflow.

---

# 17. Command Palette

A hidden power-user command surface should be available, likely via `⌘K` / platform equivalent.

It should expose actions such as:

- Search document
- Go to heading
- Change destination
- Export Word
- Export PDF
- Copy to Google Docs
- Open Inspector
- Change page size
- Toggle source
- Toggle preview

The command palette is an accelerator, not a replacement for discoverable primary controls.

---

# 18. Success Criteria

The product should be judged on:

### UX

- user understands product category in seconds
- user understands next action without reading documentation
- no unnecessary decision before input
- export destination is obvious
- one primary action per state
- errors are actionable
- advanced capability remains discoverable

### Document quality

- semantic fidelity
- structural fidelity
- visual fidelity
- behavioral fidelity
- controlled degradation
- editability
- low Manual Cleanup Minutes

### Engineering

- deterministic renderer behavior
- regression fixtures
- destination-specific planning
- no silent semantic loss
- renderer separation from parsing
- traceable transformations

---

# 19. MVP Scope

Initial vertical slice:

**Markdown → Document IR → Google rich clipboard → DOCX → PDF**

Support initially:

- headings
- paragraphs
- emphasis
- links
- lists
- blockquotes
- code blocks
- tables
- images

Then expand into:

- math
- diagrams
- footnotes
- callouts
- pagination torture cases
- advanced tables
- richer diagnostics
- round-trip preservation

---

# 20. Product Moat

The moat is not:

- Markdown parsing
- PDF generation
- DOCX generation
- rich clipboard
- themes
- APIs

Those are commodities or can be built from existing primitives.

The potential moat is:

1. Document IR
2. Destination Profiles
3. Compatibility / Capability Graph
4. Layout solver
5. Table compiler
6. Pagination intelligence
7. Loss-aware transformation
8. Provenance
9. Diagnostics
10. Fidelity corpus
11. Regression harness
12. Round-trip semantic preservation
13. Destination optimizer

Flywheel:

**Observed failure → fixture → renderer rule → regression test → better compiler → higher trust → more usage → more edge cases**

---

# 21. Quality North Star

The most important internal product metric is:

> **Manual Cleanup Minutes**

A successful conversion should require approximately zero manual repair for normal supported documents.

Secondary metrics:

- semantic fidelity
- structural fidelity
- visual fidelity
- behavioral fidelity
- controlled degradation
- export success
- time to first successful conversion

---

# 22. Current Design Status

The following design direction is considered established:

- active workspace is document-first
- source left, document preview dominant
- destination at top-right
- one primary export action
- empty state is minimal and action-oriented
- advanced information moves into Inspector
- diagnostics become contextual
- technical information is progressive-disclosed
- visual system is restrained and editorial
- no generic SaaS/AI decoration

Do not continue broad visual redesign unless new evidence shows a genuine usability problem.
