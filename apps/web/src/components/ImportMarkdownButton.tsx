import { useRef, useState } from 'react';
import { useStore } from '@/store';

export function ImportMarkdownButton() {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  return <div>
    <button type="button" className="px-2 py-1 rounded hover:bg-surface-container" onClick={() => input.current?.click()}>Import Markdown</button>
    <input ref={input} type="file" hidden accept=".md,.markdown,.txt,text/plain,text/markdown" aria-label="Import Markdown file" onChange={async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (!/\.(md|markdown|txt)$/i.test(file.name) || file.size > 1_000_000) { setMessage('Choose a Markdown or text file smaller than 1 MB.'); return; }
      const sourceId = useStore.getState().activeDocumentId;
      try {
        const text = await file.text();
        if (!text.trim() || text.includes('\0')) { setMessage('Choose a nonempty Markdown or text file.'); return; }
        const store = useStore.getState();
        if (store.activeDocumentId !== sourceId) { setMessage('Document changed while opening the file. Choose it again.'); return; }
        // Import into a new document so async file reads never overwrite edits.
        if (store.markdown.trim()) store.createDocument(text);
        else store.setMarkdown(text);
        setMessage('');
      } catch { setMessage('Could not open this file. Your text is unchanged. Try again.'); }
    }} />
    {message && <p role="alert">{message}</p>}
  </div>;
}
