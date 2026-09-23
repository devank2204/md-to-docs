# Competitor + Fidelity Matrix

## Competitive reality

The real enemy is the user's current broken workflow, not a single
competitor.

Current relevant baselines include MD2Doc, MarkCopy, Pandoc,
Google-native Markdown behavior and UnMarkdown.

### MD2Doc

Its current product surface includes Markdown→Word, Google Docs, PDF and
HTML, plus an MCP server for agent workflows. It explicitly targets
AI-generated Markdown and offers no-signup conversion.

Source: https://md2doc.com/

### MarkCopy

Its current repository describes rich clipboard into Word/Google
Docs/Gmail/Outlook, per-element copying, tables, code, Mermaid, KaTeX,
PDF and DOCX.

Source: https://github.com/owenpkent/markcopy

### Google Docs

Google currently supports Markdown-aware paste, Markdown file import and
Markdown editing/preview.

Sources: - https://support.google.com/docs/answer/12014036 -
https://support.google.com/docs/answer/18289341

### Pandoc

Use as a broad conversion benchmark and semantic oracle.

Source: https://github.com/jgm/pandoc

## Internal fidelity dimensions

  Dimension               Weight
  --------------------- --------
  Semantic fidelity          35%
  Structural fidelity        25%
  Visual fidelity            20%
  Behavioral fidelity        10%
  Degradation quality        10%

Primary operational KPI:

> Manual Cleanup Minutes

Target for supported documents: 0.

## Fidelity kill list

### Tables

-   wide tables overflow
-   unreadable columns
-   header does not repeat
-   cells split badly
-   long URLs destroy width
-   table becomes image when it should remain editable

### Headings

-   H4/H5/H6 collapse
-   hierarchy changes
-   orphaned headings
-   TOC mismatch

### Lists

-   nested lists flatten
-   numbering restarts
-   task-list semantics disappear

### Code

-   long lines wrap badly
-   indentation changes
-   highlighting disappears
-   code splits poorly across pages

### Images

-   remote images fail
-   dimensions disappear
-   aspect ratio changes
-   alt/caption disappears

### Math

-   formulas become plain text
-   display math clips
-   Word-native math is lost unnecessarily

### Diagrams

-   wrong dimensions
-   blurry rasterization
-   overflow
-   provenance/alt text disappears

### Pagination

-   blank pages
-   orphaned headings
-   bad widow/orphan behavior
-   tables cut incorrectly
-   captions detach from figures

### Google Docs

-   clipboard and direct import differ
-   tables become text
-   native headings are lost
-   links/images degrade

## 100-fixture corpus

001--020 core semantics\
021--035 tables\
036--043 code\
044--050 images\
051--065 professional docs\
066--080 AI-generated documents\
081--095 pagination torture\
096--100 monster documents

Every fixture stores source Markdown, manifest, expected IR and
destination artifacts.

## Competitive objective

Do not chase "more features".

The target is four user-visible deltas:

1.  fidelity,
2.  destination intelligence,
3.  zero-cleanup workflow,
4.  simple UX.

The product should not expose the compiler. It should make the user
think:

> I pasted this, chose where it should go, and it just worked.
