import { describe, it, expect } from 'vitest';
import { parseMarkdown, planRepresentation, DiagnosticsCollector, THEMES } from '@mdtodocs/compiler-core';
import { renderToClipboardHtml, renderToDocxBlob } from '@mdtodocs/renderers';

describe('Math & Equation Rendering Pipeline', () => {
  it('parses inline and display math nodes from Markdown', () => {
    const md = `
# Math Specification

Energy equation is $E = mc^2$ in physics.

The Gaussian integral is:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`;

    const ast = parseMarkdown(md);
    const mathNodes: any[] = [];
    const inlineMathNodes: any[] = [];

    const traverse = (node: any) => {
      if (node.type === 'math') mathNodes.push(node);
      if (node.type === 'inlineMath') inlineMathNodes.push(node);
      if (node.children) node.children.forEach(traverse);
    };

    traverse(ast);

    expect(inlineMathNodes.length).toBe(1);
    expect(inlineMathNodes[0].value).toBe('E = mc^2');

    expect(mathNodes.length).toBe(1);
    expect(mathNodes[0].value).toContain('\\int_{-\\infty}^{\\infty}');
  });

  it('renders MathML and KaTeX HTML in clipboard HTML for Google Docs fidelity', () => {
    const md = `
Inline: $a^2 + b^2 = c^2$

Display:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`;

    const ast = parseMarkdown(md);
    const html = renderToClipboardHtml(ast, THEMES.default);

    // Verify MathML output for Google Docs native equation translation
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
    expect(html).toContain('display="block"');

    // Verify KaTeX HTML for web/visual preview fidelity
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-html"');

    // Verify display math wrapper structure and alignment
    expect(html).toContain('class="math-display"');
    expect(html).toContain('text-align:center');

    // Verify inline math wrapper structure
    expect(html).toContain('class="math-inline"');
  });

  it('tolerates invalid LaTeX gracefully without throwing unhandled exceptions', () => {
    const md = `
Broken inline: $\\frac{incomplete$

Broken block:

$$
\\left( unclosed
$$
`;

    const ast = parseMarkdown(md);
    expect(() => {
      const html = renderToClipboardHtml(ast, THEMES.default);
      expect(html.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('records math diagnostics during destination planning for Google Docs', () => {
    const md = `
Inline equation: $\\lambda = \\frac{h}{p}$
`;

    const ast = parseMarkdown(md);
    const collector = new DiagnosticsCollector();
    planRepresentation(ast, 'google-docs', collector);

    const diagnostics = collector.getAll();
    const mathDiag = diagnostics.find((d) => d.message.toLowerCase().includes('equation') || d.message.toLowerCase().includes('math'));
    expect(mathDiag).toBeDefined();
    expect(mathDiag?.severity).toBe('info');
  });

  it('exports math equations to Word (.docx) without errors', async () => {
    const md = `
# Physics Paper

Formula: $F = ma$

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
$$
`;

    const ast = parseMarkdown(md);
    const blob = await renderToDocxBlob(ast, THEMES.default);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(0);
  });
});
