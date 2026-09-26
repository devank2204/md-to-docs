import type { ValidationReport } from '@mdtodocs/validation';
import type { DiagnosticsCollector } from '@mdtodocs/compiler-core';

interface DocumentInspectorProps {
  report: ValidationReport | null;
  diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
  stats: any;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentInspector({ report, diagnostics, stats, isOpen, onClose }: DocumentInspectorProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-primary/20 z-40 transition-opacity" 
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed top-12 right-0 bottom-7 w-[400px] bg-surface border-l border-outline-variant/30 shadow-2xl z-50 flex flex-col transform transition-transform animate-in slide-in-from-right overflow-hidden">
        {/* Header */}
        <div className="px-space-md py-space-sm bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <h2 className="font-code-lg text-code-lg font-medium text-on-surface flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Document Inspector
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-lg">
          
          {/* Overview */}
          <section className="flex flex-col gap-space-sm">
            <h3 className="font-code-sm text-code-sm font-medium text-secondary uppercase tracking-wider">Overview</h3>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Headings</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.headings || 0}</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Paragraphs</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.paragraphs || 0}</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Lists</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.lists || 0}</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Tables</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.tables || 0}</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Code Blocks</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.codeBlocks || 0}</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                <span className="text-secondary font-label-sm text-label-sm">Images</span>
                <span className="font-code-lg text-code-lg text-on-surface">{stats?.images || 0}</span>
              </div>
            </div>
          </section>

          {/* Compatibility */}
          {report && (
            <section className="flex flex-col gap-space-sm">
              <h3 className="font-code-sm text-code-sm font-medium text-secondary uppercase tracking-wider">Target: {report.destination}</h3>
              <div className="bg-surface-container-lowest rounded border border-outline-variant/30 overflow-hidden">
                <div className="p-space-sm flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low">
                  <span className="font-code-sm text-code-sm font-medium">Fidelity Score</span>
                  <span className={`font-code-sm text-code-sm font-bold ${report.summary.fidelityScore === 100 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {report.summary.fidelityScore}%
                  </span>
                </div>
                <div className="p-space-sm flex flex-col gap-space-xs font-code-sm text-code-sm text-on-surface">
                  <div className="flex justify-between">
                    <span>Preserved</span>
                    <span className="text-primary">{report.summary.preserved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transformed</span>
                    <span className="text-secondary">{report.summary.transformed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Degraded</span>
                    <span className="text-error">{report.summary.degraded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unsupported</span>
                    <span className="text-error">{report.summary.unsupported}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Diagnostics */}
          <section className="flex flex-col gap-space-sm">
            <h3 className="font-code-sm text-code-sm font-medium text-secondary uppercase tracking-wider">Diagnostics</h3>
            {diagnostics.length === 0 ? (
              <div className="text-secondary font-body-sm text-body-sm italic p-space-sm bg-surface-container-lowest rounded border border-outline-variant/30">
                No issues detected.
              </div>
            ) : (
              <ul className="flex flex-col gap-space-xs">
                {diagnostics.map(diag => (
                  <li key={diag.id} className={`p-space-sm rounded border flex flex-col gap-1 font-body-sm text-body-sm ${
                    diag.severity === 'error' ? 'bg-error-container/20 border-error-container/50 text-error' :
                    diag.severity === 'warning' ? 'bg-error-container/10 border-error-container/30 text-error' :
                    'bg-surface-container-lowest border-outline-variant/30 text-on-surface'
                  }`}>
                    <div className="flex items-start gap-space-xs font-medium">
                      <span className="material-symbols-outlined text-[16px] mt-0.5">
                        {diag.severity === 'error' ? 'error' : diag.severity === 'warning' ? 'warning' : 'info'}
                      </span>
                      <span>{diag.message}</span>
                    </div>
                    {diag.suggestedAction && (
                      <span className="pl-6 text-secondary/90">{diag.suggestedAction}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
