import mathStyles from 'katex/dist/katex.min.css?inline';

export interface PrintSnapshot {
  print: () => void;
  dispose: () => void;
}

// Keep print independent of the live editor, responsive layout and app appearance.
// Script execution is disabled even if a renderer accidentally emits active HTML.
export async function preparePrintSnapshot(
  html: string,
  signal?: AbortSignal,
): Promise<PrintSnapshot> {
  signal?.throwIfAborted();
  const frame = document.createElement('iframe');
  frame.title = 'Prepared print document';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
  frame.dataset.printSnapshot = '';
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '816px',
    height: '1056px',
    border: '0',
    pointerEvents: 'none',
  });
  const dispose = () => frame.remove();
  let onAbort: (() => void) | undefined;
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => {
      dispose();
      reject(new DOMException('Canceled', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  try {
    const loaded = new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () => reject(new Error('print_load_failed'));
    });
    // Reuse the app's existing font imports, without importing its UI styles.
    const fonts = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    )
      .filter(
        (link) =>
          link.href.startsWith('https://fonts.googleapis.com/') &&
          !link.href.includes('Material'),
      )
      .map(
        (link) =>
          `<link rel="stylesheet" href="${link.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`,
      )
      .join('');
    html = html.replace(
      '</head>',
      `<style>${mathStyles}</style>${fonts}</head>`,
    );
    frame.srcdoc = html.replace(
      '<head>',
      "<head><meta http-equiv=\"Content-Security-Policy\" content=\"script-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'\">",
    );
    document.body.append(frame);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        aborted,
        (async () => {
          await loaded;
          const doc = frame.contentDocument;
          if (!doc) throw new Error('print_document_unavailable');
          void doc.body.offsetHeight;
          await doc.fonts.ready;
          await Promise.all(
            Array.from(doc.images, async (image) => {
              if (!image.complete)
                await new Promise<void>((resolve, reject) => {
                  image.onload = () => resolve();
                  image.onerror = () => reject(new Error('print_image_failed'));
                });
              if (!image.naturalWidth) throw new Error('print_image_failed');
              await image.decode();
            }),
          );
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        })(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('print_readiness_timeout')),
            30_000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
    return {
      print: () => {
        if (!frame.isConnected || !frame.contentWindow)
          throw new Error('print_snapshot_expired');
        frame.contentWindow.focus();
        frame.contentWindow.print();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  }
}
