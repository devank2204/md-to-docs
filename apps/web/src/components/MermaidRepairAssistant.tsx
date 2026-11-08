import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  findMermaidBlocks,
  proposeMermaidRepair,
  applyMermaidRepairs,
  type MermaidBlock,
} from '@mdtodocs/compiler-core';
import { renderMermaid } from '@mdtodocs/asset-pipeline';
import { useStore } from '@/store';
import { WorkspaceSheet } from './WorkspaceSheet';

interface Entry {
  block: MermaidBlock;
  code: string;
  changes: string[];
  svg?: string;
  error?: string;
  ready: boolean;
}
interface Review {
  source: string;
  docId: string;
  selected?: number;
  entries: Entry[] | null;
}

export function MermaidRepairAssistant() {
  const markdown = useStore((state) => state.markdown);
  const deferredMarkdown = useDeferredValue(markdown);
  const documentId = useStore((state) => state.activeDocumentId);
  const [review, setReview] = useState<Review | null>(null);
  const [undo, setUndo] = useState<{
    before: string;
    after: string;
    docId: string;
    count: number;
  } | null>(null);
  const [message, setMessage] = useState('');
  const candidates = useMemo(
    () =>
      findMermaidBlocks(deferredMarkdown).filter(
        (block) =>
          block.format !== 'fenced' ||
          !block.original.startsWith(block.fence + 'mermaid') ||
          proposeMermaidRepair(block.code).code !== block.code,
      ),
    [deferredMarkdown],
  );
  useEffect(() => {
    const open = (event: Event) => {
      const state = useStore.getState();
      setReview({
        source: state.markdown,
        docId: state.activeDocumentId,
        selected: (event as CustomEvent).detail?.sourceStart,
        entries: null,
      });
      setMessage('');
    };
    window.addEventListener('mdtodocs:mermaid-review', open);
    return () => window.removeEventListener('mdtodocs:mermaid-review', open);
  }, []);
  useEffect(() => {
    if (!review || review.entries !== null) return;
    let active = true;
    const paperFont = document.querySelector(
      '[data-document-paper] .font-serif',
    );
    const font = getComputedStyle(paperFont || document.body).fontFamily;
    const blocks = findMermaidBlocks(review.source).filter(
      (block) =>
        review.selected === undefined || block.start === review.selected,
    );
    Promise.all(
      blocks.map(async (block) => {
        const original = await renderMermaid(block.code, {
          repair: false,
          font,
        });
        const proposal = original.success
          ? { code: block.code, changes: [] as string[] }
          : proposeMermaidRepair(block.code);
        const changes = [...proposal.changes];
        if (block.format === 'azure')
          changes.unshift(
            'Convert the Azure DevOps ::: container to a portable Mermaid code fence.',
          );
        else if (block.format === 'standalone')
          changes.unshift(
            'Wrap the standalone diagram in a Mermaid code fence.',
          );
        else if (!block.original.startsWith(block.fence + 'mermaid'))
          changes.unshift(
            'Normalize the Mermaid code fence language identifier.',
          );
        const checked =
          proposal.code === block.code
            ? original
            : await renderMermaid(proposal.code, { repair: false, font });
        return {
          block,
          code: proposal.code,
          changes,
          ready: checked.success && changes.length > 0,
          svg: checked.success ? checked.svg : undefined,
          error: checked.success ? undefined : checked.error.message,
        };
      }),
    )
      .then((entries) => {
        if (active)
          setReview((existing) =>
            existing &&
            existing.source === review.source &&
            existing.docId === review.docId
              ? { ...existing, entries }
              : existing,
          );
      })
      .catch(() => {
        if (active)
          setMessage(
            'Could not validate this diagram. Your source is unchanged.',
          );
      });
    return () => {
      active = false;
    };
  }, [review]);
  const current =
    !!review && documentId === review.docId && markdown === review.source;
  const apply = (entries: Entry[]) => {
    if (!review || !entries.length || entries.some((entry) => !entry.ready))
      return;
    const state = useStore.getState();
    if (
      state.activeDocumentId !== review.docId ||
      state.markdown !== review.source
    ) {
      setMessage('Your document changed. Review the latest text again.');
      return;
    }
    try {
      const after = applyMermaidRepairs(
        state.markdown,
        review.source,
        entries.map((entry) => ({ block: entry.block, code: entry.code })),
      );
      state.createSnapshot('Before Mermaid repair');
      state.setMarkdown(after);
      setUndo({
        before: review.source,
        after,
        docId: review.docId,
        count: entries.length,
      });
      setReview(null);
      setMessage(
        `${entries.length} diagram${entries.length === 1 ? '' : 's'} fixed. Original source saved in version history.`,
      );
    } catch {
      setMessage('Your diagram source changed. Review again before applying.');
    }
  };
  const ready = review?.entries?.filter((entry) => entry.ready) || [];
  return (
    <>
      {(candidates.length > 0 || message) && (
        <div
          data-print-hide
          className="mermaid-repair-notice flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-outline-variant/30 bg-surface-container-low text-on-surface font-code-sm text-code-sm shrink-0"
        >
          <span role="status">
            {message ||
              `${candidates.length} diagram compatibility ${candidates.length === 1 ? 'suggestion' : 'suggestions'}`}
          </span>
          {candidates.length > 0 && (
            <button
              type="button"
              className="underline min-h-[44px]"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('mdtodocs:mermaid-review'))
              }
            >
              Review diagram fixes
            </button>
          )}
          {undo && documentId === undo.docId && (
            <button
              type="button"
              className="underline min-h-[44px] disabled:opacity-40"
              disabled={markdown !== undo.after}
              onClick={() => {
                const state = useStore.getState();
                if (
                  state.markdown !== undo.after ||
                  state.activeDocumentId !== undo.docId
                )
                  return;
                state.setMarkdown(undo.before);
                setUndo(null);
                setMessage('Mermaid repair undone.');
              }}
            >
              Undo Mermaid fixes
            </button>
          )}
        </div>
      )}
      {review && (
        <WorkspaceSheet
          title="Review Mermaid fixes"
          onClose={() => setReview(null)}
        >
          <div className="sheet-options">
            <p className="sheet-description">
              Predictable repairs run locally. Your diagram meaning stays yours.
              Only fixes that render successfully can be applied; your original
              source is backed up.
            </p>
            {!review.entries && (
              <p role="status">
                Checking diagrams and validating proposed fixes…
              </p>
            )}
            {review.entries?.length === 0 && (
              <p role="alert">
                This diagram source could not be located. Close this review and
                use Review diagram fixes for the latest document.
              </p>
            )}
            {!current && (
              <p role="alert">
                Your document changed. Close this review and check the latest
                source again.
              </p>
            )}
            {review.entries?.map((entry) => (
              <section key={entry.block.start} className="review-note">
                <h3 className="font-code-sm text-code-sm">
                  Diagram at line {entry.block.line}
                </h3>
                {entry.changes.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {entry.changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                ) : (
                  !entry.error && (
                    <p>
                      This diagram already renders. No source change is needed.
                    </p>
                  )
                )}
                {entry.error && (
                  <p role="status">
                    No validated automatic fix is available yet. Edit the
                    diagram source to resolve: {entry.error}
                  </p>
                )}
                <details>
                  <summary className="min-h-[44px] cursor-pointer">
                    Original source
                  </summary>
                  <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto font-code-sm text-code-sm">
                    {entry.block.original}
                  </pre>
                </details>
                {!!entry.changes.length && (
                  <details open>
                    <summary className="min-h-[44px] cursor-pointer">
                      Proposed Mermaid source
                    </summary>
                    <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto font-code-sm text-code-sm">
                      {entry.code}
                    </pre>
                  </details>
                )}
                {entry.svg && (
                  <div
                    aria-label={`Validated diagram preview at line ${entry.block.line}`}
                    className="bg-white overflow-auto max-h-64 [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: entry.svg }}
                  />
                )}
                {entry.ready && (
                  <button
                    className="mobile-primary"
                    type="button"
                    disabled={!current}
                    onClick={() => apply([entry])}
                  >
                    Apply fix to diagram at line {entry.block.line}
                  </button>
                )}
              </section>
            ))}
            {ready.length > 1 && (
              <button
                className="mobile-primary"
                type="button"
                disabled={!current}
                onClick={() => apply(ready)}
              >
                Apply all {ready.length} validated fixes
              </button>
            )}
            <button
              type="button"
              className="mobile-secondary"
              onClick={() => setReview(null)}
            >
              Keep original source
            </button>
          </div>
        </WorkspaceSheet>
      )}
    </>
  );
}
