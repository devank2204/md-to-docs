import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import { renderToDocxBlob, renderToClipboardHtml } from '@mdtodocs/renderers';
import pc from 'picocolors';

const require = createRequire(import.meta.url);
const docxPath = require.resolve('docx', { paths: [path.dirname(require.resolve('@mdtodocs/renderers'))] });
const jszipPath = require.resolve('jszip', { paths: [docxPath] });
const JSZip = require(jszipPath);

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));
const OUTPUT_BASE_DIR = process.env.FIDELITY_OUTPUT_DIR || path.join(os.tmpdir(), 'mdtodocs-fidelity-output');
const isUpdateMode = process.argv.includes('--update') || process.argv.includes('-u');

export interface AssertionFailure {
  fixture: string;
  assertion: string;
  expected: string;
  actual: string;
  artifactPath?: string;
}

interface FixtureResult {
  fixture: string;
  passed: boolean;
  generated: boolean;
  failures: AssertionFailure[];
}

export function wrapHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>mdtodocs Fidelity Lab - ${title}</title>
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

export async function runFixtures(): Promise<{ total: number; passed: number; failed: number; generated: number; failures: AssertionFailure[] }> {
  const dirs = (await fs.readdir(FIXTURES_DIR)).sort();
  let passedCount = 0;
  let failedCount = 0;
  let generatedCount = 0;
  const allFailures: AssertionFailure[] = [];

  console.log(pc.cyan('\nStarting mdtodocs Fidelity Lab...\n'));
  console.log(pc.dim(`Fixtures source: ${FIXTURES_DIR}`));
  console.log(pc.dim(`Isolated output: ${OUTPUT_BASE_DIR}`));
  console.log(pc.dim(`Update mode:     ${isUpdateMode ? 'ENABLED (--update)' : 'DISABLED (safe non-mutating mode)'}\n`));

  // Ensure isolated output dir exists
  await fs.mkdir(OUTPUT_BASE_DIR, { recursive: true });

  for (const dir of dirs) {
    const fixturePath = path.join(FIXTURES_DIR, dir);
    const stat = await fs.stat(fixturePath);
    if (!stat.isDirectory()) continue;

    process.stdout.write(`Fixture ${pc.bold(dir)}... `);

    const fixtureResult = await executeFixture(dir, fixturePath);

    if (fixtureResult.generated) {
      generatedCount++;
      console.log(pc.yellow('GENERATED EXPECTED IR'));
    } else if (fixtureResult.passed) {
      passedCount++;
      console.log(pc.green('PASS'));
    } else {
      failedCount++;
      console.log(pc.red(`FAIL (${fixtureResult.failures.length} assertion ${fixtureResult.failures.length === 1 ? 'failure' : 'failures'})`));
      allFailures.push(...fixtureResult.failures);
    }
  }

  // Integration test: Mermaid resolved asset preservation & diagnostics
  process.stdout.write(`Assertion ${pc.bold('mermaid-asset-preservation')}... `);
  const mermaidAssetResult = await verifyMermaidAssetPreservation();
  if (mermaidAssetResult.passed) {
    passedCount++;
    console.log(pc.green('PASS'));
  } else {
    failedCount++;
    console.log(pc.red('FAIL'));
    allFailures.push(...mermaidAssetResult.failures);
  }

  // Explicit diagnostic reporting summary
  console.log('\n---');
  console.log(`Passed: ${pc.green(String(passedCount))} | Failed: ${pc.red(String(failedCount))} | Generated: ${pc.yellow(String(generatedCount))}`);

  if (allFailures.length > 0) {
    console.log(pc.red('\n================ DETAILED FAILURE REPORT ================\n'));
    for (const fail of allFailures) {
      console.log(pc.bold(pc.red(`[FAIL] Fixture: ${fail.fixture}`)));
      console.log(`  Assertion: ${pc.cyan(fail.assertion)}`);
      console.log(`  Expected:  ${fail.expected}`);
      console.log(`  Actual:    ${fail.actual}`);
      if (fail.artifactPath) {
        console.log(`  Artifact:  ${pc.dim(fail.artifactPath)}`);
      }
      console.log('');
    }
    console.log(pc.red('=========================================================\n'));
  }

  // Documented system limitations
  console.log(pc.dim('Note on DOCX: XML assertions verify valid Office Open XML structure and text, not pixel-perfect Word desktop rendering.'));
  console.log(pc.dim('Note on PDF:  Standalone headless PDF export is not implemented in CLI pipeline; PDF assertions are omitted.\n'));

  return {
    total: passedCount + failedCount,
    passed: passedCount,
    failed: failedCount,
    generated: generatedCount,
    failures: allFailures
  };
}

async function executeFixture(dir: string, fixturePath: string): Promise<FixtureResult> {
  const failures: AssertionFailure[] = [];
  const inputPath = path.join(fixturePath, 'input.md');
  const expectedIrPath = path.join(fixturePath, 'expected-ir.json');
  const outputDir = path.join(OUTPUT_BASE_DIR, dir);

  await fs.mkdir(outputDir, { recursive: true });

  let markdown = '';
  try {
    markdown = await fs.readFile(inputPath, 'utf-8');
  } catch (err: any) {
    failures.push({
      fixture: dir,
      assertion: 'Input Markdown Exists',
      expected: `input.md readable at ${inputPath}`,
      actual: err.message
    });
    return { fixture: dir, passed: false, generated: false, failures };
  }

  // 1. Parse markdown
  const doc = parseMarkdown(markdown);
  const actualIr = JSON.stringify(doc, null, 2);
  const actualIrPath = path.join(outputDir, 'actual-ir.json');
  await fs.writeFile(actualIrPath, actualIr);

  // 2. Validate IR matching
  let generated = false;
  let expectedIrContent: string | null = null;

  try {
    expectedIrContent = await fs.readFile(expectedIrPath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      if (isUpdateMode) {
        await fs.writeFile(expectedIrPath, actualIr);
        generated = true;
      } else {
        failures.push({
          fixture: dir,
          assertion: 'Golden Snapshot Existence',
          expected: `expected-ir.json exists at ${expectedIrPath}`,
          actual: 'File does not exist. Run test suite with --update to generate golden snapshot.',
          artifactPath: actualIrPath
        });
      }
    } else {
      failures.push({
        fixture: dir,
        assertion: 'Golden Snapshot Readability',
        expected: 'Readable JSON file',
        actual: err.message
      });
    }
  }

  if (expectedIrContent !== null) {
    if (expectedIrContent.trim() !== actualIr.trim()) {
      if (isUpdateMode) {
        await fs.writeFile(expectedIrPath, actualIr);
        generated = true;
      } else {
        failures.push({
          fixture: dir,
          assertion: 'Serialized AST matches expected-ir.json',
          expected: 'Serialized AST matching golden snapshot',
          actual: `AST differs from ${expectedIrPath}`,
          artifactPath: actualIrPath
        });
      }
    }
  }

  // 3. Render Clipboard HTML and assert structure
  let clipboardHtml = '';
  const clipboardHtmlPath = path.join(outputDir, 'clipboard.html');
  const previewHtmlPath = path.join(outputDir, 'preview.html');

  try {
    clipboardHtml = renderToClipboardHtml(doc);
    await fs.writeFile(clipboardHtmlPath, clipboardHtml);
    await fs.writeFile(previewHtmlPath, wrapHtml(clipboardHtml, `${dir} Preview`));

    // Assert clipboard HTML baseline properties
    if (!clipboardHtml || typeof clipboardHtml !== 'string') {
      failures.push({
        fixture: dir,
        assertion: 'Clipboard HTML Output',
        expected: 'Non-empty HTML string',
        actual: `Got: ${typeof clipboardHtml}`,
        artifactPath: clipboardHtmlPath
      });
    } else {
      assertClipboardHtmlStructure(dir, markdown, clipboardHtml, failures, clipboardHtmlPath);
    }
  } catch (err: any) {
    failures.push({
      fixture: dir,
      assertion: 'Clipboard HTML Rendering',
      expected: 'Successful HTML generation without throwing',
      actual: `Renderer error: ${err.message}`,
      artifactPath: clipboardHtmlPath
    });
  }

  // 4. Render DOCX and assert valid ZIP and XML structure
  const docxFilePath = path.join(outputDir, 'document.docx');
  try {
    const docxBlob = await renderToDocxBlob(doc);
    const buffer = Buffer.from(await docxBlob.arrayBuffer());
    await fs.writeFile(docxFilePath, buffer);

    await assertDocxStructure(dir, buffer, failures, docxFilePath);
  } catch (err: any) {
    failures.push({
      fixture: dir,
      assertion: 'DOCX Rendering and Package Generation',
      expected: 'Valid DOCX package generation without throwing',
      actual: `DOCX error: ${err.message}`,
      artifactPath: docxFilePath
    });
  }

  return {
    fixture: dir,
    passed: failures.length === 0,
    generated,
    failures
  };
}

function assertClipboardHtmlStructure(
  dir: string,
  markdown: string,
  html: string,
  failures: AssertionFailure[],
  artifactPath: string
): void {
  // Common container check
  if (!html.includes('<div style="max-width:800px;margin:0 auto;">')) {
    failures.push({
      fixture: dir,
      assertion: 'Root Container Structure',
      expected: 'HTML wrapped in standard centered container',
      actual: 'Root container wrapper div missing',
      artifactPath
    });
  }

  // Fixture-specific structural checks
  if (dir.includes('headings') || markdown.includes('# ')) {
    if (!html.includes('<h1') && !html.includes('<h2')) {
      failures.push({
        fixture: dir,
        assertion: 'Heading Semantic Elements',
        expected: 'HTML contains <h1> or <h2> elements',
        actual: 'No heading elements found',
        artifactPath
      });
    }
  }

  if (dir.includes('paragraphs')) {
    if (!html.includes('<p ')) {
      failures.push({
        fixture: dir,
        assertion: 'Paragraph Semantic Elements',
        expected: 'HTML contains <p> elements',
        actual: 'No paragraph elements found',
        artifactPath
      });
    }
  }

  if (dir.includes('lists') || dir.includes('nested-lists')) {
    if (!html.includes('<ul') && !html.includes('<ol')) {
      failures.push({
        fixture: dir,
        assertion: 'List Semantic Elements',
        expected: 'HTML contains <ul> or <ol> elements',
        actual: 'No list elements found',
        artifactPath
      });
    }
    if (!html.includes('<li')) {
      failures.push({
        fixture: dir,
        assertion: 'List Item Semantic Elements',
        expected: 'HTML contains <li> elements',
        actual: 'No list items found',
        artifactPath
      });
    }
  }

  if (dir.includes('links') && !dir.includes('inline')) {
    if (!html.includes('<a href=')) {
      failures.push({
        fixture: dir,
        assertion: 'Hyperlink Semantic Elements',
        expected: 'HTML contains <a href="..."> elements',
        actual: 'No anchor links found',
        artifactPath
      });
    }
  }

  if (dir.includes('blockquotes')) {
    if (!html.includes('<blockquote')) {
      failures.push({
        fixture: dir,
        assertion: 'Blockquote Semantic Elements',
        expected: 'HTML contains <blockquote> elements',
        actual: 'No blockquote elements found',
        artifactPath
      });
    }
  }

  if (dir.includes('code-blocks')) {
    if (!html.includes('<pre') || !html.includes('<code')) {
      failures.push({
        fixture: dir,
        assertion: 'Code Block Semantic Elements',
        expected: 'HTML contains <pre> and <code> elements',
        actual: 'Missing pre or code elements',
        artifactPath
      });
    }
  }

  if (dir.includes('tables')) {
    if (!html.includes('<table') || !html.includes('<tr') || (!html.includes('<td') && !html.includes('<th'))) {
      failures.push({
        fixture: dir,
        assertion: 'Table Semantic Elements',
        expected: 'HTML contains <table>, <tr>, <th>, and <td> elements',
        actual: 'Incomplete table elements in output',
        artifactPath
      });
    }
  }

  if (dir.includes('inline-formatting')) {
    if (!html.includes('<strong') || !html.includes('<em') || !html.includes('<code')) {
      failures.push({
        fixture: dir,
        assertion: 'Inline Formatting Semantic Elements',
        expected: 'HTML contains strong, em, and code tags',
        actual: 'Missing inline formatted tags',
        artifactPath
      });
    }
  }

  if (dir.includes('callouts')) {
    const hasCallout = html.includes('Note') || html.includes('Warning') || html.includes('Tip') || html.includes('Important');
    if (!hasCallout) {
      failures.push({
        fixture: dir,
        assertion: 'Callout Semantic Representation',
        expected: 'HTML contains callout labels (Note, Warning, Tip, Important)',
        actual: 'Callout text or styling missing',
        artifactPath
      });
    }
  }

  if (dir.includes('images')) {
    if (!html.includes('<img src=')) {
      failures.push({
        fixture: dir,
        assertion: 'Image Tag Semantic Elements',
        expected: 'HTML contains <img src="..."> elements',
        actual: 'No img tags found',
        artifactPath
      });
    }
  }

  if (dir.includes('math-expressions')) {
    if (!html.includes('<math') && !html.includes('katex')) {
      failures.push({
        fixture: dir,
        assertion: 'Math Formula Semantic Elements',
        expected: 'HTML contains MathML (<math>) or KaTeX elements',
        actual: 'No math formula elements found',
        artifactPath
      });
    }
  }
}

async function assertDocxStructure(
  dir: string,
  buffer: Buffer,
  failures: AssertionFailure[],
  artifactPath: string
): Promise<void> {
  // 1. Assert PKZIP signature
  if (buffer.length < 500) {
    failures.push({
      fixture: dir,
      assertion: 'DOCX Buffer Size',
      expected: 'Buffer size > 500 bytes',
      actual: `Buffer size is ${buffer.length} bytes`,
      artifactPath
    });
    return;
  }

  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (!isZip) {
    failures.push({
      fixture: dir,
      assertion: 'DOCX PKZIP Format Header',
      expected: 'File begins with PKZIP magic bytes (0x50, 0x4B, 0x03, 0x04)',
      actual: `Header bytes: ${buffer.subarray(0, 4).toString('hex')}`,
      artifactPath
    });
    return;
  }

  // 2. Unzip and verify internal Office Open XML parts
  try {
    const zip = await JSZip.loadAsync(buffer);

    const contentTypesFile = zip.file('[Content_Types].xml');
    if (!contentTypesFile) {
      failures.push({
        fixture: dir,
        assertion: 'DOCX [Content_Types].xml Presence',
        expected: 'Archive contains [Content_Types].xml',
        actual: 'Missing [Content_Types].xml',
        artifactPath
      });
    }

    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      failures.push({
        fixture: dir,
        assertion: 'DOCX word/document.xml Presence',
        expected: 'Archive contains word/document.xml',
        actual: 'Missing word/document.xml',
        artifactPath
      });
      return;
    }

    const docXml = await docXmlFile.async('text');

    // 3. Document XML structural assertions
    if (!docXml.includes('<w:document') || !docXml.includes('<w:body>')) {
      failures.push({
        fixture: dir,
        assertion: 'DOCX Document XML Root and Body',
        expected: 'XML contains <w:document> and <w:body>',
        actual: 'Malformed document.xml structure',
        artifactPath
      });
    }

    // Fixture-specific structural assertions inside document.xml
    if (dir.includes('tables')) {
      if (!docXml.includes('<w:tbl>') || !docXml.includes('<w:tr>') || !docXml.includes('<w:tc>')) {
        failures.push({
          fixture: dir,
          assertion: 'DOCX Table XML Elements',
          expected: 'word/document.xml contains <w:tbl>, <w:tr>, <w:tc>',
          actual: 'Table XML tags missing in document.xml',
          artifactPath
        });
      }
    }

    if (dir.includes('code-blocks')) {
      if (!docXml.includes('CodeBlock')) {
        failures.push({
          fixture: dir,
          assertion: 'DOCX Code Block Style',
          expected: 'word/document.xml contains CodeBlock style reference',
          actual: 'CodeBlock style missing in document.xml',
          artifactPath
        });
      }
    }

    if (dir.includes('lists') || dir.includes('nested-lists')) {
      if (!docXml.includes('<w:numPr>')) {
        failures.push({
          fixture: dir,
          assertion: 'DOCX Numbering Properties',
          expected: 'word/document.xml contains <w:numPr> list numbering references',
          actual: 'List numbering missing in document.xml',
          artifactPath
        });
      }
    }

    if (dir.includes('inline-formatting')) {
      if (!docXml.includes('<w:b/>') || !docXml.includes('<w:i/>')) {
        failures.push({
          fixture: dir,
          assertion: 'DOCX Bold and Italic XML Runs',
          expected: 'word/document.xml contains <w:b/> and <w:i/>',
          actual: 'Bold or italic formatting tags missing in document.xml',
          artifactPath
        });
      }
    }

    if (dir.includes('math-expressions')) {
      if (!docXml.includes('Cambria Math')) {
        failures.push({
          fixture: dir,
          assertion: 'DOCX Math Typography Font',
          expected: 'word/document.xml contains Cambria Math font run',
          actual: 'Cambria Math font missing in document.xml',
          artifactPath
        });
      }
    }

  } catch (err: any) {
    failures.push({
      fixture: dir,
      assertion: 'DOCX Archive Inspection',
      expected: 'Readable ZIP archive with Office Open XML structure',
      actual: `ZIP parsing error: ${err.message}`,
      artifactPath
    });
  }
}

async function verifyMermaidAssetPreservation(): Promise<{ passed: boolean; failures: AssertionFailure[] }> {
  const failures: AssertionFailure[] = [];

  try {
    // Construct an AST with a resolved SVG asset attached to a mermaid node
    const testSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="blue"/></svg>';
    const svgBase64 = Buffer.from(testSvg).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

    const syntheticDoc: any = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'mermaid',
          value: 'flowchart TD\n  A --> B',
          data: {
            resolvedAsset: {
              type: 'svg',
              data: dataUri,
              raw: testSvg,
              mimeType: 'image/svg+xml',
              dimensions: { width: 100, height: 50 }
            },
            renderStatus: 'success'
          }
        }
      ]
    };

    // Assert clipboard HTML renders the resolved image
    const html = renderToClipboardHtml(syntheticDoc);
    if (!html.includes(`<img src="${dataUri}"`)) {
      failures.push({
        fixture: 'mermaid-asset-preservation',
        assertion: 'Mermaid Resolved Asset in Clipboard HTML',
        expected: 'HTML contains <img src="data:image/svg+xml;base64,...">',
        actual: 'Resolved image data URI missing in clipboard HTML output'
      });
    }

    // Assert DOCX renders ImageRun without error
    const docxBlob = await renderToDocxBlob(syntheticDoc);
    const buffer = Buffer.from(await docxBlob.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file('word/document.xml')?.async('text');

    if (!docXml || (!docXml.includes('<w:drawing>') && !docXml.includes('graphicData'))) {
      failures.push({
        fixture: 'mermaid-asset-preservation',
        assertion: 'Mermaid Resolved Asset in DOCX',
        expected: 'word/document.xml contains <w:drawing> image element',
        actual: 'No drawing/image element found in DOCX document.xml'
      });
    }
  } catch (err: any) {
    failures.push({
      fixture: 'mermaid-asset-preservation',
      assertion: 'Mermaid Pipeline Execution',
      expected: 'Preserves resolved asset without error',
      actual: err.message
    });
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

// Entrypoint
if (process.argv[1] && (process.argv[1].endsWith('runner.ts') || process.argv[1].endsWith('runner.js'))) {
  runFixtures().then(result => {
    if (result.failed > 0) {
      process.exit(1);
    }
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
