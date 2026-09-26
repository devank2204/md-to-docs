import { useState, useEffect } from 'react';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { Block } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { renderToHtml } from '@mdtodocs/renderers';
import { validateDocument } from '@mdtodocs/validation';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { FidelityCheckPanel } from './FidelityCheckPanel';
import { DocumentInspector } from './DocumentInspector';

interface WorkspaceProps {
  markdown: string;
  onInput: (markdown: string) => void;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
}

interface DocumentStats {
  headings: number;
  paragraphs: number;
  lists: number;
  tables: number;
  codeBlocks: number;
  images: number;
  blockquotes: number;
  callouts: number;
}

function countElements(blocks: Block[]): DocumentStats {
  const stats: DocumentStats = {
    headings: 0,
    paragraphs: 0,
    lists: 0,
    tables: 0,
    codeBlocks: 0,
    images: 0,
    blockquotes: 0,
    callouts: 0,
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'Heading': stats.headings++; break;
      case 'Paragraph': stats.paragraphs++; break;
      case 'List': stats.lists++; break;
      case 'Table': stats.tables++; break;
      case 'CodeBlock': stats.codeBlocks++; break;
      case 'ImageBlock': stats.images++; break;
      case 'Blockquote':
        stats.blockquotes++;
        // Count nested elements
        const nested = countElements(block.blocks);
        Object.keys(nested).forEach((key) => {
          stats[key as keyof DocumentStats] += nested[key as keyof DocumentStats];
        });
        break;
      case 'Callout':
        stats.callouts++;
        const calloutNested = countElements(block.blocks);
        Object.keys(calloutNested).forEach((key) => {
          stats[key as keyof DocumentStats] += calloutNested[key as keyof DocumentStats];
        });
        break;
    }
  }

  return stats;
}

function formatStats(stats: DocumentStats): string {
  const parts: string[] = [];
  if (stats.headings > 0) parts.push(`${stats.headings} heading${stats.headings !== 1 ? 's' : ''}`);
  if (stats.tables > 0) parts.push(`${stats.tables} table${stats.tables !== 1 ? 's' : ''}`);
  if (stats.codeBlocks > 0) parts.push(`${stats.codeBlocks} code block${stats.codeBlocks !== 1 ? 's' : ''}`);
  if (stats.images > 0) parts.push(`${stats.images} image${stats.images !== 1 ? 's' : ''}`);
  if (stats.lists > 0) parts.push(`${stats.lists} list${stats.lists !== 1 ? 's' : ''}`);
  if (stats.callouts > 0) parts.push(`${stats.callouts} callout${stats.callouts !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}

const DEST_LABELS: Record<DestinationType, string> = {
  'google-docs': 'Google Docs',
  'word': 'Word (.docx)',
  'pdf': 'PDF',
  'clipboard': 'Clipboard',
};

export function Workspace({ markdown, onInput, destination, onDestinationChange }: WorkspaceProps) {
  const [isFidelityPanelOpen, setIsFidelityPanelOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledState, setCompiledState] = useState<{
    htmlContent: string;
    diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
    stats: any;
    validationReport: any;
  }>({
    htmlContent: '',
    diagnostics: [],
    stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0 },
    validationReport: null,
  });
  
  const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lines = markdown.split('\n').length;

  useEffect(() => {
    let isMounted = true;
    
    async function compile() {
      if (isMounted) setIsCompiling(true);
      try {
        const collector = new DiagnosticsCollector();
        let doc = parseMarkdown(markdown);
        
        // Count before planner optimizations (like table->list)
        const docStats = countElements(doc.blocks);
        
        // Resolve assets asynchronously
        doc = await resolveAssets(doc);
        
        doc = planRepresentation(doc, destination, collector);
        const validationReport = validateDocument(doc, destination);
        
        if (isMounted) {
          setCompiledState({
            htmlContent: renderToHtml(doc),
            diagnostics: collector.getAll(),
            stats: docStats,
            validationReport,
          });
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setCompiledState({
            htmlContent: '<div style="color:#ef4444;">Error compiling markdown.</div>',
            diagnostics: [],
            stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0 },
            validationReport: null,
          });
        }
      } finally {
        if (isMounted) setIsCompiling(false);
      }
    }

    compile();

    return () => {
      isMounted = false;
    };
  }, [markdown, destination]);

  const { htmlContent, diagnostics, stats, validationReport } = compiledState;
  const warnings = diagnostics.filter(d => d.severity === 'warning' || d.severity === 'error');
  const statsText = formatStats(stats);

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
            <span className="text-label-sm font-label-sm text-secondary">CommonMark + GFM</span>
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

              <div className="flex bg-surface-container rounded p-0.5">
                {(['google-docs', 'word', 'pdf', 'clipboard'] as DestinationType[]).map((dest) => (
                  <button
                    key={dest}
                    onClick={() => onDestinationChange(dest)}
                    className={`px-space-xs py-space-xxs rounded font-code-sm text-code-sm ${
                      destination === dest
                        ? 'bg-surface text-on-surface shadow-sm'
                        : 'text-secondary hover:text-on-surface transition-colors'
                    }`}
                  >
                    {DEST_LABELS[dest]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-space-md">
              <button 
                onClick={() => setIsInspectorOpen(true)}
                className="flex items-center gap-space-xxs text-secondary hover:text-on-surface transition-colors font-code-sm text-code-sm px-space-xs py-space-xxs rounded bg-surface-container-low border border-outline-variant/30 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">info</span>
                Details
              </button>
              <div className="flex items-center gap-space-xs bg-surface rounded p-space-xxs shadow-xs">
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                <span className="tabular-nums font-medium text-on-surface px-space-xs">100%</span>
                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-[16px]">add</span></button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center p-space-lg overflow-y-auto">
            {/* The Document Canvas */}
            <div className="w-full max-w-[816px] bg-surface-container-lowest p-space-xxl shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] rounded flex flex-col min-h-[1056px] relative border border-outline-variant/30">
              <div
                className="relative z-10 flex flex-col font-body-md text-on-surface [&>h1]:font-headline-xl [&>h1]:text-headline-xl [&>h2]:font-headline-lg [&>h2]:text-headline-lg [&>h3]:font-headline-md [&>h3]:text-headline-md"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      </div>

      <FidelityCheckPanel 
        isOpen={isFidelityPanelOpen} 
        onClose={() => setIsFidelityPanelOpen(false)} 
        report={validationReport}
        diagnostics={diagnostics}
      />

      <DocumentInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        report={validationReport}
        diagnostics={diagnostics}
        stats={stats}
      />

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between px-space-md font-code-sm text-code-sm text-secondary z-40">
        <div className="flex items-center gap-space-sm">
          <button 
            onClick={() => setIsFidelityPanelOpen(!isFidelityPanelOpen)}
            className="flex items-center gap-space-xxs hover:text-on-surface transition-colors focus:outline-none"
          >
            {isCompiling ? (
              <span className="flex items-center gap-space-xxs text-secondary">
                <span className="material-symbols-outlined text-[13px] animate-spin">refresh</span>
                Compiling...
              </span>
            ) : warnings.length === 0 ? (
              <span className="flex items-center gap-space-xxs text-primary">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                Everything preserved {validationReport && `(${validationReport.summary.fidelityScore}%)`}
              </span>
            ) : (
              <span className="flex items-center gap-space-xxs text-error">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                {warnings.length} {warnings.length === 1 ? 'issue' : 'issues'} {validationReport && `(${validationReport.summary.fidelityScore}%)`}
              </span>
            )}
          </button>
          {statsText && !isCompiling && (
            <>
              <span className="text-outline-variant">·</span>
              <span>{statsText}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-space-sm">
          <span>Target: {DEST_LABELS[destination]}</span>
        </div>
      </div>
    </div>
  );
}
