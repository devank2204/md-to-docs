import {
  StateEffect,
  StateField,
  RangeSet,
  type Text,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  GutterMarker,
  gutter,
  type DecorationSet,
} from "@codemirror/view";
import type { ChangeLocation } from "./jsonLocations";
export const setJSONHighlights = StateEffect.define<{
  locations: ChangeLocation[];
  selected: number;
}>();
class ChangeMarker extends GutterMarker {
  readonly kind: string;
  readonly title: string;
  constructor(kind: string, title: string) {
    super();
    this.kind = kind;
    this.title = title;
  }
  eq(other: ChangeMarker) {
    return this.kind === other.kind && this.title === other.title;
  }
  toDOM() {
    const marker = document.createElement("span");
    marker.className = `cm-json-gutter-${this.kind.toLowerCase()}`;
    marker.textContent =
      this.kind === "Added" ? "+" : this.kind === "Removed" ? "−" : "~";
    marker.title = this.title;
    marker.setAttribute("aria-label", this.title);
    return marker;
  }
}
function highlights(doc: Text, locations: ChangeLocation[], selected: number) {
  const decorations: Range<Decoration>[] = [];
  const lines = new Map<
    number,
    {
      type: string;
      selected: boolean;
      paths: string[];
      index: number;
      present: boolean;
    }
  >();
  for (const location of locations) {
    const active = location.index === selected;
    if (!location.present && !active) continue;
    if (location.present && location.valueTo > location.valueFrom)
      decorations.push(
        Decoration.mark({
          class: `cm-json-value cm-json-${location.type.toLowerCase()}${active ? " cm-json-value-selected" : ""}`,
          attributes: {
            "data-json-change": String(location.index),
            title: `${location.type}: ${location.path}`,
          },
        }).range(location.valueFrom, location.valueTo),
      );
    const first = doc.lineAt(location.from),
      last = doc.lineAt(location.to);
    for (let number = first.number; number <= last.number; number++) {
      const from = doc.line(number).from;
      const previous = lines.get(from);
      lines.set(from, {
        type: location.type,
        selected: active || !!previous?.selected,
        paths: [
          ...(previous?.paths ?? []),
          `${location.type}: ${location.path}`,
        ],
        index: active || !previous ? location.index : previous.index,
        present: location.present || !!previous?.present,
      });
    }
  }
  const markers: Range<GutterMarker>[] = [];
  for (const [from, line] of lines) {
    decorations.push(
      Decoration.line({
        class: `${line.present ? `cm-json-line cm-json-line-${line.type.toLowerCase()}` : "cm-json-missing-anchor"}${line.selected ? " cm-json-line-selected" : ""}`,
        attributes: { "data-json-change": String(line.index) },
      }).range(from),
    );
    if (line.present)
      markers.push(
        new ChangeMarker(line.type, line.paths.join("\n")).range(from),
      );
  }
  return {
    decorations: Decoration.set(decorations, true),
    markers: RangeSet.of(markers, true),
    locations,
  };
}
export const jsonHighlightState = StateField.define<{
  decorations: DecorationSet;
  markers: RangeSet<GutterMarker>;
  locations: ChangeLocation[];
}>({
  create: () => ({
    decorations: Decoration.none,
    markers: RangeSet.empty,
    locations: [],
  }),
  update(value, transaction) {
    // Old source offsets must disappear immediately on edits, not after debounce.
    if (transaction.docChanged)
      value = {
        decorations: Decoration.none,
        markers: RangeSet.empty,
        locations: [],
      };
    for (const effect of transaction.effects)
      if (effect.is(setJSONHighlights))
        value = highlights(
          transaction.newDoc,
          effect.value.locations,
          effect.value.selected,
        );
    return value;
  },
  provide: (field) =>
    EditorView.decorations.from(field, (value) => value.decorations),
});
export const jsonChangeGutter = gutter({
  class: "cm-json-change-gutter",
  markers: (view) => view.state.field(jsonHighlightState).markers,
});
