import { test, expect } from '@playwright/test';
const diagram = '```mermaid\ngraph TD\nA[Draft] --> B[Document]\n```';

// Regression: ISSUE-M1 — diagram actions were never clicked in existing rendering smoke coverage.
// Found by /qa on 2026-11-07. Report: docs/qa/mermaid-repair-and-actions.md
for (const width of [390, 1440])
  test(`diagram options are reachable and all downloads contain real image data at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('textarea').first().fill(diagram);
    if (width < 1024) await page.getByRole('tab', { name: 'Preview' }).click();
    await expect(page.locator('.mermaid-preview svg')).toBeVisible();
    await page
      .getByRole('button', { name: 'More diagram options', exact: true })
      .click();
    const menu = page.getByRole('dialog', {
      name: 'Diagram options',
      exact: true,
    });
    await expect(menu).toBeVisible();
    const menuBounds = await menu.boundingBox();
    expect(menuBounds!.y).toBeGreaterThanOrEqual(0);
    expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(900);
    for (const format of ['SVG', 'PNG', 'JPEG']) {
      if (format !== 'SVG')
        await page
          .getByRole('button', { name: 'More diagram options', exact: true })
          .click();
      const download = page.waitForEvent('download');
      await menu
        .getByRole('button', { name: new RegExp(`Download ${format}`) })
        .click();
      const file = await download;
      expect(file.suggestedFilename()).toMatch(
        format === 'JPEG' ? /\.jpg$/ : new RegExp(`\.${format.toLowerCase()}$`),
      );
      const stream = await file.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) chunks.push(chunk);
      const data = Buffer.concat(chunks);
      if (format === 'SVG') expect(data.toString()).toContain('<svg');
      if (format === 'PNG')
        expect(data.subarray(0, 8)).toEqual(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        );
      if (format === 'JPEG')
        expect(data.subarray(0, 2)).toEqual(Buffer.from([255, 216]));
    }
  });

test('copy image surfaces permission failure and never downloads automatically', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: () =>
          Promise.reject(new DOMException('Denied', 'NotAllowedError')),
      },
    }),
  );
  await page.goto('/');
  await page.locator('textarea').fill(diagram);
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  let downloads = 0;
  page.on('download', () => downloads++);
  await page
    .getByRole('button', {
      name: 'Copy diagram image to clipboard',
      exact: true,
    })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    /copy.*unavailable|could not copy/i,
  );
  expect(downloads).toBe(0);
});

test('copies a real PNG to the system clipboard without downloading', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('textarea').fill(diagram);
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  let downloads = 0;
  page.on('download', () => downloads++);
  await page
    .getByRole('button', {
      name: 'Copy diagram image to clipboard',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Image copied.' }),
  ).toBeVisible();
  const image = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const blob = await items[0].getType('image/png');
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (
        pixels[i + 3] > 0 &&
        Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 200
      )
        ink++;
    return { width: bitmap.width, height: bitmap.height, ink, type: blob.type };
  });
  expect(image.type).toBe('image/png');
  expect(image.width).toBeGreaterThan(100);
  expect(image.height).toBeGreaterThan(50);
  expect(image.ink).toBeGreaterThan(100);
  await page
    .getByRole('button', { name: 'More diagram options', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Diagram options', exact: true })
    .getByRole('button', { name: 'Copy Image (PNG)', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Image copied.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await navigator.clipboard.read())[0].types,
    ),
  ).toContain('image/png');
  expect(downloads).toBe(0);
});

test('all diagram themes, source/SVG copy, menu keyboard close and canvas actions work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as any).copiedText = text;
        },
        write: async () => {},
      },
    }),
  );
  await page.goto('/');
  await page.locator('textarea').first().fill(diagram);
  const more = page.getByRole('button', {
    name: 'More diagram options',
    exact: true,
  });
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  await more.click();
  const options = page.getByRole('dialog', {
    name: 'Diagram options',
    exact: true,
  });
  const svgs: string[] = [];
  const fills: Record<string, string> = {};
  for (const theme of ['default', 'dark', 'forest', 'base', 'neutral']) {
    await options
      .getByRole('combobox', { name: 'Select diagram theme' })
      .selectOption(theme);
    await expect(page.locator('.mermaid-preview svg')).toBeVisible();
    svgs.push(await page.locator('.mermaid-preview').innerHTML());
    if (theme === 'default' || theme === 'forest')
      fills[theme] = await page
        .locator('.mermaid-preview .node rect')
        .first()
        .evaluate((node) => getComputedStyle(node).fill);
  }
  expect(new Set(svgs).size).toBeGreaterThanOrEqual(4);
  expect(fills.default).not.toBe(fills.forest);
  await options.getByRole('button', { name: 'Copy Mermaid Source' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).copiedText))
    .toBe('graph TD\nA[Draft] --> B[Document]');
  await more.click();
  await options.getByRole('button', { name: 'Copy SVG XML' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).copiedText))
    .toContain('<svg');
  await more.click();
  await options.getByRole('combobox').press('Escape');
  await expect(options).toHaveCount(0);
  await expect(more).toBeFocused();
  await page
    .getByRole('button', {
      name: 'Inspect in Canvas Studio (Pan & Zoom)',
      exact: true,
    })
    .click();
  const canvas = page.getByRole('dialog', {
    name: 'Diagram Canvas Studio',
    exact: true,
  });
  await expect(canvas).toBeVisible();
  await canvas
    .getByRole('button', { name: '100% actual size', exact: true })
    .click();
  await expect(
    canvas.getByRole('button', { name: '100%', exact: true }),
  ).toBeVisible();
  await canvas.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(
    canvas.getByRole('button', { name: '115%', exact: true }),
  ).toBeVisible();
  await canvas.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await canvas.getByRole('button', { name: 'Fit diagram to screen' }).click();
  await canvas.getByRole('button', { name: 'Toggle radar minimap' }).click();
  await canvas
    .getByRole('button', { name: 'Copy PNG image to clipboard' })
    .click();
  await expect(canvas.getByRole('status')).toContainText('Image copied');
  await canvas
    .getByRole('button', { name: 'Copy Mermaid source code' })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as any).copiedText))
    .toBe('graph TD\nA[Draft] --> B[Document]');
  await canvas
    .getByRole('button', { name: 'Copy SVG vector to clipboard' })
    .click();
  const downloaded = page.waitForEvent('download');
  await canvas.getByRole('button', { name: 'Download vector SVG' }).click();
  expect((await downloaded).suggestedFilename()).toBe('diagram.svg');
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(
      await canvas.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await canvas.getByRole('button', { name: 'Close canvas' }).click();
  await expect(canvas).toHaveCount(0);
});

test('Azure and syntax repairs require review, apply together, and undo without touching prose', async ({
  page,
}) => {
  const source =
    '# My architecture\n\nKeep this paragraph.\n\n::: mermaid\ngraph TD\nA[Calculate (Total)] --> B\n:::\n\n```mermaid\ngraph TD\nsubgraph Group\nC --> D\n```';
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await page
    .getByRole('button', { name: 'Review diagram fixes', exact: true })
    .click();
  const review = page.getByRole('dialog', { name: 'Review Mermaid fixes' });
  await expect(
    review.getByRole('button', { name: 'Apply all 2 validated fixes' }),
  ).toBeVisible();
  await expect(page.locator('textarea')).toHaveValue(source);
  await expect(review.getByText(/Azure DevOps/)).toBeVisible();
  await review
    .getByRole('button', { name: 'Apply all 2 validated fixes' })
    .click();
  const fixed = await page.locator('textarea').inputValue();
  expect(fixed).toContain('Keep this paragraph.');
  expect(fixed).not.toContain('::: mermaid');
  expect(fixed).toContain('A["Calculate (Total)"]');
  expect(fixed).toContain('\nend\n```');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo Mermaid fixes' }).click();
  await expect(page.locator('textarea')).toHaveValue(source);
});

test('a diagram-level fix targets the second identical broken block only', async ({
  page,
}) => {
  const block = '```mermaid\ngraph TD\nA[Calculate (Total)] --> B\n```';
  const source = '# Duplicate diagrams\n\n' + block + '\n\n' + block;
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page
    .getByRole('button', { name: 'Review diagram fix', exact: true })
    .last()
    .click();
  const review = page.getByRole('dialog', { name: 'Review Mermaid fixes' });
  await expect(
    review.getByRole('button', { name: /Apply fix to diagram at line/ }),
  ).toHaveCount(1);
  await review
    .getByRole('button', { name: /Apply fix to diagram at line/ })
    .click();
  const fixed = await page.locator('textarea').inputValue();
  expect(fixed.slice(0, source.lastIndexOf(block))).toBe(
    source.slice(0, source.lastIndexOf(block)),
  );
  expect(fixed.slice(source.lastIndexOf(block))).toContain(
    'A["Calculate (Total)"]',
  );
});

test('review rejects stale source and leaves unknown syntax untouched', async ({
  page,
}) => {
  const source =
    '```mermaid\ngraph TD\nA[Calculate (Total)] --> B\n```\n\n```mermaid\nnot-a-diagram !!!\n```';
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await page
    .getByRole('button', { name: 'Review diagram fixes', exact: true })
    .click();
  const review = page.getByRole('dialog', { name: 'Review Mermaid fixes' });
  await expect(
    review.getByRole('button', { name: /Apply fix to diagram at line/ }),
  ).toHaveCount(1);
  await expect(
    review.getByText(/No validated automatic fix is available/),
  ).toBeVisible();
  // Simulate an asynchronous import completing while the review is open.
  await page.locator('textarea').evaluate((node: HTMLTextAreaElement) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!;
    setter.call(node, '# A newer imported document');
    node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(
    review.getByRole('button', { name: /Apply fix to diagram at line/ }),
  ).toBeDisabled();
  await expect(review.getByRole('alert')).toContainText(
    'Your document changed',
  );
  await review.getByRole('button', { name: 'Keep original source' }).click();
  await expect(page.locator('textarea')).toHaveValue(
    '# A newer imported document',
  );
});

for (const route of ['/mermaid-to-svg', '/mermaid-to-png'])
  test(`utility route ${route} uses reviewed repair and shared image actions`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    await page.locator('textarea').fill('graph TD\nA[Calculate (Total)] --> B');
    await page
      .getByRole('button', { name: 'Review diagram fix', exact: true })
      .click();
    const review = page.getByRole('dialog', {
      name: 'Review Mermaid fix',
      exact: true,
    });
    await review
      .getByRole('button', { name: 'Check this diagram', exact: true })
      .click();
    await expect(
      review.getByRole('button', { name: 'Apply validated fix', exact: true }),
    ).toBeVisible();
    await expect(page.locator('textarea')).toHaveValue(
      'graph TD\nA[Calculate (Total)] --> B',
    );
    await review
      .getByRole('button', { name: 'Apply validated fix', exact: true })
      .click();
    await expect(page.locator('textarea')).toHaveValue(
      'graph TD\nA["Calculate (Total)"] --> B',
    );
    await page
      .getByRole('button', {
        name: route.endsWith('svg') ? 'Copy Image' : 'Copy PNG Image',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Image copied.' }),
    ).toBeVisible();
    const types = await page.evaluate(
      async () => (await navigator.clipboard.read())[0].types,
    );
    expect(types).toContain('image/png');
    await page
      .getByRole('button', { name: 'Undo diagram fix', exact: true })
      .click();
    await expect(page.locator('textarea')).toHaveValue(
      'graph TD\nA[Calculate (Total)] --> B',
    );
  });

test('wide diagrams copy within browser-safe image dimensions', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const nodes = Array.from(
    { length: 70 },
    (_, index) => `N${index}[Architecture step ${index}]`,
  );
  await page.goto('/');
  await page
    .locator('textarea')
    .fill('```mermaid\nflowchart LR\n' + nodes.join(' --> ') + '\n```');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Copy diagram image to clipboard',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Image copied.' }),
  ).toBeVisible();
  const dimensions = await page.evaluate(async () => {
    const bitmap = await createImageBitmap(
      await (await navigator.clipboard.read())[0].getType('image/png'),
    );
    return { width: bitmap.width, height: bitmap.height };
  });
  expect(dimensions.width).toBeLessThanOrEqual(8192);
  expect(dimensions.width * dimensions.height).toBeLessThanOrEqual(16_777_216);
});

test('image copy starts an activated clipboard write with promise-valued PNG data', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeClipboardItem = window.ClipboardItem;
    window.ClipboardItem = class extends NativeClipboardItem {
      constructor(data: Record<string, Blob | Promise<Blob>>) {
        super(data);
        (window as any).promiseImageData = data['image/png'] instanceof Promise;
      }
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          (window as any).writeWhileActivated =
            navigator.userActivation.isActive;
          const png = await items[0].getType('image/png');
          (window as any).copiedPngBytes = png.size;
        },
      },
    });
  });
  await page.goto('/');
  await page.locator('textarea').fill(diagram);
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Copy diagram image to clipboard',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Image copied.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => (window as any).writeWhileActivated)).toBe(
    true,
  );
  expect(await page.evaluate(() => (window as any).promiseImageData)).toBe(
    true,
  );
  expect(
    await page.evaluate(() => (window as any).copiedPngBytes),
  ).toBeGreaterThan(100);
});

// Regression: ISSUE-M7 — gstack phone capture measured the toolbar over the drawing.
// Found by /qa on 2026-11-07. Report: docs/qa/mermaid-repair-and-actions.md
test('small diagram controls do not cover the drawing', async ({ page }) => {
  await page.goto('/'); await page.locator('textarea').fill(diagram); await page.getByRole('tab', { name:'Preview' }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  const bounds = await page.getByRole('button', { name:'Copy diagram image to clipboard', exact:true }).evaluate(button => {
    const toolbar = button.closest('[data-print-hide]')!.getBoundingClientRect();
    const drawing = document.querySelector('.mermaid-preview')!.getBoundingClientRect();
    return { toolbarBottom: toolbar.bottom, drawingTop: drawing.top };
  });
  expect(bounds.toolbarBottom).toBeLessThanOrEqual(bounds.drawingTop);
});
