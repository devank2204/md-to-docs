import type { ValidationReport } from '@mdtodocs/validation';
import type { DiagnosticsCollector } from '@mdtodocs/compiler-core';

interface FidelityCheckPanelProps {
  report: ValidationReport | null;
  diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
  isOpen: boolean;
  onClose: () => void;
}

export function FidelityCheckPanel({ report, diagnostics, isOpen, onClose }: FidelityCheckPanelProps) {
  if (!isOpen || !report) return null;

  const warnings = diagnostics.filter((d) => d.severity === 'warning' || d.severity === 'error');
  const infos = diagnostics.filter((d) => d.severity === 'info');

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm shadow-2xl bg-surface border-l border-outline-variant/30 flex flex-col transform transition-transform animate-in slide-in-from-right">
      {/* Header */}
      <div className="px-space-md py-space-sm bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Document Health
          </h3>
          <p className={`font-code-sm text-code-sm ${report.summary.fidelityScore === 100 ? 'text-primary' : 'text-on-surface-variant'}`}>
            {report.summary.fidelityScore}% preserved
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="p-space-md flex flex-col gap-space-md flex-1 overflow-y-auto">
        {/* Results summary */}
        <div className="bg-surface-container p-space-sm rounded font-code-sm text-code-sm text-on-surface flex flex-col gap-space-xs">
          <div className="flex items-center justify-between text-secondary pb-space-xs border-b border-outline-variant/20">
            <span>Element</span>
            <span>Result</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Elements ({report.summary.total})</span>
            <span className="flex items-center gap-space-xxs text-primary">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {report.summary.preserved} Preserved
            </span>
          </div>

          {report.summary.transformed > 0 && (
            <div className="flex items-center justify-between">
              <span>Transformed</span>
              <span className="text-secondary">{report.summary.transformed}</span>
            </div>
          )}

          {report.summary.degraded > 0 && (
            <div className="flex items-center justify-between">
              <span>Degraded</span>
              <span className="text-error">{report.summary.degraded}</span>
            </div>
          )}
          
          {report.summary.unsupported > 0 && (
            <div className="flex items-center justify-between">
              <span>Unsupported</span>
              <span className="text-error">{report.summary.unsupported}</span>
            </div>
          )}
        </div>

        {/* Actionable Diagnostics */}
        {(warnings.length > 0 || infos.length > 0) && (
          <div className="flex flex-col gap-space-sm">
            <h4 className="font-code-sm text-code-sm font-medium text-on-surface border-b border-outline-variant/20 pb-space-xxs">
              Transformations & Diagnostics
            </h4>
            <ul className="space-y-space-sm">
              {warnings.map(diag => (
                <li key={diag.id} className="font-body-sm text-body-sm text-on-surface bg-error-container/20 p-space-sm rounded border border-error-container/50 flex flex-col gap-1">
                  <div className="flex items-center gap-space-xs font-medium">
                    <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                    {diag.message}
                  </div>
                  {diag.suggestedAction && <span className="text-secondary/90 pl-[24px]">{diag.suggestedAction}</span>}
                </li>
              ))}
              {infos.map(diag => (
                <li key={diag.id} className="font-body-sm text-body-sm text-on-surface bg-surface-container-low p-space-sm rounded border border-outline-variant/20 flex items-center gap-space-xs">
                   <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                   {diag.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
