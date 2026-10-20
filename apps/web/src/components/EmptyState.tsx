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

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        onInput(text);
      }
    } catch (e) {
      console.warn('Clipboard read permission denied', e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center select-none">
      {/* Editorial Header with established Newsreader font-serif */}
      <div className="text-center mb-8 max-w-xl">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-on-surface mb-3 tracking-tight font-medium">
          Markdown to Docs
        </h1>
        <p className="font-serif text-base sm:text-lg text-secondary max-w-[560px] mx-auto leading-relaxed">
          Paste Markdown or drop a file. Diagrams, tables, and formatting convert cleanly to Google Docs, Word, and PDF.
        </p>
      </div>

      {/* Mac-Style Code Terminal Frame */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-surface dark:bg-[#121316] rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ${
          isDragging
            ? 'border-primary ring-4 ring-primary/15 bg-primary/[0.02] scale-[1.008]'
            : 'border-outline-variant/50 hover:border-outline-variant/80'
        }`}
      >
        {/* Terminal Titlebar */}
        <div className="h-11 px-4 bg-surface-container-low dark:bg-[#1a1b1e] border-b border-outline-variant/30 flex items-center justify-between select-none">
          {/* macOS window traffic lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block shadow-2xs" />
          </div>

          {/* Window Terminal Tab */}
          <div className="flex items-center gap-1.5 font-code-sm text-xs text-outline px-2.5 py-1 rounded bg-surface/80 dark:bg-surface-container/60 border border-outline-variant/30 shadow-2xs">
            <span className="material-symbols-outlined text-[14px] text-primary">terminal</span>
            <span className="font-medium text-on-surface">untitled.md</span>
            <span className="text-outline/50">·</span>
            <span className="text-[10px] text-outline">Markdown</span>
          </div>

          {/* Format Engine Badges */}
          <div className="font-code-sm text-[11px] text-outline-variant hidden sm:flex items-center gap-2">
            <span>CommonMark</span>
            <span>·</span>
            <span>GFM</span>
            <span>·</span>
            <span>KaTeX</span>
          </div>
        </div>

        {/* Terminal Workspace Area */}
        <div className="relative min-h-[360px] flex flex-col bg-surface-container-lowest/80 dark:bg-[#111215]">
          {/* Transparent Input Textarea Overlay */}
          <textarea
            className="absolute inset-0 w-full h-full p-6 pl-14 font-code-md text-sm text-on-surface bg-transparent resize-none focus:outline-none z-10 leading-relaxed placeholder-transparent selection:bg-primary/20"
            onChange={(e) => onInput(e.target.value)}
            spellCheck="false"
            autoFocus
            aria-label="Markdown terminal input"
          />

          {/* Code Editor Body Simulation (Line numbers + Prompts) */}
          <div className="absolute inset-0 p-6 flex pointer-events-none select-none font-mono text-xs sm:text-sm leading-relaxed">
            {/* Gutter Line Numbers */}
            <div className="w-8 flex flex-col text-outline/35 text-right pr-4 font-mono select-none space-y-1">
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
              <span>05</span>
              <span>06</span>
            </div>

            {/* Code Content & Hero Prompt */}
            <div className="flex-1 space-y-1 pl-2">
              {/* Line 01: Hero "Start by pasting here :)" */}
              <div className="flex items-center text-on-surface font-semibold text-sm sm:text-base tracking-tight">
                <span className="text-primary font-bold mr-2 select-none">#</span>
                <span className="text-on-surface">Start by pasting here</span>
                <span className="text-primary font-bold ml-1.5 font-sans text-base">:)</span>
                {/* Blinking Terminal Cursor */}
                <span className="inline-block w-2.5 h-4 sm:h-5 bg-primary ml-2 rounded-[1px] animate-[pulse_1s_ease-in-out_infinite]" />
              </div>

              {/* Line 02: Ghost Subtitle */}
              <div className="text-outline/45 text-xs sm:text-sm">
                <span className="text-outline/30 mr-2">##</span>
                <span>Automatic formatting for Google Docs, Word &amp; PDF</span>
              </div>

              {/* Line 03: Mermaid Hint */}
              <div className="text-outline/30 text-xs font-mono pt-1">
                <span>```mermaid</span>
              </div>

              {/* Line 04: Flowchart Hint */}
              <div className="text-outline/35 text-xs font-mono pl-4">
                <span>graph LR; Markdown --&gt; HighFidelityDoc;</span>
              </div>

              {/* Line 05: Close Code Fence */}
              <div className="text-outline/30 text-xs font-mono">
                <span>```</span>
              </div>
            </div>
          </div>

          {/* Drag Overlay State */}
          {isDragging && (
            <div className="absolute inset-0 z-30 bg-surface/95 dark:bg-[#121316]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 text-primary shadow-sm animate-bounce">
                <span className="material-symbols-outlined text-[28px]">file_download</span>
              </div>
              <p className="font-serif text-lg font-semibold text-on-surface mb-1">
                Drop your Markdown file to open
              </p>
              <p className="font-code-sm text-xs text-outline">
                Supports .md, .markdown, or .txt
              </p>
            </div>
          )}

          {/* Floating Action Dock */}
          <div className="absolute bottom-5 inset-x-5 z-20 pointer-events-auto flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/20 bg-surface-container-lowest/60 dark:bg-[#111215]/60 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".md,.markdown,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {/* Primary Paste from Clipboard Action */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-code-sm text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Paste from clipboard"
              >
                <span className="material-symbols-outlined text-[15px]">content_paste</span>
                <span>Paste</span>
                <kbd className="ml-1 px-1.5 py-0.2 rounded bg-white/20 text-white text-[10px] font-mono">
                  {getModifierKey()}+V
                </kbd>
              </button>

              {/* Browse File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-surface hover:bg-surface-container border border-outline-variant/60 text-on-surface rounded-lg font-code-sm text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">folder_open</span>
                <span>Browse file</span>
              </button>
            </div>

            {/* Try an Example */}
            <button
              type="button"
              onClick={loadSample}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface rounded-lg font-code-sm text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">auto_stories</span>
              <span>Try an example</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cheatsheet Footer */}
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

      {/* Author & Copyright Footer */}
      {/* <div className="mt-5 font-code-sm text-xs text-outline/80 tracking-wide">
        © Yours truly DC
      </div> */}
    </div>
  );
}
