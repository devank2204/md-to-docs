import { test } from "node:test";
import assert from "node:assert/strict";
import { compareJSON, changesFromDelta } from "./model";
import { changeTypes, visibleJSONChanges } from "./jsonFilters";
import { locateChanges } from "./jsonLocations";
import { outsideJSONContextRanges } from "./jsonFolding";
import { Text } from "@codemirror/state";
const getChanges = (a: string, b: string) => {
  const { delta, left } = compareJSON(a, b);
  return changesFromDelta(delta, left);
};
test("ignoring a field filters presentation while retaining the complete delta", () => {
  const all = getChanges(
    '{"meta":{"requestId":"a"},"role":"admin","removed":1}',
    '{"meta":{"requestId":"b"},"role":"editor","new":null}',
  );
  const visible = visibleJSONChanges(all, changeTypes, [
    { path: "$.meta.requestId", segments: ["meta", "requestId"] },
  ]);
  assert.equal(all.length, 4);
  assert.equal(visible.length, 3);
  assert.equal(
    all.find((change) => change.path === "$.meta.requestId")?.old,
    "a",
  );
  assert.ok(visible.every((change) => change.path !== "$.meta.requestId"));
});
test("type filters and excluded paths combine without hiding a parent replacement", () => {
  const all = getChanges(
    '{"meta":{"requestId":"a"},"gone":1}',
    '{"meta":{"requestId":"b"},"new":true}',
  );
  assert.equal(visibleJSONChanges(all, ["Added"], [])[0].path, "$.new");
  assert.equal(visibleJSONChanges(all, [], []).length, 0);
  const parent = getChanges('{"meta":{"requestId":"a","important":1}}', "{}");
  assert.equal(
    visibleJSONChanges(parent, changeTypes, [
      { path: "$.meta.requestId", segments: ["meta", "requestId"] },
    ]).length,
    1,
  );
});
test("paths are exact typed segments, including hostile keys and dotted names", () => {
  const all = getChanges(
    '{"a.b":0,"a":{"b":0},"__proto__":0,"0":0}',
    '{"a.b":1,"a":{"b":1},"__proto__":1,"0":1}',
  );
  const visible = visibleJSONChanges(all, changeTypes, [
    { path: '$["a.b"]', segments: ["a.b"] },
    { path: "$.__proto__", segments: ["__proto__"] },
    { path: "$[0]", segments: [0] },
  ]);
  assert.deepEqual(
    visible.map((change) => change.path).sort(),
    ['$["0"]', "$.a.b"].sort(),
  );
});
test("changes-only ranges never cover actual changes or their context", () => {
  const left = Object.fromEntries(
    Array.from({ length: 300 }, (_, i) => [`field${i}`, i]),
  );
  const right = { ...left, field40: 900, field260: 901 };
  const a = JSON.stringify(left, null, 2),
    b = JSON.stringify(right, null, 4),
    all = getChanges(a, b);
  for (const [side, source] of [
    [0, a],
    [1, b],
  ] as const) {
    const doc = Text.of(source.split("\n")),
      locations = locateChanges(source, all, side),
      ranges = outsideJSONContextRanges(doc, locations);
    assert.ok(ranges.length >= 2);
    for (const location of locations) {
      const line = doc.lineAt(location.from).number;
      for (const range of ranges) {
        assert.ok(range.from < range.to);
        assert.ok(
          doc.lineAt(range.to).number < line - 3 ||
            doc.lineAt(range.from).number >= line + 3,
        );
      }
    }
    assert.equal(doc.toString(), source);
  }
});
test("no matching changes still leaves JSON boundaries and an expandable middle", () => {
  const doc = Text.of(Array.from({ length: 120 }, (_, i) => String(i)));
  const ranges = outsideJSONContextRanges(doc, []);
  assert.equal(ranges.length, 1);
  assert.equal(doc.lineAt(ranges[0].from).number, 3);
  assert.equal(doc.lineAt(ranges[0].to).number, 117);
});
test("short and primitive documents do not produce invalid fold ranges", () => {
  for (const source of ["", "null", '{"a":1}', "[1,2,3]"])
    assert.deepEqual(
      outsideJSONContextRanges(Text.of(source.split("\n")), []),
      [],
    );
});
