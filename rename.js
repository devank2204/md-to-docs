const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.git' || f === 'dist') return;
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(__dirname, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.json') || filePath.endsWith('.yaml') || filePath.endsWith('.md') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace scope
    content = content.replace(/@folio\//g, '@mdtodocs/');
    
    // Replace exact cases
    content = content.replace(/\bFOLIO\b/g, 'mdtodocs.com');
    content = content.replace(/\bFolio\b/g, 'Mdtodocs');
    content = content.replace(/\bfolio\b/g, 'mdtodocs');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});
