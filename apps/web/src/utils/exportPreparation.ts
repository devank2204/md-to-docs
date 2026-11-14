import { visit } from 'unist-util-visit';
import { documentFilename } from './exportHelpers';
import type { ExportInput, PreparedExport } from './exportHelpers';
import {
  parseMarkdown,
  planRepresentation,
  DiagnosticsCollector,
} from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';


// Never reuse the preview tree: it may be stale or already transformed for a
// different destination. Each export compiles one immutable source snapshot.
export async function prepareDocumentExport(
  input: ExportInput,
  signal?: AbortSignal,
): Promise<PreparedExport> {
  signal?.throwIfAborted();
  if (!input.markdown.trim()) throw new Error('empty_document');
  const target = input.destination === 'html' ? 'clipboard' : input.destination;
  const source = await resolveAssets(parseMarkdown(input.markdown), signal);
  signal?.throwIfAborted();
  if(input.reviewDiagramFailures){let failed=false;visit(source,node=>{if((node.data as {renderStatus?:string}|undefined)?.renderStatus==='error')failed=true});if(failed)throw new Error('diagram_review_required')}
  const doc = planRepresentation(source, target, new DiagnosticsCollector());
  if (input.destination === 'word') {
    const { renderToDocxBlob } = await import('@mdtodocs/renderers/src/docx');
    signal?.throwIfAborted();
    const blob = await renderToDocxBlob(doc, input.theme, input.signature);
    return {
      kind: 'file',
      file: new File([blob], documentFilename(input.title, 'docx'), {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    };
  }
  if (input.destination === 'pdf') {
    const { preparePrintSnapshot } = await import('./printSnapshot');
    signal?.throwIfAborted();
    const [{ renderToHtml }, { renderToClipboardHtml }] = await Promise.all([import('@mdtodocs/renderers/src/html'), import('@mdtodocs/renderers/src/clipboard')]);
    signal?.throwIfAborted();
    let html = renderToHtml(doc, { theme: input.theme, title: input.title, fullDocument: true });
    // Clipboard renderer already implements the chosen signature and theme.
    const body = renderToClipboardHtml(doc, input.theme, input.signature);
    html = html.replace(/<body>[\s\S]*<\/body>/, () => `<body>${body}</body>`);
    return { kind: 'print', snapshot: await preparePrintSnapshot(html, signal) };
  }
  if (input.destination === 'html') {
    const { renderToHtml } = await import('@mdtodocs/renderers/src/html');
    signal?.throwIfAborted();
    const html = renderToHtml(doc, {
      theme: input.theme,
      title: input.title,
      fullDocument: true,
    });
    return {
      kind: 'file',
      file: new File([html], documentFilename(input.title, 'html'), {
        type: 'text/html',
      }),
    };
  }
  const { renderToClipboardHtml } = await import('@mdtodocs/renderers/src/clipboard');
  signal?.throwIfAborted();
  return {
    kind: 'clipboard',
    html: renderToClipboardHtml(doc, input.theme, input.signature),
    plain: input.markdown,
  };
}

