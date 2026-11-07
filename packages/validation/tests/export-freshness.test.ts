import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { parseMarkdown, THEMES } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import {
  exportDocx,
  documentFilename,
} from '../../../apps/web/src/utils/exportHelpers';

vi.mock('@mdtodocs/asset-pipeline', () => ({
  resolveAssets: vi.fn(async (doc) => doc),
}));

function bytes(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('Export source snapshot', () => {
  it('waits for fresh source assets and ignores an older compiled preview', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(resolveAssets).mockImplementationOnce(async (doc) => {
      await gate;
      return doc;
    });
    let file: Blob | undefined;
    const url = vi.fn((value: Blob) => {
      file = value;
      return 'blob:test';
    });
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = url;
        static revokeObjectURL = vi.fn();
      },
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    try {
      const promise = exportDocx(
        '# Latest document\n\nThis is version B.',
        parseMarkdown('# Stale preview A'),
        THEMES.default,
        { enabled: false, placement: 'last-page' },
      );
      expect(click).not.toHaveBeenCalled();
      release();
      expect(await promise).toBe(true);
      const zip = await JSZip.loadAsync(await bytes(file!));
      const xml = await zip.file('word/document.xml')!.async('string');
      expect(xml).toContain('This is version B.');
      expect(xml).not.toContain('Stale preview A');
      expect(click).toHaveBeenCalledOnce();
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('gives punctuation-only names a usable filename and removes path separators', () => {
    expect(documentFilename('...  ', 'docx')).toBe('document.docx');
    expect(documentFilename('../../Report: notes', 'docx')).not.toMatch(
      /[/:\\]/,
    );
  });
});
