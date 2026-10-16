export type DestinationType = 'google-docs' | 'word' | 'pdf' | 'clipboard';

export type SupportLevel = 'native' | 'styled' | 'transformed' | 'image' | 'text' | 'unsupported';

export interface DestinationProfile {
  id: DestinationType;
  name: string;
  maxTableColumns: number;
  supportsNestedTables: boolean;
  supportsMath: boolean;
  supportsMermaid: boolean;
  supportsFootnotes: boolean;
  supportsCallouts: boolean;
  supportsTaskLists: boolean;
}

export const DESTINATIONS: Record<DestinationType, DestinationProfile> = {
  'google-docs': {
    id: 'google-docs',
    name: 'Google Docs',
    maxTableColumns: 20,
    supportsNestedTables: false,
    supportsMath: true,
    supportsMermaid: true,
    supportsFootnotes: true,
    supportsCallouts: true,
    supportsTaskLists: true,
  },
  'word': {
    id: 'word',
    name: 'Microsoft Word',
    maxTableColumns: 63,
    supportsNestedTables: true,
    supportsMath: true,
    supportsMermaid: true,
    supportsFootnotes: true,
    supportsCallouts: true,
    supportsTaskLists: true,
  },
  'pdf': {
    id: 'pdf',
    name: 'PDF',
    maxTableColumns: 20,
    supportsNestedTables: false,
    supportsMath: true,
    supportsMermaid: true,
    supportsFootnotes: true,
    supportsCallouts: true,
    supportsTaskLists: true,
  },
  'clipboard': {
    id: 'clipboard',
    name: 'Clipboard',
    maxTableColumns: 20,
    supportsNestedTables: false,
    supportsMath: true,
    supportsMermaid: true,
    supportsFootnotes: true,
    supportsCallouts: true,
    supportsTaskLists: true,
  },
};

// Capability Matrix

export interface Capability {
  support: SupportLevel;
  requiresPolyfill: boolean;
  reason?: string;
  transformTo?: string;
}

export interface FeatureCapability {
  id: string;
  name: string;
  category: 'typography' | 'structure' | 'data' | 'assets' | 'advanced';
  support: Record<DestinationType, SupportLevel>;
  description: string;
  polyfill?: string;
}

export const FEATURE_CAPABILITIES: FeatureCapability[] = [
  {
    id: 'headings',
    name: 'Headings (H1 - H6)',
    category: 'typography',
    support: { 'google-docs': 'native', word: 'native', pdf: 'native', clipboard: 'native' },
    description: 'Hierarchical document headings with calibrated typography and keepNext pagination.',
  },
  {
    id: 'inline-formatting',
    name: 'Inline Typography (Bold, Italic, Strikethrough, Code)',
    category: 'typography',
    support: { 'google-docs': 'native', word: 'native', pdf: 'native', clipboard: 'native' },
    description: 'Formatted text runs preserving nested styles and semantic emphasis.',
  },
  {
    id: 'lists',
    name: 'Standard Lists (Bullet & Numbered)',
    category: 'structure',
    support: { 'google-docs': 'native', word: 'native', pdf: 'native', clipboard: 'native' },
    description: 'Nested lists up to 9 levels with hierarchical indentations.',
  },
  {
    id: 'task-lists',
    name: 'Task Lists (Checkboxes)',
    category: 'structure',
    support: { 'google-docs': 'styled', word: 'styled', pdf: 'native', clipboard: 'styled' },
    description: 'Checkboxes converted to unicode ballot box glyphs (checked / unchecked).',
    polyfill: 'Ballot box glyph mapping for cross-platform fidelity.',
  },
  {
    id: 'tables',
    name: 'Tables & Column Alignments',
    category: 'data',
    support: { 'google-docs': 'native', word: 'native', pdf: 'native', clipboard: 'styled' },
    description: 'Proportional column widths, repeating headers, cantSplit pagination, and alignments.',
    polyfill: 'Tables exceeding column limits linearized into structured lists.',
  },
  {
    id: 'code-blocks',
    name: 'Code Blocks & Syntax',
    category: 'typography',
    support: { 'google-docs': 'styled', word: 'styled', pdf: 'native', clipboard: 'styled' },
    description: 'Monospace font styling, shaded backgrounds, and preserved indents.',
  },
  {
    id: 'callouts',
    name: 'Callouts (Note, Tip, Warning, Caution, Important)',
    category: 'advanced',
    support: { 'google-docs': 'styled', word: 'styled', pdf: 'styled', clipboard: 'styled' },
    description: 'Accent border-left tables with soft tints, icons, and cantSplit protection.',
    polyfill: 'Callout containers mapped to single-cell border-accented tables.',
  },
  {
    id: 'math',
    name: 'Mathematical Equations (KaTeX / MathML)',
    category: 'advanced',
    support: { 'google-docs': 'transformed', word: 'styled', pdf: 'native', clipboard: 'transformed' },
    description: 'Inline and display equations with MathML and KaTeX typesetting.',
    polyfill: 'Google Docs / Clipboard receives MathML tags; Word receives Cambria Math.',
  },
  {
    id: 'footnotes',
    name: 'Footnotes & Citations',
    category: 'advanced',
    support: { 'google-docs': 'transformed', word: 'native', pdf: 'native', clipboard: 'transformed' },
    description: 'Superscript reference citations and definition endnotes.',
    polyfill: 'Google Docs / Clipboard converts to superscript anchor links and definitions.',
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagrams (Flowcharts, Sequence)',
    category: 'assets',
    support: { 'google-docs': 'image', word: 'image', pdf: 'native', clipboard: 'image' },
    description: 'Mermaid diagram sources compiled to high-resolution vector SVG assets.',
    polyfill: 'Diagrams compiled into standalone SVG vector assets.',
  },
  {
    id: 'images',
    name: 'Images & Remote Assets',
    category: 'assets',
    support: { 'google-docs': 'native', word: 'native', pdf: 'native', clipboard: 'native' },
    description: 'Embedded and remote images with aspect ratio preservation.',
  },
  {
    id: 'blockquotes',
    name: 'Blockquotes & Quotes',
    category: 'typography',
    support: { 'google-docs': 'styled', word: 'styled', pdf: 'styled', clipboard: 'styled' },
    description: 'Indented quotes with left border styling and italic typography.',
  },
];

type CapabilityKey =
  | 'root'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'listItem'
  | 'blockquote'
  | 'code'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'thematicBreak'
  | 'image'
  | 'containerDirective'
  | 'math'
  | 'footnoteDefinition'
  | 'text'
  | 'strong'
  | 'emphasis'
  | 'delete'
  | 'inlineCode'
  | 'link'
  | 'break'
  | 'inlineMath'
  | 'footnoteReference';

const CAPABILITY_MATRIX: Record<CapabilityKey, Record<DestinationType, SupportLevel>> = {
  root:                { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  heading:             { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  paragraph:           { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  list:                { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  listItem:            { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  blockquote:          { 'google-docs': 'styled',      word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  code:                { 'google-docs': 'styled',      word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  table:               { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'styled' },
  tableRow:            { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'styled' },
  tableCell:           { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'styled' },
  thematicBreak:       { 'google-docs': 'styled',      word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  image:               { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  containerDirective:  { 'google-docs': 'styled',      word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  math:                { 'google-docs': 'transformed', word: 'styled',  pdf: 'native',  clipboard: 'transformed' },
  footnoteDefinition:  { 'google-docs': 'transformed', word: 'native',  pdf: 'native',  clipboard: 'transformed' },
  text:                { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  strong:              { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  emphasis:            { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  delete:              { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  inlineCode:          { 'google-docs': 'styled',      word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  link:                { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  break:               { 'google-docs': 'native',      word: 'native',  pdf: 'native',  clipboard: 'native' },
  inlineMath:          { 'google-docs': 'transformed', word: 'styled',  pdf: 'native',  clipboard: 'transformed' },
  footnoteReference:   { 'google-docs': 'transformed', word: 'native',  pdf: 'native',  clipboard: 'transformed' },
};

export function evaluateCapability(
  blockType: string,
  blockData: any,
  destination: DestinationType
): Capability {
  const profile = DESTINATIONS[destination];
  if (!profile) {
    return { support: 'unsupported', requiresPolyfill: false, reason: `Unknown destination: ${destination}` };
  }

  // Root container node
  if (blockType === 'root') {
    return { support: 'native', requiresPolyfill: false };
  }

  // Special case: Mermaid diagram inside code block
  if (blockType === 'code' && blockData?.lang === 'mermaid') {
    if (destination === 'pdf') {
      return {
        support: 'native',
        requiresPolyfill: false,
        reason: 'Mermaid diagram rendered as vector SVG',
      };
    }
    return {
      support: 'image',
      requiresPolyfill: true,
      reason: 'Mermaid diagram converted to vector SVG asset',
    };
  }

  // Special case: Task list item
  if (blockType === 'listItem' && blockData?.checked !== null && blockData?.checked !== undefined) {
    return {
      support: 'styled',
      requiresPolyfill: false,
      reason: 'Task list checkbox rendered as ballot glyph',
    };
  }

  // Specific constraint checks for tables
  if (blockType === 'table') {
    const cols = blockData?.children?.[0]?.children?.length || 0;
    if (cols > profile.maxTableColumns) {
      return {
        support: 'transformed',
        requiresPolyfill: true,
        reason: `Table has ${cols} columns, exceeding the ${profile.maxTableColumns}-column limit for ${profile.name}`,
        transformTo: 'list',
      };
    }
  }

  // Check the capability matrix
  const matrixEntry = CAPABILITY_MATRIX[blockType as CapabilityKey];
  if (matrixEntry) {
    const support = matrixEntry[destination];

    let reason: string | undefined;
    if (blockType === 'containerDirective') {
      reason = 'Callout rendered with left accent border and icon';
    } else if (blockType === 'math' || blockType === 'inlineMath') {
      if (destination === 'google-docs' || destination === 'clipboard') {
        reason = 'Math formula rendered with MathML and KaTeX for clipboard paste';
      } else if (destination === 'word') {
        reason = 'Math formula rendered in Cambria Math typography';
      } else {
        reason = 'Math formula rendered via KaTeX typesetting';
      }
    } else if (blockType === 'footnoteReference' || blockType === 'footnoteDefinition') {
      if (destination === 'word' || destination === 'pdf') {
        reason = 'Document footnote citation and endnote';
      } else {
        reason = 'Footnote converted to superscript link and definition endnote';
      }
    }

    return {
      support,
      requiresPolyfill: support === 'transformed' || support === 'image',
      reason,
    };
  }

  // Unknown block type
  return {
    support: 'unsupported',
    requiresPolyfill: false,
    reason: `Block type "${blockType}" is not in the capability matrix`,
  };
}
