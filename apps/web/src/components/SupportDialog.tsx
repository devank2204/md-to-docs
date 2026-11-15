import { useEffect, useState } from 'react';
import { WorkspaceSheet } from './WorkspaceSheet';
export function SupportDialog() {
  const [view, setView] = useState<'privacy' | 'feedback' | null>(null);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const open = (event: Event) => {
      const value = (event as CustomEvent).detail;
      if (value === 'privacy' || value === 'feedback') {setView(value);setCopied(false);}
    };
    window.addEventListener('mdtodocs:support', open);
    return () => window.removeEventListener('mdtodocs:support', open);
  }, []);
  if (!view) return null;
  return <WorkspaceSheet title={view === 'privacy' ? 'Privacy' : 'Feedback'} onClose={() => setView(null)}>
    {view === 'privacy' ? <div className="support-copy">
      <p>Your document workspace is stored in this browser. No account is required.</p>
      <p>Document conversion runs in your browser. Remote images and web fonts can request resources from their hosts. Your browser controls clipboard access and downloaded files.</p>
      <p>Clearing site data removes local documents and versions. Keep downloaded copies of important work. This browser storage is not a cloud backup.</p>
      <p>Google Docs handoff copies formatted content; it does not create a cloud document. PDF saving uses your browser’s print dialog.</p>
    </div> : <form className="support-form" onSubmit={async event => {
      event.preventDefault();
      try {await navigator.clipboard.writeText(`${email.trim() ? `Email: ${email.trim()}\n\n` : ''}${feedback.trim()}`);setCopied(true);} catch {setCopied(false);}
    }}>
      <p>Tell us what happened or what would make MDToDocs better. Please leave private document content out.</p>
      <label>Email (optional)<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Your feedback<textarea required rows={5} value={feedback} onChange={e => {setFeedback(e.target.value);setCopied(false);}} /></label>
      <p>Online submission is not connected yet. This draft stays here while the app is open; nothing is sent.</p>
      <button type="submit" className="ux-button" disabled={!feedback.trim()}>Copy feedback</button>
      <span role="status">{copied ? 'Copied. Your feedback has not been submitted.' : ''}</span>
    </form>}
  </WorkspaceSheet>;
}
