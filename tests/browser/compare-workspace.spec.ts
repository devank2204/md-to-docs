import { test, expect, type Page } from "@playwright/test";
async function input(page: Page, name: string, value: unknown) {
  await page.getByRole("textbox", { name, exact: true }).focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(JSON.stringify(value, null, 2));
}
for (const width of [390, 1366])
  test(`JSON edits and structural changes share one workspace at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 768 });
    await page.goto("/json-compare/");
    await expect(
      page.getByText("Add JSON on both sides to begin"),
    ).toBeVisible();
    expect(await page.locator("input[type=file]:visible").count()).toBe(0);
    const original = {
      range_created_at: [
        { op: "GTE", value: "2026-11-01T18:30:00.000Z" },
        { op: "LTE", value: "2026-11-27T18:29:59.999Z" },
      ],
      sorting: [{ field: "created_at", direction: "DESC" }],
    };
    const updated = {
      range_created_at: [original.range_created_at[0]],
      sorting: original.sorting,
    };
    await input(page, "Original", original);
    if (width < 1024)
      await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await input(page, "Updated", updated);
    await expect(page.getByRole("status").first()).toHaveText("1 change");
    await page
      .getByRole("button", { name: "Next change", exact: true })
      .click();
    const change = page.locator(".json-context-bar");
    await expect(change).toContainText("Removed");
    await expect(change.locator(".json-context-old")).toContainText("LTE");
    await expect(change.locator(".json-context-new")).toHaveText(
      /Not present in Updated/,
    );
    await expect(change).toContainText("$.range_created_at[1]");
    if (width < 1024)
      await page.getByRole("tab", { name: "Original", exact: true }).click();
    const originalEditor = page.getByRole("textbox", {
      name: "Original",
      exact: true,
    });
    await expect(originalEditor).toBeVisible();
    await expect(
      originalEditor.locator(".cm-json-value").filter({ hasText: "LTE" }),
    ).toBeVisible();
    if (width >= 1024) {
      await expect(
        page.getByRole("textbox", { name: "Updated", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('[data-compare-side="1"] .cm-json-value'),
      ).toHaveCount(0);
      await expect(
        page.locator('[data-compare-side="1"] .cm-json-missing-anchor'),
      ).toBeVisible();
    }
    await expect(page.getByRole("tab", { name: /^Changes/ })).toHaveCount(0);
    await expect(page.locator(".compare-guidance")).not.toHaveAttribute(
      "open",
      "",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/qa/compare-json-review-${width}.png`,
      fullPage: true,
    });
  });
test("per-side JSON actions and file drop preserve source", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/json-compare/");
  await page.getByLabel("Import Original", { exact: true }).setInputFiles({
    name: "original.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"x":1}'),
  });
  await page.getByLabel("Import Updated", { exact: true }).setInputFiles({
    name: "updated.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"x":2}'),
  });
  await expect(page.getByRole("status").first()).toHaveText("1 change");
  await page
    .getByRole("button", { name: "Format Original", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('{\n  "x": 1\n}');
  await page
    .locator('.json-editors>[data-compare-side="1"]')
    .evaluate((element) => {
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(['{"x":3}'], "dropped.json", { type: "application/json" }),
      );
      element.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    });
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText('{"x":3}');
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toContainText("1");
  await page.getByRole("button", { name: "Next change", exact: true }).click();
  await expect(page.locator(".json-context-new")).toContainText("3");
});
