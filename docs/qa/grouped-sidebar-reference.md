# Grouped sidebar and wordmark

Date: 2026-11-15. Base: main `965c8b9`. Local branch: `ux/grouped-sidebar-reference`.

## Brief and boundary

The owner selected Grouped sidebar, attached its image, and explicitly requested
that sidebar's exact look and the same typeface for mdtodocs.com. This authorizes
the scoped typography exception D009. The reference is the conversation's image.png.

Replaced the activity rail/drawer with a 248px cream sidebar: flat selected rows,
Lucide outline icons, small uppercase section headings, Documents/Diagrams groups
and subtle supporting links. The shared wordmark uses self-hosted Inter Variable,
600 for mdtodocs and 400 for the same-size .com. No square mark in the wordmark;
the existing favicon remains unchanged. Other UI and document fonts are unchanged.

Existing source editing, document identities, capacity/recovery, compiler, rendering,
exports, mobile shell and SEO URLs are preserved. Tool links route within the SPA,
retain native modified-click behavior and do not replace Markdown. Markdown editor
focuses the existing source editor; diagram links use the existing SVG/PNG utility
routes. No nonexistent editor landing pages were introduced. History and Close
remain accessible through overflow menus; global commands remain available.

Inter is scoped to the sidebar and wordmark. Fontsource OFL and Lucide license
notices are retained in public/licenses. The Inter font is served by the app,
without a new Google Fonts request. Only individual Lucide icons are imported.

## Evaluation

| Hypothesis | Baseline | Change | Actual check/result | Guardrails | Disposition |
| --- | --- | --- | --- | --- | --- |
| Approved grouping can match the reference without replacing the workspace | Activity rail, boxed rows and monospace wordmark on 965c8b9 | Scoped sidebar and shared wordmark | Live browser verified 248px sidebar, 13px Inter, 600/400 wordmark, no horizontal overflow; screenshot visually reviewed | Original source/preview kept; footer clears fixed status bar | Retain |
| Tool and document navigation preserves drafts | Existing store and route handlers | Pass existing route handler into sidebar; retain document actions | Live rename, Escape cancellation, switching, Word route and source-editor return retain text; source-editor return focuses input; history opens | No source rewrite or route replacement | Retain |
| New sidebar still uses existing safety gate | Existing five-slot gate | Duplicate from overflow menu | Five-document replacement chooser appears; Cancel retains all five; original text remains | No silent eviction | Retain |

## Executed checks

- `corepack pnpm -r build`: passed, including TypeScript and production Vite build.
- `TSX_TSCONFIG_PATH=apps/web/tsconfig.app.json node --import tsx scripts/prerender.ts`:
  passed for all eight existing routes.
- `corepack pnpm --filter web lint`: passed with existing diagram-component warnings.
- Static inspection of all eight generated HTML pages: one H1 and canonical retained,
  shared wordmark rendered, all seven existing footer tool destinations crawlable.
- Live managed Chrome preview: create, rename, rename cancellation, switching,
  overflow actions, history access, duplicate-at-capacity cancellation, collapse/
  restore, Word/source/Mermaid navigation and draft preservation checked.
- Light/dark sidebar checked. Dark chrome retained white document paper and
  unchanged source. Supporting-link bottom was 896px in a 936px-high viewport,
  above the existing fixed status bar.
- Same-origin iframe checks at 390px and 320px: existing mobile edit shell and
  source present, no horizontal overflow; shared wordmark retained Inter. This
  is responsive browser verification, not physical-device or mobile-keyboard testing.
- The temporary responsive harness was removed. Browser screenshot is a local QA
  artifact, not a production screenshot.

## Verification limits and environment

The project's automated browser command could not start its configured preview
server in this execution environment; no automated scenarios are claimed to have
run. New grouped-sidebar regressions and the explicitly authorized wordmark
expectations are committed for execution in the normal browser-test environment.
Live interaction checks above used the managed preview and available browser.

The root build script invokes a different pnpm shim in this environment, which
tries to reinstall dependencies and fails its no-TTY modules-removal check.
Running the same recursive build directly with the repository's pinned pnpm 9.15.9
passed. The tsx CLI's IPC listener was also unavailable; its supported Node import
loader ran the same prerender successfully. No sandbox/network settings changed.

No receiving-app export or production deployment was tested. The three inherited
DOCX fixture line-ending differences are excluded. Root AGENTS.md requires a push
request in the current prompt; changes remain local despite the older standing
push instruction in .agents/rules/git.md. No merge, push or deployment.
