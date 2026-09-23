export type FolioDocument = {
  version: string;
  metadata?: Record<string, string>;
  blocks: Block[];
};

export type Block = 
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | BlockquoteBlock
  | CodeBlock
  | TableBlock
  | ThematicBreakBlock;

export interface BaseBlock {
  id?: string;
  type: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'Heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  inlines: Inline[];
}

export interface ParagraphBlock extends BaseBlock {
  type: 'Paragraph';
  inlines: Inline[];
}

export interface ListBlock extends BaseBlock {
  type: 'List';
  ordered: boolean;
  start?: number;
  items: ListItem[];
}

export interface ListItem {
  blocks: Block[];
}

export interface BlockquoteBlock extends BaseBlock {
  type: 'Blockquote';
  blocks: Block[];
}

export interface CodeBlock extends BaseBlock {
  type: 'CodeBlock';
  language?: string;
  value: string;
}

export interface TableBlock extends BaseBlock {
  type: 'Table';
  headerRows: number;
  rows: TableRow[];
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  blocks: Block[];
}

export interface ThematicBreakBlock extends BaseBlock {
  type: 'ThematicBreak';
}

export type Inline = 
  | TextInline
  | StrongInline
  | EmphasisInline
  | StrikeInline
  | InlineCode
  | LinkInline;

export interface BaseInline {
  type: string;
}

export interface TextInline extends BaseInline {
  type: 'Text';
  value: string;
}

export interface StrongInline extends BaseInline {
  type: 'Strong';
  inlines: Inline[];
}

export interface EmphasisInline extends BaseInline {
  type: 'Emphasis';
  inlines: Inline[];
}

export interface StrikeInline extends BaseInline {
  type: 'Strike';
  inlines: Inline[];
}

export interface InlineCode extends BaseInline {
  type: 'InlineCode';
  value: string;
}

export interface LinkInline extends BaseInline {
  type: 'Link';
  url: string;
  title?: string;
  inlines: Inline[];
}
