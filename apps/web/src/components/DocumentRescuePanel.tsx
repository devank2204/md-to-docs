import { useEffect } from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';
import type { RescueDiagnostic } from '@mdtodocs/compiler-core';

interface DocumentRescuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  destination: DestinationType;
  diagnostics: RescueDiagnostic[];
  onApplyFix: (ruleId: string) => void;
  onApplyAllFixes: () => void;
}

export function DocumentRescuePanel({
  isOpen,
  onClose,
  destination,
  diagnostics,
  onApplyFix,
  onApplyAllFixes,
}: DocumentRescuePanelProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const errors = diagnostics.filter(d => d.severity === 'error');
  const warnings = diagnostics.filter(d => d.severity === 'warning');
  const suggestions = diagnostics.filter(d => d.severity === 'info');
  const autoFixableIssues = diagnostics.filter(d => d.fixAction?.autoFixable);

  const destinationLabels: Record<DestinationType, string> = {
    'google-docs': 'Google Docs',
    'word': 'Microsoft Word (.docx)',
    'pdf': 'PDF Print / Export',
    'clipboard': 'Formatted Clipboard',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-surface border-l border-outline-variant/50 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-250 select-text"
        role="dialog"
        aria-label="Document Rescue & Preflight Diagnostics"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[20px]">healing</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-on-surface">Document Rescue</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant font-medium">
                  {destinationLabels[destination] || destination}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Deterministic pre-export layout checks &amp; 1-click repairs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Close panel (Esc)"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Action Header / Summary */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/20 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-on-surface">Preflight Status:</span>
              {errors.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
                </span>
              )}
              {suggestions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {suggestions.length} {suggestions.length === 1 ? 'Suggestion' : 'Suggestions'}
                </span>
              )}
              {diagnostics.length === 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Zero Issues
                </span>
              )}
            </div>

            {autoFixableIssues.length > 0 && (
              <button
                type="button"
                onClick={onApplyAllFixes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-hover text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Apply all safe automated repairs in a single pass"
              >
                <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                <span>Apply All Safe Fixes ({autoFixableIssues.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Issues List */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {diagnostics.length === 0 ? (
            <div className="my-auto py-12 px-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 shadow-xs">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <h3 className="font-semibold text-sm text-on-surface">100% Export Ready</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mt-1.5 leading-relaxed">
                All tables, equations, code blocks, diagrams, and elements comply with the target{' '}
                <strong className="text-on-surface font-semibold">{destinationLabels[destination]}</strong> layout contract.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>Zero Silent Content Drops Guaranteed</span>
              </div>
            </div>
          ) : (
            diagnostics.map((diag, index) => {
              const isError = diag.severity === 'error';
              const isWarning = diag.severity === 'warning';
              const isAutoFixable = diag.fixAction?.autoFixable;

              return (
                <div
                  key={diag.id || index}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isError
                      ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                      : 'bg-surface-container-low border-outline-variant/40'
                  }`}
                >
                  {/* Card Top Pill Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${
                          isError
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isError ? 'error' : isWarning ? 'warning' : 'info'}
                        </span>
                        {diag.severity}
                      </span>

                      {diag.position?.line && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                          Line {diag.position.line}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isAutoFixable
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isAutoFixable ? 'bolt' : 'visibility'}
                      </span>
                      <span>{isAutoFixable ? '1-Click Auto-Repair' : 'Visual Verification'}</span>
                    </span>
                  </div>

                  {/* Message & Explanation */}
                  <p className="text-xs text-on-surface font-medium leading-relaxed mb-1.5">
                    {diag.message}
                  </p>

                  {diag.suggestedAction && (
                    <p className="text-[11px] text-on-surface-variant leading-normal mb-3 pl-2 border-l-2 border-outline-variant/40">
                      {diag.suggestedAction}
                    </p>
                  )}

                  {/* Card Action Button */}
                  {isAutoFixable && diag.fixAction && (
                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                      <span className="text-[10px] text-outline">Safe non-destructive repair</span>
                      <button
                        type="button"
                        onClick={() => onApplyFix(diag.ruleId)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title={diag.fixAction.description}
                      >
                        <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                        <span>{diag.fixAction.label}</span>
                      </button>
                    </div>
                  )}

                  {diag.requiresVisualVerification && !isAutoFixable && (
                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-outline">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">visibility</span>
                        <span>Check layout in print preview before exporting</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/30 text-[10px] text-outline text-center shrink-0">
          Deterministic rules catalog · Zero fabricated confidence scores · Source-preserving
        </div>
      </aside>
    </>
  );
}
