# Destination Rendering Strategy

## Core rule

Different destinations are not interchangeable render targets.

They have different semantics, layout systems, and capabilities.

mdtodocs.com must compile toward each destination intentionally.

---

# Google Docs

Desired behavior:

- native heading semantics where supported
- editable paragraphs
- native tables where possible
- rich clipboard with HTML + plain text where appropriate
- preserve links
- preserve images
- preserve structural hierarchy

Primary user action:

> Copy formatted document

Google Docs is a destination, not merely a browser preview.

---

# Word / DOCX

Desired behavior:

- native heading styles
- editable tables
- appropriate styles
- page/section configuration
- image embedding
- headers/footers
- repeating table headers
- controlled page breaks
- appropriate code styling
- metadata where relevant

Primary user action:

> Download Word (.docx)

The target should be a real editable Word document, not an HTML wrapper pretending to be DOCX.

---

# PDF

Desired behavior:

- deterministic pagination
- print-ready geometry
- correct page size
- margins
- headers/footers
- images
- tables
- code blocks
- vector diagrams where possible

Primary user action:

> Export PDF

---

# Destination capability planning

For every feature:

```text
Source feature
     ↓
IR semantic node
     ↓
Destination capability
     ↓
Representation strategy
```

Strategies:

- native
- styled
- transformed
- fallback
- unsupported

---

# Table strategy

Tables are a major fidelity risk.

The renderer should understand:

- available width
- column widths
- text wrapping
- header repetition
- page splitting
- orientation
- overflow

Do not simply render HTML and hope the destination behaves correctly.

---

# Pagination

Pagination is destination-specific.

Consider:

- orphan/widow behavior
- heading attachment
- table splitting
- code block splitting
- image placement
- page breaks
- header/footer regions

---

# Math

Math should preserve semantics and visual fidelity where possible.

Possible target-specific representations:

- native equation support
- rendered equation image/SVG
- transformed fallback

Never silently drop equations.

---

# Diagrams

For Mermaid and similar diagrams:

- retain source provenance
- render to SVG/vector/image as needed
- preserve dimensions and aspect ratio
- record transformation
- provide contextual explanation

---

# Images

Preserve:

- dimensions
- aspect ratio
- alt text
- placement
- resolution
- source provenance

Do not blindly force 300 DPI or another output setting unless required by the actual target profile.

---

# Destination Profiles

A destination profile should eventually describe:

- page geometry
- semantic capabilities
- style capabilities
- asset behavior
- table behavior
- pagination behavior
- unsupported features
- preferred fallbacks
- validation rules
