# mdtodocs.com UX Flow

## State model

```text
EMPTY
  ↓
INPUT
  ↓
ANALYZING
  ↓
READY
  ↓
REVIEW
  ↓
DESTINATION SELECTED
  ↓
EXPORTING
  ↓
SUCCESS
```

Alternative paths:

```text
ANALYZING → RECOVERABLE ERROR
READY → CONTEXTUAL WARNING
REVIEW → LAYOUT DECISION
EXPORTING → EXPORT ERROR → RECOVERY
```

---

# EMPTY

User question:

> What is this and what do I do?

Show:

- mdtodocs.com
- Markdown → Document
- concise promise
- input surface
- paste/drop
- browse
- try example

Do not show advanced system state.

---

# INPUT

User has provided Markdown.

Immediate feedback:

- source accepted
- parsing begins automatically
- no configuration gate

Avoid forcing destination choice before analysis.

---

# ANALYZING

The system should communicate meaningful progress.

Possible sequence:

```text
Analyzing document

✓ Structure detected
✓ Tables detected
✓ Images detected
○ Preparing document
```

Only show categories relevant to the actual document.

Do not fabricate progress.

Do not expose parser internals.

---

# READY

Primary status:

> Document ready

Potential concise metadata:

> 18 headings · 7 tables · 4 images

Only include it if it helps establish confidence.

---

# REVIEW

The document preview becomes dominant.

Source and preview represent the same document.

The user should be able to visually verify the result.

---

# DESTINATION

The user asks:

> Where do I want this?

Show:

- Google Docs
- Word
- PDF

Selected destination determines the primary action.

---

# EXPORT

Google Docs:

> Copy formatted document

Word:

> Download Word (.docx)

PDF:

> Export PDF

No competing primary actions.

---

# SUCCESS

Communicate:

- success
- destination
- what was preserved
- next action

Example:

> Document ready  
> 7 tables, 4 images and 1 diagram preserved.

Then the destination-specific completion action.

---

# RECOVERABLE ERROR

Explain:

1. What happened?
2. What was preserved?
3. What did mdtodocs.com do?
4. What can the user do next?

Avoid raw stack traces in the primary UI.

---

# Contextual issue example

Wide table:

> Wide table  
> May require landscape orientation in Word.

Actions:

- Fit to page
- Landscape
- Keep as is

---

# Returning user

Returning users should feel:

- familiar
- faster
- less interrupted

Do not force tutorials after first successful use.

---

# Interaction principle

Every state should answer the user's next likely question before the user has to ask it.
