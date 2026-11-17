import type { Change } from "./model";
import { locateChanges, type ChangeLocation } from "./jsonLocations";
import {
  jsonHighlightState,
  jsonChangeGutter,
  setJSONHighlights,
} from "./jsonHighlights";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { useLayoutEffect, useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
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
  changes,
  selected,
  onSelect,
}: {
  a: string;
  b: string;
  onChange: (side: 0 | 1, value: string) => void;
  active: 0 | 1;
  mobile: boolean;
  changes: Change[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const hosts = useRef<(HTMLDivElement | null)[]>([]),
    views = useRef<EditorView[]>([]),
    syncing = useRef(false),
    change = useRef(onChange);
  const clickedSide = useRef<number | null>(null);
  const selectedIndex = useRef(selected);
  selectedIndex.current = selected;
  const pick = useRef(onSelect);
  pick.current = onSelect;
  const locations = useRef<ChangeLocation[][]>([[], []]);
  change.current = onChange;
  const palette = useRef(new Compartment());
  const colors = () => {
    const dark = document.documentElement.dataset.appearance === "dark";
    return [
      EditorView.theme({}, { dark }),
      syntaxHighlighting(dark ? oneDarkHighlightStyle : defaultHighlightStyle),
    ];
  };
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
              jsonHighlightState,
              jsonChangeGutter,
              EditorView.domEventHandlers({
                mousedown(event) {
                  const target = (event.target as Element).closest<HTMLElement>(
                    "[data-json-change]",
                  );
                  if (target) {
                    const index = Number(target.dataset.jsonChange);
                    if (index !== selectedIndex.current)
                      clickedSide.current = side;
                    pick.current(index);
                  }
                  return false;
                },
              }),
              placeholder(
                side ? "Paste updated JSON here…" : "Paste original JSON here…",
              ),
              highlightSpecialChars(),
              history(),
              keymap.of([...defaultKeymap, ...historyKeymap]),
              json(),
              palette.current.of(colors()),
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
    const observer = new MutationObserver(() => {
      views.current.forEach((view) =>
        view.dispatch({ effects: palette.current.reconfigure(colors()) }),
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-appearance"],
    });
    return () => {
      observer.disconnect();
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
  useEffect(() => {
    locations.current = views.current.map((view, side) =>
      changes.length
        ? locateChanges(view.state.doc.toString(), changes, side as 0 | 1)
        : [],
    );
    views.current.forEach((view, side) =>
      view.dispatch({
        effects: setJSONHighlights.of({
          locations: locations.current[side],
          selected,
        }),
      }),
    );
  }, [changes]);
  useEffect(() => {
    views.current.forEach((view, side) =>
      view.dispatch({
        effects: setJSONHighlights.of({
          locations: locations.current[side],
          selected,
        }),
      }),
    );
    const clicked = clickedSide.current;
    clickedSide.current = null;
    if (selected < 0) return;
    const frame = requestAnimationFrame(() => {
      views.current.forEach((view, side) => {
        const target = locations.current[side].find(
          (location) => location.index === selected,
        );
        if (target && side !== clicked && (!mobile || side === active))
          view.dispatch({
            selection: { anchor: target.valueFrom },
            effects: EditorView.scrollIntoView(target.valueFrom, {
              y: "center",
              yMargin: 60,
            }),
          });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected, active, mobile, changes]);
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
