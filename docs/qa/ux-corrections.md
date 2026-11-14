# UX acceptance corrections

The user's screenshots exposed defects missed by the previous acceptance review:
command exports still entered legacy delivery, the shared hover rule made copy
text unreadable, the title control was clipped and over-boxed, focusing a portalled
diagram menu scrolled the page, and history lacked control hierarchy/spacing.

Corrected normal command/keyboard delivery to use the direct pipeline; explicit
advanced options remain separate. Primary hover retains contrasting colors.
Rename uses a quiet bounded text/pencil control with full accessible name. Diagram
menu placement uses its actual height and viewport/header bounds; focus never
scrolls the page and menu chrome uses application typography/surfaces. History
has a compact toolbar/scope selector, separated list/diff columns and footer.
Document engines, storage safety, home identity and SEO routes are unchanged.

Regression coverage includes actual command-copy HTML clipboard success, hover
colors, page scroll position/menu bounds, existing repair/download/canvas checks,
rename/history and failure-safe backups, six responsive widths and identity.
Screenshots: /workspace/ux-corrections and /workspace/ux-evidence/after/history-*.
These are Chromium local checks, not production or receiving-app verification.

SEO direction: the existing conversion routes are task-specific tools for search
visitors. Their output action must be direct and reliable. Next work should connect
query/landing traffic to paste → preview → successful output, and establish Word/
Docs fidelity on a fixed technical corpus. Expansion into related tool intents
needs demand and differentiation evidence; no generic directory or editor-heavy
feature expansion substitutes for this. No organic ROI claim follows from tests.

Final verification: web TypeScript/Vite production build and eight-route prerender
passed. Full Chromium suite: **110 passed (2.6m)**, including four new command/
hover/menu cases. Lint passed with pre-existing warnings only. Existing typography
assertions were retained. No Word/Google Docs receiving-app, real-device or
production deployment claim. Corrections are local on ux/direct-handoff-version-review.
