import { test, expect, type Page } from "@playwright/test";
import { switchAppearance } from "./action-helpers";
async function input(page: Page, side: string, text: string) {
  await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
    name: `${side}.txt`,
    mimeType: "text/plain",
    buffer: Buffer.from(text),
  });
}
for (const width of [320, 390, 1366])
  test(`focus workspace gives JSON more room and restores the normal layout at ${width}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/json-compare/");
    const a = JSON.stringify(
      Object.fromEntries(
        Array.from({ length: 300 }, (_, i) => [`field${i}`, i]),
      ),
      null,
      2,
    );
    const b = a.replace('"field140": 140', '"field140": 999');
    await input(page, "Original", a);
    await input(page, "Updated", b);
    await expect(page.locator(".json-inline-status")).toHaveText("1 change");
    const editor = page.locator(".json-editors .cm-editor").first();
    const before = (await editor.boundingBox())!.height;
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await expect(page.locator(".compare-app")).toHaveAttribute(
      "data-focus",
      "true",
    );
    await expect
      .poll(async () => (await editor.boundingBox())!.height)
      .toBeGreaterThan(before + (width < 1024 ? 20 : 100));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    if (width >= 1024)
      await expect(page.locator(".compare-sidebar")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Swap", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Next change", exact: true })
      .click();
    const visibleSide = width < 1024 ? 0 : 1;
    await expect(
      page.locator(
        `.json-editors > [data-compare-side="${visibleSide}"] .cm-json-value-selected`,
      ),
    ).toBeInViewport();
    if (width >= 1024) {
      await expect
        .poll(async () => {
          const nodes = await page
            .locator(".json-editors .cm-json-value-selected")
            .all();
          const bounds = await Promise.all(
            nodes.map((node) => node.boundingBox()),
          );
          return Math.abs(bounds[0]!.y - bounds[1]!.y);
        })
        .toBeLessThan(3);
    }
    await switchAppearance(page, "Black");
    await page.screenshot({ path: `docs/qa/compare-focus-${width}.png` });
    await page
      .getByRole("button", { name: "Copy Original", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(a);
    await page.keyboard.press("Escape");
    await expect(page.locator(".compare-app")).toHaveAttribute(
      "data-focus",
      "false",
    );
    if (width >= 1024)
      await expect(page.locator(".compare-sidebar")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "JSON Compare", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
for (const tool of ["json", "text"])
  test(`native search reaches hidden unchanged ${tool} source without rewriting it`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/${tool}-compare/`);
    const marker = "PRIVATE_FIND_MARKER_299";
    let a: string, b: string;
    if (tool === "json") {
      const value = Object.fromEntries(
        Array.from({ length: 300 }, (_, i) => [
          `field${i}`,
          i === 290 ? marker : i,
        ]),
      );
      a = JSON.stringify(value, null, 2);
      b = JSON.stringify({ ...value, field20: 900, field230: 901 }, null, 2);
    } else {
      a = Array.from({ length: 300 }, (_, i) =>
        i === 290 ? marker : `Line ${i}`,
      ).join("\n");
      b = a
        .replace("Line 20\n", "Changed 20\n")
        .replace("Line 230\n", "Changed 230\n");
    }
    await input(page, "Original", a);
    await input(page, "Updated", b);
    await expect(
      page.getByRole("button", { name: "Find in Updated", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page
      .getByRole("checkbox", { name: "Changes only", exact: true })
      .check();
    await expect(
      page
        .locator(tool === "json" ? ".cm-foldPlaceholder" : ".cm-collapsedLines")
        .first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Find in Updated", exact: true })
      .click();
    const panel = page.locator(".cm-search").last();
    await panel
      .getByRole("textbox", { name: "Find", exact: true })
      .fill(marker);
    await panel
      .getByRole("textbox", { name: "Find", exact: true })
      .press("Tab");
    await panel.getByRole("button", { name: "next", exact: true }).click();
    await expect(page.locator(".cm-searchMatch-selected").last()).toHaveText(
      marker,
    );
    await expect(
      page.locator(".cm-searchMatch-selected").last(),
    ).toBeInViewport();
    await page.screenshot({ path: `docs/qa/compare-search-${tool}.png` });
    await page.keyboard.press("Escape");
    await expect(page.locator(".cm-search")).toHaveCount(0);
    await expect(page.locator(".compare-app")).toHaveAttribute(
      "data-focus",
      "true",
    );
    await page
      .getByRole("button", { name: "Copy Updated", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(b);
    expect(
      await page.evaluate(() => JSON.stringify(localStorage)),
    ).not.toContain(marker);
    expect(page.url()).not.toContain(marker);
  });
for (const tool of ["json", "text"])
  test(`pane resizing is keyboard and pointer operable for ${tool}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${tool}-compare/`);
    const a = tool === "json" ? '{"source":"original"}' : "Original source";
    await input(page, "Original", a);
    await input(
      page,
      "Updated",
      tool === "json" ? '{"source":"updated"}' : "Updated source",
    );
    const separator = page.getByRole("separator", {
      name: "Resize comparison panes",
      exact: true,
    });
    const first = page.locator(".compare-editors .cm-editor").first(),
      before = (await first.boundingBox())!.width;
    await separator.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(separator).toHaveAttribute("aria-valuenow", "60");
    expect((await first.boundingBox())!.width).toBeGreaterThan(before + 70);
    const box = (await separator.boundingBox())!,
      stage = (await page.locator(".compare-editor-stage").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(stage.x + stage.width * 0.35, box.y + 40);
    await page.mouse.up();
    await expect(separator).toHaveAttribute("aria-valuenow", "35");
    await page
      .getByRole("button", { name: "Copy Original", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(a);
    await separator.focus();
    await page.keyboard.press("Home");
    await expect(separator).toHaveAttribute("aria-valuenow", "25");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("noise and type filters show honest counts and restore all source highlights", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/json-compare/");
  const a = JSON.stringify(
    { meta: { requestId: "private-before" }, role: "admin", removed: true },
    null,
    2,
  );
  const b = JSON.stringify(
    { meta: { requestId: "private-after" }, role: "editor" },
    null,
    2,
  );
  await input(page, "Original", a);
  await input(page, "Updated", b);
  await expect(page.locator(".json-inline-status")).toHaveText("3 changes");
  await page
    .getByRole("combobox", { name: "Jump to JSON change" })
    .selectOption({ label: "~ $.meta.requestId" });
  await page.getByRole("button", { name: "Ignore field", exact: true }).click();
  await expect(page.locator(".json-inline-status")).toHaveText(
    "2 of 3 changes",
  );
  await expect(page.locator(".json-excluded-count")).toHaveText("1 excluded");
  await expect(
    page.getByRole("button", { name: "Include $.meta.requestId", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Filters: active", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Modified", exact: true }).uncheck();
  await expect(page.locator(".json-inline-status")).toHaveText(
    "1 of 3 changes",
  );
  await page.getByRole("checkbox", { name: "Removed", exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Filters: active", exact: true })
    .click();
  await expect(page.locator(".json-inline-status")).toHaveText(
    "0 of 3 changes",
  );
  await expect(
    page.getByText("JSON values match", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Next change", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".cm-json-value")).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "Changes only", exact: true })
    .check();
  await page.screenshot({ path: "docs/qa/compare-filtered-empty.png" });
  await page
    .locator(".json-active-filters")
    .getByRole("button", { name: "Show all changes", exact: true })
    .click();
  await expect(page.locator(".json-inline-status")).toHaveText("3 changes");
  await page
    .getByRole("checkbox", { name: "Changes only", exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(a);
  await expect(page.locator(".cm-json-value").first()).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "private-before",
  );
});
