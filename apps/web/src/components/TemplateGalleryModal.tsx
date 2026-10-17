import { useState } from 'react';
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from '@/data/templates';
import { useStore } from '@/store';


interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (markdown: string) => void;
  currentMarkdownLength?: number;
}

export function TemplateGalleryModal(props: TemplateGalleryModalProps) {
  if (!props.isOpen) return null;
  return <TemplateGalleryModalContent {...props} />;
}

function TemplateGalleryModalContent({
  onClose,
  onSelectTemplate,
  currentMarkdownLength = 0,
}: TemplateGalleryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTemplate, setPendingTemplate] = useState<DocumentTemplate | null>(null);

  const categories = ['All', 'Architecture', 'Decisions', 'Product', 'Reliability', 'Process'];

  const filteredTemplates = DOCUMENT_TEMPLATES.filter((tmpl) => {
    const matchesCat = selectedCategory === 'All' || tmpl.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      tmpl.title.toLowerCase().includes(q) ||
      tmpl.summary.toLowerCase().includes(q) ||
      tmpl.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const handleApplyTemplate = (template: DocumentTemplate) => {
    // If user already has written document content, confirm replacement
    if (currentMarkdownLength > 30) {
      setPendingTemplate(template);
    } else {
      if (currentMarkdownLength > 0) {
        useStore.getState().createSnapshot(`Pre-Template Backup (${template.title})`);
      }
      onSelectTemplate(template.content);
      onClose();
    }
  };

  const confirmApply = () => {
    if (pendingTemplate) {
      useStore.getState().createSnapshot(`Pre-Template Backup (${pendingTemplate.title})`);
      onSelectTemplate(pendingTemplate.content);
      setPendingTemplate(null);
      onClose();
    }
  };


  return (
    <div
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-high border border-outline-variant/60 rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-on-surface overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">collections_bookmark</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg tracking-tight">Executive Template Gallery</h2>
              <p className="text-xs text-on-surface-variant">
                Pre-formatted, production-grade document structures for engineering, architecture, and product leadership.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1 rounded-md transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container border border-outline-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-2.5">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg pl-8 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-surface-container-low border border-outline-variant/50 hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {template.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                      {template.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline border border-outline-variant/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {template.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {template.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                <span className="text-[11px] text-outline font-code-sm">
                  ~{template.content.split('\n').length} lines
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary text-xs font-medium transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>Use Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Dialog Overlay when replacing existing document */}
        {pendingTemplate && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-100">
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-amber-500 font-semibold text-sm">
                <span className="material-symbols-outlined text-[22px]">warning</span>
                <span>Replace Current Document?</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Loading <strong className="text-on-surface">{pendingTemplate.title}</strong> will replace your currently active document. Are you sure you want to proceed?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setPendingTemplate(null)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmApply}
                  className="px-3.5 py-1.5 text-xs rounded-lg bg-primary text-on-primary font-medium hover:bg-primary/90"
                >
                  Replace &amp; Load
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
