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
  fidelityScore,
  statsText,
  destination,
  onToggleFidelityPanel,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between px-space-md font-code-sm text-code-sm text-secondary z-40">
      <div className="flex items-center gap-space-sm">
        <button 
          onClick={onToggleFidelityPanel}
          className="flex items-center gap-space-xxs hover:text-on-surface transition-colors focus:outline-none"
        >
          {isCompiling ? (
            <span className="flex items-center gap-space-xxs text-secondary">
              <span className="material-symbols-outlined text-[13px] animate-spin">refresh</span>
              Compiling...
            </span>
          ) : warningsCount === 0 ? (
            <span className="flex items-center gap-space-xxs text-primary">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Everything preserved {fidelityScore !== undefined && `(${fidelityScore}%)`}
            </span>
          ) : (
            <span className="flex items-center gap-space-xxs text-error">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              {warningsCount} {warningsCount === 1 ? 'issue' : 'issues'} {fidelityScore !== undefined && `(${fidelityScore}%)`}
            </span>
          )}
        </button>
        {statsText && !isCompiling && (
          <>
            <span className="text-outline-variant">·</span>
            <span>{statsText}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-space-sm">
        <span>Target: {DEST_LABELS[destination]}</span>
      </div>
    </div>
  );
};
