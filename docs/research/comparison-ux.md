Research scope: public demos and official documentation, 2026-11-17. No real user payloads submitted.

Diffchecker (https://www.diffchecker.com/text-compare/): inspected landing, dismissed the desktop promotion and compared synthetic alpha/beta versus alpha/gamma inputs. Clear Original/Changed labels, per-input Open file, a recognizable input-to-comparison transition, view controls and navigation around the editors. Do not copy marketing overlays, ads, accounts, remote sharing, merging, brand or source.
JSONDiff (https://www.jsondiff.com/): inspected sample-to-Compare transition. Distinguishes semantic comparison from line matching. Do not copy dated textareas or ad clutter.
jsondiffpatch (https://jsondiffpatch.com/): inspected live demo. Input work and visual/structured result modes are distinct; keep the engine/delta conventions. Do not adopt JSON5, automatic object IDs, formatter HTML or merge actions.
Meld (https://meldmerge.org/help/file-mode.html): official guidance emphasizes editors as the main work, change overview and location-aware navigation. Borrow orientation, not merging controls or an entire desktop UI.
VS Code (https://code.visualstudio.com/docs/sourcecontrol/staging-commits): official guidance documents side-by-side at sufficient width and inline at narrow widths. Keep our single CodeMirror engine and mobile input/unified navigation rather than cramming two editors.
Beyond Compare (https://www.scootersoftware.com/v5help/walking_through_differences.html): Previous/Next follow difference sections. Apply current-location feedback and keyboard navigation using CodeMirror's public commands.
NN/g (https://www.nngroup.com/articles/ten-usability-heuristics/): make status visible and actions recognizable; this informs decisions, not a measured UX score.

MDToDocs decisions: right-group appearance/Tools, explicit tool switch and selected page, guided empty panes with Paste/Open actions, no dead navigation buttons, live status before review, JSON Inputs/Changes mode with retained source state, consistent Old/New semantics, editable payloads preserved, keyboard-operable review, and proper cream/dark rendering. Preserve approved fonts and sidebar. No commercial source transplant or new comparison algorithm.

Validation gates for this revision: unchanged font roles; appearance/Tools aligned at the right; sidebar toggle beside brand; explicit clipboard action and preserved early paste during engine loading; JSON source validity and review readiness; Inputs/Changes round trips retaining payloads; disabled empty navigation; current text chunk and F7/Shift-F7 using library commands; single-entry browser Back navigation; usable light/dark and 320/390/1366px layouts; viewport overflow; and the existing SEO suite. The design is informed by references and inspected locally, not claimed to be validated by user research.


Correction after owner review, 2026-11-17: the Inputs/Changes transition above was
rejected for large JSON. It is superseded. Keep both source payloads and structural
highlights in one workspace, with source-linked navigation and optional compact
path/value context. Do not require moving into a detached change report. Meld's
source-as-workspace and location-aware navigation guidance is the better fit for
this task. This is a correction based on explicit owner feedback, not a new claim
of user-research validation. Implementation and browser evidence are recorded in
[comparison-tools.md](../qa/comparison-tools.md).
