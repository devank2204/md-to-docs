import { EditorView } from "@codemirror/view";
// Keep native search/selection scrolling inside this workspace. CodeMirror still
// renders/measures the target and supplies its coordinates and scroll strategy.
export const containedEditorScroll = EditorView.scrollHandler.of(
  (view, range, options) => {
    const cursor = view.coordsAtPos(range.head);
    if (!cursor) return false;
    const scroller =
      view.dom.closest<HTMLElement>(".cm-mergeView") ?? view.scrollDOM;
    const box = scroller.getBoundingClientRect();
    let top = Math.max(0, box.top),
      bottom = Math.min(innerHeight, box.bottom);
    if (bottom <= top) {
      top = box.top;
      bottom = box.bottom;
    }
    const margin = Math.min(options.yMargin, (bottom - top) / 3);
    if (options.y === "center")
      scroller.scrollTop += (cursor.top + cursor.bottom - top - bottom) / 2;
    else if (options.y === "start" || cursor.top < top + margin)
      scroller.scrollTop += cursor.top - top - margin;
    else if (options.y === "end" || cursor.bottom > bottom - margin)
      scroller.scrollTop += cursor.bottom - bottom + margin;
    return true;
  },
);
