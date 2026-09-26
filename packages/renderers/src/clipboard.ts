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
  DocumentTheme
} from '@mdtodocs/compiler-core';
import type { CalloutType } from '@mdtodocs/compiler-core';
import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';

// ─── Clipboard Renderer Registry ──────────────────────────────────────

const clipboardRegistry: RendererRegistry<string, string> = {
  blocks: {
    Heading: (block: HeadingBlock, ctx) => {
      const size = ctx.theme.typography.headingSizesPt[block.level as keyof typeof ctx.theme.typography.headingSizesPt] || ctx.theme.typography.baseFontSizePt;
      const weight = block.level <= 2 ? '700' : '600';
      const marginTop = block.level <= 2 ? `${ctx.theme.spacing.headingSpacingBeforePt * 1.5}pt` : `${ctx.theme.spacing.headingSpacingBeforePt}pt`;
      const color = `#${ctx.theme.colors.text}`;
      const font = ctx.theme.typography.headingFont;
      return `<h${block.level} style="font-family:${font};font-size:${size}pt;font-weight:${weight};color:${color};margin:${marginTop} 0 ${ctx.theme.spacing.headingSpacingAfterPt}pt 0;line-height:${ctx.theme.spacing.lineHeight};">${ctx.renderInlines(block.inlines).join('')}</h${block.level}>`;
    },
    Paragraph: (block: ParagraphBlock, ctx) => {
      const color = `#${ctx.theme.colors.text}`;
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      return `<p style="font-family:${font};font-size:${size}pt;color:${color};margin:0 0 ${ctx.theme.spacing.paragraphSpacingPt}pt 0;line-height:${ctx.theme.spacing.lineHeight};">${ctx.renderInlines(block.inlines).join('')}</p>`;
    },
    List: (block: ListBlock, ctx) => {
      const tag = block.ordered ? 'ol' : 'ul';
      const startAttr = block.ordered && block.start && block.start !== 1 ? ` start="${block.start}"` : '';
      const listStyle = block.ordered ? 'decimal' : 'disc';
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      
      const items = block.items
        .map((item) => {
          const isTask = item.checked !== null && item.checked !== undefined;
          const inner = ctx.renderBlocks(item.blocks).join('');
          if (isTask) {
            const checkbox = item.checked ? '☑ ' : '☐ ';
            return `<li style="font-family:${font};font-size:${size}pt;list-style:none;margin:2px 0;line-height:${ctx.theme.spacing.lineHeight};">${checkbox}${inner}</li>`;
          }
          return `<li style="font-family:${font};font-size:${size}pt;margin:2px 0;line-height:${ctx.theme.spacing.lineHeight};">${inner}</li>`;
        })
        .join('');
      return `<${tag}${startAttr} style="font-family:${font};font-size:${size}pt;list-style-type:${listStyle};padding-left:24px;margin:4px 0 8px 0;">${items}</${tag}>`;
    },
    Blockquote: (block: BlockquoteBlock, ctx) => {
      const inner = ctx.renderBlocks(block.blocks).join('');
      const border = `#${ctx.theme.colors.blockquoteBorder}`;
      const color = `#${ctx.theme.colors.blockquoteText}`;
      return `<blockquote style="border-left:3px solid ${border};padding-left:16px;margin:8px 0;color:${color};font-style:italic;">${inner}</blockquote>`;
    },
    Callout: (block: CalloutBlock, ctx) => {
      const c = ctx.theme.colors.callouts[block.calloutType] || ctx.theme.colors.callouts.note;
      const icon = getCalloutIcon(block.calloutType);
      const title = block.title || block.calloutType.charAt(0).toUpperCase() + block.calloutType.slice(1);
      const inner = ctx.renderBlocks(block.blocks).join('');
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      
      return `<div style="border-left:4px solid #${c.border};background:#${c.bg};padding:10px 14px;margin:8px 0;border-radius:2px;">
        <p style="font-family:${font};font-size:${size}pt;margin:0 0 4px 0;font-weight:600;color:#${c.text};">${icon} ${escapeHtml(title)}</p>
        ${inner}
      </div>`;
    },
    CodeBlock: (block: CodeBlock, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const color = `#${ctx.theme.colors.codeText}`;
      const border = `#${ctx.theme.colors.border}`;
      const font = ctx.theme.typography.codeFont;
      const size = Math.max(8, ctx.theme.typography.baseFontSizePt - 1);
      
      const langLabel = block.language
        ? `<div style="font-family:${font};font-size:${size - 1}pt;color:#${ctx.theme.colors.secondary};margin-bottom:2px;">${escapeHtml(block.language)}</div>`
        : '';
      return `<div style="background:${bg};border:1px solid ${border};border-radius:4px;padding:10px 14px;margin:8px 0;">
        ${langLabel}<pre style="font-family:${font};font-size:${size}pt;color:${color};margin:0;white-space:pre-wrap;word-wrap:break-word;line-height:1.5;"><code>${escapeHtml(block.value)}</code></pre>
      </div>`;
    },
    Table: (block: TableBlock, ctx) => {
      const border = `#${ctx.theme.colors.border}`;
      const headerBg = `#${ctx.theme.colors.tableHeaderBackground}`;
      const font = ctx.theme.typography.bodyFont;
      const size = ctx.theme.typography.baseFontSizePt;
      
      const rows = block.rows
        .map((row, rowIdx) => {
          const isHeader = rowIdx < block.headerRows;
          const cellTag = isHeader ? 'th' : 'td';
          const cells = row.cells
            .map((cell, cellIdx) => {
              const align = block.align?.[cellIdx] ?? 'left';
              const bgStyle = isHeader ? `background:${headerBg};` : '';
              const fontWeight = isHeader ? 'font-weight:600;' : '';
              const inner = ctx.renderBlocks(cell.blocks).join('');
              return `<${cellTag} style="border:1px solid ${border};padding:6px 10px;text-align:${align};${bgStyle}${fontWeight}font-family:${font};font-size:${size}pt;">${inner}</${cellTag}>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `<table style="border-collapse:collapse;width:100%;margin:8px 0;font-family:${font};font-size:${size}pt;">${rows}</table>`;
    },
    ThematicBreak: (_block, ctx) => {
      const border = `#${ctx.theme.colors.border}`;
      return `<hr style="border:none;border-top:1px solid ${border};margin:16px 0;" />`;
    },
    ImageBlock: (block: ImageBlock, ctx) => {
      const alt = block.alt ? ` alt="${escapeAttr(block.alt)}"` : ' alt=""';
      const asset = ctx.assets.find(a => a.id === block.assetId);
      const src = asset?.data || block.src;
      return `<p style="text-align:center;margin:8px 0;"><img src="${escapeAttr(src)}"${alt} style="max-width:100%;height:auto;" /></p>`;
    },
    DiagramBlock: (block: DiagramBlock, ctx) => {
      const asset = ctx.assets.find(a => a.id === block.assetId);
      const src = asset?.data || '';
      if (src) {
        return `<p style="text-align:center;margin:8px 0;"><img src="${escapeAttr(src)}" alt="Diagram" style="max-width:100%;height:auto;" /></p>`;
      }
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      const size = Math.max(8, ctx.theme.typography.baseFontSizePt - 1);
      return `<pre style="font-family:${font};font-size:${size}pt;background:${bg};padding:12px;overflow-x:auto;border-radius:4px;"><code>${escapeHtml(block.source)}</code></pre>`;
    },
    MathBlock: (block: MathBlock, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      const size = Math.max(8, ctx.theme.typography.baseFontSizePt - 1);
      return `<pre style="font-family:${font};font-size:${size}pt;background:${bg};padding:12px;overflow-x:auto;border-radius:4px;"><code>${escapeHtml(block.value)}</code></pre>`;
    },
  },
  inlines: {
    Text: (inline: TextInline) => escapeHtml(inline.value),
    Strong: (inline: StrongInline, ctx) => `<strong style="font-weight:700;">${ctx.renderInlines(inline.inlines).join('')}</strong>`,
    Emphasis: (inline: EmphasisInline, ctx) => `<em style="font-style:italic;">${ctx.renderInlines(inline.inlines).join('')}</em>`,
    Strike: (inline: StrikeInline, ctx) => `<s style="text-decoration:line-through;">${ctx.renderInlines(inline.inlines).join('')}</s>`,
    InlineCode: (inline: InlineCode, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const color = `#${ctx.theme.colors.codeText}`;
      const font = ctx.theme.typography.codeFont;
      return `<code style="font-family:${font};background:${bg};color:${color};padding:1px 4px;border-radius:2px;">${escapeHtml(inline.value)}</code>`;
    },
    Link: (inline: LinkInline, ctx) => {
      const color = `#${ctx.theme.colors.primary}`;
      return `<a href="${escapeAttr(inline.url)}" style="color:${color};text-decoration:underline;">${ctx.renderInlines(inline.inlines).join('')}</a>`;
    },
    InlineImage: (inline: InlineImageInline, ctx) => {
      const asset = ctx.assets.find(a => a.id === inline.assetId);
      const src = asset?.data || inline.src;
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1em;vertical-align:middle;" />`;
    },
    InlineMath: (inline: InlineMath, ctx) => {
      const bg = `#${ctx.theme.colors.codeBackground}`;
      const font = ctx.theme.typography.codeFont;
      return `<code style="font-family:${font};background:${bg};padding:1px 4px;border-radius:2px;">${escapeHtml(inline.value)}</code>`;
    },
    Break: () => '<br />',
  },
  fallbackBlock: () => '',
  fallbackInline: () => ''
};

const clipboardRenderer = new DocumentRenderer(clipboardRegistry);

export function renderToClipboardHtml(doc: FolioDocument, theme?: DocumentTheme): string {
  const innerHtml = clipboardRenderer.render(doc, {}, theme).join('');
  
  const font = theme ? theme.typography.bodyFont : "'Aptos', 'Calibri', 'Arial', sans-serif";
  const size = theme ? theme.typography.baseFontSizePt : 11;
  const color = theme ? `#${theme.colors.text}` : '#1a1a1a';
  
  return `<div style="font-family:${font};font-size:${size}pt;color:${color};line-height:1.6;">${innerHtml}</div>`;
}

/**
 * Copies the document as rich HTML to the system clipboard.
 * Writes both text/html and text/plain for maximum compatibility.
 */
export async function copyToClipboard(doc: FolioDocument, theme?: DocumentTheme): Promise<void> {
  const html = renderToClipboardHtml(doc, theme);
  const plainText = extractPlainText(doc);

  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([plainText], { type: 'text/plain' });

  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    }),
  ]);
}

// ─── Plain Text Extraction ──────────────────────────────────────

const plainTextRegistry: RendererRegistry<string, string> = {
  blocks: {
    Heading: (block: HeadingBlock, ctx) => ctx.renderInlines(block.inlines).join(''),
    Paragraph: (block: ParagraphBlock, ctx) => ctx.renderInlines(block.inlines).join(''),
    List: (block: ListBlock, ctx) => {
      return block.items
        .map((item, i) => {
          const prefix = block.ordered ? `${(block.start || 1) + i}. ` : '• ';
          const checkbox = item.checked !== null && item.checked !== undefined
            ? (item.checked ? '[x] ' : '[ ] ')
            : '';
          const text = ctx.renderBlocks(item.blocks).join('\n');
          return `${prefix}${checkbox}${text}`;
        })
        .join('\n');
    },
    Blockquote: (block: BlockquoteBlock, ctx) => block.blocks.map((b) => `> ${ctx.renderBlock(b)}`).join('\n'),
    Callout: (block: CalloutBlock, ctx) => {
      const title = block.title || block.calloutType.toUpperCase();
      const body = ctx.renderBlocks(block.blocks).join('\n');
      return `[${title}]\n${body}`;
    },
    CodeBlock: (block: CodeBlock) => block.value,
    Table: (block: TableBlock, ctx) => {
      return block.rows
        .map((row) => row.cells.map((cell) => ctx.renderBlocks(cell.blocks).join(' ')).join(' | '))
        .join('\n');
    },
    ThematicBreak: () => '---',
    ImageBlock: (block: ImageBlock) => `[Image: ${block.alt || block.src}]`,
    DiagramBlock: (block: DiagramBlock) => `[Diagram: ${block.diagramType}]`,
    MathBlock: (block: MathBlock) => block.value,
  },
  inlines: {
    Text: (inline: TextInline) => inline.value,
    Strong: (inline: StrongInline, ctx) => ctx.renderInlines(inline.inlines).join(''),
    Emphasis: (inline: EmphasisInline, ctx) => ctx.renderInlines(inline.inlines).join(''),
    Strike: (inline: StrikeInline, ctx) => ctx.renderInlines(inline.inlines).join(''),
    InlineCode: (inline: InlineCode) => inline.value,
    Link: (inline: LinkInline, ctx) => ctx.renderInlines(inline.inlines).join(''),
    InlineImage: (inline: InlineImageInline) => inline.alt || '',
    InlineMath: (inline: InlineMath) => inline.value,
    Break: () => '\n',
  },
  fallbackBlock: () => '',
  fallbackInline: () => ''
};

const plainTextRenderer = new DocumentRenderer(plainTextRegistry);

function extractPlainText(doc: FolioDocument): string {
  return plainTextRenderer.render(doc).join('\n\n');
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

function getCalloutIcon(type: CalloutType): string {
  switch (type) {
    case 'note': return 'ℹ️';
    case 'tip': return '💡';
    case 'important': return '❗';
    case 'warning': return '⚠️';
    case 'caution': return '🔴';
  }
}
