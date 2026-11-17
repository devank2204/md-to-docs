import { useEffect, useRef } from "react";
import { EditorState, ChangeSet, Text } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightWhitespace,
  highlightSpecialChars,
} from "@codemirror/view";
import {
  history,
  historyKeymap,
  historyField,
  defaultKeymap,
  isolateHistory,
} from "@codemirror/commands";
import {
  MergeView,
  unifiedMergeView,
  getChunks,
  originalDocChangeEffect,
  getOriginalDoc,
  Chunk,
  goToNextChunk,
  goToPreviousChunk,
} from "@codemirror/merge";
export function TextEditors({
  a,
  b,
  onChange,
  mode,
  whitespace,
  readOnly = false,
  context,
  onStatus,
  nav,
}: {
  a: string;
  b: string;
  onChange: (side: 0 | 1, value: string) => void;
  mode: string;
  whitespace: boolean;
  readOnly?: boolean;
  context: number;
  onStatus: (count: number, approx: boolean) => void;
  nav: { current: ((next: boolean) => void) | null };
}) {
  const host = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const values = useRef([a, b]);
  values.current = [a, b];
  const editors = useRef<EditorView[]>([]);
  const histories = useRef<(EditorState | undefined)[]>([]);
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const status = () => {
      const editor = editors.current.at(-1);
      if (!editor) return;
      const chunks =
        getChunks(editor.state)?.chunks ||
        Chunk.build(
          Text.of(values.current[0].split("\n")),
          Text.of(values.current[1].split("\n")),
          { scanLimit: 500, timeout: 50 },
        );
      onStatus(
        chunks.length,
        chunks.some((c) => !c.precise),
      );
    };
    const extensions = (side: 0 | 1) => [
      EditorState.lineSeparator.of("\n"),
      highlightSpecialChars(),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      lineNumbers(),
      history(),
      ...(histories.current[side]?.doc.toString() === values.current[side] &&
      !readOnly
        ? [
            historyField.init(() =>
              histories.current[side]!.field(historyField),
            ),
          ]
        : []),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        "aria-label": side ? "Updated" : "Original",
      }),
      whitespace ? highlightWhitespace() : [],
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !syncing.current) {
          values.current[side] = update.state.doc.toString();
          callback.current(side, update.state.doc.toString());
        }
        if (
          update.docChanged ||
          update.transactions.some((transaction) => transaction.effects.length)
        )
          queueMicrotask(status);
      }),
    ];
    const config = {
      diffConfig: { scanLimit: 500, timeout: 50 },
      collapseUnchanged: { margin: context, minSize: 8 },
    };
    let merge: MergeView | undefined;
    if (mode === "side") {
      merge = new MergeView({
        a: { doc: values.current[0], extensions: extensions(0) },
        b: { doc: values.current[1], extensions: extensions(1) },
        parent: host.current!,
        ...config,
      });
      editors.current = [merge.a, merge.b];
    } else {
      const side = mode === "original" ? 0 : 1;
      editors.current = [
        new EditorView({
          parent: host.current!,
          state: EditorState.create({
            doc: values.current[side],
            extensions: [
              ...extensions(side),
              ...(mode === "unified"
                ? unifiedMergeView({
                    original: Text.of(values.current[0].split("\n")),
                    mergeControls: false,
                    ...config,
                  })
                : []),
            ],
          }),
        }),
      ];
    }
    nav.current = (next) => {
      const view = editors.current.at(-1)!;
      (next ? goToNextChunk : goToPreviousChunk)(view);
      view.focus();
    };
    status();
    return () => {
      nav.current = null;
      if (!readOnly)
        editors.current.forEach((editor, index) => {
          const side = mode === "side" ? index : mode === "original" ? 0 : 1;
          histories.current[side] = editor.state;
        });
      if (merge) merge.destroy();
      else editors.current.forEach((e) => e.destroy());
      editors.current = [];
    };
  }, [mode, whitespace, context, readOnly]);
  useEffect(() => {
    syncing.current = true;
    editors.current.forEach((editor, index) => {
      if (mode === "unified") {
        const original = getOriginalDoc(editor.state);
        if (original.toString() !== a)
          editor.dispatch({
            effects: originalDocChangeEffect(
              editor.state,
              ChangeSet.of(
                { from: 0, to: original.length, insert: a },
                original.length,
                "\n",
              ),
            ),
          });
      }
      const side = mode === "side" ? index : mode === "original" ? 0 : 1;
      const value = side ? b : a;
      if (editor.state.doc.toString() !== value)
        editor.dispatch({
          annotations: isolateHistory.of("full"),
          changes: { from: 0, to: editor.state.doc.length, insert: value },
        });
    });
    syncing.current = false;
  }, [a, b, mode]);
  return <div ref={host} className="compare-editors" />;
}
