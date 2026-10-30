# MDToDocs: Product Requirements Document and Antigravity Execution Playbook

**Version:** 1.0 | **Date:** 2026-10-23 | **Status:** Execution proposal
**Repository:** https://github.com/devank2204/md-to-docs
**Product:** https://mdtodocs.com (verify production configuration)

> Repository verification note: The public repository could not be fetched from this execution environment. Architecture references below are hypotheses from prior project discussions, not a fresh line-by-line audit. Iteration 0 must verify them before implementation.

## 1. Executive thesis

Build the most dependable output layer for AI-generated technical documents. Markdown is the input language and initial SEO entry point; the differentiated product is reliable transformation into polished, editable, portable deliverables.

**North-star job:** Paste an AI-generated specification, report, README, research note or technical design and produce a polished DOCX, PDF, or copy-ready rich-text document in under 30 seconds, without silently breaking tables, diagrams, lists, code or images.

**Product promise:** What you preview is what you can reliably export, with transparent warnings when destination limitations prevent exact fidelity.

**Competitive thesis:** Basic Markdown conversion is commoditized. Win through fidelity, transparent validation, speed, useful workflow presets, and distribution where AI-native developers already work.

## 2. Product constitution

1. No sign-in required for core conversion. Privacy-first, local processing where practical.
2. One document pipeline, many destination adapters. Do not duplicate parsing per landing page.
3. Fix core fidelity before expanding into unrelated tools.
4. Each SEO page must serve a distinct intent with working, appropriately preconfigured functionality and original explanatory content.
5. No fake scores, unsupported compatibility claims, fabricated benchmark results, or invented SEO volumes.
6. Never silently drop content. Surface unsupported constructs and offer deterministic fallback when possible.
7. Keep advanced features progressive and subtle. Default experience: paste, preview, export.
8. Accessible, responsive, keyboard-friendly. Prevent horizontal overflow.
9. No unnecessary account, onboarding, popups, or forced watermark.
10. Changes must include regression coverage, evidence of behavior, and rollback strategy.

### Explicit non-goals

General PDF utilities, QR codes, AI chatbot, full Notion-style workspace, unrelated format converters, forced cloud storage, full collaborative editing, paid SEO dependencies, speculative AI auto-rewrites of document meaning.

## 3. Users and jobs

| Persona | Trigger | Desired outcome | Priority |
|---|---|---|---|
| AI-assisted developer | Cursor/Claude Code/Kiro outputs MD PRD or design | Shareable Word/Google Docs/PDF without formatting loss | P0 |
| Technical lead | Architecture/design handover | Diagrams, tables, code and pagination preserved | P0 |
| Research/operations user | ChatGPT/Claude generates report | Polished deliverable quickly | P0 |
| Open-source maintainer | README needs external distribution | Readable branded PDF/Word | P1 |
| AI agent / automation | Generate docs programmatically | Predictable CLI/API output | P2 |

## 4. Success metrics

**Core:** benchmark fixture pass rate by destination; severe fidelity regressions; export success; time to first successful export; unsupported-feature warning precision.

**Product:** export completion rate, repeat sessions, share/copy usage, failed-export recovery. Prefer privacy-preserving aggregated analytics.

**SEO:** indexed canonical pages, non-branded impressions/clicks, query-to-page match, landing-page conversion, organic assisted exports. Segment by cluster and avoid treating impressions as success alone.

**Proposed release gates:** zero critical structural loss on curated fixtures; >=95% pass rate on defined supported-feature tests; no critical mobile overflow; p50 simple-document time-to-export <30s on representative devices. These are targets, not measured baselines.

## 5. Architecture requirements

Verify actual repo first. Preferred conceptual pipeline:

`Input Markdown -> Parse -> Typed document IR -> Normalize -> Asset resolver -> Destination capability planner -> HTML/DOCX/PDF/Clipboard adapters -> Validation -> Export`.

If the existing architecture differs, preserve functioning modules and evolve incrementally. The IR should represent headings, paragraphs, inline marks, nested lists, tables (including spans when supported), code, blockquotes, links, images, Mermaid, math, page breaks and warnings. Preserve source mapping when feasible.

**Destination contract:** every adapter declares supported features, fallback strategies, warning types and validation methods. Add explicit error types rather than silently flattening unsupported constructs.

**PDF:** investigate deterministic renderer options against size, licensing, browser compatibility, typography, pagination, operational cost, and security. Do not promise pixel parity until tested.

**DOCX:** validate OOXML structure and inspect actual rendering in Word/LibreOffice where possible. XML validity alone is insufficient.

**Clipboard:** test paste into Google Docs and Word in real browsers. Preserve both `text/html` and `text/plain` where supported; provide clear fallback.

**Security/privacy:** sanitize HTML and links, protect against remote-asset tracking and SSRF if server fetching exists, bound document sizes, avoid uploading content without explicit disclosure.

## 6. Roadmap and dependencies

### Phase A: Foundation (Days 1–7)
- I0 repository audit, baseline, architecture map, risk register.
- I1 regression harness: golden fixtures, output validation, browser tests, CI.
- I2 repair overflow, responsive layout, export blockers, accessibility.
- I3 destination capability registry, explicit warnings and error model.

### Phase B: Acquisition foundation (Days 8–14)
- I4 crawlable route architecture, canonical/meta/sitemap, Search Console instrumentation.
- I5 launch distinct high-intent conversion pages: Markdown to Word, PDF, Google Docs, HTML, Rich Text.
- I6 analytics and privacy-safe conversion funnel.

### Phase C: AI-native workflows (Days 15–21)
- I7 AI-output presets for PRD, engineering design, report and research notes; no destructive rewriting.
- I8 reliable PDF export and cross-destination visual verification.
- I9 Document Rescue MVP: deterministic preflight warnings and safe repair suggestions.

### Phase D: Developer distribution (Days 22–30)
- I10 Mermaid-to-SVG/PNG and Mermaid-in-document workflows.
- I11 README/GitHub Markdown import and export, with careful asset handling.
- I12 publish real benchmark comparison, methodology, sample files, screenshots and known limitations.
- I13 release audit: indexability, performance, conversion quality, distribution and backlog.

### Phase E: Conditional expansion (Days 31–90)
- I14 template gallery based on demonstrated demand.
- I15 CLI and MCP interface using same engine, with robust sandboxing and predictable output.
- I16 batch conversion / API only if real repeat usage warrants operational complexity.
- I17 monetization tests: optional premium presets, batch, API or teams. Never degrade free core.

**Scheduling note:** these are aggressive sequencing targets with parallel development, not promises. Block shipping on acceptance gates.

## 7. SEO requirements

### Priority clusters (validate with SERPs, Search Console and keyword tools before scaling)

**Core conversion:** `/markdown-to-word`, `/markdown-to-pdf`, `/markdown-to-google-docs`, `/markdown-to-html`, `/markdown-to-rich-text`.

**AI workflows:** `/chatgpt-to-word`, `/chatgpt-to-pdf`, `/claude-to-word`, `/ai-text-formatter`. Only launch pages with meaningful, unique workflow differences.

**Developer:** `/mermaid-to-svg`, `/mermaid-to-png`, `/mermaid-to-pdf`, `/readme-to-pdf`, `/github-markdown-to-pdf`.

**Problem-specific:** `/markdown-table-generator`, `/markdown-table-to-word`, `/markdown-preview`, `/markdown-to-docx-with-images`.

**Page contract:** unique H1, descriptive title, canonical, user-intent-specific default tool state, short original explanation, example input/output, honest limitations, FAQs only when useful, accessible navigation, meaningful internal links. Avoid near-duplicate doorway pages and unsubstantiated schema.

**Technical:** SSR or prerender landing content, robust route handling on Netlify, XML sitemap, robots, canonical redirects, metadata, Core Web Vitals, structured data only when eligible, Search Console, 404 handling, and noindex for internal/test routes.

**Research:** build keyword scoring with relevance, SERP difficulty, product reuse, conversion intent, and evidence confidence. Do not invent search volume. Prioritize five pages, measure, then expand.

**Original content moat:** publish reproducible cross-editor fidelity benchmarks, fixture files, expected behavior, screenshots, versions, caveats and honest failures. Benchmark competitor tools fairly and avoid misleading claims.

## 8. UX and behavior

- Main journey: paste/drop/import -> immediate preview -> destination -> export/copy.
- Remember theme, last destination and safe preferences locally without exposing document content unnecessarily.
- Advanced Mermaid/export controls stay secondary.
- Bookmark prompt only after genuine repeat engagement, dismissible and frequency-capped. Never interrupt first export.
- Show unsupported constructs before export; one-click safe fixes where deterministic.
- Loading, errors and empty states are explicit; avoid surprising auto-navigation.
- Test 320px, 375px, 768px, 1280px and 1440px viewports; large tables/code must scroll within their own containers.

## 9. Antigravity operating protocol

Before every iteration:
1. Read current repository, existing tests, package scripts, deployed routes and relevant docs.
2. State what exists and what is missing. Do not rebuild a working feature.
3. Write a short implementation plan and file impact list.
4. Implement the smallest coherent change with tests.
5. Run available checks; if blocked, report exact commands and reasons.
6. Provide evidence: changed files, tests, screenshots where applicable, known limitations and next dependency.
7. Do not claim success if untested. Do not commit secrets or break public URLs.

**Definition of done:** acceptance criteria demonstrably pass, CI green or documented blockers, no new severe regressions, mobile and desktop checked, no invented performance claims, and concise changelog.

---

# 10. Copy-paste Antigravity prompts

Run sequentially unless dependencies are explicitly independent. Each prompt assumes the operating protocol above.

## PROMPT 00: Repo reconnaissance and master plan

```text
You are the staff engineer and product architect for MDToDocs. Audit THIS repository, not assumptions from external PRDs. Inspect structure, package scripts, conversion engine, IR, HTML/DOCX/PDF/clipboard, Mermaid, tests, SEO routing, deployment and UX. Produce docs/EXECUTION_MAP.md with: implemented vs partial vs absent capabilities, evidence by file path, critical bugs, architectural leverage, license/security concerns, baseline commands, dependency graph, and a prioritized 30-day implementation plan. Run available tests and record exact results. Do not modify production code in this iteration. Never call a feature complete based solely on README claims.
```

## PROMPT 01: Fidelity regression system

```text
Using the repo audit, create a destination-aware fidelity test harness without rewriting the compiler. Add representative golden fixtures for nested lists, tables, code, links, images, Mermaid, Unicode, blockquotes, math, long lines, and unsupported constructs. Validate exported structure and capture warnings; add real-render visual checks where practical. Wire deterministic checks to CI. Document which tests prove structural validity vs visual fidelity. Pass when regressions fail CI and the baseline is reproducible.
```

## PROMPT 02: Overflow and responsive quality

```text
Audit the actual UI at 320/375/768/1280/1440px. Fix horizontal page overflow, oversized tables, code blocks, Mermaid diagrams, modals, sticky controls and export menus. Preserve existing design language; no redesign. Add browser viewport tests and screenshots. Ensure scroll containment, keyboard access, visible focus and no clipped export actions. Pass when representative long documents do not create page-level horizontal overflow.
```

## PROMPT 03: Destination capability contract

```text
Inspect current document IR and exporters. Introduce or strengthen a shared destination capability contract: supported features, fallbacks, warnings and validation. Do not silently drop unsupported content. Integrate pre-export warnings without cluttering the default UI. Keep existing export formats backward compatible. Add fixtures proving deterministic warning behavior. Document any migration and unsupported edge cases.
```

## PROMPT 04: Technical SEO foundation

```text
Audit current routing and Netlify deployment. Implement crawlable HTML for tool landing pages using the least disruptive SSR/prerender approach compatible with this repo. Add canonical URLs, unique title/meta/H1, sitemap, robots, Open Graph, redirects, correct status codes and Search Console readiness. Ensure app routes hydrate and work on direct navigation. Do not create thin duplicate pages. Verify generated HTML with JS disabled and test 404/canonical behavior.
```

## PROMPT 05: Five core conversion landing pages

```text
Build distinct, functional routes for markdown-to-word, markdown-to-pdf, markdown-to-google-docs, markdown-to-html and markdown-to-rich-text using ONE shared conversion engine. Each route preselects the right workflow and contains original examples, limitations and intent-specific guidance. Avoid duplicate tool logic and keyword-stuffed copy. Only expose formats that truly work; mark others as blocked with evidence. Test direct navigation, export success, metadata and responsive behavior.
```

## PROMPT 06: Privacy-first product analytics

```text
Add privacy-respecting events for landing-page view, editor interaction, destination selection, export attempt, export success/failure and repeat usage. Do not transmit pasted document content or raw filenames. Document event schema, consent requirements, retention and measurement limitations. Provide a simple dashboard specification and verify events without duplicates. Keep the app usable if analytics is blocked.
```

## PROMPT 07: AI-generated document presets

```text
Add a lightweight output-preset system for PRD, technical design, research report and client-ready report. A preset changes styling, layout and export defaults, never silently rewrites document meaning. Preserve source Markdown and provide preview parity. Use the existing IR/export pipeline. Keep default workflow one-step; presets are optional. Test headings, code, tables and Mermaid across presets. Provide before/after sample exports.
```

## PROMPT 08: Reliable PDF engineering

```text
Audit current PDF behavior and evaluate browser print vs client-side and server-side renderers, including license, bundle size, page breaks, fonts, images, Mermaid, performance and privacy. Implement the best feasible reliable PDF path incrementally; do not claim pixel parity without render comparisons. Test multi-page tables, code wrapping, headers, long URLs, Unicode and print margins. If full PDF parity is not feasible, ship a clearly labeled supported subset and a documented follow-up plan.
```

## PROMPT 09: Document Rescue MVP

```text
Build deterministic pre-export diagnostics on top of the destination capability planner. Detect likely overflow, unsupported constructs, missing image assets, risky table widths, diagram fallback and pagination problems where provable. Show concise, actionable warnings with safe repairs; never fabricate a confidence score. Keep diagnostics unobtrusive and optional. Add tests for each rule and false positives. Report which issues require visual verification rather than automatic fixing.
```

## PROMPT 10: Mermaid utility cluster

```text
Audit existing Mermaid rendering and export code. Reuse it to create functional Mermaid-to-SVG and Mermaid-to-PNG workflows and improve embedding into Word/PDF where feasible. Sanitize diagram input, manage rendering errors and preserve accessible alternatives. Add intent-specific SEO routes only after functionality passes tests. Keep advanced options collapsed. Verify image resolution, background, transparent export and diagram clipping.
```

## PROMPT 11: README and GitHub Markdown workflow

```text
Implement README-to-PDF/DOCX from pasted Markdown or an uploaded local README first. Consider GitHub URL import only after analyzing rate limits, CORS, asset resolution, security and caching. Support relative image paths through a safe, explicit resolver where possible. Never request GitHub credentials for basic usage. Add real repository README fixtures and document unsupported GitHub-flavored Markdown differences. Reuse the shared engine.
```

## PROMPT 12: Public fidelity benchmark

```text
Build a reproducible document fidelity benchmark using the fixture suite. Include Markdown inputs, target outputs, expected feature behavior, validation methodology, tool/version/date metadata, screenshots and honest failure reports. If comparing competitors, run equivalent tests under fair conditions and label any unavailable tests. Publish a useful benchmark page, not a promotional scorecard. No fabricated scores or unverifiable 'best' claims.
```

## PROMPT 13: Launch quality audit

```text
Perform a release audit: conversion reliability, accessibility, mobile overflow, performance, SEO indexability, metadata, canonical routing, privacy, security, analytics, broken links and deploy readiness. Produce a severity-ranked report with evidence and fix all P0/P1 issues before declaring ready. Give exact URLs, commands, screenshots, test counts and known limitations. Recommend the next three iterations based on actual measured bottlenecks, not feature novelty.
```

## PROMPT 14: Template library, conditional

```text
Only proceed if analytics/search demand supports templates. Build a small, high-quality template gallery (PRD, architecture decision record, engineering design, research report) using the existing preset and export system. Templates must be useful and distinct, with previewable sample content. Avoid hundreds of autogenerated thin pages. Measure template-to-export completion. Ship no more than four validated templates initially.
```

## PROMPT 15: CLI and MCP, conditional

```text
Only proceed once conversion engine has stable APIs and strong regression coverage. Extract a reusable headless conversion interface without breaking browser behavior. Prototype a CLI and MCP tool with explicit input/output schema, bounded resources, sandboxed asset handling, deterministic errors, and no hidden uploads. Add integration tests and developer documentation. Do not build a hosted API or billing yet.
```

## PROMPT 16: SEO iteration from evidence

```text
Use actual Search Console and analytics exports provided in the repository/workspace. Cluster queries by intent, calculate impressions, CTR, position and conversion outcomes, identify cannibalization and missing useful content. Prioritize five changes with evidence and expected mechanism. Do not fabricate keyword volume or infer rankings without data. Implement the highest-confidence technical/content improvements and record before/after metrics for future evaluation.
```

## PROMPT 17: Production hardening

```text
Audit supply-chain dependencies, security boundaries, conversion timeouts, large-file handling, error recovery, asset fetching, client memory use, privacy and deployment rollback. Remove obsolete scripts only after proving they are unused. Document supported limits and threat model. Add tests for malformed Markdown, hostile HTML, oversized diagrams and invalid remote assets. Preserve conversion correctness.
```

---

## 11. How to operate with Antigravity

1. Commit this PRD under `docs/PRD.md`.
2. Run **PROMPT 00** alone. Review its evidence and amend the PRD where repository reality differs.
3. Create one branch/worktree per independent workstream. Parallelize SEO, UX and fixtures only after interfaces are agreed.
4. Run prompts in order. Require a short summary with `Implemented / Tested / Not tested / Blockers / Next` after each.
5. Merge only with passing checks and visible evidence. Do not let an agent mark incomplete features as shipped.
6. Re-rank the backlog weekly using real user/export/Search Console data.

## 12. Decisions to revisit after first sprint

- Is browser-local conversion adequate for all supported formats, or is a limited server renderer justified?
- Does a Google Docs-specific workflow outperform generic rich-text copying?
- Which SEO cluster converts to actual exports, not just impressions?
- Does Document Rescue measurably reduce export failures?
- Do repeat users justify CLI/MCP and eventual monetization?

**Final strategic constraint:** Every new page must make a real workflow easier. Every new workflow must strengthen the shared document engine. Every release must improve fidelity, acquisition, or repeat utility with measurable evidence.
