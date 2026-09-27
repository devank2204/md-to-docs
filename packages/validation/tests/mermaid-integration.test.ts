import { test, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { renderToClipboardHtml } from '@mdtodocs/renderers/src/clipboard';
import { renderToDocxBlob } from '@mdtodocs/renderers/src/docx';
import { THEMES } from '@mdtodocs/compiler-core';

test('mermaid integration renders properly to html and docx', async () => {
  const md = `
# Hello
Here is a flowchart:
\`\`\`mermaid
graph TD
    A-->B;
\`\`\`
  `;
  const ast = parseMarkdown(md);
  const resolvedAst = await resolveAssets(ast);
  
  const html = renderToClipboardHtml(resolvedAst, THEMES.default);
  console.log("HTML length:", html.length);
  
  expect(html).toContain('data:image/svg+xml;base64');
  expect(html).toContain('<img src="data:image/svg+xml');

  const blob = await renderToDocxBlob(resolvedAst, THEMES.default);
  expect(blob.size).toBeGreaterThan(0);
  console.log("DOCX generated size:", blob.size);
});
