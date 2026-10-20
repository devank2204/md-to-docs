import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function AboutModal() {
  const isOpen = useStore((s) => s.isAboutModalOpen);
  const setIsOpen = useStore((s) => s.setIsAboutModalOpen);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface/95 dark:bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/50 rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden select-none animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          title="Close dialog (Escape)"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/mark.png" alt="mdtodocs logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <div>
            <div className="flex items-baseline gap-1">
              <h2 id="about-modal-title" className="font-code-lg text-lg font-bold tracking-tight text-on-surface">
                mdtodocs
              </h2>
              <span className="font-code-sm text-xs text-outline">.com</span>
              <span className="ml-2 px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-semibold border border-primary/20">
                v1.0
              </span>
            </div>
            <p className="font-serif text-xs text-secondary">
              Pixel-perfect Markdown to Docs compiler
            </p>
          </div>
        </div>

        {/* Mission & Description */}
        <p className="font-serif text-sm leading-relaxed text-on-surface-variant mb-5">
          Converts CommonMark and GitHub Flavored Markdown into native Google Docs formatted clipboards, Word (.docx) packages, and publication-ready PDFs. Keeps tables aligned, KaTeX equations crisp, and Mermaid diagrams intact.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs font-sans">
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">schema</span>
            <div>
              <div className="font-semibold text-on-surface text-[12px]">Mermaid &amp; KaTeX</div>
              <div className="text-[11px] text-outline leading-tight mt-0.5">High-res vector rendering</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">table_chart</span>
            <div>
              <div className="font-semibold text-on-surface text-[12px]">Calibrated Tables</div>
              <div className="text-[11px] text-outline leading-tight mt-0.5">Auto-width cell protection</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">content_copy</span>
            <div>
              <div className="font-semibold text-on-surface text-[12px]">Direct GDocs Paste</div>
              <div className="text-[11px] text-outline leading-tight mt-0.5">Native DOM formatting</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">lock</span>
            <div>
              <div className="font-semibold text-on-surface text-[12px]">100% Client-Side</div>
              <div className="text-[11px] text-outline leading-tight mt-0.5">No servers, zero data tracking</div>
            </div>
          </div>
        </div>

        {/* Author & Copyright Footer */}
        <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs font-code-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="text-secondary font-medium tracking-wide">
              © Yours truly DC
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface font-sans font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
