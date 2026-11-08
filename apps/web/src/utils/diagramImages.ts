interface ImageOptions {
  scale?: number;
  background?: string;
  signal?: AbortSignal;
  mime?: 'image/png' | 'image/jpeg';
}

export async function svgImageBlob(
  svg: string,
  options: ImageOptions = {},
): Promise<Blob> {
  options.signal?.throwIfAborted();
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.localName !== 'svg' || doc.querySelector('parsererror'))
    throw new Error('Invalid SVG image');
  const box = root
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const width =
    box?.length === 4
      ? box[2]
      : Number.parseFloat(root.getAttribute('width') || '800');
  const height =
    box?.length === 4
      ? box[3]
      : Number.parseFloat(root.getAttribute('height') || '600');
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new Error('Invalid image dimensions');
  const scale = Math.min(
    options.scale || 2,
    8192 / width,
    8192 / height,
    Math.sqrt(16_777_216 / (width * height)),
  );
  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  if (!root.hasAttribute('viewBox'))
    root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  // Bound the decoded SVG image as well as the destination canvas allocation.
  root.setAttribute('width', String(canvas.width));
  root.setAttribute('height', String(canvas.height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image conversion unavailable');
  await document.fonts.ready;
  options.signal?.throwIfAborted();
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(root)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  );
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(
        () => finish(new Error('Image conversion timed out')),
        15_000,
      );
      const abort = () => finish(new DOMException('Canceled', 'AbortError'));
      const finish = (error?: Error) => {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
        image.onload = null;
        image.onerror = null;
        if (error) reject(error);
        else resolve();
      };
      image.onload = () => {
        try {
          if (options.background !== 'transparent') {
            context.fillStyle = options.background || '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          finish();
        } catch (error) {
          finish(error as Error);
        }
      };
      image.onerror = () =>
        finish(new Error('Could not load the diagram image'));
      options.signal?.addEventListener('abort', abort, { once: true });
      image.src = url;
    });
    options.signal?.throwIfAborted();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => {
          if (options.signal?.aborted)
            reject(new DOMException('Canceled', 'AbortError'));
          else if (blob) resolve(blob);
          else reject(new Error('Could not create the image'));
        },
        options.mime || 'image/png',
        0.95,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Call write during the gesture. Safari can reject a write deferred until rasterization.
export function copyDiagramImage(
  svg: string,
  options: ImageOptions = {},
): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
    return Promise.reject(new Error('Image clipboard unavailable'));
  const png = svgImageBlob(svg, { ...options, mime: 'image/png' });
  // Handle rejection even on browsers that reject write before consuming the data.
  void png.catch(() => undefined);
  return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

// Preserve the inherited role of a preview when moving its SVG into a portal.
export function diagramFontForContext(svg: string, family: string): string {
  const font = family.replaceAll('"', "'");
  return svg.replace(/font-family:[^;"}]+/g, () => `font-family:${font}`);
}
