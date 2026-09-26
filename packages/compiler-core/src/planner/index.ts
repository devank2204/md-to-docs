import type { FolioDocument, Block, TableBlock, ListBlock } from '../ir/types';
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
