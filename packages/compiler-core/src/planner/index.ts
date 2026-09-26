import type { FolioDocument, Block, TableBlock, ListBlock } from '../ir/types';
import { evaluateCapability } from '@folio/capability-graph';
import type { DestinationType } from '@folio/capability-graph';
import { DiagnosticsCollector } from '../diagnostics';

export function planRepresentation(doc: FolioDocument, destination: DestinationType, collector: DiagnosticsCollector): FolioDocument {
  const newBlocks = doc.blocks.map(block => optimizeBlock(block, destination, collector));
  return {
    ...doc,
    blocks: newBlocks
  };
}

function optimizeBlock(block: Block, destination: DestinationType, collector: DiagnosticsCollector): Block {
  const cap = evaluateCapability(block.type, block, destination);

  if (cap.requiresPolyfill && block.type === 'Table') {
    collector.add({
      severity: 'warning',
      message: cap.reason || 'Table requires polyfill',
      suggestedAction: 'Converted table to a linearized list structure to prevent layout overflow.'
    });

    return transformTableToList(block as TableBlock);
  }

  return block;
}

function transformTableToList(table: TableBlock): ListBlock {
  return {
    type: 'List',
    ordered: false,
    items: table.rows.map(row => {
      // Just extract all cell paragraphs into a single list item for the polyfill
      const blocks: Block[] = [];
      row.cells.forEach(cell => {
        blocks.push(...cell.blocks);
      });
      return { blocks };
    })
  };
}
