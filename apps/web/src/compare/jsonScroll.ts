import type { EditorView } from "@codemirror/view";
import type { JSONScrollPair } from "./model";
import { sourceLocations } from "./jsonLocations";
type Anchor = { from: number; counterpart: number };
export function scrollAnchors(
  a: string,
  b: string,
  pairs: JSONScrollPair[],
): [Anchor[], Anchor[]] {
  const old = sourceLocations(a),
    next = sourceLocations(b);
  const anchors: [Anchor[], Anchor[]] = [[], []];
  for (const pair of pairs) {
    const first = old.get(JSON.stringify(pair.original)),
      second = next.get(JSON.stringify(pair.updated));
    if (!first || !second) continue;
    anchors[0].push({ from: first.from, counterpart: second.from });
    anchors[1].push({ from: second.from, counterpart: first.from });
  }
  // For minified sources several properties occupy the same visual line. Their
  // exact token offsets still let CodeMirror choose the visible wrapped block.
  anchors.forEach((items) => items.sort((x, y) => x.from - y.from));
  return anchors;
}
export function matchingScrollTop(
  source: EditorView,
  target: EditorView,
  anchors: Anchor[],
) {
  const top = source.scrollDOM.scrollTop;
  const sourceMax = Math.max(
    0,
    source.scrollDOM.scrollHeight - source.scrollDOM.clientHeight,
  );
  const targetMax = Math.max(
    0,
    target.scrollDOM.scrollHeight - target.scrollDOM.clientHeight,
  );
  if (!anchors.length) return sourceMax ? (top / sourceMax) * targetMax : 0;
  const position = source.lineBlockAtHeight(
    Math.max(0, top - source.documentPadding.top),
  ).from;
  let low = 0,
    high = anchors.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (anchors[middle].from < position) low = middle + 1;
    else high = middle;
  }
  // Prefer a field at the viewport's top, rather than an enclosing root object.
  const anchor = anchors[Math.min(low, anchors.length - 1)];
  const sourceRect = source.coordsAtPos(anchor.from),
    targetRect = target.coordsAtPos(anchor.counterpart);
  if (sourceRect && targetRect)
    return Math.max(
      0,
      Math.min(
        targetMax,
        target.scrollDOM.scrollTop + targetRect.top - sourceRect.top,
      ),
    );
  const sourceBlock = source.lineBlockAt(anchor.from),
    targetBlock = target.lineBlockAt(anchor.counterpart);
  const offset = top - sourceBlock.top - source.documentPadding.top;
  return Math.max(
    0,
    Math.min(targetMax, targetBlock.top + target.documentPadding.top + offset),
  );
}
