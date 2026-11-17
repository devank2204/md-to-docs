import { test, expect } from "@playwright/test";
for (const width of [320, 390])
  test(`mobile search reaches folded source at ${width}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/json-compare/");
    const marker = "PRIVATE_MOBILE_FIND_MARKER";
    const original = Object.fromEntries(
      Array.from({ length: 300 }, (_, i) => [
        `field${i}`,
        i === 270 ? marker : i,
      ]),
    );
    const a = JSON.stringify(original, null, 2),
      b = JSON.stringify({ ...original, field20: 999 }, null, 2);
    for (const [side, text] of [
      ["Original", a],
      ["Updated", b],
    ])
      await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
        name: `${side}.json`,
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(page.locator(".json-inline-status")).toHaveText("1 change");
    await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page
      .getByRole("checkbox", { name: "Changes only", exact: true })
      .check();
    await expect(
      page
        .locator('.json-editors > [data-compare-side="1"] .cm-foldPlaceholder')
        .first(),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Updated", exact: true }).focus();
    await page.keyboard.press("Control+f");
    const panel = page.locator(
      '.json-editors > [data-compare-side="1"] .cm-search',
    );
    await expect(
      panel.getByRole("textbox", { name: "Find", exact: true }),
    ).toHaveCSS("font-size", "16px");
    await expect(
      panel.getByRole("button", { name: "next", exact: true }),
    ).toHaveCSS("font-size", "11px");
    await panel
      .getByRole("textbox", { name: "Find", exact: true })
      .fill(marker);
    await panel
      .getByRole("textbox", { name: "Find", exact: true })
      .press("Tab");
    await panel.getByRole("button", { name: "next", exact: true }).click();
    await expect(
      page.locator(".cm-searchMatch-selected").last(),
    ).toBeInViewport();
    await expect(page.locator(".cm-searchMatch-selected").last()).toHaveText(
      marker,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/qa/compare-search-mobile-${width}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await page
      .getByRole("button", { name: "Copy Updated", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(b);
  });
test("the enlarged empty text pane accepts editing and keeps undo across context folding", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/text-compare/");
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  const pane = page.locator(".cm-editor.cm-merge-a"),
    box = (await pane.boundingBox())!;
  expect(box.height).toBeGreaterThan(500);
  await page.mouse.click(box.x + 90, box.y + box.height - 50);
  await expect(
    page.getByRole("textbox", { name: "Original", exact: true }),
  ).toBeFocused();
  await page.keyboard.insertText("An editable focus pane");
  await page
    .getByRole("checkbox", { name: "Changes only", exact: true })
    .check();
  await page.getByRole("textbox", { name: "Original", exact: true }).focus();
  await page.keyboard.press("Control+z");
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("");
});
