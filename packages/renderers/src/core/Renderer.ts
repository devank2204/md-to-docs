import type { FolioDocument, Block, Inline, Asset, DocumentTheme } from '@mdtodocs/compiler-core';
import { DEFAULT_THEME } from '@mdtodocs/compiler-core';

export interface RendererContext<TBlockOut, TInlineOut> {
  theme: DocumentTheme;
  assets: Asset[];
  renderBlock: (block: Block) => TBlockOut;
  renderInline: (inline: Inline) => TInlineOut;
  renderBlocks: (blocks: Block[]) => TBlockOut[];
  renderInlines: (inlines: Inline[]) => TInlineOut[];
  
  // Custom state for specific renderers (e.g., list nesting depth)
  state: Record<string, any>;
}

export type BlockRenderer<TBlock, TBlockOut, TInlineOut> = (
  block: TBlock,
  context: RendererContext<TBlockOut, TInlineOut>
) => TBlockOut;

export type InlineRenderer<TInline, TBlockOut, TInlineOut> = (
  inline: TInline,
  context: RendererContext<TBlockOut, TInlineOut>
) => TInlineOut;

export interface RendererRegistry<TBlockOut, TInlineOut> {
  blocks: Record<string, BlockRenderer<any, TBlockOut, TInlineOut>>;
  inlines: Record<string, InlineRenderer<any, TBlockOut, TInlineOut>>;
  fallbackBlock?: BlockRenderer<Block, TBlockOut, TInlineOut>;
  fallbackInline?: InlineRenderer<Inline, TBlockOut, TInlineOut>;
}

export class DocumentRenderer<TBlockOut, TInlineOut> {
  registry: RendererRegistry<TBlockOut, TInlineOut>;
  
  constructor(registry: RendererRegistry<TBlockOut, TInlineOut>) {
    this.registry = registry;
  }

  render(doc: FolioDocument, initialState: Record<string, any> = {}, theme: DocumentTheme = DEFAULT_THEME): TBlockOut[] {
    const context = this.createContext(doc.assets, initialState, theme);
    return context.renderBlocks(doc.blocks);
  }

  private createContext(assets: Asset[], initialState: Record<string, any>, theme: DocumentTheme): RendererContext<TBlockOut, TInlineOut> {
    const context: RendererContext<TBlockOut, TInlineOut> = {
      theme,
      assets,
      state: initialState,
      renderBlock: (block: Block) => {
        const handler = this.registry.blocks[block.type];
        if (handler) {
          return handler(block, context);
        }
        if (this.registry.fallbackBlock) {
          return this.registry.fallbackBlock(block, context);
        }
        throw new Error(`No renderer registered for block type: ${block.type}`);
      },
      renderInline: (inline: Inline) => {
        const handler = this.registry.inlines[inline.type];
        if (handler) {
          return handler(inline, context);
        }
        if (this.registry.fallbackInline) {
          return this.registry.fallbackInline(inline, context);
        }
        throw new Error(`No renderer registered for inline type: ${inline.type}`);
      },
      renderBlocks: (blocks: Block[]) => {
        return blocks.map(context.renderBlock);
      },
      renderInlines: (inlines: Inline[]) => {
        return inlines.map(context.renderInline);
      }
    };
    return context;
  }
}
