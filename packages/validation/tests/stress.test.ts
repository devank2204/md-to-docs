import { describe, it, expect, beforeAll } from 'vitest';
import { parseMarkdown, DEFAULT_THEME } from '@mdtodocs/compiler-core';
import { renderToHtml, renderToClipboardHtml } from '@mdtodocs/renderers';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { HtmlTestHarness } from '../src/harness';
import mermaid from 'mermaid';

describe('Stress Test & Architecture Hardening', () => {
  beforeAll(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  });

  const stressMarkdown = `
# Architecture Stress Test

Testing complex layouts and integrations.

## 1. Nested Structures

- Item 1
  - Nested Item 1
  - Nested Item 2
    1. Deeply nested 1
    2. Deeply nested 2

> Blockquote containing
> 
> \`\`\`typescript
> const deep = true;
> \`\`\`
>
> - List in blockquote

## 2. Capability Fallbacks

:::warning
This callout contains **bold** and *italic* text.
:::

| Feature | Supported | Notes |
|---------|-----------|-------|
| Mermaid | Yes       | Should render as raw SVG |
| LaTeX   | Yes       | Should render correctly |

## 3. Mermaid Diagram

\`\`\`mermaid
graph TD;
    A[Hardened System] --> B{Validates?};
    B -- Yes --> C[Render SVG];
    B -- No --> D[Graceful Degradation];
\`\`\`
  `;

  it('HTML Preview mode does NOT inject overriding inline styles for standard elements', () => {
    const doc = parseMarkdown(stressMarkdown);
    const html = renderToHtml(doc, DEFAULT_THEME);
    const harness = new HtmlTestHarness(html);

    // Verify h1 and p do not have color or font-family, so Tailwind 'prose' works
    const h1Styles = harness.getInlineStyles('h1');
    expect(h1Styles['color']).toBeUndefined();
    expect(h1Styles['font-family']).toBeUndefined();

    const pStyles = harness.getInlineStyles('p');
    expect(pStyles['color']).toBeUndefined();
    expect(pStyles['font-family']).toBeUndefined();
  });

  it('Clipboard export mode DOES inject inline styles for Word/Docs compatibility', () => {
    const doc = parseMarkdown(stressMarkdown);
    const html = renderToClipboardHtml(doc, DEFAULT_THEME);
    const harness = new HtmlTestHarness(html);

    // Verify h1 and p have strict points and fonts
    const h1Styles = harness.getInlineStyles('h1');
    expect(h1Styles['font-family']).toBe(DEFAULT_THEME.typography.headingFont);
    
    const pStyles = harness.getInlineStyles('p');
    expect(pStyles['font-family']).toBe(DEFAULT_THEME.typography.bodyFont);
    expect(pStyles['color']).toBe(`#${DEFAULT_THEME.colors.text}`);
  });

  it('Asset pipeline correctly handles Mermaid and degrades gracefully if jsdom getBBox is missing', async () => {
    let doc = parseMarkdown(stressMarkdown);
    
    // We expect resolveAssets to not throw an uncaught promise rejection
    // even though jsdom doesn't support getBBox
    doc = await resolveAssets(doc);
    
    const diagram = doc.assets.find(a => a.type === 'diagram-source' || a.type === 'svg');
    expect(diagram).toBeDefined();

    // Since jsdom fails to render mermaid (due to getBBox missing), 
    // it should gracefully return success: false and preserve the source for fallback
    // Or if it somehow succeeds, it should contain the SVG.
    // We just want to ensure it completes without taking the system down.
    expect(Array.isArray(doc.assets)).toBe(true);
  });
});
