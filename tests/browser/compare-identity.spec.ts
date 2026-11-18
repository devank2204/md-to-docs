import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test(`comparison pages retain incumbent typography at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const typography = async () =>
      page.locator("h1").evaluate((node) => {
        const properties = [
          "fontFamily",
          "fontSize",
          "fontWeight",
          "fontStyle",
          "lineHeight",
          "letterSpacing",
        ] as const;
        const read = (element: Element) =>
          Object.fromEntries(
            properties.map((key) => [key, getComputedStyle(element)[key]]),
          );
        return {
          heading: read(node),
          description: read(node.nextElementSibling!),
        };
      });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    const incumbent = await typography();
    for (const route of ["/text-compare/", "/json-compare/", "/curl-compare/"]) {
      await page.goto(route);
      await expect(page.locator(".compare-toolbar").first()).toBeVisible();
      expect(await typography()).toEqual(incumbent);
      const control = await page
        .getByRole("button", { name: "Try example" })
        .evaluate((node) => ({
          font: getComputedStyle(node).fontFamily,
          size: getComputedStyle(node).fontSize,
          shared: node.classList.contains("ux-button"),
        }));
      expect(control.shared).toBe(true);
      expect(control.font).toContain("JetBrains Mono");
      expect(control.size).toBe("11px");
      if (route !== "/json-compare/") {
        await expect(page.locator(".cm-scroller").first()).toBeVisible();
        const source = await page
          .locator(".cm-scroller")
          .first()
          .evaluate((node) => ({
            font: getComputedStyle(node).fontFamily,
            size: getComputedStyle(node).fontSize,
          }));
        expect(source.font).toContain("JetBrains Mono");
        expect(source.size).toBe(width < 1024 ? "16px" : "12px");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
