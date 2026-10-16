import React from 'react';

interface DocumentEditorProps {
  markdown: string;
  onInput: (markdown: string) => void;
  words: number;
  lines: number;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ markdown, onInput, words, lines }) => {
  return (
    <div className="col-span-12 lg:col-span-4 bg-surface flex flex-col justify-between border-r border-outline-variant/20 h-auto min-h-[350px] lg:h-full lg:min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        <div className="px-space-md py-space-xs bg-surface-container-low flex items-center justify-between font-code-sm text-code-sm text-secondary border-b border-outline-variant/30 shrink-0">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[15px]">edit_note</span>
            <span className="font-medium text-on-surface">Markdown Source</span>
            <span className="text-outline-variant">·</span>
            <span className="text-secondary text-label-sm font-label-sm">Edit</span>
          </div>
          <div className="flex items-center gap-space-sm font-code-sm text-code-sm text-secondary">
            <span>{words} words</span>
            <span>·</span>
            <span>{lines} lines</span>
            {markdown.length > 0 && (
              <>
                <span>·</span>
                <button
                  onClick={() => onInput('')}
                  title="Clear document"
                  className="text-[11px] hover:text-error transition-colors px-1.5 py-0.5 rounded hover:bg-surface-container active:scale-95"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        <textarea
          className="w-full h-full p-space-md font-code-md text-code-md text-on-surface bg-transparent resize-none focus:outline-none leading-relaxed overflow-y-auto"
          value={markdown}
          onChange={(e) => onInput(e.target.value)}
          spellCheck="false"
          wrap="soft"
          placeholder="Type or paste Markdown here..."
        />
      </div>
      <div className="px-space-md py-space-xs bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between font-code-sm text-code-sm text-secondary shrink-0">
        <span className="text-label-sm font-label-sm text-secondary">CommonMark + GFM</span>
        <span className="text-label-sm font-label-sm text-secondary flex items-center gap-space-xxs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Auto-synced
        </span>
      </div>
    </div>
  );
};
