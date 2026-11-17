import { test } from "node:test";
import assert from "node:assert/strict";
import { compareJSON, changesFromDelta, jsonError } from "./model";
import { Chunk } from "@codemirror/merge";
import { Text, EditorState } from "@codemirror/state";
for (const [name, a, b, count] of [
  ["key order", '{"a":1,"b":2}', '{"b":2,"a":1}', 0],
  ["nested", '{"user":{"role":"admin"}}', '{"user":{"role":"editor"}}', 1],
  ["missing/null", "{}", '{"a":null}', 1],
  ["number/string", "5", '"5"', 1],
  ["primitive", "null", "true", 1],
  ["duplicates", '{"a":1,"a":2}', '{"a":2}', 0],
  ["duplicate IDs", '[{"id":1},{"id":1}]', '[{"id":1}]', 1],
  [
    "unusual",
    '{"__proto__":1,"constructor":2,"a.b":3}',
    '{"__proto__":2,"constructor":3,"a.b":4}',
    3,
  ],
  ["array reorder", "[1,2]", "[2,1]", 2],
  ["nested array", '[[{"a":1}]]', '[[{"a":2}]]', 1],
] as const)
  test(name, () =>
    assert.equal(changesFromDelta(compareJSON(a, b).delta).length, count),
  );
test("invalid JSON", () => assert.ok(jsonError("{")));
for (const [name, a, b, count] of [
  ["empty", "", "", 0],
  ["identical", "same", "same", 0],
  ["add", "", "x", 1],
  ["remove", "x", "", 1],
  ["unicode", "😃 café é", "😄 café é", 1],
  ["spaces", "x y", "xy", 1],
  ["case", "A", "a", 1],
  ["long line", "a".repeat(20000), "b".repeat(20000), 1],
] as const)
  test(`text ${name}`, () =>
    assert.equal(
      Chunk.build(Text.of(a.split("\n")), Text.of(b.split("\n")), {
        scanLimit: 500,
        timeout: 50,
      }).length,
      count,
    ));
// Adapted from CodeMirror merge test-chunk.ts, MIT (see THIRD_PARTY_NOTICES).
test("bounded fallback is labelled", () => {
  const head = "---\n".repeat(500);
  const left = EditorState.create({ doc: head + "a\n".repeat(1000) });
  const right = EditorState.create({ doc: "///" + head + "b\n" });
  const chunks = Chunk.build(left.doc, right.doc);
  const transaction = right.update({
    changes: { from: right.doc.length, insert: "b\n".repeat(999) },
  });
  const updated = Chunk.updateB(
    chunks,
    left.doc,
    transaction.newDoc,
    transaction.changes,
    { scanLimit: 100 },
  );
  assert.ok(updated.some((c) => !c.precise));
});
