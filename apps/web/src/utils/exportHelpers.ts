import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { renderToDocxBlob, renderToClipboardHtml, renderToHtml } from '@mdtodocs/renderers';
import type { DestinationType } from '@mdtodocs/capability-graph';

export async function exportDocx(
  markdown: string,
  compiledDoc: any,
  activeTheme: any,
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' }
): Promise<boolean> {
  if (!markdown) return false;
  try {
    const collector = new DiagnosticsCollector();
    let doc: any;
    if (compiledDoc) {
      doc = structuredClone(compiledDoc);
      doc = planRepresentation(doc, 'word', collector);
    } else {
      doc = parseMarkdown(markdown);
      doc = await resolveAssets(doc);
      doc = planRepresentation(doc, 'word', collector);
    }
    const blob = await renderToDocxBlob(doc, activeTheme, documentSignature);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.docx';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Failed to export .docx:', e);
    return false;
  }
}

export async function copyFormattedDoc(
  markdown: string,
  compiledDoc: any,
  destination: DestinationType,
  activeTheme: any,
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' }
): Promise<boolean> {
  if (!markdown) return false;
  try {
    let doc = compiledDoc;
    if (!doc) {
      const collector = new DiagnosticsCollector();
      doc = parseMarkdown(markdown);
      doc = await resolveAssets(doc);
      doc = planRepresentation(doc, destination, collector);
    }
    const html = renderToClipboardHtml(doc, activeTheme, documentSignature);
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const plainBlob = new Blob([markdown], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': plainBlob }),
    ]);
    return true;
  } catch (e) {
    console.error('Failed to copy formatted document:', e);
    return false;
  }
}

export function printPdf(): void {
  window.print();
}

export async function copyPlainMarkdown(markdown: string): Promise<boolean> {
  if (!markdown) return false;
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (e) {
    console.error('Failed to copy markdown text:', e);
    return false;
  }
}

export async function downloadHtml(
  markdown: string,
  compiledDoc: any,
  activeTheme: any,
  title?: string
): Promise<boolean> {
  if (!markdown) return false;
  try {
    let doc = compiledDoc;
    if (!doc) {
      const collector = new DiagnosticsCollector();
      doc = parseMarkdown(markdown);
      doc = await resolveAssets(doc);
      doc = planRepresentation(doc, 'clipboard', collector);
    }
    const htmlString = renderToHtml(doc, { theme: activeTheme, title: title || 'Document', fullDocument: true });
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'document').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Failed to download HTML:', e);
    return false;
  }
}

export async function copyHtmlCode(
  markdown: string,
  compiledDoc: any,
  activeTheme: any,
  title?: string
): Promise<boolean> {
  if (!markdown) return false;
  try {
    let doc = compiledDoc;
    if (!doc) {
      const collector = new DiagnosticsCollector();
      doc = parseMarkdown(markdown);
      doc = await resolveAssets(doc);
      doc = planRepresentation(doc, 'clipboard', collector);
    }
    const htmlString = renderToHtml(doc, { theme: activeTheme, title: title || 'Document', fullDocument: true });
    await navigator.clipboard.writeText(htmlString);
    return true;
  } catch (e) {
    console.error('Failed to copy HTML code:', e);
    return false;
  }
}

