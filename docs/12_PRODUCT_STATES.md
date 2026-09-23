# FOLIO Product States

## State 1: Empty

Message:

> Markdown → Document

Primary:

> Paste Markdown here

Secondary:

> Browse file

Tertiary:

> Try an example

---

# State 2: Analyzing

Show only meaningful progress.

Example:

```text
Analyzing document

✓ Structure detected
✓ Tables detected
✓ Images detected
○ Preparing document
```

Progress must reflect actual system work.

---

# State 3: Ready

Minimal:

> Document ready

Optional metadata:

> 18 headings · 7 tables · 4 images

---

# State 4: Review

Dominant document preview.

Source remains available.

Viewer controls remain quiet.

---

# State 5: Contextual issue

Example:

> Wide table  
> May require landscape orientation in Word.

Action:

> Layout options

---

# State 6: Destination selected

Example:

```text
Google Docs | Word | PDF

[ Download Word (.docx) ]
```

One destination, one primary action.

---

# State 7: Exporting

Use a meaningful progress state.

Avoid fake percentage progress unless measurable.

---

# State 8: Success

Example:

> Document ready

> 7 tables, 4 images and 1 diagram preserved.

Then the appropriate next action.

---

# State 9: Recoverable error

Example:

> One image could not be embedded.

> The rest of the document was preserved.

[Review] [Continue]

---

# State 10: Inspector

Opened intentionally.

Contains:

- overview
- structure
- compatibility
- layout
- transformations
- diagnostics

---

# State transition principle

Every state should make the next action obvious.

Avoid asking users to infer state from visual changes alone.
