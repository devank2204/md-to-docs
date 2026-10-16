import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToDocxBlob, renderToClipboardHtml, renderToHtml } from '@mdtodocs/renderers';
import JSZip from 'jszip';

describe('GFM Footnotes & Callout Styling Fidelity Suite', () => {
  const footnoteMarkdown = `
Here is a statement with a footnote[^alpha] and another one[^beta].

[^alpha]: This is the first footnote definition with **bold** text.
[^beta]: Second footnote with [a link](https://example.com).
`;

  it('renders GFM footnotes in DOCX with superscript references and indented definitions', async () => {
    const doc = parseMarkdown(footnoteMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();

    // Verify superscript runs in XML
    expect(xml).toContain('<w:vertAlign w:val="superscript"/>');
    expect(xml).toContain('[alpha]');
    expect(xml).toContain('[beta]');
    expect(xml).toContain('first footnote definition');
    expect(xml).toContain('Second footnote');
  });

  it('renders GFM footnotes in Clipboard HTML with anchor links and definitions', () => {
    const doc = parseMarkdown(footnoteMarkdown);
    const html = renderToClipboardHtml(doc);

    expect(html).toContain('<sup><a href="#fn-alpha" id="fnref-alpha"');
    expect(html).toContain('>[alpha]</a></sup>');
    expect(html).toContain('<div class="footnote-definition" id="fn-alpha"');
    expect(html).toContain('first footnote definition');
    expect(html).toContain('<div class="footnote-definition" id="fn-beta"');
  });

  it('renders GFM footnotes in Standalone HTML', () => {
    const doc = parseMarkdown(footnoteMarkdown);
    const html = renderToHtml(doc);

    expect(html).toContain('<sup><a href="#fn-alpha" id="fnref-alpha"');
    expect(html).toContain('<div class="footnote-definition" id="fn-alpha"');
    expect(html).toContain('first footnote definition');
  });

  const calloutsMarkdown = `
:::note
This is a standard note callout.
:::

:::tip
Helpful tip for users.
:::

:::warning
Security or operational warning.
:::

:::caution
Critical caution block.
:::

:::important
Important priority note.
:::
`;

  it('renders callout containers in DOCX with icons, shading, cantSplit, and borders', async () => {
    const doc = parseMarkdown(calloutsMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();

    // Callout table rows prevent split
    expect(xml).toContain('<w:cantSplit/>');

    // Callout text labels and icons
    expect(xml).toContain('NOTE');
    expect(xml).toContain('TIP');
    expect(xml).toContain('WARNING');
    expect(xml).toContain('CAUTION');
    expect(xml).toContain('IMPORTANT');
    expect(xml).toContain('📝');
    expect(xml).toContain('💡');
    expect(xml).toContain('⚠️');
    expect(xml).toContain('🛑');
    expect(xml).toContain('❗');
  });

  it('renders callout containers in Clipboard HTML and Standalone HTML with icons and borders', () => {
    const doc = parseMarkdown(calloutsMarkdown);
    const clipHtml = renderToClipboardHtml(doc);
    const standHtml = renderToHtml(doc);

    expect(clipHtml).toContain('📝 Note');
    expect(clipHtml).toContain('💡 Tip');
    expect(clipHtml).toContain('⚠️ Warning');
    expect(clipHtml).toContain('🛑 Caution');
    expect(clipHtml).toContain('❗ Important');

    expect(standHtml).toContain('callout-note');
    expect(standHtml).toContain('callout-tip');
    expect(standHtml).toContain('callout-warning');
  });
});
