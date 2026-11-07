import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
  args: ["--no-sandbox"],
});
const baseURL = process.env.STUDIO_BASE_URL || "http://127.0.0.1:4173";
const output = "docs/designs/evidence/studio-implementation";
await mkdir(output, { recursive: true });
const measurements = [];
const source =
  "# Launch brief\n\nA good document should be easy to send.\n\n## Delivery checklist\n\n- Keep the original text\n- Review the important details\n- Send the right format\n\n| Owner | Next step |\n|---|---|\n| Design | Review the document |\n| Engineering | Prepare delivery |\n";
for (const width of [390, 1024, 1440]) {
  for (const appearance of ["cream", "dark"]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(baseURL);
    if (width < 1024)
      await page.getByRole("button", { name: "Document options" }).click();
    else
      await page.getByRole("button", { name: "Change app appearance" }).click();
    await page
      .getByRole("combobox", { name: "App appearance", exact: true })
      .selectOption(appearance);
    await page.getByRole("button", { name: /^Close / }).click();
    if (width !== 1024)
      await page.screenshot({
        path: `${output}/home-${width}-${appearance}.png`,
      });
    await page.locator("textarea").first().fill(source);
    if (width < 1024) await page.getByRole("tab", { name: "Preview" }).click();
    await page.waitForFunction(
      () =>
        !document.body.textContent.includes("Checking formatting…") &&
        !document.body.textContent.includes("Compiling..."),
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `${output}/workspace-${width}-${appearance}.png`,
    });
    measurements.push(
      await page.evaluate(
        ({ width, appearance }) => ({
          width,
          appearance,
          overflow: document.documentElement.scrollWidth > innerWidth,
          paper: getComputedStyle(
            document.querySelector("[data-document-paper]"),
          ).backgroundColor,
          controls: [...document.querySelectorAll("header button")]
            .filter((n) => n.getClientRects().length)
            .map((n) => ({
              name: n.getAttribute("aria-label") || n.textContent.trim(),
              left: n.getBoundingClientRect().left,
              right: n.getBoundingClientRect().right,
            })),
        }),
        { width, appearance },
      ),
    );
    await context.close();
  }
}
// Capture real pending, canceled, failed, recovered and review states with synthetic text.
const context = await browser.newContext({
  viewport: { width: 390, height: 900 },
});
await context.addInitScript(() =>
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      write: () => Promise.reject(new Error("Synthetic permission failure")),
    },
  }),
);
const page = await context.newPage();
await page.goto(baseURL);
await page
  .locator("textarea")
  .fill("# Delivery evidence\n\nYour text stays available.");
await page.getByRole("button", { name: "Prepare for Google Docs" }).click();
await page
  .getByRole("button", { name: "Copy for Google Docs", exact: true })
  .click();
await page.getByRole("alert").waitFor();
await page.screenshot({ path: `${output}/delivery-failed-390.png` });
await page.getByRole("button", { name: "Use a Word file instead" }).click();
await page.getByRole("button", { name: "Prepare Word document" }).click();
await page
  .getByRole("button", { name: "Download .docx", exact: true })
  .waitFor();
await page.screenshot({ path: `${output}/delivery-recovered-390.png` });
const table =
  "| A | B | C | D | E | F | G | H | I |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |\n";
await page.locator("textarea").fill("# Review evidence\n\n" + table);
await page.getByRole("button", { name: /formatting notes · Review/ }).click();
await page.getByRole("button", { name: "Preview fix for this rule" }).click();
await page.screenshot({ path: `${output}/review-patch-390.png` });
await page.getByRole("button", { name: /^Close / }).click();
let release;
const held = new Promise((resolve) => {
  release = resolve;
});
await page.route("**/evidence-held.png", async (route) => {
  await held;
  await route.fulfill({ status: 404, body: "" }).catch(() => {});
});
await page.getByRole("button", { name: /^Save as / }).click();
await page.getByRole("dialog").getByRole("button", { name: "PDF" }).click();
await page
  .locator("textarea")
  .fill("# Pending evidence\n\n![Figure](/evidence-held.png)");
await page
  .getByRole("button", { name: "Print / Save as PDF", exact: true })
  .click();
await page
  .getByRole("button", { name: "Cancel preparation", exact: true })
  .waitFor();
await page.screenshot({ path: `${output}/preparing-390.png` });
await page
  .getByRole("button", { name: "Cancel preparation", exact: true })
  .click();
await page.screenshot({ path: `${output}/preparation-canceled-390.png` });
release();
await context.close();
await writeFile(
  `${output}/measurements.json`,
  JSON.stringify(
    {
      browser: await browser.version(),
      capturedAt: new Date().toISOString(),
      measurements,
    },
    null,
    2,
  ) + "\n",
);
await browser.close();
console.log(JSON.stringify(measurements));
