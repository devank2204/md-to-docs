export { renderToDocxBlob } from './docx';
export { renderToClipboardHtml, copyToClipboard } from './clipboard';
export { renderToHtml, type HtmlRendererOptions } from './html';
export { DocumentRenderer } from './core/Renderer';
export type { RendererRegistry, RendererContext, NodeRenderer } from './core/Renderer';
export {
  serializeTableToTsv,
  serializeTableToCsv,
  serializeTableToHtml,
  serializeTableToMarkdown,
  parseTableElement,
  copyTableToClipboard,
  type TableData,
  type TableCopyFormat,
} from './tableClipboard';
export {
  formatJsonCode,
  stripJsonComments,
  beautifyCode,
  type JsonFormatResult,
} from './codeFormatter';
export {
  extractDocxComments,
  parseReviewNotesText,
  reconcileMarkdown,
  inferReplacementFromComment,
  type ReviewComment,
  type ReconciliationPatch,
  type ReconciliationReport,
} from './reconciliation';
export {
  extractDocumentTitle,
  createDocumentItem,
  duplicateDocumentItem,
  createDocumentSnapshot,
  restoreDocumentSnapshot,
  type DocumentItem,
  type DocumentSnapshot,
} from './documentManager';



