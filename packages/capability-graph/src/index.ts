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
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'blockquote'
  | 'code'
  | 'table'
  | 'thematicBreak'
  | 'image'
  | 'containerDirective' // For Callouts
  | 'math'
  | 'footnoteDefinition'
  | 'text'
  | 'strong'
  | 'emphasis'
  | 'delete' // mdast strike
  | 'inlineCode'
  | 'link'
  | 'break'
  | 'inlineMath'
  | 'footnoteReference';

const CAPABILITY_MATRIX: Record<CapabilityKey, Record<DestinationType, SupportLevel>> = {
  heading:             { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  paragraph:           { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  list:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  blockquote:          { 'google-docs': 'styled',  word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  code:                { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  table:               { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'styled' },
  thematicBreak:       { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  image:               { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  containerDirective:  { 'google-docs': 'styled',  word: 'styled',  pdf: 'styled',  clipboard: 'styled' },
  math:                { 'google-docs': 'image',   word: 'native',  pdf: 'native',  clipboard: 'image' },
  footnoteDefinition:  { 'google-docs': 'transformed', word: 'native', pdf: 'native', clipboard: 'transformed' },
  text:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  strong:              { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  emphasis:            { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  delete:              { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  inlineCode:          { 'google-docs': 'styled',  word: 'styled',  pdf: 'native',  clipboard: 'styled' },
  link:                { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  break:               { 'google-docs': 'native',  word: 'native',  pdf: 'native',  clipboard: 'native' },
  inlineMath:          { 'google-docs': 'image',   word: 'native',  pdf: 'native',  clipboard: 'image' },
  footnoteReference:   { 'google-docs': 'transformed', word: 'native', pdf: 'native', clipboard: 'transformed' },
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
    if (blockType === 'table') {
      const cols = blockData.children?.[0]?.children?.length || 0;
      if (cols > profile.maxTableColumns) {
        return {
          support: 'transformed',
          requiresPolyfill: true,
          reason: `Table has ${cols} columns, exceeding the ${profile.maxTableColumns}-column limit for ${profile.name}`,
          transformTo: 'list',
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
