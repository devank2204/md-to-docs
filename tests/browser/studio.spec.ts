import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

async function target(page: Page, name: string) {
  await page.getByRole('button', { name: /^Save as / }).click();
  await page.getByRole('dialog').getByRole('button', { name }).click();
}
const table =
  '| A | B | C | D | E | F | G | H | I |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |\n';

for (const width of [390, 1440]) {
  test(`appearance is persistent and independent of prepared output at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const title = page.getByRole('heading', {
      name: 'Markdown to Docs',
      exact: true,
    });
    const before = await title.evaluate((node) => {
      const s = getComputedStyle(node);
      return [
        s.fontFamily,
        s.fontSize,
        s.fontWeight,
        s.lineHeight,
        s.letterSpacing,
        s.fontStyle,
      ];
    });
    if (width < 1024)
      await page.getByRole('button', { name: 'Document options' }).click();
    if (width >= 1024)
      await page.getByRole('button', { name: 'Change app appearance' }).click();
    await page
      .getByRole('combobox', { name: 'App appearance', exact: true })
      .selectOption('dark');
    await page.getByRole('button', { name: /^Close / }).click();
    if (width < 1024) {
      const contrast = await page
        .locator('.mobile-primary:disabled')
        .evaluate((node) => {
          const style = getComputedStyle(node);
          const luminance = (color: string) => {
            const channels = color
              .match(/\d+/g)!
              .slice(0, 3)
              .map((value) => {
                const c = Number(value) / 255;
                return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
              });
            return (
              channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
            );
          };
          const values = [
            luminance(style.color),
            luminance(style.backgroundColor),
          ].sort((a, b) => a - b);
          return (values[1] + 0.05) / (values[0] + 0.05);
        });
      expect(contrast).toBeGreaterThan(4.5);
    }
    await expect(page.locator('html')).toHaveAttribute(
      'data-appearance',
      'dark',
    );
    expect(
      await title.evaluate((node) => {
        const s = getComputedStyle(node);
        return [
          s.fontFamily,
          s.fontSize,
          s.fontWeight,
          s.lineHeight,
          s.letterSpacing,
          s.fontStyle,
        ];
      }),
    ).toEqual(before);
    await page
      .locator('textarea')
      .first()
      .fill('# Appearance independent\n\nExact output.');
    if (width >= 1024) {
      await page
        .getByRole('button', { name: 'Copy for Google Docs', exact: true })
        .click();
      await page
        .getByRole('dialog')
        .getByRole('combobox', { name: 'Save as', exact: true })
        .selectOption('html');
    } else await target(page, 'HTML');
    await page.getByRole('button', { name: 'Prepare HTML file' }).click();
    await expect(
      page
        .locator('.mobile-export')
        .getByRole('button', { name: 'Download .html', exact: true }),
    ).toBeVisible();
    const firstDownload = page.waitForEvent('download');
    await page
      .locator('.mobile-export')
      .getByRole('button', { name: 'Download .html', exact: true })
      .click();
    const html = await readFile((await (await firstDownload).path())!, 'utf8');
    expect(html).toContain('Appearance independent');
    expect(html).not.toContain('data-appearance');
    if (width >= 1024)
      await page.getByRole('button', { name: /^Close / }).click();
    else await page.getByRole('button', { name: 'Document options' }).click();
    if (width >= 1024)
      await page.getByRole('button', { name: 'Change app appearance' }).click();
    await page
      .getByRole('combobox', { name: 'App appearance', exact: true })
      .selectOption('cream');
    await page.getByRole('button', { name: /^Close / }).click();
    if (width >= 1024)
      await page
        .locator('header')
        .getByRole('button', { name: 'Download .html', exact: true })
        .click();
    // Changing chrome appearance must retain the already prepared artifact.
    await expect(
      page
        .locator('.mobile-export')
        .getByRole('button', { name: 'Download .html', exact: true }),
    ).toBeVisible();
    await page
      .locator('.mobile-export')
      .getByRole('button', { name: 'Download .html', exact: true })
      .isEnabled();
    const secondDownload = page.waitForEvent('download');
    await page
      .locator('.mobile-export')
      .getByRole('button', { name: 'Download .html', exact: true })
      .click();
    expect(
      await readFile((await (await secondDownload).path())!, 'utf8'),
    ).toEqual(html);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute(
      'data-appearance',
      'cream',
    );
  });
}

test('system appearance follows OS changes without changing document paper', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Document options' }).click();
  await page
    .getByRole('combobox', { name: 'App appearance', exact: true })
    .selectOption('system');
  await page.getByRole('button', { name: /^Close / }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
  await page.locator('textarea').fill('# White paper');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('[data-document-paper]')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute(
    'data-appearance',
    'cream',
  );
});

test('desktop delivery discards stale source and downloads the latest real DOCX', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('textarea').first().fill('# Old source');
  await page
    .getByRole('button', { name: 'Copy for Google Docs', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Save as', exact: true })
    .selectOption('word');
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('button', { name: 'Download .docx', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Close / }).click();
  await page
    .getByRole('textbox', { name: 'Markdown text' })
    .fill('# Latest source');
  await page
    .getByRole('button', { name: 'Download .docx', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Prepare Word document' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Download .docx', exact: true })
    .click();
  const zip = await JSZip.loadAsync(
    await readFile((await (await download).path())!),
  );
  const xml = await zip.file('word/document.xml')!.async('string');
  expect(xml).toContain('Latest source');
  expect(xml).not.toContain('Old source');
});

test('duplicate wide tables link to exact source; fixes are previewed and undoable', async ({
  page,
}) => {
  const source = '# Review\n\n' + table + '\n## Second table\n\n' + table;
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await expect(
    page.getByRole('button', { name: /formatting notes · Review/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /formatting notes · Review/ }).click();
  const edits = page.getByRole('button', { name: /Edit source · line/ });
  await expect(edits).toHaveCount(2);
  await edits.last().click();
  const selection = await page
    .locator('textarea')
    .evaluate((node: HTMLTextAreaElement) => [
      node.selectionStart,
      node.selectionEnd,
    ]);
  expect(selection[0]).toBe(source.lastIndexOf(table));
  expect(source.slice(selection[0], selection[1])).toBe(table.trimEnd());
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page
    .getByRole('button', { name: /Review formatting at line/ })
    .last()
    .click();
  await page
    .getByRole('button', { name: 'Preview fix for this rule' })
    .last()
    .click();
  await expect(
    page.getByText('Proposed source', { exact: true }),
  ).toBeVisible();
  // Source remains unchanged until the explicit apply action.
  await expect(page.locator('textarea')).toHaveValue(source);
  await page.getByRole('button', { name: 'Apply reviewed change' }).click();
  await expect(page.locator('textarea')).not.toHaveValue(source);
  await page.getByRole('button', { name: 'Undo reviewed change' }).click();
  await expect(page.locator('textarea')).toHaveValue(source);
});

test('print snapshot invalidates on source edits and excludes application chrome', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('textarea').fill('# Snapshot one\n\n$$x^2$$');
  await target(page, 'PDF');
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Print / Save as PDF' }),
  ).toBeVisible();
  let frame = page.frameLocator('[data-print-snapshot]');
  await expect(frame.locator('body')).toContainText('Snapshot one');
  await expect(frame.locator('.katex')).toHaveCount(1);
  await expect(frame.locator('button, textarea, header')).toHaveCount(0);
  await page.locator('textarea').fill('# Snapshot two');
  await expect(page.locator('[data-print-snapshot]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open Print / Save as PDF' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Print / Save as PDF' }),
  ).toBeVisible();
  frame = page.frameLocator('[data-print-snapshot]');
  await expect(frame.locator('body')).toContainText('Snapshot two');
  await expect(frame.locator('body')).not.toContainText('Snapshot one');
});

test('canceling preparation cannot publish a late result or revive old content', async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/held-figure.png', async (route) => {
    await held;
    await route.fulfill({ status: 404, body: '' }).catch(() => {});
  });
  await page.goto('/');
  await target(page, 'PDF');
  await page
    .locator('textarea')
    .fill('# Held source\n\n![Figure](/held-figure.png)');
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Cancel preparation', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Preparation canceled');
  await page.locator('textarea').fill('# Replacement source');
  release();
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Print / Save as PDF' }),
  ).toBeVisible();
  await expect(page.locator('[data-print-snapshot]')).toHaveCount(1);
  await expect(
    page.frameLocator('[data-print-snapshot]').locator('body'),
  ).toContainText('Replacement source');
  await expect(
    page.frameLocator('[data-print-snapshot]').locator('body'),
  ).not.toContainText('Held source');
});

test('an unavailable print image fails recoverably instead of claiming readiness', async ({
  page,
}) => {
  await page.route('**/missing-figure.png', (route) =>
    route.fulfill({ status: 404, body: '' }),
  );
  await page.goto('/');
  await page
    .locator('textarea')
    .fill('# Keep my text\n\n![Figure](/missing-figure.png)');
  await target(page, 'PDF');
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Could not prepare');
  await expect(page.locator('textarea')).toHaveValue(
    '# Keep my text\n\n![Figure](/missing-figure.png)',
  );
  await expect(page.locator('[data-print-snapshot]')).toHaveCount(0);
  await page.locator('textarea').fill('# Keep my text');
  await page
    .getByRole('button', { name: 'Print / Save as PDF', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Print / Save as PDF' }),
  ).toBeVisible();
});
