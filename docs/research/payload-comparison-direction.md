# Payload comparison: research and recommended direction

2026-11-17. The owner requested synchronized JSON scrolling, three app appearances,
and a researched recommendation for a stronger JSON/payload comparer, including
cURL. Implement the two direct requests; the additional product features below
are recommendations, not shipped capabilities or claims of market superiority.

## Sources and what was actually inspected

- [Text Compare](https://text-compare.com/): public site opened in Chromium;
  pasted synthetic 200-line inputs, submitted Compare and inspected the aligned
  two-column result. Its result keeps both columns in one scrolling surface.
  Its official page documents character highlighting, navigation and hiding
  unchanged sections. This is an interaction reference only; no source copied.
- [JSON Diff](https://jsondiff.com/): official semantic-comparison description;
  distinguish data changes from key-order/formatting changes.
- [unbreak.tools JSON Compare](https://unbreak.tools/json-compare): inspected
  public controls/docs for type filters, ignore paths, array matching, navigation
  and report formats. We should borrow the useful controls, not its automatic
  repair, guessed array IDs, loose types or payload-in-URL sharing defaults.
  Those conflict with MDToDocs' strict comparison/privacy commitments.
- [M2Toolkit API Response Diff](https://www.m2toolkit.com/tools/api-response-diff):
  inspected public controls/docs for status/headers/body, named environments,
  volatile-field filters and pasted-response workflow. This was documentation
  inspection, not a tested comparison session or verified implementation audit.
- [Spoold cURL comparison](https://spoold.com/tools/http/curl/compare) and its
  [repository README](https://github.com/spoold-com/curl-comparator): inspected
  the documented method/URL/query/header/auth/cookie/body breakdown. The repository
  exposes a README, not a reusable parser implementation; do not treat it as an
  established source library or transplant its Monaco/application/history stack.
- [curlconverter](https://github.com/curlconverter/curlconverter),
  [package manifest](https://github.com/curlconverter/curlconverter/blob/master/package.json),
  [parser source](https://github.com/curlconverter/curlconverter/blob/master/src/parse.ts)
  and [browser tool](https://curlconverter.com/): MIT candidate for cURL parsing.
  The inspected manifest is 4.12.0 and includes Tree-sitter/web-tree-sitter; a
  browser/WASM bundle and API spike is required before selecting a dependency.
  It was not installed, integrated or benchmarked in this revision.
- [Chrome DevTools Network reference](https://developer.chrome.com/docs/devtools/network/reference/):
  supports the Copy-as-cURL workflow developers already use.
- [HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-field-order):
  guide future header handling; repeated fields must retain their semantics.
  In particular, do not flatten every repeated header into one arbitrary value.

Only synthetic data was submitted to a public comparison demo. Reference images
and session observations stay in /tmp/compare-sync-research; they are not copied
into MDToDocs or represented as original designs. Some public page fetches failed
(JSON Lab 502, a guessed Diffchecker JSON URL 404); they are not evidence.

## Direct changes in this revision

**Visible linked scrolling.** JSON has a Sync scroll control above the editors,
on by default, with an explicit off state. Follow a corresponding field when
available rather than assuming equal scrollbar percentages. jsondiffpatch's
existing delta-key enumerator supplies old/new array index correspondence;
CodeMirror's JSON parser supplies raw token locations. Native CodeMirror block
measurements/coordinates and scroll containers do the layout work. No text/JSON
diff algorithm or line-alignment engine is introduced. Invalid inputs have no
semantic location map and use relative-position scrolling, disclosed in the
control's tooltip. Programmatic difference navigation does not trigger a scroll
feedback loop or steal the editing cursor. Mobile retains one readable pane.
Text Compare already has CodeMirror Merge's native common scrolling surface.

**Three named appearances.** Cream and the existing dark green are preserved;
Black adds #000000 app/editor/sidebar surfaces. The compact appearance control
opens explicit Cream / Dark green / Black choices with current-choice indication,
keyboard navigation and persistent preference. Device appearance remains the
initial fallback, not a fourth explicit choice. Document styling/exports are
independent. Black-specific surface overrides apply to screen, not print.

Source order is never silently changed. If keys are reversed, a matched field can
be at different line numbers and scrolling direction on each side. A raw-source
workspace cannot make every reordered line adjacent simultaneously. Sync follows
available field anchors; Previous/Next remains the precise way to inspect one
specific structural change, and unlinking remains available. Array identity is
still conservative; no ID guessing was added to make scrolling appear smarter.

## Recommended next sequence

| Priority | Improvement | Concrete user outcome | Implementation direction |
| --- | --- | --- | --- |
| 1 | Focus workspace, pane resizing and search | Give 300-line payloads most of the screen; find a field or value without scanning a long dropdown | Scoped workspace layout and CodeMirror's established search/folding facilities; preserve existing fonts and raw strings |
| 2 | Changes-only context and type filters | Review 5 meaningful regions without scrolling through hundreds of unchanged lines | Native folding/collapsing plus small Added/Removed/Modified controls; retain nearby context and visible hidden counts |
| 3 | Explicit noise filters | One action to ignore a chosen request ID or timestamp path, with an obvious way to restore it | In-memory ignore-path chips and visible excluded counts; no silently ignored fields or rewritten sources |
| 4 | cURL Compare | See why two requests behave differently without manually unescaping JSON or rearranging headers | Separate /curl-compare/ application reusing the comparison shell, CodeMirror, jsondiffpatch/jsdiff and a proven cURL parser |
| 5 | User-chosen array identity | Compare records after reordering, when the user knows which field is a stable identity | Select key per array, validate uniqueness/completeness on both sides, use upstream matching and reject ambiguous configuration |
| 6 | Pasted HTTP response comparison and review reports | Separate status/header/body changes; hand a concise result to a teammate | Accept saved raw responses; preserve repeated headers; preview a redacted Markdown report before explicit copy/download |

These are product recommendations inferred from the references and the owner's
workflow, not validated usability findings. Priorities 1–3 improve the core
workspace before adding many formats or controls. cURL is the strongest next
standalone tool because it reuses the JSON body comparison users already need.
No accounts, cloud storage, sharing URLs containing payloads or automatic repair.

## Proposed cURL Compare contract

Two editable Original/Updated commands stay in the working view. Present semantic
sections for method, origin/path/query, headers, authentication/cookies and body;
selecting a section locates its corresponding command/body content. JSON bodies
reuse jsondiffpatch; text bodies and unsupported syntax retain jsdiff/CodeMirror
comparison. Parsing limitations remain visible rather than claiming equivalent
requests when options are unsupported. Preserve repeated query parameters,
header/cookie multiplicity and the original commands.

Use a parser spike with curlconverter's browser path and upstream fixtures before
shipping. Test Bash quoting, backslash continuations, repeated flags, --data,
--data-raw, --json, --data-urlencode, empty values, explicit/implicit methods,
Windows Copy-as-cURL variants, multipart/file references and multiple requests.
Do not implement shell quoting with a handful of regular expressions. Bundle only
the needed browser/parser path, lazy-loaded on the new route, and retain notices.

Compare pasted requests locally; do not execute commands, resolve environment
variables, read referenced files or contact the API. Authentication differences
should remain detectable while summaries/reports offer secret masking. Keep
request comparison distinct from comparing pasted HTTP responses; neither should
pretend it has tested a live endpoint. This contract is proposed, not implemented.
