
import type { AppState } from '@/App';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { renderToDocxBlob, renderToClipboardHtml } from '@mdtodocs/renderers';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { SegmentedControl } from '@/components/interior/segmented-control';
import { LoadingButton } from '@/components/interior/loading-button';

interface HeaderProps {
  appState: AppState;
  markdown: string;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
  activeTheme: any;
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
}

export function Header({ appState, markdown, destination, onDestinationChange, activeTheme, documentSignature }: HeaderProps) {
  // State handled internally by LoadingButton

  const handleDownloadDocx = async () => {
    if (!markdown) return;
    try {
      const collector = new DiagnosticsCollector();
      let doc = parseMarkdown(markdown);
      doc = await resolveAssets(doc);
      doc = planRepresentation(doc, 'word', collector);
      const blob = await renderToDocxBlob(doc, activeTheme, documentSignature);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyFormatted = async () => {
    if (!markdown) return;
    const collector = new DiagnosticsCollector();
    let doc = parseMarkdown(markdown);
    doc = await resolveAssets(doc);
    doc = planRepresentation(doc, destination, collector);
    const html = renderToClipboardHtml(doc, activeTheme, documentSignature);
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const plainBlob = new Blob([markdown], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': plainBlob }),
    ]);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const primaryAction = async () => {
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return await handleCopyFormatted();
      case 'word':
        return await handleDownloadDocx();
      case 'pdf':
        handlePrintPdf();
        return Promise.resolve();
    }
  };

  const primaryLabel = () => {
    switch (destination) {
      case 'google-docs': return 'Copy for Google Docs';
      case 'clipboard': return 'Copy formatted';
      case 'word': return 'Download .docx';
      case 'pdf': return 'Export PDF';
    }
  };

  const primaryIcon = () => {
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return 'content_copy';
      case 'word': return 'download';
      case 'pdf': return 'picture_as_pdf';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-space-md gap-space-md border-t border-outline-variant/30">
      <div className="flex items-center gap-space-md">
        <a href="/" className="flex items-center gap-space-xs group transition-transform duration-700 hover:-translate-y-[1px]">
          <div className="flex items-center gap-space-sm">
            <img src="/mark.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div className="flex items-baseline gap-space-xxs mt-0.5">
              <span className="font-code-lg text-code-lg font-semibold tracking-tighter text-on-surface">mdtodocs</span>
              <span className="font-code-sm text-code-sm text-outline font-normal">.com</span>
            </div>
          </div>
        </a>
      </div>

      {appState === 'WORKSPACE' && (
        <div className="flex items-center gap-space-md">
          {/* Destination Selector */}
          <SegmentedControl
            options={[
              { value: 'google-docs', label: 'Google Docs' },
              { value: 'word', label: 'Word' },
              { value: 'pdf', label: 'PDF' },
              { value: 'clipboard', label: 'Copy' },
            ]}
            label="Destination"
            value={destination}
            onValueChange={(val) => onDestinationChange(val as DestinationType)}
          />

          {/* Primary Action */}
          <LoadingButton
            onAction={primaryAction}
            successLabel="✓ Copied!"
            pendingLabel={destination === 'word' ? 'Compiling…' : 'Copying…'}
            idleIcon={<span className="material-symbols-outlined text-[16px]">{primaryIcon()}</span>}
          >
            {primaryLabel() ?? 'Export'}
          </LoadingButton>
        </div>
      )}
    </header>
  );
}
