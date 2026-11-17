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
