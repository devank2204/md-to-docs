import type { DocumentTheme } from '@mdtodocs/compiler-core';
import type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdTable, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';
import type { ResolvedAsset } from '@mdtodocs/asset-pipeline';
import katex from 'katex';
import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(unsafe: string): string {
  return escapeHtml(unsafe);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function getNodePlainText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(getNodePlainText).join('');
  }
  return '';
}

const htmlRegistry: RendererRegistry<string> = {
  nodes: {
    heading: (block: Heading, ctx) => {
      const tag = `h${block.depth}`;
      const size = ctx.theme.typography.headingSizesPt[block.depth as keyof typeof ctx.theme.typography.headingSizesPt] || ctx.theme.typography.baseFontSizePt;
      const font = ctx.theme.typography.headingFont;
      const color = `#${ctx.theme.colors.text}`;
      const text = getNodePlainText(block);
      const id = slugify(text);
      const idAttr = id ? ` id="${id}"` : '';

      return `<${tag}${idAttr} style="font-family:${font};font-size:${size}pt;color:${color};font-weight:700;margin-top:28px;margin-bottom:12px;line-height:1.25;">${ctx.renderNodes(block.children).join('')}</${tag}>`;
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
        const itemContent = item.children.map((child: Node, idx: number) => {
          if (isTask && idx === 0 && child.type === 'paragraph') {
            const p = child as Paragraph;
            const pFont = ctx.theme.typography.bodyFont;
            const pSize = ctx.theme.typography.baseFontSizePt;
            const pColor = `#${ctx.theme.colors.text}`;
            const lineHeight = ctx.theme.spacing.lineHeight;
            return `<p style="font-family:${pFont};font-size:${pSize}pt;color:${pColor};line-height:${lineHeight};margin-bottom:8px;">${taskBox}${ctx.renderNodes(p.children).join('')}</p>`;
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
      return `<blockquote style="font-family:${font};font-size:${size}pt;color:${color};border-left:4px solid ${border};margin:0 0 16px 0;padding:8px 16px;background:#f9fafb;border-radius:0 4px 4px 0;">${ctx.renderNodes(block.children).join('')}</blockquote>`;
    },
    containerDirective: (block: any /* ContainerDirective */, ctx) => {
      const type = block.attributes?.type || 'note';
      const colors = ctx.theme.colors.callouts[type as keyof typeof ctx.theme.colors.callouts] || ctx.theme.colors.callouts.note;
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;

      return `<div class="callout callout-${type}" style="font-family:${font};font-size:${size}pt;background-color:#${colors.bg};border-left:4px solid #${colors.border};color:#${colors.text};padding:12px 16px;margin-bottom:16px;border-radius:0 4px 4px 0;">
        <strong style="text-transform:capitalize;">${type}</strong><br/>
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
      const caption = block.alt ? `<figcaption style="margin-top:6px;font-size:0.9em;color:#6b7280;">${escapeHtml(block.alt)}</figcaption>` : '';
      return `<figure style="margin:20px 0;text-align:center;"><img src="${escapeAttr(src)}"${alt} style="max-width:100%;height:auto;border-radius:4px;" />${caption}</figure>`;
    },
    code: (block: Code, ctx) => {
      if (block.lang === 'mermaid') {
        const asset = (block.data as any)?.resolvedAsset as ResolvedAsset | undefined;
        if (asset && asset.data) {
          // Precise Mermaid SVG injection
          if (asset.data.startsWith('<svg')) {
            return `<div class="diagram-mermaid" style="text-align:center;margin:24px 0;overflow-x:auto;">${asset.data}</div>`;
          }
          if (asset.data.startsWith('data:image/svg+xml;base64,')) {
            try {
              const svgText = atob(asset.data.replace('data:image/svg+xml;base64,', ''));
              return `<div class="diagram-mermaid" style="text-align:center;margin:24px 0;overflow-x:auto;">${svgText}</div>`;
            } catch {
              return `<div class="diagram-mermaid" style="text-align:center;margin:24px 0;"><img src="${escapeAttr(asset.data)}" alt="Diagram" style="max-width:100%;" /></div>`;
            }
          }
          return `<div class="diagram-mermaid" style="text-align:center;margin:24px 0;"><img src="${escapeAttr(asset.data)}" alt="Diagram" style="max-width:100%;" /></div>`;
        }
        return `<div class="diagram-mermaid diagram-unrendered" style="text-align:center;margin:24px 0;"><pre style="display:inline-block;text-align:left;background:#f3f4f6;padding:12px;border-radius:4px;"><code>${escapeHtml(block.value)}</code></pre></div>`;
      }

      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      const size = Math.max(8, ctx.theme.typography.baseFontSizePt - 1);
      const langHeader = block.lang ? `<div style="font-size:10px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;user-select:none;">${escapeHtml(block.lang)}</div>` : '';
      return `<pre style="font-family:${font};font-size:${size}pt;background:${bg};padding:14px;overflow-x:auto;border-radius:6px;line-height:1.45;">${langHeader}<code>${escapeHtml(block.value)}</code></pre>`;
    },
    math: (block: any /* Math */) => {
      try {
        const rendered = katex.renderToString(block.value, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
        return `<div class="math-display" style="text-align:center;margin:20px 0;overflow-x:auto;padding:4px 0;">${rendered}</div>`;
      } catch {
        return `<div class="math-display math-error" style="text-align:center;margin:20px 0;font-family:monospace;color:#b91c1c;">$$${escapeHtml(block.value)}$$</div>`;
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
      return `<code style="font-family:${font};background:${bg};color:${color};padding:2px 5px;border-radius:3px;font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    },
    link: (inline: Link, ctx) => {
      const color = `#${ctx.theme.colors.primary}`;
      return `<a href="${escapeAttr(inline.url)}" style="color:${color};text-decoration:none;">${ctx.renderNodes(inline.children).join('')}</a>`;
    },
    image_inline: (inline: Image) => {
      const asset = (inline.data as any)?.resolvedAsset as ResolvedAsset | undefined;
      const src = (asset && asset.data) ? asset.data : inline.url;
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1.1em;vertical-align:middle;margin:0 2px;" />`;
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

const htmlRenderer = new DocumentRenderer<string>(htmlRegistry);

export interface HtmlRendererOptions {
  theme?: DocumentTheme;
  title?: string;
  fullDocument?: boolean;
  includeStyles?: boolean;
}

export function renderToHtml(doc: Root, options?: HtmlRendererOptions): string {
  const theme = options?.theme;
  const contentHtml = htmlRenderer.render(doc, {}, theme).join('\n');

  if (!options?.fullDocument) {
    return contentHtml;
  }

  const title = options.title ? escapeHtml(options.title) : 'Document';
  const bodyFont = theme?.typography.bodyFont || "'Söhne', ui-sans-serif, system-ui, -apple-system, sans-serif";
  const textColor = theme ? `#${theme.colors.text}` : '#1A1A1A';
  const bgColor = theme ? `#${theme.colors.background}` : '#FFFFFF';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: ${bodyFont};
      color: ${textColor};
      background-color: ${bgColor};
      max-width: 860px;
      margin: 40px auto;
      padding: 0 24px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
    th { background: #f3f4f6; font-weight: 700; }
    pre { overflow-x: auto; }
    img, svg { max-width: 100%; height: auto; }
    @media print {
      body { max-width: 100%; margin: 0; padding: 0; }
      @page { margin: 1in; }
    }
  </style>
</head>
<body>
  <main>
${contentHtml}
  </main>
</body>
</html>`;
}
