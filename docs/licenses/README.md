# Comparison dependencies

- CodeMirror merge 6.12.3, state 6.7.6, view 6.43.15, commands 6.11.1: MIT. Merge supplies diff, alignment, inline highlights, collapsing, navigation, bounded matching and precision flags. Other CodeMirror packages supply editing, virtualization, keyboard behavior and undo.
- jsondiffpatch 0.7.7: MIT. Structural comparison, array LCS and documented deltas. Move detection is disabled; no speculative objectHash. The React adapter walks deltas only. Reversible object-key escaping avoids loss of __proto__ properties in upstream delta construction.
- Existing jsdiff 8.0.2: BSD-3-Clause. Standard unified patch generation.

Retain upstream copyright/license notices with redistributed code and bundles. Package licenses cover transitive CodeMirror/Lezer dependencies as well. Full primary engine notices are retained here. No AGPL code was copied. No source was copied from ItsJust Diff Viewer; its controls and international-text scenarios were inspected as references. text-compare-lite README/interactions were reviewed only. Diff2Html was inspected and not installed. JSONBoss access failed (GitHub authentication required); no changes made there.

The precision fixture in model.test.ts adapts CodeMirror's MIT test/test-chunk.ts. Other fixtures were written for MDToDocs based on documented delta semantics, array guidance and security cases.

Workspace revision: @codemirror/lang-json 6.0.2 and @codemirror/language 6.13.1
provide the JSON input editor's parser and standard syntax highlighting. Both
use the MIT notice retained in codemirror-json-MIT.txt. jsondiffpatch remains the
sole structural comparison engine; the editor does not calculate JSON differences.

Research-led experience revision: @codemirror/theme-one-dark 6.1.3 supplies only
its exported syntax highlighting style for dark JSON editing. It does not supply
MDToDocs chrome, fonts, layout or diff algorithms. Its MIT notice is retained in
codemirror-one-dark-MIT.txt. Color selection uses CodeMirror compartments and the
existing appearance preference; payloads are never stored with that preference.

In-context JSON revision also uses the existing jsondiffpatch BaseFormatter's pure
array delta-key enumeration method to retain upstream old/new index semantics.
No formatter HTML is rendered. The existing CodeMirror JSON language parser
supplies source token ranges; CodeMirror decorations/gutters display those ranges.
There are no additional dependencies or copied comparison algorithms.

Focus/search/filter revision: @codemirror/search 6.7.2 (MIT) supplies full-document
Find/Replace, search query handling, match highlighting and keyboard commands.
Its notice is retained in codemirror-search-MIT.txt. It is imported only by the
lazy comparison editors. JSON context collapsing uses the already-installed
@codemirror/language folding APIs; Text Compare uses @codemirror/merge's existing
collapse functionality and public reveal effect. No search or diff algorithm was
copied/reimplemented. Exact-path/type filtering is presentation over library deltas.

cURL Compare: curlconverter 4.12.0 (MIT) supplies Bash tokenization, cURL option
parsing and request construction; its browser path uses web-tree-sitter 0.24.7
(MIT) and the upstream bundled Bash grammar WASM (MIT, Max Brunsfeld). Notices
are retained alongside this file. Native tree-sitter build scripts are disabled;
they are not used or bundled in the browser. Only the parser/request modules are
imported, not language generators or the upstream website. Eight upstream MIT
command fixtures are retained under tests/fixtures/curlconverter.

lossless-json 4.3.3 (MIT; already a curlconverter dependency) checks JSON body
number precision. Bodies with unsafe numeric values fall back to literal text
with an explicit partial-comparison explanation. Its notice is retained here.
Existing jsondiffpatch, CodeMirror and jsdiff licenses continue to apply.
