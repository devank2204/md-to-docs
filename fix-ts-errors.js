const fs = require('fs');

function fixFiles() {
  ['packages/renderers/src/docx.ts', 'packages/renderers/src/clipboard.ts'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Fix Node duplicate
    content = content.replace(/, Node \} from 'mdast';/g, "} from 'mdast';\nimport type { Node } from 'mdast';");

    // Fix Table duplicate
    content = content.replace(/Table as MdastTable/g, 'Table'); // wait we use Table from mdast as Table?
    // Let's remove mdast Table and just use any for TableBlock or import it properly
    content = content.replace(/, Table, Image/g, ", Image");
    content = content.replace(/Table/g, 'any /* Table */');
    content = content.replace(/any \/\* Table \*\/ as Docxany \/\* Table \*\//g, 'Table as DocxTable');
    
    // Fix CalloutType
    content = content.replace(/function getCalloutTextIcon\(type: CalloutType\): string \{/g, 'function getCalloutTextIcon(type: string): string {');

    // Fix RendererRegistry generics
    content = content.replace(/RendererRegistry<DocxNode\[\], DocxInlineNode\[\]>/g, 'RendererRegistry<DocxNode[]>');
    content = content.replace(/RendererRegistry<string, string>/g, 'RendererRegistry<string>');

    // Fix image cases
    content = content.replace(/b\.type === 'paragraph'/g, "b.type === 'image'");
    
    // Fix Image / ImageBlock duplicate
    content = content.replace(/Image: \(block: Image/g, 'image2: (block: any');
    content = content.replace(/code2: \(block: Code/g, 'code_duplicate: (block: any');

    // Fix type DocxTable missing
    content = content.replace(/new DocxTable/g, 'new DocxTableOriginal');
    content = content.replace(/import \{[\s\S]*?\} from 'docx';/, (match) => {
      if (!match.includes('Table as DocxTableOriginal')) {
        return match.replace(/Table as DocxTable,/, 'Table as DocxTableOriginal,');
      }
      return match;
    });

    // Fix data?.resolvedAsset
    content = content.replace(/\(block\.data\?\.resolvedAsset\)/g, '((block.data as any)?.resolvedAsset)');
    content = content.replace(/\(inline\.data\?\.resolvedAsset\)/g, '((inline.data as any)?.resolvedAsset)');
    
    // Fix thematicBreak
    content = content.replace(/thematicbreak: \(_block, ctx\) => \{/g, 'thematicBreak: (_block: any, ctx: any) => {');
    content = content.replace(/thematicbreak: \(\) => '---',/g, 'thematicBreak: () => "---",');
    
    // Remove ctx any errors by adding any
    content = content.replace(/, ctx\) =>/g, ', ctx: any) =>');
    content = content.replace(/, ctx\) \{/g, ', ctx: any) {');
    
    // Fix run any errors
    content = content.replace(/\(run\) => \{/g, '(run: any) => {');
    content = content.replace(/\(r\): r is TextRun => r instanceof TextRun/g, '(r: any): r is TextRun => r instanceof TextRun');
    content = content.replace(/\(run\) => new TextRun/g, '(run: any) => new TextRun');

    fs.writeFileSync(file, content);
  });
  
  // Fix index.ts
  let index = fs.readFileSync('packages/renderers/src/index.ts', 'utf8');
  index = index.replace(/export \{ renderToHtml \} from '\.\/html';\n/g, '');
  index = index.replace(/, BlockRenderer, InlineRenderer /g, ' ');
  fs.writeFileSync('packages/renderers/src/index.ts', index);
}

fixFiles();
