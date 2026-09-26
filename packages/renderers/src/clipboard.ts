import type { FolioDocument, Block, Inline, CalloutType, Asset } from '@mdtodocs/compiler-core';

// ─── Clipboard Renderer ─────────────────────────────────────────
// Produces HTML with inline styles optimized for pasting into
// Google Docs, Microsoft Word, and other rich-text destinations.
//
// Key differences from the preview HTML renderer:
// - ALL styles are inline (no external CSS, no classes)
// - Fonts and spacing match destination expectations
// - Images use absolute URLs or base64 data URIs
// - Structure prioritizes compatibility over beauty

const FONT_STACK = "'Aptos', 'Calibri', 'Arial', sans-serif";
const CODE_FONT = "'Consolas', 'Courier New', monospace";
const BASE_SIZE = '11pt';
const HEADING_SIZES: Record<number, string> = {
  1: '24pt', 2: '18pt', 3: '14pt', 4: '12pt', 5: '11pt', 6: '10pt',
};
const HEADING_WEIGHTS: Record<number, string> = {
  1: '700', 2: '700', 3: '600', 4: '600', 5: '600', 6: '600',
};

export function renderToClipboardHtml(doc: FolioDocument): string {
  let html = `<div style="font-family:${FONT_STACK};font-size:${BASE_SIZE};color:#1a1a1a;line-height:1.6;">`;

  for (const block of doc.blocks) {
    html += renderBlock(block, doc.assets);
  }

  html += '</div>';
  return html;
}

/**
 * Copies the document as rich HTML to the system clipboard.
 * Writes both text/html and text/plain for maximum compatibility.
 */
export async function copyToClipboard(doc: FolioDocument): Promise<void> {
  const html = renderToClipboardHtml(doc);
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

// ─── Block Rendering ────────────────────────────────────────────

function renderBlock(block: Block, assets: Asset[]): string {
  switch (block.type) {
    case 'Heading': {
      const size = HEADING_SIZES[block.level] || '11pt';
      const weight = HEADING_WEIGHTS[block.level] || '600';
      const marginTop = block.level <= 2 ? '24px' : '16px';
      return `<h${block.level} style="font-family:${FONT_STACK};font-size:${size};font-weight:${weight};color:#1a1a1a;margin:${marginTop} 0 8px 0;line-height:1.3;">${renderInlines(block.inlines)}</h${block.level}>`;
    }

    case 'Paragraph':
      return `<p style="font-family:${FONT_STACK};font-size:${BASE_SIZE};color:#1a1a1a;margin:0 0 8px 0;line-height:1.6;">${renderInlines(block.inlines)}</p>`;

    case 'List': {
      const tag = block.ordered ? 'ol' : 'ul';
      const startAttr = block.ordered && block.start && block.start !== 1 ? ` start="${block.start}"` : '';
      const listStyle = block.ordered ? 'decimal' : 'disc';
      const items = block.items
        .map((item) => {
          const isTask = item.checked !== null && item.checked !== undefined;
          const inner = item.blocks.map(b => renderBlock(b, assets)).join('');
          if (isTask) {
            const checkbox = item.checked ? '☑ ' : '☐ ';
            return `<li style="font-family:${FONT_STACK};font-size:${BASE_SIZE};list-style:none;margin:2px 0;line-height:1.6;">${checkbox}${inner}</li>`;
          }
          return `<li style="font-family:${FONT_STACK};font-size:${BASE_SIZE};margin:2px 0;line-height:1.6;">${inner}</li>`;
        })
        .join('');
      return `<${tag}${startAttr} style="font-family:${FONT_STACK};font-size:${BASE_SIZE};list-style-type:${listStyle};padding-left:24px;margin:4px 0 8px 0;">${items}</${tag}>`;
    }

    case 'Blockquote': {
      const inner = block.blocks.map(b => renderBlock(b, assets)).join('');
      return `<blockquote style="border-left:3px solid #d1d5db;padding-left:16px;margin:8px 0;color:#4b5563;font-style:italic;">${inner}</blockquote>`;
    }

    case 'Callout': {
      const colors = getCalloutColors(block.calloutType);
      const icon = getCalloutIcon(block.calloutType);
      const title = block.title || block.calloutType.charAt(0).toUpperCase() + block.calloutType.slice(1);
      const inner = block.blocks.map(b => renderBlock(b, assets)).join('');
      return `<div style="border-left:4px solid ${colors.border};background:${colors.bg};padding:10px 14px;margin:8px 0;border-radius:2px;">
        <p style="font-family:${FONT_STACK};font-size:${BASE_SIZE};margin:0 0 4px 0;font-weight:600;color:${colors.text};">${icon} ${escapeHtml(title)}</p>
        ${inner}
      </div>`;
    }

    case 'CodeBlock': {
      const langLabel = block.language
        ? `<div style="font-family:${CODE_FONT};font-size:9pt;color:#6b7280;margin-bottom:2px;">${escapeHtml(block.language)}</div>`
        : '';
      return `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:4px;padding:10px 14px;margin:8px 0;">
        ${langLabel}<pre style="font-family:${CODE_FONT};font-size:10pt;color:#1f2937;margin:0;white-space:pre-wrap;word-wrap:break-word;line-height:1.5;"><code>${escapeHtml(block.value)}</code></pre>
      </div>`;
    }

    case 'Table': {
      const rows = block.rows
        .map((row, rowIdx) => {
          const isHeader = rowIdx < block.headerRows;
          const cellTag = isHeader ? 'th' : 'td';
          const cells = row.cells
            .map((cell, cellIdx) => {
              const align = block.align?.[cellIdx] ?? 'left';
              const bgStyle = isHeader ? 'background:#f3f4f6;' : '';
              const fontWeight = isHeader ? 'font-weight:600;' : '';
              const inner = cell.blocks.map(b => renderBlock(b, assets)).join('');
              return `<${cellTag} style="border:1px solid #d1d5db;padding:6px 10px;text-align:${align};${bgStyle}${fontWeight}font-family:${FONT_STACK};font-size:${BASE_SIZE};">${inner}</${cellTag}>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `<table style="border-collapse:collapse;width:100%;margin:8px 0;font-family:${FONT_STACK};font-size:${BASE_SIZE};">${rows}</table>`;
    }

    case 'ThematicBreak':
      return '<hr style="border:none;border-top:1px solid #d1d5db;margin:16px 0;" />';

    case 'ImageBlock': {
      const alt = block.alt ? ` alt="${escapeAttr(block.alt)}"` : ' alt=""';
      const asset = assets.find(a => a.id === block.assetId);
      const src = asset?.data || block.src;
      return `<p style="text-align:center;margin:8px 0;"><img src="${escapeAttr(src)}"${alt} style="max-width:100%;height:auto;" /></p>`;
    }

    case 'DiagramBlock': {
      const asset = assets.find(a => a.id === block.assetId);
      const src = asset?.data || '';
      if (src) {
        return `<p style="text-align:center;margin:8px 0;"><img src="${escapeAttr(src)}" alt="Diagram" style="max-width:100%;height:auto;" /></p>`;
      }
      return `<pre style="font-family:${CODE_FONT};font-size:10pt;background:#f3f4f6;padding:12px;overflow-x:auto;border-radius:4px;"><code>${escapeHtml(block.source)}</code></pre>`;
    }

    case 'MathBlock':
      return `<pre style="font-family:${CODE_FONT};font-size:10pt;background:#f3f4f6;padding:12px;overflow-x:auto;border-radius:4px;"><code>${escapeHtml(block.value)}</code></pre>`;

    default:
      return '';
  }
}

// ─── Inline Rendering ───────────────────────────────────────────

function renderInlines(inlines: Inline[], assets?: Asset[]): string {
  return inlines.map(i => renderInline(i, assets)).join('');
}

function renderInline(inline: Inline, assets?: Asset[]): string {
  switch (inline.type) {
    case 'Text':
      return escapeHtml(inline.value);
    case 'Strong':
      return `<strong style="font-weight:700;">${renderInlines(inline.inlines, assets)}</strong>`;
    case 'Emphasis':
      return `<em style="font-style:italic;">${renderInlines(inline.inlines, assets)}</em>`;
    case 'Strike':
      return `<s style="text-decoration:line-through;">${renderInlines(inline.inlines, assets)}</s>`;
    case 'InlineCode':
      return `<code style="font-family:${CODE_FONT};font-size:10pt;background:#f3f4f6;padding:1px 4px;border-radius:2px;">${escapeHtml(inline.value)}</code>`;
    case 'Link':
      return `<a href="${escapeAttr(inline.url)}" style="color:#2563eb;text-decoration:underline;">${renderInlines(inline.inlines, assets)}</a>`;
    case 'InlineImage': {
      const asset = assets?.find(a => a.id === inline.assetId);
      const src = asset?.data || inline.src;
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1em;vertical-align:middle;" />`;
    }
    case 'InlineMath':
      return `<code style="font-family:${CODE_FONT};font-size:10pt;background:#f3f4f6;padding:1px 4px;border-radius:2px;">${escapeHtml(inline.value)}</code>`;
    case 'Break':
      return '<br />';
    default:
      return '';
  }
}

// ─── Plain Text Extraction ──────────────────────────────────────

function extractPlainText(doc: FolioDocument): string {
  return doc.blocks.map(extractBlockText).join('\n\n');
}

function extractBlockText(block: Block): string {
  switch (block.type) {
    case 'Heading':
      return extractInlinesText(block.inlines);
    case 'Paragraph':
      return extractInlinesText(block.inlines);
    case 'List':
      return block.items
        .map((item, i) => {
          const prefix = block.ordered ? `${(block.start || 1) + i}. ` : '• ';
          const checkbox = item.checked !== null && item.checked !== undefined
            ? (item.checked ? '[x] ' : '[ ] ')
            : '';
          const text = item.blocks.map(extractBlockText).join('\n');
          return `${prefix}${checkbox}${text}`;
        })
        .join('\n');
    case 'Blockquote':
      return block.blocks.map((b) => `> ${extractBlockText(b)}`).join('\n');
    case 'Callout': {
      const title = block.title || block.calloutType.toUpperCase();
      const body = block.blocks.map(extractBlockText).join('\n');
      return `[${title}]\n${body}`;
    }
    case 'CodeBlock':
      return block.value;
    case 'Table':
      return block.rows
        .map((row) =>
          row.cells.map((cell) => cell.blocks.map(extractBlockText).join(' ')).join(' | ')
        )
        .join('\n');
    case 'ThematicBreak':
      return '---';
    case 'ImageBlock':
      return `[Image: ${block.alt || block.src}]`;
    default:
      return '';
  }
}

function extractInlinesText(inlines: Inline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.type) {
        case 'Text': return inline.value;
        case 'InlineCode': return inline.value;
        case 'Strong': return extractInlinesText(inline.inlines);
        case 'Emphasis': return extractInlinesText(inline.inlines);
        case 'Strike': return extractInlinesText(inline.inlines);
        case 'Link': return extractInlinesText(inline.inlines);
        case 'InlineImage': return inline.alt || '';
        case 'Break': return '\n';
        default: return '';
      }
    })
    .join('');
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

function getCalloutColors(type: CalloutType): { bg: string; border: string; text: string } {
  switch (type) {
    case 'note': return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' };
    case 'tip': return { bg: '#f0fdf4', border: '#22c55e', text: '#166534' };
    case 'important': return { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6' };
    case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' };
    case 'caution': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
  }
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
