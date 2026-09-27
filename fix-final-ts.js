const fs = require('fs');

function fixClipboard() {
  const file = 'packages/renderers/src/clipboard.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replaceAll('ctx.theme.colors.callouts[type]', 'ctx.theme.colors.callouts[type as keyof typeof ctx.theme.colors.callouts]');
  content = content.replaceAll('block.data?.resolvedAsset as ResolvedAsset', '(block.data as any)?.resolvedAsset as ResolvedAsset');
  content = content.replaceAll('inline.data?.resolvedAsset as ResolvedAsset', '(inline.data as any)?.resolvedAsset as ResolvedAsset');
  fs.writeFileSync(file, content);
}

function fixDocx() {
  const file = 'packages/renderers/src/docx.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replaceAll('ctx.theme.colors.callouts[type]', 'ctx.theme.colors.callouts[type as keyof typeof ctx.theme.colors.callouts]');
  content = content.replaceAll('block.data?.resolvedAsset as ResolvedAsset', '(block.data as any)?.resolvedAsset as ResolvedAsset');
  content = content.replaceAll('inline.data?.resolvedAsset as ResolvedAsset', '(inline.data as any)?.resolvedAsset as ResolvedAsset');
  content = content.replaceAll('let level: HeadingLevel;', 'let level: any;');
  content = content.replaceAll(') as DocxInlineNode[]', ').flat() as DocxInlineNode[]');
  fs.writeFileSync(file, content);
}

fixClipboard();
fixDocx();
