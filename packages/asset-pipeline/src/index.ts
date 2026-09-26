import type { Asset, FolioDocument } from '@mdtodocs/compiler-core';

/**
 * Given a FolioDocument with parsed assets, fetches/processes those assets
 * to embed them directly via data URIs and determine their dimensions.
 */
export async function resolveAssets(doc: FolioDocument): Promise<FolioDocument> {
  const resolvedAssets: Asset[] = [];
  
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
    } else {
      resolvedAssets.push(asset);
    }
  }

  return {
    ...doc,
    assets: resolvedAssets,
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
