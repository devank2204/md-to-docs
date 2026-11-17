import { test, expect, type Page } from "@playwright/test";
async function input(page: Page, name: string, value: unknown) {
  await page.getByRole("textbox", { name, exact: true }).focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(JSON.stringify(value, null, 2));
}
for (const width of [390, 1366])
  test(`JSON workspace review at ${width}`, async ({ page }) => {
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
    if (width < 768)
      await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await input(page, "Updated", updated);
    await expect(page.getByRole("status").first()).toHaveText("1 change");
    const change = page.locator(".json-change");
    await expect(change).toContainText("Removed");
    await expect(change.locator(".json-old")).toContainText("LTE");
    await expect(change.locator(".json-new")).toHaveText(/Not present/);
    await expect(change).toContainText("$.range_created_at[1]");
    await expect(page.locator(".compare-guidance")).not.toHaveAttribute(
      "open",
      "",
    );
    if (width > 768) {
      const bounds = await change.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(768);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/qa/compare-json-review-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Next change", exact: true })
      .click();
    await expect(change.locator(".json-context")).toBeVisible();
    await expect(change.locator(".json-context")).toContainText(
      "Parent payload context",
    );
    if (width < 768) {
      await page.getByRole("tab", { name: "Original", exact: true }).click();
      await expect(
        page.getByRole("textbox", { name: "Original", exact: true }),
      ).toContainText("LTE");
    }
  });
test("per-side JSON actions and file drop preserve source", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/json-compare/");
  await page
    .getByLabel("Import Original", { exact: true })
    .setInputFiles({
      name: "original.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"x":1}'),
    });
  await page
    .getByLabel("Import Updated", { exact: true })
    .setInputFiles({
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
  await expect(page.locator(".json-new")).toContainText("3");
});
