import type { RouteLandingSpec } from './landingData';
export function structuredData(spec: Pick<RouteLandingSpec, 'h1' | 'canonical' | 'description'>) {
  return { '@context': 'https://schema.org', '@type': 'WebApplication', name: `MDToDocs — ${spec.h1}`, url: spec.canonical, description: spec.description, applicationCategory: 'ProductivityApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript for conversion' };
}
