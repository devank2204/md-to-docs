import { jsonLanguage } from "@codemirror/lang-json";
import type { Change } from "./model";
export type SourceRange = {
  from: number;
  to: number;
  valueFrom: number;
  valueTo: number;
};
export type ChangeLocation = SourceRange & {
  index: number;
  type: string;
  path: string;
  present: boolean;
};
const keyFor = (path: (string | number)[]) => JSON.stringify(path);
// Lezer supplies JSON token boundaries. This only indexes locations in the exact
// source, never computes equality or rewrites/normalizes the user's payload.
export function sourceLocations(source: string) {
  const locations = new Map<string, SourceRange>();
  const tree = jsonLanguage.parser.parse(source);
  type Node = typeof tree.topNode;
  const visit = (node: Node, path: (string | number)[], property?: Node) => {
    locations.set(keyFor(path), {
      from: (property ?? node).from,
      to: (property ?? node).to,
      valueFrom: node.from,
      valueTo: node.to,
    });
    if (node.name === "Object") {
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.name !== "Property") continue;
        const name = child.getChild("PropertyName"),
          value = name?.nextSibling?.nextSibling;
        if (name && value)
          visit(
            value,
            [...path, JSON.parse(source.slice(name.from, name.to))],
            child,
          );
      }
    } else if (node.name === "Array") {
      let index = 0;
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (["[", "]", ","].includes(child.name)) continue;
        visit(child, [...path, index++]);
      }
    }
  };
  const root = tree.topNode.firstChild;
  if (root) visit(root, []);
  return locations;
}
export function locateChanges(
  source: string,
  changes: Change[],
  side: 0 | 1,
): ChangeLocation[] {
  const locations = sourceLocations(source);
  return changes.flatMap<ChangeLocation>((change, index) => {
    const path = side ? change.updatedSegments : change.originalSegments;
    const exact = path && locations.get(keyFor(path));
    if (exact)
      return [
        {
          ...exact,
          index,
          type: change.type,
          path: change.path,
          present: true,
        },
      ];
    // A missing value has no source span. Use the nearest existing parent solely
    // as a navigation anchor, never mark its text as an added/removed value.
    const parent = [
      ...(side
        ? (change.updatedParentSegments ?? [])
        : (change.originalParentSegments ?? [])),
    ];
    let anchor: SourceRange | undefined;
    anchor = locations.get(keyFor(parent));
    while (!anchor && parent.length) {
      parent.pop();
      anchor = locations.get(keyFor(parent));
    }
    if (!anchor) return [];
    const position = Math.max(anchor.valueFrom, anchor.valueTo - 1);
    return [
      {
        from: position,
        to: position,
        valueFrom: position,
        valueTo: position,
        index,
        type: change.type,
        path: change.path,
        present: false,
      },
    ];
  });
}
