import { mobileDestinations } from '@/utils/mobileDestinations';
import type { MobileSheet } from '@/utils/mobileDestinations';
import type { ExportTarget } from '@/utils/exportHelpers';
import type { useDocumentExport } from '@/hooks/useDocumentExport';

interface Props {
  target: ExportTarget;
  hasContent: boolean;
  compilationError: boolean;
  isCompiling: boolean;
  warningsCount: number;
  output: ReturnType<typeof useDocumentExport>;
  setSheet: (sheet: MobileSheet) => void;
  print: () => void;
  chooseTarget: (target: ExportTarget) => void;
}
export function MobileExportBar({
  target,
  hasContent,
  compilationError,
  isCompiling,
  warningsCount,
  output,
  setSheet,
  print,
  chooseTarget,
}: Props) {
  const selected = mobileDestinations.find((item) => item.value === target)!;
  let canShare = false;
  try {
    canShare =
      output.data?.kind === 'file' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [output.data.file] });
  } catch {
    /* Offer download if the platform rejects capability probing. */
  }
  return (
    <footer className="mobile-export" data-print-hide>
      {hasContent && (
        <button
          className="mobile-format-status"
          type="button"
          onClick={() => setSheet('notes')}
        >
          {compilationError
            ? 'Preview check failed · Review'
            : isCompiling
              ? 'Checking formatting…'
              : warningsCount
                ? `${warningsCount} formatting notes · Review`
                : 'Ready to export'}
          <span aria-hidden="true">→</span>
        </button>
      )}
      <button
        className="mobile-destination"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setSheet('destination')}
      >
        <span>
          Save as <strong>{selected.label}</strong>
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      {output.message && (
        <p
          role={output.error ? 'alert' : 'status'}
          className={`mobile-export-message ${output.error ? 'export-error' : ''}`}
        >
          {output.message}
        </p>
      )}
      {!output.data || target === 'pdf' ? (
        <button
          type="button"
          className="mobile-primary"
          disabled={
            !hasContent || output.busy || (target === 'pdf' && isCompiling)
          }
          onClick={target === 'pdf' ? print : output.prepare}
        >
          {output.busy ? 'Preparing your document…' : selected.action}
          <span aria-hidden="true">{output.busy ? '…' : '→'}</span>
        </button>
      ) : output.data.kind === 'file' ? (
        <div className="mobile-delivery-actions">
          {canShare && (
            <button
              className="mobile-primary"
              type="button"
              disabled={output.busy}
              onClick={() => output.deliver('share')}
            >
              Share document
            </button>
          )}
          <button
            className={canShare ? 'mobile-secondary' : 'mobile-primary'}
            type="button"
            disabled={output.busy}
            onClick={() => output.deliver('download')}
          >
            Download {target === 'word' ? '.docx' : '.html'}
          </button>
        </div>
      ) : (
        <>
          <button
            className="mobile-primary"
            type="button"
            disabled={output.busy}
            onClick={() => output.deliver('copy')}
          >
            {target === 'google-docs'
              ? 'Copy for Google Docs'
              : 'Copy formatted text'}
            <span aria-hidden="true">→</span>
          </button>
          {(target === 'google-docs' || output.error) && (
            <div className="mobile-copy-fallbacks">
              <button type="button" onClick={() => chooseTarget('word')}>
                Use a Word file instead
              </button>
              <button
                type="button"
                disabled={output.busy}
                onClick={() => output.deliver('plain')}
              >
                Copy plain Markdown
              </button>
            </div>
          )}
        </>
      )}
      {!hasContent && (
        <p className="mobile-private-note">
          Start with your text. No account needed.
        </p>
      )}
    </footer>
  );
}
