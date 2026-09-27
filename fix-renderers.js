const fs = require('fs');

function fixDocxAndClipboard() {
  const docxFile = 'packages/renderers/src/docx.ts';
  let docx = fs.readFileSync(docxFile, 'utf8');

  // Fix imports
  docx = docx.replace(/import type \{[\s\S]*?\} from '@mdtodocs\/compiler-core';/, "import type { DocumentTheme } from '@mdtodocs/compiler-core';\nimport type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdastTable, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';\nimport type { ResolvedAsset } from '@mdtodocs/asset-pipeline';");
  docx = docx.replace(/FolioDocument/g, 'Root');
  
  // Fix Node accesses
  docx = docx.replace(/block\.language/g, 'block.lang');
  docx = docx.replace(/block\.calloutType/g, '(block.attributes?.type || "note")');
  docx = docx.replace(/block\.headerRows/g, '1 /* headerRows */');
  docx = docx.replace(/child\.type === 'Paragraph'/g, "child.type === 'paragraph'");
  docx = docx.replace(/child\.type === 'List'/g, "child.type === 'list'");
  docx = docx.replace(/b\.type === 'Paragraph'/g, "b.type === 'paragraph'");
  docx = docx.replace(/new Table\(\{/g, 'new DocxTable({');
  docx = docx.replace(/block\.src/g, 'block.url');
  docx = docx.replace(/block\.renderStatus === 'error'/g, 'false /* renderStatus */');
  docx = docx.replace(/block\.diagramType/g, 'block.lang');
  docx = docx.replace(/block\.source/g, 'block.value');

  docx = docx.replace(/ctx\.assets\.find\(a => a\.id === (inline|block)\.assetId\)/g, '($1.data?.resolvedAsset)');

  // Fix function args
  docx = docx.replace(/HeadingBlock/g, 'Heading');
  docx = docx.replace(/ParagraphBlock/g, 'Paragraph');
  docx = docx.replace(/ListBlock/g, 'List');
  docx = docx.replace(/BlockquoteBlock/g, 'Blockquote');
  docx = docx.replace(/CodeBlock/g, 'Code');
  docx = docx.replace(/TableBlock/g, 'MdastTable');
  docx = docx.replace(/ImageBlock/g, 'Image');
  docx = docx.replace(/DiagramBlock/g, 'Code');
  docx = docx.replace(/MathBlock/g, 'any /* Math */');
  docx = docx.replace(/CalloutBlock/g, 'any /* ContainerDirective */');
  
  docx = docx.replace(/TextInline/g, 'Text');
  docx = docx.replace(/StrongInline/g, 'Strong');
  docx = docx.replace(/EmphasisInline/g, 'Emphasis');
  docx = docx.replace(/StrikeInline/g, 'Delete');
  docx = docx.replace(/LinkInline/g, 'Link');
  docx = docx.replace(/InlineImageInline/g, 'Image');
  docx = docx.replace(/InlineMath/g, 'any /* InlineMath */');

  // AST property changes
  docx = docx.replace(/\.inlines/g, '.children');
  docx = docx.replace(/\.blocks/g, '.children');
  docx = docx.replace(/\.items/g, '.children');
  docx = docx.replace(/\.rows/g, '.children');
  docx = docx.replace(/\.cells/g, '.children');
  docx = docx.replace(/block\.level/g, 'block.depth');

  // Replace registry
  docx = docx.replace(/blocks: \{/g, 'nodes: {');
  docx = docx.replace(/inlines: \{/g, ''); 
  docx = docx.replace(/Heading: /g, 'heading: ');
  docx = docx.replace(/Paragraph: /g, 'paragraph: ');
  docx = docx.replace(/List: /g, 'list: ');
  docx = docx.replace(/Blockquote: /g, 'blockquote: ');
  docx = docx.replace(/Callout: /g, 'containerDirective: ');
  docx = docx.replace(/CodeBlock: /g, 'code: ');
  docx = docx.replace(/Table: /g, 'table: ');
  docx = docx.replace(/ThematicBreak: /g, 'thematicBreak: ');
  docx = docx.replace(/ImageBlock: /g, 'image: '); 
  docx = docx.replace(/DiagramBlock: /g, 'code_mermaid: ');
  docx = docx.replace(/MathBlock: /g, 'math: ');
  docx = docx.replace(/Text: /g, 'text: ');
  docx = docx.replace(/Strong: /g, 'strong: ');
  docx = docx.replace(/Emphasis: /g, 'emphasis: ');
  docx = docx.replace(/Strike: /g, 'delete: ');
  docx = docx.replace(/InlineCode: /g, 'inlineCode: ');
  docx = docx.replace(/Link: /g, 'link: ');
  docx = docx.replace(/InlineImage: /g, 'image_inline: ');
  docx = docx.replace(/InlineMath: /g, 'inlineMath: ');
  docx = docx.replace(/Break: /g, 'break: ');

  docx = docx.replace(/ctx\.renderInlines/g, 'ctx.renderNodes');
  docx = docx.replace(/ctx\.renderBlock\(/g, 'ctx.renderNode(');
  docx = docx.replace(/ctx\.renderInline\(/g, 'ctx.renderNode(');

  docx = docx.replace(/DocxInlineElement/g, 'DocxInlineNode');
  docx = docx.replace(/DocxElement/g, 'DocxNode');

  // Remove `type any`
  docx = docx.replace(/type any = DocxParagraph \| Table;/g, 'type DocxNode = DocxParagraph | DocxTable;');
  docx = docx.replace(/type any = TextRun \| ExternalHyperlink \| ImageRun;/g, 'type DocxInlineNode = TextRun | ExternalHyperlink | ImageRun;');

  // Fix docx Renderer
  docx = docx.replace(/const docxRenderer = new DocumentRenderer\(docxRegistry\);/g, 'const docxRenderer = new DocumentRenderer<DocxNode[]>(docxRegistry as any);');
  docx = docx.replace(/<TNodeOut>/g, '<TNodeOut[]>'); // Wait, Renderer.ts already returns TNodeOut, we don't need this

  docx = docx.replace(/alttext:/g, 'altText:');
  
  // Replace doc.assets with []
  docx = docx.replace(/doc\.assets/g, '[]');
  
  // Table imports
  docx = docx.replace(/Table as DocxTable,/g, 'Table as DocxTable,'); // Ensure it exists
  
  // Fix CodeBlock duplicate (Code: and code:)
  docx = docx.replace(/Code: \(block: Code/g, 'code2: (block: Code'); 
  
  fs.writeFileSync(docxFile, docx);
  
  // Do the same for clipboard
  const clipFile = 'packages/renderers/src/clipboard.ts';
  let clip = fs.readFileSync(clipFile, 'utf8');

  clip = clip.replace(/import type \{[\s\S]*?\} from '@mdtodocs\/compiler-core';/, "import type { DocumentTheme } from '@mdtodocs/compiler-core';\nimport type { Root, Heading, Paragraph, List, Blockquote, Code, Table as MdastTable, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';\nimport type { ResolvedAsset } from '@mdtodocs/asset-pipeline';");
  clip = clip.replace(/FolioDocument/g, 'Root');
  clip = clip.replace(/block\.language/g, 'block.lang');
  clip = clip.replace(/block\.calloutType/g, '(block.attributes?.type || "note")');
  clip = clip.replace(/block\.headerRows/g, '1 /* headerRows */');
  clip = clip.replace(/child\.type === 'Paragraph'/g, "child.type === 'paragraph'");
  clip = clip.replace(/child\.type === 'List'/g, "child.type === 'list'");
  clip = clip.replace(/block\.src/g, 'block.url');
  clip = clip.replace(/block\.renderStatus === 'error'/g, 'false /* renderStatus */');
  clip = clip.replace(/block\.diagramType/g, 'block.lang');
  clip = clip.replace(/block\.source/g, 'block.value');
  clip = clip.replace(/ctx\.assets\.find\(a => a\.id === (inline|block)\.assetId\)/g, '($1.data?.resolvedAsset)');
  clip = clip.replace(/HeadingBlock/g, 'Heading');
  clip = clip.replace(/ParagraphBlock/g, 'Paragraph');
  clip = clip.replace(/ListBlock/g, 'List');
  clip = clip.replace(/BlockquoteBlock/g, 'Blockquote');
  clip = clip.replace(/CodeBlock/g, 'Code');
  clip = clip.replace(/TableBlock/g, 'MdastTable');
  clip = clip.replace(/ImageBlock/g, 'Image');
  clip = clip.replace(/DiagramBlock/g, 'Code');
  clip = clip.replace(/MathBlock/g, 'any /* Math */');
  clip = clip.replace(/CalloutBlock/g, 'any /* ContainerDirective */');
  clip = clip.replace(/TextInline/g, 'Text');
  clip = clip.replace(/StrongInline/g, 'Strong');
  clip = clip.replace(/EmphasisInline/g, 'Emphasis');
  clip = clip.replace(/StrikeInline/g, 'Delete');
  clip = clip.replace(/LinkInline/g, 'Link');
  clip = clip.replace(/InlineImageInline/g, 'Image');
  clip = clip.replace(/InlineMath/g, 'any /* InlineMath */');
  clip = clip.replace(/\.inlines/g, '.children');
  clip = clip.replace(/\.blocks/g, '.children');
  clip = clip.replace(/\.items/g, '.children');
  clip = clip.replace(/\.rows/g, '.children');
  clip = clip.replace(/\.cells/g, '.children');
  clip = clip.replace(/block\.level/g, 'block.depth');
  clip = clip.replace(/blocks: \{/g, 'nodes: {');
  clip = clip.replace(/inlines: \{/g, ''); 
  clip = clip.replace(/Heading: /g, 'heading: ');
  clip = clip.replace(/Paragraph: /g, 'paragraph: ');
  clip = clip.replace(/List: /g, 'list: ');
  clip = clip.replace(/Blockquote: /g, 'blockquote: ');
  clip = clip.replace(/Callout: /g, 'containerDirective: ');
  clip = clip.replace(/CodeBlock: /g, 'code: ');
  clip = clip.replace(/Table: /g, 'table: ');
  clip = clip.replace(/ThematicBreak: /g, 'thematicBreak: ');
  clip = clip.replace(/ImageBlock: /g, 'image: '); 
  clip = clip.replace(/DiagramBlock: /g, 'code_mermaid: ');
  clip = clip.replace(/MathBlock: /g, 'math: ');
  clip = clip.replace(/Text: /g, 'text: ');
  clip = clip.replace(/Strong: /g, 'strong: ');
  clip = clip.replace(/Emphasis: /g, 'emphasis: ');
  clip = clip.replace(/Strike: /g, 'delete: ');
  clip = clip.replace(/InlineCode: /g, 'inlineCode: ');
  clip = clip.replace(/Link: /g, 'link: ');
  clip = clip.replace(/InlineImage: /g, 'image_inline: ');
  clip = clip.replace(/InlineMath: /g, 'inlineMath: ');
  clip = clip.replace(/Break: /g, 'break: ');
  clip = clip.replace(/ctx\.renderInlines/g, 'ctx.renderNodes');
  clip = clip.replace(/ctx\.renderBlock\(/g, 'ctx.renderNode(');
  clip = clip.replace(/ctx\.renderInline\(/g, 'ctx.renderNode(');
  clip = clip.replace(/const clipboardRenderer = new DocumentRenderer\(clipboardRegistry\);/g, 'const clipboardRenderer = new DocumentRenderer<string>(clipboardRegistry as any);');
  
  fs.writeFileSync(clipFile, clip);
}

fixDocxAndClipboard();
