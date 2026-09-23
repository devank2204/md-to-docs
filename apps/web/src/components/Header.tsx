import { useState } from 'react';
import type { AppState } from '../App';
import { parseMarkdown } from '@folio/compiler-core';
import { renderToHtml, renderToDocxBlob } from '@folio/renderers';

interface HeaderProps {
  appState: AppState;
  markdown: string;
}

export function Header({ appState, markdown }: HeaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleDownloadDocx = async () => {
    if (!markdown) return;
    try {
      setDownloading(true);
      const doc = parseMarkdown(markdown);
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

  const handleCopyGDocs = async () => {
    if (!markdown) return;
    try {
      setCopying(true);
      const doc = parseMarkdown(markdown);
      const html = renderToHtml(doc);
      const type = "text/html";
      const blob = new Blob([html], { type });
      const plainBlob = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
      const data = [new ClipboardItem({ [type]: blob, 'text/plain': plainBlob })];
      await navigator.clipboard.write(data);
      // Brief visual feedback could go here
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setCopying(false), 2000);
    }
  };
  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-space-md gap-space-md border-t border-outline-variant/30">
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="font-code-lg text-code-lg tracking-wider font-semibold text-primary">FOLIO</span>
          <span className="text-outline-variant/60 text-label-sm">/</span>
          <span className="text-label-sm font-label-sm text-secondary/70 font-normal tracking-wide lowercase">md-to-doc</span>
        </div>
      </div>
      
      {appState === 'WORKSPACE' && (
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <div className="flex items-center bg-surface-container p-space-xxs rounded border border-outline-variant/30" role="tablist">
              <button 
                onClick={handleCopyGDocs}
                className="px-space-sm py-space-xxs font-code-sm text-code-sm text-secondary hover:text-on-surface transition-colors">
                {copying ? 'Copied HTML!' : 'Google Docs (Copy)'}
              </button>
              <button 
                onClick={handleDownloadDocx}
                className="px-space-sm py-space-xxs font-code-sm text-code-sm bg-surface text-on-surface rounded font-medium shadow-sm flex items-center gap-space-xxs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Word (.docx)
              </button>
              <button className="px-space-sm py-space-xxs font-code-sm text-code-sm text-secondary hover:text-on-surface transition-colors cursor-not-allowed">
                PDF (Soon)
              </button>
            </div>
          </div>
          <button 
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="flex items-center gap-space-xs bg-primary text-on-primary px-space-md py-space-xs rounded font-code-sm text-code-sm font-medium hover:bg-secondary-fixed-dim hover:text-on-secondary-fixed transition-colors shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">
              {downloading ? 'refresh' : 'download'}
            </span>
            <span>{downloading ? 'Compiling...' : 'Download Word (.docx)'}</span>
          </button>
        </div>
      )}
    </header>
  );
}
