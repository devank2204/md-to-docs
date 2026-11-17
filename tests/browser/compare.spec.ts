import { test, expect } from "@playwright/test";
for (const width of [320, 390, 1440])
  test(`comparison tools at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/text-compare/");
    await expect(
      page.getByRole("heading", { name: "Text Compare", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Try example" }).click();
    await expect(page.locator(".cm-editor").first()).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText(
      "1 difference",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `docs/qa/compare-text-${width}.png`,
      fullPage: true,
    });
    if (width < 768)
      await page.getByRole("button", { name: "Tools", exact: true }).click();
    await page
      .getByRole("link", { name: "JSON Compare", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Try example" }).click();
    await expect(page.getByRole("status").first()).toHaveText("1 change");
    await expect(page.locator(".json-change")).toContainText("$.user.role");
    await page.screenshot({
      path: `docs/qa/compare-json-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Original", exact: true })
      .fill("{");
    await expect(page.getByRole("alert")).toContainText("Original");
  });
test("JSON order, primitive roots and safe values", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/json-compare/");
  const a = page.getByRole("textbox", { name: "Original", exact: true }),
    b = page.getByRole("textbox", { name: "Updated", exact: true });
  for (const [left, right, count] of [
    ['{"a":1,"b":2}', '{"b":2,"a":1}', 0],
    ["null", '"null"', 1],
    ["{}", '{"x":null}', 1],
    ['{"x":"<script>alert(1)</script>"}', "{}", 1],
  ] as const) {
    await a.fill(left);
    await b.fill(right);
    await expect(page.getByRole("status").first()).toHaveText(
      `${count} ${count === 1 ? "change" : "changes"}`,
    );
  }
  expect(await page.locator(".json-change script").count()).toBe(0);
});
test("editing, swap, clear, undo and file import stay local", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/text-compare/");
  await page
    .locator('.cm-content[aria-label="Original"]')
    .fill("private original");
  await page
    .locator('.cm-content[aria-label="Updated"]')
    .fill("private updated");
  await page.getByRole("button", { name: "Swap", exact: true }).click();
  await expect(
    page.locator('.cm-content[aria-label="Original"]'),
  ).toContainText("private updated");
  await page.getByText("More", { exact: true }).click();
  await page.getByRole("button", { name: "Clear both" }).click();
  await expect(page.locator('.cm-content[aria-label="Original"]')).toHaveText(
    "",
  );
  await page.locator('.cm-content[aria-label="Original"]').focus();
  await page.keyboard.press("Control+z");
  await expect(
    page.locator('.cm-content[aria-label="Original"]'),
  ).toContainText("private updated");
  await page.getByLabel("Import Original").setInputFiles({
    name: "revision.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Imported text"),
  });
  await expect(
    page.locator('.cm-content[aria-label="Original"]'),
  ).toContainText("Imported text");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "private updated",
  );
  expect(page.url()).not.toContain("private");
});
test("JSON handoff preserves inputs, key safety and history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/text-compare/");
  const left = '{"__proto__":1,"a.b":"<script>"}',
    right = '{"__proto__":2,"a.b":"<script>"}';
  await page.locator('.cm-content[aria-label="Original"]').focus();
  await page.keyboard.insertText(left);
  await page.locator('.cm-content[aria-label="Updated"]').focus();
  await page.keyboard.insertText(right);
  await page.getByRole("button", { name: "Compare as JSON" }).click();
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText(left);
  await expect(page.getByRole("status").first()).toHaveText("1 change");
  await expect(page.locator(".json-change")).toContainText("$.__proto__");
  await page.goBack();
  await expect(
    page.locator('.cm-content[aria-label="Original"]'),
  ).toContainText(left);
  await page.goForward();
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText(right);
});
test("comparison engines stay deferred on homepage", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(
    requests.some((url) => /TextEditors-|JsonResult-|CompareApp-/.test(url)),
  ).toBe(false);
});
test("ignore projection is read-only and preserves originals", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/text-compare/");
  await page.locator('.cm-content[aria-label="Original"]').focus();
  await page.keyboard.insertText("Hello world");
  await page.locator('.cm-content[aria-label="Updated"]').focus();
  await page.keyboard.insertText("helloworld");
  await page.getByText("Options", { exact: true }).click();
  await page.getByLabel("Ignore case", { exact: true }).check();
  await page.getByLabel("Ignore whitespace", { exact: true }).check();
  await expect(page.getByRole("status").first()).toHaveText("0 differences");
  await expect(page.locator(".cm-content")).toHaveAttribute(
    "contenteditable",
    "false",
  );
  await page.getByLabel("Ignore case", { exact: true }).uncheck();
  await page.getByLabel("Ignore whitespace", { exact: true }).uncheck();
  await expect(page.locator('.cm-content[aria-label="Original"]')).toHaveText(
    "Hello world",
  );
});
test("CRLF import keeps original bytes and copies a standard patch", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/text-compare/");
  await page.getByLabel("Import Original").setInputFiles({
    name: "old.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("old\r\n"),
  });
  await page.getByLabel("Import Updated").setInputFiles({
    name: "new.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("new\r\n"),
  });
  await expect(
    page.getByText("Carriage returns are shown as control characters", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("old\r\n");
  await page.getByText("More", { exact: true }).click();
  await page.getByRole("button", { name: "Copy unified diff" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("--- Original");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("+new");
});
test("line-ending-only changes stay exact in both merge views", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/text-compare/");
  await page.getByLabel("Import Original").setInputFiles({
    name: "old.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("same\r\n"),
  });
  await page.getByLabel("Import Updated").setInputFiles({
    name: "new.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("same\n"),
  });
  await expect(page.getByRole("status").first()).toHaveText("1 difference");
  await page
    .getByLabel("Comparison view", { exact: true })
    .selectOption("unified");
  await expect(page.getByRole("status").first()).toHaveText("1 difference");
});
