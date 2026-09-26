import type { FolioDocument, Block, TableBlock, ListBlock, Inline, ParagraphBlock, HeadingBlock, LinkInline } from '../ir/types';
import { evaluateCapability } from '@mdtodocs/capability-graph';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { DiagnosticsCollector } from '../diagnostics';

export function planRepresentation(
  doc: FolioDocument,
  destination: DestinationType,
  collector: DiagnosticsCollector
): FolioDocument {
  const newBlocks = doc.blocks.map((block) => optimizeBlock(block, destination, collector));
  return {
    ...doc,
    blocks: newBlocks,
  };
}

function optimizeBlock(
  block: Block,
  destination: DestinationType,
  collector: DiagnosticsCollector
): Block {
  const cap = evaluateCapability(block.type, block, destination);

  if (cap.requiresPolyfill && cap.transformTo === 'List' && block.type === 'Table') {
    collector.add({
      severity: 'warning',
      message: cap.reason || 'Table requires polyfill',
      suggestedAction: 'Converted wide table to a linearized list to prevent layout overflow.',
    });
    return transformTableToList(block as TableBlock);
  }

  // For styled/transformed blocks, add info diagnostics so the fidelity panel can report
  if (cap.support === 'styled' && block.type !== 'Blockquote' && block.type !== 'ThematicBreak') {
    collector.add({
      severity: 'info',
      message: `${block.type} rendered with custom styling (not a native ${destination} element)`,
      nodeId: block.id,
    });
  }

  // Recurse into container blocks
  if (block.type === 'Blockquote') {
    return {
      ...block,
      blocks: block.blocks.map((b) => optimizeBlock(b, destination, collector)),
    };
  }

  if (block.type === 'Heading') {
    return {
      ...block,
      inlines: optimizeInlines((block as HeadingBlock).inlines, destination, collector),
    };
  }

  if (block.type === 'Paragraph') {
    return {
      ...block,
      inlines: optimizeInlines((block as ParagraphBlock).inlines, destination, collector),
    };
  }

  if (block.type === 'Callout') {
    return {
      ...block,
      blocks: block.blocks.map((b) => optimizeBlock(b, destination, collector)),
    };
  }

  if (block.type === 'List') {
    return {
      ...block,
      items: block.items.map((item) => ({
        ...item,
        blocks: item.blocks.map((b) => optimizeBlock(b, destination, collector)),
      })),
    };
  }

  if (block.type === 'Table') {
    return {
      ...block,
      rows: block.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => ({
          ...cell,
          blocks: cell.blocks.map((b) => optimizeBlock(b, destination, collector)),
        })),
      })),
    };
  }

  return block;
}

function transformTableToList(table: TableBlock): ListBlock {
  return {
    type: 'List',
    ordered: false,
    items: table.rows.map((row) => {
      const blocks: Block[] = [];
      row.cells.forEach((cell) => {
        blocks.push(...cell.blocks);
      });
      return { checked: null, blocks };
    }),
  };
}

function optimizeInlines(
  inlines: Inline[],
  destination: DestinationType,
  collector: DiagnosticsCollector
): Inline[] {
  return inlines.map((inline) => {
    const cap = evaluateCapability(inline.type, inline, destination);

    if (cap.support === 'unsupported' && inline.type === 'InlineImage') {
      // Degrade InlineImage to Link
      collector.add({
        severity: 'warning',
        message: 'Inline images not supported',
        suggestedAction: 'Converted inline image to link',
      });
      return {
        type: 'Link',
        url: (inline as any).src,
        title: (inline as any).title,
        inlines: [{ type: 'Text', value: (inline as any).alt || 'Image' }],
      } as LinkInline;
    }

    if ('inlines' in inline && Array.isArray(inline.inlines)) {
      return {
        ...inline,
        inlines: optimizeInlines(inline.inlines, destination, collector),
      };
    }
    return inline;
  }) as Inline[];
}
