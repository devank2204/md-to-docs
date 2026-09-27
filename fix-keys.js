const fs = require('fs');

function fixKeys(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/any \/\* Math \*\/ *: /g, 'math: ');
  content = content.replace(/any \/\* ContainerDirective \*\/ *: /g, 'containerDirective: ');
  content = content.replace(/any \/\* InlineMath \*\/ *: /g, 'inlineMath: ');
  fs.writeFileSync(file, content);
}

fixKeys('packages/renderers/src/docx.ts');
fixKeys('packages/renderers/src/clipboard.ts');
