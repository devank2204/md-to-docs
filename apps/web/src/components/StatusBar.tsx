import React from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';

interface StatusBarProps {
  isCompiling: boolean;
  warningsCount: number;
  fidelityScore?: number;
  statsText: string;
  destination: DestinationType;
  onToggleFidelityPanel: () => void;
}

const DEST_LABELS: Record<DestinationType, string> = {
  'google-docs': 'Google Docs',
  'word': 'Word (.docx)',
  'pdf': 'PDF',
  'clipboard': 'Clipboard',
};

export const StatusBar: React.FC<StatusBarProps> = ({
  isCompiling,
  warningsCount,
  destination,
  onToggleFidelityPanel,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between px-space-md font-code-sm text-code-sm text-secondary z-40">
      <div className="flex items-center gap-space-sm">
        <button 
          onClick={onToggleFidelityPanel}
          className="flex items-center gap-space-xxs hover:text-on-surface transition-colors focus-visible:outline focus-visible:outline-2"
        >
          {isCompiling ? (
            <span className="flex items-center gap-space-xxs text-secondary">
              <span className="material-symbols-outlined text-[13px] animate-spin">refresh</span>
              Compiling...
            </span>
          ) : warningsCount === 0 ? (
            <span className="flex items-center gap-space-xxs text-primary">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              No structural issues found
            </span>
          ) : (
            <span className="flex items-center gap-space-xxs text-error">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              {warningsCount} {warningsCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </button>

      </div>
      <div className="flex items-center gap-space-sm text-outline">
        <span>Target: {DEST_LABELS[destination]}</span>
        <span className="text-outline-variant/60">·</span>
        {/* <span className="text-[10px] tracking-wide font-mono text-outline/80">© Yours truly DC</span> */}
      </div>
    </div>
  );
};
