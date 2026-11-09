import { useDocumentCompilation } from '@/hooks/useDocumentCompilation';
import { useSyncedScroll } from '@/hooks/useSyncedScroll';
import { useState, useEffect, useRef } from 'react';
import {
  applyRescueFix,
  applyAllRescueFixes,
  type RescueDiagnostic,
} from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { useStore } from '@/store';
import { FidelityCheckPanel } from '@/components/FidelityCheckPanel';
import { DocumentInspector } from '@/components/DocumentInspector';
import { DocumentRescuePanel } from '@/components/DocumentRescuePanel';
import { DocumentEditor } from '@/components/DocumentEditor';
import { DocumentPreview } from '@/components/DocumentPreview';
import { StatusBar } from '@/components/StatusBar';
import { SuggestEditModal } from '@/components/SuggestEditModal';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { MermaidRepairAssistant } from './MermaidRepairAssistant';
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
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  useSyncedScroll(workspaceRef, syncScroll && !isMobile && !isReviewMode, markdown, activeDocumentId);
  const compiledState = useDocumentCompilation(markdown, destination, activeTheme, activeDocumentId);
  const { isCompiling, compilationError } = compiledState;
  const docTitle = markdown.match(/^#\s+(.+)$/m)?.[1].trim() || 'Document';
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const lines = markdown.split('\n').length;
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

  if (isMobile) return <MobileWorkspace markdown={markdown} onInput={onInput} destination={destination} onDestinationChange={onDestinationChange} activeTheme={activeTheme} documentSignature={documentSignature} isCompiling={isCompiling} diagnostics={diagnostics} compilationError={compilationError}/>;

  return (
    <div ref={workspaceRef} className="flex flex-col w-full h-[calc(100vh-3rem)] overflow-hidden">
      <MermaidRepairAssistant />
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
                syncScroll={syncScroll}
                onSyncScrollChange={() => setSyncScroll(value => !value)}
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
