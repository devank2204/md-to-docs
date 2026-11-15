import { useStore } from '@/store';
import { WorkspaceSheet } from './WorkspaceSheet';
import { BrandWordmark } from './BrandWordmark';
export function AboutModal() {
  const isOpen = useStore(s => s.isAboutModalOpen);
  if (!isOpen) return null;
  return <WorkspaceSheet title="About MDToDocs.com" onClose={() => useStore.getState().setIsAboutModalOpen(false)}>
    <div className="support-copy">
      <BrandWordmark />
      <p>Turn Markdown into documents you can continue working with in Word, Google Docs and other applications. Paste or import a file, inspect the preview, then choose Export.</p>
      <p>Technical Markdown can include tables, equations and Mermaid diagrams. Review formatting notes before handoff; support and layout vary by destination.</p>
      <p>No login is required. Documents and versions stay in this browser. Export important work to keep a separate backup.</p>
      <p>Word export downloads a DOCX. Google Docs uses formatted copy or a Word-file handoff. PDF uses browser print/save.</p>
    </div>
  </WorkspaceSheet>;
}
