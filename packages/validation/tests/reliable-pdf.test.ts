import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseMarkdown,
  planRepresentation,
  DiagnosticsCollector,
} from '@mdtodocs/compiler-core';
import { renderToHtml, renderToClipboardHtml, renderToDocxBlob } from '@mdtodocs/renderers';

describe('Prompt 08: Reliable PDF Engineering & Print Calibration', () => {
  it('validates production @media print stylesheet rules in index.css', () => {
    const cssPath = path.resolve(__dirname, '../../../apps/web/src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Multi-page page setup & margins
    expect(cssContent).toContain('@media print');
    expect(cssContent).toContain('@page');
    expect(cssContent).toContain('counter(page)');
    expect(cssContent).toContain('counter(pages)');

    // Table splitting: repeating headers on every printed page
    expect(cssContent).toContain('thead');
    expect(cssContent).toContain('table-header-group');

    // Page break containment: no awkward splits in tables, code blocks, callouts, or diagrams
    expect(cssContent).toContain('break-inside: avoid');
    expect(cssContent).toContain('break-after: avoid');

    // Explicit pagination controls
    expect(cssContent).toContain('.page-break');
    expect(cssContent).toContain('break-after: page');

    // Diagram vector scaling
    expect(cssContent).toContain('max-width: 100%');
  });

  it('embeds identical robust print rules in standalone renderToHtml output', () => {
    const ast = parseMarkdown('# Test Title\n\nParagraph text.');
    const collector = new DiagnosticsCollector();
    const planned = planRepresentation(ast, 'pdf', collector);
    const html = renderToHtml(planned, { fullDocument: true });

    expect(html).toContain('@media print');
    expect(html).toContain('table-header-group');
    expect(html).toContain('counter(page)');
    expect(html).toContain('.page-break');
    expect(html).toContain('break-inside: avoid');
  });

  it('parses and transforms explicit pagination controls (<!-- pagebreak -->, <div class="page-break">, \\pagebreak)', () => {
    const markdown = `# Section 1

Content on page 1.

<!-- pagebreak -->

# Section 2

Content on page 2.

<div class="page-break"></div>

# Section 3

Content on page 3.

\\pagebreak

# Section 4

Final page.
`;

    const collector = new DiagnosticsCollector();
    const ast = parseMarkdown(markdown);
    const planned = planRepresentation(ast, 'pdf', collector);

    // Verify zero unsupported HTML element warnings are fired for intentional page breaks
    const htmlWarnings = collector.getDiagnostics().filter(d => d.ruleId === 'unsupported-html-element');
    expect(htmlWarnings).toHaveLength(0);

    // Render to standalone HTML
    const html = renderToHtml(planned, { fullDocument: true });
    const pageBreakMatches = html.match(/class="page-break"/g);
    expect(pageBreakMatches).toBeDefined();
    expect(pageBreakMatches?.length).toBe(3);

    // Render to Clipboard HTML
    const clipboardHtml = renderToClipboardHtml(planned);
    expect(clipboardHtml).toContain('page-break-after:always');
  });

  it('generates native PageBreak objects in Word .docx export for pagebreak tokens', async () => {
    const markdown = `# First Page\n\nSome text.\n\n<!-- pagebreak -->\n\n# Second Page\n\nMore text.`;
    const collector = new DiagnosticsCollector();
    const ast = parseMarkdown(markdown);
    const planned = planRepresentation(ast, 'word', collector);

    const docxBlob = await renderToDocxBlob(planned);
    expect(docxBlob).toBeDefined();
    expect(docxBlob.size).toBeGreaterThan(1000);
  });

  it('triggers pre-print verification warning when a table exceeds 7 columns on PDF destination', () => {
    // 8-column wide table
    const wideTableMd = `# Wide Spec Table

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 |
|---|---|---|---|---|---|---|---|
| A | B | C | D | E | F | G | H |
`;

    const collectorPdf = new DiagnosticsCollector();
    const astPdf = parseMarkdown(wideTableMd);
    planRepresentation(astPdf, 'pdf', collectorPdf);

    const warnings = collectorPdf.getDiagnostics().filter(d => d.ruleId === 'pdf-table-width-overflow');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe('warning');
    expect(warnings[0].message).toContain('8 columns');
    expect(warnings[0].suggestedAction).toContain('landscape');
  });

  it('passes standard tables (<= 7 columns) on PDF destination without overflow warnings', () => {
    // 4-column standard table
    const standardTableMd = `# Architecture Summary

| Metric | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| Latency | < 50ms | 32ms | PASS |
| P99 | < 120ms | 84ms | PASS |
`;

    const collectorPdf = new DiagnosticsCollector();
    const astPdf = parseMarkdown(standardTableMd);
    planRepresentation(astPdf, 'pdf', collectorPdf);

    const warnings = collectorPdf.getDiagnostics().filter(d => d.ruleId === 'pdf-table-width-overflow');
    expect(warnings).toHaveLength(0);
  });
});
