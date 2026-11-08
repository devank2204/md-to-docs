import { useState } from 'react';
import {
  findMermaidBlocks,
  proposeMermaidRepair,
} from '@mdtodocs/compiler-core';
import { renderMermaid } from '@mdtodocs/asset-pipeline';
import { WorkspaceSheet } from './WorkspaceSheet';

export function MermaidCodeRepair({
  code,
  onApply,
  open,
  onClose,
}: {
  code: string;
  onApply: (value: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [proposal, setProposal] = useState<{
    before: string;
    after: string;
    changes: string[];
    svg?: string;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<{ before: string; after: string } | null>(
    null,
  );
  const check = async () => {
    setBusy(true);
    const before = code;
    try {
      const font = getComputedStyle(document.body).fontFamily;
      const blocks = findMermaidBlocks(code);
      const wrapped = blocks.length === 1 && blocks[0].format !== 'standalone';
      const body = wrapped ? blocks[0].code : code;
      const original = await renderMermaid(body, { repair: false, font });
      const repair = original.success
        ? { code: body, changes: [] as string[] }
        : proposeMermaidRepair(body);
      const changes = wrapped
        ? [
            'Remove the document wrapper for the diagram editor.',
            ...repair.changes,
          ]
        : repair.changes;
      const result =
        repair.code === body
          ? original
          : await renderMermaid(repair.code, { repair: false, font });
      setProposal({
        before,
        after: repair.code,
        changes,
        svg: result.success ? result.svg : undefined,
        error: result.success ? undefined : result.error.message,
      });
    } catch {
      setProposal({
        before,
        after: before,
        changes: [],
        error: 'Could not validate this diagram. Your source is unchanged.',
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {undo && code === undo.after && (
        <button
          type="button"
          className="underline font-code-sm text-code-sm"
          onClick={() => {
            if (code === undo.after) onApply(undo.before);
            setUndo(null);
          }}
        >
          Undo diagram fix
        </button>
      )}
      {open && (
        <WorkspaceSheet title="Review Mermaid fix" onClose={onClose}>
          <div className="sheet-options">
            <p className="sheet-description">
              Check predictable syntax locally, review the result, then apply.
              Unknown errors stay editable.
            </p>
            <button
              type="button"
              className="mobile-secondary"
              disabled={busy}
              onClick={check}
            >
              {busy ? 'Validating diagram…' : 'Check this diagram'}
            </button>
            {proposal && (
              <>
                {proposal.changes.map((change) => (
                  <p key={change}>{change}</p>
                ))}
                {proposal.error && (
                  <p role="alert">
                    No validated automatic fix is available: {proposal.error}
                  </p>
                )}
                {!proposal.error && !proposal.changes.length && (
                  <p role="status">
                    This diagram already renders. No fix is needed.
                  </p>
                )}
                <details>
                  <summary>Original source</summary>
                  <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto font-code-sm text-code-sm">
                    {proposal.before}
                  </pre>
                </details>
                <details open>
                  <summary>Proposed source</summary>
                  <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto font-code-sm text-code-sm">
                    {proposal.after}
                  </pre>
                </details>
                {proposal.svg && (
                  <div
                    aria-label="Validated Mermaid preview"
                    className="bg-white max-h-64 overflow-auto [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: proposal.svg }}
                  />
                )}
                {proposal.changes.length > 0 && proposal.svg && (
                  <button
                    type="button"
                    className="mobile-primary"
                    disabled={code !== proposal.before}
                    onClick={() => {
                      if (code !== proposal.before) return;
                      setUndo({
                        before: proposal.before,
                        after: proposal.after,
                      });
                      onApply(proposal.after);
                      onClose();
                      setProposal(null);
                    }}
                  >
                    Apply validated fix
                  </button>
                )}
                {code !== proposal.before && (
                  <p role="alert">
                    Source changed. Check this diagram again before applying.
                  </p>
                )}
              </>
            )}
            <button
              type="button"
              className="mobile-secondary"
              onClick={onClose}
            >
              Keep original source
            </button>
          </div>
        </WorkspaceSheet>
      )}
    </>
  );
}
