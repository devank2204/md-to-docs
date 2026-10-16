import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { renderMermaid } from './mermaid';

const imageCache = new Map<string, Promise<ResolvedAsset>>();

export function clearAssetCache(): void {
  imageCache.clear();
}

export async function resolveAssets(doc: Root, signal?: AbortSignal): Promise<Root> {
  const promises: Promise<void>[] = [];

  visit(doc, (node: any) => {
    if (signal?.aborted) return;

    if (node.type === 'image') {
      promises.push(
        processImage(node.url, signal).then((resolved) => {
          if (signal?.aborted) return;
          node.data = node.data || {};
          node.data.resolvedAsset = resolved;
        }).catch((err) => {
          if (signal?.aborted) return;
          console.warn(`Failed to process image asset ${node.url}:`, err);
        })
      );
    } else if (node.type === 'code' && node.lang === 'mermaid') {
      promises.push(
        renderMermaid(node.value).then((result) => {
          if (signal?.aborted) return;
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

async function processImage(src: string, signal?: AbortSignal): Promise<ResolvedAsset> {
  // If it's already a data URI, extract dimensions directly
  if (src.startsWith('data:')) {
    const dim = await getImageDimensions(src);
    return {
      type: 'image',
      data: src,
      dimensions: dim,
    };
  }

  // Check cache for existing or in-flight promise
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const fetchPromise = (async () => {
    const response = await fetch(src, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching image`);
    }

    const blob = await response.blob();
    const dataUri = await blobToDataUri(blob);
    const dimensions = await getImageDimensions(dataUri);

    return {
      type: 'image' as const,
      mimeType: blob.type,
      data: dataUri,
      dimensions,
    };
  })().catch((err) => {
    // Evict on failure so retries can occur
    imageCache.delete(src);
    throw err;
  });

  imageCache.set(src, fetchPromise);
  return fetchPromise;
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
  return new Promise((resolve) => {
    if (typeof globalThis.Image === 'undefined') {
      return resolve({ width: 600, height: 400 });
    }
    const img = new globalThis.Image();
    img.onload = () => resolve({ width: img.naturalWidth || 600, height: img.naturalHeight || 400 });
    img.onerror = () => resolve({ width: 600, height: 400 });
    img.src = src;
  });
}
