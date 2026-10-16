import type { DocumentTheme } from '@mdtodocs/compiler-core';
import type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdTable, Image, Text, Strong, Emphasis, Delete, InlineCode, Link } from 'mdast';
import type { ResolvedAsset } from '@mdtodocs/asset-pipeline';
import katex from 'katex';
import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(unsafe: string): string {
  return escapeHtml(unsafe);
}

const clipboardRegistry: RendererRegistry<string> = {
  nodes: {
    heading: (block: Heading, ctx) => {
      const tag = `h${block.depth}`;
      const size = ctx.theme.typography.headingSizesPt[block.depth as keyof typeof ctx.theme.typography.headingSizesPt] || ctx.theme.typography.baseFontSizePt;
      const font = ctx.theme.typography.headingFont;
      const color = `#${ctx.theme.colors.text}`;
      return `<${tag} style="font-family:${font};font-size:${size}pt;color:${color};font-weight:700;margin-top:24px;margin-bottom:12px;">${ctx.renderNodes(block.children).join('')}</${tag}>`;
    },
    paragraph: (block: Paragraph, ctx) => {
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      const color = `#${ctx.theme.colors.text}`;
      const lineHeight = ctx.theme.spacing.lineHeight;
      return `<p style="font-family:${font};font-size:${size}pt;color:${color};line-height:${lineHeight};margin-bottom:16px;">${ctx.renderNodes(block.children).join('')}</p>`;
    },
    list: (block: List, ctx) => {
      const tag = block.ordered ? 'ol' : 'ul';
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      const color = `#${ctx.theme.colors.text}`;
      const isTaskList = block.children.some((item: any) => typeof item.checked === 'boolean');

      const items = block.children.map((item: any) => {
        const isTask = typeof item.checked === 'boolean';
        const taskBox = isTask ? (item.checked ? '☑ ' : '☐ ') : '';
        const itemContent = item.children.map((child: any, idx: number) => {
          if (isTask && idx === 0 && child.type === 'paragraph') {
            const p = child as Paragraph;
            const pFont = ctx.theme.typography.bodyFont;
            const pSize = ctx.theme.typography.baseFontSizePt;
            const pColor = `#${ctx.theme.colors.text}`;
            const lineHeight = ctx.theme.spacing.lineHeight;
            return `<p style="font-family:${pFont};font-size:${pSize}pt;color:${pColor};line-height:${lineHeight};margin-bottom:16px;">${taskBox}${ctx.renderNodes(p.children).join('')}</p>`;
          }
          return ctx.renderNode(child);
        }).join('');
        const itemStyle = isTask ? 'margin-bottom:8px;list-style-type:none;' : 'margin-bottom:8px;';
        return `<li style="${itemStyle}">${itemContent}</li>`;
      });

      const listPadding = isTaskList ? 'padding-left:0;list-style:none;' : 'padding-left:24px;';
      return `<${tag} style="font-family:${font};font-size:${size}pt;color:${color};margin-bottom:16px;${listPadding}">${items.join('')}</${tag}>`;
    },
    blockquote: (block: Blockquote, ctx) => {
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      const color = `#${ctx.theme.colors.secondary}`;
      const border = `#${ctx.theme.colors.border}`;
      return `<blockquote style="font-family:${font};font-size:${size}pt;color:${color};border-left:4px solid ${border};margin:0 0 16px 0;padding:8px 16px;background:#f9fafb;">${ctx.renderNodes(block.children).join('')}</blockquote>`;
    },
    containerDirective: (block: any /* ContainerDirective */, ctx) => {
      const type = block.attributes?.type || 'note';
      const colors = ctx.theme.colors.callouts[type as keyof typeof ctx.theme.colors.callouts] || ctx.theme.colors.callouts.note;
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      
      return `<div style="font-family:${font};font-size:${size}pt;background-color:#${colors.bg};border-left:4px solid #${colors.border};color:#${colors.text};padding:12px 16px;margin-bottom:16px;border-radius:0 4px 4px 0;">
        <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br/>
        ${ctx.renderNodes(block.children).join('')}
      </div>`;
    },
    table: (block: MdTable, ctx) => {
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt - 1;
      const color = `#${ctx.theme.colors.text}`;
      const borderColor = `#${ctx.theme.colors.border}`;

      const headerRows: string[] = [];
      const bodyRows: string[] = [];

      block.children.forEach((row: any, rowIdx: number) => {
        const isHeader = rowIdx === 0;
        const cellTag = isHeader ? 'th' : 'td';
        const bg = isHeader ? '#f3f4f6' : 'transparent';
        const fontWeight = isHeader ? '700' : '400';

        const cells = row.children.map((cell: any, colIdx: number) => {
          const colAlign = block.align?.[colIdx] || 'left';
          return `<${cellTag} style="padding:8px 12px;border:1px solid ${borderColor};background:${bg};font-weight:${fontWeight};text-align:${colAlign};">${ctx.renderNodes(cell.children).join('')}</${cellTag}>`;
        });

        const rowHtml = `<tr>${cells.join('')}</tr>`;
        if (isHeader) {
          headerRows.push(rowHtml);
        } else {
          bodyRows.push(rowHtml);
        }
      });

      const theadHtml = headerRows.length > 0 ? `<thead>${headerRows.join('')}</thead>` : '';
      const tbodyHtml = bodyRows.length > 0 ? `<tbody>${bodyRows.join('')}</tbody>` : '';

      return `<table style="font-family:${font};font-size:${size}pt;color:${color};width:100%;border-collapse:collapse;margin-bottom:16px;">
        ${theadHtml}${tbodyHtml}
      </table>`;
    },
    thematicBreak: () => '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />',
    image: (block: Image) => {
      const asset = (block.data as any)?.resolvedAsset as ResolvedAsset | undefined;
      const src = (asset && asset.data) ? asset.data : block.url;
      const alt = block.alt ? ` alt="${escapeAttr(block.alt)}"` : ' alt=""';
      return `<img src="${escapeAttr(src)}"${alt} style="max-width:100%;height:auto;margin-bottom:16px;border-radius:4px;" />`;
    },
    code: (block: Code, ctx) => {
      const isMermaid = block.lang === 'mermaid';
      if (isMermaid) {
        const asset = (block.data as any)?.resolvedAsset as ResolvedAsset | undefined;
        if (asset && asset.data) {
          return `<div style="text-align:center;margin-bottom:16px;"><img src="${escapeAttr(asset.data)}" alt="Diagram" style="max-width:100%;" /></div>`;
        }
      }
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      const size = Math.max(8, ctx.theme.typography.baseFontSizePt - 1);
      return `<pre style="font-family:${font};font-size:${size}pt;background:${bg};padding:12px;overflow-x:auto;border-radius:4px;"><code>${escapeHtml(block.value)}</code></pre>`;
    },
    math: (block: any /* Math */) => {
      try {
        const rendered = katex.renderToString(block.value, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
        return `<div class="math-display" style="text-align:center;margin:18px 0;overflow-x:auto;padding:4px 0;">${rendered}</div>`;
      } catch {
        return `<div class="math-display math-error" style="text-align:center;margin:18px 0;font-family:monospace;color:#b91c1c;">$$${escapeHtml(block.value)}$$</div>`;
      }
    },
    text: (inline: Text) => escapeHtml(inline.value),
    strong: (inline: Strong, ctx) => `<strong style="font-weight:700;">${ctx.renderNodes(inline.children).join('')}</strong>`,
    emphasis: (inline: Emphasis, ctx) => `<em style="font-style:italic;">${ctx.renderNodes(inline.children).join('')}</em>`,
    delete: (inline: Delete, ctx) => `<s style="text-decoration:line-through;">${ctx.renderNodes(inline.children).join('')}</s>`,
    inlineCode: (inline: InlineCode, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const color = `#${ctx.theme.colors.codeText}`;
      const font = ctx.theme.typography.codeFont;
      return `<code style="font-family:${font};background:${bg};color:${color};padding:2px 4px;border-radius:2px;font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    },
    link: (inline: Link, ctx) => {
      const color = `#${ctx.theme.colors.primary}`;
      return `<a href="${escapeAttr(inline.url)}" style="color:${color};text-decoration:none;">${ctx.renderNodes(inline.children).join('')}</a>`;
    },
    image_inline: (inline: Image) => {
      const asset = (inline.data as any)?.resolvedAsset as ResolvedAsset | undefined;
      const src = (asset && asset.data) ? asset.data : inline.url;
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1em;vertical-align:middle;" />`;
    },
    inlineMath: (inline: any /* InlineMath */) => {
      try {
        const rendered = katex.renderToString(inline.value, {
          displayMode: false,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
        return `<span class="math-inline" style="display:inline-block;vertical-align:baseline;margin:0 2px;">${rendered}</span>`;
      } catch {
        return `<code class="math-error" style="font-family:monospace;background:#fee2e2;color:#b91c1c;padding:1px 4px;border-radius:2px;">$${escapeHtml(inline.value)}$</code>`;
      }
    },
    break: () => '<br />',
  },
  fallbackNode: () => ''
};

const clipboardRenderer = new DocumentRenderer<string>(clipboardRegistry);

export function renderToClipboardHtml(doc: Root, theme?: DocumentTheme, signature?: { enabled: boolean; placement: 'every-page' | 'last-page' }): string {
  const childrenHtml = clipboardRenderer.render(doc, {}, theme).join('\n');
  
  let signatureHtml = '';
  if (signature?.enabled) {
    signatureHtml = `
      <div style="margin-top: 48px; text-align: right; color: #888; font-family: 'Caveat', 'Cedarville Cursive', cursive; font-size: 24px; user-select: none;">
        made with mdtodocs.com
      </div>
    `;
  }

  return `
    <div style="max-width:800px;margin:0 auto;">
      ${childrenHtml}
      ${signatureHtml}
    </div>
  `;
}

export function copyToClipboard(html: string) {
  const plainText = extractPlainText(html);
  
  if (navigator.clipboard && window.ClipboardItem) {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    
    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });
    
    return navigator.clipboard.write([item]);
  } else {
    throw new Error("Clipboard API not fully supported in this browser.");
  }
}

// A simple text extractor for the plain text fallback
function extractPlainText(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.innerText || tempDiv.textContent || '';
}
