import type { FolioDocument, Block, Inline, CalloutType, Asset } from '@mdtodocs/compiler-core';

// ─── HTML Preview Renderer ──────────────────────────────────────
// Renders the IR into styled HTML for the document preview pane.
// This is NOT the clipboard renderer — it's optimized for in-app display.

export function renderToHtml(doc: FolioDocument): string {
  let html = '';
  for (const block of doc.blocks) {
    html += renderBlock(block, doc.assets);
  }
  return html;
}

function renderBlock(block: Block, assets: Asset[]): string {
  switch (block.type) {
    case 'Heading': {
      const tag = `h${block.level}`;
      return `<${tag}>${renderInlines(block.inlines)}</${tag}>`;
    }

    case 'Paragraph':
      return `<p>${renderInlines(block.inlines)}</p>`;

    case 'List': {
      const tag = block.ordered ? 'ol' : 'ul';
      const startAttr = block.ordered && block.start && block.start !== 1 ? ` start="${block.start}"` : '';
      const items = block.items
        .map((item) => {
          const isTask = item.checked !== null && item.checked !== undefined;
          const innerHtml = item.blocks.map(b => renderBlock(b, assets)).join('');
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
    }

    case 'Blockquote': {
      const inner = block.blocks.map(b => renderBlock(b, assets)).join('');
      return `<blockquote style="border-left:3px solid #d1d5db;padding-left:16px;margin:16px 0;color:#4b5563;">${inner}</blockquote>`;
    }

    case 'Callout': {
      const colors = getCalloutColors(block.calloutType);
      const icon = getCalloutIcon(block.calloutType);
      const inner = block.blocks.map(b => renderBlock(b, assets)).join('');
      const titleHtml = block.title
        ? `<strong style="display:block;margin-bottom:4px;">${escapeHtml(block.title)}</strong>`
        : `<strong style="display:block;margin-bottom:4px;text-transform:capitalize;">${block.calloutType}</strong>`;
      return `<div style="border-left:4px solid ${colors.border};background:${colors.bg};padding:12px 16px;margin:16px 0;border-radius:4px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:16px;">${icon}</span>
          ${titleHtml}
        </div>
        ${inner}
      </div>`;
    }

    case 'CodeBlock': {
      const langLabel = block.language
        ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px;font-family:'JetBrains Mono',monospace;">${escapeHtml(block.language)}</div>`
        : '';
      return `<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin:16px 0;overflow-x:auto;">
        ${langLabel}<pre style="margin:0;white-space:pre;overflow-x:auto;"><code style="font-family:'JetBrains Mono','Fira Code',Consolas,monospace;font-size:13px;line-height:1.5;color:#1f2937;">${escapeHtml(block.value)}</code></pre>
      </div>`;
    }

    case 'Table': {
      const rows = block.rows.map((row, rowIdx) => {
        const isHeader = rowIdx < block.headerRows;
        const cellTag = isHeader ? 'th' : 'td';
        const cells = row.cells
          .map((cell, cellIdx) => {
            const align = block.align?.[cellIdx] ?? null;
            const alignStyle = align ? `text-align:${align};` : '';
            const headerStyle = isHeader ? 'font-weight:600;background:#f3f4f6;' : '';
            const inner = cell.blocks.map(b => renderBlock(b, assets)).join('');
            return `<${cellTag} style="border:1px solid #d1d5db;padding:8px 12px;${alignStyle}${headerStyle}">${inner}</${cellTag}>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table style="border-collapse:collapse;width:100%;margin:16px 0;">${rows}</table>`;
    }

    case 'ThematicBreak':
      return '<hr style="border:none;border-top:1px solid #d1d5db;margin:24px 0;" />';

    case 'ImageBlock': {
      const altAttr = block.alt ? ` alt="${escapeAttr(block.alt)}"` : ' alt=""';
      const titleAttr = block.title ? ` title="${escapeAttr(block.title)}"` : '';
      const asset = assets.find(a => a.id === block.assetId);
      const src = asset?.data || block.src;
      
      return `<figure style="margin:16px 0;text-align:center;">
        <img src="${escapeAttr(src)}"${altAttr}${titleAttr} style="max-width:100%;height:auto;border-radius:4px;" />
        ${block.alt ? `<figcaption style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(block.alt)}</figcaption>` : ''}
      </figure>`;
    }

    case 'DiagramBlock': {
      const asset = assets.find(a => a.id === block.assetId);
      if (asset?.data) {
        return `<figure style="margin:16px 0;text-align:center;"><img src="${escapeAttr(asset.data)}" alt="Diagram" style="max-width:100%;height:auto;border-radius:4px;" /></figure>`;
      }
      return `<pre class="mermaid" style="background:#f3f4f6;padding:16px;border-radius:6px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:0.9em;"><code>${escapeHtml(block.source)}</code></pre>`;
    }

    case 'MathBlock':
      return `<pre style="background:#f3f4f6;padding:16px;border-radius:6px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:0.9em;"><code>${escapeHtml(block.value)}</code></pre>`;

    default:
      return '';
  }
}

function renderInlines(inlines: Inline[], assets?: Asset[]): string {
  return inlines.map(i => renderInline(i, assets)).join('');
}

function renderInline(inline: Inline, assets?: Asset[]): string {
  switch (inline.type) {
    case 'Text':
      return escapeHtml(inline.value);
    case 'Strong':
      return `<strong>${renderInlines(inline.inlines, assets)}</strong>`;
    case 'Emphasis':
      return `<em>${renderInlines(inline.inlines, assets)}</em>`;
    case 'Strike':
      return `<s>${renderInlines(inline.inlines, assets)}</s>`;
    case 'InlineCode':
      return `<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    case 'Link':
      return `<a href="${escapeAttr(inline.url)}" style="color:#2563eb;text-decoration:underline;">${renderInlines(inline.inlines, assets)}</a>`;
    case 'InlineImage': {
      const alt = inline.alt ? ` alt="${escapeAttr(inline.alt)}"` : ' alt=""';
      const asset = assets?.find(a => a.id === inline.assetId);
      const src = asset?.data || inline.src;
      return `<img src="${escapeAttr(src)}"${alt} style="max-height:1.2em;vertical-align:middle;" />`;
    }
    case 'InlineMath':
      return `<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:0.9em;">${escapeHtml(inline.value)}</code>`;
    case 'Break':
      return '<br />';
    default:
      return '';
  }
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

function getCalloutColors(type: CalloutType): { bg: string; border: string } {
  switch (type) {
    case 'note': return { bg: '#eff6ff', border: '#3b82f6' };
    case 'tip': return { bg: '#f0fdf4', border: '#22c55e' };
    case 'important': return { bg: '#f5f3ff', border: '#8b5cf6' };
    case 'warning': return { bg: '#fffbeb', border: '#f59e0b' };
    case 'caution': return { bg: '#fef2f2', border: '#ef4444' };
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
