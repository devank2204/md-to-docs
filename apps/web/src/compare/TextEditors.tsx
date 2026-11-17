import { compareSearch, findInEditor, type SearchHandle } from "./editorSearch";
import { useEffect, useRef } from "react";
import {
  EditorState,
  ChangeSet,
  Text,
  Compartment,
  type StateEffect,
} from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightWhitespace,
  highlightSpecialChars,
  placeholder,
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
  uncollapseUnchanged,
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
  find,
  changesOnly,
  onReady,
}: {
  a: string;
  b: string;
  onChange: (side: 0 | 1, value: string) => void;
  mode: string;
  whitespace: boolean;
  readOnly?: boolean;
  context: number;
  onStatus: (count: number, approx: boolean, active?: number) => void;
  nav: { current: ((next: boolean) => void) | null };
  find: SearchHandle;
  changesOnly: boolean;
  onReady: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const values = useRef([a, b]);
  values.current = [a, b];
  const editors = useRef<EditorView[]>([]);
  const histories = useRef<(EditorState | undefined)[]>([]);
  const appearance = useRef(new Compartment());
  const cache = useRef<{
    a: string;
    b: string;
    chunks: readonly Chunk[];
  } | null>(null);
  const reportStatus = useRef<(() => void) | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const status = (focused?: EditorView) => {
      const editor = focused || editors.current.at(-1);
      if (!editor) return;
      const merge = getChunks(editor.state);
      let chunks = merge?.chunks;
      if (!chunks) {
        if (
          cache.current?.a !== values.current[0] ||
          cache.current?.b !== values.current[1]
        )
          cache.current = {
            a: values.current[0],
            b: values.current[1],
            chunks: Chunk.build(
              Text.of(values.current[0].split("\n")),
              Text.of(values.current[1].split("\n")),
              { scanLimit: 500, timeout: 50 },
            ),
          };
        chunks = cache.current!.chunks;
      }
      const side = merge?.side || (mode === "original" ? "a" : "b");
      const head = editor.state.selection.main.head;
      const active = chunks.findIndex(
        (chunk) =>
          head >= (side === "a" ? chunk.fromA : chunk.fromB) &&
          head <= (side === "a" ? chunk.toA : chunk.toB),
      );
      onStatus(
        chunks.length,
        chunks.some((chunk) => !chunk.precise),
        active + 1,
      );
    };
    reportStatus.current = () => status();
    const extensions = (side: 0 | 1) => [
      EditorState.lineSeparator.of("\n"),
      highlightSpecialChars(),
      placeholder(side ? "Paste updated text…" : "Paste original text…"),
      appearance.current.of(
        EditorView.theme(
          {},
          {
            dark: ["dark", "black"].includes(
              document.documentElement.dataset.appearance ?? "",
            ),
          },
        ),
      ),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      lineNumbers(),
      history(),
      compareSearch,
      // Merge's collapsed-range state does not automatically reveal search
      // selections. Use its public effect to reveal the containing block.
      EditorState.transactionExtender.of((transaction) => {
        if (!transaction.isUserEvent("select.search")) return null;
        const effects: StateEffect<unknown>[] = [];
        const selection = transaction.newSelection.main;
        for (const decorations of transaction.state.facet(
          EditorView.decorations,
        )) {
          if (typeof decorations === "function") continue;
          decorations.between(
            selection.from,
            selection.to,
            (from, to, decoration) => {
              if (to > from && decoration.spec.block && decoration.spec.widget)
                effects.push(uncollapseUnchanged.of(from));
            },
          );
        }
        return effects.length ? { effects } : null;
      }),
      ...(histories.current[side]?.doc.toString() === values.current[side] &&
      !readOnly
        ? [
            historyField.init(() =>
              histories.current[side]!.field(historyField),
            ),
          ]
        : []),
      keymap.of([
        { key: "F7", run: goToNextChunk },
        { key: "Shift-F7", run: goToPreviousChunk },
        ...defaultKeymap,
        ...historyKeymap,
      ]),
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
          update.selectionSet ||
          update.focusChanged ||
          update.transactions.some((transaction) => transaction.effects.length)
        )
          queueMicrotask(() => {
            if (editors.current.includes(update.view)) status(update.view);
          });
      }),
    ];
    const config = {
      diffConfig: { scanLimit: 500, timeout: 50 },
      collapseUnchanged: changesOnly
        ? { margin: context, minSize: 1 }
        : undefined,
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
    find.current = (side) => {
      const view = mode === "side" ? editors.current[side] : editors.current[0];
      if (view) findInEditor(view);
    };
    onReady();
    nav.current = (next) => {
      const view = editors.current.at(-1)!;
      (next ? goToNextChunk : goToPreviousChunk)(view);
      view.focus();
    };
    status();
    const observer = new MutationObserver(() => {
      editors.current.forEach((view) =>
        view.dispatch({
          effects: appearance.current.reconfigure(
            EditorView.theme(
              {},
              {
                dark: ["dark", "black"].includes(
                  document.documentElement.dataset.appearance ?? "",
                ),
              },
            ),
          ),
        }),
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-appearance"],
    });
    return () => {
      observer.disconnect();
      reportStatus.current = null;
      nav.current = null;
      find.current = null;
      if (!readOnly)
        editors.current.forEach((editor, index) => {
          const side = mode === "side" ? index : mode === "original" ? 0 : 1;
          histories.current[side] = editor.state;
        });
      if (merge) merge.destroy();
      else editors.current.forEach((e) => e.destroy());
      editors.current = [];
    };
  }, [mode, whitespace, context, readOnly, changesOnly]);
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
    reportStatus.current?.();
  }, [a, b, mode]);
  return <div ref={host} className="compare-editors" />;
}
