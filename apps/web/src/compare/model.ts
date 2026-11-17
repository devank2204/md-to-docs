import { create, type Delta } from "jsondiffpatch";
// No inferred object identity: array edits are positional; reorders are add/remove.
const engine = create({ arrays: { detectMove: false } });
export type Change = {
  path: string;
  segments: (string | number)[];
  type: string;
  old?: unknown;
  next?: unknown;
};
export function changesFromDelta(
  delta: Delta,
  path = "$",
  segments: (string | number)[] = [],
): Change[] {
  if (!delta) return [];
  if (Array.isArray(delta))
    return [
      {
        path,
        segments,
        type:
          delta.length === 1
            ? "Added"
            : delta.length === 2
              ? "Modified"
              : "Removed",
        old: delta.length === 1 ? undefined : decode(delta[0]),
        next:
          delta.length === 1
            ? decode(delta[0])
            : delta.length === 2
              ? decode(delta[1])
              : undefined,
      },
    ];
  const array = delta._t === "a";
  return Object.entries(delta).flatMap(([key, value]) =>
    key === "_t" && array
      ? []
      : changesFromDelta(
          value as Delta,
          path +
            (array
              ? `[${key.replace(/^_/, "")}]`
              : /^[A-Za-z_$][\w$]*$/.test(key.slice(1))
                ? `.${key.slice(1)}`
                : `[${JSON.stringify(key.slice(1))}]`),
          [...segments, array ? Number(key.replace(/^_/, "")) : key.slice(1)],
        ),
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
  return { left, right, delta: engine.diff(encode(a), encode(b)) };
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
