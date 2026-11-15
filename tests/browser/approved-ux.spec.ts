import { test, expect } from "@playwright/test";
import { openOutputMenu, openDocumentOptions } from "./action-helpers";
const md = "# First document\n\nKeep this source.";
async function drop(page: any, name: string, text: string, target = "body") {
  await page.locator(target).dispatchEvent("drop", {
    dataTransfer: await page.evaluateHandle(
      ({ name, text }) => {
        const dt = new DataTransfer();
        dt.items.add(new File([text], name, { type: "text/markdown" }));
        return dt;
      },
      { name, text },
    ),
  });
}
for (const width of [375, 1440])
  test(`global file drops preserve source and capacity grows persistently at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.locator("textarea").first().fill(md);
    for (let i = 2; i <= 5; i++) {
      await drop(
        page,
        `file-${i}.md`,
        `# Document ${i}`,
        i % 2 ? "header" : "footer",
      );
      await expect(page.locator("textarea").first()).toHaveValue(
        `# Document ${i}`,
      );
    }
    await expect(page.locator("textarea").first()).toHaveValue("# Document 5");
    await drop(page, "six.md", "# Sixth");
    const modal = page.getByRole("dialog", {
      name: "Make room for this document",
    });
    await expect(modal).toContainText("5 documents");
    await expect(modal.getByRole("button", { name: /^Remove / })).toHaveCount(
      5,
    );
    await modal
      .getByRole("button", { name: "Close Make room for this document" })
      .click();
    await expect(page.locator("textarea").first()).toHaveValue("# Document 5");
    await drop(page, "six.md", "# Sixth");
    await page
      .getByRole("button", { name: "Open anyway", exact: true })
      .click();
    await expect(page.locator("textarea").first()).toHaveValue("# Sixth");
    await page.reload();
    await expect(page.locator("textarea").first()).toHaveValue("# Sixth");
    await drop(page, "seven.md", "# Seventh");
    await expect(modal).toContainText("6 documents");
    await expect(modal.getByRole("button", { name: /^Remove / })).toHaveCount(
      6,
    );
    await modal.getByRole("button", { name: /^Remove file-2/ }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.locator("textarea").first()).toHaveValue("# Seventh");
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("md-to-docs-storage")!).state
            .documentCapacity,
      ),
    ).toBe(6);
    expect(
      await page.evaluate(() => localStorage.getItem("md-to-docs-recovery")),
    ).toContain("Document 2");
  });
test("JSON URLs/comments and compact JavaScript format correctly without changing source", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const source =
    '# Code\n\n```json\n{"url":"https://example.com/a//b", "text":"/* keep */", "nested":{"x":1}}\n```\n\n```javascript\nfunction hello(){const value={a:1,b:2};return value;}\n```';
  await page.locator("textarea").first().fill(source);
  const json = page.locator("pre code.language-json");
  await expect(json).toContainText("https://example.com/a//b");
  expect(await json.textContent()).toContain('\n  "url"');
  const code = page.locator("pre code.language-javascript");
  const panel = page.locator("div.not-prose").filter({ has: code }).last();
  await panel.getByRole("button", { name: /Format/ }).click();
  await expect(code).toContainText("function hello() {");
  expect(await code.textContent()).toContain("\n  const value");
  await expect(page.locator("textarea").first()).toHaveValue(source);
});
for (const width of [320, 375, 390, 768, 1024, 1440])
  test(`approved header and reachable sheet controls at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/");
    await page.locator("textarea").first().fill(md);
    await expect(page.locator("header .export-menu>summary")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy for Google Docs", exact: true }),
    ).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const input = page
      .getByRole("textbox", { name: "Document name", exact: true })
      .filter({ visible: true });
    await input.fill("Renamed document");
    await input.press("Enter");
    await expect(input).toHaveValue("Renamed document");
    await openOutputMenu(page);
    await expect(
      page.getByRole("button", { name: "Word document (.docx)", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    if (width < 1024) {
      await openDocumentOptions(page);
      const dialog = page.getByRole("dialog", {
        name: "Document options",
        exact: true,
      });
      await expect(
        dialog.getByRole("textbox", { name: "Document name", exact: true }),
      ).toHaveCount(0);
      await dialog
        .getByRole("button", { name: "Clear all text", exact: true })
        .scrollIntoViewIfNeeded();
      const box = (await dialog.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(761);
      const checkbox = dialog.getByRole("checkbox", {
        name: "Include document signature",
      });
      expect((await checkbox.boundingBox())!.width).toBeLessThanOrEqual(24);
    }
  });
test("logo snow is deferred and never starts with reduced motion", async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") scripts.push(r.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".brand-snow-box").first().hover();
  await page.waitForTimeout(400);
  expect(scripts.some((s) => /logoSnow|weather|core\.min/.test(s))).toBe(false);
  await expect(page.locator("piix-weather")).toHaveCount(0);
});
test("dropping over a diagram utility opens the imported document workspace", async ({
  page,
}) => {
  await page.goto("/mermaid-to-svg/");
  await drop(page, "notes.md", "# Dropped notes");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("textarea").first()).toHaveValue("# Dropped notes");
});
test("logo snow loads locally on hover and cleans up on leave", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const brand = page.locator(".brand-snow-box").first();
  const before=(await brand.boundingBox())!;
  await brand.hover();
  await expect(brand.locator("piix-weather")).toHaveCount(1);
  await expect(page.locator("canvas").first()).toBeAttached();
  expect((await brand.boundingBox())!.width).toBe(before.width);
  expect(requests.some((r) => /cdn.jsdelivr.net.*piixpal/.test(r))).toBe(false);
  await page.mouse.move(700, 500);
  await expect(page.locator("piix-weather")).toHaveCount(0);
});
for (const [language, source, expected] of [
  ["typescript", 'const user:{name:string}={name:"Ada"};', "const user: {"],
  ["css", ".box{color:red;padding:0 4px}", ".box {"],
  ["html", "<div><p>Hello</p><p>World</p></div>", "\n  <p>"],
  ["yaml", "items: [one,two,three]", "[one, two, three]"],
])
  test(`real ${language} formatting`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page
      .locator("textarea")
      .first()
      .fill("```" + language + "\n" + source + "\n```");
    const code = page.locator("pre code.language-" + language);
    const panel = page.locator("div.not-prose").filter({ has: code }).last();
    await panel.getByRole("button", { name: /Format/ }).click();
    await expect(code).toContainText(expected);
    await expect(page.locator("textarea").first()).toContainText(source);
  });
test("blank/cancelled names preserve identity; a check saves a blurred draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.locator("textarea").first().fill("# Original title");
  const field = page.getByRole("textbox", {
    name: "Document name",
    exact: true,
  });
  const id = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("md-to-docs-storage")!).state
        .activeDocumentId,
  );
  await field.fill("Cancelled");
  await field.press("Escape");
  await expect(field).toHaveValue("Original title");
  await field.fill(" ");
  await field.press("Enter");
  await expect(field).toHaveValue("Original title");
  await field.fill("Final name");
  await field.blur();
  await page
    .getByRole("button", { name: "Save document name", exact: true })
    .click();
  await expect(field).toHaveValue("Final name");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("md-to-docs-storage")!).state
          .activeDocumentId,
    ),
  ).toBe(id);
  await expect(page.locator("textarea").first()).toHaveValue(
    "# Original title",
  );
});
test("invalid JSON shows a useful formatting error and preserves the source", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const source = '```json\n{"value":invalid}\n```';
  await page.locator("textarea").first().fill(source);
  await page.getByRole("button", { name: /Format$/ }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("textarea").first()).toHaveValue(source);
  await expect(page.locator("pre code.language-json")).toContainText(
    '{"value":invalid}',
  );
});
