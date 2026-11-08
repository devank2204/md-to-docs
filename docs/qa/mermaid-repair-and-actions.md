# Mermaid repair and image actions

2026-11-07 · v3 · implementation and scoped gstack QA

## Delivered behavior

The document detects known Mermaid compatibility problems and offers **Review
diagram fixes**. Review shows the original source, proposed source, explanation
and rendered candidate. Only candidates that pass the actual renderer can be
applied, individually or together. Application preserves surrounding Markdown,
targets exact source ranges, creates a history snapshot and offers Undo. Changed
source invalidates an open review. Unknown syntax remains available to edit.

This is a local deterministic assistant, with no model endpoint, API key or
external document transmission. It does not claim to fix every possible diagram.
A future model-assisted repair can use the same review/validation boundary; it
should not silently rewrite a user's architecture.

Copy Image writes PNG directly to the clipboard, with visible success or failure
and no automatic download. The document menu offers real SVG, PNG and JPEG
exports, image/SVG/source copy and five working themes. Canvas and both Mermaid
utility routes share the same image/action implementation. Controls have their
own row above the drawing; the popup is portalled, viewport bounded and keyboard
accessible. Existing cream palette and inherited font roles are preserved.

## Dialect research and scope

- [Microsoft Markdown guidance](https://learn.microsoft.com/en-us/azure/devops/project/wiki/markdown-guidance?view=azure-devops)
  documents Azure Mermaid wrappers and syntax/version limitations.
- [Azure Sprint 274](https://learn.microsoft.com/en-us/azure/devops/release-notes/2026/wiki/sprint-274-update)
  adds standard fenced Mermaid alongside `::: mermaid`; it is inaccurate to say
  all current Azure installations require only the colon wrapper.
- [GitHub diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
  use fenced Mermaid; supported features depend on the runtime version.
- [Mermaid flowcharts](https://mermaid.js.org/syntax/flowchart.html) explain quoted
  special characters, reserved `end` and meaningful circle/cross/long arrows.

Import normalization handles Azure colon blocks, ordinary and tilde fences,
standalone diagram text and conservative flowchart repairs: delimiter smart
quotes, sensitive labels, split arrows and missing subgraph terminators. It
preserves valid shapes, literals, comments, edge semantics, CRLF and indentation.
Other language examples are excluded. This imports into this application's
renderer; it does not promise output compatible with every Azure server version.
An existing standard Mermaid dependency supplies a strict fallback when Ondine
cannot render a valid diagram; no new dependency was added.

## What escaped the previous tests

| Finding | Root cause | Permanent check |
| --- | --- | --- |
| M1: image/download failures | Renderer emitted raw double quotes inside an XML style attribute; browser HTML display tolerated malformed SVG, image decoding did not. | XML-parse real renderer output; read PNG/JPEG signatures and actual PNG pixels. |
| M2: unreliable copy and invisible failures | Image preparation happened before the clipboard call; failures were console-only in some paths. | Promise-valued ClipboardItem supplied during the gesture; real Chromium clipboard readback; denied-permission UI and no unexpected download. |
| M3: inaccessible/incomplete menu | Popup clipping/positioning, a transient zoom animation, and nominal theme choices without distinct rendering. | Phone/desktop action clicks, popup bounds, all theme changes, clipboard contents and downloaded bytes. |
| M4: dangerous repair | Broad regex rewrites and replacement by matching text could alter valid shapes or the wrong duplicate block. | Production helper tests; valid-shape/literal preservation; duplicate-range, stale-source, reviewed batch and undo scenarios. |
| M5: interrupted actions | ReactMarkdown component functions were recreated during document updates, remounting diagrams and closing/aborting their UI. | Memoized component mapping; menu, asynchronous copy and repair flows through actual compilation updates. |
| M6: utility/canvas divergence | Separate image implementations and incomplete focus handling. | Shared action pipeline; both routes; canvas copy/export/zoom/minimap, focus containment and Escape. |
| M7: toolbar covered small diagrams | Absolute floating controls occupied the drawing area. | A geometry regression failed with toolbar bottom 348px versus drawing top 260px; reserved action row now required above the drawing. |

The old coverage checked rendering presence and source strings, not complete
user actions or exported image artifacts. One suite duplicated the repair helper
instead of importing production code; it now imports the real helper. HTML SVG
presence cannot establish XML validity, clipboard usability or correct menu
behavior. Missing feature checks are distinguished from genuine legacy bug
reproductions in the retained logs.

## Verification and limits

Production build/prerender passed. Validation: **166 tests across 29 files**.
Fidelity: **20 fixtures**. Final Chromium browser suite: **49 passed (1.1m)** on source commit
`901403e`. Build/prerender and lint passed (existing warnings remain). Identity assertions retain the existing
Newsreader document role and the existing body role in the Canvas portal.
No identity expectations were relaxed.

Native browser coverage includes real clipboard PNG MIME/readback/pixels,
bounded wide-diagram rasterization, downloads, denied permissions, all menu
actions, strict repair review, duplicate and stale source protection, history/undo,
both utility routes and canvas keyboard behavior. Tests use synthetic documents.

Physical iPhone/Android, Safari clipboard behavior and pasting into actual Google
Docs/Word/chat applications remain unverified. Chromium mobile emulation is not
Safari evidence. No production deployment or office-network resolution is claimed.

Raw local gstack evidence is under
`.gstack/qa-reports/mermaid-repair-2026-11-07/`, including immutable before/after
screenshots, exact observations, bounded exploration deadline and final report.
The formal run is scoped to these workflows, not a whole-site usability score.

## gstack outcome

Used the pinned [gstack QA skill](../../.agents/skills/gstack/qa/SKILL.md).
Its phone exploration found and reproduced the toolbar overlap and transient
popup positioning issue; both have permanent final native regressions. Manual
Azure review/apply/undo, image-copy and Canvas checks produced useful observations.
Two subsequent long browser probes timed out. The formal manual evidence verdict
is **inconclusive**, and the original exploration deadline was not reset after
the pause. No whole-site health score is claimed. Final native tests passed all
49 scenarios, including both utility routes and the corrected layout.

The detailed local report is
`.gstack/qa-reports/mermaid-repair-2026-11-07/browser/qa-report-mermaid-2026-11-08.md`.
Implementation commit: `901403e`. No push or deployment was performed.
