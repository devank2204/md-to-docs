import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`incumbent home typography and wordmark are preserved at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const heading = page.getByRole('heading', {
      name: 'Markdown to Docs',
      exact: true,
    });
    const description = page.getByText(
      'Paste Markdown or drop a file. Diagrams, tables, and formatting convert cleanly to Google Docs, Word, and PDF.',
      { exact: true },
    );
    await expect(heading).toBeVisible();
    await expect(description).toBeVisible();
    const headingStyle = await heading.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        family: style.fontFamily,
        weight: style.fontWeight,
        style: style.fontStyle,
        size: style.fontSize,
        lineHeight: style.lineHeight,
        tracking: style.letterSpacing,
      };
    });
    const bodyStyle = await description.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        family: style.fontFamily,
        weight: style.fontWeight,
        style: style.fontStyle,
        size: style.fontSize,
        lineHeight: style.lineHeight,
        tracking: style.letterSpacing,
      };
    });
    expect(headingStyle.family).toBe('Newsreader, serif');
    expect(headingStyle).toMatchObject({
      weight: '500',
      style: 'normal',
      size: width < 640 ? '30px' : '48px',
      lineHeight: width < 640 ? '37.5px' : '48px',
      tracking: width < 640 ? '-0.75px' : '-1.2px',
    });
    expect(bodyStyle.family).toBe('Newsreader, serif');
    expect(bodyStyle).toMatchObject({
      weight: '400',
      style: 'normal',
      size: width < 640 ? '16px' : '18px',
      lineHeight: width < 640 ? '26px' : '28px',
      tracking: 'normal',
    });
    await expect(heading.locator('em')).toHaveCount(0);
    const brand = page.getByText('mdtodocs', { exact: true }).first();
    const brandStyle = await brand.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        family: style.fontFamily,
        size: style.fontSize,
        weight: style.fontWeight,
        lineHeight: style.lineHeight,
        tracking: style.letterSpacing,
      };
    });
    expect(brandStyle.family).toContain('JetBrains Mono');
    expect(brandStyle).toMatchObject({
      size: '14px',
      weight: '600',
      lineHeight: '22px',
      tracking: '-0.7px',
    });
    await expect(page.getByText('.com', { exact: true }).first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/mobile/restored-home-${width}.png`,
    });
  });
}

test('desktop delivery keeps the incumbent control typography in cream and dark', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('textarea').first().fill('# Protected controls');
  const trigger = page.locator('header').getByRole('button', { name: 'Copy for Google Docs', exact: true });
  for (const appearance of ['cream', 'dark']) {
    await page.getByRole('button', { name: 'Change app appearance' }).click();
    await page.getByRole('combobox', { name: 'App appearance', exact: true }).selectOption(appearance);
    await page.getByRole('button', { name: 'Close App appearance', exact: true }).click();
    const actual = await trigger.evaluate(node => {
      const style = getComputedStyle(node);
      return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight, tracking: style.letterSpacing };
    });
    expect(actual.family).toContain('JetBrains Mono');
    expect(actual).toMatchObject({ size: '11px', weight: '500', lineHeight: '16px', tracking: 'normal' });
  }
});
