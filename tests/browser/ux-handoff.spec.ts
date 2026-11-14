import { test, expect } from "@playwright/test";
const saved = (content = "# Original") => ({
  state: {
    markdown: content,
    documents: [
      {
        id: "test-doc",
        title: "Original",
        content,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    activeDocumentId: "test-doc",
    currentView: "workspace",
    snapshots: [],
  },
  version: 0,
});
async function seed(page: any, state = saved()) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("md-to-docs-storage"))
      localStorage.setItem("md-to-docs-storage", JSON.stringify(value));
  }, state);
}
async function history(page: any) {
  await page.keyboard.press("Control+k");
  await page
    .getByPlaceholder("Type a command, destination, theme, or heading...")
    .fill("Browse Document History");
  await page
    .getByPlaceholder("Type a command, destination, theme, or heading...")
    .press("Enter");
}
test("direct formatted copy handles denial and only reports actual success", async ({
  page,
}) => {
  await seed(page);
  await page.addInitScript(() => {
    (window as any).writes = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          if (!(window as any).allowCopy)
            throw new DOMException("Denied", "NotAllowedError");
          (window as any).writes.push(
            await (await items[0].getType("text/html")).text(),
          );
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Copy for Google Docs", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Could not complete");
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await page
    .locator("textarea")
    .first()
    .fill("# Latest copy\n\n**Latest** content");
  await page.evaluate(() => ((window as any).allowCopy = true));
  const button = page.getByRole("button", {
    name: "Copy for Google Docs",
    exact: true,
  });
  const width = (await button.boundingBox())!.width;
  await button.click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(
    (await page
      .getByRole("button", { name: "Copied", exact: true })
      .boundingBox())!.width,
  ).toBe(width);
  expect(await page.evaluate(() => (window as any).writes[0])).toContain(
    "Latest copy",
  );
  await expect(
    page.getByRole("button", { name: "Copy for Google Docs", exact: true }),
  ).toBeVisible();
});
test("rename retains identity and history; restore backup failure changes nothing", async ({
  page,
}) => {
  const data = saved("# Current text");
  (data.state.snapshots as any) = [
    {
      id: "old",
      docId: "test-doc",
      docTitle: "Original",
      label: "Earlier",
      timestamp: 1,
      content: "# Saved text\n\nOld wording",
      wordCount: 4,
      lineCount: 3,
    },
  ];
  await seed(page, data);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByTitle("Rename Original").filter({ visible: true }).click();
  await page
    .getByRole("textbox", { name: "Document name", exact: true })
    .fill("Renamed");
  await page
    .getByRole("textbox", { name: "Document name", exact: true })
    .press("Enter");
  await page.locator("textarea").first().fill("# Current text\n\nNew wording");
  await expect(
    page.getByTitle("Rename Renamed").filter({ visible: true }),
  ).toBeVisible();
  await history(page);
  await expect(page.getByRole("button", { name: /Earlier/ })).toBeVisible();
  await expect(page.locator(".ux-diff")).toContainText("Saved → Current");
  page.on("dialog", (d) => d.accept());
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "md-to-docs-recovery")
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Restore this version", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Nothing was changed");
  expect(await page.locator("textarea").first().inputValue()).toContain(
    "New wording",
  );
});
test("successful restore preserves recoverable current text and unnamed save", async ({
  page,
}) => {
  const data = saved("# Current text");
  (data.state.snapshots as any) = [
    {
      id: "old",
      docId: "test-doc",
      docTitle: "Original",
      label: "Earlier",
      timestamp: 1,
      content: "# Saved text",
      wordCount: 2,
      lineCount: 1,
    },
  ];
  await seed(page, data);
  await page.goto("/");
  await history(page);
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Restore this version", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Version restored");
  expect(
    await page.evaluate(() => localStorage.getItem("md-to-docs-recovery")),
  ).toContain("# Current text");
  await page.getByRole("button", { name: "Save version", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Version saved");
  await page
    .getByRole("button", { name: "Close Version history", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("textarea").first()).toHaveValue("# Saved text");
});
test("duplicate capacity requires choice, cancellation and backup failure are safe", async ({
  page,
}) => {
  const data = saved();
  data.state.documents = Array.from({ length: 5 }, (_, i) => ({
    id: i ? "doc" + i : "test-doc",
    title: i ? "Document " + i : "Original",
    content: "# Content " + i,
    createdAt: 1,
    updatedAt: 1,
  }));
  await seed(page, data);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("aside .ux-menu summary").first().click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Choose a document to replace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    JSON.parse(
      (await page.evaluate(() => localStorage.getItem("md-to-docs-storage")))!,
    ).state.documents,
  ).toHaveLength(5);
  await page.locator("aside .ux-menu summary").first().click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "md-to-docs-recovery") throw new Error("storage full");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Replace Document 1", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Nothing was replaced");
  expect(await page.locator("textarea").first().inputValue()).toBe(
    "# Original",
  );
});
for (const width of [320, 375, 390, 768, 1024, 1440])
  test(`responsive controls, footer and theme ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/markdown-to-word/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "dark",
    );
    await page
      .getByRole("button", { name: "Switch to light appearance" })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "cream",
    );
    await page
      .locator("textarea")
      .first()
      .fill("# Very long document title ".repeat(8) + "\n\nDocument source");
    await expect(
      page.getByRole("button", { name: "Copy for Google Docs", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page
        .locator("footer")
        .getByRole("link", { name: "Mermaid to SVG", exact: true }),
    ).toHaveAttribute("href", "/mermaid-to-svg/");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-appearance",
      "cream",
    );
    expect(await page.locator("textarea").first().inputValue()).toContain(
      "Document source",
    );
  });

test("direct Word and HTML downloads use the latest source without Prepare", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page
    .locator("textarea")
    .first()
    .fill("# Latest direct output\n\nLatest body");
  for (const name of ["Word (.docx)", "HTML (.html)"]) {
    await page.locator("header").getByText("Download", { exact: true }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      name.startsWith("Word") ? /\.docx$/ : /\.html$/,
    );
    const fs = await import("node:fs/promises");
    const bytes = await fs.readFile((await file.path())!);
    if (name.startsWith("Word")) {
      const JSZip = (await import("jszip")).default;
      const archive = await JSZip.loadAsync(bytes);
      expect(
        await archive.file("word/document.xml")!.async("string"),
      ).toContain("Latest direct output");
    } else expect(bytes.toString()).toContain("Latest direct output");
  }
});
test("capacity replacement keeps a recoverable version and five documents", async ({
  page,
}) => {
  const data = saved();
  data.state.documents = Array.from({ length: 5 }, (_, i) => ({
    id: i ? "doc" + i : "test-doc",
    title: i ? "Document " + i : "Original",
    content: "# Content " + i,
    createdAt: 1,
    updatedAt: 1,
  }));
  await seed(page, data);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("aside .ux-menu summary").first().click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace Document 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const stored = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem("md-to-docs-storage")!).state,
    backup: localStorage.getItem("md-to-docs-recovery"),
  }));
  expect(stored.state.documents).toHaveLength(5);
  expect(
    stored.state.documents.some((d: any) => d.title === "Original (Copy)"),
  ).toBe(true);
  expect(stored.backup).toContain("# Content 1");
});
test("diagram failure attention does not replay for ordinary edits and offers review", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const source = "# Broken diagram\n\n```mermaid\nnot_a_diagram\n```";
  await page.locator("textarea").first().fill(source);
  const strip = page.locator("[data-preview-pane] .ux-warning");
  await expect(strip).toContainText("1 diagram needs review");
  await expect(strip).toHaveClass(/ux-attention/);
  await page
    .locator("textarea")
    .first()
    .fill("Introduction\n\n" + source);
  await expect(strip).toBeVisible();
  await expect(strip).not.toHaveClass(/ux-attention/);
  await strip
    .getByRole("button", { name: "Review fixes", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Review Mermaid fixes", exact: true }),
  ).toBeVisible();
  expect(await page.locator("textarea").first().inputValue()).toContain(
    "not_a_diagram",
  );
  await page
    .getByRole("button", { name: "Close Review Mermaid fixes", exact: true })
    .click();
  await page.locator("header").getByText("Download", { exact: true }).click();
  await page.getByRole("button", { name: "Word (.docx)", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Review before delivery", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue anyway", exact: true }),
  ).toBeVisible();
});
test("long version diff is safe text and collapses unchanged lines", async ({
  page,
}) => {
  const content = Array.from({ length: 3000 }, (_, i) => "Line " + i).join(
    "\n",
  );
  const data = saved(content + "\n<script>window.diffExecuted=true</script>");
  (data.state.snapshots as any) = [
    {
      id: "old",
      docId: "test-doc",
      docTitle: "Original",
      label: "Long version",
      timestamp: 1,
      content: content + "\nPrevious end",
      wordCount: 6000,
      lineCount: 3001,
    },
  ];
  await seed(page, data);
  await page.goto("/");
  await history(page);
  await expect(page.locator(".ux-diff summary")).toContainText(
    "unchanged lines",
  );
  expect(await page.locator(".ux-diff-row").count()).toBeLessThan(205);
  expect(
    await page.evaluate(() => (window as any).diffExecuted),
  ).toBeUndefined();
});

test("editing during direct copy rejects stale clipboard content", async ({
  page,
}) => {
  await seed(page);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let requested!: () => void;
  const waiting = new Promise<void>((r) => (requested = r));
  await page.route("**/assets/exportPreparation-*.js", async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  await page.addInitScript(() => {
    (window as any).copiedVersions = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          const html = await (await items[0].getType("text/html")).text();
          (window as any).copiedVersions.push(html);
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Copy for Google Docs", exact: true })
    .click();
  await waiting;
  await page.locator("textarea").first().fill("# New current text");
  release();
  await expect(
    page.getByRole("button", { name: "Copy for Google Docs", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).copiedVersions)).toEqual([]);
});

test("failed direct download retries the selected format", async ({ page }) => {
  await seed(page);
  let fail = true;
  await page.route("**/assets/exportPreparation-*.js", (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto("/");
  await page.locator("header").getByText("Download", { exact: true }).click();
  await page.getByRole("button", { name: "Word (.docx)", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Could not complete");
  fail = false;
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.docx$/);
});
