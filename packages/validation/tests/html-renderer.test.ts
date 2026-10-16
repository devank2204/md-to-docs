import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToHtml } from '@mdtodocs/renderers';

describe('Standalone HTML Renderer Suite', () => {
  it('renders semantic HTML elements with heading IDs and typography', () => {
    const md = `
# System Architecture

This is a paragraph with **bold** and *italic* text.

- Item 1
- Item 2
`;
    const doc = parseMarkdown(md);
    const html = renderToHtml(doc);

    expect(html).toContain('<h1 id="system-architecture"');
    expect(html).toContain('System Architecture');
    expect(html).toContain('<p style=');
    expect(html).toContain('<strong style=');
    expect(html).toContain('<em style=');
    expect(html).toContain('<ul style=');
    expect(html).toContain('<li style=');
  });

  it('renders a full standalone HTML document when fullDocument option is set', () => {
    const md = '# Document Title\n\nContent body.';
    const doc = parseMarkdown(md);
    const html = renderToHtml(doc, { fullDocument: true, title: 'My Custom Document' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>My Custom Document</title>');
    expect(html).toContain('<style>');
    expect(html).toContain('<main>');
    expect(html).toContain('</main>');
    expect(html).toContain('</html>');
  });

  it('performs precise Mermaid SVG injection when resolved SVG asset is attached', () => {
    const md = '```mermaid\ngraph TD\nA-->B\n```';
    const doc = parseMarkdown(md);

    // Simulate resolved asset on code node
    const codeNode: any = doc.children.find((c: any) => c.type === 'code');
    expect(codeNode).toBeDefined();

    const sampleSvg = '<svg width="200" height="100" class="test-mermaid"><rect width="200" height="100" fill="teal"/></svg>';
    codeNode.data = {
      resolvedAsset: {
        id: 'asset-1',
        type: 'diagram',
        mimeType: 'image/svg+xml',
        data: sampleSvg,
      }
    };

    const html = renderToHtml(doc);
    expect(html).toContain('<div class="diagram-mermaid"');
    expect(html).toContain('<svg width="200" height="100" class="test-mermaid">');
    expect(html).toContain('<rect width="200" height="100" fill="teal"/>');
  });

  it('renders tables with thead, tbody, and column alignments', () => {
    const md = `
| Service | Status | Port |
| :--- | :---: | ---: |
| Auth | Active | 8080 |
| Cache | Ready | 6379 |
`;
    const doc = parseMarkdown(md);
    const html = renderToHtml(doc);

    expect(html).toContain('<table style=');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('text-align:left;');
    expect(html).toContain('text-align:center;');
    expect(html).toContain('text-align:right;');
  });

  it('renders task lists with ballot box characters', () => {
    const md = `
- [x] Finished item
- [ ] Todo item
`;
    const doc = parseMarkdown(md);
    const html = renderToHtml(doc);

    expect(html).toContain('☑ ');
    expect(html).toContain('Finished item');
    expect(html).toContain('☐ ');
    expect(html).toContain('Todo item');
    expect(html).toContain('list-style-type:none;');
  });

  it('renders display and inline math with KaTeX', () => {
    const md = `
Inline $E = mc^2$ and block:

$$
\\int_0^1 x dx
$$
`;
    const doc = parseMarkdown(md);
    const html = renderToHtml(doc);

    expect(html).toContain('math-inline');
    expect(html).toContain('math-display');
    expect(html).toContain('<math');
  });
});
