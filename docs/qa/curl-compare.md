# cURL Compare · 2026-11-18

Branch: `feat/comparison-tools`. Prior workspace revision `6936c20` was successfully
pushed at the start of this task. This revision adds `/curl-compare/` as a separate
local tool, with existing routing/prerender/metadata/sitemap and Tools links.
It does not create a document export destination or change the homepage hero,
fonts, palette tokens, sidebar geometry, document storage or exported styling.

## User outcome and scope

Two editable commands use the existing CodeMirror Merge interface. Request
sections show Method, URL, ordered Query, Headers, Auth & cookies, Body and
Options, with change counts and one selected change in context. Selecting a
section locates its command argument using Bash AST offsets and upstream option
tables. Recalculation does not move the typing cursor. An implicit method may
have no explicit argument to select. Original strings remain intact.

JSON Body opens the two decoded payloads **in this workspace**, using the existing
JSON source highlighting, path navigation and linked scrolling. It is explicitly
read only; Commands returns to editing. Format is an explicit view-only toggle
for both bodies. It recalculates displayed source locations, preserves commands
and copies the original extracted payload, not silently rewritten input. Long
unchanged context can be collapsed, searched and revealed with native editor APIs.
Raw command editors remain mounted across Body switches to retain undo.

Focus, desktop pointer/keyboard pane resizing, native Find, source copy, command
file import/drop, Swap, Clear and jsdiff unified command copy are available.
Mobile uses shared keyboard-operable input tabs and a compact section selector;
it never mounts two visible cramped source panes. Cream, Dark green and Black
retain the existing roles/tokens. Auth hiding is on by default in the details
strip and configurable in More. It does not redact commands, JSON bodies,
query values or explicit clipboard copies.

## Reused implementations and custom glue

| Source | Actual use |
| --- | --- |
| curlconverter **4.12.0**, MIT | Published Bash tokenizer, option tables/parseArgs, request construction, header interpretation and URL/query/body handling. Deep parser imports only; no language generators or upstream application. |
| web-tree-sitter **0.24.7**, MIT; bundled Bash grammar, MIT | Compatible browser runtime and upstream grammar WASM. Native tree-sitter packages are not used in the browser; their build scripts are disabled in workspace configuration. |
| lossless-json **4.3.3**, MIT | Already a curlconverter dependency; explicitly reused for strict JSON parsing and numeric precision checks. Unsafe numbers stay literal, with a partial-comparison explanation. |
| Existing @codemirror/merge **6.12.3** | Editable command comparison, native alignment, inline highlights, unified mode, bounded diff and collapse. |
| Existing CodeMirror JSON/language/search packages | Read-only body presentation, actual source token locations, folds/search/history/selection and native scrolling. |
| Existing jsondiffpatch **0.7.7** | All structural field/body delta generation and existing delta-to-change presentation. Conservative arrays; no inferred identities/moves. |
| Existing jsdiff **8.0.2**, BSD-3-Clause | Standard unified command patch copying. |

Custom code adapts the upstream request model into seven sections, retains header
occurrences instead of accepting upstream merging, presents deltas, classifies
AST argument ranges for navigation, and wires the existing MDToDocs shell/actions.
The published browser entry hardcodes root WASM paths; a small Vite resolution
adapter uses hashed asset URLs and releases parsed WASM trees after interpretation.
Native scroll handlers contain navigation in the editor while CodeMirror renders
and measures the target. No shell tokenizer, diff algorithm, syntax editor,
request executor or second structural engine was invented.

Shared input tabs, ephemeral input memory and existing support/capacity/history
dialogs were extracted for reuse; their behavior and typography assertions remain.
The footer count test now expects ten links and explicitly checks cURL's URL.
That expectation changes for the authorized new link, not to excuse layout drift.

## Meaning and limits

- One literal **Bash** cURL command with one HTTP(S) URL per side. Pipelines,
  redirects, environment expansion, substitutions, scripts, multiple requests and
  CMD/PowerShell syntax are not interpreted. No commands are ever executed.
- Query order, empty versus missing values, and repeated occurrences are preserved.
  Header names compare case-insensitively; occurrence values/order remain intact.
  Separate versus combined headers are not assumed equivalent.
- Supported ordinary request fields are compared; unsupported options are explicitly
  partial. External file references compare names only and are always partial.
  No files named by the command, API endpoints or environment variables are resolved.
- Safe valid JSON bodies ignore property order/spacing. Duplicate keys follow the
  existing tool's last-property-wins policy. Invalid declared JSON and unsafe numeric
  precision fall back to literal body comparison, with clear explanations. This
  precision guard applies to cURL extraction; the standalone JSON tool is unchanged.
- Matching interpreted fields is not a claim about live server behavior, curl-version
  defaults or wire-identical requests. Raw command differences remain available.
- Interpretation limit: 50,000 characters/side; command-file import: 200 KB. Native
  Bash parsing uses a 50 ms timeout per parse and resets after failure; initialization
  has an 8 s failure deadline. Existing bounded Merge diff and JSON complexity limits
  remain. Debounced work is ignored after typing or navigation makes it stale.
- Payloads are held in memory only; refresh clears them. There is no URL encoding,
  persistence, payload logging, telemetry, backend or network request execution.
  Browser tests inspect actual storage/requests and retain the saved Markdown draft.
- No configurable array identity, response comparison, redacted report export,
  physical-device or screen-reader validation is claimed in this revision.

## Evidence and checks

The eight unmodified upstream MIT fixtures are from curlconverter commit
`06636420d2af2b28f78203dd7915ce0ba8fcdbba`, under
`test/fixtures/curl_commands/`, with local copies/provenance in
`tests/fixtures/curlconverter/`. They cover quoted headers, disabled/empty headers,
form data, concatenated --json data, repeated query keys and basic auth. MDToDocs
browser cases additionally check unequal requests and expected field values.

- `pnpm --filter web build` and `pnpm prerender`: TypeScript, production bundle
  and eleven prerendered routes pass.
- `pnpm --filter web lint`: exit 0 with warnings; not a warning-free claim.
- Direct `node --import tsx` runs: model **20**, locations **14**, scroll **7**,
  filters **6**, cURL JSON-body safety **8**: **55 passed, 0 failed**.
- Full comparison/cURL/SEO browser run: **107 passed, 0 failed** in one final run.
  Equivalent shell file selection for the executed eleven spec files:
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test
  tests/browser/compare*.spec.ts tests/browser/json-context.spec.ts
  tests/browser/curl-compare.spec.ts tests/browser/curl-workspace.spec.ts
  tests/browser/seo.spec.ts --workers=2` (one command, wrapped here).
  Tests include the actual 320/390/1366px viewport, readonly typing attempts,
  format/reveal offsets, native search through folds, original clipboard strings,
  undo, drag/drop side, swap/clear, source cursor retention, partial/error recovery,
  unsafe numbers, markup/prototype keys, stale input, asset failure, memory-only
  navigation/refresh, no request execution and JS-disabled prerendered content.
- Final compact mobile count-label copy refresh: **3 passed, 0 failed** at
  320/390/1366px after rebuilding/prerendering; screenshots refreshed.
- Existing-site supplemental run: **10 passed, 0 failed**. Executed
  `grouped-sidebar.spec.ts`, `identity.spec.ts`, `mermaid.spec.ts`,
  `ux-handoff.spec.ts`, `quiet-workspace.spec.ts`, with grep
  `reference sidebar|tool navigation retains|sidebar duplicate|incumbent home typography|diagram options are reachable|rename retains identity and history|successful restore preserves|Word and HTML remain`.
  Covers 248px sidebar identity/rename/document switching/capacity cancellation,
  home typography at 390/1440px, real SVG/PNG/JPEG diagram downloads,
  actual Word/HTML downloads, failed recovery backup leaving text intact and
  successful recoverable restoration. Earlier unrelated full-suite failures are
  not represented as resolved by these focused passes.

[Bundle measurement](curl-bundle.json) separates homepage static imports from
lazy parser JS/WASM. Homepage initial static JS is 116,556 gzip bytes versus 108,076 at 6936c20 (+8,480 bytes). Additional common shell chunk boundaries contribute to this increase. No parser/editor engine markers occur in the initial graph;
a browser test verifies no parser WASM on home/Text/JSON routes and exactly two
WASM assets on cURL. Measurements exclude CSS/fonts and are not transfer-speed claims.

[Local performance sample](curl-performance.json): warm 700-field literal JSON
body, one change, desktop Chromium, approximately 28,000 characters per side.
Includes import actions, debounce and rendering; only timings/sizes are recorded.
The final sample took 655 ms wall time and observed three long tasks (89/75/93 ms).
An earlier run was 522 ms with no observed long tasks; results vary with host load.
These samples do not establish device or adversarial-input performance, and include
editor/render work rather than isolating parser CPU. No worker framework was introduced;
the parser's size/time bounds and explicit fallback remain the responsiveness guardrails.

Screenshots: [desktop body](curl-body-1366.png),
[formatted body](curl-formatted-body-1366.png),
[desktop focus](curl-command-focus-1366.png),
[390px Black](curl-body-black-390.png), [320px Cream](curl-body-cream-320.png),
[390px Dark green](curl-body-dark-390.png).

Upstream obligations/issues: retain the MIT/BSD notices under `docs/licenses/`.
No AGPL source was copied. curlconverter's published 4.12.0 runtime dependencies
differ from current main; integration uses the actual published API and compatible
0.24.7 WASM runtime. The runtime emits upstream dynamic-linking `eval` build
warnings and browser-externalized fs/path warnings; browser tests verify parsing
and asset failure without executing pasted commands. No restrictive-CSP claim is
made. Raw editor operation remains available if parser initialization fails.

| Hypothesis | Baseline / revision | Change | Check / actual result | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |
| API requests can be reviewed without manually unescaping JSON or leaving the workspace | Text/JSON tools only, 6936c20 | Established cURL parser + existing source editors/delta engine | Upstream fixtures, expected request fields, same-workspace body source/navigation and original clipboard strings exercised in Chromium | No execution, storage, guessed IDs or typography changes | Retained; final 107 browser/55 unit checks pass |
