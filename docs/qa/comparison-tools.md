# Comparison tools implementation record

Branch: feat/comparison-tools, from main 80632fa. Local only; no push/merge/deployment.

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
