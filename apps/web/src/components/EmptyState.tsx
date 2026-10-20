import { useState, useRef } from 'react';
import { DOCUMENT_TEMPLATES } from '@/data/templates';
import { getCommandShortcut, getModifierKey } from '@/utils/platform';

interface EmptyStateProps {
  onInput: (markdown: string) => void;
}

export function EmptyState({ onInput }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onInput(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const loadSample = () => {
    const sample = DOCUMENT_TEMPLATES[0];
    onInput(sample.content);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center">
      {/* Editorial Header with established Newsreader font-serif */}
      <div className="text-center mb-8 max-w-xl">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-on-surface mb-3 tracking-tight font-medium">
          Markdown to Docs
        </h1>
        <p className="font-serif text-base sm:text-lg text-secondary max-w-[560px] mx-auto leading-relaxed">
          Paste Markdown or drop a file. Diagrams, tables, and formatting convert cleanly to Google Docs, Word, and PDF.
        </p>
      </div>

      {/* Mac-Style Window Frame */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-surface rounded-xl border transition-all duration-150 flex flex-col overflow-hidden shadow-sm ${
          isDragging
            ? 'border-primary ring-4 ring-primary/10 bg-primary/[0.02]'
            : 'border-outline-variant/40 hover:border-outline-variant/70'
        }`}
      >
        {/* Mac Window Titlebar */}
        <div className="h-10 px-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between select-none">
          {/* Window dots */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
          </div>

          {/* Window Title */}
          <div className="flex items-center gap-1.5 font-code-sm text-xs text-outline">
            <span className="material-symbols-outlined text-[14px]">edit_note</span>
            <span>untitled.md</span>
          </div>

          {/* Format Hint */}
          <div className="font-code-sm text-[11px] text-outline-variant hidden sm:block">
            CommonMark · GFM
          </div>
        </div>

        {/* Editor / Dropzone Area */}
        <div className="relative min-h-[340px] flex flex-col p-6">
          <textarea
            className="absolute inset-0 w-full h-full p-6 font-code-md text-sm text-on-surface bg-transparent resize-none focus:outline-none z-10 placeholder-transparent leading-relaxed"
            onChange={(e) => onInput(e.target.value)}
            spellCheck="false"
            autoFocus
            aria-label="Markdown input"
          />

          {/* Central Action Prompt */}
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/40 flex items-center justify-center mb-3 text-secondary shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">
                {isDragging ? 'file_download' : 'description'}
              </span>
            </div>

            <p className="font-serif text-base sm:text-lg font-medium text-on-surface mb-1">
              {isDragging ? 'Drop your file to open' : 'Drop a Markdown file, paste, or start typing'}
            </p>
            <p className="font-code-sm text-xs text-outline mb-5">
              Supports .md, .markdown, or .txt
            </p>

            <div className="flex items-center gap-2.5 pointer-events-auto">
              <input
                type="file"
                accept=".md,.markdown,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-surface hover:bg-surface-container border border-outline-variant/60 text-on-surface rounded-lg font-code-sm text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">folder_open</span>
                Browse file
              </button>
              <button
                type="button"
                onClick={loadSample}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-code-sm text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">auto_stories</span>
                Try an example
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Cheatsheet Footer with JetBrains Mono */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 font-code-sm text-xs text-outline">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-code-sm text-[10px]">{getModifierKey()}+V</kbd> Paste
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 font-code-sm text-[10px]">{getCommandShortcut()}</kbd> Command Palette
        </span>
        <span>·</span>
        <span>Drag &amp; drop anytime</span>
      </div>
    </div>
  );
}
