import type { Root, Content, PhrasingContent } from 'mdast';
import type { 
  FolioDocument, 
  Block, 
  Inline 
} from '../ir/types';

export function normalizeMdast(root: Root): FolioDocument {
  return {
    version: '1.0.0',
    blocks: root.children.map(normalizeBlock).filter(Boolean) as Block[]
  };
}

function normalizeBlock(node: Content): Block | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'Heading',
        level: node.depth as any,
        inlines: normalizeInlines(node.children)
      };
    case 'paragraph':
      return {
        type: 'Paragraph',
        inlines: normalizeInlines(node.children)
      };
    case 'list':
      return {
        type: 'List',
        ordered: node.ordered ?? false,
        start: node.start ?? undefined,
        items: node.children.map(item => ({
          blocks: item.children.map(normalizeBlock).filter(Boolean) as Block[]
        }))
      };
    case 'blockquote':
      return {
        type: 'Blockquote',
        blocks: node.children.map(normalizeBlock).filter(Boolean) as Block[]
      };
    case 'code':
      return {
        type: 'CodeBlock',
        language: node.lang ?? undefined,
        value: node.value
      };
    case 'thematicBreak':
      return {
        type: 'ThematicBreak'
      };
    case 'table':
      return {
        type: 'Table',
        headerRows: 1, // Standard Markdown tables have 1 header row
        rows: node.children.map(row => ({
          cells: row.children.map(cell => ({
            blocks: [{
              type: 'Paragraph',
              inlines: normalizeInlines(cell.children)
            }]
          }))
        }))
      };
    default:
      console.warn(`Unsupported block node type: ${node.type}`);
      return null;
  }
}

function normalizeInlines(nodes: PhrasingContent[]): Inline[] {
  return nodes.map(node => {
    switch (node.type) {
      case 'text':
        return { type: 'Text', value: node.value };
      case 'strong':
        return { type: 'Strong', inlines: normalizeInlines(node.children) };
      case 'emphasis':
        return { type: 'Emphasis', inlines: normalizeInlines(node.children) };
      case 'delete':
        return { type: 'Strike', inlines: normalizeInlines(node.children) };
      case 'inlineCode':
        return { type: 'InlineCode', value: node.value };
      case 'link':
        return { type: 'Link', url: node.url, title: node.title ?? undefined, inlines: normalizeInlines(node.children) };
      default:
        console.warn(`Unsupported inline node type: ${node.type}`);
        return { type: 'Text', value: '' } as Inline;
    }
  });
}
