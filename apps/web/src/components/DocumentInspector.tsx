import { useState } from 'react';
import type { ValidationReport } from '@mdtodocs/validation';
import type { DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { DestinationType, SupportLevel } from '@mdtodocs/capability-graph';
import { DESTINATIONS, FEATURE_CAPABILITIES } from '@mdtodocs/capability-graph';

interface DocumentInspectorProps {
  report: ValidationReport | null;
  diagnostics: ReturnType<DiagnosticsCollector['getAll']>;
  stats: any;
  isOpen: boolean;
  onClose: () => void;
  destination?: DestinationType;
  onDestinationChange?: (dest: DestinationType) => void;
}

type InspectorTab = 'diagnostics' | 'capabilities' | 'elements';

const DESTINATION_OPTIONS: { id: DestinationType; label: string; icon: string }[] = [
  { id: 'google-docs', label: 'Docs', icon: 'description' },
  { id: 'word', label: 'Word', icon: 'article' },
  { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
  { id: 'clipboard', label: 'Copy', icon: 'content_copy' },
];

export function DocumentInspector({
  report,
  diagnostics,
  stats,
  isOpen,
  onClose,
  destination = 'google-docs',
  onDestinationChange,
}: DocumentInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('diagnostics');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const activeDest = destination || report?.destination || 'google-docs';
  const fidelityScore = report?.summary?.fidelityScore ?? 100;
  const activePolyfills = report?.activePolyfills ?? [];

  const getFidelityColor = (score: number) => {
    if (score >= 95) return 'text-success';
    if (score >= 80) return 'text-primary';
    return 'text-error';
  };

  const getFidelityBg = (score: number) => {
    if (score >= 95) return 'bg-success';
    if (score >= 80) return 'bg-primary';
    return 'bg-error';
  };

  const getSupportBadge = (level: SupportLevel) => {
    switch (level) {
      case 'native':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-code-sm font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Native
          </span>
        );
      case 'styled':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-code-sm font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Styled
          </span>
        );
      case 'transformed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-code-sm font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Transformed
          </span>
        );
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-code-sm font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Vector Asset
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-code-sm font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Unsupported
          </span>
        );
    }
  };

  const filteredFeatures = FEATURE_CAPABILITIES.filter((feat) => {
    if (categoryFilter === 'all') return true;
    return feat.category === categoryFilter;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/25 z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="fixed top-12 right-0 bottom-7 w-[440px] max-w-[92vw] bg-surface border-l border-outline-variant/30 shadow-2xl z-50 flex flex-col transform transition-transform animate-in slide-in-from-right overflow-hidden">
        {/* Header */}
        <div className="px-space-md py-space-sm bg-surface-container-low border-b border-outline-variant/20 flex flex-col gap-space-xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
              <h2 className="font-code-lg text-code-lg font-semibold text-on-surface">
                Capability Inspector
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-secondary transition-colors"
              title="Close Inspector"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Destination Selector Pills */}
          <div className="flex items-center justify-between pt-space-xxs">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Destination:
            </span>
            <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
              {DESTINATION_OPTIONS.map((dest) => {
                const isSelected = activeDest === dest.id;
                return (
                  <button
                    key={dest.id}
                    onClick={() => onDestinationChange?.(dest.id)}
                    className={`px-2 py-0.5 rounded text-code-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {dest.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-outline-variant/20 bg-surface-container-lowest px-space-md shrink-0">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`py-2 px-space-xs border-b-2 font-code-sm text-code-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`py-2 px-space-xs border-b-2 font-code-sm text-code-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'capabilities'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">schema</span>
            Capability Matrix
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`py-2 px-space-xs border-b-2 font-code-sm text-code-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'elements'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
            Audit
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-lg">
          {/* TAB 1: DIAGNOSTICS & HEALTH */}
          {activeTab === 'diagnostics' && (
            <div className="flex flex-col gap-space-lg">
              {/* Target & Fidelity Card */}
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-space-md flex flex-col gap-space-sm shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                      Target Fidelity
                    </span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {DESTINATIONS[activeDest]?.name || activeDest}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-headline-lg text-headline-lg font-bold tabular-nums ${getFidelityColor(fidelityScore)}`}>
                      {fidelityScore}%
                    </span>
                  </div>
                </div>

                {/* Fidelity Progress Meter */}
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getFidelityBg(fidelityScore)}`}
                    style={{ width: `${fidelityScore}%` }}
                  />
                </div>

                {/* Score Breakdown Pills */}
                {report && (
                  <div className="grid grid-cols-4 gap-1.5 pt-space-xs text-center">
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[10px] text-secondary font-code-sm">Preserved</span>
                      <span className="font-code-md text-code-md font-semibold text-primary">
                        {report.summary.preserved}
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[10px] text-secondary font-code-sm">Transformed</span>
                      <span className="font-code-md text-code-md font-semibold text-amber-600">
                        {report.summary.transformed}
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[10px] text-secondary font-code-sm">Degraded</span>
                      <span className="font-code-md text-code-md font-semibold text-rose-600">
                        {report.summary.degraded}
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[10px] text-secondary font-code-sm">Unsupported</span>
                      <span className="font-code-md text-code-md font-semibold text-rose-600">
                        {report.summary.unsupported}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Polyfills & Transformations */}
              <section className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-code-sm text-code-sm font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">speed</span>
                    Active Polyfills & Protections
                  </h3>
                  <span className="text-secondary font-code-sm text-[11px]">
                    {activePolyfills.length} active
                  </span>
                </div>

                {activePolyfills.length === 0 ? (
                  <div className="p-space-sm bg-surface-container-lowest rounded border border-outline-variant/30 text-secondary font-body-sm text-body-sm flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
                    All elements map directly to {DESTINATIONS[activeDest]?.name} without polyfills.
                  </div>
                ) : (
                  <div className="flex flex-col gap-space-xs">
                    {activePolyfills.map((polyfill) => (
                      <div
                        key={polyfill.id}
                        className={`p-space-sm rounded border flex flex-col gap-1 font-body-sm text-body-sm ${
                          polyfill.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-on-surface'
                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5 font-code-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {polyfill.category === 'table' ? 'table_chart' :
                               polyfill.category === 'math' ? 'functions' :
                               polyfill.category === 'mermaid' ? 'schema' :
                               polyfill.category === 'callout' ? 'chat_bubble_outline' :
                               polyfill.category === 'list' ? 'check_box' : 'format_list_bulleted'}
                            </span>
                            {polyfill.name}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-code-sm">
                            {polyfill.count}
                          </span>
                        </div>
                        <p className="text-secondary text-[12px] leading-relaxed">
                          {polyfill.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Compiler Diagnostics */}
              <section className="flex flex-col gap-space-sm">
                <h3 className="font-code-sm text-code-sm font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Diagnostics & Warnings
                </h3>

                {diagnostics.length === 0 ? (
                  <div className="text-secondary font-body-sm text-body-sm p-space-sm bg-surface-container-lowest rounded border border-outline-variant/30 flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
                    No compilation or formatting warnings detected.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-space-xs">
                    {diagnostics.map((diag) => (
                      <li
                        key={diag.id}
                        className={`p-space-sm rounded border flex flex-col gap-1 font-body-sm text-body-sm ${
                          diag.severity === 'error'
                            ? 'bg-error-container/20 border-error-container/50 text-error'
                            : diag.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-on-surface'
                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface'
                        }`}
                      >
                        <div className="flex items-start gap-space-xs font-medium">
                          <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">
                            {diag.severity === 'error'
                              ? 'error'
                              : diag.severity === 'warning'
                              ? 'warning'
                              : 'info'}
                          </span>
                          <span className="text-[12px]">{diag.message}</span>
                        </div>
                        {diag.suggestedAction && (
                          <span className="pl-6 text-secondary text-[11px] leading-relaxed">
                            {diag.suggestedAction}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: CAPABILITY MATRIX */}
          {activeTab === 'capabilities' && (
            <div className="flex flex-col gap-space-md">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0">
                {['all', 'typography', 'structure', 'advanced', 'assets'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-code-sm capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-surface-container text-secondary hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Feature Capability Cards */}
              <div className="flex flex-col gap-space-sm">
                {filteredFeatures.map((feat) => {
                  const currentLevel = feat.support[activeDest];
                  return (
                    <div
                      key={feat.id}
                      className="bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-space-xs">
                        <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                          {feat.name}
                        </span>
                        {getSupportBadge(currentLevel)}
                      </div>

                      <p className="text-secondary font-body-sm text-[12px] leading-relaxed">
                        {feat.description}
                      </p>

                      {feat.polyfill && currentLevel !== 'native' && (
                        <div className="text-[11px] text-amber-700 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-body-sm">
                          Polyfill: {feat.polyfill}
                        </div>
                      )}

                      {/* Cross Destination Support Dots */}
                      <div className="flex items-center gap-space-md pt-1 border-t border-outline-variant/15 text-[10px] text-secondary font-code-sm">
                        <span className="text-[9px] uppercase tracking-wider text-outline">Targets:</span>
                        {(['google-docs', 'word', 'pdf', 'clipboard'] as DestinationType[]).map((d) => (
                          <span
                            key={d}
                            className={`flex items-center gap-1 ${
                              d === activeDest ? 'font-bold text-on-surface' : 'text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                feat.support[d] === 'native'
                                  ? 'bg-emerald-500'
                                  : feat.support[d] === 'styled'
                                  ? 'bg-blue-500'
                                  : feat.support[d] === 'image'
                                  ? 'bg-purple-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {d === 'google-docs' ? 'Docs' : d === 'clipboard' ? 'Copy' : d.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ELEMENT AUDIT & METRICS */}
          {activeTab === 'elements' && (
            <div className="flex flex-col gap-space-lg">
              {/* Reading Metrics */}
              <div className="grid grid-cols-3 gap-space-sm">
                <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                  <span className="text-secondary font-label-sm text-label-sm">Words</span>
                  <span className="font-code-lg text-code-lg text-on-surface font-semibold">
                    {stats?.words || 0}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                  <span className="text-secondary font-label-sm text-label-sm">Reading Time</span>
                  <span className="font-code-lg text-code-lg text-on-surface font-semibold">
                    {stats?.readingTimeMinutes || 1} min
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex flex-col">
                  <span className="text-secondary font-label-sm text-label-sm">Elements</span>
                  <span className="font-code-lg text-code-lg text-on-surface font-semibold">
                    {report?.summary?.total || 0}
                  </span>
                </div>
              </div>

              {/* Elements Breakdown Grid */}
              <section className="flex flex-col gap-space-sm">
                <h3 className="font-code-sm text-code-sm font-semibold text-secondary uppercase tracking-wider">
                  Document Elements
                </h3>
                <div className="grid grid-cols-2 gap-space-sm">
                  {[
                    { label: 'Headings (H1-H6)', value: stats?.headings || 0, icon: 'title' },
                    { label: 'Paragraphs', value: stats?.paragraphs || 0, icon: 'notes' },
                    { label: 'Standard Lists', value: stats?.lists || 0, icon: 'format_list_bulleted' },
                    { label: 'Task Lists (Checkboxes)', value: stats?.taskLists || 0, icon: 'check_box' },
                    { label: 'Tables', value: stats?.tables || 0, icon: 'table_chart' },
                    { label: 'Code Blocks', value: stats?.codeBlocks || 0, icon: 'code' },
                    { label: 'Mermaid Diagrams', value: stats?.mermaid || 0, icon: 'schema' },
                    { label: 'Equations (KaTeX)', value: stats?.math || 0, icon: 'functions' },
                    { label: 'Callout Containers', value: stats?.callouts || 0, icon: 'chat_bubble_outline' },
                    { label: 'Blockquotes', value: stats?.blockquotes || 0, icon: 'format_quote' },
                    { label: 'Footnotes & Citations', value: stats?.footnotes || 0, icon: 'format_list_numbered' },
                    { label: 'Images', value: stats?.images || 0, icon: 'image' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          {item.icon}
                        </span>
                        <span className="text-secondary font-label-sm text-label-sm">{item.label}</span>
                      </div>
                      <span className="font-code-md text-code-md font-semibold text-on-surface">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Export Recommendations */}
              <section className="p-space-sm bg-surface-container-low rounded border border-outline-variant/20 flex flex-col gap-1 text-[12px] font-body-sm text-secondary">
                <div className="flex items-center gap-1.5 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
                  Export Recommendation
                </div>
                <p>
                  Targeting <strong>{DESTINATIONS[activeDest]?.name}</strong> preserves{' '}
                  <strong>{report?.summary?.preserved || 0}</strong> native elements and applies{' '}
                  <strong>{activePolyfills.length}</strong> fidelity protections for layout stability.
                </p>
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
