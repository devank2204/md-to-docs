import type { FolioDocument, Inline } from '@folio/compiler-core';
// Using docx package for Word generation
import { Document as DocxDocument, Paragraph as DocxParagraph, TextRun as DocxTextRun, Packer } from 'docx';

export function renderToHtml(doc: FolioDocument): string {
  let html = '<div>';
  
  for (const block of doc.blocks) {
    if (block.type === 'Heading') {
      const level = block.level;
      html += `<h${level}>${renderInlinesToHtml(block.inlines)}</h${level}>`;
    } else if (block.type === 'Paragraph') {
      html += `<p>${renderInlinesToHtml(block.inlines)}</p>`;
    } else if (block.type === 'List') {
      const tag = block.ordered ? 'ol' : 'ul';
      html += `<${tag}>`;
      for (const item of block.items) {
        html += '<li>';
        for (const itemBlock of item.blocks) {
           if (itemBlock.type === 'Paragraph') {
             html += `<p>${renderInlinesToHtml(itemBlock.inlines)}</p>`;
           }
        }
        html += '</li>';
      }
      html += `</${tag}>`;
    }
    // Simple basic fallback for now
  }
  
  html += '</div>';
  return html;
}

function renderInlinesToHtml(inlines: Inline[]): string {
  return inlines.map(inline => {
    switch (inline.type) {
      case 'Text': return inline.value;
      case 'Strong': return `<strong>${renderInlinesToHtml(inline.inlines)}</strong>`;
      case 'Emphasis': return `<em>${renderInlinesToHtml(inline.inlines)}</em>`;
      case 'InlineCode': return `<code>${inline.value}</code>`;
      case 'Link': return `<a href="${inline.url}">${renderInlinesToHtml(inline.inlines)}</a>`;
      default: return '';
    }
  }).join('');
}

export async function renderToDocxBlob(doc: FolioDocument): Promise<Blob> {
  const children: any[] = [];
  
  for (const block of doc.blocks) {
    if (block.type === 'Heading') {
      const headingMap: Record<number, any> = {
        1: 'Heading1', 2: 'Heading2', 3: 'Heading3', 4: 'Heading4', 5: 'Heading5', 6: 'Heading6'
      };
      children.push(
        new DocxParagraph({
          text: extractPlainText(block.inlines),
          heading: headingMap[block.level] || 'Heading1'
        })
      );
    } else if (block.type === 'Paragraph') {
      children.push(
        new DocxParagraph({
          children: block.inlines.map(createDocxTextRun).filter(Boolean) as DocxTextRun[]
        })
      );
    }
  }

  const docxDoc = new DocxDocument({
    sections: [{
      children
    }]
  });

  return await Packer.toBlob(docxDoc);
}

function createDocxTextRun(inline: Inline): DocxTextRun | null {
  if (inline.type === 'Text') {
    return new DocxTextRun({ text: inline.value });
  } else if (inline.type === 'Strong') {
    return new DocxTextRun({ text: extractPlainText(inline.inlines), bold: true });
  } else if (inline.type === 'Emphasis') {
    return new DocxTextRun({ text: extractPlainText(inline.inlines), italics: true });
  }
  return null;
}

function extractPlainText(inlines: Inline[]): string {
  return inlines.map(inline => {
    if (inline.type === 'Text' || inline.type === 'InlineCode') return inline.value;
    if ('inlines' in inline) return extractPlainText(inline.inlines);
    return '';
  }).join('');
}
