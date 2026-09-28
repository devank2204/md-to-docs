import type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdTable, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';
import type { DocumentTheme } from '@mdtodocs/compiler-core';
import type { ResolvedAsset } from '@mdtodocs/asset-pipeline';
import { DocumentRenderer } from './core/Renderer';
import type { RendererRegistry } from './core/Renderer';
import {
  Document as DocxDocument,
  Paragraph as DocxParagraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  ShadingType,
  convertInchesToTwip,
  LevelFormat,
  ImageRun,
  Footer,
} from 'docx';

function parseDataUri(dataUri: string): { type: 'png' | 'jpg' | 'gif' | 'bmp' | 'svg', data: Uint8Array } {
  // Extract mime type and base64 string
  const match = dataUri.match(/^data:image\/(png|jpeg|jpg|gif|bmp|svg\+xml);base64,(.+)$/);
  
  if (match) {
    let type = match[1];
    if (type === 'jpeg') type = 'jpg';
    if (type === 'svg+xml') type = 'svg';
    
    const base64 = match[2];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { type: type as any, data: bytes };
  }
  
  // Fallback to old behavior if it's not a standard data URI (e.g. raw base64)
  const binaryString = atob(dataUri);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { type: 'png', data: bytes };
}

function extractTextFromRun(run: TextRun): string {
  // @ts-ignore - reaching into docx internal structure
  return run.root[0].root;
}

function extractFirstFont(fontStack: string): string {
  return fontStack.split(',')[0].replace(/['"]/g, '').trim();
}

function getCalloutTextIcon(type: string): string {
  switch (type) {
    case 'tip': return '💡';
    case 'warning': return '⚠️';
    case 'caution': return '🛑';
    case 'important': return '❗';
    case 'note':
    default:
      return '📝';
  }
}

type DocxInlineNode = TextRun | ExternalHyperlink | ImageRun;
type DocxNode = DocxParagraph | DocxTable | DocxInlineNode;

const docxRegistry: RendererRegistry<DocxNode[]> = {
  nodes: {
    heading: (block: Heading, ctx) => {
      let level: any;
      switch (block.depth) {
        case 1: level = HeadingLevel.HEADING_1; break;
        case 2: level = HeadingLevel.HEADING_2; break;
        case 3: level = HeadingLevel.HEADING_3; break;
        case 4: level = HeadingLevel.HEADING_4; break;
        case 5: level = HeadingLevel.HEADING_5; break;
        case 6: level = HeadingLevel.HEADING_6; break;
        default: level = HeadingLevel.HEADING_1;
      }
      return [new DocxParagraph({ children: ctx.renderNodes(block.children).flat() as DocxInlineNode[], heading: level })];
    },
    paragraph: (block: Paragraph, ctx) => {
      return [new DocxParagraph({ children: ctx.renderNodes(block.children).flat() as DocxInlineNode[] })];
    },
    list: (block: List, ctx) => {
      const reference = block.ordered ? 'mdtodocs-ordered-list' : 'mdtodocs-unordered-list';
      return block.children.flatMap((item: any) => {
        return item.children.flatMap((c: Node, idx: number) => {
          if (c.type === 'paragraph' && idx === 0) {
            const p = c as Paragraph;
            return [new DocxParagraph({
              children: ctx.renderNodes(p.children).flat() as DocxInlineNode[],
              numbering: { reference, level: Math.min(ctx.state.indentLevel || 0, 8) }
            })];
          }
          const nestedCtx = { ...ctx, state: { ...ctx.state, indentLevel: (ctx.state.indentLevel || 0) + 1 } };
          return nestedCtx.renderNode(c);
        });
      });
    },
    blockquote: (block: Blockquote, ctx) => {
      return block.children.flatMap(c => {
        if (c.type === 'paragraph') {
          const p = c as Paragraph;
          return [new DocxParagraph({
            children: ctx.renderNodes(p.children).flat() as DocxInlineNode[],
            border: { left: { color: ctx.theme.colors.border, space: 10, size: 20, style: BorderStyle.SINGLE } },
            indent: { left: 360 }
          })];
        }
        return ctx.renderNode(c);
      });
    },
    containerDirective: (block: any /* ContainerDirective */, ctx) => {
      const type = block.attributes?.type || 'note';
      const colors = ctx.theme.colors.callouts[type as keyof typeof ctx.theme.colors.callouts] || ctx.theme.colors.callouts.note;
      
      const content = block.children.flatMap((c: Node) => {
        if (c.type === 'paragraph') {
          const p = c as Paragraph;
          return new DocxParagraph({
            children: ctx.renderNodes(p.children).flat() as DocxInlineNode[],
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg }
          });
        }
        return ctx.renderNode(c);
      });
      
      return [
        new DocxTable({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.SINGLE, size: 24, color: colors.border },
          },
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg },
                  margins: { left: 200, right: 200, top: 100, bottom: 100 },
                  children: [
                    new DocxParagraph({
                      children: [new TextRun({ text: `${getCalloutTextIcon(type)} ${type.toUpperCase()}`, bold: true, color: colors.text })],
                      shading: { type: ShadingType.CLEAR, color: 'auto', fill: colors.bg }
                    }),
                    ...content,
                  ],
                })
              ]
            })
          ]
        })
      ];
    },
    code: (block: Code, ctx) => {
      if (block.lang === 'mermaid') {
        const asset = (block.data as any)?.resolvedAsset as ResolvedAsset | undefined;
        if (asset && asset.data) {
          try {
            const parsed = parseDataUri(asset.data);
            const imageOptions: any = {
              type: parsed.type,
              data: parsed.data,
              transformation: { width: 500, height: 300 },
            };
            if (parsed.type === 'svg') {
              imageOptions.fallback = {
                type: 'png',
                data: parseDataUri('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=').data
              };
            }
            return [
              new DocxParagraph({
                children: [
                  new ImageRun(imageOptions),
                ],
                alignment: AlignmentType.CENTER,
              })
            ];
          } catch(e) {}
        }
        return [new DocxParagraph({ children: [new TextRun({ text: `[Diagram: mermaid]` })], alignment: AlignmentType.CENTER })];
      }
      
      const codeFont = extractFirstFont(ctx.theme.typography.codeFont);
      const sizeHalfPts = ctx.theme.typography.baseFontSizePt * 2;
      const lines = block.value.split('\n');
      
      const docxLines = lines.map((line, i) => {
        const isFirst = i === 0 && !block.lang;
        const isLast = i === lines.length - 1;
        
        return new DocxParagraph({
          children: [new TextRun({ text: line || ' ', font: codeFont, size: sizeHalfPts })],
          style: 'CodeBlock',
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: ctx.theme.colors.codeBackground },
          spacing: { before: isFirst ? 120 : 0, after: isLast ? 120 : 0 },
        });
      });
      
      const header = block.lang ? [
        new DocxParagraph({
          children: [new TextRun({ text: block.lang, font: codeFont, size: sizeHalfPts - 2, color: ctx.theme.colors.secondary })],
          style: 'CodeBlock',
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: ctx.theme.colors.codeBackground },
          spacing: { before: 120, after: 0 },
        })
      ] : [];

      return [...header, ...docxLines];
    },
    table: (block: MdTable, ctx) => {
      const rows = block.children.map((row: any, rowIdx: number) => {
        const isHeader = rowIdx === 0;
        
        const cells = row.children.map((cell: any) => {
          const paragraphs = cell.children.map((b: Node) => {
            if (b.type === 'paragraph') {
              const p = b as Paragraph;
              return new DocxParagraph({ children: ctx.renderNodes(p.children).flat() as DocxInlineNode[] });
            }
            return ctx.renderNode(b);
          }).flat() as DocxParagraph[];
          
          if (paragraphs.length === 0) {
            paragraphs.push(new DocxParagraph({ children: [] }));
          }

          return new DocxTableCell({
            children: paragraphs,
            shading: isHeader ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' } : undefined,
            margins: { left: 100, right: 100, top: 100, bottom: 100 },
          });
        });
        
        return new DocxTableRow({
          children: cells,
          tableHeader: isHeader,
        });
      });
      
      return [new DocxTable({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
          left: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
          right: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: ctx.theme.colors.border },
        }
      })];
    },
    thematicBreak: () => {
      return [new DocxParagraph({
        children: [],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB', space: 1 } },
        spacing: { before: 240, after: 240 }
      })];
    },
    image: (block: Image, ctx) => {
      const asset = (block.data as any)?.resolvedAsset as ResolvedAsset | undefined;
      if (asset && asset.data) {
        try {
          const parsed = parseDataUri(asset.data);
          let width = asset.dimensions?.width || 500;
          let height = asset.dimensions?.height || 300;
          
          const MAX_WIDTH = 600;
          if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * ratio;
          }

          const imageOptions: any = {
            type: parsed.type,
            data: parsed.data,
            transformation: { width: Math.round(width), height: Math.round(height) },
            altText: {
              title: block.alt || 'Image',
              name: block.alt || 'Image',
              description: block.alt || '',
            }
          };
          if (parsed.type === 'svg') {
            imageOptions.fallback = {
              type: 'png',
              data: parseDataUri('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=').data
            };
          }

          return [
            new DocxParagraph({
              children: [
                new ImageRun(imageOptions),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 240 },
            })
          ];
        } catch (e) {
          console.warn("Failed to embed image in docx", e);
        }
      }
      return [new DocxParagraph({ children: [new TextRun({ text: `[Image: ${block.alt || block.url}]`, color: ctx.theme.colors.secondary, italics: true })] })];
    },
    math: (block: any /* Math */) => {
      return [
        new DocxParagraph({
          children: [new TextRun({ text: block.value, font: 'Cambria Math' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        })
      ];
    },
    text: (inline: Text, ctx) => [new TextRun({ text: inline.value, bold: ctx.state.parentBold })],
    strong: (inline: Strong, ctx) => {
      const nestedCtx = { ...ctx, state: { ...ctx.state, parentBold: true } };
      return nestedCtx.renderNodes(inline.children).flat();
    },
    emphasis: (inline: Emphasis, ctx) => {
      const runs = ctx.renderNodes(inline.children).flat();
      return runs.map((run: any) => {
        if (run instanceof TextRun) {
          return new TextRun({ text: extractTextFromRun(run), bold: ctx.state.parentBold, italics: true });
        }
        return run;
      });
    },
    delete: (inline: Delete, ctx) => {
      const runs = ctx.renderNodes(inline.children).flat();
      return runs.map((run: any) => {
        if (run instanceof TextRun) {
          return new TextRun({ text: extractTextFromRun(run), bold: ctx.state.parentBold, strike: true });
        }
        return run;
      });
    },
    inlineCode: (inline: InlineCode, ctx) => {
      return [
        new TextRun({
          text: inline.value,
          font: extractFirstFont(ctx.theme.typography.codeFont),
          size: (ctx.theme.typography.baseFontSizePt - 1) * 2,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: ctx.theme.colors.codeBackground },
        })
      ];
    },
    link: (inline: Link, ctx) => {
      const linkChildren = ctx.renderNodes(inline.children).flat();
      const textRuns = linkChildren.filter((r: any): r is TextRun => r instanceof TextRun).map(
        (run: any) => new TextRun({
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
    image_inline: (inline: Image, ctx) => {
      const asset = (inline.data as any)?.resolvedAsset as ResolvedAsset | undefined;
      if (asset && asset.data) {
        try {
          const parsed = parseDataUri(asset.data);
          let width = asset.dimensions?.width || 20;
          let height = asset.dimensions?.height || 20;
          
          const MAX_HEIGHT = 24;
          if (height > MAX_HEIGHT) {
            const ratio = MAX_HEIGHT / height;
            height = MAX_HEIGHT;
            width = width * ratio;
          }

          const imageOptions: any = {
            type: parsed.type,
            data: parsed.data,
            transformation: { width: Math.round(width), height: Math.round(height) },
          };
          if (parsed.type === 'svg') {
            imageOptions.fallback = {
              type: 'png',
              data: parseDataUri('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=').data
            };
          }

          return [
            new ImageRun(imageOptions),
          ];
        } catch (e) {
          console.warn("Failed to embed inline image in docx", e);
        }
      }
      return [new TextRun({ text: `[${inline.alt || 'image'}]`, color: ctx.theme.colors.secondary, italics: true })];
    },
    inlineMath: (inline: any /* InlineMath */) => [new TextRun({ text: inline.value, font: 'Cambria Math', italics: true })],
    break: () => [new TextRun({ break: 1 })],
  },
  fallbackNode: () => []
};

const docxRenderer = new DocumentRenderer<DocxNode[]>(docxRegistry);

export async function renderToDocxBlob(doc: Root, theme?: DocumentTheme, signature?: { enabled: boolean; placement: 'every-page' | 'last-page' }): Promise<Blob> {
  const children = docxRenderer.render(doc, { indentLevel: 0 }, theme).flat();
  
  let footerConfig = undefined;
  
  if (signature?.enabled) {
    const signaturePara = new DocxParagraph({
      children: [new TextRun({ text: "made with mdtodocs.com", font: 'Caveat', size: 24, color: '888888' })],
      alignment: AlignmentType.RIGHT,
    });
    
    if (signature.placement === 'every-page') {
      footerConfig = {
        default: new Footer({
          children: [signaturePara],
        }),
      };
    } else {
      children.push(new DocxParagraph({ children: [] })); // spacer
      children.push(signaturePara);
    }
  }
  
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
        footers: footerConfig,
        children: children as any,
      },
    ],
  });

  return await Packer.toBlob(docxDoc);
}
