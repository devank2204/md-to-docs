import { Toggle } from './Controls';
import React, { useLayoutEffect, useRef } from 'react';
import { takeEditorSelection, restoreEditor } from '../utils/editorHandoff';
import { useStore } from '@/store';
import { ImportMarkdownButton } from './ImportMarkdownButton';

interface DocumentEditorProps {
  syncScroll: boolean;
  onSyncScrollChange: () => void;
  markdown: string;
  onInput: (markdown: string) => void;
  words: number;
  lines: number;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ markdown, onInput, words, lines, syncScroll, onSyncScrollChange }) => {
  const editor = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const selection = takeEditorSelection();
    if (selection && editor.current) restoreEditor(editor.current, selection);
  }, []);
  return (
    <div
      data-editor-pane
      className="w-full h-full bg-[#ffffff] flex flex-col border-r border-outline-variant/30 min-h-0 overflow-hidden"
    >
      {/* Editor Sub-Header */}
      <div data-editor-toolbar
        className="px-3 py-1.5 bg-[#fafaf9] flex flex-wrap gap-1 items-center justify-between font-code-sm text-code-sm text-secondary border-b border-outline-variant/30 shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-primary">edit_note</span>
          <span className="font-semibold text-on-surface text-xs font-sans">Markdown</span>
          <span className="text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container border border-outline-variant/40 font-mono">
            GFM
          </span>
        </div>
        <div className="flex flex-wrap min-w-0 max-w-full items-center gap-2 font-code-sm text-[11px] text-secondary">
          <button type="button" className="px-2 py-1 rounded hover:bg-surface-container" onClick={() => window.dispatchEvent(new CustomEvent('mdtodocs:review'))}>Review & outline</button>
          <ImportMarkdownButton />
          <Toggle selected={syncScroll} title="Keep Markdown and Preview at matching content" onClick={onSyncScrollChange}><span aria-hidden="true">{syncScroll ? "↔" : "↮"}</span>Sync scroll: {syncScroll ? "On" : "Off"}</Toggle>
          <span className="tabular-nums font-mono">{words} words</span>
          <span className="text-outline-variant">·</span>
          <span className="tabular-nums font-mono">{lines} lines</span>
          {markdown.length > 0 && (
            <>
              <span className="text-outline-variant">·</span>
              <button
                type="button"
                onClick={() => { if(useStore.getState().createSnapshot('Before clearing text')) onInput(''); }}
                title="Clear all text (a version is saved first)"
                className="text-[11px] text-outline hover:text-error transition-colors px-1.5 py-0.5 rounded hover:bg-surface-container active:scale-95"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 min-h-0 relative">
        <textarea
          ref={editor}
          data-source-editor
          aria-label="Markdown text"
          className="w-full h-full p-space-md font-code-md text-code-md text-on-surface bg-transparent resize-none focus:outline-none leading-relaxed overflow-y-auto selection:bg-primary/15"
          value={markdown}
          onChange={(e) => onInput(e.target.value)}
          spellCheck="false"
          wrap="soft"
          placeholder="Type or paste Markdown here..."
        />
      </div>
    </div>
  );
};
