# md.to.docs design contract

## Overview

The existing web identity is the authority. The user's latest correction rejects
the separate mobile-home redesign introduced in 809a445. Shared home components
restore the original web treatment while retaining mobile interaction improvements.
This file records settled constraints, not a new visual direction.

## Colors

Preserve existing cream tokens in apps/web/tailwind.config.js and incumbent
values in apps/web/src/index.css. Desktop surface/background: #faf9f6. Mobile
workspace ground: #fafaf7. Preserve white document paper and existing state colors.
Do not unify similar values, recolor an accent, or infer a new palette from a mock.
Dark app appearance is an optional Cream/Dark/System preference. Dark tokens
apply only to app chrome; they must never mutate the chosen document theme.

## Typography

**Do not change font families, fallback order, imports, weights, italics, sizes,
line height, or tracking unless the user explicitly requests that change.**
Typography includes brand/wordmark, home copy, controls, editor, and document view.
A suggestion from gstack, Impeccable, a font detector, or an agent is not approval.

Protected roles and implementation authorities:

| Role | Authority |
| --- | --- |
| Home title | HomeIntroduction.tsx: existing font-serif (Newsreader), text-3xl / sm:text-4xl / lg:text-5xl, leading-tight, tracking-tight, font-medium |
| Home description | Same component: existing font-serif, text-base / sm:text-lg, leading-relaxed, text-secondary |
| Brand | BrandWordmark.tsx: existing JetBrains Mono code-lg 14px/22px, semibold, tracking-tighter; existing smaller .com suffix |
| Source | Existing JetBrains Mono source roles; retain mobile 16px input behavior and desktop role sizes |
| Document preview | DocumentPreview.tsx and current document theme/typography; unchanged by the home correction |
| Other UI | Existing Söhne/system fallback and mapped code/label roles in Tailwind |
| Export | Existing compiler theme and renderer font choices; app appearance is not an export preference |

Use the existing responsive type scale. Do not create separate mobile title
copy, an italic accent, a fluid display scale, or an unrequested sans-serif home
description. The locked text treatment is not permission to load new fonts.
If accessibility needs conflict with a protected value, report the exact conflict
and options; do not silently change the contract or its test expectations.

## Layout

Adapt layout and interaction to the viewport, while preserving shared identity.
Mobile retains full-width Edit/Preview, native sheets, safe areas, and keyboard-aware
actions. Desktop retains source/preview and discoverable deeper tools. Existing
1024px compact boundary remains until measured evidence supports a scoped change.
A composition may change within authorized scope; that is not typography approval.

## Components

HomeIntroduction and BrandWordmark are shared authorities; do not fork them into
mobile-specific branded variants. Prefer existing WorkspaceSheet and native
controls before introducing another component library. Context actions must work
with keyboard and touch. App and print/document appearance have separate scopes.

## Do's and Don'ts

- Preserve approved identity while improving user outcomes and recovery.
- Verify rendered states and actual exported artifacts; keep evidence provenance.
- Do not use an old proposal image as font or palette authority.
- Do not call a draft plan approved because an agent review passed.
- Do not add decorative effects or a new library to signal ambition.
- Do not update identity regression expectations to hide an unauthorized change.
