import { search, searchKeymap, openSearchPanel } from "@codemirror/search";
import { keymap, type EditorView } from "@codemirror/view";
export type SearchHandle = { current: ((side: 0 | 1) => void) | null };
export const compareSearch = [
  search({ top: true, literal: true }),
  keymap.of(searchKeymap),
];
export function findInEditor(view: EditorView) {
  view.focus();
  openSearchPanel(view);
}
