import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToDocxBlob, DocumentRenderer } from '@mdtodocs/renderers';
import JSZip from 'jszip';

describe('Nested Text Formatting & Context State Regression Suite', () => {
  it('renders single bold text with <w:b/> in DOCX', async () => {
    const doc = parseMarkdown('This is **bold** text.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    expect(xml).toContain('<w:b/>');
    expect(xml).toContain('bold');
  });

  it('renders single italic text with <w:i/> in DOCX', async () => {
    const doc = parseMarkdown('This is *italic* text.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    expect(xml).toContain('<w:i/>');
    expect(xml).toContain('italic');
  });

  it('renders single strikethrough text with <w:strike/> in DOCX', async () => {
    const doc = parseMarkdown('This is ~~deleted~~ text.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    expect(xml).toContain('<w:strike/>');
    expect(xml).toContain('deleted');
  });

  it('renders nested bold and italic combinations correctly', async () => {
    const doc = parseMarkdown('Prefix **bold with *italic* inside** suffix.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    expect(xml).toContain('<w:b/>');
    expect(xml).toContain('<w:i/>');

    // Verify italic run also contains bold property
    const italicRunMatch = xml?.match(/<w:r>.*?<w:t[^>]*>italic<\/w:t><\/w:r>/s);
    expect(italicRunMatch).toBeDefined();
    expect(italicRunMatch![0]).toContain('<w:b/>');
    expect(italicRunMatch![0]).toContain('<w:i/>');
  });

  it('renders nested strikethrough with bold combination correctly', async () => {
    const doc = parseMarkdown('Here is ~~strike with **bold** inside~~.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    expect(xml).toContain('<w:strike/>');
    expect(xml).toContain('<w:b/>');

    const nestedRunMatch = xml?.match(/<w:r>.*?<w:t[^>]*>bold<\/w:t><\/w:r>/s);
    expect(nestedRunMatch).toBeDefined();
    expect(nestedRunMatch![0]).toContain('<w:strike/>');
    expect(nestedRunMatch![0]).toContain('<w:b/>');
  });

  it('renders combined triple formatting (bold, italic, strikethrough)', async () => {
    const doc = parseMarkdown('Complete: ~~***all three formatting styles***~~.');
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();
    const runMatch = xml?.match(/<w:r>.*?<w:t[^>]*>all three formatting styles<\/w:t><\/w:r>/s);
    expect(runMatch).toBeDefined();
    expect(runMatch![0]).toContain('<w:b/>');
    expect(runMatch![0]).toContain('<w:i/>');
    expect(runMatch![0]).toContain('<w:strike/>');
  });

  it('preserves context state propagation across child context clones in DocumentRenderer', () => {
    const registry = {
      nodes: {
        paragraph: (node: any, ctx: any) => {
          const childCtx = { ...ctx, state: { ...ctx.state, depth: (ctx.state.depth || 0) + 1 } };
          return childCtx.renderNodes(node.children);
        },
        text: (node: any, ctx: any) => {
          return `${node.value}:depth=${ctx.state.depth || 0}`;
        }
      }
    };

    const renderer = new DocumentRenderer<string>(registry);
    const testDoc: any = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'hello' }
          ]
        }
      ]
    };

    const output = renderer.render(testDoc, { depth: 0 });
    expect(output.flat()).toEqual(['hello:depth=1']);
  });
});
