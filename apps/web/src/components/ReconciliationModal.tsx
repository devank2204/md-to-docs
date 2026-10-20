import { useState, useId, useRef } from 'react';
import { useStore } from '../store';
import {
  parseReviewNotesText,
  reconcileMarkdown,
  extractDocxComments,
  type ReconciliationPatch,
} from '@mdtodocs/renderers';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReconciliationModal(props: ReconciliationModalProps) {
  if (!props.isOpen) return null;
  return <ReconciliationModalContent {...props} />;
}

const SAMPLE_REVIEW_NOTES = `
Target: 500ms timeout
Replacement: 250ms p99 SLA
Comment: Tighten SLA per network team benchmark

---

Target: PostgreSQL 14
Replacement: PostgreSQL 16
Comment: Upgrade to latest LTS release

---

Target: AWS S3
Replacement: Cloudflare R2
Comment: Reduce data egress cost
`;

function ReconciliationModalContent({ onClose }: ReconciliationModalProps) {
  const currentMarkdown = useStore((s) => s.markdown);
  const setMarkdown = useStore((s) => s.setMarkdown);

  const [activeTab, setActiveTab] = useState<'paste' | 'docx' | 'manual'>('paste');
  const [reviewNotesText, setReviewNotesText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched' | 'applied'>('all');
  const [patches, setPatches] = useState<ReconciliationPatch[]>([]);
  const [previewDiff, setPreviewDiff] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual patch form
  const [manualTarget, setManualTarget] = useState('');
  const [manualReplacement, setManualReplacement] = useState('');
  const [manualComment, setManualComment] = useState('');
  const [manualAuthor, setManualAuthor] = useState('Author');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Evaluate patches against current markdown
  const report = reconcileMarkdown(currentMarkdown, patches);

  const handleParseNotes = (textToParse: string) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const parsed = parseReviewNotesText(textToParse);
      if (parsed.length === 0) {
        setStatusMessage('No valid review comments or edit pairs found in text.');
      } else {
        setPatches(parsed);
        setStatusMessage(`Successfully detected ${parsed.length} review patch${parsed.length === 1 ? '' : 'es'}.`);
      }
    } catch (err: any) {
      setStatusMessage(`Error parsing notes: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setReviewNotesText(SAMPLE_REVIEW_NOTES.trim());
    handleParseNotes(SAMPLE_REVIEW_NOTES.trim());
  };

  const handleDocxUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractDocxComments(buffer);
      if (extracted.length === 0) {
        setStatusMessage(`Parsed "${file.name}": No Word comments or track changes found in document.`);
      } else {
        setPatches(extracted);
        setStatusMessage(`Extracted ${extracted.length} Word comment${extracted.length === 1 ? '' : 's'} and track changes from "${file.name}".`);
      }
    } catch (err: any) {
      setStatusMessage(`Failed to read Word file: ${err?.message || 'Invalid .docx format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualPatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTarget.trim()) return;

    const newPatch: ReconciliationPatch = {
      id: `manual-${Date.now()}`,
      targetText: manualTarget.trim(),
      replacementText: manualReplacement.trim(),
      comment: manualComment.trim() || undefined,
      author: manualAuthor.trim() || 'Author',
      status: 'matched',
      selected: true,
    };

    setPatches((prev) => [newPatch, ...prev]);
    setManualTarget('');
    setManualReplacement('');
    setManualComment('');
    setStatusMessage('Added 1 manual patch.');
  };

  const handleToggleSelect = (id: string) => {
    setPatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdateReplacement = (id: string, newText: string) => {
    setPatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, replacementText: newText } : p))
    );
  };

  const handleRemovePatch = (id: string) => {
    setPatches((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSelectAllMatched = (select: boolean) => {
    setPatches((prev) =>
      prev.map((p) => {
        const isMatched = report.patches.find((rp) => rp.id === p.id)?.status === 'matched';
        return isMatched ? { ...p, selected: select } : p;
      })
    );
  };

  const handleApplyPatches = (onlySelected = true) => {
    useStore.getState().createSnapshot('Pre-Reconciliation Backup');

    const patchesToApply = patches.map((p) => ({
      ...p,
      selected: onlySelected ? p.selected : true,
    }));

    const finalReport = reconcileMarkdown(currentMarkdown, patchesToApply);
    setMarkdown(finalReport.updatedMarkdown);
    onClose();
  };


  // Filter patches for display
  const displayedPatches = report.patches.filter((p) => {
    if (filterStatus === 'matched') return p.status === 'matched';
    if (filterStatus === 'unmatched') return p.status === 'unmatched';
    if (filterStatus === 'applied') return p.status === 'already_applied';
    return true;
  });

  return (
    <div
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-high border border-outline-variant/60 rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-on-surface overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">sync_alt</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg text-on-surface tracking-tight">
                Reconciliation & Review Patch Studio
              </h2>
              <p className="text-xs text-on-surface-variant">
                Reconcile stakeholder Word comments, track changes, and review notes directly into your source Markdown.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-lg transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Source Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pt-3 pb-2">
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/50">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'paste'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">content_paste</span>
              <span>Paste Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('docx')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'docx'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>Import Word (.docx)</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'manual'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Manual Patch</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-primary hover:text-primary/80 font-medium px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
              <span>Try Sample Edits</span>
            </button>
          </div>
        </div>

        {/* Input Pane according to activeTab */}
        <div className="py-3 border-b border-outline-variant/40">
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Paste review notes, JSON edits, GitHub suggestions, or key-value pairs:</span>
                <span className="text-[11px] text-outline">Supports JSON, Target/Replacement, and Blockquotes</span>
              </div>
              <textarea
                value={reviewNotesText}
                onChange={(e) => {
                  setReviewNotesText(e.target.value);
                  handleParseNotes(e.target.value);
                }}
                placeholder="Target: 500ms timeout&#10;Replacement: 250ms p99 SLA&#10;Comment: Network SLA update"
                rows={3}
                className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
              />
            </div>
          )}

          {activeTab === 'docx' && (
            <div
              className="border-2 border-dashed border-outline-variant/80 hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-colors bg-surface-container-low/50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleDocxUpload(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleDocxUpload(e.target.files[0]);
                  }
                }}
              />
              <span className="material-symbols-outlined text-primary text-[36px] mb-2">upload_file</span>
              <p className="text-xs font-medium text-on-surface">
                Drop your reviewed Word (.docx) document here, or <span className="text-primary underline">browse</span>
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                md.to.docs will automatically extract all Word comments, reviewer authors, timestamps, and track changes.
              </p>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleAddManualPatch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  Target Text to Replace <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  placeholder="Exact text in document"
                  className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  Replacement Text
                </label>
                <input
                  type="text"
                  value={manualReplacement}
                  onChange={(e) => setManualReplacement(e.target.value)}
                  placeholder="New text to insert"
                  className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  Reviewer / Author
                </label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="Reviewer name"
                  className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                    Comment / Reason
                  </label>
                  <input
                    type="text"
                    value={manualComment}
                    onChange={(e) => setManualComment(e.target.value)}
                    placeholder="e.g. Updated per spec"
                    className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  Add Patch
                </button>
              </div>
            </form>
          )}

          {statusMessage && (
            <div className="mt-2 text-xs text-on-surface-variant flex items-center gap-1.5 animate-in fade-in">
              <span className={`material-symbols-outlined text-[16px] text-primary ${isProcessing ? 'animate-spin' : ''}`}>
                {isProcessing ? 'progress_activity' : 'info'}
              </span>
              <span>{statusMessage}</span>
            </div>
          )}

        </div>

        {/* Patch Metrics and Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface">
              {report.patches.length} Total {report.patches.length === 1 ? 'Patch' : 'Patches'}
            </span>
            <span className="text-outline-variant">•</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-surface-container-highest border-primary/40 text-on-surface'
                    : 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({report.patches.length})
              </button>
              <button
                onClick={() => setFilterStatus('matched')}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  filterStatus === 'matched'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'border-outline-variant/40 text-emerald-500/70 hover:text-emerald-400'
                }`}
              >
                ✓ Matched ({report.matchedCount})
              </button>
              <button
                onClick={() => setFilterStatus('unmatched')}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  filterStatus === 'unmatched'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'border-outline-variant/40 text-amber-500/70 hover:text-amber-400'
                }`}
              >
                ⚠ Unmatched ({report.unmatchedCount})
              </button>
              {report.appliedCount > 0 && (
                <button
                  onClick={() => setFilterStatus('applied')}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterStatus === 'applied'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'border-outline-variant/40 text-blue-500/70 hover:text-blue-400'
                  }`}
                >
                  Applied ({report.appliedCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAllMatched(true)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
            >
              Select All Matched
            </button>
            <span className="text-outline-variant">•</span>
            <button
              type="button"
              onClick={() => handleSelectAllMatched(false)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
            >
              Deselect All
            </button>
            <span className="text-outline-variant">•</span>
            <button
              type="button"
              onClick={() => setPreviewDiff(!previewDiff)}
              className={`text-[11px] font-medium px-2 py-1 rounded-md border transition-colors flex items-center gap-1 ${
                previewDiff
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-outline-variant/50 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">difference</span>
              <span>{previewDiff ? 'Hide Diff' : 'Preview Changes'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 pr-1">
          {previewDiff ? (
            /* Diff Preview */
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 text-xs font-mono">
              <div className="text-[11px] font-semibold text-primary mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Resulting Markdown Preview (with accepted patches applied):</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto text-on-surface select-text">
                {report.updatedMarkdown}
              </pre>
            </div>
          ) : displayedPatches.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-outline text-[40px] mb-2">find_replace</span>
              <p className="text-sm font-medium">No patches match the selected filter</p>
              <p className="text-xs text-outline mt-1">
                Paste review comments above or click &quot;Try Sample Edits&quot; to test reconciliation.
              </p>
            </div>
          ) : (
            displayedPatches.map((patch) => {
              const isMatched = patch.status === 'matched';
              const isAlreadyApplied = patch.status === 'already_applied';

              return (
                <div
                  key={patch.id}
                  className={`border rounded-xl p-3.5 transition-all flex flex-col gap-2.5 ${
                    isMatched
                      ? patch.selected
                        ? 'bg-surface-container-low border-primary/50 ring-1 ring-primary/20'
                        : 'bg-surface-container-low/70 border-outline-variant/40 opacity-75'
                      : isAlreadyApplied
                      ? 'bg-blue-500/5 border-blue-500/30'
                      : 'bg-amber-500/5 border-amber-500/30'
                  }`}
                >
                  {/* Top card row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={patch.selected}
                        disabled={!isMatched}
                        onChange={() => handleToggleSelect(patch.id)}
                        className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:opacity-40"
                      />
                      <span className="text-xs font-medium text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">person</span>
                        <span>{patch.author || 'Reviewer'}</span>
                      </span>
                      {patch.date && (
                        <span className="text-[11px] text-outline">
                          • {new Date(patch.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isMatched ? (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          <span>Ready to Apply {patch.line ? `(Line ${patch.line})` : ''}</span>
                        </span>
                      ) : isAlreadyApplied ? (
                        <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">done_all</span>
                          <span>Already in Document</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          <span>Target Not Found</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePatch(patch.id)}
                        className="text-on-surface-variant hover:text-error p-1 rounded transition-colors"
                        title="Remove patch"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Comment / Note text */}
                  {patch.comment && (
                    <div className="text-xs text-on-surface-variant bg-surface-container/60 border border-outline-variant/30 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">comment</span>
                      <span className="italic">{patch.comment}</span>
                    </div>
                  )}

                  {/* Visual Diff: Target vs Replacement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    {/* Old / Target */}
                    <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-2 text-red-300">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-red-400/80 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">remove</span>
                        <span>Original in Document:</span>
                      </div>
                      <div className="line-through break-words whitespace-pre-wrap">{patch.targetText}</div>
                    </div>

                    {/* New / Proposed Replacement */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-2 text-emerald-300">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        <span>Proposed Replacement:</span>
                      </div>
                      <input
                        type="text"
                        value={patch.replacementText}
                        onChange={(e) => handleUpdateReplacement(patch.id, e.target.value)}
                        placeholder="(Empty string will delete original)"
                        className="w-full bg-surface-container-low/80 border border-emerald-500/30 rounded px-1.5 py-1 text-xs text-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPatches([]);
                setStatusMessage(null);
                setReviewNotesText('');
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={report.matchedCount === 0}
              onClick={() => handleApplyPatches(true)}
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply Selected ({patches.filter((p) => p.selected && report.patches.find((rp) => rp.id === p.id)?.status === 'matched').length})
            </button>

            <button
              type="button"
              disabled={report.matchedCount === 0}
              onClick={() => handleApplyPatches(false)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Accept All Matched ({report.matchedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
