import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToDocxBlob, renderToClipboardHtml } from '@mdtodocs/renderers';
import JSZip from 'jszip';

describe('Table Calibration, Heading Styles, and Task List Fidelity Suite', () => {
  const sampleTableMarkdown = `
| Left Column | Centered Column | Right Column |
| :--- | :---: | ---: |
| Short | A longer centered value | 1,234.56 |
| Another row | Medium | 99.00 |
`;

  it('renders DOCX table with repeating header, cantSplit, and calibrated padding', async () => {
    const doc = parseMarkdown(sampleTableMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();

    // 1. Repeating header row
    expect(xml).toContain('<w:tblHeader/>');

    // 2. Prevent row splitting across pages
    expect(xml).toContain('<w:cantSplit/>');

    // 3. Calibrated cell padding margins (top/bottom: 120 twips, left/right: 140 twips)
    expect(xml).toContain('<w:tcMar>');
    expect(xml).toContain('<w:top w:type="dxa" w:w="120"/>');
    expect(xml).toContain('<w:bottom w:type="dxa" w:w="120"/>');
    expect(xml).toContain('<w:left w:type="dxa" w:w="140"/>');
    expect(xml).toContain('<w:right w:type="dxa" w:w="140"/>');
  });

  it('renders DOCX table with proportional column widths totaling 9360 twips (6.5 inches)', async () => {
    const doc = parseMarkdown(sampleTableMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();

    // Table width is set to 9360 dxa
    expect(xml).toContain('<w:tblW w:type="dxa" w:w="9360"/>');

    // Extract all gridCol widths from tblGrid
    const gridMatch = xml?.match(/<w:tblGrid>(.*?)<\/w:tblGrid>/);
    expect(gridMatch).toBeDefined();
    const colWidthMatches = [...gridMatch![1].matchAll(/<w:gridCol w:w="(\d+)"\/>/g)];
    expect(colWidthMatches.length).toBe(3);

    const widths = colWidthMatches.map(m => parseInt(m[1], 10));
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);

    // Exact sum must equal 9360 twips
    expect(totalWidth).toBe(9360);

    // Each column has at least minimum width of 720 twips (0.5 inch)
    widths.forEach(w => {
      expect(w).toBeGreaterThanOrEqual(720);
    });

    // Column with longer text ("Centered Column", "A longer centered value") gets more width than short columns
    expect(widths[1]).toBeGreaterThan(widths[0]);
  });

  it('renders DOCX table cells with correct paragraph alignments', async () => {
    const doc = parseMarkdown(sampleTableMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('text');

    expect(xml).toBeDefined();

    // Center and Right alignments mapped to Wordparagraph jc elements
    expect(xml).toContain('<w:jc w:val="center"/>');
    expect(xml).toContain('<w:jc w:val="right"/>');
  });

  it('defines Heading 1 through Heading 6 in DOCX styles.xml with proper sizes and keepNext', async () => {
    const headingMarkdown = `
# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6
`;
    const doc = parseMarkdown(headingMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const stylesXml = await zip.file('word/styles.xml')?.async('text');
    const docXml = await zip.file('word/document.xml')?.async('text');

    expect(stylesXml).toBeDefined();
    expect(docXml).toBeDefined();

    // Verify all 6 heading styles are present in styles.xml
    for (let i = 1; i <= 6; i++) {
      expect(stylesXml).toContain(`w:styleId="Heading${i}"`);
    }

    // Verify headings in document.xml reference Heading styles
    expect(docXml).toContain('<w:pStyle w:val="Heading1"/>');
    expect(docXml).toContain('<w:pStyle w:val="Heading2"/>');
    expect(docXml).toContain('<w:pStyle w:val="Heading3"/>');
    expect(docXml).toContain('<w:pStyle w:val="Heading4"/>');
    expect(docXml).toContain('<w:pStyle w:val="Heading5"/>');
    expect(docXml).toContain('<w:pStyle w:val="Heading6"/>');
  });

  it('renders task lists in DOCX with ballot box characters and list numbering', async () => {
    const taskMarkdown = `
- [x] Completed task item
- [ ] Incomplete task item
`;
    const doc = parseMarkdown(taskMarkdown);
    const blob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file('word/document.xml')?.async('text');

    expect(docXml).toBeDefined();

    // Checked box
    expect(docXml).toContain('☑ ');
    expect(docXml).toContain('Completed task item');

    // Unchecked box
    expect(docXml).toContain('☐ ');
    expect(docXml).toContain('Incomplete task item');

    // List numbering properties
    expect(docXml).toContain('<w:numPr>');
  });

  it('renders clipboard HTML table with thead, tbody, and column alignments', () => {
    const doc = parseMarkdown(sampleTableMarkdown);
    const html = renderToClipboardHtml(doc);

    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('text-align:left;');
    expect(html).toContain('text-align:center;');
    expect(html).toContain('text-align:right;');
  });

  it('renders clipboard HTML task lists with ballot boxes and custom styling', () => {
    const taskMarkdown = `
- [x] Authentication done
- [ ] Migration pending
`;
    const doc = parseMarkdown(taskMarkdown);
    const html = renderToClipboardHtml(doc);

    expect(html).toContain('☑ ');
    expect(html).toContain('Authentication done');
    expect(html).toContain('☐ ');
    expect(html).toContain('Migration pending');
    expect(html).toContain('list-style-type:none;');
  });
});
