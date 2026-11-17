import { compareSearch, findInEditor, type SearchHandle } from "./editorSearch";
import { jsonContextFolding, outsideJSONContextRanges } from "./jsonFolding";
import { foldEffect, unfoldAll } from "@codemirror/language";
import { scrollAnchors, matchingScrollTop } from "./jsonScroll";
import type { Change, JSONScrollPair } from "./model";
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
  syncScroll,
  scrollPairs,
  find,
  changesOnly,
  onReady,
}: {
  a: string;
  b: string;
  onChange: (side: 0 | 1, value: string) => void;
  active: 0 | 1;
  mobile: boolean;
  changes: Change[];
  selected: number;
  onSelect: (index: number) => void;
  syncScroll: boolean;
  scrollPairs: JSONScrollPair[];
  find: SearchHandle;
  changesOnly: boolean;
  onReady: () => void;
}) {
  const hosts = useRef<(HTMLDivElement | null)[]>([]),
    views = useRef<EditorView[]>([]),
    syncing = useRef(false),
    change = useRef(onChange);
  const scrollLeader = useRef<number | null>(null);
  const clickedSide = useRef<number | null>(null);
  const selectedIndex = useRef(selected);
  selectedIndex.current = selected;
  const pick = useRef(onSelect);
  pick.current = onSelect;
  const locations = useRef<ChangeLocation[][]>([[], []]);
  change.current = onChange;
  const palette = useRef(new Compartment());
  const colors = () => {
    const dark = ["dark", "black"].includes(
      document.documentElement.dataset.appearance ?? "",
    );
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
              compareSearch,
              jsonContextFolding,
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
    find.current = (side) => {
      if (views.current[side]) findInEditor(views.current[side]);
    };
    onReady();
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
      find.current = null;
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
    scrollLeader.current = null;
    const clicked = clickedSide.current;
    clickedSide.current = null;
    if (selected < 0) return;
    let canceled = false;
    const frames: number[] = [];
    views.current.forEach((view, side) => {
      const target = locations.current[side].find(
        (location) => location.index === selected,
      );
      if (!target || side === clicked || (mobile && side !== active)) return;
      // A selected-field strip or focus layout can resize the editor outside
      // CodeMirror. Measure first, then navigate after native scroll anchoring.
      view.requestMeasure({
        read: () => !canceled && views.current.includes(view),
        write: (ready) => {
          if (!ready) return;
          frames.push(
            requestAnimationFrame(() => {
              if (canceled || !views.current.includes(view)) return;
              view.dispatch({
                selection: { anchor: target.valueFrom },
                effects: EditorView.scrollIntoView(target.valueFrom, {
                  y: "center",
                  yMargin: 60,
                }),
              });
              // Wrapped-line estimates may change when the destination renders.
              // Verify the actual cursor rectangle after that measurement pass.
              view.requestMeasure({
                read: () => !canceled && views.current.includes(view),
                write: (valid) => {
                  if (!valid) return;
                  frames.push(
                    requestAnimationFrame(() => {
                      if (canceled || !views.current.includes(view)) return;
                      const cursor = view.coordsAtPos(target.valueFrom);
                      if (!cursor) return;
                      const boxes = views.current
                        .filter((_item, index) => !mobile || index === active)
                        .map((item) => item.scrollDOM.getBoundingClientRect());
                      const top = Math.max(0, ...boxes.map((box) => box.top));
                      const bottom = Math.min(
                        innerHeight,
                        ...boxes.map((box) => box.bottom),
                      );
                      let desired = (top + bottom) / 2;
                      if (clicked !== null) {
                        const source = views.current[clicked];
                        const sourceTarget = locations.current[clicked].find(
                          (location) => location.index === selected,
                        );
                        const sourceCursor =
                          sourceTarget &&
                          source.coordsAtPos(sourceTarget.valueFrom);
                        if (sourceCursor)
                          desired = Math.max(
                            top + 12,
                            Math.min(
                              bottom - 12,
                              (sourceCursor.top + sourceCursor.bottom) / 2,
                            ),
                          );
                      }
                      view.scrollDOM.scrollTop +=
                        (cursor.top + cursor.bottom) / 2 - desired;
                    }),
                  );
                },
              });
            }),
          );
        },
      });
    });
    return () => {
      canceled = true;
      frames.forEach(cancelAnimationFrame);
    };
  }, [selected, active, mobile, changes]);
  useEffect(() => {
    views.current.forEach((view, side) => {
      unfoldAll(view);
      if (changesOnly) {
        const ranges = outsideJSONContextRanges(
          view.state.doc,
          locations.current[side],
        );
        if (ranges.length)
          view.dispatch({
            effects: ranges.map((range) => foldEffect.of(range)),
          });
      }
      view.requestMeasure();
    });
  }, [changesOnly, changes, a, b]);
  useEffect(() => {
    if (mobile || !syncScroll || views.current.length !== 2) return;
    const pair = views.current;
    const anchors = scrollPairs.length
      ? scrollAnchors(a, b, scrollPairs)
      : [[], []];
    scrollLeader.current = null;
    let frame = 0,
      correctionFrame = 0;
    let disposed = false;
    const measureKey = {};
    const handlers = pair.map((view, side) => {
      const handler = () => {
        if (scrollLeader.current !== side) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (disposed || !views.current.includes(view)) return;
          const other = side ? 0 : 1;
          // No stale path offsets during typing; the status supplies no pairs
          // until both current inputs have been compared successfully.
          const top = matchingScrollTop(view, pair[other], anchors[side]);
          pair[other].scrollDOM.scrollTop = top;
          // Virtualized lines can acquire their measured heights after scrolling.
          // Correct once in CodeMirror's own read/write layout cycle.
          pair[other].requestMeasure({
            key: measureKey,
            read: () => !disposed,
            write: (ready) => {
              if (!ready) return;
              cancelAnimationFrame(correctionFrame);
              // CodeMirror applies its own scroll anchoring after measure writes.
              // Align after that pass, using the now-rendered token coordinates.
              correctionFrame = requestAnimationFrame(() => {
                if (!disposed && scrollLeader.current === side)
                  pair[other].scrollDOM.scrollTop = matchingScrollTop(
                    view,
                    pair[other],
                    anchors[side],
                  );
              });
            },
          });
        });
      };
      const intent = () => {
        scrollLeader.current = side;
        cancelAnimationFrame(frame);
        cancelAnimationFrame(correctionFrame);
      };
      const keyIntent = (event: KeyboardEvent) => {
        if (
          [
            "PageDown",
            "PageUp",
            "Home",
            "End",
            "ArrowDown",
            "ArrowUp",
          ].includes(event.key)
        )
          intent();
      };
      const pointerIntent = (event: PointerEvent) => {
        const bounds = view.scrollDOM.getBoundingClientRect();
        if (
          event.clientX >= bounds.left + view.scrollDOM.clientWidth ||
          event.clientY >= bounds.top + view.scrollDOM.clientHeight
        )
          intent();
      };
      view.scrollDOM.addEventListener("scroll", handler, { passive: true });
      view.scrollDOM.addEventListener("wheel", intent, { passive: true });
      view.scrollDOM.addEventListener("touchstart", intent, { passive: true });
      view.scrollDOM.addEventListener("keydown", keyIntent);
      view.scrollDOM.addEventListener("pointerdown", pointerIntent);
      return () => {
        view.scrollDOM.removeEventListener("scroll", handler);
        view.scrollDOM.removeEventListener("wheel", intent);
        view.scrollDOM.removeEventListener("touchstart", intent);
        view.scrollDOM.removeEventListener("keydown", keyIntent);
        view.scrollDOM.removeEventListener("pointerdown", pointerIntent);
      };
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(correctionFrame);
      handlers.forEach((dispose) => dispose());
    };
  }, [a, b, mobile, syncScroll, scrollPairs]);
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
