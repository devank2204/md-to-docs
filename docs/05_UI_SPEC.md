# FOLIO UI Specification

## Active workspace

Current established composition:

```text
┌────────────────────────────────────────────────────────────┐
│ FOLIO   document.md       Ready       Docs Word PDF [CTA] │
├──────────────────┬─────────────────────────────────────────┤
│                  │                                         │
│ Markdown Source  │             Document Preview            │
│                  │                                         │
│ source content   │             document page               │
│                  │                                         │
│                  │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

The document preview should occupy the greatest visual territory.

---

# Top bar

Keep:

- FOLIO identity
- current document name
- current readiness state
- destination selector
- primary action

Avoid:

- engineering metrics
- implementation terminology
- multiple competing CTAs
- unnecessary navigation

---

# Source pane

Purpose:

> Edit/provide the source document.

Visual treatment:

- professional source editor
- restrained line numbers
- readable Markdown
- minimal IDE chrome
- clear title/document identity

Do not turn it into a full IDE.

---

# Document pane

Purpose:

> Verify the actual output.

Requirements:

- realistic document rendering
- strong page geometry
- clear pagination
- zoom
- page navigation
- subtle viewer controls

The page should visually resemble the destination document.

---

# Destination control

A compact single destination selector:

```text
Google Docs | Word | PDF
```

Selected destination determines the primary CTA.

---

# Primary CTA

Examples:

```text
Google Docs → Copy formatted document
Word → Download Word (.docx)
PDF → Export PDF
```

Black/high-contrast primary action is acceptable and consistent with the current direction.

---

# Bottom status

Prefer one contextual status.

Examples:

Normal:

> Ready to download

Success:

> Ready · Headings, tables, math and diagrams preserved

Issue:

> Ready · 1 issue needs attention

Do not permanently show multiple technical status rows.

---

# Inspector

Open on demand.

Suggested structure:

```text
Document Inspector

Overview
Structure
Compatibility
Layout
Transformations
Diagnostics
```

---

# Page controls

Keep quiet:

- page previous/next
- page number
- zoom
- fit

These are viewer controls, not primary product actions.

---

# Contextual controls

Examples:

Table:

> Layout options

Diagram:

> Preserved as SVG

Image:

> Embedded

Issue:

> Review

Controls appear near the relevant content or in a focused contextual surface.

---

# First-use state

Do not show:

- left manuscript tree
- fake target document
- parser pipeline status
- feature cards
- engine latency
- build target
- telemetry status
- compiler internals
- decorative purple border

The central first-use interaction is:

```text
FOLIO

Markdown → Document

Turn Markdown into documents you don't have to fix.

[ Markdown input surface ]

Paste Markdown here
or drop a .md file

[ Browse file ]

Try an example

Word · Google Docs · PDF
```

---

# Search / command surface

Do not add a persistent search bar to the primary workspace unless a genuine search use case emerges.

Use a command palette:

`⌘K` / platform equivalent

It can expose:

- search document
- go to heading
- change destination
- export
- open Inspector
- change page size
- toggle source
- toggle preview

---

# Responsive behavior

Desktop:

- source + preview
- destination + CTA

Tablet:

- source/preview can become tabs or resizable split

Mobile:

- focused sequential workflow
- source
- preview
- destination
- export
- details

Do not merely squeeze desktop columns into a narrow viewport.
