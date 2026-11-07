# Studio implementation record

2026-11-07 · v3 · Authorized by the user's request to start the proposed implementation.
This implements the delivery, linked review and optional app appearance foundation
of the [director plan](director-critique-and-proof-plan.md). It preserves DESIGN.md;
it does not authorize typography changes or establish a validated case study.

## Delivered behavior

- Desktop and phone use `useDocumentExport` for explicit preparation and delivery.
  Header, command palette and reading-view actions enter that flow. A prepared
  artifact belongs to one document, source, destination, document theme, signature
  and title. An edit or option change invalidates it. Appearance changes retain it.
- Google Docs remains formatted clipboard handoff, with a Word-file alternative.
  Download, share cancellation and clipboard failure have truthful outcomes and
  recoverable actions. Preparation can be canceled without publishing late work.
- PDF prepares an isolated, script-disabled print frame from fresh source. It
  waits for the frame, its fonts and image decoding, with cancellation and a bounded
  timeout. Math styling is included. Source changes dispose obsolete frames. A
  separate gesture opens print; the app does not claim a PDF file was saved.
- App appearance offers Cream, Dark and System, persists locally and initializes
  before React. The sidebar and palette explicitly distinguish app appearance
  from document style. No font imports or typography roles were changed.
- Formatting notes show source excerpts and exact offsets, including duplicate
  and nested blocks. Preview anchors use positions preserved by the destination
  planner. No position means no invented preview link. Object markers work by
  button activation, including touch and keyboard; an outline links to source.
- Deterministic rescue changes show the complete proposed source before applying.
  Rule-wide fixes are labeled as potentially affecting multiple objects. Applying
  checks source/document/destination again, creates a backup, and offers undo while
  that result is still current. Further edits never receive an approximate patch.
- Abortable image requests no longer share a caller's cancellation lifetime. A
  canceled preview therefore cannot cancel another export of the same image.
- Desktop formatting status is bound to the checked source/options revision.
  Reduced-motion preferences suppress animation and smooth scrolling throughout.

## State atlas and reproducible evidence

The fixed browser corpus lives in `tests/browser/mobile.spec.ts`, `studio.spec.ts`
and `identity.spec.ts`; compiler/renderer and range tests live in validation.

| State / user decision | Evidence |
| --- | --- |
| Empty home, cream and dark | `evidence/studio-implementation/home-{390,1440}-{cream,dark}.png`; unchanged identity assertions |
| Edit / readable document | `workspace-{390,1024,1440}-{cream,dark}.png`; bounds in `measurements.json` |
| Preparing → ready | Real DOCX XML and HTML-content checks on phone/desktop; source invalidation |
| Canceled preparation | Held image response released after cancellation; only replacement source may become ready |
| Failed preparation → recovery | Missing print image fails without losing text; removal and retry prepare successfully |
| Failed copy / canceled share | Explicit fallback and cancellation scenarios; no automatic download |
| Exact review / apply / undo | Two identical nine-column tables, exact second-table offsets, patch preview and recovery |
| Nested or absent source positions | Nested code range and repeated-paragraph fixtures; nonexistent line returns no range |
| Returning draft / constrained viewport | Six-document hydration, quota failure, soft-keyboard simulation, 320–1440px layout scenarios |
| Appearance independence | Byte-identical prepared HTML across appearance changes; white document paper in dark shell; protected control/home typography |
| Print readiness and stale content | Isolated frame content, math, explicit print outcome, source change disposal, failed-image recovery |

Screenshots are actual Chromium captures, not proposed designs. They demonstrate
appearance and layout, not receiving-app fidelity or user research. Measurement
JSON records viewport/control bounds and paper color; no timing improvement or
conversion uplift is inferred. Automated print tests stub only the final native
print call after inspecting the real prepared frame.

## Bounded experiment record

| Hypothesis | Baseline | Change / evidence | Guardrails | Disposition |
| --- | --- | --- | --- | --- |
| One preparation lifecycle eliminates inconsistent desktop/mobile delivery | Mobile prepared output; desktop legacy direct actions | Shared hook; actual latest-source DOCX/HTML checks | No external-save claim; no source loss | Retain |
| Print should never race the live preview | Live `window.print()` after animation frames | Isolated prepared frame; stale/cancel/error tests | Explicit user print gesture; no pretend downloadable PDF | Retain |
| Optional dark appearance can preserve output and identity | Document theme previously doubled as ambiguous dark toggle | Separate preference; artifact equality and typography regressions | Cream values unchanged; document styling independent | Retain |
| Useful review can remain deterministic and reversible | Disconnected diagnostics and immediate rescue actions | Exact source ranges, proposed source, backup and guarded undo | No fuzzy stale edits; no automatic source rewrite | Retain |
| Shared abortable asset work can corrupt a concurrent export | New cancellation regression failed on the original cache | Cache only shares completed or uncancelable requests; regression passes | Keep successful cache reuse and retry eviction | Retain |

## Limits and remaining roadmap

Physical iPhone/Android, receiving-app paste and native print/save verification are
still required. Chromium emulation and a stubbed native print call are not Safari,
Word desktop, Google Docs, or a confirmed saved PDF. WebKit could not launch in
this environment because its Linux runtime libraries were missing.

Source navigation is exact within the current source revision. Preview links are
available only when the planner retains matching source positions. Continuous
bidirectional scroll synchronization and universal transformed-node identity are
not implemented. Missing-image print failures are recoverable; preparation does
not repair inaccessible remote assets automatically.

No backend accounts, collaboration system, cloud document creation or multi-format
handoff kit was added. Kits remain conditional on evidence of repeated multi-format
work. There are no acquired usability-study results, production metrics or claimed
xAI/YC/Product Hunt endorsements. Long-document performance measurements and
physical-device research remain future evidence work, not a completed claim.

The pinned gstack digest's search/reuse, user-sovereignty and complete-error-path
principles guided implementation. This is not a claim that every interactive
upstream gstack review/QA ceremony ran. No dependencies or global hooks were added.

## Reproduce the captures

Run a production build, serve it with `pnpm --filter web preview --host 127.0.0.1
--port 4173`, then run `node scripts/capture-studio.mjs`. Install Playwright Chromium
or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a compatible local browser. Optional
`STUDIO_BASE_URL` changes the served target. The script uses synthetic local drafts
and a synthetic clipboard failure; it never sends documents to a receiving app.
It records empty/workspace views, permission recovery, a proposed rule fix and
pending/canceled preparation. Screenshot timestamps/browser version belong to the
capture run and are not production measurements.

## Executed checks for this implementation

Full build/prerender passed. Chromium: 35 scenarios passed, including unchanged
home typography and the incumbent desktop delivery-control role. Validation:
149 tests across 28 files passed. Fidelity: 20 fixtures passed. Lint passed with
pre-existing diagram/canvas warnings and no new warnings. The final visual captures
show no page overflow and all measured header controls within their viewport.

During implementation, selector errors in new tests and an incomplete prerender
build order caused development runs to fail; those were corrected and rerun. The
new asset-cancellation test demonstrated a real failure before its fix. Visual
review also found and corrected an inherited control font before final identity
verification. The final disabled dark action also has a measured contrast assertion. No identity expectations were weakened to accept a changed font.
