import { useState, useEffect } from 'react';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { Block, DiagramBlock } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { renderToHtml } from '@mdtodocs/renderers';
import { validateDocument } from '@mdtodocs/validation';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { FidelityCheckPanel } from '@/components/FidelityCheckPanel';
import { DocumentInspector } from '@/components/DocumentInspector';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentPreview } from '@/components/DocumentPreview';
import { StatusBar } from '@/components/StatusBar';

interface WorkspaceProps {
  markdown: string;
  onInput: (markdown: string) => void;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
  themeId: string;
  onThemeIdChange: (themeId: any) => void;
  baseFontSize: number;
  onBaseFontSizeChange: (size: number) => void;
  activeTheme: any;
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
  mermaidRendered: number;
  mermaidFailed: number;
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
    mermaidRendered: 0,
    mermaidFailed: 0,
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'Heading': stats.headings++; break;
      case 'Paragraph': stats.paragraphs++; break;
      case 'List': stats.lists++; break;
      case 'Table': stats.tables++; break;
      case 'CodeBlock': stats.codeBlocks++; break;
      case 'ImageBlock': stats.images++; break;
      case 'DiagramBlock': 
        if ((block as any).renderStatus === 'error') {
          stats.mermaidFailed++;
        } else {
          stats.mermaidRendered++;
        }
        break;
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
  if (stats.mermaidRendered > 0) parts.push(`${stats.mermaidRendered} Mermaid diagram${stats.mermaidRendered !== 1 ? 's' : ''} rendered`);
  if (stats.mermaidFailed > 0) parts.push(`${stats.mermaidFailed} Mermaid diagram${stats.mermaidFailed !== 1 ? 's' : ''} failed`);
  return parts.join(' · ');
}



export function Workspace({ 
  markdown, 
  onInput, 
  destination, 
  onDestinationChange,
  themeId,
  onThemeIdChange,
  baseFontSize,
  onBaseFontSizeChange,
  activeTheme
}: WorkspaceProps) {
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
    stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0, mermaidRendered: 0, mermaidFailed: 0 },
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
        
        // Resolve assets asynchronously
        doc = await resolveAssets(doc);
        
        // Count before planner optimizations (like table->list)
        const docStats = countElements(doc.blocks);
        if (docStats.mermaidFailed > 0) {
          const firstMermaidBlock = doc.blocks.find(b => b.type === 'DiagramBlock' && b.renderStatus === 'error') as DiagramBlock;
          const errMsg = firstMermaidBlock?.error?.message || 'Unknown error';
          collector.add({
            severity: 'warning',
            message: `${docStats.mermaidFailed} Mermaid diagram${docStats.mermaidFailed > 1 ? 's' : ''} could not be rendered`,
            suggestedAction: `Error details: ${errMsg}`,
          });
        }
        
        doc = planRepresentation(doc, destination, collector);
        const validationReport = validateDocument(doc, destination);
        
        if (isMounted) {
          setCompiledState({
            htmlContent: renderToHtml(doc, activeTheme),
            diagnostics: collector.getAll(),
            stats: docStats,
            validationReport,
          });
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setCompiledState({
            htmlContent: '<div class="text-error font-body-md p-space-md bg-error-container/20 rounded border border-error-container/50">Error compiling markdown.</div>',
            diagnostics: [],
            stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0, mermaidRendered: 0, mermaidFailed: 0 },
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
  }, [markdown, destination, activeTheme]);

  const { htmlContent, diagnostics, stats, validationReport } = compiledState;
  const warnings = diagnostics.filter(d => d.severity === 'warning' || d.severity === 'error');
  const statsText = formatStats(stats);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3rem)]">
      <div className="w-full grid grid-cols-12 h-full">
        <DocumentEditor 
          markdown={markdown}
          onInput={onInput}
          words={words}
          lines={lines}
        />

        <DocumentPreview 
          htmlContent={htmlContent}
          destination={destination}
          onDestinationChange={onDestinationChange}
          themeId={themeId}
          onThemeIdChange={onThemeIdChange}
          baseFontSize={baseFontSize}
          onBaseFontSizeChange={onBaseFontSizeChange}
          isCompiling={isCompiling}
          onOpenInspector={() => setIsInspectorOpen(true)}
        />
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

      <StatusBar 
        isCompiling={isCompiling}
        warningsCount={warnings.length}
        fidelityScore={validationReport?.summary?.fidelityScore}
        statsText={statsText}
        destination={destination}
        onToggleFidelityPanel={() => setIsFidelityPanelOpen(!isFidelityPanelOpen)}
      />
    </div>
  );
}
