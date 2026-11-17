import { useLayoutEffect, useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightSpecialChars,
  placeholder,
} from "@codemirror/view";
import {
  history,
  historyKeymap,
  defaultKeymap,
  isolateHistory,
} from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
export default function JsonEditors({
  a,
  b,
  onChange,
  active,
  mobile,
}: {
  a: string;
  b: string;
  onChange: (side: 0 | 1, value: string) => void;
  active: 0 | 1;
  mobile: boolean;
}) {
  const hosts = useRef<(HTMLDivElement | null)[]>([]),
    views = useRef<EditorView[]>([]),
    syncing = useRef(false),
    change = useRef(onChange);
  change.current = onChange;
  useLayoutEffect(() => {
    views.current = hosts.current.map(
      (parent, side) =>
        new EditorView({
          parent: parent!,
          state: EditorState.create({
            doc: side ? b : a,
            extensions: [
              EditorState.lineSeparator.of("\n"),
              lineNumbers(),
              placeholder(
                side ? "Paste updated JSON here…" : "Paste original JSON here…",
              ),
              highlightSpecialChars(),
              history(),
              keymap.of([...defaultKeymap, ...historyKeymap]),
              json(),
              syntaxHighlighting(defaultHighlightStyle),
              EditorView.lineWrapping,
              EditorView.contentAttributes.of({
                "aria-label": side ? "Updated" : "Original",
              }),
              EditorView.updateListener.of((update) => {
                if (update.docChanged && !syncing.current)
                  change.current(side as 0 | 1, update.state.doc.toString());
              }),
            ],
          }),
        }),
    );
    return () => {
      views.current.forEach((view) => view.destroy());
      views.current = [];
    };
  }, []);
  useEffect(() => {
    syncing.current = true;
    try {
      views.current.forEach((view, side) => {
        const value = side ? b : a;
        if (view.state.doc.toString() !== value)
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: value },
            annotations: isolateHistory.of("full"),
          });
      });
    } finally {
      syncing.current = false;
    }
  }, [a, b]);
  useEffect(() => {
    views.current.forEach((view) => view.requestMeasure());
  }, [active, mobile]);
  return (
    <div className="json-editors compare-editors">
      {[0, 1].map((side) => (
        <div
          key={side}
          data-compare-side={side}
          hidden={mobile && active !== side}
          ref={(element) => {
            hosts.current[side] = element;
          }}
        />
      ))}
    </div>
  );
}
