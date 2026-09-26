export type DestinationType = 'google-docs' | 'word';

export interface DestinationProfile {
  id: DestinationType;
  name: string;
  maxTableColumns: number;
  supportsNestedTables: boolean;
  supportsMath: boolean;
  supportsMermaid: boolean;
}

export const DESTINATIONS: Record<DestinationType, DestinationProfile> = {
  'google-docs': {
    id: 'google-docs',
    name: 'Google Docs',
    maxTableColumns: 6, // Constraint for test
    supportsNestedTables: false,
    supportsMath: false,
    supportsMermaid: false,
  },
  'word': {
    id: 'word',
    name: 'Microsoft Word',
    maxTableColumns: 12,
    supportsNestedTables: true,
    supportsMath: true,
    supportsMermaid: false,
  }
};

export interface Capability {
  supportsNative: boolean;
  requiresPolyfill: boolean;
  reason?: string;
}

export function evaluateCapability(blockType: string, blockData: any, destination: DestinationType): Capability {
  const profile = DESTINATIONS[destination];
  
  if (blockType === 'Table') {
    const cols = blockData.rows?.[0]?.cells?.length || 0;
    if (cols > profile.maxTableColumns) {
      return {
        supportsNative: false,
        requiresPolyfill: true,
        reason: `Table exceeds max columns for ${profile.name} (Max ${profile.maxTableColumns}, Found ${cols})`
      };
    }
  }

  return {
    supportsNative: true,
    requiresPolyfill: false
  };
}
