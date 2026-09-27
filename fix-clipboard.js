const fs = require('fs');

function fixClipboard(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix `,` and `text:`
  content = content.replace(/  \,\n  \n    text:/g, "    text:");
  
  // Fix fallbackBlock -> fallbackNode for clipboard
  content = content.replace(/  fallbackBlock: \(\) => \'\',\n  fallbackInline: \(\) => \'\'/g, "  fallbackNode: () => ''");

  // Some types were not changed because of case mismatch: Code vs code
  content = content.replace(/Code: \(block: Code/g, "code: (block: Code");
  content = content.replace(/Math: \(block: Math/g, "math: (block: Math");
  content = content.replace(/Image: \(block: Image/g, "image: (block: Image");
  content = content.replace(/thematicbreak: \(\)/g, "thematicBreak: ()");
  
  // Also inline url issues
  content = content.replace(/inline\.src/g, 'inline.url');

  fs.writeFileSync(file, content);
}

fixClipboard('packages/renderers/src/clipboard.ts');
