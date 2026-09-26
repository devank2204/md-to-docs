import type {
  FolioDocument,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  BlockquoteBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  DiagramBlock,
  MathBlock,
  CalloutBlock,
  CalloutType,
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

import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';

type DocxElement = DocxParagraph | Table;
type DocxInlineElement = TextRun | ExternalHyperlink | ImageRun;

// ─── Constants & Helpers ────────────────────────────────────────

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

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

function extractTextFromRun(run: TextRun): string {
  try {
    const root = (run as any).root;
    if (root && Array.isArray(root)) {
      for (const child of root) {
        if (child && typeof child === 'object' && 'root' in child) {
          const innerRoot = (child as any).root;
          if (typeof innerRoot === 'string') return innerRoot;
          if (Array.isArray(innerRoot)) {
            for (const part of innerRoot) {
              if (typeof part === 'string') return part;
              if (part?.root && typeof part.root === 'string') return part.root;
            }
          }
        }
      }
    }
  } catch {}
  return '';
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

function extractFirstFont(fontStack: string): string {
  return fontStack.split(',')[0].replace(/['"]/g, '').trim();
}

// ─── DOCX Renderer Registry ──────────────────────────────────────

const docxRegistry: RendererRegistry<DocxElement[], DocxInlineElement[]> = {
  blocks: {
    Heading: (block: HeadingBlock, ctx) => {
      const spacingBefore = block.level <= 2 ? ctx.theme.spacing.headingSpacingBeforePt * 1.5 * 20 : ctx.theme.spacing.headingSpacingBeforePt * 20;
      const spacingAfter = ctx.theme.spacing.headingSpacingAfterPt * 20;
      return [
        new DocxParagraph({
          heading: HEADING_MAP[block.level] || HeadingLevel.HEADING_1,
          children: ctx.renderInlines(block.inlines).flat(),
          spacing: { before: spacingBefore, after: spacingAfter },
        })
      ];
    },
    Paragraph: (block: ParagraphBlock, ctx) => {
      const indentLevel = ctx.state.indentLevel || 0;
      return [
        new DocxParagraph({
          children: ctx.renderInlines(block.inlines).flat(),
          spacing: { after: ctx.theme.spacing.paragraphSpacingPt * 20 },
          indent: indentLevel > 0 ? { left: convertInchesToTwip(0.5 * indentLevel) } : undefined,
        })
      ];
    },
    List: (block: ListBlock, ctx) => {
      const indentLevel = ctx.state.indentLevel || 0;
      const result: DocxElement[] = [];
      const reference = block.ordered ? 'mdtodocs-ordered-list' : 'mdtodocs-unordered-list';

      for (const item of block.items) {
        const isTask = item.checked !== null && item.checked !== undefined;
        
        for (let i = 0; i < item.blocks.length; i++) {
          const child = item.blocks[i];

          if (child.type === 'Paragraph' && i === 0) {
            const inlineChildren = ctx.renderInlines((child as ParagraphBlock).inlines).flat();

            if (isTask) {
              const checkChar = item.checked ? '☑' : '☐';
              inlineChildren.unshift(
                new TextRun({ text: checkChar + ' ', font: 'Segoe UI Symbol' })
              );
            }

            result.push(
              new DocxParagraph({
                children: inlineChildren,
                numbering: isTask ? undefined : { reference, level: indentLevel },
                indent: isTask ? { left: convertInchesToTwip(0.5 * (indentLevel + 1)) } : undefined,
                spacing: { after: 60 },
              })
            );
          } else if (child.type === 'List') {
            const nestedCtx = { ...ctx, state: { ...ctx.state, indentLevel: indentLevel + 1 } };
            result.push(...nestedCtx.renderBlock(child));
          } else {
            const nestedCtx = { ...ctx, state: { ...ctx.state, indentLevel: indentLevel + 1 } };
            result.push(...nestedCtx.renderBlock(child));
          }
        }
      }
      return result;
    },
    Blockquote: (block: BlockquoteBlock, ctx) => {
      const result: DocxElement[] = [];
      const indentLevel = ctx.state.indentLevel || 0;
      const borderColor = ctx.theme.colors.blockquoteBorder;
      const textColor = ctx.theme.colors.blockquoteText;

      for (const child of block.blocks) {
        if (child.type === 'Paragraph') {
          result.push(
            new DocxParagraph({
              children: ctx.renderInlines((child as ParagraphBlock).inlines).flat(),
              indent: { left: convertInchesToTwip(0.5) },
              border: { left: { style: BorderStyle.SINGLE, size: 6, space: 10, color: borderColor } },
              spacing: { after: ctx.theme.spacing.paragraphSpacingPt * 20 },
              run: { color: textColor, italics: true },
            })
          );
        } else {
          const nestedCtx = { ...ctx, state: { ...ctx.state, indentLevel: indentLevel + 1 } };
          result.push(...nestedCtx.renderBlock(child));
        }
      }
      return result;
    },
    Callout: (block: CalloutBlock, ctx) => {
      const colors = ctx.theme.colors.callouts[block.calloutType] || ctx.theme.colors.callouts.note;
      const icon = getCalloutTextIcon(block.calloutType);
      const result: DocxElement[] = [];

      const titleText = block.title || block.calloutType.charAt(0).toUpperCase() + block.calloutType.slice(1);
      result.push(
        new DocxParagraph({
          children: [new TextRun({ text: `${icon} ${titleText}`, bold: true, color: colors.text, size: ctx.theme.typography.baseFontSizePt * 2 })],
          border: { left: { style: BorderStyle.SINGLE, size: 8, space: 10, color: colors.border } },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg },
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { before: 120, after: 40 },
        })
      );

      for (const child of block.blocks) {
        if (child.type === 'Paragraph') {
          result.push(
            new DocxParagraph({
              children: ctx.renderInlines((child as ParagraphBlock).inlines).flat(),
              border: { left: { style: BorderStyle.SINGLE, size: 8, space: 10, color: colors.border } },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg },
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: ctx.theme.spacing.paragraphSpacingPt * 20 },
            })
          );
        } else {
          result.push(...ctx.renderBlock(child));
        }
      }
      return result;
    },
    CodeBlock: (block: CodeBlock, ctx) => {
      const lines = block.value.split('\n');
      const result: DocxParagraph[] = [];
      const codeFont = extractFirstFont(ctx.theme.typography.codeFont);
      const bg = ctx.theme.colors.codeBackground;
      const color = ctx.theme.colors.codeText;
      const borderColor = ctx.theme.colors.border;
      const sizeHalfPts = (ctx.theme.typography.baseFontSizePt - 1) * 2;

      if (block.language) {
        result.push(
          new DocxParagraph({
            children: [new TextRun({ text: block.language, font: codeFont, size: sizeHalfPts - 2, color: ctx.theme.colors.secondary })],
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: bg },
            spacing: { before: 160, after: 0 },
            indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
            },
          })
        );
      }

      for (let i = 0; i < lines.length; i++) {
        const isFirst = i === 0 && !block.language;
        const isLast = i === lines.length - 1;
        result.push(
          new DocxParagraph({
            children: [new TextRun({ text: lines[i] || ' ', font: codeFont, size: sizeHalfPts, color })],
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: bg },
            spacing: { before: isFirst ? 160 : 0, after: isLast ? 160 : 0, line: 276 },
            indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
            border: {
              top: isFirst ? { style: BorderStyle.SINGLE, size: 1, color: borderColor } : undefined,
              bottom: isLast ? { style: BorderStyle.SINGLE, size: 1, color: borderColor } : undefined,
              left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
            },
          })
        );
      }
      return result;
    },
    Table: (block: TableBlock, ctx) => {
      const borderColor = ctx.theme.colors.border;
      const headerBg = ctx.theme.colors.tableHeaderBackground;
      
      const rows = block.rows.map((row, rowIdx) => {
        const isHeader = rowIdx < block.headerRows;
        const cells = row.cells.map((cell, cellIdx) => {
          const align = block.align?.[cellIdx] ?? null;
          const alignment = align === 'center'
            ? AlignmentType.CENTER
            : align === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT;

          const cellCtx = isHeader ? { ...ctx, state: { ...ctx.state, parentBold: true } } : ctx;

          const paragraphs = cell.blocks.map((b) => {
            if (b.type === 'Paragraph') {
              return new DocxParagraph({
                children: cellCtx.renderInlines((b as ParagraphBlock).inlines).flat(),
                alignment,
                spacing: { before: 40, after: 40 },
              });
            }
            return new DocxParagraph({ children: [new TextRun({ text: '' })] });
          });

          return new TableCell({
            children: paragraphs.length > 0 ? paragraphs : [new DocxParagraph({ children: [new TextRun({ text: '' })] })],
            shading: isHeader ? { type: ShadingType.CLEAR, color: 'auto', fill: headerBg } : undefined,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
            },
          });
        });

        return new TableRow({
          children: cells,
          tableHeader: isHeader,
        });
      });

      return [new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })];
    },
    ThematicBreak: (_block, ctx) => {
      return [
        new DocxParagraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border, space: 8 } },
          spacing: { before: 240, after: 240 },
        })
      ];
    },
    ImageBlock: (block: ImageBlock, ctx) => {
      const asset = ctx.assets.find(a => a.id === block.assetId);
      const altText = block.alt || 'Image';
      
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

      return [
        new DocxParagraph({
          children: [
            new TextRun({ text: `[Image: ${altText}]`, color: ctx.theme.colors.secondary, italics: true, size: ctx.theme.typography.baseFontSizePt * 2 - 2 }),
            new TextRun({ text: `  (${block.src})`, color: '9CA3AF', size: 16 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 160 },
        })
      ];
    },
    DiagramBlock: (block: DiagramBlock, ctx) => {
      if (block.renderStatus === 'error') {
        return [
          new DocxParagraph({
            children: [
              new TextRun({
                text: `[Diagram Warning: Mermaid diagram could not be rendered. The original Mermaid source was preserved.]`,
                color: ctx.theme.colors.callouts.caution.text,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        ];
      }

      const asset = ctx.assets.find(a => a.id === block.assetId);
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
            new TextRun({ text: `[Diagram: ${block.diagramType}]`, color: ctx.theme.colors.secondary, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        })
      ];
    },
    MathBlock: (block: MathBlock) => {
      return [
        new DocxParagraph({
          children: [new TextRun({ text: block.value, font: 'Cambria Math' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        })
      ];
    }
  },
  inlines: {
    Text: (inline: TextInline, ctx) => [new TextRun({ text: inline.value, bold: ctx.state.parentBold })],
    Strong: (inline: StrongInline, ctx) => {
      const nestedCtx = { ...ctx, state: { ...ctx.state, parentBold: true } };
      return nestedCtx.renderInlines(inline.inlines).flat();
    },
    Emphasis: (inline: EmphasisInline, ctx) => {
      const runs = ctx.renderInlines(inline.inlines).flat();
      return runs.map((run) => {
        if (run instanceof TextRun) {
          return new TextRun({ text: extractTextFromRun(run), bold: ctx.state.parentBold, italics: true });
        }
        return run;
      });
    },
    Strike: (inline: StrikeInline, ctx) => {
      const runs = ctx.renderInlines(inline.inlines).flat();
      return runs.map((run) => {
        if (run instanceof TextRun) {
          return new TextRun({ text: extractTextFromRun(run), bold: ctx.state.parentBold, strike: true });
        }
        return run;
      });
    },
    InlineCode: (inline: InlineCode, ctx) => {
      return [
        new TextRun({
          text: inline.value,
          font: extractFirstFont(ctx.theme.typography.codeFont),
          size: (ctx.theme.typography.baseFontSizePt - 1) * 2,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: ctx.theme.colors.codeBackground },
        })
      ];
    },
    Link: (inline: LinkInline, ctx) => {
      const linkChildren = ctx.renderInlines(inline.inlines).flat();
      const textRuns = linkChildren.filter((r): r is TextRun => r instanceof TextRun).map(
        (run) => new TextRun({
          text: extractTextFromRun(run),
          style: 'Hyperlink',
          color: ctx.theme.colors.primary,
          underline: { type: 'single' as any },
          bold: ctx.state.parentBold,
        })
      );
      if (textRuns.length > 0) {
        return [new ExternalHyperlink({ link: inline.url, children: textRuns })];
      }
      return textRuns;
    },
    InlineImage: (inline: InlineImageInline, ctx) => {
      const asset = ctx.assets.find(a => a.id === inline.assetId);
      if (asset && asset.data) {
        try {
          const imgData = base64ToUint8Array(asset.data);
          let width = asset.dimensions?.width || 20;
          let height = asset.dimensions?.height || 20;
          
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
              transformation: { width: Math.round(width), height: Math.round(height) },
            }),
          ];
        } catch (e) {
          console.warn("Failed to embed inline image in docx", e);
        }
      }
      return [new TextRun({ text: `[${inline.alt || 'image'}]`, color: ctx.theme.colors.secondary, italics: true })];
    },
    InlineMath: (inline: InlineMath) => [new TextRun({ text: inline.value, font: 'Cambria Math', italics: true })],
    Break: () => [new TextRun({ break: 1 })],
  },
  fallbackBlock: () => [],
  fallbackInline: () => []
};

const docxRenderer = new DocumentRenderer(docxRegistry);

export async function renderToDocxBlob(doc: FolioDocument, theme?: DocumentTheme): Promise<Blob> {
  const children = docxRenderer.render(doc, { indentLevel: 0 }, theme).flat();
  
  // Create styles based on theme

  const docxDoc = new DocxDocument({
    styles: {
      default: {
        document: {
          run: {
            font: theme ? extractFirstFont(theme.typography.bodyFont) : 'Arial',
            size: theme ? theme.typography.baseFontSizePt * 2 : 22,
            color: theme ? theme.colors.text : '1A1A1A',
          },
          paragraph: {
            spacing: { line: theme ? theme.spacing.lineHeight * 240 : 360 }, // 240 twips = 1 line (1.0). 1.5 = 360.
          },
        },
      },
      paragraphStyles: [
        {
          id: 'CodeBlock',
          name: 'Code Block',
          basedOn: 'Normal',
          run: { font: theme ? extractFirstFont(theme.typography.codeFont) : 'Consolas', size: 20 },
          paragraph: { spacing: { before: 40, after: 40, line: 276 } },
        },
        // Setup heading styles
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { 
            size: theme ? theme.typography.headingSizesPt[1] * 2 : 48, 
            bold: true,
            font: theme ? extractFirstFont(theme.typography.headingFont) : 'Arial'
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { 
            size: theme ? theme.typography.headingSizesPt[2] * 2 : 36, 
            bold: true,
            font: theme ? extractFirstFont(theme.typography.headingFont) : 'Arial'
          },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { 
            size: theme ? theme.typography.headingSizesPt[3] * 2 : 28, 
            bold: true,
            font: theme ? extractFirstFont(theme.typography.headingFont) : 'Arial'
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
            style: { paragraph: { indent: { left: convertInchesToTwip(0.5 * (i + 1)), hanging: convertInchesToTwip(0.25) } } },
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
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5 * (i + 1)), hanging: convertInchesToTwip(0.25) } } },
            };
          }),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
            margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(docxDoc);
}
