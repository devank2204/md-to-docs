# Iteration 01 — SEO foundation

Local implementation, 2026-11-08. No push or deployment.

## Findings and correction

Confirmed in source and the baseline Chromium captures:

- Prerender built a separate, inline-styled marketing page. `createRoot` replaced it.
  Word and Google Docs lost their route heading; all converter routes rendered
  “Markdown to Docs”. Mermaid rendered no H1.
- Markdown's first heading replaced the browser title. Route navigation did not
  consistently update descriptions, canonical, social metadata or JSON-LD.
- Canonicals lacked trailing slashes. Live requests to Word and Google Docs
  resolved to trailing-slash HTTP 200 URLs. A live invalid path returned 200.
- Netlify's wildcard served the home application for unknown paths.
- Existing copy asserted fidelity guarantees, destination-app verification,
  automatic print DPI and blanket offline behavior without adequate evidence.

No earlier diagnosis was dismissed as obsolete. The implementation did not find
reason to replace Vite, add Pandoc, change fonts or add a conversion dependency.

## Architecture and important files

- `routes/landingData.ts`: eight authoritative route identities, unique titles,
  descriptions and final canonicals; retained working samples and destinations.
- `routes/LandingContext.ts`, `HomeIntroduction.tsx`: shared route introduction
  with the incumbent home copy and every protected typography class retained.
- `LandingPageContent.tsx`: restrained instructions, native disclosures with
  answers present in HTML, honest limitations/privacy guidance and actual links.
  Table column limits come from the existing capability profiles. No second
  support-status matrix or claims of physical receiving-app validation.
- `landingStatic.tsx`, `scripts/prerender.ts`: render the same React introduction,
  empty-state input and supporting content used by the client. Removed the
  unrelated inline-styled prerender presentation. The full stateful app still
  deliberately mounts with createRoot; it does not hydrate a mismatched tree.
  Primary content is generated from shared components on both sides and tested
  before/after initialization. Restored documents and mobile state are client
  concerns; this is not full-app SSR.
- `routes/metadata.ts`, `App.tsx`: shared JSON-LD and stable route metadata on
  navigation; user document titles remain in the document store. Explicit route
  navigation selects the route destination. On direct load with nonempty saved
  content, the saved destination/HTML preference wins. Typing never resets it.
- `MobileWorkspace.tsx`: retains non-home route introduction inside the existing
  edit panel, below document controls, while preserving the home workflow.
- `MermaidUtilityView.tsx`: shared H1 introduction and wrapping template controls
  after the new 375px test exposed horizontal overflow.
- `netlify.toml`: unknown paths use 404.html with 404 status. Generated supported
  files retain Pretty URL behavior. 404.html has no application bootstrap and
  has noindex, so JavaScript cannot turn it into a homepage.
- Sitemap derives from the route registry, with trailing slashes and no invented
  lastmod or daily frequency. Robots points to the production sitemap.

## Before/after evidence

| Route | Initial H1 before | Rendered H1 before | Initial and rendered H1 after |
| --- | --- | --- | --- |
| / | Markdown to Docs | Markdown to Docs | Markdown to Docs |
| /markdown-to-word/ | Convert Markdown to Microsoft Word (.docx) | Markdown to Docs | Convert Markdown to Microsoft Word (.docx) |
| /markdown-to-google-docs/ | Paste Markdown into Google Docs | Markdown to Docs | Paste Markdown into Google Docs |

Original Word title: `Convert Markdown to Word (.docx) | Tables, Math & Diagrams | mdtodocs`.
New: `Markdown to Word Converter (DOCX) Online | MDToDocs`.
Original Docs title: `Paste Markdown into Google Docs | MathML & Native Tables | mdtodocs`.
New: `Markdown to Google Docs Converter | MDToDocs`.
Canonical suffix changed from `/markdown-to-word` to `/markdown-to-word/`, and
likewise for all seven non-home routes. Home remains `/`.

Baseline and updated captures at 375, 768 and 1440px, workspace captures, logs and
machine-readable HTML comparison are retained in
`/workspace/seo-iteration-01-evidence/`. Baseline HTML is retained separately at
`/tmp/md-baseline-dist/dist/`. Screenshots show the same home heading, terminal,
wordmark, cream palette and fonts; new support content starts below the tool.
Route introductions intentionally change copy using the existing type treatment.
Mermaid gains an introduction. No new colors, font imports or component library.

## Verification

Production TypeScript check, Vite build and actual prerender passed. Direct local
binaries were used because this environment's pnpm 11 launcher attempted to
self-manage the repository's pinned pnpm 9 and hit a sandbox SQLite-store error.
Locked dependencies installed; no lockfile or package version was changed.

- Validation: 167 tests across 29 files passed; final targeted static/route
  contracts: 15 tests across 3 files passed.
- Fidelity lab: all 20 fixtures passed; no receiving-app validation implied.
- Chromium full suite: 76/77 passed initially; the only failure was the Mermaid
  375px overflow. After correction, SEO + Mermaid tests: 26/26 passed.
- Final mobile/SEO rerun: 37/37 passed, covering the last mobile introduction
  placement and JavaScript-disabled descriptions/links.
- Existing checks exercise paste, imports, preview, actual DOCX/HTML artifacts,
  formatted-copy preparation, print preparation, SVG/PNG data, image clipboard,
  history, persistence, keyboard behavior, mobile sheets and synchronized scroll.
- Lint completed with existing diagram/canvas React warnings. No typography
  identity expectations were relaxed. No new hydration mechanism was introduced.

The first build attempt exposed a TypeScript assertion error in an intermediate
route transformation; it was corrected by using a directly typed registry.
Superseded browser runs against stale output are not counted as final evidence.

## Functional research and limits

Live reference requests to md-to-word.com and mdconvert.app returned 403 in this
environment, so their current behavior was not independently verified. The
unmarkdown Google Docs page and Google Docs' native Markdown help were reachable.
No competitor styling or speculative higher-quality conversion mode was copied.
Google Docs native Markdown is acknowledged, not denied.

No real Microsoft Word/Google Docs paste, physical phone, Safari or saved PDF
verification was performed. Chromium fixture success establishes browser/artifact
behavior only. Netlify's production 404 status must be verified after an authorized
deployment; Vite preview does not execute Netlify rules. Initial static markup
uses the desktop empty-state scaffold; client initialization adapts to mobile and
restored local content. This remains a layout-shift/performance limitation.

## Iteration 02 handoff (not implemented)

Main JS: 3,817.63 → 3,793.73 kB minified; gzip 1,373.26 → 1,366.45 kB.
CSS: 127.30 → approximately 126.55 kB. Heavy compiler/diagram code remains.
One local, unthrottled 375px sample of each prerendered build over a four-second
window recorded 11 initial requests in both; LCP 1,372 → 964 ms and CLS
0.00144 → 0.05948. These are single local diagnostic samples under concurrent
workload, not Lighthouse, field data, or evidence against the historical 8.1s
production LCP. The earlier baseline sample used an unprerendered scaffold and
is superseded by these measurements. Prioritize initial mobile scaffold stability
and heavy bundle loading in the dedicated performance iteration.

## Git notes

Branch: `seo/iteration-01-foundation`. Source checkpoint: `16b28ae`; final
mobile/tests/report checkpoint follows it. Three tracked fixture DOCX files
were already marked modified after checkout/dependency setup, before source
changes (line-ending normalization). They were excluded from all commits and
left untouched. No push, merge or deployment was performed.
