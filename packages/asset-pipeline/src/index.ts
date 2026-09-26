import type { Asset, FolioDocument, Block, DiagramBlock } from '@mdtodocs/compiler-core';
import { renderMermaid } from './mermaid';

/**
 * Given a FolioDocument with parsed assets, fetches/processes those assets
 * to embed them directly via data URIs and determine their dimensions.
 */
export async function resolveAssets(doc: FolioDocument): Promise<FolioDocument> {
  const resolvedAssets: Asset[] = [];
  const diagramResults = new Map<string, any>();

  for (const asset of doc.assets) {
    if (asset.type === 'image') {
      try {
        const resolved = await processImage(asset);
        resolvedAssets.push(resolved);
      } catch (err) {
        console.warn(`Failed to process image asset ${asset.src}:`, err);
        // Push original to gracefully degrade
        resolvedAssets.push(asset);
      }
    } else if (asset.type === 'diagram-source' && asset.src === 'mermaid') {
      const source = asset.data || '';
      const result = await renderMermaid(source);
      
      if (result.success) {
        const svgBase64 = btoa(unescape(encodeURIComponent(result.svg)));
        const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
        
        resolvedAssets.push({
          ...asset,
          type: 'svg',
          data: dataUri,
          mimeType: 'image/svg+xml',
          dimensions: { width: result.width, height: result.height }
        });
      } else {
        console.warn(`Failed to render Mermaid diagram:`, result.error);
        resolvedAssets.push(asset);
      }
      diagramResults.set(asset.id, result);
    } else {
      resolvedAssets.push(asset);
    }
  }

  function updateBlocks(blocks: Block[]): Block[] {
    return blocks.map(block => {
      if (block.type === 'DiagramBlock' && block.assetId) {
        const result = diagramResults.get(block.assetId);
        if (result) {
          return {
            ...block,
            renderStatus: result.success ? 'success' : 'error',
            error: result.success ? undefined : result.error,
          } as DiagramBlock;
        }
      }
      
      if (block.type === 'List') {
        return { ...block, items: block.items.map(item => ({ ...item, blocks: updateBlocks(item.blocks) })) };
      }
      if (block.type === 'Blockquote') {
        return { ...block, blocks: updateBlocks(block.blocks) };
      }
      if (block.type === 'Callout') {
        return { ...block, blocks: updateBlocks(block.blocks) };
      }
      if (block.type === 'Table') {
        return { ...block, rows: block.rows.map(row => ({ ...row, cells: row.cells.map(cell => ({ ...cell, blocks: updateBlocks(cell.blocks) })) })) };
      }
      return block;
    });
  }

  return {
    ...doc,
    assets: resolvedAssets,
    blocks: updateBlocks(doc.blocks),
  };
}

async function processImage(asset: Asset): Promise<Asset> {
  // If it's already a data URI, we just need to get dimensions
  if (asset.src.startsWith('data:')) {
    const dim = await getImageDimensions(asset.src);
    return {
      ...asset,
      data: asset.src, // Store the full data URI
      dimensions: dim,
    };
  }

  // Otherwise, fetch it and convert to Data URI
  try {
    const response = await fetch(asset.src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching image`);
    }
    
    const blob = await response.blob();
    const dataUri = await blobToDataUri(blob);
    const dimensions = await getImageDimensions(dataUri);

    return {
      ...asset,
      mimeType: blob.type,
      data: dataUri,
      dimensions,
    };
  } catch (err) {
    throw err;
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}
