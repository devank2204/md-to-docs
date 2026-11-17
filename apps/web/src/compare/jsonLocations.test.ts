import { test } from "node:test";
import assert from "node:assert/strict";
import { compareJSON, changesFromDelta } from "./model";
import { locateChanges, sourceLocations } from "./jsonLocations";
const fixtures = [
  [
    "reordered properties",
    '{"user":{"role":"admin","id":5},"active":true}',
    '{"active":true,"user":{"id":5,"role":"editor"}}',
  ],
  [
    "array removal shifts modified item",
    '[1,{"value":"old"},3]',
    '[{"value":"new"},3]',
  ],
  [
    "array insertion shifts modified item",
    '[{"value":"old"},3]',
    '[1,{"value":"new"},3]',
  ],
  [
    "nested array shift and addition",
    '[[1,{"x":1}]]',
    '[[{"x":2,"new":true}]]',
  ],
  [
    "nested array shift and removal",
    '[[1,{"x":1,"gone":true}]]',
    '[[{"x":2}]]',
  ],
  ["null and missing", '{"keep":null,"gone":null}', '{"keep":null,"new":null}'],
  ["duplicate keys", '{"a":0,"a":1}', '{"a":2,"a":3}'],
  [
    "unsafe keys and strings",
    '{"__proto__":"<script>","a.b":{"\\u0061":"é😃"}}',
    '{"__proto__":"<img onerror=alert(1)>","a.b":{"a":"é😄"}}',
  ],
  ["primitive root", "null", '"null"'],
  ["root type change", "[1,2]", '{"a":1}'],
  ["array reordering", "[1,2,3]", "[3,2,1]"],
] as const;
for (const [name, a, b] of fixtures)
  test(`source coordinates: ${name}`, () => {
    const { delta, left } = compareJSON(a, b),
      changes = changesFromDelta(delta, left);
    assert.ok(changes.length);
    for (const side of [0, 1] as const) {
      const source = side ? b : a;
      const ranges = locateChanges(source, changes, side);
      assert.equal(ranges.length, changes.length);
      for (const range of ranges) {
        const change = changes[range.index],
          value = side ? change.next : change.old;
        if (value === undefined) {
          assert.equal(range.present, false);
          assert.equal(range.from, range.to);
        } else {
          assert.equal(range.present, true, `${change.path} on side ${side}`);
          assert.deepEqual(
            JSON.parse(source.slice(range.valueFrom, range.valueTo)),
            value,
            `${change.path} on side ${side}`,
          );
        }
      }
    }
  });
test("duplicate key location is the final occurrence", () => {
  const text = '{"a":0, "a":12}';
  const range = sourceLocations(text).get('["a"]')!;
  assert.equal(text.slice(range.valueFrom, range.valueTo), "12");
});
test("300 line payload maps end-of-file changes without normalized offsets", () => {
  const original = Object.fromEntries(
    Array.from({ length: 300 }, (_, i) => [`field${i}`, i]),
  );
  const updated = { ...original, field299: 999 };
  const a = JSON.stringify(original, null, 2),
    b = JSON.stringify(updated, null, 4);
  const { delta, left } = compareJSON(a, b),
    changes = changesFromDelta(delta, left);
  assert.equal(changes.length, 1);
  const old = locateChanges(a, changes, 0)[0],
    next = locateChanges(b, changes, 1)[0];
  assert.equal(a.slice(old.valueFrom, old.valueTo), "299");
  assert.equal(b.slice(next.valueFrom, next.valueTo), "999");
  assert.equal(a.slice(0, old.from).split("\n").length, 301);
});

test("upstream array delta indices map a shifted nested modification to both sources", () => {
  // Documented delta conventions: removal indices refer to Original; nested
  // modification indices refer to Updated, after that removal.
  const changes = changesFromDelta(
    { _t: "a", _0: [0, 0, 0], 0: { $x: [1, 2] } },
    [0, { x: 1 }],
  );
  const modified = changes.find((change) => change.type === "Modified")!;
  assert.deepEqual(modified.originalSegments, [1, "x"]);
  assert.deepEqual(modified.updatedSegments, [0, "x"]);
  assert.equal(modified.originalPath, "$[1].x");
  assert.equal(modified.updatedPath, "$[0].x");
});
