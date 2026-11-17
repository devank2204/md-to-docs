import { switchAppearance } from "./action-helpers";
import { test, expect } from "@playwright/test";
for (const width of [320, 390, 1366])
  test(`large JSON stays editable with structural context at ${width}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/json-compare/");
    const original = {
      metadata: {
        version: "1.0",
        owner: "Platform",
        description: "API specification",
      },
      features: { audit: true, streaming: false },
      routes: Array.from({ length: 55 }, (_, index) => ({
        route: `route-${index}`,
        method: "GET",
        timeoutMs: 1000 + index,
        enabled: true,
      })),
    };
    const updated = structuredClone(original);
    updated.metadata.version = "1.1";
    updated.features.streaming = true;
    updated.routes[2].timeoutMs = 3002;
    updated.routes[31].enabled = false;
    updated.routes[54].timeoutMs = 9054;
    const a = JSON.stringify(original, null, 2),
      b = JSON.stringify(updated, null, 2);
    expect(a.split("\n").length).toBeGreaterThan(300);
    for (const [side, value] of [
      ["Original", a],
      ["Updated", b],
    ] as const)
      await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
        name: `${side}.json`,
        mimeType: "application/json",
        buffer: Buffer.from(value),
      });
    await expect(page.locator(".json-inline-status")).toHaveText("5 changes");
    await expect(page.getByRole("tab", { name: /^Changes/ })).toHaveCount(0);
    await page
      .getByRole("button", { name: "Next change", exact: true })
      .click();
    await expect(page.locator(".json-context-bar")).toContainText(
      "$.metadata.version",
    );
    if (width >= 1024) {
      await expect(
        page.getByRole("textbox", { name: "Original", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Updated", exact: true }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: `docs/qa/json-context-${width}-light.png`,
      fullPage: false,
    });
    if (width >= 1024) {
      const editedValue = page
        .getByRole("textbox", { name: "Updated", exact: true })
        .locator('.cm-json-value[title="Modified: $.routes[2].timeoutMs"]');
      await editedValue.scrollIntoViewIfNeeded();
      const y = (await editedValue.boundingBox())!.y;
      await editedValue.dblclick();
      await expect
        .poll(() => page.evaluate(() => getSelection()?.toString()))
        .toBe("3002");
      await expect(page.locator(".json-context-bar")).toContainText(
        "$.routes[2].timeoutMs",
      );
      // Inspecting a value must not move the pane under the pointer mid-edit.
      await expect
        .poll(async () => Math.abs((await editedValue.boundingBox())!.y - y))
        .toBeLessThan(2);
      await expect(
        page
          .getByRole("textbox", { name: "Original", exact: true })
          .locator(".cm-json-value-selected"),
      ).toBeInViewport();
    }
    await page
      .getByRole("combobox", { name: "Jump to JSON change" })
      .selectOption({ label: "~ $.routes[54].timeoutMs" });
    const source = (name: string) =>
      page.getByRole("textbox", { name, exact: true });
    if (width < 1024)
      await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await expect(
      source("Updated").locator(".cm-json-value-selected"),
    ).toHaveText("9054");
    await expect(
      source("Updated")
        .locator(".cm-line")
        .filter({ hasText: '"route": "route-54"' }),
    ).toBeInViewport();
    await expect(
      source("Updated").locator(".cm-json-value-selected"),
    ).toBeInViewport();
    if (width >= 1024) {
      await expect(
        source("Original").locator(".cm-json-value-selected"),
      ).toHaveText("1054");
      await expect(
        source("Original").locator(".cm-json-value-selected"),
      ).toBeInViewport();
    }
    // Capture settled appearance using the supported reduced-motion preference.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await switchAppearance(page, "Dark green");
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "dark",
    );
    await page.screenshot({ path: `docs/qa/json-context-${width}-dark.png` });
    // Edit the selected changed value inside the actual JSON, no separate edit view.
    await source("Updated").locator(".cm-json-value-selected").dblclick();
    await expect
      .poll(() => page.evaluate(() => getSelection()?.toString()))
      .toBe("9054");
    await page.keyboard.insertText("1054");
    await expect(page.locator(".json-inline-status")).toHaveText("4 changes");
    await page.keyboard.press("Control+z");
    await expect(page.locator(".json-inline-status")).toHaveText("5 changes");
    await page
      .getByRole("button", { name: "Copy Updated", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(b);
    if (width < 1024)
      await page.getByRole("tab", { name: "Original", exact: true }).click();
    await page
      .getByRole("button", { name: "Copy Original", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(a);
    await page
      .getByRole("button", { name: "Next change", exact: true })
      .click();
    await page.keyboard.press("F7");
    await expect(page.locator(".json-change-position")).toHaveText("2 of 5");
    await page.keyboard.press("Shift+F7");
    await expect(page.locator(".json-change-position")).toHaveText("1 of 5");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("91 structural changes stay in context across reordered 300-line JSON", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/json-compare/");
  const settings = Object.fromEntries(
    Array.from({ length: 320 }, (_, index) => [
      `option${index}`,
      `value-${index}`,
    ]),
  );
  const nextSettings = { ...settings };
  for (let index = 0; index < 91; index++)
    nextSettings[`option${index * 3 + 2}`] = `updated-${index * 3 + 2}`;
  const a = JSON.stringify({ settings }, null, 2);
  const b = JSON.stringify(
    { settings: Object.fromEntries(Object.entries(nextSettings).reverse()) },
    null,
    2,
  );
  for (const [side, value] of [
    ["Original", a],
    ["Updated", b],
  ] as const)
    await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
      name: `${side}.json`,
      mimeType: "application/json",
      buffer: Buffer.from(value),
    });
  await expect(page.locator(".json-inline-status")).toHaveText("91 changes");
  const jump = page.getByRole("combobox", { name: "Jump to JSON change" });
  await expect(jump.locator("option")).toHaveCount(92);
  await jump.selectOption({ label: "~ $.settings.option272" });
  const old = page
    .getByRole("textbox", { name: "Original", exact: true })
    .locator(".cm-json-value-selected");
  const updated = page
    .getByRole("textbox", { name: "Updated", exact: true })
    .locator(".cm-json-value-selected");
  await expect(old).toHaveText('"value-272"');
  await expect(updated).toHaveText('"updated-272"');
  await expect(old).toBeInViewport();
  await expect(updated).toBeInViewport();
  await expect(page.locator(".json-context-bar")).toContainText(
    "$.settings.option272",
  );
  await expect(page.getByRole("tab", { name: /^Changes/ })).toHaveCount(0);
  await page.screenshot({ path: "docs/qa/json-context-91-changes.png" });
});
