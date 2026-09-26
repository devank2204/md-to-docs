import type {
  FolioDocument,
  Block,
  Inline,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  BlockquoteBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  CalloutBlock,
  CalloutType,
  Asset,
} from '@mdtodocs/compiler-core';

import {
  Document as DocxDocument,
  Paragraph as DocxParagraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  ShadingType,
  convertInchesToTwip,
  LevelFormat,
  ImageRun,
} from 'docx';

// ─── DOCX Renderer ──────────────────────────────────────────────
// Renders FolioDocument IR into a downloadable Word .docx blob.
// Uses native Word styles and structures wherever possible.

export async function renderToDocxBlob(doc: FolioDocument): Promise<Blob> {
  const children = renderBlocks(doc.blocks, 0, doc.assets);

  const docxDoc = new DocxDocument({
    styles: {
      paragraphStyles: [
        {
          id: 'CodeBlock',
          name: 'Code Block',
          basedOn: 'Normal',
          run: {
            font: 'Consolas',
            size: 20, // 10pt
          },
          paragraph: {
            spacing: { before: 40, after: 40, line: 276 },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'mdtodocs-ordered-list',
          levels: Array.from({ length: 9 }, (_, i) => ({
            level: i,
            format: LevelFormat.DECIMAL,
            text: `%${i + 1}.`,
            alignment: AlignmentType.START,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5 * (i + 1)), hanging: convertInchesToTwip(0.25) },
              },
            },
          })),
        },
        {
          reference: 'mdtodocs-unordered-list',
          levels: Array.from({ length: 9 }, (_, i) => {
            const bullets = ['●', '○', '■', '●', '○', '■', '●', '○', '■'];
            return {
              level: i,
              format: LevelFormat.BULLET,
              text: bullets[i],
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5 * (i + 1)), hanging: convertInchesToTwip(0.25) },
                },
              },
            };
          }),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11),
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(docxDoc);
}

// ─── Block Rendering ────────────────────────────────────────────

function renderBlocks(blocks: Block[], indentLevel: number, assets: Asset[]): (DocxParagraph | Table)[] {
  const result: (DocxParagraph | Table)[] = [];
  for (const block of blocks) {
    result.push(...renderBlock(block, indentLevel, assets));
  }
  return result;
}

function renderBlock(block: Block, indentLevel: number, assets: Asset[]): (DocxParagraph | Table)[] {
  switch (block.type) {
    case 'Heading':
      return [renderHeading(block, assets)];
    case 'Paragraph':
      return [renderParagraph(block, indentLevel, assets)];
    case 'List':
      return renderList(block, indentLevel, assets);
    case 'Blockquote':
      return renderBlockquote(block, indentLevel, assets);
    case 'Callout':
      return renderCallout(block, indentLevel, assets);
    case 'CodeBlock':
      return renderCodeBlock(block);
    case 'Table':
      return [renderTable(block, assets)];
    case 'ThematicBreak':
      return [renderThematicBreak()];
    case 'ImageBlock':
      return renderImageBlock(block, assets);
    case 'DiagramBlock':
      return renderDiagramBlock(block, assets);
    case 'MathBlock':
      return renderMathBlock(block);
    default:
      return [];
  }
}

// ─── Headings ───────────────────────────────────────────────────

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

function renderHeading(block: HeadingBlock, assets: Asset[]): DocxParagraph {
  return new DocxParagraph({
    heading: HEADING_MAP[block.level] || HeadingLevel.HEADING_1,
    children: renderInlinesToDocx(block.inlines, assets),
    spacing: { before: 240, after: 120 },
  });
}

// ─── Paragraphs ─────────────────────────────────────────────────

function renderParagraph(block: ParagraphBlock, indentLevel: number, assets: Asset[]): DocxParagraph {
  return new DocxParagraph({
    children: renderInlinesToDocx(block.inlines, assets),
    spacing: { after: 120 },
    indent: indentLevel > 0 ? { left: convertInchesToTwip(0.5 * indentLevel) } : undefined,
  });
}

// ─── Lists ──────────────────────────────────────────────────────

function renderList(block: ListBlock, indentLevel: number, assets: Asset[]): (DocxParagraph | Table)[] {
  const result: (DocxParagraph | Table)[] = [];
  const reference = block.ordered ? 'mdtodocs-ordered-list' : 'mdtodocs-unordered-list';

  for (const item of block.items) {
    const isTask = item.checked !== null && item.checked !== undefined;

    for (let i = 0; i < item.blocks.length; i++) {
      const child = item.blocks[i];

      if (child.type === 'Paragraph' && i === 0) {
        const inlineChildren = renderInlinesToDocx(child.inlines);

        // Prepend checkbox for task lists
        if (isTask) {
          const checkChar = item.checked ? '☑' : '☐';
          inlineChildren.unshift(
            new TextRun({ text: checkChar + ' ', font: 'Segoe UI Symbol' })
          );
        }

        result.push(
          new DocxParagraph({
            children: inlineChildren,
            numbering: isTask
              ? undefined
              : { reference, level: indentLevel },
            indent: isTask
              ? { left: convertInchesToTwip(0.5 * (indentLevel + 1)) }
              : undefined,
            spacing: { after: 60 },
          })
        );
      } else if (child.type === 'List') {
        // Nested list — recurse with incremented indent
        result.push(...renderList(child, indentLevel + 1, assets));
      } else {
        result.push(...renderBlock(child, indentLevel + 1, assets));
      }
    }
  }

  return result;
}

// ─── Blockquotes ────────────────────────────────────────────────

function renderBlockquote(block: BlockquoteBlock, indentLevel: number, assets: Asset[]): (DocxParagraph | Table)[] {
  const result: (DocxParagraph | Table)[] = [];

  for (const child of block.blocks) {
    if (child.type === 'Paragraph') {
      result.push(
        new DocxParagraph({
          children: renderInlinesToDocx(child.inlines),
          indent: {
            left: convertInchesToTwip(0.5),
          },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 6,
              space: 10,
              color: 'AAAAAA',
            },
          },
          spacing: { after: 80 },
          run: {
            color: '555555',
            italics: true,
          },
        })
      );
    } else {
      result.push(...renderBlock(child, indentLevel + 1, assets));
    }
  }

  return result;
}

// ─── Callouts ───────────────────────────────────────────────────

function renderCallout(block: CalloutBlock, indentLevel: number, assets: Asset[]): (DocxParagraph | Table)[] {
  const colors = getCalloutDocxColors(block.calloutType);
  const icon = getCalloutTextIcon(block.calloutType);
  const result: (DocxParagraph | Table)[] = [];

  // Title row
  const titleText = block.title || block.calloutType.charAt(0).toUpperCase() + block.calloutType.slice(1);
  result.push(
    new DocxParagraph({
      children: [
        new TextRun({ text: `${icon} ${titleText}`, bold: true, color: colors.text, size: 22 }),
      ],
      border: {
        left: { style: BorderStyle.SINGLE, size: 8, space: 10, color: colors.border },
      },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg },
      indent: { left: convertInchesToTwip(0.25) },
      spacing: { before: 120, after: 40 },
    })
  );

  // Content
  for (const child of block.blocks) {
    if (child.type === 'Paragraph') {
      result.push(
        new DocxParagraph({
          children: renderInlinesToDocx(child.inlines),
          border: {
            left: { style: BorderStyle.SINGLE, size: 8, space: 10, color: colors.border },
          },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg },
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 80 },
        })
      );
    } else {
      result.push(...renderBlock(child, indentLevel, assets));
    }
  }

  return result;
}

// ─── Code Blocks ────────────────────────────────────────────────

function renderCodeBlock(block: CodeBlock): (DocxParagraph | Table)[] {
  const lines = block.value.split('\n');
  const result: DocxParagraph[] = [];

  // Language label
  if (block.language) {
    result.push(
      new DocxParagraph({
        children: [
          new TextRun({
            text: block.language,
            font: 'Consolas',
            size: 16,
            color: '6B7280',
          }),
        ],
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
        spacing: { before: 160, after: 0 },
        indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
        },
      })
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const isFirst = i === 0 && !block.language;
    const isLast = i === lines.length - 1;
    result.push(
      new DocxParagraph({
        children: [
          new TextRun({
            text: lines[i] || ' ', // Preserve empty lines
            font: 'Consolas',
            size: 20,
            color: '1F2937',
          }),
        ],
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
        spacing: { before: isFirst ? 160 : 0, after: isLast ? 160 : 0, line: 276 },
        indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
        border: {
          top: isFirst ? { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } : undefined,
          bottom: isLast ? { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } : undefined,
          left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
        },
      })
    );
  }

  return result;
}

// ─── Tables ─────────────────────────────────────────────────────

function renderTable(block: TableBlock, assets: Asset[]): Table {
  const rows = block.rows.map((row, rowIdx) => {
    const isHeader = rowIdx < block.headerRows;
    const cells = row.cells.map((cell, cellIdx) => {
      const align = block.align?.[cellIdx] ?? null;
      const alignment = align === 'center'
        ? AlignmentType.CENTER
        : align === 'right'
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT;

      const paragraphs = cell.blocks.map((b) => {
        if (b.type === 'Paragraph') {
          return new DocxParagraph({
            children: renderInlinesToDocx(b.inlines, assets, isHeader),
            alignment,
            spacing: { before: 40, after: 40 },
          });
        }
        return new DocxParagraph({
          children: [new TextRun({ text: '' })],
        });
      });

      return new TableCell({
        children: paragraphs.length > 0 ? paragraphs : [new DocxParagraph({ children: [new TextRun({ text: '' })] })],
        shading: isHeader
          ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' }
          : undefined,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
        },
      });
    });

    return new TableRow({
      children: cells,
      tableHeader: isHeader,
    });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Thematic Break ─────────────────────────────────────────────

function renderThematicBreak(): DocxParagraph {
  return new DocxParagraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 8 },
    },
    spacing: { before: 240, after: 240 },
  });
}

// ─── Image Block ────────────────────────────────────────────────

function base64ToUint8Array(base64DataUri: string): Uint8Array {
  const base64Part = base64DataUri.split(',')[1] || base64DataUri;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64Part, 'base64'));
  }
  const binaryString = atob(base64Part.trim());
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function renderImageBlock(block: ImageBlock, assets: Asset[]): DocxParagraph[] {
  const asset = assets.find(a => a.id === block.assetId);
  const altText = block.alt || 'Image';
  
  if (asset && asset.data) {
    try {
      const imgData = base64ToUint8Array(asset.data);
      
      // Calculate dimensions (max width of ~6 inches to fit page)
      // Word twips = inches * 1440, but ImageRun uses pixels (approx 96dpi)
      let width = asset.dimensions?.width || 500;
      let height = asset.dimensions?.height || 500;
      
      const MAX_WIDTH = 600; 
      if (width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / width;
        width = MAX_WIDTH;
        height = height * ratio;
      }

      return [
        new DocxParagraph({
          children: [
            new ImageRun({
              type: 'png',
              data: imgData,
              transformation: {
                width: Math.round(width),
                height: Math.round(height),
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 160 },
        }),
      ];
    } catch (e) {
      console.warn("Failed to embed image in docx", e);
    }
  }

  // Fallback to placeholder if asset not available or failed
  return [
    new DocxParagraph({
      children: [
        new TextRun({
          text: `[Image: ${altText}]`,
          color: '6B7280',
          italics: true,
          size: 20,
        }),
        new TextRun({
          text: `  (${block.src})`,
          color: '9CA3AF',
          size: 16,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 160 },
    })
  ];
}

function renderDiagramBlock(block: any, assets: any[]): DocxParagraph[] {
  if (block.renderStatus === 'error') {
    return [
      new DocxParagraph({
        children: [
          new TextRun({
            text: `[Diagram Warning: Mermaid diagram could not be rendered. The original Mermaid source was preserved.]`,
            color: 'EF4444',
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    ];
  }

  const asset = assets.find(a => a.id === block.assetId);
  if (asset && asset.data) {
    try {
      const imgData = base64ToUint8Array(asset.data);
      let width = asset.dimensions?.width || 500;
      let height = asset.dimensions?.height || 500;
      
      const MAX_WIDTH = 600; 
      if (width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / width;
        width = MAX_WIDTH;
        height = height * ratio;
      }

      const imageExt = asset.type === 'svg' ? 'svg' : 'png';

      return [
        new DocxParagraph({
          children: [
            new ImageRun({
              type: imageExt as any,
              data: imgData,
              transformation: {
                width: Math.round(width),
                height: Math.round(height),
              },
              altText: {
                title: `Diagram: ${block.diagramType}`,
                name: `Diagram: ${block.diagramType}`,
                description: block.source || '',
              }
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
          keepNext: false,
          keepLines: true,
        })
      ];
    } catch (e) {
      console.warn("Failed to embed diagram in docx", e);
    }
  }
  
  return [
    new DocxParagraph({
      children: [
        new TextRun({
          text: `[Diagram: ${block.diagramType}]`,
          color: '6B7280',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  ];
}

function renderMathBlock(block: any): DocxParagraph[] {
  return [
    new DocxParagraph({
      children: [
        new TextRun({
          text: block.value,
          font: 'Cambria Math',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
    })
  ];
}

// ─── Inline Rendering ───────────────────────────────────────────

function renderInlinesToDocx(inlines: Inline[], assets: Asset[] = [], bold?: boolean): (TextRun | ExternalHyperlink | ImageRun)[] {
  const result: (TextRun | ExternalHyperlink | ImageRun)[] = [];

  for (const inline of inlines) {
    const runs = renderInlineToDocx(inline, assets, bold);
    result.push(...runs);
  }

  return result;
}

function renderInlineToDocx(inline: Inline, assets: Asset[], parentBold?: boolean): (TextRun | ExternalHyperlink | ImageRun)[] {
  switch (inline.type) {
    case 'Text':
      return [new TextRun({ text: inline.value, bold: parentBold })];

    case 'Strong':
      return inline.inlines.flatMap((child) => renderInlineToDocx(child, assets, true));

    case 'Emphasis':
      return inline.inlines.flatMap((child) => {
        const runs = renderInlineToDocx(child, assets, parentBold);
        return runs.map((run) => {
          if (run instanceof TextRun) {
            // Re-create with italics — TextRun doesn't have a setter
            return new TextRun({
              text: extractTextFromRun(run),
              bold: parentBold,
              italics: true,
            });
          }
          return run;
        });
      });

    case 'Strike':
      return inline.inlines.flatMap((child) => {
        const runs = renderInlineToDocx(child, assets, parentBold);
        return runs.map((run) => {
          if (run instanceof TextRun) {
            return new TextRun({
              text: extractTextFromRun(run),
              bold: parentBold,
              strike: true,
            });
          }
          return run;
        });
      });

    case 'InlineCode':
      return [
        new TextRun({
          text: inline.value,
          font: 'Consolas',
          size: 20,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
        }),
      ];

    case 'Link': {
      const linkChildren = inline.inlines.flatMap((child) => renderInlineToDocx(child, assets, parentBold));
      // Filter to only TextRun for hyperlink children
      const textRuns = linkChildren.filter((r): r is TextRun => r instanceof TextRun).map(
        (run) =>
          new TextRun({
            text: extractTextFromRun(run),
            style: 'Hyperlink',
            color: '2563EB',
            underline: { type: 'single' as any },
            bold: parentBold,
          })
      );
      if (textRuns.length > 0) {
        return [
          new ExternalHyperlink({
            link: inline.url,
            children: textRuns,
          }),
        ];
      }
      return textRuns;
    }

    case 'InlineImage': {
      const asset = assets.find(a => a.id === inline.assetId);
      if (asset && asset.data) {
        try {
          const imgData = base64ToUint8Array(asset.data);
          let width = asset.dimensions?.width || 20;
          let height = asset.dimensions?.height || 20;
          
          // Constrain inline image height to approx line height (e.g., 24px)
          const MAX_HEIGHT = 24;
          if (height > MAX_HEIGHT) {
            const ratio = MAX_HEIGHT / height;
            height = MAX_HEIGHT;
            width = width * ratio;
          }

          return [
            new ImageRun({
              type: 'png',
              data: imgData,
              transformation: {
                width: Math.round(width),
                height: Math.round(height),
              },
            }),
          ];
        } catch (e) {
          console.warn("Failed to embed inline image in docx", e);
        }
      }
      
      return [
        new TextRun({
          text: `[${inline.alt || 'image'}]`,
          color: '6B7280',
          italics: true,
        }),
      ];
    }

    case 'InlineMath':
      return [
        new TextRun({
          text: (inline as any).value,
          font: 'Cambria Math',
          italics: true,
        }),
      ];

    case 'Break':
      return [new TextRun({ break: 1 })];

    default:
      return [];
  }
}

// ─── Utilities ──────────────────────────────────────────────────

// Extract text content from a TextRun for re-creation with different styles.
// docx.js TextRun stores text in its options, we track it through creation.
function extractTextFromRun(run: TextRun): string {
  // Access internal root to get text content
  try {
    const root = (run as any).root;
    if (root && Array.isArray(root)) {
      for (const child of root) {
        if (child && typeof child === 'object' && 'root' in child) {
          const innerRoot = (child as any).root;
          if (typeof innerRoot === 'string') {
            return innerRoot;
          }
          if (Array.isArray(innerRoot)) {
            for (const part of innerRoot) {
              if (typeof part === 'string') return part;
              if (part?.root && typeof part.root === 'string') return part.root;
            }
          }
        }
      }
    }
  } catch {
    // Fallback
  }
  return '';
}

function getCalloutDocxColors(type: CalloutType): { bg: string; border: string; text: string } {
  switch (type) {
    case 'note': return { bg: 'EFF6FF', border: '3B82F6', text: '1E40AF' };
    case 'tip': return { bg: 'F0FDF4', border: '22C55E', text: '166534' };
    case 'important': return { bg: 'F5F3FF', border: '8B5CF6', text: '5B21B6' };
    case 'warning': return { bg: 'FFFBEB', border: 'F59E0B', text: '92400E' };
    case 'caution': return { bg: 'FEF2F2', border: 'EF4444', text: '991B1B' };
  }
}

function getCalloutTextIcon(type: CalloutType): string {
  switch (type) {
    case 'note': return 'ℹ';
    case 'tip': return '💡';
    case 'important': return '❗';
    case 'warning': return '⚠';
    case 'caution': return '🔴';
  }
}
