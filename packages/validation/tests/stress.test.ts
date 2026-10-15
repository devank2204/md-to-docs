import { describe, it, expect, beforeAll } from 'vitest';
import { parseMarkdown, DEFAULT_THEME } from '@mdtodocs/compiler-core';
import { renderToClipboardHtml } from '@mdtodocs/renderers';
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
    doc = await resolveAssets(doc);
    
    // Find the mermaid code node in the AST
    const mermaidNode = doc.children.find(
      (node: any) => node.type === 'code' && node.lang === 'mermaid'
    ) as any;

    expect(mermaidNode).toBeDefined();
    expect(mermaidNode.data).toBeDefined();
    expect(['success', 'error']).toContain(mermaidNode.data.renderStatus);

    if (mermaidNode.data.renderStatus === 'success') {
      expect(mermaidNode.data.resolvedAsset).toBeDefined();
      expect(mermaidNode.data.resolvedAsset.type).toBe('svg');
    } else {
      expect(mermaidNode.data.error).toBeDefined();
    }
  });
});
