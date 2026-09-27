import type { DocumentTheme } from '@mdtodocs/compiler-core';
import type { Root, Node } from 'mdast';
import { DEFAULT_THEME } from '@mdtodocs/compiler-core';

export interface RendererContext<TNodeOut> {
  theme: DocumentTheme;
  renderNode: (node: Node) => TNodeOut;
  renderNodes: (nodes: Node[]) => TNodeOut[];
  
  // Custom state for specific renderers (e.g., list nesting depth)
  state: Record<string, any>;
}

export type NodeRenderer<TNode extends Node, TNodeOut> = (
  node: TNode,
  context: RendererContext<TNodeOut>
) => TNodeOut;

export interface RendererRegistry<TNodeOut> {
  nodes: Record<string, NodeRenderer<any, TNodeOut>>;
  fallbackNode?: NodeRenderer<Node, TNodeOut>;
}

export class DocumentRenderer<TNodeOut> {
  registry: RendererRegistry<TNodeOut>;
  
  constructor(registry: RendererRegistry<TNodeOut>) {
    this.registry = registry;
  }

  render(doc: Root, initialState: Record<string, any> = {}, theme: DocumentTheme = DEFAULT_THEME): TNodeOut[] {
    const context = this.createContext(initialState, theme);
    return context.renderNodes(doc.children);
  }

  private createContext(initialState: Record<string, any>, theme: DocumentTheme): RendererContext<TNodeOut> {
    const context: RendererContext<TNodeOut> = {
      theme,
      state: initialState,
      renderNode: (node: Node) => {
        const handler = this.registry.nodes[node.type];
        if (handler) {
          return handler(node, context);
        }
        if (this.registry.fallbackNode) {
          return this.registry.fallbackNode(node, context);
        }
        throw new Error(`No renderer registered for node type: ${node.type}`);
      },
      renderNodes: (nodes: Node[]) => {
        return nodes.map(context.renderNode);
      }
    };
    return context;
  }
}
