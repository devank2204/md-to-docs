# Quiet workspace correction · 2026-11-15

Confirmed causes: title capped at 340px with an 18px pill radius; mixed header
hover rules; advanced export reopened the same destinations in a delivery modal;
history was overflow-only; palette combined exports, themes, headings and every
document. Removed these paths rather than adding another visual wrapper.

Implemented borderless flexible title, unified neutral hover, shared visible
secondary History/diagram-review toolbar, seven core commands, quiet logo menu,
accurate About/Privacy and an optional-email Feedback draft dialog. Feedback has
no API, database or send claim; Copy feedback is explicit. Existing motion is
installed but CSS is sufficient for a wink: no new dependency/import/font.

Reviewed production screenshots at 375/1024/1440. New tests verify title width and
zero border, no duplicate export entry/modal, actual history opening, review CTA,
neutral hover in both appearances, direct downloads, support draft retention and
removed heading commands. Existing approved UX and SEO coverage retained. Updated
legacy document-action tests to use the approved direct export menu.

Production TypeScript/Vite and all eight prerendered routes pass. Icon subset
check passes (80 referenced glyphs). Lint passes with existing DiagramCanvas and
Mermaid warnings. Final browser results recorded in WORKSTATE. The entire legacy
suite was not run: some tests still explicitly exercise the retired Prepare/
Deliver modal via openExport; those are not evidence of the new direct interface.
No physical-device, receiving-app, production deployment or new performance score
claims. No API invented. Three unrelated DOCX fixture changes remain excluded.

Verification commands: production `tsc -b`, `vite build`, shared prerender;
`playwright test quiet-workspace.spec.ts seo.spec.ts approved-ux.spec.ts
document-actions.spec.ts` (paths under tests/browser): 47 passed, one new assertion
corrected to scope heading checks to the palette and use real command buttons.
Final `playwright test tests/browser/quiet-workspace.spec.ts`: 7 passed.
`oxlint` succeeds with existing warnings; material-symbol checker succeeds.
The final palette uses real buttons and dialog semantics. Screenshots and logs
are in `/workspace/quiet-workspace-evidence.zip`. No new runtime package added.
