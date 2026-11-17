import { test, expect, type Page } from "@playwright/test";
async function write(page: Page, name: string, text: string) {
  await page.getByRole("textbox", { name, exact: true }).focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(text);
}
for (const width of [320, 390, 900, 1366])
  test(`appearance is grouped at the right and preserves inputs at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/json-compare/");
    const toggle = page.getByRole("button", {
      name: "Switch to dark appearance",
      exact: true,
    });
    const controls = page.locator(".compare-header-actions");
    const box = await controls.boundingBox();
    expect(box!.x).toBeGreaterThan(width * 0.55);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    const center = await controls.evaluate((node) => {
      const button = node.querySelector("button")!.getBoundingClientRect(),
        tools = node.querySelector("summary")!.getBoundingClientRect();
      return Math.abs(
        button.y + button.height / 2 - (tools.y + tools.height / 2),
      );
    });
    expect(center).toBeLessThan(1);
    if (width >= 1024) {
      const dock = await page
        .getByRole("button", { name: "Toggle sidebar", exact: true })
        .boundingBox();
      expect(dock!.x + dock!.width).toBeLessThanOrEqual(248);
      const before = (await page.locator(".compare-main").boundingBox())!.x;
      await page
        .getByRole("button", { name: "Toggle sidebar", exact: true })
        .click();
      await expect(page.locator(".compare-sidebar")).toBeHidden();
      expect(
        (await page.locator(".compare-main").boundingBox())!.x,
      ).toBeLessThan(before);
      await page
        .getByRole("button", { name: "Toggle sidebar", exact: true })
        .click();
      await expect(page.locator(".compare-sidebar")).toBeVisible();
    }
    await page.screenshot({
      path: `docs/qa/compare-empty-${width}.png`,
      fullPage: true,
    });
    await write(
      page,
      "Original",
      '{"project":"private-ui-probe","active":true}',
    );
    if (width < 1024)
      await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await write(
      page,
      "Updated",
      '{"project":"private-ui-probe","active":false}',
    );
    await expect(
      page.getByRole("button", { name: "Review changes", exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `docs/qa/compare-inputs-light-${width}.png`,
      fullPage: true,
    });
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "dark",
    );
    await expect(
      page.getByRole("textbox", { name: "Updated", exact: true }),
    ).toContainText("false");
    await expect
      .poll(() =>
        page
          .locator(".json-editors .cm-editor")
          .first()
          .evaluate((node) => getComputedStyle(node).backgroundColor),
      )
      .not.toBe("rgb(255, 255, 255)");
    await page.screenshot({
      path: `docs/qa/compare-inputs-dark-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Review changes", exact: true })
      .click();
    await expect(page.locator(".json-change")).toContainText("$.active");
    const previous = await page
        .getByRole("button", { name: "Previous change", exact: true })
        .boundingBox(),
      next = await page
        .getByRole("button", { name: "Next change", exact: true })
        .boundingBox();
    expect(Math.abs(previous!.y - next!.y)).toBeLessThan(1);
    await page.screenshot({
      path: `docs/qa/compare-review-dark-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Switch to light appearance", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "cream",
    );
    await page
      .getByRole("tab", {
        name: width < 1024 ? "Updated" : "Inputs",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Updated", exact: true }),
    ).toHaveText('{"project":"private-ui-probe","active":false}');
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain("private-ui-probe");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("validation controls review and edits survive switching views", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/json-compare/");
  await expect(
    page.getByRole("tab", { name: "Changes", exact: true }),
  ).toBeDisabled();
  const initialTop = (await page.locator(".json-editors").boundingBox())!.y;
  await write(page, "Original", '{"role":');
  await write(page, "Updated", '{"role":"editor"}');
  await expect(page.getByRole("alert")).toContainText("Original");
  expect(
    Math.abs(
      (await page.locator(".json-editors").boundingBox())!.y - initialTop,
    ),
  ).toBeLessThan(1);
  await expect(
    page.getByRole("tab", { name: "Changes", exact: true }),
  ).toBeDisabled();
  await write(page, "Original", '{"role":"admin"}');
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toBeHidden();
  await page.locator(".json-path").click();
  await expect(page.locator(".json-context")).toContainText("admin");
  await page.getByRole("tab", { name: "Inputs", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText('{"role":"admin"}');
  await write(page, "Updated", '{"role":"admin"}');
  await page
    .getByRole("button", { name: "Review comparison", exact: true })
    .click();
  await expect(
    page.getByText("JSON values match", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".json-change")).toHaveCount(0);
});
for (const width of [390, 1366])
  test(`text navigation follows actual chunks with F7 at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/text-compare/");
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    const original = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join(
      "\n",
    );
    const lines = original.split("\n");
    lines[4] = "First revision";
    lines[34] = "Second revision";
    await page.getByLabel("Import Original", { exact: true }).setInputFiles({
      name: "original.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(original),
    });
    await page.getByLabel("Import Updated", { exact: true }).setInputFiles({
      name: "updated.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(lines.join("\n")),
    });
    await expect(page.getByRole("status").first()).toHaveText("2 differences");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    if (width < 1024)
      await expect(
        page.getByRole("tab", { name: "Unified", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".compare-current-change")).toHaveText("1 of 2");
    await page.keyboard.press("F7");
    await expect(page.locator(".compare-current-change")).toHaveText("2 of 2");
    if (width >= 1024) {
      const originalLine = page
        .getByRole("textbox", { name: "Original", exact: true })
        .locator(".cm-line")
        .filter({ hasText: /^Line 35$/ });
      const updatedLine = page
        .getByRole("textbox", { name: "Updated", exact: true })
        .locator(".cm-line")
        .filter({ hasText: /^Second revision$/ });
      await expect(originalLine).toBeVisible();
      await expect(updatedLine).toBeVisible();
      await expect
        .poll(async () =>
          Math.abs(
            (await originalLine.boundingBox())!.y -
              (await updatedLine.boundingBox())!.y,
          ),
        )
        .toBeLessThan(2);
    }

    await page.keyboard.press("Shift+F7");
    await expect(page.locator(".compare-current-change")).toHaveText("1 of 2");
  });
test("guided paste is explicit and tool navigation creates one history entry", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto("/text-compare/");
  await page.evaluate(() =>
    navigator.clipboard.writeText("Original private draft"),
  );
  await page
    .getByRole("button", { name: "Paste Original from clipboard", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText("Original private draft");
  await page
    .getByRole("link", { name: "JSON Compare", exact: true })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("JSON Compare");
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Text Compare");
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText("Original private draft");
});
test("large payload remains copyable and cannot leave a stale successful comparison", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto("/json-compare/");
  await write(page, "Original", '{"x":1}');
  await write(page, "Updated", '{"x":2}');
  await expect(
    page.getByRole("button", { name: "Review changes", exact: true }),
  ).toBeEnabled();
  const large = JSON.stringify({ text: "a".repeat(200001) });
  await page.getByLabel("Import Original", { exact: true }).setInputFiles({
    name: "large.json",
    mimeType: "application/json",
    buffer: Buffer.from(large),
  });
  await expect(page.getByRole("alert")).toContainText("200,000");
  await expect(
    page.getByRole("tab", { name: "Changes", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.clipboard.readText()).length),
    )
    .toBe(large.length);
  await page.getByLabel("Import Original", { exact: true }).setInputFiles({
    name: "restored.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"x":2}'),
  });
  await page
    .getByRole("button", { name: "Review comparison", exact: true })
    .click();
  await expect(
    page.getByText("JSON values match", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".json-change")).toHaveCount(0);
});
test("slow editor loading reserves space and preserves an early explicit paste", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 800 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/TextEditors-*.js", async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto("/text-compare/");
    await expect(page.getByRole("status").first()).toHaveText(
      "Preparing comparison…",
    );
    const region = await page.locator(".compare-editor-stage").boundingBox();
    expect(region!.height).toBeGreaterThanOrEqual(320);
    await page.evaluate(() =>
      navigator.clipboard.writeText("Early private draft"),
    );
    await page
      .getByRole("button", {
        name: "Paste Original from clipboard",
        exact: true,
      })
      .click();
    release();
    await expect(
      page.getByRole("textbox", { name: "Original", exact: true }),
    ).toHaveText("Early private draft");
    await expect(page.getByRole("status").first()).toHaveText("1 difference");
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain("Early private draft");
  } finally {
    release();
  }
});
test("resizing keeps source tabs and desktop comparison in sync", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/text-compare/");
  await page.getByLabel("Import Original", { exact: true }).setInputFiles({
    name: "original.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("original"),
  });
  await page.getByLabel("Import Updated", { exact: true }).setInputFiles({
    name: "updated.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("updated"),
  });
  await page.getByRole("tab", { name: "Updated", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText("updated");
  await page.setViewportSize({ width: 1366, height: 800 });
  await expect(
    page.getByRole("tab", { name: "Side by side", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText("original");
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText("updated");
  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.locator(".compare-sidebar")).toBeHidden();
  await expect(
    page.getByRole("tab", { name: "Updated", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText("updated");
});
test("the whole empty text pane accepts click-to-type", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto("/text-compare/");
  await expect(page.getByRole("status").first()).toHaveText("0 differences");
  const pane = await page.locator(".cm-mergeViewEditor").first().boundingBox();
  expect(pane!.height).toBeGreaterThanOrEqual(320);
  await page.mouse.click(pane!.x + 70, pane!.y + 100);
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toBeFocused();
  await page.keyboard.insertText("Clicked into the original pane");
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toHaveText("Clicked into the original pane");
});
