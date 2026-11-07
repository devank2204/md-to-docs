# A demanding design review, and a case-study proof plan

Status: critique and proposed roadmap, not approval to implement every item.
The home-typography restoration is the separately authorized implementation.

This is a hypothetical critique through a demanding AI-product design-director
lens, prompted by the user's xAI reference. It is not feedback from xAI, a claim
about its internal standards, or an endorsement by any designer.

## The likely opening critique

### “Why does resizing the product introduce another brand?”

The earlier mobile patch changed the home slogan, title weight/spacing, added an
italic color accent, gave the description a different treatment, and changed the
wordmark. The preview's familiar type was retained, which made the difference
more conspicuous. Mobile constraints justified a different layout, not a new
identity. The user explicitly rejected that change.

Correction: one shared incumbent web introduction and wordmark; mobile-specific
layout and input behavior around them. Identity regressions verify actual browser
styles and content. DESIGN.md now prevents another unsolicited font change.

### “What does the user understand without inspecting your UI?”

The mobile conversion journey works. The next quality bar is an immediately legible
relationship between source, document, destination and delivery. A visitor should
know what changed, what needs attention, and what the next action does. Requiring
people to decode a fidelity score, tool taxonomy, or hidden modal is a product gap.

### “Which complexity did you remove, and which problem did you solve?”

A new visual treatment or animation is not evidence of better UX. Each persistent
control should have a current job. Each added dependency should address a
reproduced gap. Show a real table/diagram recovery journey, including cancel,
keyboard, native app handoff and retry, rather than only the successful screenshot.

### “Why should I trust this output?”

Clipboard success, generated DOCX and browser print are different states. The app
cannot infer that Google Docs preserved formatting or a PDF was saved. Target
adaptations need truthful explanations and current-revision evidence. The prior
independent plan review identified missing print-snapshot readiness; preserve that
finding in the roadmap, not just a polished delivery mock.

### “Where is the evidence that another person can use it?”

Our browser tests establish specific behavior. They do not establish usability,
physical-phone keyboard behavior, receiving-app fidelity, or comparative success
against alternatives. A credible case study needs documented constraints, baseline,
iterations, real failures, observed tasks and remaining limits.

## What is already worth keeping

The incumbent cream/editorial identity; the familiar preview; full-width phone
Edit/Preview; reachable preparation/delivery; local input retention; permission
recovery; explicit sharing cancellation; fresh-source export; native sheet focus;
and tests that inspect a generated document. Preserve these while increasing depth.

The aim is a coherent product with unusually complete decisions. A team should
be able to see the reasoning in the edge cases, not count the number of effects.

## Three flagship demonstrations

### 1. Paste → send, without configuration friction

Use a real representative AI-produced document containing headings, a table and
code. Paste on web and phone; select the intended destination; prepare and hand
off. Observe wrong turns, settings opened, time to the usable artifact and recovery
from permission failure. Do not equate an API return with a usable receiving-app
result. Keep first-character focus and current content intact.

### 2. A difficult object becomes understandable

Use a fixture that genuinely exceeds a destination capability, not an ordinary
two-column table with a pretend warning. The marker identifies the exact object;
the user sees the target consequence, inspects a valid alternative or exact patch,
keeps their place between source and preview, and can undo. Re-run on the same
source revision and target. Do not approximate a stale source range.

### 3. Return, recover, continue

Resume a local draft, switch documents, encounter full storage or canceled share,
and still leave with the correct latest document. Demonstrate long text, long
names, keyboard navigation, a soft keyboard, a short landscape viewport, and print.
These are normal use conditions, not bonus polish.

## Roadmap with visible completion gates

| Slice | User outcome | Evidence required before calling it done |
| --- | --- | --- |
| 0. Identity restoration | Web/phone feel like the same product; working mobile flow retained | Shared home components, protected role assertions, screenshots, unchanged preview/export source |
| 1. State atlas and baseline | Everyone can see the real behavior in empty, ready, pending, failed and recovered states | One representative corpus; actual state captures; task observations; no fabricated progress |
| 2. Delivery parity | Desktop/phone hand off the same current source honestly | Shared lifecycle; DOCX/HTML inspection; print snapshot ready only after matching render/assets; physical receiving-app matrix |
| 3. Linked review | The right fix at the right object, without losing place | Correct anchors for duplicates/nesting/transforms; stale-revision guard; patch preview/undo; touch and keyboard paths |
| 4. Optional dark app | Comfortable dark shell with existing identity and unchanged document | Cream parity; no typography changes; complete state contrast; no export invalidation from appearance alone |
| 5. Measured refinement | Faster, clearer, calmer work in short and long documents | Actual task measurements and performance traces; controlled before/after; reduced motion and accessibility checks |
| 6. Handoff kits, if justified | One source can serve multiple audiences | Evidence of repeated multi-format work; isolated target results, partial failure recovery, explicit source inclusion |

Do not implement all slices under a vague “make it cooler” instruction. Select one
journey, define success, and complete its failure paths. The current request
authorizes Slice 0 and the critique/workflow documents; later slices remain plans.

## The craft review should ask

| Dimension | Question to test | Failure that blocks polish claims |
| --- | --- | --- |
| Identity | Is this unmistakably the same product on every viewport? | Unrequested typography/palette/copy identity changes |
| Hierarchy | Can a first-time user identify the current task and next action? | Competing primary actions or configuration before input |
| Interaction | Do mouse, keyboard, touch and screen reader reach the same outcomes? | Hover-only tools, lost focus, trapped scrolling |
| Integrity | Does the exported artifact match the requested source/options? | Stale artifacts, silent content loss, stale source patches |
| Recovery | Can a failure be resolved without starting over? | Lost text, no retry, false saved/success state |
| Continuity | Does switching view/device width preserve place and intent? | Caret/section reset or desktop state opening a phone overlay |
| Performance | Does typing stay responsive on representative content/devices? | Unmeasured heavy work on every keystroke |
| Language | Does copy tell the person what happened and what they can do? | Compiler jargon or promises about an unobserved receiving app |

## Case-study evidence, collected as work happens

For each meaningful improvement, retain:

1. The user job and the constraint, including protected identity.
2. A reproducible baseline: source fixture, revision, device/browser and task.
3. The hypothesis and alternatives; why the smaller viable change was chosen.
4. Before/after screenshots plus a recording of the relevant interaction.
5. Automated evidence, exported artifact checks and actual user/device observations.
6. What failed, what was discarded, and what is still uncertain.
7. The decision and its tradeoff, linked to code and verification.

Useful measurements include task completion, time to a usable artifact, wrong
format choices, repeated settings visits, recovery time, incorrect section jumps,
input latency and lost drafts. Define a baseline before setting improvement
percentages. A reviewer score or a screenshot is not a substitute for these.
Record participant/task counts if usability observations are collected. Do not
invent research, rankings, testimonials or an xAI/YC/Product Hunt association.

The final story should be: one person used Codex to make decisions explicit,
protect identity, test difficult interactions, and improve measured outcomes.
The story becomes credible through evidence; it is not established by this plan.

## Execution model

Use root program.md for bounded trials. Keep PRODUCT.md for product truth,
DESIGN.md for settled identity, docs/decisions/README.md for accepted/proposed
choices, and WORKSTATE.md for current state. Read older plans only when relevant.
Use gstack to challenge unresolved product/architecture assumptions and to review
or QA real implementation. Use Impeccable's critique/audit/harden/adapt guidance
within the locked identity. No new tool is allowed to manufacture user approval.

See [reference selection](../research/reference-repositories.md) for specific
mechanisms to study and candidates to avoid adopting blindly.
