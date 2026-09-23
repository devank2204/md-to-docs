// The Capability Graph resolves the best rendering strategy for a given IR block
// based on the target destination's capabilities.

export interface Capability {
  supportsNative: boolean;
  requiresPolyfill: boolean;
}

export function evaluateCapability(blockType: string, destination: string): Capability {
  // Stub for Phase 1
  return {
    supportsNative: true,
    requiresPolyfill: false
  };
}
