const fs = require('node:fs');
const path = require('node:path');
const ts = require(path.resolve(__dirname, '../apps/web/node_modules/typescript'));
const icons = new Set();
function values(expression) {
  if (!expression) return;
  if (ts.isStringLiteral(expression)) icons.add(expression.text);
  else if (ts.isConditionalExpression(expression)) {
    values(expression.whenTrue);
    values(expression.whenFalse);
  } else if (ts.isParenthesizedExpression(expression)) values(expression.expression);
}
function scan(directory) {
  for (const name of fs.readdirSync(directory)) {
    const file = path.join(directory, name);
    if (fs.statSync(file).isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(name)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.getText(source).includes('material-symbols-outlined')) {
        for (const child of node.children) {
          if (ts.isJsxText(child) && /^[a-z][a-z_0-9]*$/.test(child.text.trim())) icons.add(child.text.trim());
          if (ts.isJsxExpression(child)) values(child.expression);
        }
      }
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'icon') values(node.initializer);
      if (ts.isJsxAttribute(node) && node.name.getText(source) === 'icon') {
        if (node.initializer && ts.isJsxExpression(node.initializer)) values(node.initializer.expression);
        else values(node.initializer);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
scan(path.resolve(__dirname, '../apps/web/src'));
const config = fs.readFileSync(path.resolve(__dirname, '../apps/web/materialSymbols.ts'), 'utf8');
const configured = new Set(JSON.parse(config.match(/= (\[[\s\S]*?\]) as const/)[1]));
const missing = [...icons].filter(icon => !configured.has(icon));
if (missing.length) {
  console.error('Add these existing-family glyphs to materialSymbols.ts:', missing);
  process.exitCode = 1;
} else console.log('All', icons.size, 'referenced Material Symbols are included.');
