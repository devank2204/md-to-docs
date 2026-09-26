# Diagnostics, Transformations, and Controlled Loss

## Philosophy

Diagnostics should create confidence, not anxiety.

The system should be quiet when everything works.

It should become explicit when a decision or intervention is necessary.

---

# Diagnostic severity

Conceptually:

- info
- warning
- error
- blocking error

Do not visually emphasize an info message as if it were an error.

---

# Diagnostic anatomy

Every meaningful diagnostic should answer:

1. What happened?
2. Why?
3. What was preserved?
4. What did mdtodocs.com do?
5. What can the user do?

---

# Example: wide table

Primary UI:

> Wide table  
> May require landscape orientation in Word.

Actions:

- Fit to page
- Landscape
- Keep as is

Inspector can show:

- available width
- calculated width
- overflow behavior
- destination constraints

---

# Example: Mermaid

Primary UI:

> Diagram preserved as SVG.

Inspector:

> Word does not support native Mermaid rendering. mdtodocs.com converted the diagram to SVG while retaining source provenance.

---

# Example: unsupported feature

Never silently delete.

Possible outcomes:

- native
- styled approximation
- transformed representation
- image fallback
- explicit unsupported state

---

# Provenance

Keep enough metadata to explain transformations and eventually support round-trip semantic preservation.

Example:

```text
sourceNodeId
  ↓
IR node
  ↓
destination representation
  ↓
transformation record
```

---

# Diagnostics UI principle

Do not expose a giant diagnostic console by default.

Use:

- contextual inline status
- one concise global status
- Inspector for detailed analysis

---

# Error recovery

A recoverable error should not dump implementation details.

Example:

> One image could not be embedded.

> The rest of the document was preserved.

> [Review image] [Continue export]

---

# Controlled degradation

If a destination cannot represent a feature:

1. detect
2. select fallback
3. preserve provenance
4. record transformation
5. explain when relevant
6. validate output

---

# No silent loss

This is a core architecture and UX law.
