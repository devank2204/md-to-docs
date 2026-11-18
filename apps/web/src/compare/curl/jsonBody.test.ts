import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectJSONBody } from "./jsonBody";
for (const source of [
  "9007199254740993",
  "1e999",
  "1e-999",
  "0.1234567890123456789",
])
  test(`preserves unsafe numeric body: ${source}`, () => {
    const result = inspectJSONBody(source);
    assert.equal(result.semantic, false);
    assert.equal(result.value, source);
    assert.equal(result.limitation, "unsafe-json-number");
  });
test("safe JSON numbers, primitive roots and null are semantic", () => {
  for (const source of [
    "1.2",
    "1e2",
    "-3",
    "true",
    "null",
    '"9007199254740993"',
    "[1,2]",
  ]) {
    const result = inspectJSONBody(source);
    assert.equal(result.semantic, true);
    assert.deepEqual(result.value, JSON.parse(source));
  }
});
test("duplicate keys follow the existing last-property-wins policy", () => {
  assert.deepEqual(inspectJSONBody('{"a":1,"a":2}').value, { a: 2 });
});
test("untrusted properties and markup remain data", () => {
  const source =
    '{"__proto__":{"polluted":true},"html":"<script>alert(1)</script>"}';
  const result = inspectJSONBody(source);
  assert.equal(result.semantic, true);
  assert.deepEqual(result.value, JSON.parse(source));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
});
test("invalid JSON remains literal body text", () => {
  const source = '{"a":}';
  assert.deepEqual(inspectJSONBody(source), {
    value: source,
    semantic: false,
    limitation: "invalid-json-body",
  });
});
