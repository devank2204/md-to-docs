# Comparison dependencies

- CodeMirror merge 6.12.3, state 6.7.6, view 6.43.15, commands 6.11.1: MIT. Merge supplies diff, alignment, inline highlights, collapsing, navigation, bounded matching and precision flags. Other CodeMirror packages supply editing, virtualization, keyboard behavior and undo.
- jsondiffpatch 0.7.7: MIT. Structural comparison, array LCS and documented deltas. Move detection is disabled; no speculative objectHash. The React adapter walks deltas only. Reversible object-key escaping avoids loss of __proto__ properties in upstream delta construction.
- Existing jsdiff 8.0.2: BSD-3-Clause. Standard unified patch generation.

Retain upstream copyright/license notices with redistributed code and bundles. Package licenses cover transitive CodeMirror/Lezer dependencies as well. Full primary engine notices are retained here. No AGPL code was copied. No source was copied from ItsJust Diff Viewer; its controls and international-text scenarios were inspected as references. text-compare-lite README/interactions were reviewed only. Diff2Html was inspected and not installed. JSONBoss access failed (GitHub authentication required); no changes made there.

The precision fixture in model.test.ts adapts CodeMirror's MIT test/test-chunk.ts. Other fixtures were written for MDToDocs based on documented delta semantics, array guidance and security cases.
