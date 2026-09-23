# Decisions, Rejected Directions, and Non-Goals

## Decisions

### 1. Product category

FOLIO is a destination-aware document compiler, not merely a file converter.

### 2. Core promise

> Turn Markdown into documents you don't have to fix.

### 3. Core UX

Markdown → document → destination → export.

### 4. Document IR

Document IR is the canonical semantic source of truth.

### 5. Renderer separation

Renderers consume IR and never parse Markdown.

### 6. Diagnostics

Diagnostics are contextual by default and detailed in Inspector.

### 7. Visual direction

Editorial, restrained, document-first, technically credible.

### 8. Progressive disclosure

Advanced capability remains available but is not persistently visible.

---

# Rejected / no longer pursuing

## Engineering cockpit UI

Rejected because exposing AST, compilation profiles, certainty manifests, OpenXML, latency, typography rules, and diagnostics simultaneously creates excessive cognitive load.

## Persistent diagnostics dashboard

Rejected as the default.

Diagnostics should appear near the affected content or in Inspector.

## Feature-card-heavy landing page

Rejected.

The product should let users use the tool rather than read a marketing dashboard before using it.

## Giant marketing hero

Rejected for the core application experience.

## AI visual language

Rejected:

- gradients
- glowing purple
- sparkle badges
- generic AI decoration

## Persistent search bar

Not currently needed.

Use a command palette for expert access.

## Destination choice before input

Rejected.

Let users provide the document first, then choose the destination.

## Exposing compiler terminology

Rejected from primary UI.

AST, IR, OpenXML, renderer details, and similar terms belong in advanced contexts.

## Removing advanced capability entirely

Rejected.

The goal is progressive disclosure, not feature deletion.

---

# Non-goals for initial product

- collaborative editing
- full word processor replacement
- arbitrary desktop publishing
- every possible source format
- every possible destination
- reverse conversion as MVP
- giant template marketplace
- AI writing assistant
- generic document management suite
- social/community features
