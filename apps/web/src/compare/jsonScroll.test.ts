import { test } from "node:test";
import assert from "node:assert/strict";
import { compareJSON } from "./model";
import { scrollAnchors } from "./jsonScroll";
for (const [name, a, b] of [
  ["reordered keys", '{"a":1,"b":2}', '{"b":2,"a":1}'],
  ["array insertion", "[1,2,3]", "[0,1,2,3]"],
  ["array deletion", "[0,1,2,3]", "[1,2,3]"],
  ["nested unchanged array shift", "[[1,2],9]", "[0,[1,2],9]"],
  [
    "unsafe property names",
    '{"__proto__":1,"constructor":2}',
    '{"constructor":2,"__proto__":1}',
  ],
  ["repeated array values", "[1,1,2]", "[1,2]"],
] as const)
  test(`scroll correspondence: ${name}`, () => {
    const { scrollPairs } = compareJSON(a, b);
    const anchors = scrollAnchors(a, b, scrollPairs);
    assert.ok(anchors[0].length > 1);
    for (const pair of scrollPairs) {
      const get = (text: string, path: (string | number)[]) =>
        path.reduce<unknown>(
          (value, key) => (value as Record<string, unknown>)[key],
          JSON.parse(text),
        );
      // These fixtures have unchanged paired leaves; parent containers can
      // contain insertions/removals. No guessed IDs or
      // source offsets based on normalized/pretty-printed strings are allowed.
      const value = get(a, pair.original);
      if (value === null || typeof value !== "object")
        assert.deepEqual(value, get(b, pair.updated));
    }
  });
test("array inserts preserve old/new index correspondence for scrolling", () => {
  const { scrollPairs } = compareJSON("[1,2,3]", "[0,1,2,3]");
  assert.deepEqual(
    scrollPairs.find((pair) => JSON.stringify(pair.original) === "[1]")
      ?.updated,
    [2],
  );
});
