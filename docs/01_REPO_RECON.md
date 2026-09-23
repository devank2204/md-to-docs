# Repository Reconnaissance

## Executive decision

Do not build commodity document infrastructure from scratch.

Use mature open-source primitives for parsing, DOCX generation, math,
diagrams, syntax highlighting and pagination. Build the differentiated
layer ourselves: Document IR, capability negotiation, destination
planning, layout intelligence, loss accounting, diagnostics and fidelity
testing.

## High-value candidates

  --------------------------------------------------------------------------------------
  Repository                       License           Decision          Reuse/study
                                                                       target
  -------------------------------- ----------------- ----------------- -----------------
  remarkjs/remark                  MIT               USE               Markdown
                                                                       AST/parser
                                                                       pipeline

  remarkjs/remark-gfm              MIT               USE               tables,
                                                                       footnotes, task
                                                                       lists, strike

  remarkjs/remark-math             MIT               USE               math parsing

  dolanmiu/docx                    MIT               USE               DOCX package
                                                                       generation

  pagedjs/pagedjs                  MIT               USE/STUDY         pagination and
                                                                       PDF

  KaTeX/KaTeX                      MIT               USE               math rendering

  mermaid-js/mermaid               MIT               USE/STUDY         diagrams

  wooorm/lowlight                  MIT               USE               code highlighting

  owenpkent/markcopy               MIT               STUDY/ADAPT       rich clipboard,
                                                                       Word/Docs
                                                                       behavior

  ztxtech/md2office                audit license     STUDY             Office clipboard
                                                                       patterns

  MohtashamMurshid/md-to-docx      MIT               STUDY/ADAPT       advanced DOCX
                                                                       edge cases

  markdown-kit/md-docx             MIT               STUDY/ADAPT       Markdown↔DOCX and
                                                                       style ideas

  benstein/md2gdoc                 audit license     STUDY             Drive
                                                                       Markdown→Docs
                                                                       path

  gcamilo/md2gdoc                  audit license     STUDY             direct Docs API
                                                                       rendering

  jgm/pandoc                       GPL-2-or-later    BENCHMARK/STUDY   semantic
                                                                       conversion oracle

  UnMarkdown/obsidian-unmarkdown   MIT               STUDY/SELECTIVE   real-world
                                                     REUSE             destination
                                                                       workflow
  --------------------------------------------------------------------------------------

## Critical findings

### Pandoc

Pandoc is an exceptional benchmark and semantic reference, but its core
project is GPL-2-or-later. Do not casually embed it into a proprietary
core. Use it as an oracle/baseline unless a deliberate licensing
architecture says otherwise.

### Rich clipboard

MarkCopy already supports rich Markdown copy into Word and Google Docs,
plus PDF/DOCX and special handling for tables, Mermaid and KaTeX.
Therefore rich clipboard is table stakes, not the moat.

### Google Docs

Google currently supports Markdown-aware paste, Markdown file import,
and Markdown editing/preview. The Docs API exposes native operations for
text, paragraph styles, lists, images, tables, page breaks and table
styling. We therefore need a Google destination profile, not a generic
HTML export.

### Security

Treat Markdown as untrusted input. Important surfaces include remote
images, SVG, HTML, Mermaid, filesystem paths, DOCX packages and PDF
rendering. Sandbox rendering, restrict remote fetching, sanitize active
content and bound resource use.

## Recon rule

For every copied file, record repository, commit/tag, file path,
license, copyright holder, dependency licenses and modifications. A
top-level MIT license does not prove that every embedded asset or
dependency is MIT.

## Sources

-   https://github.com/remarkjs/remark
-   https://github.com/remarkjs/remark-gfm
-   https://github.com/remarkjs/remark-math
-   https://github.com/dolanmiu/docx
-   https://github.com/pagedjs/pagedjs
-   https://github.com/KaTeX/KaTeX
-   https://github.com/mermaid-js/mermaid
-   https://github.com/wooorm/lowlight
-   https://github.com/owenpkent/markcopy
-   https://github.com/ztxtech/md2office
-   https://github.com/MohtashamMurshid/md-to-docx
-   https://github.com/markdown-kit/md-docx
-   https://github.com/benstein/md2gdoc
-   https://github.com/gcamilo/md2gdoc
-   https://github.com/jgm/pandoc
-   https://github.com/UnMarkdown/obsidian-unmarkdown
