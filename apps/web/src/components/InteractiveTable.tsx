import React, { useRef, useState } from 'react';
import { copyTableToClipboard, type TableCopyFormat } from '@mdtodocs/renderers';

interface InteractiveTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const InteractiveTable: React.FC<InteractiveTableProps> = ({ children, ...props }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copiedFormat, setCopiedFormat] = useState<TableCopyFormat | null>(null);

  const handleCopy = async (format: TableCopyFormat) => {
    if (!tableRef.current) return;
    try {
      await copyTableToClipboard(tableRef.current, format);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy table to clipboard:', err);
    }
  };

  return (
    <div className="group relative my-4 rounded border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs not-prose">
      {/* Floating Action Pill */}
      <div
        data-print-hide
        className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/20 font-code-sm text-[11px] text-secondary select-none"
      >
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-primary">table_chart</span>
          <span className="font-semibold uppercase tracking-wider text-on-surface">Table</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopy('excel')}
            title="Copy as formatted spreadsheet cells for Excel or Google Sheets"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedFormat === 'excel' ? 'check' : 'content_copy'}
            </span>
            <span className="font-medium">
              {copiedFormat === 'excel' ? 'Copied Excel!' : 'Copy for Excel/Sheets'}
            </span>
          </button>

          <span className="text-outline-variant mx-0.5">·</span>

          <button
            onClick={() => handleCopy('csv')}
            title="Copy as standard comma-separated values (CSV)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedFormat === 'csv' ? 'check' : 'description'}
            </span>
            <span>{copiedFormat === 'csv' ? 'Copied CSV!' : 'CSV'}</span>
          </button>

          <button
            onClick={() => handleCopy('tsv')}
            title="Copy as tab-separated values (TSV)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span>{copiedFormat === 'tsv' ? 'Copied TSV!' : 'TSV'}</span>
          </button>

          <button
            onClick={() => handleCopy('markdown')}
            title="Copy as clean Markdown table"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedFormat === 'markdown' ? 'check' : 'code'}
            </span>
            <span>{copiedFormat === 'markdown' ? 'Copied MD!' : 'Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Table Content Area */}
      <div className="w-full overflow-x-auto p-1 bg-surface-container-lowest">
        <table
          ref={tableRef}
          className="w-full border-collapse text-left text-[13px] font-sans"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};
