# Direct handoff, contextual review and version history

Implemented on `ux/direct-handoff-version-review`, based on `fb62415` from the
completed Iteration 02 work. No deployment or push. Existing dirty fixture DOCX
files are excluded.

## Scope and findings

The actual baseline had a six-document silent rotation, not the five-document
choice described in the brief. It also saved restore backups through a storage
adapter that intentionally swallows quota errors. Both were corrected before
exposing destructive new UI actions. Existing six-document workspaces survive;
capacity is enforced only on new/duplicate actions. No silent eviction/migration.

Shared button/icon/toggle/disclosure controls provide consistent focus, state and
interaction treatment. Existing text roles, Newsreader/JetBrains Mono fonts,
cream surfaces, document layouts and renderer fidelity are retained. Success and
warning tokens have light/dark variants; animations honor reduced motion.

Normal handoff is Copy for Google Docs or Download (Word, original Markdown,
HTML, Print / Save as PDF; rich-text and advanced document options remain).
Formatted clipboard write is invoked synchronously in the gesture with promised
HTML/plain blobs. Version/source guards and aborts reject stale preparation.
Success appears only after the write resolves, in the same-sized button for two
seconds, with an accessible announcement and no success toast. Browser denial
shows retry and Word-download guidance. PDF preparation still precedes an explicit
print gesture; opening Print does not establish that a PDF was saved.

Validated diagram failures get an amber strip above the preview. Optional syntax
normalizations remain separate suggestions. Attention is tracked in session by
document ID and failing source fingerprint; ordinary reparses/theme switches do
not replay it. Review uses existing repair/apply/undo controls and can list all
affected diagrams. Delivery warnings offer review or explicit continuation.
The inspector presents actionable source-linked issues instead of scores/matrices.
The primary status bar also drops fidelity percentages and element counts, and
opens actionable issues instead of a compatibility matrix.

One theme switch follows OS appearance initially, persists explicit choice, and
uses native view transitions only when supported and motion is allowed. Sync scroll
has a pressed state, linked/unlinked symbols and explicit On/Off in split view.
Header/sidebar rename share document IDs; explicit names survive source edits.
Sidebar ellipsis exposes Rename/Duplicate; existing titles and history remain linked.

The version browser loads jsdiff with history, compares Saved → Current, shows
line counts, numbers and word highlights, and renders source as React text.
Unchanged groups are lazy-expanded; changed groups are paged at 200 lines;
comparison and word-highlight budgets bound pathological work. Save version needs
no name. Restore persists/verifies a recovery copy first; failed storage leaves
source/documents unchanged. The recovery journal is independent of the rolling
50-snapshot list, so replaced-document backups remain recoverable. It is local
browser storage and can fill; it never claims unlimited or cross-device durability.

Tools use only the existing seven converter/diagram routes. The normal-flow footer
contains crawlable links in prerendered HTML. Privacy links to existing on-page
privacy guidance; About opens the existing dialog; Feedback uses the existing
GitHub issues destination. There are no invented pages or contact services. Route
metadata, descriptions, FAQs and canonical/sitemap conventions remain intact.

## Verification

Final commands/results, screenshots and bundle sizes are recorded below. The first development pass exposed a destination reset when
reopening advanced options; that was corrected. Old tests were adjusted only for
explicitly authorized controls/history interactions, not typography expectations.
A sandbox-only validation attempt could not bind the headless API server; the
network-enabled rerun passed 167 tests across 29 files. Intermediate failures do
not count as final passing evidence.

## What follows in the SEO program

This is a UX layer on Iterations 01/02, not a new SEO architecture or deployment.
The next planned work is Iteration 03: trustworthy destination-fidelity evidence.

1. Establish a fixed public-safe corpus: tables (including wide tables), headings,
   lists, technical code, equations, footnotes, remote/local images and Mermaid.
2. Generate versioned DOCX/HTML/diagram outputs with exact source and engine
   version; distinguish structural fixture checks from actual receiving-app tests.
3. Manually inspect Word and Google Docs paste/DOCX handoffs using that corpus.
   Record unsupported/partial behavior, screenshots and reproducible instructions.
4. Compare competitor outputs on the same examples; qualify observations by
   destination/version. Publish only reviewed downloadable artifacts and evidence.
5. Update destination-specific claims/capability guidance from those results.
   Then remeasure the deployed landing pages and direct handoff on real mobile
   browsers; local lab measurements are not CrUX or receiving-app verification.

Do not begin mass page creation, blogs, backlinks or new integrations to substitute
for fidelity evidence. Production release/Netlify status and physical-device
clipboard/print checks are separate from this local implementation.

## Executed checks and artifacts

- Production: `(cd apps/web && ./node_modules/.bin/tsc -b && PERF_ANALYZE=/tmp/ux-after-bundle.json ./node_modules/.bin/vite build)` and
  `TSX_TSCONFIG_PATH=apps/web/tsconfig.app.json node --import tsx scripts/prerender.ts`.
  These are the configured Netlify web build/prerender steps, run directly to
  avoid the environment's pnpm self-management mismatch. Eight routes generated.
- Browser: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node_modules/.bin/playwright test --reporter=line` — **106 passed**.
  Sixteen new cases cover clipboard denial/real success, unchanged button width,
  latest direct DOCX/HTML artifacts, stale-copy rejection, selected-format retry,
  rename/history identity, failed/successful restore backups, unnamed versions,
  capacity cancellation/failure/replacement, long safe diffs, diagram attention and
  delivery warnings, and responsive light/dark controls at 320/375/390/768/1024/1440.
- After the final footer callback wiring, SEO, identity and new-UX browser checks
  were rerun against the rebuilt output — **33 passed in 48.6 seconds**.
  The route test now asserts a window sentinel survives navigation, proving a
  client transition rather than only successful full-page reload.
- Validation: `(cd packages/validation && ./node_modules/.bin/vitest run --maxWorkers=2)` — **167 passed across 29 files** with local-server access.
- Fidelity: `(cd packages/fidelity-lab && node --import tsx src/runner.ts)` — **20 passed**.
- Lint: `(cd apps/web && ./node_modules/.bin/oxlint)` — passed, existing canvas/diagram warnings only.
- `node scripts/check-material-symbols.cjs` — all **84 currently referenced glyphs** covered by the existing subset.
- Source whitespace check passed. New jsdiff dependency is pinned to **8.0.2**;
  built-in types suffice, no additional UI/animation/diff-editor library was added.
  Its BSD notice ships at `public/licenses/jsdiff.txt`.

Initial external JS compression comparison uses the preserved baseline dist and
final dist with Node `gzipSync(bytes,{level:9})`, including entry plus automatically
preloaded runtime helper, excluding headers/HTML. Exact values are retained in
`/workspace/ux-evidence/bundle-summary.json`. The baseline is 103,387 B gzip and
the final output is 105,180 B gzip: 1,793 B extra, under 2%.
jsdiff remains in the deferred history chunk (about 4.9 kB gzip including its UI).
The history, preview, DOCX and diagram engines are not preloaded on empty converter
landings. No fresh LCP/CrUX claim is made for this UX task.

Baseline/final synthetic-source screenshots under `/workspace/ux-evidence/` cover
375px/1440px workspace previews in light/dark, plus final homes and populated
history comparisons. Visual inspection retained the same fonts, white document
paper and application cream/dark treatments. The intentional visible changes are
the requested header/menu states, compact rename control, selected sync toggle,
warning strip, issues-only inspector/status, footer and version browser. New
mobile handoff controls occupy two compact header rows instead of overflowing;
there is no extra rename row or promotional control.

Limitations: Chromium automation/emulation is not real iPhone/Android/Safari testing.
Native clipboard HTML/plain writing and generated file structures were checked,
but Microsoft Word/Google Docs receipt and PDF saving were not performed. View
Transitions have a native/reduced-motion fallback; physical-device visual checks
remain useful. Recovery copies are browser-local and may hit storage quota; save
failures are reported rather than silently replacing content. Diagram attention
is remembered for the current session, not a cross-browser/cloud preference.
jsdiff timeouts can omit an exceptionally complex comparison without changing
source/history. Existing broader advanced fidelity panels remain on explicit
command entry; their calculations are not used as guarantees in the primary UI.

Source commit: `9de3844`. Branch: `ux/direct-handoff-version-review`.
Tests, decisions and evidence are committed separately. No push or deployment.
Three pre-existing modified DOCX fixtures remain excluded. The compact result is
[direct-handoff-results.json](direct-handoff-results.json).
