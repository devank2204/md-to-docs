import type {
  FolioDocument,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  BlockquoteBlock,
  CalloutBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  DiagramBlock,
  MathBlock,
  TextInline,
  StrongInline,
  EmphasisInline,
  StrikeInline,
  InlineCode,
  LinkInline,
  InlineImageInline,
  InlineMath,
  DocumentTheme,
} from '@mdtodocs/compiler-core';
import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';

// ─── HTML Renderer Registry ──────────────────────────────────────

const htmlRegistry: RendererRegistry<string, string> = {
  blocks: {
    Heading: (block: HeadingBlock, ctx) => {
      const tag = `h${block.level}`;
      return `<${tag}>${ctx.renderInlines(block.inlines).join('')}</${tag}>`;
    },
    Paragraph: (block: ParagraphBlock, ctx) => {
      return `<p>${ctx.renderInlines(block.inlines).join('')}</p>`;
    },
    List: (block: ListBlock, ctx) => {
      const tag = block.ordered ? 'ol' : 'ul';
      const startAttr = block.ordered && block.start && block.start !== 1 ? ` start="${block.start}"` : '';
      const items = block.items
        .map((item) => {
          const isTask = item.checked !== null && item.checked !== undefined;
          const innerHtml = ctx.renderBlocks(item.blocks).join('');
          if (isTask) {
            const checkbox = item.checked
              ? '<input type="checkbox" checked disabled style="margin-right:6px;vertical-align:middle;" />'
              : '<input type="checkbox" disabled style="margin-right:6px;vertical-align:middle;" />';
            return `<li style="list-style:none;">${checkbox}${innerHtml}</li>`;
          }
          return `<li>${innerHtml}</li>`;
        })
        .join('');
      return `<${tag}${startAttr}>${items}</${tag}>`;
    },
    Blockquote: (block: BlockquoteBlock, ctx) => {
      const inner = ctx.renderBlocks(block.blocks).join('');
      const border = `#${ctx.theme.colors.blockquoteBorder}`;
      const color = `#${ctx.theme.colors.blockquoteText}`;
      return `<blockquote style="border-left:3px solid ${border};padding-left:16px;margin:16px 0;color:${color};">${inner}</blockquote>`;
    },
    Callout: (block: CalloutBlock, ctx) => {
      const c = ctx.theme.colors.callouts[block.calloutType] || ctx.theme.colors.callouts.note;
      const icon = getCalloutIcon(block.calloutType);
      const inner = ctx.renderBlocks(block.blocks).join('');
      const titleHtml = block.title
        ? `<strong style="display:block;margin-bottom:4px;color:#${c.text};">${escapeHtml(block.title)}</strong>`
        : `<strong style="display:block;margin-bottom:4px;text-transform:capitalize;color:#${c.text};">${block.calloutType}</strong>`;
      return `<div style="border-left:4px solid #${c.border};background:#${c.bg};padding:12px 16px;margin:16px 0;border-radius:4px;font-family:${ctx.theme.typography.bodyFont};">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:16px;">${icon}</span>
          ${titleHtml}
        </div>
        ${inner}
      </div>`;
    },
    CodeBlock: (block: CodeBlock, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const color = `#${ctx.theme.colors.codeText}`;
      const border = `#${ctx.theme.colors.border}`;
      const font = ctx.theme.typography.codeFont;
      
      const langLabel = block.language
        ? `<div style="font-size:11px;color:#${ctx.theme.colors.secondary};margin-bottom:4px;font-family:${font};">${escapeHtml(block.language)}</div>`
        : '';
      return `<div style="background:${bg};border:1px solid ${border};border-radius:6px;padding:12px 16px;margin:16px 0;overflow-x:auto;">
        ${langLabel}<pre style="margin:0;white-space:pre;overflow-x:auto;"><code style="font-family:${font};font-size:13px;line-height:${ctx.theme.spacing.lineHeight};color:${color};">${escapeHtml(block.value)}</code></pre>
      </div>`;
    },
    Table: (block: TableBlock, ctx) => {
      const border = `#${ctx.theme.colors.border}`;
      const headerBg = `#${ctx.theme.colors.tableHeaderBackground}`;
      
      const rows = block.rows.map((row, rowIdx) => {
        const isHeader = rowIdx < block.headerRows;
        const cellTag = isHeader ? 'th' : 'td';
        const cells = row.cells
          .map((cell, cellIdx) => {
            const align = block.align?.[cellIdx] ?? null;
            const alignStyle = align ? `text-align:${align};` : '';
            const headerStyle = isHeader ? `font-weight:600;background:${headerBg};` : '';
            const inner = ctx.renderBlocks(cell.blocks).join('');
            return `<${cellTag} style="border:1px solid ${border};padding:8px 12px;${alignStyle}${headerStyle}">${inner}</${cellTag}>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table>${rows}</table>`;
    },
    ThematicBreak: (_block, ctx) => {
      const border = `#${ctx.theme.colors.border}`;
      return `<hr style="border:none;border-top:1px solid ${border};margin:24px 0;" />`;
    },
    ImageBlock: (block: ImageBlock, ctx) => {
      const altAttr = block.alt ? ` alt="${escapeAttr(block.alt)}"` : ' alt=""';
      const titleAttr = block.title ? ` title="${escapeAttr(block.title)}"` : '';
      const asset = ctx.assets.find(a => a.id === block.assetId);
      const src = asset?.data || block.src;
      
      return `<figure style="margin:16px 0;text-align:center;">
        <img src="${escapeAttr(src)}"${altAttr}${titleAttr} style="max-width:100%;height:auto;border-radius:4px;" />
        ${block.alt ? `<figcaption style="font-size:13px;color:#${ctx.theme.colors.secondary};margin-top:4px;">${escapeHtml(block.alt)}</figcaption>` : ''}
      </figure>`;
    },
    DiagramBlock: (block: DiagramBlock, ctx) => {
      const asset = ctx.assets.find(a => a.id === block.assetId);
      if (asset?.data) {
        if (asset.mimeType === 'image/svg+xml' && asset.raw) {
          // Inject raw SVG directly to avoid foreignObject rendering issues in img tags
          return `<figure style="margin:16px 0;text-align:center;">${asset.raw}</figure>`;
        }
        return `<figure style="margin:16px 0;text-align:center;"><img src="${escapeAttr(asset.data)}" alt="Diagram" style="max-width:100%;height:auto;border-radius:4px;" /></figure>`;
      }
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      return `<pre class="mermaid" style="background:${bg};padding:16px;border-radius:6px;overflow-x:auto;font-family:${font};font-size:0.9em;"><code>${escapeHtml(block.source)}</code></pre>`;
    },
    MathBlock: (block: MathBlock, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      return `<pre style="background:${bg};padding:16px;border-radius:6px;overflow-x:auto;font-family:${font};font-size:0.9em;"><code>${escapeHtml(block.value)}</code></pre>`;
    },
  },
  inlines: {
    Text: (inline: TextInline) => escapeHtml(inline.value),
    Strong: (inline: StrongInline, ctx) => `<strong>${ctx.renderInlines(inline.inlines).join('')}</strong>`,
    Emphasis: (inline: EmphasisInline, ctx) => `<em>${ctx.renderInlines(inline.inlines).join('')}</em>`,
    Strike: (inline: StrikeInline, ctx) => `<s>${ctx.renderInlines(inline.inlines).join('')}</s>`,
    InlineCode: (inline: InlineCode, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const color = `#${ctx.theme.colors.codeText}`;
      const font = ctx.theme.typography.codeFont;
      return `<code style="background:${bg};color:${color};padding:2px 6px;border-radius:3px;font-family:${font};font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    },
    Link: (inline: LinkInline, ctx) => {
      const color = `#${ctx.theme.colors.primary}`;
      return `<a href="${escapeAttr(inline.url)}" style="color:${color};text-decoration:underline;">${ctx.renderInlines(inline.inlines).join('')}</a>`;
    },
    InlineImage: (inline: InlineImageInline, ctx) => {
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      const asset = ctx.assets.find(a => a.id === inline.assetId);
      const src = asset?.data || inline.src;
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1.2em;vertical-align:middle;" />`;
    },
    InlineMath: (inline: InlineMath, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      return `<code style="background:${bg};padding:2px 6px;border-radius:3px;font-family:${font};font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    },
    Break: () => '<br />',
  },
  fallbackBlock: () => '',
  fallbackInline: () => ''
};

const htmlRenderer = new DocumentRenderer(htmlRegistry);

export function renderToHtml(doc: FolioDocument, theme?: DocumentTheme): string {
  return htmlRenderer.render(doc, {}, theme).join('');
}

// ─── Helpers ────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

function getCalloutIcon(type: string): string {
  switch (type) {
    case 'note': return 'ℹ️';
    case 'tip': return '💡';
    case 'important': return '❗';
    case 'warning': return '⚠️';
    case 'caution': return '🔴';
    default: return 'ℹ️';
  }
}
