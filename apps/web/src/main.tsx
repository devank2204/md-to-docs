import { getRouteSpec } from './routes/landingData';
import { rememberEditor } from './utils/editorHandoff';
import { useStore } from './store';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App.tsx'

// Transfer pre-mount native input once into the existing persistent store.
const startup = (window as any).__mdStartup;
const route = getRouteSpec(window.location.pathname);
// Route defaults precede buffered input; a restored document still wins.
if (route && route.path !== '/' && !useStore.getState().markdown.trim()) {
  useStore.getState().setDestination(route.destination);
  useStore.getState().setHtmlOutput(route.path === '/markdown-to-html');
}
if (startup?.edited) useStore.getState().setMarkdown(startup.value || '');
if (startup) startup.documentId = useStore.getState().activeDocumentId;
const focused = startup?.focused;
const nativeEditor = document.querySelector<HTMLTextAreaElement>('textarea');
if (focused && nativeEditor) rememberEditor(nativeEditor);
window.addEventListener('mdtodocs:startup-input', ((event: CustomEvent<{ text: string; documentId: string }>) => {
  // Never replace edits made while an asynchronous clipboard/file read was pending.
  const state = useStore.getState();
  if (event.detail.documentId === state.activeDocumentId && !state.markdown.trim()) state.setMarkdown(event.detail.text);
}) as EventListener);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
