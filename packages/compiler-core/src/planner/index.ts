import { visit } from 'unist-util-visit';
import type { Root, Table, List } from 'mdast';
import { evaluateCapability } from '@mdtodocs/capability-graph';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { DiagnosticsCollector } from '../diagnostics';

export function planRepresentation(
  doc: Root,
  destination: DestinationType,
  collector: DiagnosticsCollector
): Root {
  // We mutate a clone of the AST if we want pure functions, but for now we'll mutate in place
  // since the parser returns a fresh AST on every change.

  visit(doc, (node: any, index, parent) => {
    if (!node.type) return;

    const cap = evaluateCapability(node.type, node, destination);

    if (cap.requiresPolyfill && cap.transformTo === 'list' && node.type === 'table') {
      collector.add({
        severity: 'warning',
        message: cap.reason || 'Table requires polyfill',
        suggestedAction: 'Converted wide table to a linearized list to prevent layout overflow.',
      });

      const listNode = transformTableToList(node as Table);
      if (parent && index !== undefined) {
        parent.children[index] = listNode;
      }
      return 'skip'; // Skip visiting children of this node
    }

    // For styled/transformed blocks, add info diagnostics so the fidelity panel can report
    if (cap.support === 'styled' && node.type !== 'blockquote' && node.type !== 'thematicBreak') {
      collector.add({
        severity: 'info',
        message: `${node.type} rendered with custom styling (not a native ${destination} element)`,
      });
    }

    if (cap.support === 'unsupported' && node.type === 'image') {
      collector.add({
        severity: 'warning',
        message: 'Inline images not supported',
        suggestedAction: 'Converted inline image to link',
      });
      const linkNode = {
        type: 'link',
        url: node.url,
        title: node.title,
        children: [{ type: 'text', value: node.alt || 'Image' }],
      };
      if (parent && index !== undefined) {
        parent.children[index] = linkNode;
      }
      return 'skip';
    }
  });

  return doc;
}

function transformTableToList(table: Table): List {
  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: table.children.map((row) => {
      const children: any[] = [];
      row.children.forEach((cell) => {
        children.push(...cell.children);
      });
      return { type: 'listItem', spread: false, children };
    }),
  };
}
