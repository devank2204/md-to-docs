import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToHtml, renderToDocxBlob, renderToClipboardHtml } from '@mdtodocs/renderers';
import pc from 'picocolors';

const FIXTURES_DIR = new URL('../fixtures', import.meta.url).pathname;

async function runFixtures() {
  const dirs = await fs.readdir(FIXTURES_DIR);
  let passed = 0;
  let failed = 0;
  let generated = 0;

  console.log(pc.cyan('\nStarting mdtodocs Fidelity Lab...\n'));

  for (const dir of dirs) {
    const fixturePath = path.join(FIXTURES_DIR, dir);
    const stat = await fs.stat(fixturePath);
    if (!stat.isDirectory()) continue;

    process.stdout.write(`Fixture ${pc.bold(dir)}... `);

    try {
      const inputPath = path.join(fixturePath, 'input.md');
      const expectedIrPath = path.join(fixturePath, 'expected-ir.json');
      const outputDir = path.join(fixturePath, '.output');

      const markdown = await fs.readFile(inputPath, 'utf-8');

      // 1. Parse to Document IR
      const doc = parseMarkdown(markdown);
      const actualIr = JSON.stringify(doc, null, 2);

      // Ensure output dir exists
      await fs.mkdir(outputDir, { recursive: true });

      // 2. Validate IR matches expected
      let irMatches = false;
      try {
        const expectedIr = await fs.readFile(expectedIrPath, 'utf-8');
        if (expectedIr.trim() === actualIr.trim()) {
          irMatches = true;
        } else {
          await fs.writeFile(path.join(outputDir, 'actual-ir.json'), actualIr);
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // Auto-generate expected IR if it doesn't exist
          await fs.writeFile(expectedIrPath, actualIr);
          console.log(pc.yellow('GENERATED EXPECTED IR'));
          generated++;
          // Continue to render outputs even when generating
        } else {
          throw err;
        }
      }

      // 3. Render all destinations
      const html = renderToHtml(doc);
      await fs.writeFile(path.join(outputDir, 'preview.html'), wrapHtml(html, 'Preview'));

      const clipboardHtml = renderToClipboardHtml(doc);
      await fs.writeFile(path.join(outputDir, 'clipboard.html'), wrapHtml(clipboardHtml, 'Clipboard'));

      const docxBlob = await renderToDocxBlob(doc);
      const buffer = Buffer.from(await docxBlob.arrayBuffer());
      await fs.writeFile(path.join(outputDir, 'document.docx'), buffer);

      if (generated > 0 && !irMatches) {
        // Already counted as generated
      } else if (irMatches) {
        console.log(pc.green('PASS'));
        passed++;
      } else {
        console.log(pc.red('FAIL (IR Mismatch)'));
        failed++;
      }
    } catch (e: any) {
      console.log(pc.red(`ERROR: ${e.message}`));
      failed++;
    }
  }

  console.log('\n---');
  console.log(`Passed: ${pc.green(String(passed))} | Failed: ${pc.red(String(failed))} | Generated: ${pc.yellow(String(generated))}`);

  if (failed > 0) {
    process.exit(1);
  }
}

function wrapHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>mdtodocs Fidelity Lab – ${title}</title>
  <style>
    body { font-family: 'Newsreader', Georgia, serif; max-width: 816px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { font-family: 'Newsreader', Georgia, serif; }
    code, pre { font-family: 'JetBrains Mono', Consolas, monospace; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

runFixtures().catch(err => {
  console.error(err);
  process.exit(1);
});
