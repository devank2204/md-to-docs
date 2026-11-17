import { create, type Delta } from "jsondiffpatch";
import BaseFormatter from "jsondiffpatch/formatters/base";
// No inferred object identity: array edits are positional; reorders are add/remove.
const engine = create({ arrays: { detectMove: false } });
export type Change = {
  path: string;
  segments: (string | number)[];
  type: string;
  originalPath?: string;
  updatedPath?: string;
  originalSegments?: (string | number)[];
  updatedSegments?: (string | number)[];
  originalParentSegments?: (string | number)[];
  updatedParentSegments?: (string | number)[];
  old?: unknown;
  next?: unknown;
};
// Reuse the upstream formatter's array index correspondence. Underscored delta
// keys are old indices; other keys are new indices after insertions/removals.
// Only the pure enumeration method is used: no formatter HTML is generated.
const arrayFormatter = {
  includeMoveDestinations: false,
  forEachDeltaKey: BaseFormatter.prototype.forEachDeltaKey,
};
export function changesFromDelta(delta: Delta, left?: unknown): Change[] {
  const visit = (
    node: Delta,
    original: unknown,
    oldPath: (string | number)[],
    newPath: (string | number)[],
  ): Change[] => {
    if (!node) return [];
    if (Array.isArray(node)) {
      const added = node.length === 1;
      const removed = node.length > 2;
      const segments = removed ? oldPath : newPath;
      return [
        {
          path: jsonPath(segments),
          segments,
          originalPath: added ? undefined : jsonPath(oldPath),
          updatedPath: removed ? undefined : jsonPath(newPath),
          originalSegments: added ? undefined : oldPath,
          updatedSegments: removed ? undefined : newPath,
          originalParentSegments: oldPath.slice(0, -1),
          updatedParentSegments: newPath.slice(0, -1),
          type: added ? "Added" : removed ? "Removed" : "Modified",
          old: added ? undefined : decode(node[0]),
          next: added ? decode(node[0]) : removed ? undefined : decode(node[1]),
        },
      ];
    }
    const changes: Change[] = [];
    if (node._t === "a") {
      arrayFormatter.forEachDeltaKey(node, original, (key, leftKey) => {
        const child = (node as Record<string, Delta>)[key];
        if (!child) return;
        const oldIndex = Number(leftKey),
          newIndex = Number(key.replace(/^_/, ""));
        changes.push(
          ...visit(
            child,
            Array.isArray(original) ? original[oldIndex] : undefined,
            [...oldPath, oldIndex],
            [...newPath, newIndex],
          ),
        );
      });
    } else {
      for (const [encodedKey, child] of Object.entries(node)) {
        const key = encodedKey.slice(1);
        const oldValue =
          original &&
          typeof original === "object" &&
          Object.hasOwn(original, key)
            ? (original as Record<string, unknown>)[key]
            : undefined;
        changes.push(
          ...visit(
            child as Delta,
            oldValue,
            [...oldPath, key],
            [...newPath, key],
          ),
        );
      }
    }
    return changes;
  };
  return visit(delta, left, [], []);
}
export type JSONScrollPair = {
  original: (string | number)[];
  updated: (string | number)[];
};
// Navigation correspondence, not a diff: jsondiffpatch owns all matching. Its
// formatter enumerates unchanged and changed pairs with their old/new indices.
function scrollPairsFromDelta(
  delta: Delta,
  left: unknown,
  right: unknown,
): JSONScrollPair[] {
  const pairs: JSONScrollPair[] = [];
  const visit = (
    node: Delta,
    oldValue: unknown,
    newValue: unknown,
    original: (string | number)[],
    updated: (string | number)[],
  ) => {
    pairs.push({ original, updated });
    if (Array.isArray(node)) return;
    if (
      !oldValue ||
      !newValue ||
      typeof oldValue !== "object" ||
      typeof newValue !== "object"
    )
      return;
    const array = Array.isArray(oldValue) && Array.isArray(newValue);
    if (Array.isArray(oldValue) !== Array.isArray(newValue)) return;
    const current = node ?? (array ? { _t: "a" as const } : {});
    arrayFormatter.forEachDeltaKey(current, oldValue, (key, leftKey) => {
      if (array && key.startsWith("_")) return;
      const oldKey = array ? Number(leftKey) : key;
      const newKey = array ? Number(key) : key;
      if (!Object.hasOwn(oldValue, oldKey) || !Object.hasOwn(newValue, newKey))
        return;
      const child = (current as Record<string, Delta>)[key];
      if (Array.isArray(child) && child.length !== 2) return;
      visit(
        child,
        (oldValue as Record<string, unknown>)[oldKey],
        (newValue as Record<string, unknown>)[newKey],
        [...original, array ? oldKey : key.slice(1)],
        [...updated, array ? newKey : key.slice(1)],
      );
    });
  };
  visit(delta, left, right, [], []);
  return pairs;
}
export function jsonPath(segments: (string | number)[]): string {
  return (
    "$" +
    segments
      .map((key) =>
        typeof key === "number"
          ? `[${key}]`
          : /^[A-Za-z_$][\w$]*$/.test(key)
            ? `.${key}`
            : `[${JSON.stringify(key)}]`,
      )
      .join("")
  );
}
// Escape every object key before the library sees it. This prevents __proto__
// assignment loss in upstream delta construction, with a reversible key mapping.
function encode(text: string) {
  return JSON.parse(text, (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).map(([k, v]) => ["$" + k, v]))
      : value,
  );
}
function decode(value: unknown): unknown {
  return value && typeof value === "object"
    ? Array.isArray(value)
      ? value.map(decode)
      : Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k.slice(1), decode(v)]),
        )
    : value;
}
export function compareJSON(a: string, b: string) {
  const left = JSON.parse(a),
    right = JSON.parse(b);
  // Bound library array-LCS work before comparison; traversal validates size only.
  const stack = [
    { value: left, depth: 0 },
    { value: right, depth: 0 },
  ];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++nodes > 20000 || depth > 100)
      throw new Error("Payload exceeds the structural complexity limit.");
    if (Array.isArray(value) && value.length > 1000)
      throw new Error(
        "Arrays are limited to 1,000 items for responsive comparison.",
      );
    if (value && typeof value === "object")
      for (const child of Object.values(value))
        stack.push({ value: child, depth: depth + 1 });
  }
  const encodedLeft = encode(a),
    encodedRight = encode(b);
  const delta = engine.diff(encodedLeft, encodedRight);
  return {
    left,
    right,
    delta,
    scrollPairs: scrollPairsFromDelta(delta, encodedLeft, encodedRight),
  };
}
export function jsonError(text: string): string | undefined {
  try {
    JSON.parse(text);
    return undefined;
  } catch (error) {
    const message = (error as Error).message;
    const position = /position (\d+)/.exec(message);
    if (!position) return message;
    const before = text.slice(0, Number(position[1]));
    const lines = before.split("\n");
    return `${message} (line ${lines.length}, column ${lines.at(-1)!.length + 1})`;
  }
}
