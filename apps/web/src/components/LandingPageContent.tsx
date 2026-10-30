import { useState } from 'react';
import type { RouteLandingSpec, LandingRoutePath } from '@/routes/landingData';

interface LandingPageContentProps {
  spec: RouteLandingSpec;
  onLoadSample: (markdown: string) => void;
  onNavigateRoute: (path: LandingRoutePath) => void;
}

export function LandingPageContent({
  spec,
  onLoadSample,
  onNavigateRoute,
}: LandingPageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const allRoutes: { path: LandingRoutePath; label: string; icon: string }[] = [
    { path: '/markdown-to-word', label: 'Word (.docx)', icon: 'description' },
    { path: '/markdown-to-pdf', label: 'PDF Document', icon: 'picture_as_pdf' },
    { path: '/markdown-to-google-docs', label: 'Google Docs', icon: 'content_paste' },
    { path: '/markdown-to-html', label: 'Standalone HTML', icon: 'code' },
    { path: '/markdown-to-rich-text', label: 'Rich Text Clipboard', icon: 'table_view' },
    { path: '/mermaid-to-svg', label: 'Mermaid to SVG', icon: 'account_tree' },
    { path: '/mermaid-to-png', label: 'Mermaid to PNG', icon: 'image' },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-16 flex flex-col gap-12 text-on-surface select-text">
      {/* Route Switcher Pills */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-[11px] font-code-sm uppercase tracking-wider text-outline font-semibold">
          Conversion Destinations
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-xs">
          {allRoutes.map((r) => {
            const isActive = r.path === spec.path;
            return (
              <button
                key={r.path}
                type="button"
                onClick={() => onNavigateRoute(r.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Intent Context */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-3">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          <span>{spec.badge}</span>
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-on-surface mb-3">
          {spec.h1}
        </h2>
        <p className="text-secondary text-sm sm:text-base leading-relaxed">
          {spec.lead}
        </p>

        {/* Instant Sample Launcher */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onLoadSample(spec.sampleMarkdown)}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl font-code-sm text-xs font-medium transition-all flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span>Load {spec.badge} Sample</span>
          </button>
        </div>
      </div>

      {/* Feature & Pipeline Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {spec.featureBullets.map((bullet, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-3 hover:border-outline-variant/70 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">check</span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
              {bullet}
            </p>
          </div>
        ))}
      </div>

      {/* Intent Limitations & Boundaries (Zero Silent Drops) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
          <div>
            <h3 className="font-serif text-lg font-medium text-on-surface">
              Capability Boundaries &amp; Handled Limits
            </h3>
            <p className="text-xs text-outline font-code-sm">
              Zero silent drops — intentional formatting constraints and automated polyfills
            </p>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px]">verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {spec.limitations.map((limit, idx) => {
            const statusConfig = {
              'supported': { label: 'Supported', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              'handled-gracefully': { label: 'Graceful Fallback', color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' },
              'blocked': { label: 'Blocked with Reason', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
            }[limit.status];

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-xs text-on-surface">
                      {limit.boundary}
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    {limit.details}
                  </p>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex items-center">
                  <span className={`text-[10px] font-code-sm font-medium px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Format Compatibility Matrix */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
          <div>
            <h3 className="font-serif text-lg font-medium text-on-surface">
              Technical Verification Matrix
            </h3>
            <p className="text-xs text-outline font-code-sm">
              Tested against real destination applications and parsers
            </p>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px]">fact_check</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant font-medium">
                <th className="py-2.5 px-4">Feature</th>
                <th className="py-2.5 px-4">Engine Implementation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4">Verification Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {spec.formatMatrix.map((item, idx) => {
                const statusBadge = {
                  'native': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                  'styled': 'bg-primary/10 text-primary border-primary/20',
                  'fallback': 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
                  'blocked': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                }[item.status];

                return (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-on-surface whitespace-nowrap">
                      {item.feature}
                    </td>
                    <td className="py-2.5 px-4 text-secondary leading-snug">
                      {item.targetBehavior}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-code-sm px-2 py-0.5 rounded-md border font-medium uppercase tracking-wider ${statusBadge}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-outline font-code-sm text-[11px]">
                      {item.evidence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
          <div>
            <h3 className="font-serif text-lg font-medium text-on-surface">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-outline font-code-sm">
              Specific to {spec.badge} conversions
            </p>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px]">help_outline</span>
        </div>

        <div className="flex flex-col gap-2">
          {spec.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-3.5 px-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span
                    className="material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-secondary leading-relaxed border-t border-outline-variant/20 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
