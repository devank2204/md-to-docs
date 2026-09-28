import { useState, useEffect } from 'react';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { validateDocument } from '@mdtodocs/validation';
import { renderToClipboardHtml } from '@mdtodocs/renderers/src/clipboard';
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
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
  onDocumentSignatureChange: (signature: { enabled: boolean; placement: 'every-page' | 'last-page' }) => void;
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

function countElements(doc: Root): DocumentStats {
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

  visit(doc, (node: any) => {
    switch (node.type) {
      case 'heading': stats.headings++; break;
      case 'paragraph': stats.paragraphs++; break;
      case 'list': stats.lists++; break;
      case 'table': stats.tables++; break;
      case 'code': stats.codeBlocks++; break;
      case 'image': stats.images++; break;
      case 'blockquote': stats.blockquotes++; break;
      case 'containerDirective': stats.callouts++; break;
      case 'math': stats.codeBlocks++; break; // or map to something else
    }
  });

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
  activeTheme,
  documentSignature,
  onDocumentSignatureChange
}: WorkspaceProps) {
  const [isFidelityPanelOpen, setIsFidelityPanelOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledState, setCompiledState] = useState<{
    diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
    stats: any;
    validationReport: any;
    htmlContent: string;
  }>({
    diagnostics: [],
    stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0, mermaidRendered: 0, mermaidFailed: 0 },
    validationReport: null,
    htmlContent: '',
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

        // Count before planner optimizations
        const docStats = countElements(doc);

        doc = planRepresentation(doc, destination, collector);
        const validationReport = validateDocument(doc, destination);
        const htmlContent = renderToClipboardHtml(doc, activeTheme);

        if (isMounted) {
          setCompiledState({
            diagnostics: collector.getAll(),
            stats: docStats,
            validationReport,
            htmlContent,
          });
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setCompiledState({
            diagnostics: [],
            stats: { headings: 0, paragraphs: 0, lists: 0, tables: 0, codeBlocks: 0, images: 0, blockquotes: 0, callouts: 0, mermaidRendered: 0, mermaidFailed: 0 },
            validationReport: null,
            htmlContent: '',
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

  const { diagnostics, stats, validationReport } = compiledState;
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
          markdown={markdown}
          destination={destination}
          onDestinationChange={onDestinationChange}
          themeId={themeId}
          onThemeIdChange={onThemeIdChange}
          baseFontSize={baseFontSize}
          onBaseFontSizeChange={onBaseFontSizeChange}
          isCompiling={isCompiling}
          onOpenInspector={() => setIsInspectorOpen(true)}
          documentSignature={documentSignature}
          onDocumentSignatureChange={onDocumentSignatureChange}
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
