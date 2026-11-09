import { useEffect, useState } from 'react';
import { parseMarkdown, planRepresentation, DiagnosticsCollector, analyzeDocumentForRescue } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { validateDocument } from '@mdtodocs/validation';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { useStore } from '@/store';
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

export function useDocumentCompilation(markdown: string, destination: any, activeTheme: any, activeDocumentId: string) {
 const setCompiledDoc = useStore(state => state.setCompiledDoc);
 const setDiagnostics = useStore(state => state.setDiagnostics);
 const compilationPending = useStore(state => state.isCompiling);
  const compileKey = JSON.stringify([activeDocumentId, markdown, destination, activeTheme]);
  const setIsCompiling = useStore(state => state.setIsCompiling);

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

 return { ...compiledState, isCompiling, compilationError: compilationError && compiledState.inputKey === compileKey };
}
export function MobileCompilation({ activeTheme }: { activeTheme: any }) {
 const markdown = useStore(state => state.markdown);
 const destination = useStore(state => state.destination);
 const id = useStore(state => state.activeDocumentId);
 useDocumentCompilation(markdown, destination, activeTheme, id);
 return null;
}
