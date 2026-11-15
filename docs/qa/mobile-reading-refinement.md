# Mobile reading and support refinement · 2026-11-15

The owner explicitly authorized smaller mobile title typography, Tools instead of
ellipsis, a separate appearance control, mobile reading without heading disclosure,
minimal padding, shimmer loading and repaired support-form typography/focus.

- Mobile header: appearance outside Tools; Tools opens existing native disclosure.
  Export retains its accessible name with a compact icon on narrow screens to
  preserve title space. Title is 14px at rest, 16px while editing to avoid iOS zoom.
- Mobile preview explicitly skips the heading-grouping plugin. Desktop keeps the
  original collapsible heading structure. Mobile removes wrapper padding and uses
  12px paper padding without the nested left gutter. Tables retain their overflow.
- CSS-only LoadingSkeleton covers shared lazy tools, workspace/diagram-route
  fallbacks, preview engine loading, diagram rendering and repair validation.
  Compilation indicators and busy buttons share the shimmer. Background-only
  lazy compilation still has no distracting placeholder. Editors and errors stay
  interactive/real; there is no fake progress percentage. Reduced motion is still.
- There was no form library to remove. Support fields are native input/textarea;
  explicit scoped body typography and a complete inset focus outline fix the
  inconsistent appearance. No new dependency/font/CDN is installed. Removed the
  requested unavailable-submission sentence; Copy feedback remains an honest draft
  action, with no server request or false success. No database connected.

## Official-source research (read 2026-11-15)

CSS background-position supports a local shimmer without an animation package:
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-position

Privacy and About should become dedicated static/prerendered `/privacy/` and
`/about/` pages with visible links, self-canonicals and useful supplied copy.
Keep Feedback a modal. These supporting pages improve access/crawlability, not a
promised ranking boost. The owner will supply copy; no speculative legal policy
or new indexable page was published in this change. Shared primary content can
serve both the future pages and contextual dialogs. Reference:
https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

Recommended feedback service: **Netlify Forms**, because hosting is already
Netlify and it stores submissions in a reviewable dashboard. Optional email,
required feedback, a honeypot and static build-time form detection plus AJAX submit
are enough. It does not require the repository to be public. Check the actual
account plan: current Free pricing lists a shared 300-credit monthly limit across
site usage; legacy plans may differ. It is not unlimited free storage/submissions,
and exhausting shared limits can pause the site. Sources:
https://docs.netlify.com/manage/forms/setup/
https://www.netlify.com/pricing/

If an owned SQL database/API is wanted instead, **Cloudflare Worker + D1** has a
free D1 allowance documented as 5GB total, 5 million rows read/day and 100,000 rows
written/day. Worker limits also apply. Requires an endpoint, validation, spam/rate
protection and an owner-only reading interface; more implementation than Forms.
https://developers.cloudflare.com/d1/platform/pricing/

**Supabase Free** offers a 500MB database and dashboard. It pauses free projects
after one week of inactivity, which is a material drawback for low-volume feedback.
A public form still needs protected writes, validation and spam controls; never
ship a service-role credential in the browser.
https://supabase.com/pricing

## Verification and limits

Production TypeScript/Vite build, eight-route prerender and focused Chromium tests
verify narrow headers, title save/focus behavior, mobile reading, retained desktop
disclosure, delayed preview skeleton with reduced motion, form typography and four
focus edges. Existing approved-UX, quiet-workspace and SEO checks are included.
See WORKSTATE for final counts. Screenshots reviewed at 375px and desktop feedback;
320/390/768 are covered too. No physical Safari or destination-app check performed.
No new LCP/CLS or transferred-byte claim; no new package was added. Existing
compiler/fidelity behavior is unchanged. Three unrelated DOCX fixtures excluded.

An additional receiving-action regression exposed a pre-existing cold-load race
from the newly visible toolbar: a review click could precede the deferred repair
listener. A tiny shared one-request handoff retains the explicit click until the
tool mounts. It handles pure Azure containers as well as fenced Mermaid, uses the
current document/revision guards, and adds no engine to the initial bundle. The
redundant lower review link is removed. Delayed-chunk first-click coverage and
actual Azure/syntax repair + original-source undo now pass.

Final commands/results: production `tsc -b` + `vite build`; shared prerender
processed eight routes; `oxlint` succeeds with existing warnings. Material glyph
check succeeds (79 referenced glyphs). Chromium: initial 45-test run passed; final
expanded run passed 49/50, with the new cold-repair test expecting a multi-diagram
button label for a single diagram. Corrected to the actual single-diagram action
and verified applying the fix. `playwright test tests/browser/mobile-refinement.spec.ts`
then passes 8/8. `playwright test tests/browser/mermaid.spec.ts --grep 'Azure and syntax'`
passes 1/1, including both repairs and undo. Final expanded run includes all four
identity checks. Full legacy suite not run. Logs and screenshots are archived in
`/workspace/mobile-refinement-evidence.zip`.
