# Reference repositories: take the useful mechanism

Checked 2026-11-07 against repository metadata and/or the linked README. These
are selected for concrete needs in md-to-docs. No claim is made that a ranked
Product Hunt cohort, YC founders, or an exclusive developer percentile uses them.
No packages, hooks, agents, or design systems were installed by this research.

| Repository | Verified useful mechanism | Fit here | Adoption decision |
| --- | --- | --- | --- |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Shape/critique/audit, preservation of an explicit brief, separate Operate/Read modes | Review task hierarchy, theming, overflow, copy and recovery while respecting identity | Use guidance. No generic font/palette replacement; no live-edit hooks activated |
| [garrytan/gstack](https://github.com/garrytan/gstack) | Product premise challenge, review, QA, plan/evidence handoffs and reuse ladder | Current pinned workflow; connect a product choice to code, tests and evidence | Already pinned; apply appropriate scope rather than every workflow on every edit |
| [adobe/react-spectrum](https://github.com/adobe/react-spectrum) | React Aria's unstyled accessibility/interaction primitives; React Stately | Reference keyboard/focus, touch, screen-reader and internationalized interaction behavior | Study React Aria behavior first. Do not replace our visual system with Spectrum's styled system |
| [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | Anchored positioning, collision avoidance, accessible interactions and visual test playgrounds | Contextual table/diagram notes in nested scrolling panes and small viewports | Evaluate a focused dependency only if existing native positioning cannot meet a demonstrated need |
| [dip/cmdk](https://github.com/dip/cmdk) | Composable command menu/combobox, aliases/ranking, groups, keyboard navigation, dialog composition | Compare our command palette's behavior and maintainability against a focused implementation | Reference now; replace only if a scoped comparison demonstrates a benefit and preserves identity |
| [karpathy/autoresearch](https://github.com/karpathy/autoresearch) | Human-authored program.md, constrained editable scope, fixed evaluation, experiment log, keep/discard, simplicity criterion | A bounded implementation/evaluation loop with protected design and content invariants | Adapt the method in root program.md; no GPU/training infrastructure, permission bypass, or endless loop |

## Current source details that matter

- `pacocoursey/cmdk` resolves to the current canonical `dip/cmdk` repository;
  this list uses the resolved repository rather than assuming the older name.
- [emilkowalski/vaul](https://github.com/emilkowalski/vaul) currently says in its
  README: “This repo is unmaintained.” It may inform a touch-interaction study,
  but is not recommended as a new default dependency here. Existing native
  WorkspaceSheet behavior already covers the basic sheet requirement.
- React Aria is unstyled; Adobe Spectrum is a different, styled product. Confusing
  the two could import a new identity into a project whose fonts/colors are locked.
- Floating UI's README describes visual testing through state/option playgrounds.
  That testing pattern is useful even if we adopt none of its runtime code.
- autoresearch's README and program.md describe a training experiment, not a UI
  design doctrine. Our adaptation uses multiple hard constraints: a better task
  metric never compensates for lost content or unauthorized typography changes.

## A small adoption proof before a new dependency

Name the present failure, reproduce it, and compare our existing implementation,
a native platform option, and the smallest candidate. Measure relevant behavior,
accessibility, bundle/maintenance cost, migration effort, and identity preservation.
Document the result in one decision. Import only the capability that wins.

Good example: a selected table's note clips when its scroll pane sits beside the
inspector. Reproduce at phone/desktop widths, evaluate native popover/positioning,
then compare a targeted Floating UI implementation if needed. Keep existing cream
styles, focus semantics and export behavior.

Bad example: install six fashionable component/motion packages, replace the home
font, and describe the result as a higher design tier without observing a user task.

## Evidence sources

- Impeccable README and local source at `687bc381bc9091bf252c0a05303640561014a425`,
  especially `reference/shape.md`, `operate.md`, and the rule that the brief wins.
- gstack's pinned digest at `.agents/skills/gstack/agents-digest/gstack-AGENTS.md`.
- [React Spectrum/Aria README](https://github.com/adobe/react-spectrum/blob/main/README.md).
- [Floating UI README](https://github.com/floating-ui/floating-ui/blob/master/README.md).
- [cmdk README](https://github.com/dip/cmdk/blob/main/README.md).
- [Vaul README](https://github.com/emilkowalski/vaul/blob/main/README.md).
- [autoresearch README](https://github.com/karpathy/autoresearch/blob/master/README.md)
  and [program.md](https://github.com/karpathy/autoresearch/blob/master/program.md).

Maintenance and APIs can change. Recheck candidates when adoption is actually
proposed; this research is not an evergreen maintenance certification.
