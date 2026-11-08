import { useEffect } from 'react';
import type { RefObject } from 'react';

type Point = { source: number; preview: number };
type Side = keyof Point;

function interpolate(points: Point[], value: number, from: Side, to: Side) {
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1], right = points[index];
    if (value <= right[from]) {
      const progress = (value - left[from]) / Math.max(1, right[from] - left[from]);
      return left[to] + Math.max(0, Math.min(1, progress)) * (right[to] - left[to]);
    }
  }
  return points.at(-1)?.[to] || 0;
}

// Measure the textarea's actual soft wrapping without changing its text or styles.
function sourcePositions(editor: HTMLTextAreaElement, offsets: number[], markdown: string) {
  const style = getComputedStyle(editor);
  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  mirror.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;height:auto;min-height:0;max-height:none;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:break-word;border:0;';
  for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textIndent', 'tabSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const)
    mirror.style[key] = style[key];
  mirror.style.width = `${editor.clientWidth}px`;
  let previous = 0;
  const markers = offsets.map(offset => {
    mirror.append(document.createTextNode(markdown.slice(previous, offset)));
    const marker = document.createElement('span');
    mirror.append(marker);
    previous = offset;
    return marker;
  });
  mirror.append(document.createTextNode(markdown.slice(previous) + '\n'));
  document.body.append(mirror);
  try {
    const baseline = markers[0]?.getBoundingClientRect().top || 0;
    return markers.map(marker => marker.getBoundingClientRect().top - baseline + parseFloat(style.paddingTop));
  } finally { mirror.remove(); }
}

export function useSyncedScroll(
  root: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  markdown: string,
  documentId: string,
) {
  useEffect(() => {
    if (!enabled || !root.current) return;
    const editor = root.current.querySelector<HTMLTextAreaElement>('[data-source-editor]');
    const preview = root.current.querySelector<HTMLElement>('[data-preview-scroll]');
    const paper = root.current.querySelector<HTMLElement>('[data-document-paper]');
    if (!editor || !preview || !paper) return;
    // Browser scroll anchoring must not compete with our source-position mapping.
    const anchoring = preview.style.overflowAnchor;
    preview.style.overflowAnchor = 'none';
    let points: Point[] = [];
    let dirty = true;
    let sourceDirty = true;
    let measuredOffsets: number[] = [];
    let measuredPositions: number[] = [];
    let leader: Side = 'source';
    let frame = 0;
    let disposed = false;
    const expected = new Map<HTMLElement, number>();
    const panes = { source: editor, preview };

    const measure = () => {
      const sourceMax = editor.scrollHeight - editor.clientHeight;
      const previewMax = preview.scrollHeight - preview.clientHeight;
      const anchors = Array.from(paper.querySelectorAll<HTMLElement>('[data-source-offset]'))
        .filter(node => node.getClientRects().length > 0)
        .map(node => ({ node, offset: Number(node.dataset.sourceOffset) }))
        .filter(({ offset }) => Number.isInteger(offset) && offset >= 0 && offset <= markdown.length)
        .sort((a, b) => a.offset - b.offset);
      const offsets = [0, ...new Set(anchors.map(anchor => anchor.offset).filter(offset => offset > 0))];
      if (sourceDirty || offsets.length !== measuredOffsets.length || offsets.some((offset, index) => offset !== measuredOffsets[index])) {
        measuredOffsets = offsets;
        measuredPositions = sourcePositions(editor, offsets, markdown);
        sourceDirty = false;
      }
      const positions = new Map(offsets.map((offset, index) => [offset, measuredPositions[index]]));
      const origin = preview.getBoundingClientRect().top + preview.clientTop;
      points = [{ source: 0, preview: 0 }];
      for (const { node, offset } of anchors) {
        const source = positions.get(offset)!;
        const target = node.getBoundingClientRect().top - origin + preview.scrollTop;
        const last = points.at(-1)!;
        if (source > last.source && target > last.preview && source < sourceMax && target < previewMax)
          points.push({ source, preview: target });
      }
      if (sourceMax > 0 && previewMax > 0) points.push({ source: sourceMax, preview: previewMax });
      dirty = false;
    };
    const sync = () => {
      frame = 0;
      if (dirty) measure();
      if (points.length < 2) return;
      const other: Side = leader === 'source' ? 'preview' : 'source';
      const target = panes[other];
      const position = interpolate(points, panes[leader].scrollTop, leader, other);
      if (Math.abs(target.scrollTop - position) < 1) return;
      target.scrollTop = position;
      expected.set(target, target.scrollTop);
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(sync); };
    const onScroll = (side: Side) => {
      const pane = panes[side];
      const pending = expected.get(pane);
      expected.delete(pane);
      if (pending !== undefined && Math.abs(pane.scrollTop - pending) < 1) return;
      leader = side;
      schedule();
    };
    const sourceScroll = () => onScroll('source');
    const previewScroll = () => onScroll('preview');
    const takeSource = () => { expected.delete(editor); leader = 'source'; };
    const takePreview = () => { expected.delete(preview); leader = 'preview'; };
    const layoutChanged = () => { dirty = true; schedule(); };
    const sizeChanged = () => { sourceDirty = true; layoutChanged(); };
    const resize = new ResizeObserver(sizeChanged);
    resize.observe(editor);
    resize.observe(paper);
    resize.observe(preview);
    const mutations = new MutationObserver(layoutChanged);
    mutations.observe(paper, { childList: true, subtree: true, attributes: true });
    editor.addEventListener('scroll', sourceScroll, { passive: true });
    preview.addEventListener('scroll', previewScroll, { passive: true });
    for (const type of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
      editor.addEventListener(type, takeSource, { passive: true });
      preview.addEventListener(type, takePreview, { passive: true });
    }
    paper.addEventListener('load', layoutChanged, true);
    paper.addEventListener('toggle', layoutChanged, true);
    paper.addEventListener('transitionend', layoutChanged, true);
    paper.addEventListener('transitioncancel', layoutChanged, true);
    document.fonts.addEventListener('loadingdone', sizeChanged);
    // Sources/targets can change after images, diagrams, fonts, zoom or sections settle.
    schedule();
    return () => {
      disposed = true;
      preview.style.overflowAnchor = anchoring;
      cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      editor.removeEventListener('scroll', sourceScroll);
      preview.removeEventListener('scroll', previewScroll);
      for (const type of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
        editor.removeEventListener(type, takeSource);
        preview.removeEventListener(type, takePreview);
      }
      paper.removeEventListener('load', layoutChanged, true);
      paper.removeEventListener('toggle', layoutChanged, true);
      paper.removeEventListener('transitionend', layoutChanged, true);
      paper.removeEventListener('transitioncancel', layoutChanged, true);
      document.fonts.removeEventListener('loadingdone', sizeChanged);
    };
  }, [root, enabled, markdown, documentId]);
}
