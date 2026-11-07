import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAssetCache, resolveAssets } from '@mdtodocs/asset-pipeline';
import { parseMarkdown } from '@mdtodocs/compiler-core';

afterEach(() => { clearAssetCache(); vi.unstubAllGlobals(); });

describe('asset preparation cancellation', () => {
  it('canceling one preview cannot cancel another export using the same image', async () => {
    clearAssetCache();
    vi.stubGlobal('Image', undefined);
    const completions: (() => void)[] = [];
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Canceled', 'AbortError')));
      completions.push(() => resolve({ ok: true, blob: async () => new Blob(['image'], { type: 'image/png' }) }));
    })));
    const first = new AbortController();
    const second = new AbortController();
    const preview = resolveAssets(parseMarkdown('![Figure](https://example.test/image.png)'), first.signal);
    const exported = resolveAssets(parseMarkdown('![Figure](https://example.test/image.png)'), second.signal);
    first.abort();
    completions.forEach(complete => complete());
    await preview;
    const result = await exported;
    expect(result.children[0].children[0].data?.resolvedAsset?.data).toContain('data:image/png;base64,');
    expect(second.signal.aborted).toBe(false);
  });
});
