# Comparison tools implementation record

Branch: feat/comparison-tools, from main 80632fa. Revision records below distinguish
local verification and publication. No merge or deployment is claimed.

## Architecture and references

Text Compare uses @codemirror/merge 6.12.3, @codemirror/state 6.7.6,
@codemirror/view 6.43.15 and @codemirror/commands 6.11.1. MergeView and
unifiedMergeView own editing/highlighting/alignment/collapsing. Chunk precision
and documented scanLimit 500 / timeout 50 ms report approximate matching.
No chunk-revert controls are enabled. Standard jsdiff 8.0.2 produces patches.
JSON Compare uses jsondiffpatch 0.7.7 with array moves disabled, no objectHash,
and its existing array LCS/delta format. The presentation adapter traverses
library deltas, rather than implementing structural comparison.

Read the CodeMirror source mirror, current hosted mergeview source and official
API documentation; jsondiffpatch arrays/deltas docs, formatter base and security
fixtures; ItsJust viewer toolbar/canvas behavior and Unicode cases; jsdiff patch
API; Diff2Html repository; text-compare-lite README/interaction descriptions only.
JSONBoss could not be accessed (authentication required). No AGPL source imported.
See ../licenses for notices. Reversible key escaping is necessary because upstream
JSON delta construction drops the __proto__ key; our regression caught this.

Custom glue: ephemeral input memory, lifecycle bridge for CodeMirror, source
imports/copy/actions, normalized read-only comparison projection, delta-to-React
rows, conservative resource limits, and standalone metadata/prerender routing.
Existing document destination types stay unchanged. Comparison engines are lazy.
Startup document buffering is disposed before comparison inputs become editable.
No comparison inputs enter document storage, URL parameters or analytics.

## Limits and evidence boundaries

- Exact line endings use CodeMirror’s documented lineSeparator facet set to LF,
  retaining carriage returns as source characters. Its highlightSpecialChars
  extension renders these safely. Unified originals are passed as Text objects
  so unifiedMergeView does not normalize them. Patches use original strings.
- Undo uses CodeMirror history fields, retained across view/options remounts when
  the source is unchanged. Route changes preserve source strings but reset editor history.
- Text updates use CodeMirror's synchronous incremental bounded diff, without a
  separate debounce/worker. No performance measurement justifies workers yet.
- JSON compares after 200 ms, cancels pending timers on edit/unmount, and bounds
  each side to 200,000 characters, arrays to 1,000 items, nesting to 100 levels,
  and total visited values to 20,000. Inputs exceeding limits stay available.
  These conservative limits need further real-device performance measurement.
- JSON duplicate keys follow strict JSON.parse last-key-wins semantics, disclosed
  in the UI. No repair or inferred array identity. Object reorderings compare by
  position; primitive reorderings may appear as removals/additions.
- Expanded change context currently shows both payloads, rather than a focused
  ancestor excerpt. File import limit is 2 MB. Mobile uses one source editor and
  a unified option; navigation in source-only tabs has no active merge chunks.
- No physical-device, Safari, accessibility audit or production deployment claim.

## Validation

Final command results and sizes are recorded below after execution. Screenshots:
compare-{text,json}-{320,390,1440}.png in this directory.

### Actual final results

| Command | Actual result |
| --- | --- |
| `pnpm --config.verify-deps-before-run=false build` | Passed recursive TypeScript/build and all 10 prerender routes |
| `tsx --test apps/web/src/compare/model.test.ts` | 20 passed, 0 failed |
| `node node_modules/vitest/vitest.mjs run` in packages/validation | 173 passed in 30 files |
| `pnpm --config.verify-deps-before-run=false --filter web lint` | Exit 0; warnings remain, including new React bridge/effect warnings |
| Chromium `playwright test tests/browser/compare.spec.ts tests/browser/seo.spec.ts` | Final 22 passed, 0 failed; subsequently added exact EOL scenario passed 1/1 separately |
| Initial full `playwright test` | 126 passed, 24 failed in 10.9 minutes; before final focused fixes |
| Two representative failures run on untouched main | Both reproduce: 320px export menu bounds and obsolete Advanced export options selector |

The full suite is not green and was not repeated after final fixes. Other failures
are not all triaged. The initial SEO footer count failure was corrected from 7 to
9 for the two explicitly requested internal links; its final scenario passes.
No protected typography/identity assertions were altered. See
comparison-browser-baseline-failures.txt for the full initial failure list.

Focused browser evidence includes 320/390/1440px overflow checks and screenshots,
JSON validation/safe strings/key escaping, source editing, clear/swap/undo/import,
in-memory JSON handoff, Back/Forward, normalization with read-only projection,
CRLF preservation and clipboard patch output, exact EOL differences in both merge
views, and a homepage network assertion excluding comparison chunks.

Still untested or incomplete: real OS drag/drop, prolonged rapid typing stress,
comprehensive mobile keyboard/screen-reader behavior, every array/Unicode corner
case in a browser, cross-route undo (not retained), and physical-device performance.
Existing export failures outside the focused suite remain unresolved. No claim
that upstream tests alone establish our integration's correctness.

### Bundle impact

These measurements describe the initial implementation before the typography correction.

A detached main build using the same installed dependencies supplies the baseline.
Summing gzip(level 9) sizes over each homepage entry's static JS import graph:
104,761 → 105,986 bytes: **+1,225 bytes (1.17%)**. This excludes lazy imports.
Deferred chunks: TextEditors 100,047 bytes gzip; JsonResult 6,207 bytes; CompareApp
3,481 bytes. Actual hashes and graph files: comparison-bundle.json. These are local
build measurements, not network/production performance claims.

### Screenshots

- Text: [desktop](compare-text-1440.png), [390px](compare-text-390.png), [320px](compare-text-320.png).
- JSON: [desktop](compare-json-1440.png), [390px](compare-json-390.png), [320px](compare-json-320.png).

The three dirty DOCX fixtures present immediately after clone were preserved and
excluded from the implementation commit. No push, merge or deployment performed.

## Typography correction following owner review

The initial comparison shell incorrectly forked the incumbent introduction:
smaller headings, default sans description/controls, custom button geometry, and
CodeMirror's own scroller monospace declaration. This was an implementation error,
not an approved visual direction. Both tools now reuse HomeIntroduction with
explicit standalone content (unchanged default behavior for existing callers),
shared Button controls, existing body/code roles and existing supporting-content
typography. Custom compare button styling is removed. The CodeMirror scroller
inherits JetBrains Mono. Source roles use 12px/18px desktop and 16px/1.65 mobile.
No new fonts or changes to homepage, sidebar or wordmark styles.

Added compare-identity.spec.ts to compare computed heading/description styles
against the real homepage at desktop/mobile widths, and assert shared control
and source typography. Existing identity expectations remain unchanged.

Correction verification: production build/TypeScript and ten-route prerender pass;
lint exits 0 with warnings. First focused browser run passed 16/16. After the
scroller inheritance correction, 15/16 passed: both cross-page typography checks,
existing home typography/wordmark checks, Mermaid font check and all comparison
scenarios pass; the existing desktop export-control typography scenario timed out
waiting for its control. Its expectations were not altered. Updated screenshots
are captured at 320px, 390px and 1440px. This correction does not resolve the wider
export/regression failures recorded above.
The isolated desktop export-control recheck also timed out; no typography assertion
or existing export implementation was changed to hide the failure.

## Workspace correction after owner rejection

The screenshot review rejected the interaction layout, not only its fonts. The
previous raw file pickers and detached action rows made it a form rather than a
comparison workspace. Changes in this revision:

- One bordered working surface with integrated source headers and a compact
  toolbar. Native file fields are hidden behind real Import actions; Format and
  Copy sit beside the input they affect. Existing shared Button/Menu controls,
  fonts and cream/sidebar tokens are reused. The introduction changes alignment
  and available width, not font properties.
- JSON inputs now use CodeMirror's existing editing, line numbers, history,
  virtualization and standard JSON language highlighting. New MIT dependencies:
  @codemirror/lang-json 6.0.2 and explicit @codemirror/language 6.13.1. JSON structural
  changes remain exclusively generated by jsondiffpatch.
- Results have a change count, Added/Removed/Modified breakdown, Previous/Next,
  copyable path and separate old/new value columns. Missing values are explicit;
  change type text and signs supplement existing semantic background tokens.
  Selecting a path expands its parent payload context instead of both entire
  documents. Context segments come from the library delta adapter; no alternate
  structural comparison is performed.
- Both tools use the same keyboard-operable source tabs on mobile. JSON source
  views keep editor instances/history alive while switching. Text remains one
  MergeView/unifiedMergeView interface, with no duplicate result viewer.
- Empty JSON inputs show instructions rather than syntax errors; invalid nonempty
  inputs retain clear errors. Pending computations do not display old results.
  Per-side asynchronous import versions protect later edits and opposite inputs.
- Supporting privacy/limits prose is collapsed beneath the tool.

Visual iteration caught two concrete failures: native file fields were initially
still exposed by old CSS, and a complete removed-value row did not fit a laptop's
768px viewport. Those were fixed; the tests were strengthened to require hidden
native fields and the entire first real change row inside the viewport. No font
expectations or geometry assertions were relaxed to excuse those failures.

Actual checks: recursive production build/TypeScript and ten-route prerender
passed; `tsx --test apps/web/src/compare/model.test.ts` passed 20/20;
`playwright test compare-workspace.spec.ts compare.spec.ts compare-identity.spec.ts
seo.spec.ts` passed 28/28 in Chromium; web lint exited 0 with warnings. Browser
runs use PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium and the repository's test
configuration. The tests cover actual copy/format actions, per-side file imports
and DOM file drops, source handoff, unsafe strings/property names, root values,
JSON navigation/context, exact text line endings, unchanged font roles, SEO,
320/390/desktop widths and page overflow. Earlier full-suite failures remain
unresolved; they were not reclassified as passing.

Rendered evidence for the owner feedback case:
[1366×768 laptop](compare-json-review-1366.png) and
[390px mobile](compare-json-review-390.png). The six standard text/JSON screenshots
were also refreshed. These are real rendered local pages, not mockups. Physical
phone and screen-reader testing remain outside the evidence. No claim that tests
alone establish ideal UX. Local revision only; no push, merge or deployment.


## Research-driven UX revision · 2026-11-17

[Primary references and decisions](../research/comparison-ux.md) record actual
public-demo interactions and official documentation. No commercial UI source or
AGPL code was copied. This revision addresses the owner's workflow and theme
alignment objections, without changing the approved font roles or homepage hero.

- Shared appearance/Tools controls are grouped on the right. Sidebar toggle sits
  beside the wordmark and really expands the workspace. Active tool navigation
  uses single-entry browser history. Existing compact Tools menu is retained.
- Empty sources offer explicit Paste/Open file actions; clipboard denial leaves
  normal manual paste available. Lazy loading reserves useful editor space and
  accepts early input. The whole empty text pane accepts click-to-type.
- JSON has stable per-source validation and an explicit Review changes action.
  Inputs/Changes views keep source editors and undo alive. Review shows path,
  Original value and Updated value; context is optional. No stale success is
  displayed during recomputation or after resource-limit failures.
- Text navigation reports the current chunk and uses native F7/Shift-F7 commands.
  CodeMirror's common merge scroller preserves alignment; no second scroll or
  diff engine was added. Comparison projection retains the selected layout.
- Existing shared mobile breakpoint (1023px) provides one readable source pane.
  Resize preserves inputs and the intended desktop/compact view. Previous/Next
  remain usable at 320px. No horizontal page overflow at tested widths.
- Dark mode updates CodeMirror theme compartments without replacing sources or
  editor history. @codemirror/theme-one-dark 6.1.3 supplies MIT syntax highlighting
  only; MDToDocs supplies the shell, palette and typography. Notice retained.

Final commands/results:

- `pnpm --config.verify-deps-before-run=false build`: pass; recursive packages,
  web TypeScript/build and all ten prerendered routes.
- `node_modules/.bin/tsx --test apps/web/src/compare/model.test.ts`: 20 passed,
  zero failed (retained engine fixtures and safety coverage).
- `pnpm --config.verify-deps-before-run=false --filter web lint`: exit 0 with
  warnings; no claim of a warning-free codebase.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test
  tests/browser/compare-experience.spec.ts tests/browser/compare-workspace.spec.ts
  tests/browser/compare.spec.ts tests/browser/compare-identity.spec.ts
  tests/browser/seo.spec.ts`: **40 passed, zero failed**. Includes native aligned
  text navigation, whole-pane input hit area, dark/light controls at 320/390/900/
  1366px, actual sidebar collapse, loading/typing/resize, invalid and large JSON,
  copy/import/drop/format, inputs/review round trips, unchanged font assertions,
  local state/history and existing SEO routes.

[Current bundle measurement](comparison-research-bundle.json): homepage initial
static JS graph is 106,353 gzip bytes versus 104,761 on main 80632fa: +1,592 bytes.
This is a per-file gzip sum, excludes CSS/fonts/deferred modules, and is not a
network-speed claim. Browser coverage verifies comparison engines are deferred
on the homepage. Individual chunk sizes in the report exclude shared imports.

Rendered local captures, using the built-in sample and settled animations:

- [Desktop empty state](compare-final-empty-desktop.png),
  [inputs](compare-final-inputs-desktop.png),
  [changes](compare-final-changes-desktop.png).
- [Mobile inputs](compare-final-inputs-mobile.png),
  [changes](compare-final-changes-mobile.png),
  [dark changes](compare-final-changes-dark-mobile.png).
- [Desktop dark inputs](compare-final-inputs-dark-desktop.png),
  [dark changes](compare-final-changes-dark-desktop.png).

The original six text/JSON width captures and owner-case laptop/mobile captures
are also refreshed. These checks do not establish that the design is ideal or
replace user testing. Physical phones, screen readers and the full existing
export suite were not newly validated. Earlier full-suite failures remain as
recorded above. Revision stays local; no push, merge or deployment.


## In-context JSON correction after owner rejection · 2026-11-17

The owner explicitly rejected moving a large payload's changes into a separate
Inputs/Changes screen. This supersedes that workflow decision in the previous
research revision. The working comparison is now the editable JSON itself:

- Both original source strings remain in CodeMirror. Every jsondiffpatch change
  decorates its actual source value and lines, with a +/−/~ gutter marker. A compact
  navigation bar gives the count, Previous/Next, F7/Shift-F7 and a native list of
  changed paths. No separate results page or review gate hides the source.
- Navigation brings the corresponding location into view in both editors and
  places the editing cursor there without stealing focus from the navigator.
  Clicking a highlighted value keeps the clicked pane under the pointer still;
  only its counterpart moves. The source headers identify their actual paths.
- A selected-field strip provides path copying and bounded old/new previews.
  Missing values are explicitly absent; only an existing value receives a change
  highlight. The missing side has a dashed parent navigation anchor.
- Compact screens retain Original/Updated tabs, the same selected structural
  change and full-sized source editing. Changing a value recomputes in place;
  native undo restores the original text and differences.
- Validity, syntax errors and resource-limit feedback remain next to the source.
  Source offsets are cleared immediately on edits and never reused for a pending
  comparison. No formatting, key sorting, inferred IDs or repair happens silently.

Engine reuse: jsondiffpatch still computes all structural differences. Its existing
BaseFormatter.forEachDeltaKey method supplies array old/new index correspondence;
no formatter HTML is produced. The installed CodeMirror JSON language's Lezer
parser supplies exact source token boundaries. Custom glue indexes those tokens by
path and uses CodeMirror state fields, decorations, gutters, selection and scrolling.
This is source presentation, not a replacement JSON parser or comparison algorithm.
No new dependency or license is introduced. Text Compare remains CodeMirror Merge.

Regression fixtures cover reordered object keys, differently indented payloads,
array insertion/removal indices, nested arrays, primitive/type changes, duplicate
keys (last occurrence), missing/null, Unicode and unsafe property names/strings.
Browser scenarios use over 300 lines, navigate to line 339, edit in place, undo,
copy exact original strings and switch dark/mobile appearance. A separate dense
fixture contains 91 real structural changes and reverses all object keys in Updated;
both highlighted values must be visible at their different source positions.
The cursor test includes inspecting a nearby change before navigating to a distant
one and re-entering the editor after a theme switch.

Earlier test iterations caught two test-harness assumptions (multiline marks are
split into DOM spans, and Home/End follows visual wrapping). Tests now check the
actual highlighted LTE span and use native word selection to edit a numeric value.
A screenshot helper that awaited all browser animations also awaited editor caret
animations; final dark captures use the supported reduced-motion preference.
A real cursor-position issue exposed by returning to the editor after navigation
was corrected by updating the native CodeMirror selection with explicit navigation.
These changes preserve the same raw-payload, editing and undo assertions.

Rendered current workspace evidence:

- [91 changes inside 300+ lines, desktop](json-context-91-changes.png).
- [Desktop source comparison](json-context-1366-light.png),
  [desktop dark at the distant change](json-context-1366-dark.png).
- [390px source comparison](json-context-390-light.png),
  [390px dark at line 339](json-context-390-dark.png).
- [320px source comparison](json-context-320-light.png),
  [320px dark](json-context-320-dark.png).

These are rendered local Chromium pages. Dark evidence uses reduced motion to
avoid capturing the middle of an appearance transition; normal appearance changes
are exercised in the existing experience tests. No physical-device, screen-reader
or user-research validation is claimed. Earlier unrelated export-suite failures
remain unresolved and were not reclassified as passing.

| Hypothesis | Baseline / revision | Change | Check / actual result | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |
| Large JSON is easier to inspect without losing source context | Owner rejected detached Inputs/Changes review | Structural source highlights, shared navigation and retained editing | See final verification below | Existing fonts/sidebar, local-only state, jsondiffpatch semantics, exact source copy and undo | Replaces rejected flow; usability is not claimed proven by automated checks |


Final verification for the in-context revision:

- `pnpm --config.verify-deps-before-run=false build`: passed, including recursive
  package builds, web TypeScript and ten-route prerender.
- `node --import tsx apps/web/src/compare/model.test.ts`: **20 passed, 0 failed**.
- `node --import tsx apps/web/src/compare/jsonLocations.test.ts`: **14 passed,
  0 failed**. Direct execution uses Node's test registration/reporting and avoids
  the sandbox-blocked tsx CLI IPC socket.
- `pnpm --config.verify-deps-before-run=false --filter web lint`: exit 0 with
  warnings (including existing CodeMirror ref bridges); not a warning-free claim.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test
  tests/browser/json-context.spec.ts tests/browser/compare-workspace.spec.ts
  tests/browser/compare-experience.spec.ts tests/browser/compare.spec.ts
  tests/browser/compare-identity.spec.ts tests/browser/seo.spec.ts`: **44 passed,
  0 failed**, in the final single run. Typography assertions remain unchanged.
  Workflow assertions changed because the owner explicitly rejected the old
  separate review view; tests now require sources to remain visible and editable.

[Current bundle measurement](comparison-context-bundle.json): homepage initial
static JS is 106,355 gzip bytes versus 104,761 on main 80632fa (+1,594 bytes).
Compared with the preceding research revision this is +2 bytes. This per-file gzip
sum excludes CSS/fonts and deferred imports; chunk figures exclude shared imports.
Browser checks verify engine chunks remain deferred on the homepage. Existing
privacy, structural complexity and import limits still apply. No physical-device
or full export-suite pass is claimed. Push is authorized by the owner's standing
instruction; this revision does not merge or deploy the branch.


## Linked scroll and three appearances · 2026-11-17

Owner explicitly requested a visible sync-scroll control and a third, absolute
black appearance, plus researched next steps. See
[primary references and recommendations](../research/payload-comparison-direction.md).
Text Compare's public site was actually used with synthetic 200-line inputs and
its aligned two-column result inspected. Other comparison/HTTP/cURL sources were
read as documented references; their claims were not treated as test evidence.
No public-demo source was copied and no cURL parser was installed.

JSON Sync scroll is on by default. Wheel/trackpad, scrollbar, touch and scrolling
keys can establish which visible pane leads; the counterpart follows source paths.
The existing jsondiffpatch formatter enumerates old/new array indices, including
unchanged elements. CodeMirror's JSON parser maps those paths to raw token offsets;
public block/coordinate APIs and native scroll containers handle the geometry.
This is navigation glue, not a new diff/line-alignment engine. No IDs are guessed.

The scroll correspondence is canceled/replaced on edits, compact-layout changes,
option changes and unmount. User scroll intent is distinct from programmatic
change navigation, preventing feedback loops and keeping clicked values under
the pointer. One correction after CodeMirror's layout/scroll-anchoring pass uses
rendered token positions; an initial strict pixel check exposed four pixels of
drift after relocking and was fixed without relaxing the <3px assertion. Source
strings and undo remain untouched. Invalid/unsupported inputs have no semantic
map, so they scroll by relative position; the tooltip states this limitation.

Raw key order is preserved. Reversed object order cannot make every neighboring
line align simultaneously. Continuous sync follows available field anchors and
can be disabled; explicit Previous/Next precisely locates a selected change.
Mobile retains one readable editor and source tabs rather than two cramped panes.
Text Merge retains its native common scroll surface.

The appearance chooser uses the existing native Menu/Button components. Named
Cream / Dark green / Black choices replace cycling, show the selected state and
return keyboard focus to the trigger. Initial device preference still resolves
to Cream/Dark green until the user chooses. Both old palettes/fonts remain intact;
Black adds #000000 app, editor and sidebar surfaces, neutral borders/hover surfaces
and the established semantic diff colors. Black screen overrides do not leak into
print. Persisted preference remains independent of document/export theme or
comparison payload memory. No new font or dependency was introduced.

Final verification:

- `pnpm --config.verify-deps-before-run=false build`: passed; package builds,
  TypeScript and ten-route prerender.
- `node --import tsx apps/web/src/compare/model.test.ts`: 20 passed, 0 failed.
- `node --import tsx apps/web/src/compare/jsonLocations.test.ts`: 14 passed,
  0 failed.
- `node --import tsx apps/web/src/compare/jsonScroll.test.ts`: 7 passed, 0 failed.
  Includes inserts/removals, nested arrays, repeated values, reordered object keys
  and unsafe property names. Container correspondence is a navigation anchor;
  equality still comes exclusively from jsondiffpatch.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test
  tests/browser/compare-sync-theme.spec.ts tests/browser/json-context.spec.ts
  tests/browser/compare-workspace.spec.ts tests/browser/compare-experience.spec.ts
  tests/browser/compare.spec.ts tests/browser/compare-identity.spec.ts
  tests/browser/seo.spec.ts`: **49 passed, 0 failed** in the final single run.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test
  tests/browser/identity.spec.ts tests/browser/mobile-refinement.spec.ts
  tests/browser/quiet-workspace.spec.ts -g 'incumbent home typography|mobile tools,
  title and reading width|header appearance and reading'`: **7 passed, 0 failed**.
  The actual grep expression is one line; this document wraps it for readability.
  Existing typography expectations remain unchanged. Appearance selectors were
  updated for the explicitly requested named-choice control.
- Web lint exits zero with warnings, not a warning-free claim.

The new browser scenarios verify real wheel scrolling from either side, an
inserted 40-line section plus different indentation, matching-field position
within 3px, off/on control behavior, selected difference navigation, all three
appearances at 320/390/1366px, exact #000 surfaces, payload preservation, persisted
choice, keyboard escape/focus and unchanged document DOM/colors/print appearance.
The document snapshot waits for its existing preparation shimmer to finish before
comparison; it does not drop the content-equality assertion. Old comparison and
SEO tests remain in the focused run. No physical-device or screen-reader claim.
Earlier unrelated full-suite/export failures were not newly validated or excused.

Current rendered evidence:

- [Linked corresponding fields with different line numbers](compare-sync-fields.png).
- [Desktop Black](compare-appearance-black-1366.png),
  [Dark green](compare-appearance-dark-1366.png),
  [Cream](compare-appearance-cream-1366.png).
- [390px Black](compare-appearance-black-390.png),
  [320px Black](compare-appearance-black-320.png).

[Bundle measurement](comparison-sync-bundle.json): initial homepage static JS is
108,071 gzip bytes versus 104,761 on main 80632fa (+3,310 bytes total; +1,716 versus
the preceding in-context revision). Figures are per-file gzip sums, exclude
CSS/fonts and deferred imports, and do not imply network-speed measurements.
Individual lazy chunk figures exclude shared imports. Browser coverage confirms
comparison engines are still deferred on unrelated routes. cURL/HTTP response
comparison, filters, focus workspace and configurable array identity remain
proposals. Standing instruction authorizes the verified branch push, not merge or
deployment.

| Hypothesis | Baseline / revision | Change | Check / actual result | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |
| Linked scrolling preserves context after source lengths diverge | Independent JSON scrolling rejected by owner | Source-field correspondence and visible on/off control | Real bidirectional wheel/unlock/relock checks pass with <3px matching-field difference | Native CodeMirror layout, original strings, conservative array identity, mobile single pane | Retained |
| An explicit Black choice can coexist with the established appearances | Cream and dark-green two-state control | Three named persistent app-only appearances | Black #000, source preservation, unchanged document DOM/print and existing-site checks pass | Existing fonts and cream/dark-green values remain | Retained under D013 |


## Focus, search and noise filters · 2026-11-17

Implemented the next workspace recommendations on `feat/comparison-tools`:

- Focus fills the viewport, hides the sidebar without changing its saved preference,
  keeps source actions available and exits with Escape. Desktop panes resize with
  pointer or keyboard (25–75%, double-click resets). Mobile retains source tabs.
- `@codemirror/search` 6.7.2 supplies native Find/Replace, selection, next/previous
  and keyboard commands. Find searches complete source and reveals folded matches.
  Its MIT notice is retained in `docs/licenses/codemirror-search-MIT.txt`.
- Changes only uses CodeMirror Merge collapse for text and native CodeMirror folds
  around existing jsondiffpatch source locations for JSON. Full context is the default.
  Fold buttons say hidden lines because excluded changes may also be folded.
- JSON type filters and Ignore field affect presentation only. Paths use existing
  typed segments, including hostile/dotted names; ignoring a path excludes its
  descendants, while ignoring a child never conceals a parent replacement. Active
  filters show explicit visible/total counts, excluded counts and removable chips.
  Zero visible changes never means equal when the complete delta contains changes.
- Selected JSON navigation aligns both native cursor positions in the common visible
  viewport after layout measurement. Clicking source keeps that pane still and
  aligns its counterpart. Deferred callbacks ignore replaced/destroyed editor views.

Custom glue is limited to workspace controls/styles, native search/fold integration,
visibility windows from existing engine locations, typed path filtering and native
scroll positioning. The comparison algorithms remain CodeMirror Merge, jsondiffpatch
and jsdiff. Payload strings/history are preserved; options/filters remain in memory.
Existing fonts, homepage source, sidebar tokens and document/export flows were not edited.

### Actual checks

- `pnpm --filter web build`: passes TypeScript, production bundle and all ten prerendered routes.
- `node --import tsx apps/web/src/compare/model.test.ts`: 20 pass.
- `node --import tsx apps/web/src/compare/jsonLocations.test.ts`: 14 pass.
- `node --import tsx apps/web/src/compare/jsonScroll.test.ts`: 7 pass.
- `node --import tsx apps/web/src/compare/jsonFilters.test.ts`: 6 pass.
- `pnpm --filter web lint`: exit 0 with warnings (including React refs/effect diagnostics);
  this is not a warning-free claim.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test`
  with `compare-focus.spec.ts`, `compare-focus-mobile.spec.ts`,
  `compare-sync-theme.spec.ts`, `json-context.spec.ts`, `compare-workspace.spec.ts`,
  `compare-experience.spec.ts`, `compare.spec.ts`, `compare-identity.spec.ts`,
  and `seo.spec.ts` (all in `tests/browser/`): **60 passed, 0 failed** in one final run.
  Eleven new checks exercise focus at 320/390/1366px, matching selected source within
  3px, native full-source search through folds, mobile input/control font roles,
  pointer/keyboard resize, exact source copies, filter counts, no payload storage/URL
  and editing/undo in the enlarged empty Text pane. Existing assertions were retained.
- Supplemental existing-site selection (`identity.spec.ts`, `mobile-refinement.spec.ts`,
  `quiet-workspace.spec.ts`, grep `incumbent home typography|mobile tools, title and reading width|header appearance and reading`):
  initial final-build run **3 passed, 4 failed**. Earlier runs of the same selection
  in this batch passed 7/7. The failed trace records HTTP **503** from Google Fonts
  for Material Symbols and the existing text fonts; raw icon text overlaps the
  document-name Save control. This prevents an unconditional existing-site pass claim.
  A single-worker recheck also reproduced font HTTP 503 at all four mobile widths.
  No font imports, homepage styles or existing test expectations were changed to hide it.

Native regex/replace controls are provided upstream but were not separately exercised
in this batch. No physical-device, screen-reader, whole-site export-suite or production
claim. Earlier broad-suite/export failures remain outside this focused verification.
Filters support selected existing paths, not wildcard/manual expressions. Array identity,
cURL and HTTP response comparison remain future work.

Evidence: [desktop focused workspace](compare-focus-1366.png),
[320px focus](compare-focus-320.png), [390px focus](compare-focus-390.png),
[mobile search](compare-search-mobile-390.png),
[text search](compare-search-text.png), [JSON search](compare-search-json.png),
[all changes excluded](compare-filtered-empty.png).

[Bundle report](comparison-focus-bundle.json): homepage initial static JS gzip sum
108,076 bytes, **+5 bytes** versus the previous sync/theme revision and +3,315 versus
main 80632fa. Search/editors/engines remain deferred. This measures per-file gzip sums
excluding CSS/fonts/deferred imports, not transfer speed or complete comparison-route size.
