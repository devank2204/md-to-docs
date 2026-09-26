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
    supportsMath: false,
    supportsMermaid: false,
    supportsFootnotes: false,
    supportsCallouts: false,
    supportsTaskLists: false,
  },
  'word': {
    id: 'word',
    name: 'Microsoft Word',
    maxTableColumns: 63,
    supportsNestedTables: true,
    supportsMath: true,
    supportsMermaid: false,
    supportsFootnotes: true,
    supportsCallouts: false,
    supportsTaskLists: false,
  },
  'pdf': {
    id: 'pdf',
    name: 'PDF',
    maxTableColumns: 20,
    supportsNestedTables: false,
    supportsMath: true,
    supportsMermaid: false,
    supportsFootnotes: true,
    supportsCallouts: false,
    supportsTaskLists: false,
  },
  'clipboard': {
    id: 'clipboard',
    name: 'Clipboard',
    maxTableColumns: 20,
    supportsNestedTables: false,
    supportsMath: false,
    supportsMermaid: false,
    supportsFootnotes: false,
    supportsCallouts: false,
    supportsTaskLists: false,
  },
};

// ─── Capability Matrix ──────────────────────────────────────────

export interface Capability {
  support: SupportLevel;
  requiresPolyfill: boolean;
  reason?: string;
  transformTo?: string;
}

type CapabilityKey =
  | 'Heading'
  | 'Paragraph'
  | 'List'
  | 'Blockquote'
  | 'CodeBlock'
  | 'Table'
  | 'ThematicBreak'
  | 'ImageBlock'
  | 'Callout'
  | 'MathBlock'
  | 'DiagramBlock'
  | 'FootnoteDefinition'
  | 'Text'
  | 'Strong'
  | 'Emphasis'
  | 'Strike'
  | 'InlineCode'
  | 'Link'
  | 'InlineImage'
  | 'Break'
  | 'InlineMath'
  | 'FootnoteReference';

const CAPABILITY_MATRIX: Record<CapabilityKey, Record<DestinationType, SupportLevel>> = {
  Heading:             { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Paragraph:           { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  List:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Blockquote:          { 'google-docs': 'styled',  word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  CodeBlock:           { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  Table:               { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'styled' },
  ThematicBreak:       { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  ImageBlock:          { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Callout:             { 'google-docs': 'styled',  word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  MathBlock:           { 'google-docs': 'image',   word: 'native',  pdf: 'native',  clipboard: 'image' },
  DiagramBlock:        { 'google-docs': 'image',   word: 'image',   pdf: 'image',   clipboard: 'image' },
  FootnoteDefinition:  { 'google-docs': 'transformed', word: 'native', pdf: 'native', clipboard: 'transformed' },
  Text:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Strong:              { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Emphasis:            { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Strike:              { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  InlineCode:          { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  Link:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  InlineImage:         { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  Break:               { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  InlineMath:          { 'google-docs': 'image',   word: 'native',  pdf: 'native',  clipboard: 'image' },
  FootnoteReference:   { 'google-docs': 'transformed', word: 'native', pdf: 'native', clipboard: 'transformed' },
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

  // Check the capability matrix first
  const matrixEntry = CAPABILITY_MATRIX[blockType as CapabilityKey];
  if (matrixEntry) {
    const support = matrixEntry[destination];

    // Specific constraint checks
    if (blockType === 'Table') {
      const cols = blockData.rows?.[0]?.cells?.length || 0;
      if (cols > profile.maxTableColumns) {
        return {
          support: 'transformed',
          requiresPolyfill: true,
          reason: `Table has ${cols} columns, exceeding the ${profile.maxTableColumns}-column limit for ${profile.name}`,
          transformTo: 'List',
        };
      }
    }

    return {
      support,
      requiresPolyfill: support !== 'native',
    };
  }

  // Unknown block type
  return {
    support: 'unsupported',
    requiresPolyfill: false,
    reason: `Block type "${blockType}" is not in the capability matrix`,
  };
}
