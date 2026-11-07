import { useState, useEffect } from 'react';
import {
  parseMarkdown,
  planRepresentation,
  DiagnosticsCollector,
  analyzeDocumentForRescue,
  applyRescueFix,
  applyAllRescueFixes,
  type RescueDiagnostic,
} from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { validateDocument } from '@mdtodocs/validation';
import { useStore } from '@/store';
import { FidelityCheckPanel } from '@/components/FidelityCheckPanel';
import { DocumentInspector } from '@/components/DocumentInspector';
import { DocumentRescuePanel } from '@/components/DocumentRescuePanel';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentPreview } from '@/components/DocumentPreview';
import { StatusBar } from '@/components/StatusBar';
import { SuggestEditModal } from '@/components/SuggestEditModal';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { LinkedReview } from './LinkedReview';
import { WorkspaceSheet } from './WorkspaceSheet';
import { MobileWorkspace } from './MobileWorkspace';


interface WorkspaceProps {
  isMobile?: boolean;
  markdown: string;
  onInput: (markdown: string) => void;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
  activeTheme: any;
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
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
  isMobile = false,
  markdown,
  onInput,
  destination,
  onDestinationChange,
  activeTheme,
  documentSignature,
}: WorkspaceProps) {
  const isFidelityPanelOpen = useStore(state => state.isFidelityPanelOpen);
  const setIsFidelityPanelOpen = useStore(state => state.setIsFidelityPanelOpen);
  const isInspectorOpen = useStore(state => state.isInspectorOpen);
  const setIsInspectorOpen = useStore(state => state.setIsInspectorOpen);
  const isRescuePanelOpen = useStore(state => state.isRescuePanelOpen);
  const setIsRescuePanelOpen = useStore(state => state.setIsRescuePanelOpen);
  const isSuggestModalOpen = useStore(state => state.isSuggestModalOpen);
  const setIsSuggestModalOpen = useStore(state => state.setIsSuggestModalOpen);
  
  const isReviewMode = useStore(state => state.isReviewMode);
  const setCompiledDoc = useStore(state => state.setCompiledDoc);
  const setDiagnostics = useStore(state => state.setDiagnostics);
  const compilationPending = useStore(state => state.isCompiling);
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const compileKey = JSON.stringify([activeDocumentId, markdown, destination, activeTheme]);
  const setIsCompiling = useStore(state => state.setIsCompiling);

  const docTitleMatch = markdown.match(/^#\s+(.+)$/m);
  const docTitle = docTitleMatch ? docTitleMatch[1].trim() : 'Document';

  const [compilationError, setCompilationError] = useState(false);

  const [compiledState, setCompiledState] = useState<{
    inputKey: string;
    diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
    stats: any;
    validationReport: any;
  }>({
    inputKey: '',
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

  const isCompiling = compilationPending || compiledState.inputKey !== compileKey;
  const words = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lines = markdown.split('\n').length;

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (controller.signal.aborted) return;
      setIsCompiling(true);
      setCompilationError(false);

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
          const rescueDiags = analyzeDocumentForRescue(markdown, destination, doc);
          const plannerDiags = collector.getAll();
          const combinedDiagnostics: any[] = [...rescueDiags];

          for (const pd of plannerDiags) {
            if (!combinedDiagnostics.some(rd => rd.ruleId === pd.ruleId)) {
              combinedDiagnostics.push(pd);
            }
          }

          setCompiledState({
            inputKey: compileKey,
            diagnostics: combinedDiagnostics,
            stats: docStats,
            validationReport,
          });
          setCompiledDoc(doc);
          setDiagnostics(combinedDiagnostics, compileKey);
        }
      } catch (e: any) {
        if (!controller.signal.aborted) {
          console.error('Compilation error:', e);
          setCompilationError(true);
          setCompiledState({
            inputKey: compileKey,
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
          setDiagnostics([], compileKey, true);
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
  }, [markdown, destination, activeTheme, activeDocumentId, compileKey, setCompiledDoc, setDiagnostics, setIsCompiling]);

  const [linkedReviewOpen, setLinkedReviewOpen] = useState(false);
  useEffect(() => {
    if (isMobile) return;
    const open = () => setLinkedReviewOpen(true);
    window.addEventListener('mdtodocs:review', open);
    return () => window.removeEventListener('mdtodocs:review', open);
  }, [isMobile]);
  const { diagnostics, stats, validationReport } = compiledState;
  const warnings = diagnostics.filter(d => d.severity === 'warning' || d.severity === 'error');
  const statsText = formatStats(stats);

  if (isMobile) return <MobileWorkspace markdown={markdown} onInput={onInput} destination={destination} onDestinationChange={onDestinationChange} activeTheme={activeTheme} documentSignature={documentSignature} isCompiling={isCompiling} diagnostics={diagnostics} compilationError={compilationError && compiledState.inputKey === compileKey}/>;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3rem)] overflow-hidden">
      {isReviewMode ? (
        <div className="flex-1 w-full overflow-y-auto px-4 py-8 bg-surface-container-lowest">
          <div className="w-full flex justify-center pb-20">
            <DocumentPreview
              reviewNotes={isCompiling ? [] : warnings}
              markdown={markdown}
              destination={destination}
              isCompiling={isCompiling}
              documentSignature={documentSignature}
              isReviewMode={true}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden">
          <WorkspaceSidebar />

          <div className="flex-1 w-full grid grid-cols-12 min-h-0 overflow-y-auto md:overflow-hidden">
            <div className="flex flex-col col-span-5 lg:col-span-4 h-full min-h-0">
              <DocumentEditor
                markdown={markdown}
                onInput={onInput}
                words={words}
                lines={lines}
              />
            </div>

            <div className="flex flex-col col-span-7 lg:col-span-8 h-full min-h-0">
              <DocumentPreview
              reviewNotes={isCompiling ? [] : warnings}
                markdown={markdown}
                destination={destination}
                isCompiling={isCompiling}
                documentSignature={documentSignature}
              />
            </div>
          </div>
        </div>
      )}

      {linkedReviewOpen && <WorkspaceSheet title="Review your document" onClose={() => setLinkedReviewOpen(false)}>
        <LinkedReview notes={warnings} pending={isCompiling || compilationError} onNavigate={(view) => {
          if (view === 'edit') useStore.getState().setIsReviewMode(false);
          setLinkedReviewOpen(false);
        }} />
      </WorkspaceSheet>}
      <SuggestEditModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialSelection={typeof window !== 'undefined' ? window.getSelection()?.toString()?.trim() || '' : ''}
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

      <DocumentRescuePanel
        isOpen={isRescuePanelOpen}
        onClose={() => setIsRescuePanelOpen(false)}
        destination={destination}
        diagnostics={diagnostics as RescueDiagnostic[]}
        onApplyFix={(ruleId) => {
          const updated = applyRescueFix(markdown, ruleId, destination);
          onInput(updated);
        }}
        onApplyAllFixes={() => {
          const updated = applyAllRescueFixes(markdown, destination);
          onInput(updated);
        }}
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
