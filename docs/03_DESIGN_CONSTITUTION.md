# mdtodocs.com Design Constitution

## Core law

> **Hide complexity, not capability.**

mdtodocs.com can be extremely sophisticated underneath while remaining extremely simple above.

## Primary mental model

```text
Markdown
   ↓
Document
   ↓
Destination
   ↓
Export
```

The user should never need to understand the compiler to complete the primary task.

---

# Interface laws

1. One primary task per surface.
2. One primary action per state.
3. Persistent visibility must be earned.
4. Show state, not machinery.
5. Put intelligence next to the object it explains.
6. Prefer recognition over recall.
7. Use user-facing language.
8. Contextual information belongs in context.
9. Advanced capability should be discoverable without being intrusive.
10. Every persistent element competes for attention.
11. Every additional control must justify cognitive cost.
12. Never add UI solely to demonstrate technical sophistication.
13. The interface should explain itself before documentation does.
14. The product should become quieter as its intelligence increases.

---

# Information hierarchy

## Level 0: Orientation

Always visible:

- product
- current document
- current state
- destination

## Level 1: Action

Always visible:

- source
- preview
- primary export

## Level 2: Context

Visible when relevant:

- warnings
- transformations
- layout recommendations
- compatibility issues

## Level 3: Inspection

Available on demand:

- structure
- assets
- styles
- geometry
- typography
- compatibility
- transformations
- diagnostics

## Level 4: Engineering

Available only to expert/debugging contexts:

- IR
- mappings
- renderer details
- OpenXML details
- fidelity measurements
- provenance
- regression information

---

# Visual language

Use:

- editorial typography
- high-quality document rendering
- precise grid
- restrained controls
- subtle borders
- limited shadows
- strong whitespace
- realistic content

Avoid:

- AI gradients
- glowing effects
- glassmorphism
- decorative blobs
- stock imagery
- excessive cards
- excessive pills
- fake testimonials
- fake metrics
- unnecessary dark mode
- decorative code/terminal motifs
- excessive radius
- visual noise

---

# Apple-like principle

Do not imitate Apple's visual style.

Adopt the underlying discipline:

> **Every element must earn its persistent visibility.**

The goal is not emptiness.

The goal is clarity.

---

# Quiet intelligence

mdtodocs.com should not constantly announce its intelligence.

Bad:

> AST synchronized  
> Deterministic mapping 100% verified  
> Target spec ISO/IEC 29500

Better:

> Document analyzed  
> Ready  
> Diagram preserved  
> 1 issue needs attention

Advanced technical explanations belong in Inspector.

---

# Document as hero

The document preview is simultaneously:

- product output
- proof of quality
- trust mechanism
- product demonstration

Do not bury it under dashboards.

---

# Contextual intelligence

A table should explain table-specific issues.

An image should explain image-specific issues.

A diagram should explain diagram-specific transformations.

Do not use a permanent diagnostics dashboard as the primary mechanism.

---

# Empty state

The empty state has exactly one job:

> Get Markdown into mdtodocs.com.

Primary hierarchy:

1. mdtodocs.com
2. Markdown → Document
3. Paste Markdown here
4. Browse file
5. Try an example
6. quiet destination hint

---

# Motion

Motion should communicate:

- causality
- state transition
- progress
- success
- recovery

Do not use motion as decoration.

---

# Accessibility

Accessibility is part of product quality:

- semantic controls
- keyboard access
- focus visibility
- contrast
- reduced motion
- predictable navigation
- meaningful labels
- no color-only status

---

# Mobile

Mobile should become a focused workflow, not a compressed desktop dashboard.

Prioritize:

1. source/input
2. preview
3. destination
4. export
5. contextual details
