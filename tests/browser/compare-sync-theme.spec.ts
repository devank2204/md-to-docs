import { test, expect, type Page } from "@playwright/test";
import { switchAppearance } from "./action-helpers";
async function importJSON(page: Page, side: string, value: string) {
  await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
    name: `${side}.json`,
    mimeType: "application/json",
    buffer: Buffer.from(value),
  });
}
test("JSON scroll follows fields in either direction, and can be unlocked", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/json-compare/");
  const fields = Object.fromEntries(
    Array.from({ length: 350 }, (_, i) => [`field${i}`, i]),
  );
  const a = JSON.stringify({ payload: fields }, null, 2);
  const b = JSON.stringify(
    {
      inserted: Array.from({ length: 40 }, (_, i) => i),
      payload: { ...fields, field300: 999 },
    },
    null,
    4,
  );
  await importJSON(page, "Original", a);
  await importJSON(page, "Updated", b);
  await expect(page.locator(".json-inline-status")).toHaveText("2 changes");
  const sync = page.getByRole("button", { name: "Sync scroll", exact: true });
  await expect(sync).toHaveAttribute("aria-pressed", "true");
  const pane = (side: number) =>
    page.locator(`.json-editors > [data-compare-side="${side}"] .cm-scroller`);
  const top = (side: number) => pane(side).evaluate((node) => node.scrollTop);
  const aligned = async (leader: number) => {
    const field = await pane(leader).evaluate((node) => {
      const box = node.getBoundingClientRect();
      const candidates = Array.from(node.querySelectorAll(".cm-line")).filter(
        (line) => {
          const r = line.getBoundingClientRect();
          return (
            r.y > box.y + 35 &&
            r.bottom < box.bottom - 35 &&
            /"field\d+"/.test(line.textContent ?? "")
          );
        },
      );
      const line = candidates[Math.floor(candidates.length / 2)];
      return /"(field\d+)"/.exec(line?.textContent ?? "")?.[1];
    });
    if (!field) return false;
    const lines = [0, 1].map((side) =>
      pane(side)
        .locator(".cm-line")
        .filter({ hasText: new RegExp(`"${field}":`) }),
    );
    const boxes = await Promise.all(lines.map((line) => line.boundingBox()));
    return boxes.every(Boolean) && Math.abs(boxes[0]!.y - boxes[1]!.y) < 3;
  };
  await pane(0).hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => top(0)).toBeGreaterThan(900);
  await expect.poll(() => aligned(0)).toBe(true);
  expect((await top(1)) - (await top(0))).toBeGreaterThan(400);
  await pane(1).hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => aligned(1)).toBe(true);
  await sync.click();
  await expect(sync).toHaveAttribute("aria-pressed", "false");
  const stopped = await top(1),
    previous = await top(0);
  await pane(0).hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => top(0)).toBeGreaterThan(previous + 300);
  expect(Math.abs((await top(1)) - stopped)).toBeLessThan(2);
  await sync.click();
  await pane(0).hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => aligned(0)).toBe(true);
  await page
    .getByRole("combobox", { name: "Jump to JSON change" })
    .selectOption({ label: "~ $.payload.field300" });
  for (const side of [0, 1])
    await expect(
      pane(side).locator(".cm-json-value-selected"),
    ).toBeInViewport();
  await page.screenshot({ path: "docs/qa/compare-sync-fields.png" });
});
for (const width of [320, 390, 1366])
  test(`three appearances preserve source and persist at ${width}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/json-compare/");
    await importJSON(page, "Original", '{"private":"source","value":1}');
    await importJSON(page, "Updated", '{"private":"source","value":2}');
    await expect(page.locator(".json-inline-status")).toHaveText("1 change");
    for (const [label, appearance, color] of [
      ["Dark green", "dark", "rgb(20, 22, 20)"],
      ["Black", "black", "rgb(0, 0, 0)"],
      ["Cream", "cream", "rgb(250, 249, 246)"],
    ] as const) {
      await switchAppearance(page, label);
      await expect(page.locator("html")).toHaveAttribute(
        "data-appearance",
        appearance,
      );
      await expect(page.locator(".compare-header")).toHaveCSS(
        "background-color",
        color,
      );
      if (appearance === "black") {
        await expect(
          page.locator(".json-editors .cm-editor").first(),
        ).toHaveCSS("background-color", "rgb(0, 0, 0)");
        if (width >= 1024)
          await expect(page.locator(".workspace-sidebar")).toHaveCSS(
            "background-color",
            "rgb(0, 0, 0)",
          );
      }
      await page
        .getByRole("button", { name: "Copy Original", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe('{"private":"source","value":1}');
      await page.screenshot({
        path: `docs/qa/compare-appearance-${appearance}-${width}.png`,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await switchAppearance(page, "Black");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "black",
    );
    await page
      .getByRole("button", { name: "Appearance: Black", exact: true })
      .click();
    for (const name of ["Cream", "Dark green", "Black"])
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Black", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Appearance: Black", exact: true }),
    ).toBeFocused();
  });
test("Black chrome leaves document paper, document theme and print colors independent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .locator("textarea")
    .first()
    .fill("# Appearance boundary\n\nDocument paper stays unchanged.");
  const paper = page.locator("[data-document-paper]").first();
  await expect(
    paper.getByRole("heading", { name: "Appearance boundary", exact: true }),
  ).toBeVisible();
  await expect(paper.locator(".skeleton-line")).toHaveCount(0);
  const before = await paper.evaluate((node) => ({
    html: node.innerHTML,
    background: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  await switchAppearance(page, "Black");
  await expect(paper).toHaveCSS("background-color", before.background);
  await expect(paper).toHaveCSS("color", before.color);
  expect(await paper.innerHTML()).toBe(before.html);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  expect(
    await page
      .locator("html")
      .evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--app-surface").trim(),
      ),
  ).toBe("250 249 246");
});
