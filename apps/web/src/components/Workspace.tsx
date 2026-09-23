import { useMemo } from 'react';
import { parseMarkdown } from '@folio/compiler-core';
import { renderToHtml } from '@folio/renderers';

interface WorkspaceProps {
  markdown: string;
  onInput: (markdown: string) => void;
}

export function Workspace({ markdown, onInput }: WorkspaceProps) {
  const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lines = markdown.split('\n').length;

  const htmlContent = useMemo(() => {
    try {
      const doc = parseMarkdown(markdown);
      return renderToHtml(doc);
    } catch (e) {
      console.error(e);
      return '<div class="text-error">Error compiling markdown.</div>';
    }
  }, [markdown]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3rem)]">
      <div className="w-full grid grid-cols-12 h-full">
        {/* Left Pane - Markdown Editor */}
        <div className="col-span-12 lg:col-span-4 bg-surface flex flex-col justify-between border-r border-outline-variant/20 h-full">
          <div className="flex flex-col flex-1 overflow-hidden">
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
              </div>
            </div>
            <textarea
              className="w-full h-full p-space-md font-code-md text-code-md text-on-surface bg-transparent resize-none focus:outline-none leading-relaxed"
              value={markdown}
              onChange={(e) => onInput(e.target.value)}
              spellCheck="false"
            />
          </div>
          <div className="px-space-md py-space-xs bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between font-code-sm text-code-sm text-secondary shrink-0">
            <span className="text-label-sm font-label-sm text-secondary">CommonMark compliant</span>
            <span className="text-label-sm font-label-sm text-secondary flex items-center gap-space-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Auto-synced
            </span>
          </div>
        </div>

        {/* Right Pane - Document Preview */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-high/60 flex flex-col p-space-md relative h-full">
          <div className="w-full flex items-center justify-between text-secondary font-code-sm text-code-sm pb-space-sm px-space-xs border-b border-outline-variant/20 mb-space-sm shrink-0">
            <div className="flex items-center gap-space-sm">
              <span className="font-medium text-on-surface flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
                <span>Document Preview</span>
              </span>
              <span className="text-outline-variant">·</span>
              <span className="px-space-xs py-space-xxs rounded bg-surface-container text-on-surface font-code-sm text-code-sm">Standard Letter (8.5 × 11 in)</span>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-space-xs bg-surface rounded p-space-xxs shadow-xs">
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                <span className="tabular-nums font-medium text-on-surface px-space-xs">100%</span>
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-[16px]">add</span></button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center p-space-lg overflow-y-auto">
            {/* The Document Canvas */}
            <div className="w-full max-w-[816px] bg-surface-container-lowest p-space-xxl shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] rounded flex flex-col min-h-[1056px] relative border border-outline-variant/30 prose prose-slate">
              <div 
                className="relative z-10 flex flex-col space-y-space-md font-body-md text-on-surface [&>h1]:font-headline-xl [&>h1]:text-headline-xl [&>h2]:font-headline-lg [&>h2]:text-headline-lg [&>h3]:font-headline-md [&>h3]:text-headline-md"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
