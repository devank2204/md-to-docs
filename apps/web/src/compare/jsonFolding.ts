import type { Text } from "@codemirror/state";
import { codeFolding } from "@codemirror/language";
import type { ChangeLocation } from "./jsonLocations";
// Visibility windows come from existing engine locations; no comparison here.
// Hidden regions can include explicitly filtered changes, not only equal lines.
export function outsideJSONContextRanges(
  doc: Text,
  locations: ChangeLocation[],
  context = 3,
) {
  const windows = locations
    .map((location) => ({
      from: Math.max(1, doc.lineAt(location.from).number - context),
      to: Math.min(doc.lines, doc.lineAt(location.to).number + context),
    }))
    .sort((a, b) => a.from - b.from);
  // Keep JSON boundaries readable even if filters exclude every change.
  windows.unshift({ from: 1, to: Math.min(context, doc.lines) });
  windows.push({ from: Math.max(1, doc.lines - context + 1), to: doc.lines });
  const merged: { from: number; to: number }[] = [];
  for (const window of windows) {
    const previous = merged.at(-1);
    if (previous && window.from <= previous.to + 1)
      previous.to = Math.max(previous.to, window.to);
    else merged.push({ ...window });
  }
  return merged.slice(1).flatMap((window, index) => {
    const previous = merged[index];
    return window.from - previous.to > 2
      ? [{ from: doc.line(previous.to).to, to: doc.line(window.from - 1).to }]
      : [];
  });
}
export const jsonContextFolding = codeFolding({
  preparePlaceholder: (state, range) =>
    state.doc.lineAt(range.to).number - state.doc.lineAt(range.from).number,
  placeholderDOM: (_view, onclick, count: number) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cm-foldPlaceholder";
    button.textContent = `… ${count} hidden lines`;
    button.setAttribute("aria-label", `Show ${count} hidden lines`);
    button.onclick = onclick;
    return button;
  },
});
