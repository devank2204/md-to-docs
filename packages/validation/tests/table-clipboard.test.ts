import { describe, it, expect } from 'vitest';
import {
  serializeTableToTsv,
  serializeTableToCsv,
  serializeTableToHtml,
  serializeTableToMarkdown,
  type TableData,
} from '@mdtodocs/renderers';

describe('Table Clipboard Fidelity Engine', () => {
  const sampleTable: TableData = {
    headers: ['Product', 'Region', 'Revenue ($)', 'Notes'],
    rows: [
      ['Alpha Suite', 'US-East', '120,500.00', 'Enterprise contract, renews Q4'],
      ['Beta App', 'EU-Central', '85,200.50', 'Includes "premium" add-ons\nand support'],
      ['Gamma Core', 'APAC', '45,000.00', 'New rollout'],
    ],
    alignments: ['left', 'center', 'right', 'left'],
  };

  it('serializes table to clean TSV for Excel and Google Sheets', () => {
    const tsv = serializeTableToTsv(sampleTable);
    const lines = tsv.split('\r\n');

    expect(lines.length).toBe(4);
    expect(lines[0]).toBe('Product\tRegion\tRevenue ($)\tNotes');
    // Multiline cell flattened to spaces in TSV so columns don't shift
    expect(lines[2]).toContain('Beta App\tEU-Central\t85,200.50\tIncludes "premium" add-ons and support');
  });

  it('serializes table to RFC 4180 compliant CSV', () => {
    const csv = serializeTableToCsv(sampleTable);
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(4);
    expect(lines[0]).toBe('Product,Region,Revenue ($),Notes');

    // Values containing commas must be quoted
    expect(lines[1]).toBe('Alpha Suite,US-East,"120,500.00","Enterprise contract, renews Q4"');

    // Embedded quotes must be doubled and multiline quoted
    expect(lines[2]).toContain('"Includes ""premium"" add-ons\nand support"');
  });

  it('serializes table to styled HTML preserving cell alignments and borders', () => {
    const html = serializeTableToHtml(sampleTable);

    expect(html).toContain('<table style="border-collapse:collapse;');
    expect(html).toContain('<thead><tr>');
    expect(html).toContain('<th style="');
    expect(html).toContain('text-align:right;">Revenue ($)</th>');
    expect(html).toContain('text-align:center;">Region</th>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<td style="');
    expect(html).toContain('text-align:right;">120,500.00</td>');
  });

  it('serializes table to clean Markdown table with alignments', () => {
    const md = serializeTableToMarkdown(sampleTable);
    const lines = md.split('\n');

    expect(lines.length).toBe(5);
    expect(lines[0]).toContain('| Product');
    expect(lines[1]).toMatch(/\|\s*:--+\s*\|\s*:--+:\s*\|\s*--+:\s*\|/);
    expect(lines[2]).toContain('| Alpha Suite');
    expect(lines[3]).toContain('Includes "premium" add-ons<br />and support');
  });
});
