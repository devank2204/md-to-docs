import { test, expect, type Page } from "@playwright/test";
import { switchAppearance } from "./action-helpers";
async function input(page: Page, side: string, text: string) {
  await page.getByLabel(`Import ${side}`, { exact: true }).setInputFiles({
    name: `${side}.sh`,
    mimeType: "text/plain",
    buffer: Buffer.from(text),
  });
}
for (const width of [320, 390, 1366])
  test(`300-line body workspace, search and themes at ${width}`, async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/curl-compare/");
    const marker = "PRIVATE_CURL_PAYLOAD_MARKER";
    const value = Object.fromEntries(
      Array.from({ length: 300 }, (_, i) => [
        `field${i}`,
        i === 290 ? marker : i,
      ]),
    );
    const a = JSON.stringify(value, null, 2),
      b = JSON.stringify({ ...value, field140: 999 }, null, 2);
    const commands = [
      `curl https://api.example.com --json '${a}'`,
      `curl https://api.example.com --json '${b}'`,
    ];
    await input(page, "Original", commands[0]);
    await input(page, "Updated", commands[1]);
    await expect(page.locator(".curl-status")).toHaveText("1 request change");
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.getByRole("button", { name: "JSON body", exact: true }).click();
    if (width < 1024)
      await page.getByRole("tab", { name: "Updated", exact: true }).click();
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await expect(page.locator(".compare-app")).toHaveAttribute(
      "data-focus",
      "true",
    );
    const visible = page.locator(
      '.json-editors .cm-content[aria-label="Updated"]',
    );
    await expect(visible).toBeVisible();
    await expect(visible).toHaveAttribute("aria-readonly", "true");
    await expect(
      page.locator(".json-editors .cm-json-value-selected").last(),
    ).toBeInViewport();
    await page
      .getByRole("checkbox", { name: "Changes only", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Find in Updated", exact: true })
      .click();
    const panel = page.locator(".json-editors .cm-search").last();
    await panel
      .getByRole("textbox", { name: "Find", exact: true })
      .fill(marker);
    await panel.getByRole("button", { name: "next", exact: true }).click();
    await expect(
      page.locator(".cm-searchMatch-selected").last(),
    ).toBeInViewport();
    await page.keyboard.press("Escape");
    await visible.focus();
    await page.keyboard.insertText("MUST_NOT_EDIT_READONLY_BODY");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    for (const [label, mode] of [
      ["Cream", "cream"],
      ["Dark green", "dark"],
      ["Black", "black"],
    ] as const) {
      await switchAppearance(page, label);
      await expect(page.locator("html")).toHaveAttribute(
        "data-appearance",
        mode,
      );
      await page.screenshot({ path: `docs/qa/curl-body-${mode}-${width}.png` });
    }
    await page
      .getByRole("button", { name: "Copy Updated", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(b);
    await page.getByRole("button", { name: "Commands", exact: true }).click();
    await page
      .getByRole("button", { name: "Copy Updated", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(commands[1]);
    await page.screenshot({ path: `docs/qa/curl-command-focus-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "cURL Compare", exact: true }),
    ).toBeVisible();
  });
test("commands preserve undo, file-drop side, swaps, clear and unified copy", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  const original = `curl https://api.example.com --json '{"a":1}'`,
    updated = `curl https://api.example.com --json '{"a":2}'`;
  await input(page, "Original", original);
  await page
    .locator(".cm-editor.cm-merge-b .cm-content")
    .evaluate((node, text) => {
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([text], "updated.sh", { type: "text/plain" }),
      );
      node.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        }),
      );
    }, updated);
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  const editor = page.getByRole("textbox", { name: "Original", exact: true });
  await editor.focus();
  await page.keyboard.press("Control+End");
  await page.keyboard.insertText("\n# edit");
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  await page.getByRole("button", { name: "JSON body", exact: true }).click();
  await page.getByRole("button", { name: "Commands", exact: true }).click();
  await editor.focus();
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveText(original);
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page
    .getByRole("button", { name: "Copy unified command diff", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("--- Original");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Swap", exact: true }).click();
  await expect(editor).toHaveText(updated);
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Clear both", exact: true }).click();
  for (const side of ["Original", "Updated"]) {
    await page
      .getByRole("button", { name: `Copy ${side}`, exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("");
  }
  await expect(page.locator(".curl-status")).toHaveText(
    "Paste two requests to compare",
  );
});
test("private commands stay local and survive tool navigation without touching documents", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.locator("textarea").first().fill("# KEEP_DOCUMENT_CURL");
  await expect
    .poll(() => page.evaluate(() => JSON.stringify(localStorage)))
    .toContain("KEEP_DOCUMENT_CURL");
  await page
    .getByRole("link", { name: "cURL Compare", exact: true })
    .first()
    .click();
  const command =
    'curl https://private-api.invalid/PRIVATE_CURL_TOKEN -H "Authorization: PRIVATE_CURL_TOKEN"';
  await input(page, "Original", command);
  await input(page, "Updated", command);
  await expect(page.locator(".curl-status")).toHaveText(
    "Compared request fields match",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "PRIVATE_CURL_TOKEN",
  );
  expect(page.url()).not.toContain("PRIVATE_CURL_TOKEN");
  expect(
    requests.filter(
      (url) =>
        url.includes("PRIVATE_CURL_TOKEN") ||
        url.includes("private-api.invalid"),
    ),
  ).toEqual([]);
  await page
    .getByRole("navigation", { name: "Comparison tools" })
    .getByRole("link", { name: "Text Compare", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Text Compare");
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("cURL Compare");
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(command);
  await page.reload();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("");
  await expect(page.locator(".curl-status")).toHaveText(
    "Paste two requests to compare",
  );
  await page.locator(".compare-brand a").click();
  await expect(page.locator("textarea").first()).toHaveValue(
    "# KEEP_DOCUMENT_CURL",
  );
});
test("invalid input, size bounds and untrusted values remain recoverable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  const command = `curl https://example.com --json '{"__proto__":{"polluted":true},"html":"<img src=x onerror=window.CURL_XSS=1>","constructor":1}'`;
  await input(page, "Original", command);
  await input(
    page,
    "Updated",
    command.replace('"constructor":1', '"constructor":2'),
  );
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  await page.getByRole("button", { name: "JSON body", exact: true }).click();
  expect(
    await page.evaluate(() => ({
      xss: (window as any).CURL_XSS,
      polluted: ({} as any).polluted,
    })),
  ).toEqual({ xss: undefined, polluted: undefined });
  expect(
    await page
      .locator(".compare-tool-surface img,.compare-tool-surface script")
      .count(),
  ).toBe(0);
  await page.getByRole("button", { name: "Commands", exact: true }).click();
  await input(
    page,
    "Original",
    "curl https://example.com -d " + "'" + "a".repeat(50001) + "'",
  );
  await expect(page.locator(".curl-messages")).toContainText(
    "50,000 characters",
  );
  await input(page, "Original", "curl https://example.com");
  await input(page, "Updated", "curl https://example.com");
  await expect(page.locator(".curl-status")).toHaveText(
    "Compared request fields match",
  );
  const editor = page.getByRole("textbox", { name: "Updated", exact: true });
  await editor.fill('curl https://example.com --json "{broken"');
  await editor.fill("curl https://example.com -X DELETE");
  await editor.fill("curl https://example.com");
  await expect(page.locator(".curl-status")).toHaveText(
    "Compared request fields match",
  );
  await expect(page.locator(".curl-messages")).toHaveCount(0);
});
test("parser asset failure leaves raw command comparison usable", async ({
  page,
}) => {
  await page.route("**/*.wasm", (route) => route.abort());
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  await input(page, "Original", "curl https://example.com");
  await input(page, "Updated", "curl https://example.com -X POST");
  await expect(page.locator(".curl-messages")).toContainText(
    "parser could not load",
  );
  await expect(
    page.getByRole("textbox", { name: "Updated", exact: true }),
  ).toHaveText("curl https://example.com -X POST");
  await expect(page.locator(".cm-mergeView")).toBeVisible();
});
test("comparison parser assets stay deferred on home and other comparison routes", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const path of ["/", "/text-compare/", "/json-compare/"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(
    requests.filter(
      (url) =>
        url.endsWith(".wasm") ||
        url.includes("/review-") ||
        url.includes("/browserParser-"),
    ),
  ).toEqual([]);
  await page.goto("/curl-compare/");
  await input(page, "Original", "curl https://example.com");
  await input(page, "Updated", "curl https://example.com");
  await expect(page.locator(".curl-status")).toHaveText(
    "Compared request fields match",
  );
  expect(requests.filter((url) => url.endsWith(".wasm")).length).toBe(2);
});
test("cURL landing is prerendered with canonical, schema, sitemap and navigation", async ({
  browser,
  page,
  request,
}) => {
  const response = await request.get("/curl-compare/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<h1");
  expect(html).toContain("cURL Compare");
  expect(html).toContain("https://mdtodocs.com/curl-compare/");
  expect(html).toContain("WebApplication");
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "https://mdtodocs.com/curl-compare/",
  );
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("/curl-compare/");
  await expect(
    staticPage.getByRole("heading", { name: "cURL Compare", exact: true }),
  ).toBeVisible();
  await context.close();
  await page.goto("/curl-compare/");
  await expect(page).toHaveTitle(
    "cURL Compare — API Requests & JSON Bodies | MDToDocs",
  );
  await page.reload();
  await expect(page.locator("h1")).toHaveText("cURL Compare");
  await page.locator(".compare-brand a").click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("cURL Compare");
  await page.goForward();
  await expect(page.locator("h1")).not.toHaveText("cURL Compare");
});
test("pane resize and Original search remain usable from unified commands", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  await input(
    page,
    "Original",
    "curl https://original.example.com/ONLY_ORIGINAL",
  );
  await input(page, "Updated", "curl https://updated.example.com");
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  const divider = page.getByRole("separator", {
    name: "Resize comparison panes",
    exact: true,
  });
  await divider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "55");
  await divider.press("Home");
  await expect(divider).toHaveAttribute("aria-valuenow", "25");
  await divider.dblclick();
  await expect(divider).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Unified", exact: true }).click();
  await page
    .getByRole("button", { name: "Find in Original", exact: true })
    .click();
  await expect(page.locator(".cm-mergeView")).toBeVisible();
  const panel = page.locator(".cm-editor.cm-merge-a .cm-search");
  await panel
    .getByRole("textbox", { name: "Find", exact: true })
    .fill("ONLY_ORIGINAL");
  await panel.getByRole("button", { name: "next", exact: true }).click();
  await expect(page.locator(".cm-searchMatch-selected")).toHaveText(
    "ONLY_ORIGINAL",
  );
});
test("argument locations preserve Unicode offsets and typing keeps its cursor", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  const command =
    "curl 'https://example.com/😀' -H 'X-Test: café😀' --json '{\"a\":1}'";
  await input(page, "Original", command);
  await input(page, "Updated", command.replace('"a":1', '"a":2'));
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  await page
    .getByRole("navigation", { name: "Request sections" })
    .getByRole("button", { name: /^Headers/ })
    .click();
  await page.getByRole("textbox", { name: "Original", exact: true }).focus();
  await page.keyboard.press("Control+c");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("-H 'X-Test: café😀'");
  const editor = page.getByRole("textbox", { name: "Original", exact: true });
  await page.keyboard.press("Control+End");
  await page.keyboard.insertText("\n# FIRST");
  await expect(editor).toHaveText(command + "\n# FIRST", {
    useInnerText: true,
  });
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  // Allow the debounced result to settle before the next real keystroke.
  await expect(page.locator(".curl-messages")).toHaveCount(0);
  await page.waitForTimeout(350);
  await page.keyboard.insertText("_SECOND");
  await expect(editor).toHaveText(command + "\n# FIRST_SECOND", {
    useInnerText: true,
  });
});
test("bounded large-command measurement", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  await input(page, "Original", "curl https://example.com");
  await input(page, "Updated", "curl https://example.com");
  await expect(page.locator(".curl-status")).toHaveText(
    "Compared request fields match",
  );
  await page.evaluate(() => {
    (window as any).__curlTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        (window as any).__curlTasks.push(entry.duration);
    });
    observer.observe({ type: "longtask", buffered: false });
    (window as any).__curlObserver = observer;
  });
  const fields = Object.fromEntries(
    Array.from({ length: 700 }, (_, i) => [
      `field${i}`,
      `value-${i}-abcdefghijklmnop`,
    ]),
  );
  const a = `curl https://example.com --json '${JSON.stringify(fields)}'`,
    b = `curl https://example.com --json '${JSON.stringify({ ...fields, field350: "changed" })}'`;
  const started = Date.now();
  await input(page, "Original", a);
  await input(page, "Updated", b);
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  const wallMs = Date.now() - started;
  const tasks = await page.evaluate(() => {
    (window as any).__curlObserver.disconnect();
    return (window as any).__curlTasks as number[];
  });
  const fs = await import("node:fs");
  fs.writeFileSync(
    "docs/qa/curl-performance.json",
    JSON.stringify(
      {
        scenario:
          "Warm 700-field literal JSON body; one change; desktop Chromium 1366x900; includes imports, debounce and UI rendering.",
        source_characters_per_side: [a.length, b.length],
        wall_ms: wallMs,
        long_tasks_ms: tasks,
        longest_observed_task_ms: Math.max(0, ...tasks),
        notes:
          "One local browser sample, not a benchmark or a production/device claim. No payload values recorded.",
      },
      null,
      2,
    ) + "\n",
  );
});
test("formatting body views keeps command and payload strings intact", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/curl-compare/");
  const a = '{"user":{"id":5,"role":"admin"},"active":true}',
    b = '{"active":true,"user":{"role":"editor","id":5}}';
  const command = `curl https://example.com --json '${a}'`;
  await input(page, "Original", command);
  await input(page, "Updated", `curl https://example.com --json '${b}'`);
  await expect(page.locator(".curl-status")).toHaveText("1 request change");
  await page.getByRole("button", { name: "JSON body", exact: true }).click();
  await page
    .getByRole("button", { name: "Format both body views", exact: true })
    .first()
    .click();
  await expect(
    page.locator(".json-editors .cm-json-value-selected").first(),
  ).toHaveText('"admin"');
  await expect(
    page.locator(".json-editors .cm-json-value-selected").last(),
  ).toHaveText('"editor"');
  await expect(page.locator(".json-editors .cm-content").first()).toHaveText(
    JSON.stringify(JSON.parse(a), null, 2),
    { useInnerText: true },
  );
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(a);
  await page.screenshot({ path: "docs/qa/curl-formatted-body-1366.png" });
  await page.getByRole("button", { name: "Commands", exact: true }).click();
  await page
    .getByRole("button", { name: "Copy Original", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(command);
});
