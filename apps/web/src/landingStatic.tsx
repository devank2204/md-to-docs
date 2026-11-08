import { renderToStaticMarkup } from 'react-dom/server';
import { LandingContext } from './routes/LandingContext';
import { HomeIntroduction } from './components/HomeIntroduction';
import { LandingPageContent } from './components/LandingPageContent';
import { EmptyState } from './components/EmptyState';
import type { RouteLandingSpec } from './routes/landingData';
export function renderLanding(spec: RouteLandingSpec) {
 return renderToStaticMarkup(<LandingContext.Provider value={spec}><main className="mt-12 bg-surface text-on-surface">
 {spec.path.startsWith('/mermaid-') ? <HomeIntroduction /> : <EmptyState onInput={() => {}} />}
 <LandingPageContent spec={spec} /></main></LandingContext.Provider>);
}
