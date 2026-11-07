# Current workstate

Updated: 2026-11-07. Branch: v3.

## What exists

- 809a445: mobile conversion flow and fresh-source export implementation; pushed.
- 049d135: ambitious UX proposal, storyboard and review evidence; local proposal.
- 687c116 restores the web home typography/wordmark on mobile while preserving
  preview and conversion behavior. Current documentation adds the decision/evidence
  workflow and the director critique/reference research.

## Settled constraints

DESIGN.md and docs/decisions/README.md are authoritative for current identity.
No future font/typography change without an explicit user request. Cream stays.
Dark app appearance is requested in the roadmap and remains unimplemented.

## Next useful work

The user has requested a design critique, references, and smoother future decision
making, not implementation of every proposed feature. See the [director critique and proof plan](designs/director-critique-and-proof-plan.md)
and [reference selection](research/reference-repositories.md). A future feature task should select one concrete
journey and its evidence rather than implement the entire roadmap at once.

Physical iPhone/Android receiving-app, keyboard and print checks remain pending.
The earlier WebKit launch failed for missing Linux libraries; do not count it as
Safari evidence. No claimed Product Hunt/xAI endorsement or validated case study.

## Evidence for this correction

Browser identity regressions verify the shared incumbent title, description,
wordmark, and responsive role sizes at phone/desktop widths. See tests/browser
and the final task report for executed checks. Do not treat this file's planned
checks as executed outcomes. This correction does not authorize a broad redesign.

Executed for this correction: full build/prerender passed; 26 browser scenarios
passed (including desktop/mobile identity); 146 validation tests passed; lint
passed with pre-existing diagram/canvas warnings. The stronger exact typography
assertions were also rerun separately and passed. Physical-device coverage did
not change. Preview/renderer/font-import files were not edited.
