import { useRef } from 'react';
import { DOCUMENT_TEMPLATES } from '@/data/templates';

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
    onInput(`# RFC 9110: HTTP Architecture & Semantics

> Working Group: HTTP
> Target: Standards Track
> Date: October 2024

## 1. Overview

The Hypertext Transfer Protocol (HTTP) is a stateless application-level protocol for distributed, collaborative, hypertext information systems.

### 1.1 Method Properties

| Method | Safe | Idempotent | Latency Budget |
| :--- | :--- | :--- | :--- |
| \`GET\` | Yes | Yes | < 15ms |
| \`PUT\` | No | Yes | < 40ms |
| \`POST\` | No | No | < 100ms |
| \`DELETE\` | No | Yes | < 30ms |

## 2. Request Routing Architecture

\`\`\`mermaid
flowchart TD
    Client -->|TLS 1.3| EdgeGateway
    EdgeGateway -->|Route| AuthWorker
    AuthWorker -->|Validate| OriginService
\`\`\`

## 3. Performance Model

$$
\\text{Throughput} = \\frac{N \\times \\text{Payload Size}}{\\Delta t}
$$
`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-8 py-12 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="font-serif text-[42px] leading-tight text-[#1b1c1a] mb-4 tracking-tight">
          Markdown → Document
        </h1>
        <p className="font-serif text-[17px] text-[#53606c] max-w-[600px] mx-auto leading-relaxed">
          Convert Markdown into formatted Word, Google Docs, or PDF files with tables, math equations, and vector diagrams intact.
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
            <span className="opacity-80">source.md</span>
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
              <div># Document Title</div>
              <div className="opacity-70">## Overview &amp; Architecture</div>
              <div className="opacity-50">Paste CommonMark or GitHub-flavored Markdown here...</div>
              <div className="opacity-40 pt-2">| Method | Description | Target |</div>
              <div className="opacity-40">|--------|-------------|--------|</div>
              <div className="opacity-40">| GET    | Read query  | Docs   |</div>
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
                Load sample document
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

      {/* Executive Templates Showcase */}
      <div className="w-full mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">collections_bookmark</span>
            <h3 className="font-serif font-semibold text-[17px] text-on-surface tracking-tight">
              Start with an Executive Template
            </h3>
          </div>
          <span className="font-code-sm text-[11px] text-outline hidden sm:inline">
            Math equations · Mermaid diagrams · High-fidelity tables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DOCUMENT_TEMPLATES.slice(0, 3).map((template) => (
            <div
              key={template.id}
              onClick={() => onInput(template.content)}
              className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-primary/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {template.icon}
                  </span>
                  <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                    {template.category}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {template.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                  {template.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/20 text-[10px] text-outline">
                <span>{template.tags.join(' · ')}</span>
                <span className="text-primary font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Load <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
