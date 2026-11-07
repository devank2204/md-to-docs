# md.to.docs

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

People bringing Markdown from AI tools, developer notes, reports, and technical
proposals need readable documents they can send to someone else. Desktop and
mobile serve the same product; the phone emphasizes quick input and handoff.
The user explicitly wants interaction quality worthy of a serious product/design
case study. This is an ambition, not a measured market or usability claim.

## What exists

React/Vite frontend; one compiler and destination planners; DOCX, HTML and rich
clipboard rendering; diagrams, tables, equations, diagnostics, rescue tools,
local documents and history, and an optional headless API application.
The source and tests establish specific supported behavior, not universal fidelity.

Core browser workflow: input → inspect when needed → prepare → copy/download/share.
No sign-in is required. Browser storage is local to this browser/device and can
be unavailable or full. PDF is the browser print/save flow. Google Docs uses
formatted clipboard or a Word-file handoff; it does not create a cloud Doc.

## Binding user commitments

- Preserve the cream identity. Preserve existing fonts and typography unless the
  user explicitly asks to change typography. A general UX request does not do so.
- Web and mobile home share the incumbent web introduction and wordmark.
- Preserve the working mobile flow and unchanged document preview.
- Dark app appearance is implemented as an optional Cream/Dark/System preference.
  It must stay separate from document styling and export options.
- Show useful context at the user's next decision; avoid technical machinery in
  the normal conversion flow.

## Product principles

1. Protect the user's content and existing decisions.
2. Put the next useful action where the user needs it.
3. Make failures recoverable without restarting or losing text.
4. State observed outcomes honestly; a download is not proof of external receipt.
5. Earn complexity with demonstrated user benefit and evidence.

## Evidence and open questions

See tests/browser, packages/validation, packages/fidelity-lab, and docs/MOBILE_QA.md.
There is no acquired evidence here of Product Hunt placement, xAI endorsement,
customer counts, or a validated case-study outcome. Physical iPhone/Android
handoff and broad usability/performance validation remain incomplete.
The ambitious studio proposal remains proposed; only explicit decisions in
[the decision register](docs/decisions/README.md) authorize durable direction.
