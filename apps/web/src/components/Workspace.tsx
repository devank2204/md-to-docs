import { useState, useEffect } from 'react';
import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { validateDocument } from '@mdtodocs/validation';
import { useStore } from '@/store';
import { FidelityCheckPanel } from '@/components/FidelityCheckPanel';
import { DocumentInspector } from '@/components/DocumentInspector';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentPreview } from '@/components/DocumentPreview';
import { StatusBar } from '@/components/StatusBar';
import { ReviewActionBar } from '@/components/ReviewActionBar';
import { SuggestEditModal } from '@/components/SuggestEditModal';

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
  taskLists: number;
  tables: number;
  codeBlocks: number;
  images: number;
  blockquotes: number;
  callouts: number;
  math: number;
  footnotes: number;
  mermaid: number;
  words: number;
  readingTimeMinutes: number;
}

function countElements(doc: Root, rawText: string): DocumentStats {
  const words = rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const stats: DocumentStats = {
    headings: 0,
    paragraphs: 0,
    lists: 0,
    taskLists: 0,
    tables: 0,
    codeBlocks: 0,
    images: 0,
    blockquotes: 0,
    callouts: 0,
    math: 0,
    footnotes: 0,
    mermaid: 0,
    words,
    readingTimeMinutes,
  };

  visit(doc, (node: any) => {
    switch (node.type) {
      case 'heading': stats.headings++; break;
      case 'paragraph': stats.paragraphs++; break;
      case 'list': {
        const hasTask = node.children?.some((item: any) => item.checked !== null && item.checked !== undefined);
        if (hasTask) {
          stats.taskLists++;
        } else {
          stats.lists++;
        }
        break;
      }
      case 'table': stats.tables++; break;
      case 'code':
        if (node.lang === 'mermaid') {
          stats.mermaid++;
        } else {
          stats.codeBlocks++;
        }
        break;
      case 'image': stats.images++; break;
      case 'blockquote': stats.blockquotes++; break;
      case 'containerDirective': stats.callouts++; break;
      case 'math':
      case 'inlineMath':
        stats.math++;
        break;
      case 'footnoteReference':
      case 'footnoteDefinition':
        stats.footnotes++;
        break;
    }
  });

  return stats;
}

function formatStats(stats: DocumentStats): string {
  const parts: string[] = [];
  if (stats.headings > 0) parts.push(`${stats.headings} heading${stats.headings !== 1 ? 's' : ''}`);
  if (stats.tables > 0) parts.push(`${stats.tables} table${stats.tables !== 1 ? 's' : ''}`);
  if (stats.codeBlocks > 0) parts.push(`${stats.codeBlocks} code block${stats.codeBlocks !== 1 ? 's' : ''}`);
  if (stats.mermaid > 0) parts.push(`${stats.mermaid} diagram${stats.mermaid !== 1 ? 's' : ''}`);
  if (stats.math > 0) parts.push(`${stats.math} equation${stats.math !== 1 ? 's' : ''}`);
  if (stats.callouts > 0) parts.push(`${stats.callouts} callout${stats.callouts !== 1 ? 's' : ''}`);
  if (stats.taskLists > 0) parts.push(`${stats.taskLists} task list${stats.taskLists !== 1 ? 's' : ''}`);
  if (stats.footnotes > 0) parts.push(`${stats.footnotes} footnote${stats.footnotes !== 1 ? 's' : ''}`);
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
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState('');
  
  const isReviewMode = useStore(state => state.isReviewMode);
  const setCompiledDoc = useStore(state => state.setCompiledDoc);
  const isCompiling = useStore(state => state.isCompiling);
  const setIsCompiling = useStore(state => state.setIsCompiling);

  const docTitleMatch = markdown.match(/^#\s+(.+)$/m);
  const docTitle = docTitleMatch ? docTitleMatch[1].trim() : 'Document';

  const handleOpenSuggestModal = () => {
    const selection = typeof window !== 'undefined' ? window.getSelection()?.toString()?.trim() || '' : '';
    setSelectedPassage(selection);
    setIsSuggestModalOpen(true);
  };

  const [compiledState, setCompiledState] = useState<{
    diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
    stats: any;
    validationReport: any;
  }>({
    diagnostics: [],
    stats: {
      headings: 0,
      paragraphs: 0,
      lists: 0,
      taskLists: 0,
      tables: 0,
      codeBlocks: 0,
      images: 0,
      blockquotes: 0,
      callouts: 0,
      math: 0,
      footnotes: 0,
      mermaid: 0,
      words: 0,
      readingTimeMinutes: 1,
    },
    validationReport: null,
  });

  const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lines = markdown.split('\n').length;

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      if (controller.signal.aborted) return;
      setIsCompiling(true);

      try {
        const collector = new DiagnosticsCollector();
        let doc = parseMarkdown(markdown);
        if (controller.signal.aborted) return;

        // Resolve assets asynchronously with abort signal
        doc = await resolveAssets(doc, controller.signal);
        if (controller.signal.aborted) return;

        // Count before planner optimizations
        const docStats = countElements(doc, markdown);

        doc = planRepresentation(doc, destination, collector);
        if (controller.signal.aborted) return;

        const validationReport = validateDocument(doc, destination);

        if (!controller.signal.aborted) {
          setCompiledState({
            diagnostics: collector.getAll(),
            stats: docStats,
            validationReport,
          });
          setCompiledDoc(doc);
        }
      } catch (e: any) {
        if (!controller.signal.aborted) {
          console.error('Compilation error:', e);
          setCompiledState({
            diagnostics: [],
            stats: {
              headings: 0,
              paragraphs: 0,
              lists: 0,
              taskLists: 0,
              tables: 0,
              codeBlocks: 0,
              images: 0,
              blockquotes: 0,
              callouts: 0,
              math: 0,
              footnotes: 0,
              mermaid: 0,
              words: 0,
              readingTimeMinutes: 1,
            },
            validationReport: null,
          });
          setCompiledDoc(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCompiling(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [markdown, destination, activeTheme, setCompiledDoc, setIsCompiling]);

  const { diagnostics, stats, validationReport } = compiledState;
  const warnings = diagnostics.filter(d => d.severity === 'warning' || d.severity === 'error');
  const statsText = formatStats(stats);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3rem)] overflow-hidden">
      {isReviewMode ? (
        <div className="flex-1 w-full overflow-y-auto px-4 py-4 bg-surface-container-lowest">
          <ReviewActionBar
            markdown={markdown}
            readingTimeMinutes={stats.readingTimeMinutes}
            wordCount={words}
            activeTheme={activeTheme}
            documentSignature={documentSignature}
            onOpenSuggestModal={handleOpenSuggestModal}
          />
          <div className="w-full flex justify-center pb-20">
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
              isReviewMode={true}
            />
          </div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-12 h-full min-h-0 overflow-y-auto md:overflow-hidden">
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
      )}

      <SuggestEditModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialSelection={selectedPassage}
        documentTitle={docTitle}
      />

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
        destination={destination}
        onDestinationChange={onDestinationChange}
      />

      {!isReviewMode && (
        <StatusBar
          isCompiling={isCompiling}
          warningsCount={warnings.length}
          fidelityScore={validationReport?.summary?.fidelityScore}
          statsText={statsText}
          destination={destination}
          onToggleFidelityPanel={() => setIsFidelityPanelOpen(!isFidelityPanelOpen)}
        />
      )}
    </div>
  );
}
