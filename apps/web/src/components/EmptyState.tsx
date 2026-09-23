import { useRef } from 'react';

interface EmptyStateProps {
  onInput: (markdown: string) => void;
}

export function EmptyState({ onInput }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onInput(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadSample = () => {
    onInput(`# RFC 9110: HTTP Semantics & Type Representation\n\n> Status: Draft Standard\n> Author: IETF Network Working Group\n> Date: October 2024\n\n## 1. Architectural Scope\n\nThe Hypertext Transfer Protocol (HTTP) is a stateless application-level protocol for distributed, collaborative, hypertext information systems.\n\n### 1.1 Structural Properties\n\n| Identifier | Class | Determinism | Latency Budget |\n| :--- | :--- | :--- | :--- |\n| \`GET\` | Idempotent | Pure Query | < 12ms |\n| \`PUT\` | Idempotent | State Sync | < 45ms |\n| \`POST\` | Dynamic | State Creation | < 120ms |`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-space-xl py-space-xxl flex flex-col items-center mt-16">
      <div className="w-full max-w-3xl text-center mb-space-xl">
        <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-space-sm">
          Markdown → Document
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Turn Markdown into calibrated Word, Google Docs, or PDF files with tables, math matrices, and structural diagrams intact.
        </p>
      </div>

      <div className="w-full max-w-4xl bg-surface-container-lowest rounded-lg shadow-sm hover:shadow transition-all relative overflow-hidden group">
        <div className="relative min-h-[360px] p-space-xl flex flex-col justify-between">
          <textarea
            className="absolute inset-0 w-full h-full p-space-xl font-code-md text-code-md text-on-surface bg-transparent resize-none focus:outline-none z-20 placeholder-transparent leading-relaxed"
            onChange={(e) => onInput(e.target.value)}
            placeholder=""
            spellCheck="false"
          />
          
          <div className="relative z-10 pointer-events-none flex flex-col justify-between h-full">
            <div className="space-y-space-md">
              <div className="font-code-md text-code-md text-secondary/30 select-none space-y-1">
                <div># Title of your specification or paper</div>
                <div className="text-secondary/20">## Abstract & System Geometry</div>
                <div className="text-secondary/20">Paste raw CommonMark or GitHub-flavored source directly into this pane...</div>
                <div className="text-secondary/15">| Specimen | Precision | Render Target |</div>
                <div className="text-secondary/15">|----------|-----------|---------------|</div>
                <div className="text-secondary/10">| TeX Math | 32-bit fp | Vector curves |</div>
              </div>
            </div>
            
            <div className="my-space-xl py-space-lg text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center mb-space-sm text-primary">
                <span className="material-symbols-outlined text-[20px]">file_upload</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-primary font-medium mb-space-xs">
                Paste Markdown here
              </p>
              <p className="font-code-sm text-code-sm text-secondary mb-space-md">
                or drop any <span className="text-on-surface font-medium">.md</span> file directly
              </p>
              
              <div className="flex items-center gap-space-sm pointer-events-auto z-30">
                <input 
                  type="file" 
                  accept=".md,.markdown,.txt" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  className="px-space-md py-space-xs bg-surface hover:bg-surface-container text-on-surface rounded font-code-sm text-code-sm shadow-sm transition-all flex items-center gap-space-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-[14px]">folder_open</span>
                  <span>Browse file...</span>
                </button>
                <button 
                  className="px-space-md py-space-xs bg-primary text-on-primary hover:bg-surface-variant hover:text-on-surface-variant rounded font-code-sm text-code-sm transition-all flex items-center gap-space-xs"
                  onClick={loadSample}
                >
                  <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                  <span>Load RFC specimen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
