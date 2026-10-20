import { useState } from 'react';

interface SuggestEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelection?: string;
  documentTitle?: string;
}

export function SuggestEditModal(props: SuggestEditModalProps) {
  if (!props.isOpen) return null;
  return <SuggestEditModalContent {...props} />;
}

function SuggestEditModalContent({
  onClose,
  initialSelection = '',
  documentTitle = 'Document',
}: SuggestEditModalProps) {
  const [selectedText, setSelectedText] = useState(initialSelection);
  const [suggestion, setSuggestion] = useState('');
  const [sectionHint, setSectionHint] = useState('');
  const [githubRepo, setGithubRepo] = useState('devank2204/md-to-docs');
  const [copied, setCopied] = useState(false);

  const buildIssueMarkdown = () => {
    let body = `### Document Review Suggestion\n\n`;
    body += `**Document:** ${documentTitle}\n`;
    if (sectionHint.trim()) {
      body += `**Section / Context:** ${sectionHint.trim()}\n`;
    }
    body += `\n`;

    if (selectedText.trim()) {
      body += `**Referenced Passage:**\n`;
      body += `> ${selectedText.trim().replace(/\n/g, '\n> ')}\n\n`;
    }

    body += `**Proposed Improvement / Feedback:**\n`;
    body += `${suggestion.trim() || '*(No specific suggestion text provided)*'}\n\n`;

    body += `---\n*Generated via [mdtodocs](https://mdtodocs.com) Stakeholder Review Mode*`;
    return body;
  };

  const handleOpenGitHub = () => {
    const title = `[Doc Review] ${sectionHint ? sectionHint + ': ' : ''}${selectedText ? `"${selectedText.slice(0, 40)}..."` : 'Feedback'}`;
    const body = buildIssueMarkdown();
    const cleanRepo = githubRepo.trim() || 'devank2204/md-to-docs';
    const url = `https://github.com/${cleanRepo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMarkdown = async () => {
    const text = buildIssueMarkdown();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy suggestion to clipboard', err);
    }
  };

  return (
    <div
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-high border border-outline-variant/60 rounded-xl shadow-2xl max-w-xl w-full p-6 text-on-surface overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">rate_review</span>
            <h2 className="font-semibold text-lg tracking-tight">Suggest an Edit</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1 rounded-md transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant">
          Stakeholder review feedback. You can propose text changes, add comments, and export as a GitHub issue or copy structured Markdown for chat/email.
        </p>

        {/* Form fields */}
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Quoted Passage */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Quoted Passage / Selection
            </label>
            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Highlight text on the page or paste passage here..."
              rows={3}
              className="w-full text-xs font-mono bg-surface-container-low border border-outline-variant/60 rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
            />
          </div>

          {/* Proposed Feedback */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Proposed Edit / Feedback <span className="text-primary">*</span>
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Explain the proposed change, clarification, or correction..."
              rows={4}
              className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Section / Context */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Section / Heading (Optional)
              </label>
              <input
                type="text"
                value={sectionHint}
                onChange={(e) => setSectionHint(e.target.value)}
                placeholder="e.g. Architecture Overview"
                className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Target GitHub Repo */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                GitHub Repository
              </label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="owner/repository"
                className="w-full text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied Suggestion!' : 'Copy Suggestion'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGitHub}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Open GitHub Issue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
