// Transient editor position handoff; the persistent store owns all document text.
type Selection = { start: number; end: number; line: number; focused: boolean };
let pending: Selection | undefined;
export function rememberEditor(input: HTMLTextAreaElement) {
 const style = getComputedStyle(input);
 pending = {
  start: input.selectionStart, end: input.selectionEnd,
  line: input.scrollTop ? (input.scrollTop - parseFloat(style.paddingTop)) / parseFloat(style.lineHeight) : 0,
  focused: document.activeElement === input,
 };
}
export function takeEditorSelection() { const selection = pending; pending = undefined; return selection; }
export function restoreEditor(input: HTMLTextAreaElement, selection: Selection) {
 if (selection.focused && document.activeElement === document.body) input.focus({ preventScroll: true });
 input.setSelectionRange(selection.start, selection.end);
 const style = getComputedStyle(input);
 input.scrollTop = selection.line ? selection.line * parseFloat(style.lineHeight) + parseFloat(style.paddingTop) : 0;
 requestAnimationFrame(() => input.dispatchEvent(new Event('scroll')));
}
