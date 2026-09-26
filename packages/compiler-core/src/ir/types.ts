// ─── Document Root ───────────────────────────────────────────────

export interface FolioDocument {
  version: string;
  metadata: DocumentMetadata;
  blocks: Block[];
  assets: Asset[];
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  date?: string;
  classification?: string;
  custom?: Record<string, string>;
}

export interface Asset {
  id: string;
  type: 'image' | 'svg' | 'diagram-source';
  src: string;
  data?: string; // base64 encoded or data URI
  raw?: string; // raw string content (e.g. SVG source)
  mimeType?: string;
  dimensions?: { width: number; height: number };
}

// ─── Source Position ─────────────────────────────────────────────

export interface SourcePosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  startOffset: number;
  endOffset: number;
}

// ─── Blocks ──────────────────────────────────────────────────────

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | BlockquoteBlock
  | CodeBlock
  | TableBlock
  | ThematicBreakBlock
  | ImageBlock
  | CalloutBlock
  | DiagramBlock
  | MathBlock
  | FootnoteDefinitionBlock;

export interface BaseBlock {
  id?: string;
  type: string;
  position?: SourcePosition;
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
  checked?: boolean | null; // null = not a task list item, true/false = task status
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
  align?: (TableCellAlignment | null)[];
  layout?: TableLayout;
}

export type TableCellAlignment = 'left' | 'center' | 'right';

export interface TableLayout {
  widthMode: 'auto' | 'fit' | 'fixed';
  preferredWidths?: number[];
  repeatHeader: boolean;
  overflowStrategy: 'wrap' | 'landscape' | 'split' | 'scale' | 'warn';
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

export interface ImageBlock extends BaseBlock {
  type: 'ImageBlock';
  src: string;
  alt?: string;
  title?: string;
  assetId?: string;
}

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

export interface CalloutBlock extends BaseBlock {
  type: 'Callout';
  calloutType: CalloutType;
  title?: string;
  blocks: Block[];
}

export interface DiagramBlock extends BaseBlock {
  type: 'DiagramBlock';
  diagramType: 'mermaid';
  source: string;
  assetId?: string; // Resolved SVG/PNG asset
  renderStatus?: 'success' | 'error';
  error?: { message: string };
}

export interface MathBlock extends BaseBlock {
  type: 'MathBlock';
  value: string; // LaTeX source
}

// ─── Inlines ─────────────────────────────────────────────────────

export type Inline =
  | TextInline
  | StrongInline
  | EmphasisInline
  | StrikeInline
  | InlineCode
  | LinkInline
  | InlineImageInline
  | BreakInline
  | InlineMath
  | FootnoteReferenceInline;

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

export interface InlineImageInline extends BaseInline {
  type: 'InlineImage';
  src: string;
  alt?: string;
  title?: string;
  assetId?: string;
}

export interface BreakInline extends BaseInline {
  type: 'Break';
}

export interface InlineMath extends BaseInline {
  type: 'InlineMath';
  value: string; // LaTeX source
}

export interface FootnoteDefinitionBlock extends BaseBlock {
  type: 'FootnoteDefinition';
  identifier: string;
  blocks: Block[];
}

export interface FootnoteReferenceInline extends BaseInline {
  type: 'FootnoteReference';
  identifier: string;
}
