const fs = require('fs');

function refactorFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace imports
  content = content.replace(/import type \{[\s\S]*?\} from '@mdtodocs\/compiler-core';/, "import type { DocumentTheme } from '@mdtodocs/compiler-core';\nimport type { Root, Heading, Paragraph, List, Blockquote, Code, Table, Image, Text, Strong, Emphasis, Delete, InlineCode, Link, Node } from 'mdast';");
  
  // Replace FolioDocument with Root
  content = content.replace(/FolioDocument/g, 'Root');
  
  // Replace Block/Inline types in function signatures
  content = content.replace(/HeadingBlock/g, 'Heading');
  content = content.replace(/ParagraphBlock/g, 'Paragraph');
  content = content.replace(/ListBlock/g, 'List');
  content = content.replace(/BlockquoteBlock/g, 'Blockquote');
  content = content.replace(/CodeBlock/g, 'Code');
  content = content.replace(/TableBlock/g, 'Table');
  content = content.replace(/ImageBlock/g, 'Image');
  content = content.replace(/DiagramBlock/g, 'Code');
  content = content.replace(/MathBlock/g, 'any /* Math */');
  content = content.replace(/CalloutBlock/g, 'any /* ContainerDirective */');
  
  content = content.replace(/TextInline/g, 'Text');
  content = content.replace(/StrongInline/g, 'Strong');
  content = content.replace(/EmphasisInline/g, 'Emphasis');
  content = content.replace(/StrikeInline/g, 'Delete');
  content = content.replace(/LinkInline/g, 'Link');
  content = content.replace(/InlineImageInline/g, 'Image');
  content = content.replace(/InlineMath/g, 'any /* InlineMath */');
  
  // AST property changes
  content = content.replace(/\.inlines/g, '.children');
  content = content.replace(/\.blocks/g, '.children');
  content = content.replace(/\.items/g, '.children');
  content = content.replace(/\.rows/g, '.children');
  content = content.replace(/\.cells/g, '.children');
  content = content.replace(/block\.level/g, 'block.depth');
  
  content = content.replace(/Heading: /g, 'heading: ');
  content = content.replace(/Paragraph: /g, 'paragraph: ');
  content = content.replace(/List: /g, 'list: ');
  content = content.replace(/Blockquote: /g, 'blockquote: ');
  content = content.replace(/Callout: /g, 'containerDirective: ');
  content = content.replace(/CodeBlock: /g, 'code: ');
  content = content.replace(/Table: /g, 'table: ');
  content = content.replace(/ThematicBreak: /g, 'thematicBreak: ');
  content = content.replace(/ImageBlock: /g, 'image: '); 
  content = content.replace(/DiagramBlock: /g, 'code_mermaid: ');
  content = content.replace(/MathBlock: /g, 'math: ');
  content = content.replace(/Text: /g, 'text: ');
  content = content.replace(/Strong: /g, 'strong: ');
  content = content.replace(/Emphasis: /g, 'emphasis: ');
  content = content.replace(/Strike: /g, 'delete: ');
  content = content.replace(/InlineCode: /g, 'inlineCode: ');
  content = content.replace(/Link: /g, 'link: ');
  content = content.replace(/InlineImage: /g, 'image_inline: ');
  content = content.replace(/InlineMath: /g, 'inlineMath: ');
  content = content.replace(/Break: /g, 'break: ');

  content = content.replace(/DocxInlineElement/g, 'DocxInlineNode');
  content = content.replace(/DocxElement/g, 'DocxNode');

  fs.writeFileSync(file, content);
}

refactorFile('packages/renderers/src/docx.ts');
refactorFile('packages/renderers/src/clipboard.ts');
