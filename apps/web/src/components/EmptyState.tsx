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
    <div className="w-full max-w-5xl mx-auto px-8 py-12 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="font-serif text-[42px] leading-tight text-[#1b1c1a] mb-4 tracking-tight">
          Markdown → Document
        </h1>
        <p className="font-serif text-[17px] text-[#53606c] max-w-[600px] mx-auto leading-relaxed">
          Turn Markdown into calibrated Word, Google Docs, or PDF files with tables, math matrices, and structural diagrams intact.
        </p>
      </div>

      {/* Editor Empty State */}
      <div className="w-full bg-[#ffffff] rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e3e2df] flex flex-col overflow-hidden relative">
        {/* Editor Header */}
        <div className="bg-[#faf9f6] px-4 py-2.5 border-b border-[#e3e2df] flex items-center justify-between font-code-sm text-[11px] text-[#75777a]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbdad7]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbdad7]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbdad7]"></span>
            </div>
            <span className="opacity-80">source.md — buffer</span>
          </div>
          <div className="opacity-80">0 characters | UTF-8</div>
        </div>

        {/* Editor Body */}
        <div className="relative min-h-[440px] flex flex-col p-8">
          <textarea
            className="absolute inset-0 w-full h-full p-8 font-code-md text-[13px] text-[#1b1c1a] bg-transparent resize-none focus:outline-none z-10 placeholder-transparent leading-relaxed prose prose-slate prose-invert max-w-none"
            onChange={(e) => onInput(e.target.value)}
            placeholder=""
            spellCheck="false"
          />

          {/* Placeholder Background */}
          <div className="absolute inset-0 p-8 pointer-events-none z-0">
            <div className="font-code-md text-[13px] text-[#dbdad7] select-none space-y-1">
              <div># Title of your specification or paper</div>
              <div className="opacity-70">## Abstract & System Geometry</div>
              <div className="opacity-50">Paste raw CommonMark or GitHub-flavored source directly into this pane...</div>
              <div className="opacity-40 pt-2">| Specimen | Precision | Render Target |</div>
              <div className="opacity-40">|----------|-----------|---------------|</div>
              <div className="opacity-40">| TeX Math | 32-bit fp | Vector curves |</div>
            </div>
          </div>

          {/* Upload UI Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center pt-24">
            <div className="w-10 h-10 bg-[#f4f3f0] border border-[#e3e2df] rounded flex items-center justify-center mb-4 text-[#1b1c1a]">
              <span className="material-symbols-outlined text-[20px]">upload</span>
            </div>
            <h2 className="font-serif text-[17px] font-semibold text-[#1b1c1a] mb-2 tracking-tight">
              Paste Markdown here
            </h2>
            <p className="font-code-sm text-[11px] text-[#75777a] mb-6">
              or drop any <span className="font-medium text-[#1b1c1a]">.md</span>, <span className="font-medium text-[#1b1c1a]">.markdown</span>, or <span className="font-medium text-[#1b1c1a]">.txt</span> file directly
            </p>

            <div className="flex items-center gap-3 pointer-events-auto shadow-sm">
              <input 
                type="file" 
                accept=".md,.markdown,.txt" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                className="px-4 py-2 bg-[#ffffff] border border-[#c5c6c9] text-[#1b1c1a] rounded font-code-sm text-[11px] hover:bg-[#faf9f6] transition-colors flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined text-[15px]">snippet_folder</span>
                Browse file...
              </button>
              <button 
                className="px-4 py-2 bg-[#000000] text-[#ffffff] rounded font-code-sm text-[11px] hover:bg-[#1b1c1a] transition-colors flex items-center gap-2"
                onClick={loadSample}
              >
                <span className="material-symbols-outlined text-[15px]">import_contacts</span>
                Load RFC specimen
              </button>
            </div>
          </div>

          {/* Editor Footer */}
          <div className="absolute bottom-5 left-8 right-8 flex items-center justify-between pointer-events-none z-20 font-code-sm text-[10px] text-[#c5c6c9] uppercase tracking-wider">
            <span>Line 1, Column 1</span>
            <span>Drag-and-drop active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
