import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
async function input(page: Page, side: string, text: string) {
  await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
    name: `${side}.sh`,
    mimeType: "text/plain",
    buffer: Buffer.from(text),
  });
}
async function pair(page: Page, a: string, b: string) {
  await input(page, "Original", a);
  await input(page, "Updated", b);
}
test("request sections and JSON bodies stay in one workspace", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  await page.getByRole("button", { name: "Try example", exact: true }).click();
  await expect(page.locator(".curl-status")).toHaveText("3 request changes");
  await page.getByRole("button", { name: "JSON body", exact: true }).click();
  await expect(
    page.locator(".json-editors .cm-json-value-selected").first(),
  ).toHaveText('"admin"');
  await expect(
    page.locator(".json-editors .cm-json-value-selected").last(),
  ).toHaveText('"editor"');
  await expect(page.locator(".curl-inspector")).toContainText("$.user.role");
  await page.screenshot({ path: "docs/qa/curl-body-1366.png" });
  await page.getByRole("button", { name: "Commands", exact: true }).click();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("example-original-token");
  await page
    .getByRole("navigation", { name: "Request sections" })
    .getByRole("button", { name: /Auth & cookies/ })
    .click();
  await expect(page.locator(".curl-change-values")).not.toContainText(
    "example-original-token",
  );
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("checkbox", { name: "Hide auth in details" }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator(".curl-change-values")).toContainText(
    "example-original-token",
  );
  await page.screenshot({ path: "docs/qa/curl-commands-1366.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const [name, method] of [
  ["get_header_with_quotes.sh", "GET"],
  ["get_with_single_header.sh", "GET"],
  ["get_with_header_without_value.sh", "GET"],
  ["post_with_data_raw.sh", "POST"],
  ["post_with_urlencoded_data.sh", "POST"],
  ["post_json.sh", "POST"],
  ["repeated_query_key.sh", "GET"],
  ["get_basic_auth.sh", "GET"],
])
  test(`upstream Bash fixture: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/curl-compare/");
    const command = fs.readFileSync(
      `tests/fixtures/curlconverter/${name}`,
      "utf8",
    );
    await pair(
      page,
      command,
      command + "\n# Same request, different source layout",
    );
    await expect(page.locator(".curl-status")).toHaveText(
      "Compared request fields match",
    );
    await page
      .getByRole("navigation", { name: "Request sections" })
      .getByRole("button", { name: /^Method/ })
      .click();
    await expect(page.locator(".curl-change-values pre").first()).toHaveText(
      JSON.stringify(method),
    );
  });
for (const [name, a, b, count] of [
  [
    "header case and JSON property order",
    `curl https://example.com -H 'X-Test: one' --json '{"a":1,"b":2}'`,
    `curl https://example.com -H 'x-test: one' --json '{"b":2,"a":1}'`,
    0,
  ],
  [
    "repeated header value",
    `curl https://example.com -H 'X-Test: one' -H 'X-Test: two'`,
    `curl https://example.com -H 'x-test: one' -H 'x-test: three'`,
    1,
  ],
  [
    "repeated query value",
    `curl 'https://example.com?a=1&a=2'`,
    `curl 'https://example.com?a=1&a=3'`,
    1,
  ],
  [
    "query ordering",
    `curl 'https://example.com?a=1&a=2'`,
    `curl 'https://example.com?a=2&a=1'`,
    2,
  ],
  [
    "empty versus absent query value",
    `curl 'https://example.com?a'`,
    `curl 'https://example.com?a='`,
    1,
  ],
  [
    "explicit and implicit method",
    `curl https://example.com -d 'hello'`,
    `curl -X POST https://example.com --data-raw 'hello'`,
    0,
  ],
  [
    "case-sensitive method",
    `curl -X post https://example.com`,
    `curl -X POST https://example.com`,
    1,
  ],
  [
    "urlencoded data",
    `curl https://example.com --data-urlencode 'name=hello world'`,
    `curl https://example.com --data-raw 'name=hello+world'`,
    0,
  ],
  [
    "null body versus absent body",
    `curl -X POST https://example.com -H 'Content-Type: application/json'`,
    `curl https://example.com -H 'Content-Type: application/json' --data-raw 'null'`,
    1,
  ],
  [
    "string versus numeric JSON body",
    `curl https://example.com --json '5'`,
    `curl https://example.com --json '"5"'`,
    1,
  ],
  [
    "Bash ANSI quotes and Unicode",
    `curl https://example.com -d $'caf\\u00e9 😀'`,
    `curl https://example.com -d 'café 😀'`,
    0,
  ],
  [
    "multipart literal field",
    `curl https://example.com --form-string 'name=one'`,
    `curl https://example.com --form-string 'name=two'`,
    1,
  ],
] as const)
  test(`request semantics: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/curl-compare/");
    await pair(page, a, b);
    await expect(page.locator(".curl-status")).toHaveText(
      count
        ? `${count} request ${count === 1 ? "change" : "changes"}`
        : "Compared request fields match",
    );
  });
for (const [name, command, message] of [
  [
    "multiple requests",
    "curl https://example.com https://other.example.com",
    "one request URL",
  ],
  ["pipeline", "echo private | curl https://example.com", "Pipelines"],
  [
    "command substitution",
    'curl "https://example.com/$(whoami)"',
    "not evaluated",
  ],
  ["variable", 'curl "$PRIVATE_TOKEN"', "not evaluated"],
  ["assignment", "TOKEN=secret curl https://example.com", "not evaluated"],
  ["broken quotes", "curl 'https://example.com", "Invalid Bash syntax"],
  [
    "PowerShell",
    'curl https://example.com `\n -H "X-Test: two"',
    "Invalid Bash syntax",
  ],
  ["missing option value", "curl https://example.com -H", "requires parameter"],
] as const)
  test(`recoverable unsupported syntax: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/curl-compare/");
    await pair(page, command, "curl https://example.com");
    await expect(page.locator(".curl-messages")).toContainText(message);
    await expect(
      page.getByRole("textbox", { name: "Original", exact: true }),
    ).toHaveText(command);
    await input(page, "Original", "curl https://example.com");
    await expect(page.locator(".curl-status")).toHaveText(
      "Compared request fields match",
    );
  });
for (const [name, command, warning] of [
  [
    "unrepresented option",
    "curl https://example.com --connect-timeout 5",
    "connect-timeout",
  ],
  [
    "file body",
    "curl https://example.com --data-binary '@private.json'",
    "Referenced files",
  ],
  [
    "multipart file",
    "curl https://example.com -F 'file=@private.txt'",
    "Referenced files",
  ],
  [
    "invalid JSON",
    "curl https://example.com --json '{broken'",
    "not valid JSON",
  ],
] as const)
  test(`truthful partial comparison: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/curl-compare/");
    await pair(page, command, command);
    await expect(page.locator(".curl-status")).toContainText(
      "Partial comparison",
    );
    await expect(page.locator(".curl-messages")).toContainText(warning);
    await expect(page.locator(".curl-status")).not.toContainText("match");
  });

test("large JSON numbers do not produce false matches", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  await pair(
    page,
    `curl https://example.com --json '{"id":9007199254740992}'`,
    `curl https://example.com --json '{"id":9007199254740993}'`,
  );
  await expect(page.locator(".curl-status")).toHaveText(
    "1 change in interpreted fields · Partial comparison",
  );
  await expect(page.locator(".curl-messages")).toContainText(
    "lossless comparison precision",
  );
  await expect(
    page.getByRole("button", { name: "JSON body", exact: true }),
  ).toBeDisabled();
});
