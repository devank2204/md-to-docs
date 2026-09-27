import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { renderMermaid } from './mermaid';

export async function resolveAssets(doc: Root): Promise<Root> {
  const promises: Promise<void>[] = [];

  visit(doc, (node: any) => {
    if (node.type === 'image') {
      promises.push(
        processImage(node.url).then((resolved) => {
          node.data = node.data || {};
          node.data.resolvedAsset = resolved;
        }).catch((err) => {
          console.warn(`Failed to process image asset ${node.url}:`, err);
        })
      );
    } else if (node.type === 'code' && node.lang === 'mermaid') {
      promises.push(
        renderMermaid(node.value).then((result) => {
          node.data = node.data || {};
          if (result.success) {
            const svgBase64 = btoa(unescape(encodeURIComponent(result.svg)));
            const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
            node.data.resolvedAsset = {
              type: 'svg',
              data: dataUri,
              raw: result.svg,
              mimeType: 'image/svg+xml',
              dimensions: { width: result.width, height: result.height }
            };
            node.data.renderStatus = 'success';
          } else {
            console.warn(`Failed to render Mermaid diagram:`, result.error);
            node.data.renderStatus = 'error';
            node.data.error = result.error;
          }
        })
      );
    }
  });

  await Promise.all(promises);
  return doc;
}

export interface ResolvedAsset {
  type: 'image' | 'svg' | 'diagram-source';
  data: string;
  raw?: string;
  mimeType?: string;
  dimensions: { width: number; height: number };
}

async function processImage(src: string): Promise<ResolvedAsset> {
  // If it's already a data URI, we just need to get dimensions
  if (src.startsWith('data:')) {
    const dim = await getImageDimensions(src);
    return {
      type: 'image',
      data: src, // Store the full data URI
      dimensions: dim,
    };
  }

  // Otherwise, fetch it and convert to Data URI
  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching image`);
    }
    
    const blob = await response.blob();
    const dataUri = await blobToDataUri(blob);
    const dimensions = await getImageDimensions(dataUri);

    return {
      type: 'image',
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
    const img = new globalThis.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}
