import { useState } from 'react';
import { useStore } from '@/store';
import { exportDocx, copyFormattedDoc, printPdf } from '@/utils/exportHelpers';

interface ReviewActionBarProps {
  markdown: string;
  readingTimeMinutes: number;
  wordCount: number;
  activeTheme: any;
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
  onOpenSuggestModal: () => void;
  onOpenCommandPalette?: () => void;
}

export function ReviewActionBar({
  markdown,
  readingTimeMinutes,
  wordCount,
  activeTheme,
  documentSignature,
  onOpenSuggestModal,
  onOpenCommandPalette,
}: ReviewActionBarProps) {
  const setIsReviewMode = useStore((state) => state.setIsReviewMode);
  const compiledDoc = useStore((state) => state.compiledDoc);

  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedGDocs, setCopiedGDocs] = useState(false);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    await exportDocx(markdown, compiledDoc, activeTheme, documentSignature);
    setIsExportingDocx(false);
  };

  const handleCopyGDocs = async () => {
    const success = await copyFormattedDoc(markdown, compiledDoc, 'google-docs', activeTheme, documentSignature);
    if (success) {
      setCopiedGDocs(true);
      setTimeout(() => setCopiedGDocs(false), 2000);
    }
  };

  const handlePrintPdf = () => {
    printPdf();
  };

  return (
    <div
      data-print-hide
      className="sticky top-2 z-40 mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-surface-container/90 backdrop-blur-md border border-outline-variant/60 rounded-xl shadow-lg max-w-4xl w-full text-on-surface animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Left: Review Mode indicator & stats */}
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Review Mode
        </span>
        <span className="text-xs text-on-surface-variant hidden sm:inline">
          {readingTimeMinutes} min read · {wordCount} words
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCommandPalette) {
              onOpenCommandPalette();
            } else {
              useStore.getState().setIsCommandPaletteOpen(true);
            }
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          title="Open Command Palette (Cmd+K / Ctrl+K)"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded bg-surface-container text-[10px] text-outline border border-outline-variant/60 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Suggest Edit Trigger */}
        <button
          type="button"
          onClick={onOpenSuggestModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          title="Suggest an edit or open GitHub Issue for this document"
        >
          <span className="material-symbols-outlined text-[16px]">rate_review</span>
          <span>Suggest Edit</span>
        </button>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-1 border-l border-outline-variant/60 pl-2">
          <button
            type="button"
            onClick={handleCopyGDocs}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
            title="Copy formatted for Google Docs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedGDocs ? 'check' : 'content_copy'}
            </span>
            <span className="hidden md:inline">{copiedGDocs ? 'Copied' : 'Google Docs'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
            title="Download Word .docx"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden md:inline">{isExportingDocx ? 'Exporting...' : 'Word'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
            title="Print or Save as PDF"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>

        {/* Exit Review Mode */}
        <button
          type="button"
          onClick={() => setIsReviewMode(false)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors ml-1"
          title="Exit review mode and return to split editor"
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}
