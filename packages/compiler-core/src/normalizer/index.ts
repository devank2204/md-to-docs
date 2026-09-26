import type { Root, Content, PhrasingContent } from 'mdast';
import type {
  FolioDocument,
  Block,
  Inline,
  SourcePosition,
  CalloutType,
  TableCellAlignment,
  Asset,
} from '../ir/types';

let assetCounter = 0;

function nextAssetId(): string {
  return `asset-${++assetCounter}`;
}

function extractPosition(node: { position?: { start: { line: number; column: number; offset?: number }; end: { line: number; column: number; offset?: number } } }): SourcePosition | undefined {
  if (!node.position) return undefined;
  return {
    startLine: node.position.start.line,
    startColumn: node.position.start.column,
    endLine: node.position.end.line,
    endColumn: node.position.end.column,
    startOffset: node.position.start.offset ?? 0,
    endOffset: node.position.end.offset ?? 0,
  };
}

// ─── Callout detection ──────────────────────────────────────────

const GITHUB_CALLOUT_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

function detectCallout(blocks: Block[]): { calloutType: CalloutType; title?: string; blocks: Block[] } | null {
  if (blocks.length === 0) return null;

  const first = blocks[0];
  if (first.type !== 'Paragraph' || first.inlines.length === 0) return null;

  // Check for GitHub-style: > [!WARNING]
  const firstInline = first.inlines[0];
  if (firstInline.type === 'Text') {
    const match = firstInline.value.match(GITHUB_CALLOUT_RE);
    if (match) {
      const calloutType = match[1].toLowerCase() as CalloutType;
      const remainingText = firstInline.value.slice(match[0].length);
      const newInlines = remainingText
        ? [{ type: 'Text' as const, value: remainingText }, ...first.inlines.slice(1)]
        : first.inlines.slice(1);
      const newBlocks = newInlines.length > 0
        ? [{ ...first, inlines: newInlines }, ...blocks.slice(1)]
        : blocks.slice(1);
      return { calloutType, blocks: newBlocks };
    }
  }

  // Check for bold-prefix style: > **Warning:** text
  if (firstInline.type === 'Strong' && firstInline.inlines.length === 1) {
    const strongText = firstInline.inlines[0];
    if (strongText.type === 'Text') {
      const cleaned = strongText.value.replace(/[:!]\s*$/, '');
      const lower = cleaned.toLowerCase();
      if (['note', 'tip', 'important', 'warning', 'caution'].includes(lower)) {
        const calloutType = lower as CalloutType;
        const newBlocks = [{ ...first, inlines: first.inlines.slice(1) }, ...blocks.slice(1)];
        return { calloutType, title: cleaned, blocks: newBlocks };
      }
    }
  }

  return null;
}

// ─── Main normalizer ────────────────────────────────────────────

export function normalizeMdast(root: Root): FolioDocument {
  assetCounter = 0;
  const assets: Asset[] = [];

  const blocks = root.children
    .map((node) => normalizeBlock(node, assets))
    .filter(Boolean) as Block[];

  return {
    version: '1.0.0',
    metadata: {},
    blocks,
    assets,
  };
}

function normalizeBlock(node: Content, assets: Asset[]): Block | null {
  const position = extractPosition(node);

  switch (node.type) {
    case 'heading':
      return {
        type: 'Heading',
        level: node.depth as 1 | 2 | 3 | 4 | 5 | 6,
        inlines: normalizeInlines(node.children, assets),
        position,
      };

    case 'paragraph': {
      // Check if this paragraph is a standalone image
      if (node.children.length === 1 && node.children[0].type === 'image') {
        const img = node.children[0];
        const assetId = nextAssetId();
        assets.push({
          id: assetId,
          type: 'image',
          src: img.url,
          mimeType: undefined,
        });
        return {
          type: 'ImageBlock',
          src: img.url,
          alt: img.alt ?? undefined,
          title: img.title ?? undefined,
          assetId,
          position,
        };
      }
      return {
        type: 'Paragraph',
        inlines: normalizeInlines(node.children, assets),
        position,
      };
    }

    case 'list':
      return {
        type: 'List',
        ordered: node.ordered ?? false,
        start: node.start ?? undefined,
        items: node.children.map((item) => ({
          checked: item.checked ?? null,
          blocks: item.children
            .map((child) => normalizeBlock(child, assets))
            .filter(Boolean) as Block[],
        })),
        position,
      };

    case 'blockquote': {
      const innerBlocks = node.children
        .map((child) => normalizeBlock(child, assets))
        .filter(Boolean) as Block[];

      // Detect callouts
      const callout = detectCallout(innerBlocks);
      if (callout) {
        return {
          type: 'Callout',
          calloutType: callout.calloutType,
          title: callout.title,
          blocks: callout.blocks,
          position,
        };
      }

      return {
        type: 'Blockquote',
        blocks: innerBlocks,
        position,
      };
    }

    case 'code': {
      if (node.lang === 'mermaid') {
        const assetId = nextAssetId();
        assets.push({
          id: assetId,
          type: 'diagram-source',
          src: 'mermaid',
          data: node.value,
        });
        return {
          type: 'DiagramBlock',
          diagramType: 'mermaid',
          source: node.value,
          assetId,
          position,
        };
      }
      return {
        type: 'CodeBlock',
        language: node.lang ?? undefined,
        value: node.value,
        position,
      };
    }

    case 'math':
      return {
        type: 'MathBlock',
        value: node.value,
        position,
      };

    case 'thematicBreak':
      return {
        type: 'ThematicBreak',
        position,
      };

    case 'table': {
      const alignments: (TableCellAlignment | null)[] = (node.align ?? []).map(
        (a) => (a as TableCellAlignment) ?? null
      );
      return {
        type: 'Table',
        headerRows: 1,
        rows: node.children.map((row) => ({
          cells: row.children.map((cell) => ({
            blocks: [
              {
                type: 'Paragraph' as const,
                inlines: normalizeInlines(cell.children, assets),
              },
            ],
          })),
        })),
        align: alignments.length > 0 ? alignments : undefined,
        position,
      };
    }

    case 'html':
      // Preserve HTML as a paragraph with raw text for now
      return {
        type: 'Paragraph',
        inlines: [{ type: 'Text', value: node.value }],
        position,
      };

    default:
      console.warn(`Unsupported block node type: ${node.type}`);
      return null;
  }
}

function normalizeInlines(nodes: PhrasingContent[], assets: Asset[]): Inline[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text':
        return { type: 'Text' as const, value: node.value };
      case 'strong':
        return { type: 'Strong' as const, inlines: normalizeInlines(node.children, assets) };
      case 'emphasis':
        return { type: 'Emphasis' as const, inlines: normalizeInlines(node.children, assets) };
      case 'delete':
        return { type: 'Strike' as const, inlines: normalizeInlines(node.children, assets) };
      case 'inlineCode':
        return { type: 'InlineCode' as const, value: node.value };
      case 'link':
        return {
          type: 'Link' as const,
          url: node.url,
          title: node.title ?? undefined,
          inlines: normalizeInlines(node.children, assets),
        };
      case 'image': {
        const assetId = nextAssetId();
        assets.push({
          id: assetId,
          type: 'image',
          src: node.url,
        });
        return {
          type: 'InlineImage' as const,
          src: node.url,
          alt: node.alt ?? undefined,
          title: node.title ?? undefined,
          assetId,
        };
      }
      case 'break':
        return { type: 'Break' as const };
      case 'inlineMath':
        return { type: 'InlineMath' as const, value: (node as any).value };
      default:
        console.warn(`Unsupported inline node type: ${(node as any).type}`);
        return { type: 'Text' as const, value: '' } as Inline;
    }
  });
}
