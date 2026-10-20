import React, { useState, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import { formatJsonCode, beautifyCode } from '@mdtodocs/renderers';

interface InteractiveCodeBlockProps {
  className?: string;
  rawCode: string;
  children?: React.ReactNode;
}

export const InteractiveCodeBlock: React.FC<InteractiveCodeBlockProps> = ({
  className = '',
  rawCode,
  children,
}) => {
  const match = /language-(\w+)/.exec(className);
  const detectedLang = match ? match[1].toLowerCase() : 'text';

  const isJson = detectedLang === 'json';

  // State
  const [isFormatted, setIsFormatted] = useState<boolean>(isJson);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [copiedType, setCopiedType] = useState<'all' | 'clean-json' | null>(null);

  // JSON Analysis
  const jsonAnalysis = useMemo(() => {
    if (!isJson) return null;
    return formatJsonCode(rawCode, 2);
  }, [isJson, rawCode]);

  // Active Code String
  const activeCode = useMemo(() => {
    if (isJson) {
      if (isFormatted && jsonAnalysis?.isValid) {
        return jsonAnalysis.formatted;
      }
      return rawCode;
    }
    if (isFormatted) {
      return beautifyCode(rawCode, 2);
    }
    return rawCode;
  }, [isJson, isFormatted, jsonAnalysis, rawCode]);

  // Syntax Highlighting
  const highlightedHtml = useMemo(() => {
    const prismLang = Prism.languages[detectedLang] || Prism.languages.text || Prism.languages.clike;
    if (prismLang) {
      try {
        return Prism.highlight(activeCode, prismLang, detectedLang);
      } catch {
        return null;
      }
    }
    return null;
  }, [activeCode, detectedLang]);

  const lines = useMemo(() => {
    return activeCode.split(/\r?\n/);
  }, [activeCode]);

  const handleCopy = async (cleanJson = false) => {
    const textToCopy = (cleanJson && jsonAnalysis?.cleanJson)
      ? jsonAnalysis.cleanJson
      : activeCode;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(cleanJson ? 'clean-json' : 'all');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy code to clipboard:', e);
    }
  };

  const lineCount = lines.length;

  return (
    <div className="my-4 rounded border border-outline-variant/30 bg-surface-container-low/80 overflow-hidden shadow-xs not-prose">
      {/* Code Action Header */}
      <div
        data-print-hide
        className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/20 font-code-sm text-[11px] text-secondary select-none"
      >
        <div className="flex items-center gap-2">
          {/* Language Pill */}
          <span className="font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-primary">data_object</span>
            <span>{detectedLang}</span>
          </span>

          <span className="text-outline-variant">·</span>

          {/* Line count */}
          <span className="tabular-nums text-secondary text-[11px]">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>

          {/* JSON status badges */}
          {isJson && jsonAnalysis && (
            <>
              <span className="text-outline-variant">·</span>
              {jsonAnalysis.isValid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 text-[10px]">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  <span>valid json</span>
                </span>
              ) : (
                <span className="text-error font-medium flex items-center gap-0.5 text-[10px]">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  <span>syntax error</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Format / Beautify Toggle */}
          <button
            onClick={() => setIsFormatted(!isFormatted)}
            title={isFormatted ? 'Show original unformatted text' : 'Format and auto-indent code'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all active:scale-95 ${
              isFormatted
                ? 'bg-surface-container text-primary font-medium'
                : 'hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
            <span>{isFormatted ? 'Formatted' : 'Format'}</span>
          </button>

          {/* Line Numbers Toggle */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title="Toggle line numbers"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all active:scale-95 ${
              showLineNumbers
                ? 'bg-surface-container text-on-surface font-medium'
                : 'hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">format_list_numbered</span>
            <span>Lines</span>
          </button>

          <span className="text-outline-variant mx-0.5">·</span>

          {/* Strip Comments & Copy (for JSON with comments) */}
          {isJson && jsonAnalysis?.hasComments && (
            <button
              onClick={() => handleCopy(true)}
              title="Copy clean JSON with comments stripped (safe for API requests)"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95 font-medium"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedType === 'clean-json' ? 'check' : 'content_copy'}
              </span>
              <span>{copiedType === 'clean-json' ? 'Copied Clean!' : 'Copy Clean JSON'}</span>
            </button>
          )}

          {/* Copy Code */}
          <button
            onClick={() => handleCopy(false)}
            title="Copy code to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 font-medium"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedType === 'all' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedType === 'all' ? 'Copied Code!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="w-full overflow-x-auto p-4 bg-surface-container-low/40 font-code-sm text-code-sm leading-relaxed">
        {highlightedHtml ? (
          <div className="flex">
            {showLineNumbers && (
              <div
                data-print-hide
                className="select-none pr-3 text-right text-[11px] opacity-40 font-mono tabular-nums border-r border-outline-variant/20 mr-3 shrink-0"
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <pre className="m-0 p-0 bg-transparent border-0 overflow-x-auto flex-1 font-mono text-[12px]">
              <code
                className={`language-${detectedLang}`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </pre>
          </div>
        ) : (
          <div className="flex">
            {showLineNumbers && (
              <div
                data-print-hide
                className="select-none pr-3 text-right text-[11px] opacity-40 font-mono tabular-nums border-r border-outline-variant/20 mr-3 shrink-0"
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <pre className="m-0 p-0 bg-transparent border-0 overflow-x-auto flex-1 font-mono text-[12px]">
              <code>{children || activeCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
