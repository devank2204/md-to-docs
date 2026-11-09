// Runs before first paint. This is only a handoff buffer; Zustand remains the document store.
(() => {
  const root = document.getElementById('root');
  const mobile = document.getElementById('mobile-landing');
  if (mobile && matchMedia('(max-width: 1023px)').matches) root.innerHTML = JSON.parse(mobile.textContent);
  mobile?.remove();
  const buffer = window.__mdStartup = { active: true, edited: false };
  try {
    const saved = JSON.parse(localStorage.getItem('md-to-docs-storage') || 'null')?.state;
    const appearance = saved?.appAppearance;
    document.documentElement.dataset.appearance = appearance === 'dark' || (appearance === 'system' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'cream';
    if (saved?.markdown?.trim() && saved.currentView !== 'landing') {
      buffer.restored = true;
      const input = root.querySelector('textarea');
      if (input) input.value = saved.markdown;
      // Show the actual saved source while the document studio module opens.
      if (location.pathname === '/') root.querySelectorAll('.mobile-intro').forEach(e => e.hidden = true);
    }
  } catch { /* Storage may be disabled; the editor still works. */ }
  const input = e => {
    if (!buffer.active || !(e.target instanceof HTMLTextAreaElement)) return;
    buffer.edited = true;
    buffer.value = e.target.value;
    buffer.start = e.target.selectionStart;
    buffer.end = e.target.selectionEnd;
    buffer.focused = document.activeElement === e.target;
    if (e.target.getAttribute('aria-label') === 'Markdown terminal input') {
      const hint = e.target.nextElementSibling;
      if (hint) hint.style.display = buffer.value ? 'none' : '';
    }
  };
  const focus = e => { if (buffer.active && e.target instanceof HTMLTextAreaElement) { buffer.focused = true; buffer.start = e.target.selectionStart; buffer.end = e.target.selectionEnd; } };
  document.addEventListener('input', input, true);
  document.addEventListener('focusin', focus, true);
  performance.mark('mdtodocs:input-ready');
  buffer.dispose = () => { buffer.active = false; document.removeEventListener('input', input, true); document.removeEventListener('focusin', focus, true); };
  const message = text => {
    const panel = root.querySelector('.mobile-edit-panel') || root;
    let status = root.querySelector('[data-startup-message]');
    if (!status) { status = document.createElement('p'); status.dataset.startupMessage = ''; status.setAttribute('role', 'status'); status.className = 'mobile-input-message'; panel.append(status); }
    status.textContent = text;
  };
  document.addEventListener('paste', e => {
    if (!buffer.active || !root.querySelector('.mobile-workspace') || !(e.target instanceof HTMLTextAreaElement)) return;
    const editor = e.target;
    if (new Blob([editor.value.slice(0, editor.selectionStart), e.clipboardData.getData('text'), editor.value.slice(editor.selectionEnd)]).size > 1000000) { e.preventDefault(); message('Paste a smaller document (under 1 MB). Your text is unchanged.'); }
  }, true);
  document.addEventListener('click', async e => {
    if (!buffer.active) return;
    const button = e.target.closest('[data-startup-action]');
    if (!button) return;
    e.preventDefault();
    const editor = root.querySelector('textarea');
    if (button.dataset.startupAction === 'file') root.querySelector('input[type="file"]')?.click();
    if (button.dataset.startupAction === 'paste') {
      if (editor?.value.trim()) { message('Your text is safe. Paste again after the editor opens.'); return; }
      try {
        const before = editor?.value;
        const text = await navigator.clipboard.readText();
        if (buffer.active && editor?.value !== before) return;
        if (root.querySelector('.mobile-workspace') && new Blob([text]).size > 1000000) { message('Use a document smaller than 1 MB. Your text is unchanged.'); return; }
        if (!buffer.active) { window.dispatchEvent(new CustomEvent('mdtodocs:startup-input', {detail:{text, documentId:buffer.documentId}})); return; }
        editor.value = text; editor.dispatchEvent(new Event('input', {bubbles:true}));
      } catch { editor?.focus(); }
    }
  }, true);
  const readFile = async file => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) { message('Choose a .md, .markdown, or .txt file.'); return; }
    if (root.querySelector('.mobile-workspace') && file.size > 1000000) { message('Choose a file smaller than 1 MB. Your current text is unchanged.'); return; }
    const editor = root.querySelector('textarea');
    const original = editor?.value;
    if (original?.trim()) { message('Your text is safe. Import again after the editor opens.'); return; }
    try {
      const text = await file.text();
      if (text.includes('\0')) return;
      if (buffer.active && editor?.value !== original) return;
      if (!buffer.active) { window.dispatchEvent(new CustomEvent('mdtodocs:startup-input', {detail:{text, documentId:buffer.documentId}})); return; }
      editor.value = text; editor.dispatchEvent(new Event('input', {bubbles:true}));
    } catch { message('Could not open this file. Your text is unchanged.'); }
  };
  document.addEventListener('change', e => { if (buffer.active && e.target.type === 'file') void readFile(e.target.files?.[0]); }, true);
  document.addEventListener('dragover', e => { if (buffer.active && e.dataTransfer?.types.includes('Files')) e.preventDefault(); }, true);
  document.addEventListener('drop', e => { if (buffer.active && e.dataTransfer?.files.length) { e.preventDefault(); void readFile(e.dataTransfer.files[0]); } }, true);
  document.documentElement.classList.remove('landing-booting');
  if (!buffer.restored && !matchMedia('(max-width: 1023px)').matches) root.querySelector('textarea')?.focus();
})();
