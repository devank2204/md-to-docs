export interface TableData {
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

/**
 * Extracts structured TableData from an HTMLTableElement.
 */
export function parseTableElement(tableEl: HTMLTableElement): TableData {
  const headers: string[] = [];
  let rows: string[][] = [];
  const alignments: ('left' | 'center' | 'right')[] = [];

  const thElements = Array.from(tableEl.querySelectorAll('thead th, thead td'));
  
  if (thElements.length > 0) {
    thElements.forEach((th) => {
      headers.push(cleanCellText(th.textContent || ''));
      alignments.push(resolveAlignment(th as HTMLElement));
    });

    const tbodyRows = Array.from(tableEl.querySelectorAll('tbody tr'));
    rows = tbodyRows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      return cells.map((cell) => cleanCellText(cell.textContent || ''));
    });
  } else {
    // If no thead, use the first tr as header if multiple rows exist
    const allTrs = Array.from(tableEl.querySelectorAll('tr'));
    if (allTrs.length > 0) {
      const firstRowCells = Array.from(allTrs[0].querySelectorAll('th, td'));
      firstRowCells.forEach((cell) => {
        headers.push(cleanCellText(cell.textContent || ''));
        alignments.push(resolveAlignment(cell as HTMLElement));
      });

      rows = allTrs.slice(1).map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td, th'));
        return cells.map((cell) => cleanCellText(cell.textContent || ''));
      });
    } else {
      rows = [];
    }
  }

  return { headers, rows, alignments };
}

function resolveAlignment(el: HTMLElement): 'left' | 'center' | 'right' {
  const styleAlign = el.style.textAlign?.toLowerCase();
  if (styleAlign === 'center') return 'center';
  if (styleAlign === 'right') return 'right';

  const attrAlign = el.getAttribute('align')?.toLowerCase();
  if (attrAlign === 'center') return 'center';
  if (attrAlign === 'right') return 'right';

  return 'left';
}

function cleanCellText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\t/g, ' ')
    .trim();
}

function normalizeInput(input: TableData | HTMLTableElement): TableData {
  if (typeof HTMLElement !== 'undefined' && input instanceof HTMLElement) {
    return parseTableElement(input as HTMLTableElement);
  }
  return input as TableData;
}

/**
 * Serializes table data into Tab-Separated Values (TSV).
 * This format natively pastes into multi-cell grids in Excel, Google Sheets, and Numbers.
 */
export function serializeTableToTsv(input: TableData | HTMLTableElement): string {
  const { headers, rows } = normalizeInput(input);
  const lines: string[] = [];

  if (headers.length > 0) {
    lines.push(headers.map((h) => cleanCellText(h)).join('\t'));
  }

  for (const row of rows) {
    lines.push(row.map((c) => cleanCellText(c)).join('\t'));
  }

  return lines.join('\r\n');
}

/**
 * Serializes table data into standard RFC 4180 Comma-Separated Values (CSV).
 */
export function serializeTableToCsv(input: TableData | HTMLTableElement): string {
  const { headers, rows } = normalizeInput(input);
  const lines: string[] = [];

  const escapeCsv = (val: string): string => {
    const cleaned = val.replace(/\r\n|\r/g, '\n');
    if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
      return `"${cleaned.replace(/"/g, '""')}"`;
    }
    return cleaned;
  };

  if (headers.length > 0) {
    lines.push(headers.map(escapeCsv).join(','));
  }

  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }

  return lines.join('\r\n');
}

/**
 * Serializes table data into a self-contained, beautifully styled HTML table.
 * Preserves alignments, borders, and header backgrounds when pasted into Word, Docs, or Excel.
 */
export function serializeTableToHtml(input: TableData | HTMLTableElement): string {
  const { headers, rows, alignments } = normalizeInput(input);

  const tableStyle =
    'border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;width:100%;margin:16px 0;';
  const thStyleBase =
    'border:1px solid #d1d5db;background-color:#f3f4f6;color:#111827;font-weight:600;padding:8px 12px;vertical-align:top;';
  const tdStyleBase =
    'border:1px solid #e5e7eb;color:#374151;padding:8px 12px;vertical-align:top;';

  const theadRows: string[] = [];
  if (headers.length > 0) {
    const ths = headers.map((h, i) => {
      const align = alignments?.[i] || 'left';
      return `<th style="${thStyleBase}text-align:${align};">${escapeHtml(h)}</th>`;
    });
    theadRows.push(`<tr>${ths.join('')}</tr>`);
  }

  const tbodyRows = rows.map((row) => {
    const tds = row.map((cell, i) => {
      const align = alignments?.[i] || 'left';
      return `<td style="${tdStyleBase}text-align:${align};">${escapeHtml(cell)}</td>`;
    });
    return `<tr>${tds.join('')}</tr>`;
  });

  const theadHtml = theadRows.length > 0 ? `<thead>${theadRows.join('')}</thead>` : '';
  const tbodyHtml = tbodyRows.length > 0 ? `<tbody>${tbodyRows.join('')}</tbody>` : '';

  return `<table style="${tableStyle}">${theadHtml}${tbodyHtml}</table>`;
}

/**
 * Serializes table data into GitHub Flavored Markdown (GFM).
 */
export function serializeTableToMarkdown(input: TableData | HTMLTableElement): string {
  const { headers, rows, alignments } = normalizeInput(input);
  if (headers.length === 0 && rows.length === 0) return '';

  const formatMdCell = (cell: string) => {
    return cell
      .replace(/\r\n|\r|\n/g, '<br />')
      .replace(/\|/g, '\\|')
      .trim();
  };

  const formattedHeaders = headers.map(formatMdCell);
  const formattedRows = rows.map((r) => r.map(formatMdCell));

  const colCount = Math.max(formattedHeaders.length, ...formattedRows.map((r) => r.length));
  const colWidths = new Array(colCount).fill(3);

  // Measure widths
  formattedHeaders.forEach((h, i) => {
    colWidths[i] = Math.max(colWidths[i], h.length);
  });
  formattedRows.forEach((r) => {
    r.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i], cell.length);
    });
  });

  const pad = (str: string, len: number, align: 'left' | 'center' | 'right' = 'left') => {
    if (align === 'right') return str.padStart(len, ' ');
    if (align === 'center') {
      const total = len - str.length;
      const left = Math.floor(total / 2);
      const right = total - left;
      return ' '.repeat(left) + str + ' '.repeat(right);
    }
    return str.padEnd(len, ' ');
  };

  const headerLine = `| ${formattedHeaders.map((h, i) => pad(h, colWidths[i], alignments?.[i])).join(' | ')} |`;
  const separatorLine = `| ${colWidths
    .map((w, i) => {
      const align = alignments?.[i] || 'left';
      if (align === 'center') return `:${'-'.repeat(Math.max(1, w - 2))}:`;
      if (align === 'right') return `${'-'.repeat(Math.max(2, w - 1))}:`;
      return `:${'-'.repeat(Math.max(2, w - 1))}`;
    })
    .join(' | ')} |`;

  const bodyLines = formattedRows.map(
    (row) => `| ${row.map((cell, i) => pad(cell, colWidths[i], alignments?.[i])).join(' | ')} |`
  );

  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type TableCopyFormat = 'excel' | 'csv' | 'tsv' | 'markdown';

/**
 * Copies table data to the system clipboard in the requested format.
 * - 'excel': writes multi-mime text/html + text/plain (TSV) for seamless paste into Excel/Sheets/Docs/Word.
 * - 'csv': writes RFC 4180 CSV text.
 * - 'tsv': writes TSV text.
 * - 'markdown': writes clean GFM table text.
 */
export async function copyTableToClipboard(
  input: TableData | HTMLTableElement,
  format: TableCopyFormat
): Promise<void> {
  const tableData = normalizeInput(input);
  const tsv = serializeTableToTsv(tableData);
  const csv = serializeTableToCsv(tableData);
  const html = serializeTableToHtml(tableData);
  const markdown = serializeTableToMarkdown(tableData);

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (format === 'excel') {
      if (typeof window !== 'undefined' && (window as any).ClipboardItem) {
        try {
          const htmlBlob = new Blob([html], { type: 'text/html' });
          const textBlob = new Blob([tsv], { type: 'text/plain' });
          const item = new (window as any).ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          });
          await navigator.clipboard.write([item]);
          return;
        } catch {
          // If multi-mime fails in restrictive permissions, fall back to writing plain TSV
          await navigator.clipboard.writeText(tsv);
          return;
        }
      }
      await navigator.clipboard.writeText(tsv);
      return;
    }

    if (format === 'csv') {
      await navigator.clipboard.writeText(csv);
      return;
    }

    if (format === 'tsv') {
      await navigator.clipboard.writeText(tsv);
      return;
    }

    if (format === 'markdown') {
      await navigator.clipboard.writeText(markdown);
      return;
    }
  }

  throw new Error('Clipboard API not supported in this environment');
}
