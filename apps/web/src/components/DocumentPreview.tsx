import React, { useEffect, useState, useRef } from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { SegmentedControl } from '@/components/interior/segmented-control';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

interface DocumentPreviewProps {
  markdown: string;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
  themeId: string;
  onThemeIdChange: (themeId: string) => void;
  baseFontSize: number;
  onBaseFontSizeChange: (size: number) => void;
  isCompiling: boolean;
  onOpenInspector: () => void;
}

const MermaidPreview = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState('');
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
    });
    
    let isMounted = true;
    mermaid.render(id.current, code)
      .then(res => {
        if (isMounted) setSvg(res.svg);
      })
      .catch(e => {
        if (isMounted) setSvg(`<div style="color:red">Mermaid Error: ${e.message}</div>`);
      });

    return () => { isMounted = false; };
  }, [code]);

  return (
    <div className="mermaid-preview my-6 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  markdown,
  destination,
  onDestinationChange,
  themeId,
  onThemeIdChange,
  baseFontSize,
  onBaseFontSizeChange,
  isCompiling,
  onOpenInspector,
}) => {
  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-high/60 flex flex-col p-space-md relative h-full">
      <div className="w-full flex items-center justify-between text-secondary font-code-sm text-code-sm pb-space-sm px-space-xs border-b border-outline-variant/20 mb-space-sm shrink-0">
        <div className="flex items-center gap-space-sm">
          <span className="font-medium text-on-surface flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
            <span>Preview</span>
          </span>
          <span className="text-outline-variant">·</span>

          <SegmentedControl
            options={[
              { value: 'google-docs', label: 'Docs' },
              { value: 'word', label: 'Word' },
              { value: 'pdf', label: 'PDF' },
              { value: 'clipboard', label: 'Copy' },
            ]}
            label=""
            value={destination}
            onValueChange={(val) => onDestinationChange(val as DestinationType)}
          />
          
          <span className="text-outline-variant">·</span>
          
          <div className="flex items-center gap-space-xs">
            <span className="text-secondary">Theme:</span>
            <select 
              className="bg-transparent border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary text-code-sm"
              value={themeId}
              onChange={(e) => onThemeIdChange(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="clean">Clean</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <span className="text-outline-variant">·</span>

          <div className="flex items-center gap-space-xs">
            <span className="text-secondary">Size:</span>
            <input 
              type="number"
              min="8"
              max="24"
              className="w-14 bg-transparent border border-outline-variant/30 rounded px-2 py-1 text-on-surface focus:outline-none focus:border-primary tabular-nums text-code-sm"
              value={baseFontSize}
              onChange={(e) => onBaseFontSizeChange(parseInt(e.target.value) || 12)}
            />
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <button 
            onClick={onOpenInspector}
            className="flex items-center gap-space-xxs text-secondary hover:text-on-surface transition-colors font-code-sm text-code-sm px-space-xs py-space-xxs rounded bg-surface-container-low border border-outline-variant/30 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            Details
          </button>
          <div className="flex items-center gap-space-xs bg-surface rounded p-space-xxs shadow-xs">
            <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"><span className="material-symbols-outlined text-[16px]">remove</span></button>
            <span className="tabular-nums font-medium text-on-surface px-space-xs">100%</span>
            <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"><span className="material-symbols-outlined text-[16px]">add</span></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center p-space-lg overflow-y-auto">
        <div className="w-full max-w-[816px] bg-surface-container-lowest transition-colors duration-500 p-space-xxl shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] rounded flex flex-col min-h-[1056px] relative border border-outline-variant/30 prose prose-slate max-w-none">
          {isCompiling && (
            <div className="absolute inset-0 bg-surface-container-lowest/50 flex items-center justify-center rounded z-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="relative z-10 font-serif text-on-surface [&>h1]:text-headline-xl [&>h2]:text-headline-lg [&>h3]:text-headline-md [&_*]:transition-colors [&_*]:duration-500">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return <MermaidPreview code={String(children).replace(/\n$/, '')} />;
                  }
                  return <code className={className} {...props}>{children}</code>;
                }
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
