# Current Design Review

## Current active workspace

The latest reviewed active workspace is considered directionally correct.

It has:

- FOLIO identity
- document name
- ready state
- destination selector
- one primary export CTA
- Markdown source on the left
- dominant document preview
- quiet viewer controls
- contextual table layout option
- concise bottom status
- Document Info entry point

This composition should now be treated as the baseline rather than continuously redesigned.

---

# Remaining refinement principles

### Remove persistent technical residue

Keep implementation details out of the default surface.

Examples to move:

- CommonMark compliance
- auto-sync implementation state
- OpenXML
- typography implementation
- encoding
- engine latency
- parser state

### Preserve contextual intelligence

Keep things such as:

- Layout options
- table warnings
- diagram transformations
- image warnings

near the relevant content.

### Inspector is the home for depth

Use the Inspector for detailed information rather than expanding the main screen.

---

# Current empty state

The latest Stitch iteration successfully established:

- Markdown → Document
- large input surface
- paste/drop
- browse file
- example specimen

However, the first-use state should be further simplified by removing:

- manuscript tree
- fake target file
- parser pipeline status
- feature cards
- engine telemetry
- build target
- decorative purple border
- technical footer residue

The final empty state should feel like a professional Mac utility, not a developer IDE.

---

# Design maturity

At this stage:

**Do not keep asking for broad visual redesigns.**

The visual system is sufficiently established.

Future design work should focus on:

- state transitions
- interaction choreography
- contextual intelligence
- Inspector
- export success
- error recovery
- mobile
- keyboard workflows
- real content fidelity
