import { useState } from 'react';
import type { AppState } from '../App';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import { renderToDocxBlob, renderToClipboardHtml } from '@mdtodocs/renderers';
import type { DestinationType } from '@mdtodocs/capability-graph';

interface HeaderProps {
  appState: AppState;
  markdown: string;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
}

export function Header({ appState, markdown, destination, onDestinationChange }: HeaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownloadDocx = async () => {
    if (!markdown) return;
    try {
      setDownloading(true);
      const collector = new DiagnosticsCollector();
      let doc = parseMarkdown(markdown);
      doc = planRepresentation(doc, 'word', collector);
      const blob = await renderToDocxBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyFormatted = async () => {
    if (!markdown) return;
    try {
      setCopying(true);
      const collector = new DiagnosticsCollector();
      let doc = parseMarkdown(markdown);
      doc = planRepresentation(doc, destination, collector);
      const html = renderToClipboardHtml(doc);
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const plainBlob = new Blob([markdown], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': plainBlob }),
      ]);
      setCopySuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setCopying(false);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const primaryAction = () => {
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return handleCopyFormatted();
      case 'word':
        return handleDownloadDocx();
      case 'pdf':
        return handlePrintPdf();
    }
  };

  const primaryLabel = () => {
    if (copySuccess) return '✓ Copied!';
    if (copying) return 'Copying…';
    if (downloading) return 'Compiling…';
    switch (destination) {
      case 'google-docs': return 'Copy for Google Docs';
      case 'clipboard': return 'Copy formatted';
      case 'word': return 'Download .docx';
      case 'pdf': return 'Export PDF';
    }
  };

  const primaryIcon = () => {
    if (copySuccess) return 'check_circle';
    if (downloading) return 'refresh';
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
        <a href="/" className="flex items-center gap-space-xs group transition-all duration-300 hover:-translate-y-[1px]">
          <span className="font-code-lg text-code-lg tracking-wider font-semibold text-primary lowercase transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500">
            mdtodocs.com
          </span>
        </a>
      </div>

      {appState === 'WORKSPACE' && (
        <div className="flex items-center gap-space-md">
          {/* Destination Selector */}
          <div className="flex items-center bg-surface-container p-space-xxs rounded border border-outline-variant/30" role="tablist">
            {([
              { id: 'google-docs' as DestinationType, label: 'Google Docs' },
              { id: 'word' as DestinationType, label: 'Word' },
              { id: 'pdf' as DestinationType, label: 'PDF' },
              { id: 'clipboard' as DestinationType, label: 'Copy' },
            ]).map((dest) => (
              <button
                key={dest.id}
                onClick={() => onDestinationChange(dest.id)}
                role="tab"
                aria-selected={destination === dest.id}
                className={`px-space-sm py-space-xxs font-code-sm text-code-sm rounded transition-colors ${
                  destination === dest.id
                    ? 'bg-surface text-on-surface font-medium shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {dest.label}
              </button>
            ))}
          </div>

          {/* Primary Action */}
          <button
            onClick={primaryAction}
            disabled={downloading || copying}
            className={`flex items-center gap-space-xs px-space-md py-space-xs rounded font-code-sm text-code-sm font-medium shadow-sm cursor-pointer transition-colors ${
              copySuccess
                ? 'bg-[#22c55e] text-white'
                : 'bg-primary text-on-primary hover:bg-secondary-fixed-dim hover:text-on-secondary-fixed'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{primaryIcon()}</span>
            <span>{primaryLabel()}</span>
          </button>
        </div>
      )}
    </header>
  );
}
