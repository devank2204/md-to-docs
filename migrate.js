const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace compiler-core imports
  content = content.replace(
    /import type \{ FolioDocument[\s\S]*?\} from '@mdtodocs\/compiler-core';/,
    "import type { DocumentTheme } from '@mdtodocs/compiler-core';\n" +
    "import type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdTable, TableRow as MdTableRow, TableCell as MdTableCell, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';\n" +
    "import type { ResolvedAsset } from '@mdtodocs/asset-pipeline';"
  );
  
  // Docx specific imports to avoid collisions
  content = content.replace(/Table as DocxTable,/, 'Table as DocxTable,'); // no change needed
  content = content.replace(/import \{[\s\S]*?\} from 'docx';/, (m) => {
    if (!m.includes('Table as DocxTable')) {
      return m.replace('Table,', 'Table as DocxTable,');
    }
    return m;
  });

  // Replace type parameters and Registry
  content = content.replace(/FolioDocument/g, 'Root');
  content = content.replace(/RendererRegistry<DocxNode\[\], DocxInlineNode\[\]>/g, 'RendererRegistry<DocxNode[]>');
  content = content.replace(/RendererRegistry<string, string>/g, 'RendererRegistry<string>');
  
  // AST type replacements
  content = content.replace(/HeadingBlock/g, 'Heading');
  content = content.replace(/ParagraphBlock/g, 'Paragraph');
  content = content.replace(/ListBlock/g, 'List');
  content = content.replace(/BlockquoteBlock/g, 'Blockquote');
  content = content.replace(/CodeBlock/g, 'Code');
  content = content.replace(/TableBlock/g, 'MdTable');
  content = content.replace(/ImageBlock/g, 'Image');
  content = content.replace(/DiagramBlock/g, 'any /* Diagram */');
  content = content.replace(/MathBlock/g, 'any /* Math */');
  content = content.replace(/CalloutBlock/g, 'any /* ContainerDirective */');
  
  content = content.replace(/TextInline/g, 'Text');
  content = content.replace(/StrongInline/g, 'Strong');
  content = content.replace(/EmphasisInline/g, 'Emphasis');
  content = content.replace(/StrikeInline/g, 'Delete');
  content = content.replace(/LinkInline/g, 'Link');
  content = content.replace(/InlineImageInline/g, 'Image');
  content = content.replace(/InlineMath/g, 'any /* InlineMath */');

  // AST property replacements
  content = content.replace(/\.blocks/g, '.children');
  content = content.replace(/\.inlines/g, '.children');
  content = content.replace(/\.items/g, '.children');
  content = content.replace(/\.rows/g, '.children');
  content = content.replace(/\.cells/g, '.children');
  content = content.replace(/block\.level/g, 'block.depth');
  content = content.replace(/block\.language/g, 'block.lang');
  
  // Custom props
  content = content.replace(/block\.calloutType/g, '(block.attributes?.type || "note")');
  content = content.replace(/block\.headerRows/g, '1 /* headerRows */');
  content = content.replace(/block\.src/g, 'block.url');
  content = content.replace(/block\.renderStatus === 'error'/g, 'false /* renderStatus */');
  content = content.replace(/block\.diagramType/g, 'block.lang');
  content = content.replace(/block\.source/g, 'block.value');
  content = content.replace(/inline\.assetId/g, '((inline.data as any)?.resolvedAsset as ResolvedAsset)?.id');
  content = content.replace(/block\.assetId/g, '((block.data as any)?.resolvedAsset as ResolvedAsset)?.id');
  content = content.replace(/ctx\.assets\.find\(a => a\.id === /g, '([((inline.data as any)?.resolvedAsset as ResolvedAsset) || ((block.data as any)?.resolvedAsset as ResolvedAsset)] as any).find((a: any) => a?.id === ');
  
  // Registry keys mapping (must be lowercase for mdast)
  content = content.replace(/Heading: /g, 'heading: ');
  content = content.replace(/Paragraph: /g, 'paragraph: ');
  content = content.replace(/List: /g, 'list: ');
  content = content.replace(/Blockquote: /g, 'blockquote: ');
  content = content.replace(/Callout: /g, 'containerDirective: ');
  content = content.replace(/Code: /g, 'code: '); // Fix for CodeBlock turning into Code
  content = content.replace(/Table: /g, 'table: ');
  content = content.replace(/ThematicBreak: /g, 'thematicBreak: ');
  content = content.replace(/Image: /g, 'image: '); // from ImageBlock
  content = content.replace(/Diagram: /g, 'code_mermaid: ');
  content = content.replace(/Math: /g, 'math: ');
  content = content.replace(/Text: /g, 'text: ');
  content = content.replace(/Strong: /g, 'strong: ');
  content = content.replace(/Emphasis: /g, 'emphasis: ');
  content = content.replace(/Strike: /g, 'delete: ');
  content = content.replace(/InlineCode: /g, 'inlineCode: ');
  content = content.replace(/Link: /g, 'link: ');
  content = content.replace(/InlineImage: /g, 'image_inline: ');
  content = content.replace(/InlineMath: /g, 'inlineMath: ');
  content = content.replace(/Break: /g, 'break: ');

  // Flatten blocks/inlines since we just have nodes now
  content = content.replace(/blocks: \{/, 'nodes: {');
  // find inlines: { and remove it. The associated }, will need to be removed.
  content = content.replace(/inlines: \{/, '');
  
  // Method calls
  content = content.replace(/ctx\.renderBlock\(/g, 'ctx.renderNode(');
  content = content.replace(/ctx\.renderInline\(/g, 'ctx.renderNode(');
  content = content.replace(/ctx\.renderBlocks\(/g, 'ctx.renderNodes(');
  content = content.replace(/ctx\.renderInlines\(/g, 'ctx.renderNodes(');
  
  // Fix context types implicitly any
  content = content.replace(/, ctx\) =>/g, ', ctx: any) =>');
  content = content.replace(/, ctx\) \{/g, ', ctx: any) {');
  
  // DocxElement / DocxInlineElement
  content = content.replace(/DocxElement/g, 'DocxNode');
  content = content.replace(/DocxInlineElement/g, 'DocxInlineNode');
  
  // new Table -> new DocxTable
  content = content.replace(/new Table\(/g, 'new DocxTable(');
  
  // doc.assets
  content = content.replace(/doc\.assets/g, '[]');
  
  fs.writeFileSync(file, content);
}

processFile('packages/renderers/src/docx.ts');
processFile('packages/renderers/src/clipboard.ts');
