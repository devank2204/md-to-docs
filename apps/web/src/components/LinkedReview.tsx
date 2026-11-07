import { useMemo, useState } from 'react';
import {
  parseMarkdown,
  applyRescueFix,
  type DocumentDiagnostic,
} from '@mdtodocs/compiler-core';
import { useStore } from '@/store';
import { sourceBlock, selectSource } from '@/utils/sourceReview';

interface Props {
  notes: DocumentDiagnostic[];
  pending: boolean;
  onNavigate: (view: 'edit' | 'preview') => void;
}

export function LinkedReview({ notes, pending, onNavigate }: Props) {
  const { markdown, destination, activeDocumentId } = useStore();
  const [patch, setPatch] = useState<{
    before: string;
    after: string;
    docId: string;
    target: string;
  } | null>(null);
  const [undo, setUndo] = useState<typeof patch>(null);
  const [message, setMessage] = useState('');
  const tree = useMemo(() => parseMarkdown(markdown), [markdown]);
  const headings = tree.children.filter((node) => node.type === 'heading');
  const matches = (change: NonNullable<typeof patch>, value: string) => {
    const latest = useStore.getState();
    return (
      latest.markdown === value &&
      latest.activeDocumentId === change.docId &&
      latest.destination === change.target
    );
  };
  const go = (line: number, view: 'edit' | 'preview') => {
    const block = sourceBlock(markdown, line, tree);
    if (!block) return;
    onNavigate(view);
    requestAnimationFrame(() => {
      if (
        useStore.getState().markdown !== markdown ||
        useStore.getState().activeDocumentId !== activeDocumentId
      )
        return;
      if (view === 'edit') selectSource(markdown, block.start, block.end);
      else {
        const element = document.querySelector<HTMLElement>(
          `[data-source-line="${block.line}"]`,
        );
        if (element) {
          let parent = element.parentElement;
          while (parent) {
            if (parent instanceof HTMLDetailsElement) parent.open = true;
            parent = parent.parentElement;
          }
          element.scrollIntoView({ block: 'center', behavior: 'instant' });
          element.tabIndex = -1;
          element.focus({ preventScroll: true });
        }
      }
    });
  };
  return (
    <div className="linked-review sheet-options">
      <p className="sheet-description">
        {pending
          ? 'Checking your latest text…'
          : notes.length
            ? 'Review what may change in your chosen app.'
            : 'No structural formatting issues found.'}
      </p>
      {!pending &&
        notes.map((note, index) => {
          const block = note.position
            ? sourceBlock(markdown, note.position.line, tree)
            : null;
          return (
            <article key={`${note.id}-${index}`} className="review-note">
              <p>{note.message}</p>
              {block && (
                <>
                  <pre>{block.text}</pre>
                  <button
                    type="button"
                    className="mobile-secondary"
                    onClick={() => go(note.position!.line, 'edit')}
                  >
                    Edit source · line {note.position!.line}
                  </button>
                  {document.querySelector(
                    `[data-source-line="${block.line}"]`,
                  ) && (
                    <button
                      type="button"
                      className="mobile-secondary"
                      onClick={() => go(note.position!.line, 'preview')}
                    >
                      Show in document
                    </button>
                  )}
                </>
              )}
              {note.fixAction?.autoFixable && (
                <button
                  type="button"
                  className="mobile-secondary"
                  onClick={() => {
                    const after = applyRescueFix(
                      markdown,
                      note.ruleId,
                      destination,
                    );
                    if (after === markdown) {
                      setMessage(
                        'No automatic change available. Edit the source to resolve this note.',
                      );
                      return;
                    }
                    setPatch({
                      before: markdown,
                      after,
                      docId: activeDocumentId,
                      target: destination,
                    });
                  }}
                >
                  Preview fix for this rule
                </button>
              )}
            </article>
          );
        })}
      {patch && (
        <section className="review-note">
          <p>
            This rule can affect multiple matching objects. Review the complete
            proposed source before applying.
          </p>
          <details>
            <summary>Current source</summary>
            <pre>{patch.before}</pre>
          </details>
          <details open>
            <summary>Proposed source</summary>
            <pre>{patch.after}</pre>
          </details>
          <button
            type="button"
            className="mobile-primary"
            disabled={!matches(patch, patch.before)}
            onClick={() => {
              if (!matches(patch, patch.before)) return;
              useStore
                .getState()
                .createSnapshot('Before reviewed formatting fix');
              useStore.getState().setMarkdown(patch.after);
              setUndo(patch);
              setPatch(null);
              setMessage(
                'Change applied. A backup was saved in version history.',
              );
            }}
          >
            Apply reviewed change
          </button>
          {!matches(patch, patch.before) && (
            <p role="status">
              Text or destination changed. Preview this fix again.
            </p>
          )}
          <button
            type="button"
            className="mobile-secondary"
            onClick={() => setPatch(null)}
          >
            Discard proposed change
          </button>
        </section>
      )}
      {undo && (
        <button
          type="button"
          className="mobile-secondary"
          disabled={!matches(undo, undo.after)}
          onClick={() => {
            if (!matches(undo, undo.after)) return;
            useStore.getState().setMarkdown(undo.before);
            setUndo(null);
            setMessage('Change undone.');
          }}
        >
          Undo reviewed change
        </button>
      )}
      {message && <p role="status">{message}</p>}
      {!!headings.length && (
        <details>
          <summary>Document outline · {headings.length} sections</summary>
          <div className="sheet-list">
            {headings.map((node) => (
              <button
                key={node.position!.start.offset}
                type="button"
                onClick={() => go(node.position!.start.line, 'edit')}
              >
                {markdown
                  .slice(node.position!.start.offset, node.position!.end.offset)
                  .replace(/^#+\s*/, '')}
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </details>
      )}
      <p className="sheet-description">
        Formatting can vary after pasting. Review important documents in the
        receiving app.
      </p>
    </div>
  );
}
