# D002 evidence: restore the incumbent home identity

Date: 2026-11-07. Base: 049d135. Restoration: 687c116. User-requested correction.

The previous mobile patch retained Newsreader for its headline but changed the
headline copy, weight, italic treatment, tracking/line-height, description treatment,
and wordmark. That was an unauthorized identity change even though the preview's
font stayed familiar. Preserving one family name did not preserve typography.

HomeIntroduction now contains the original web title/description and role classes.
BrandWordmark contains the original web wordmark. Both shells reuse them. The
mobile CSS no longer overrides these roles with a separate home treatment.
DocumentPreview, compiler themes, export helpers, font imports and the existing
mobile source-input typography are unchanged by this correction.

Rendered CSS metrics recorded in Chromium after restoration:

| Role | 390px | 1440px |
| --- | --- | --- |
| Title | Newsreader, serif; 30px; 500; normal; 37.5px line-height; -0.75px tracking | Same family/weight/style; 48px; 48px line-height; -1.2px tracking |
| Description | Newsreader, serif; 16px; 400; normal; 26px line-height; normal tracking | Same family/weight/style; 18px; 28px line-height; normal tracking |
| Wordmark | JetBrains Mono; 14px; 600; 22px line-height; -0.7px tracking | Same |

These are the incumbent responsive web roles, not a newly designed mobile scale.
Browser identity regressions guard their role values. Declared CSS family checks
do not alone prove which font file the operating system rendered; screenshots and
unchanged font-loading sources are complementary evidence.

The user must explicitly request future typography changes. Do not alter tests or
reference metrics merely to make another unsolicited design pass look approved.

## Bounded experiment record

| Hypothesis | Baseline | Change | Actual checks | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |
| Reusing the incumbent web home restores one identity without losing the mobile flow | 049d135 contains the rejected mobile visual treatment | Shared home introduction/wordmark; remove mobile-only home type overrides | Full build/prerender, 26 browser scenarios, 146 validation tests and lint passed; stronger exact role assertions also passed | Preview/renderers/font imports unchanged; cream backgrounds unchanged; no new dependencies | Keep, commit 687c116 |

Lint retains pre-existing diagram/canvas warnings. No physical-device or new
receiving-app testing was performed for this correction.
