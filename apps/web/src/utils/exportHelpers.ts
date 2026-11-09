import type { PrintSnapshot } from './printSnapshot';
import type { DocumentTheme } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
export type Signature = {
  enabled: boolean;
  placement: 'every-page' | 'last-page';
};
export type ExportTarget = DestinationType | 'html';
export interface ExportInput {
  markdown: string;
  destination: ExportTarget;
  theme: DocumentTheme;
  signature: Signature;
  title: string;
}
export type PreparedExport =
  | { kind: 'print'; snapshot: PrintSnapshot }
  | { kind: 'file'; file: File }
  | { kind: 'clipboard'; html: string; plain: string };

export function documentFilename(title: string, extension: string) {
  const stem =
    Array.from(title.normalize('NFKC'))
      .filter((char) => char.charCodeAt(0) >= 32)
      .join('')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/[.\s]+$/g, '')
      .trim()
      .slice(0, 100) || 'document';
  return `${stem}.${extension}`;
}

export async function prepareDocumentExport(input: ExportInput, signal?: AbortSignal): Promise<PreparedExport> {
 const module = await import('./exportPreparation');
 signal?.throwIfAborted();
 return module.prepareDocumentExport(input, signal);
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Safari needs the URL to remain available after the click has dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function writeFormattedClipboard(
  data: Extract<PreparedExport, { kind: 'clipboard' }>,
) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
    throw new Error('rich_clipboard_unavailable');
  return navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([data.html], { type: 'text/html' }),
      'text/plain': new Blob([data.plain], { type: 'text/plain' }),
    }),
  ]);
}

export async function exportDocx(
  markdown: string,
  _compiledDoc: unknown,
  activeTheme: DocumentTheme,
  documentSignature: Signature,
): Promise<boolean> {
  try {
    const prepared = await prepareDocumentExport({
      markdown,
      destination: 'word',
      theme: activeTheme,
      signature: documentSignature,
      title: markdown.match(/^#\s+(.+)$/m)?.[1] || 'Document',
    });
    if (prepared.kind === 'file') downloadFile(prepared.file);
    return true;
  } catch {
    return false;
  }
}

export async function copyFormattedDoc(
  markdown: string,
  _compiledDoc: unknown,
  destination: DestinationType,
  activeTheme: DocumentTheme,
  documentSignature: Signature,
): Promise<boolean> {
  try {
    if (
      !markdown.trim() ||
      !navigator.clipboard?.write ||
      typeof ClipboardItem === 'undefined'
    )
      return false;
    const prepared = prepareDocumentExport({
      markdown,
      destination,
      theme: activeTheme,
      signature: documentSignature,
      title: 'Document',
    });
    // Promise-valued ClipboardItem keeps the write inside the user's gesture.
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': prepared.then(
          (data) =>
            new Blob([data.kind === 'clipboard' ? data.html : ''], {
              type: 'text/html',
            }),
        ),
        'text/plain': new Blob([markdown], { type: 'text/plain' }),
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function printPdf(): void {
  window.dispatchEvent(new CustomEvent('mdtodocs:prepare-print'));
}
export async function copyPlainMarkdown(markdown: string): Promise<boolean> {
  if (!markdown.trim()) return false;
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch {
    return false;
  }
}
export async function downloadHtml(
  markdown: string,
  _compiledDoc: unknown,
  activeTheme: DocumentTheme,
  title = 'Document',
): Promise<boolean> {
  try {
    const data = await prepareDocumentExport({
      markdown,
      destination: 'html',
      theme: activeTheme,
      signature: { enabled: false, placement: 'last-page' },
      title,
    });
    if (data.kind === 'file') downloadFile(data.file);
    return true;
  } catch {
    return false;
  }
}
export async function copyHtmlCode(
  markdown: string,
  _compiledDoc: unknown,
  activeTheme: DocumentTheme,
  title = 'Document',
): Promise<boolean> {
  try {
    const data = await prepareDocumentExport({
      markdown,
      destination: 'html',
      theme: activeTheme,
      signature: { enabled: false, placement: 'last-page' },
      title,
    });
    if (data.kind !== 'file') return false;
    await navigator.clipboard.writeText(await data.file.text());
    return true;
  } catch {
    return false;
  }
}
