import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import JSZip from 'jszip';

async function enter(
  page: Page,
  content = '# My document\n\nA useful paragraph.',
) {
  await page.goto('/');
  await page.locator('textarea').first().fill(content);
}
async function target(page: Page, label: string) {
  await page.getByRole('button', { name: /^Save as / }).click();
  await page.getByRole('dialog').getByRole('button', { name: label }).click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test('first character keeps input mounted and focused; no automatic library overlay', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Markdown to Docs', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const editor = page.getByRole('textbox', { name: 'Markdown text' });
  await editor.pressSequentially('Hello mobile');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Hello mobile');
  await noOverflow(page);
});

test('paste permission denial offers native paste without losing text', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText: () => Promise.reject(new Error('denied')) },
    }),
  );
  await enter(page);
  await page.getByRole('button', { name: 'Paste text', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Touch and hold' }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toBeFocused();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue(/My document/);
});

test('route default applies once; later destination selection survives typing and reload uses route', async ({
  page,
}) => {
  await page.goto('/markdown-to-word');
  await expect(
    page.getByRole('button', { name: 'Prepare Word document' }),
  ).toBeVisible();
  await target(page, 'Google Docs');
  await page
    .getByRole('textbox', { name: 'Markdown text' })
    .fill('# Still Google Docs');
  await expect(
    page.getByRole('button', { name: 'Prepare for Google Docs' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Prepare Word document' }),
  ).toBeVisible();
});

test('tabs preserve text and input selection, sheets trap focus and restore trigger', async ({
  page,
}) => {
  await enter(page);
  const editor = page.getByRole('textbox', { name: 'Markdown text' });
  await editor.evaluate((node: HTMLTextAreaElement) =>
    node.setSelectionRange(3, 7),
  );
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(
    page
      .getByRole('tabpanel')
      .filter({ has: page.locator('[data-preview-pane]') }),
  ).toContainText('My document');
  await page.getByRole('tab', { name: 'Edit Markdown' }).click();
  expect(
    await editor.evaluate((node: HTMLTextAreaElement) => node.selectionStart),
  ).toBe(3);
  const trigger = page.getByRole('button', { name: 'Open documents' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('dialog')),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('file import preserves existing text until a deliberate replacement, with history backup', async ({
  page,
}) => {
  await enter(page, '# Original document');
  await page.locator('input[type=file]').setInputFiles({
    name: 'import.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Imported document'),
  });
  await expect(page.getByRole('dialog')).toContainText(
    'Where should the new text go?',
  );
  await page.getByRole('button', { name: 'Replace current text' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('# Imported document');
  await page.getByRole('button', { name: 'Document options' }).click();
  await page
    .getByRole('button', { name: 'Version history', exact: true })
    .click();
  await page.getByRole('button', { name: /Before replacing text/ }).click();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('# Original document');
});

test('invalid and oversized imports leave the document untouched', async ({
  page,
}) => {
  await enter(page, '# Keep this');
  await page.locator('input[type=file]').setInputFiles({
    name: 'wrong.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('x,y'),
  });
  await expect(page.getByRole('status')).toContainText('Choose a .md');
  await page.locator('input[type=file]').setInputFiles({
    name: 'large.md',
    mimeType: 'text/markdown',
    buffer: Buffer.alloc(1_000_001, 'x'),
  });
  await expect(page.getByRole('status')).toContainText('smaller than 1 MB');
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('# Keep this');
});

test('prepared files invalidate on edit and DOCX contains the latest source', async ({
  page,
}) => {
  await enter(page, '# Older content');
  await target(page, 'Word document');
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  await expect(
    page.getByRole('button', { name: 'Download .docx', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Markdown text' })
    .fill('# Latest content\n\nFresh text exported immediately.');
  await expect(
    page.getByRole('button', { name: 'Download .docx', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download .docx', exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('Latest content.docx');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const zip = await JSZip.loadAsync(Buffer.concat(chunks));
  const xml = await zip.file('word/document.xml')!.async('string');
  expect(xml).toContain('Fresh text exported immediately.');
  expect(xml).not.toContain('Older content');
});

test('clipboard failure has explicit fallbacks and share cancel does not download', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: () => Promise.reject(new DOMException('cancel', 'AbortError')),
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });
  });
  await enter(page);
  await page.getByRole('button', { name: 'Prepare for Google Docs' }).click();
  await page
    .getByRole('button', { name: 'Copy for Google Docs', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await expect(
    page.getByRole('button', { name: 'Copy plain Markdown' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Use a Word file instead' }).click();
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  let downloads = 0;
  page.on('download', () => downloads++);
  await page
    .getByRole('button', { name: 'Share document', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Sharing canceled');
  expect(downloads).toBe(0);
  await expect(
    page.getByRole('button', { name: 'Download .docx', exact: true }),
  ).toBeVisible();
});

test('HTML is an explicit output option and print is labelled honestly', async ({
  page,
}) => {
  await enter(page);
  await target(page, 'HTML');
  await page.getByRole('button', { name: 'Prepare HTML file' }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download .html', exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.html$/);
  await target(page, 'PDF');
  await expect(
    page.getByRole('button', { name: 'Print / Save as PDF', exact: true }),
  ).toBeVisible();
});

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`layout remains usable at ${width}px with persisted sidebar preference`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 768 ? 390 : 844 });
    await page.addInitScript(() =>
      localStorage.setItem(
        'md-to-docs-storage',
        JSON.stringify({
          state: {
            markdown: '# Saved document',
            currentView: 'workspace',
            isSidebarOpen: true,
          },
          version: 0,
        }),
      ),
    );
    await enter(
      page,
      '# Long document title that should never push controls away\n\n| A | B |\n|---|---|\n| ' +
        'long'.repeat(80) +
        ' | cell |\n\n```js\n' +
        'code'.repeat(150) +
        '\n```',
    );
    if (width < 1024) {
      await page.getByRole('tab', { name: 'Preview' }).click();
      await expect(
        page.getByRole('button', { name: /^Save as / }),
      ).toBeInViewport();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    } else {
      await expect(page.locator('[data-editor-pane]')).toBeVisible();
      await expect(page.locator('[data-preview-pane]')).toBeVisible();
    }
    await noOverflow(page);
    await page.screenshot({ path: `artifacts/mobile/after-${width}.png` });
  });
}

test('hardware focus keeps actions visible, simulated soft keyboard makes room, Preview restores actions', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const viewport = new EventTarget() as EventTarget & { height: number };
    viewport.height = 844;
    Object.defineProperty(window, 'visualViewport', {
      value: viewport,
      configurable: true,
    });
    (window as any).setKeyboardHeight = (height: number) => {
      viewport.height = height;
      viewport.dispatchEvent(new Event('resize'));
    };
  });
  await enter(page);
  await page.getByRole('textbox', { name: 'Markdown text' }).focus();
  await expect(page.locator('.mobile-export')).toBeVisible();
  await page.evaluate(() => (window as any).setKeyboardHeight(480));
  await expect(page.locator('.mobile-export')).toBeHidden();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toBeInViewport();
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.mobile-export')).toBeVisible();
});

test('PDF prepares isolated content and reports only the print dialog outcome', async ({ page }) => {
  await enter(page, '# Print this document');
  await target(page, 'PDF');
  await page.getByRole('button', { name: 'Print / Save as PDF', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open Print / Save as PDF' })).toBeVisible();
  await expect(page.frameLocator('[data-print-snapshot]').locator('body')).toContainText('Print this document');
  await page.locator('[data-print-snapshot]').evaluate((frame: HTMLIFrameElement) => {
    frame.contentWindow!.print = () => { (window as any).printOpened = true; };
  });
  await page.getByRole('button', { name: 'Open Print / Save as PDF' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).printOpened)).toBe(true);
  await expect(page.getByRole('status')).toContainText('Print opened');
});

test('HTML preference survives reload at the root route', async ({ page }) => {
  await enter(page);
  await target(page, 'HTML');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Prepare HTML file' }),
  ).toBeVisible();
});

test('math and diagrams render at phone width, and invalid diagrams leave editing available', async ({
  page,
}) => {
  await enter(
    page,
    '# Technical notes\n\nInline math $E=mc^2$.\n\n```mermaid\nflowchart TD\n  A[Draft] --> B[Document]\n```',
  );
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole('button', {
      name: 'Inspect in Canvas Studio (Pan & Zoom)',
      exact: true,
    }),
  ).toBeEnabled();
  await noOverflow(page);
  await page.getByRole('tab', { name: 'Edit Markdown' }).click();
  await page
    .getByRole('textbox', { name: 'Markdown text' })
    .fill('```mermaid\nnot-a-diagram !!!\n```');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(
    page.getByText('Mermaid Syntax Error', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Edit Markdown' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toBeEditable();
});

test('a rejected native paste cannot bypass the size limit through the global paste listener', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Markdown text' })
    .evaluate((editor) => {
      const data = new DataTransfer();
      data.setData('text/plain', 'x'.repeat(1_000_001));
      editor.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('smaller document');
});

test('full browser storage does not break editing or falsely claim the draft was saved', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await enter(page, '# Still editable');
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('# Still editable');
  await expect(page.getByRole('alert')).toContainText(
    'Browser storage is unavailable or full',
  );
  await expect(
    page.getByText('Saved on this device', { exact: false }),
  ).toHaveCount(0);
  await target(page, 'Word document');
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  await expect(
    page.getByRole('button', { name: 'Download .docx', exact: true }),
  ).toBeVisible();
});

test('a double tap starts only one file download', async ({ page }) => {
  await enter(page);
  await target(page, 'Word document');
  await page.getByRole('button', { name: 'Prepare Word document' }).click();
  let downloads = 0;
  page.on('download', () => downloads++);
  await page
    .getByRole('button', { name: 'Download .docx', exact: true })
    .dblclick();
  await expect.poll(() => downloads).toBe(1);
  await expect(
    page.getByRole('button', { name: 'Download .docx', exact: true }),
  ).toBeEnabled();
  expect(downloads).toBe(1);
});

test('all six saved documents survive hydration without opening the desktop sidebar', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const documents = Array.from({ length: 6 }, (_, index) => ({
      id: `saved-${index}`,
      title: `Saved document ${index}`,
      content: `# Saved ${index}`,
      createdAt: index,
      updatedAt: index,
    }));
    localStorage.setItem(
      'md-to-docs-storage',
      JSON.stringify({
        state: {
          documents,
          activeDocumentId: 'saved-0',
          markdown: '# Saved 0',
          currentView: 'workspace',
          isSidebarOpen: true,
        },
        version: 0,
      }),
    );
  });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open documents' }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: /^Saved document/ }),
  ).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Saved document 5', exact: false })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Markdown text' }),
  ).toHaveValue('# Saved 5');
});
