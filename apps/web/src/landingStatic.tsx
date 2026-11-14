import { SiteFooter } from './components/SiteFooter';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandingContext } from './routes/LandingContext';
import { HomeIntroduction } from './components/HomeIntroduction';
import { LandingPageContent } from './components/LandingPageContent';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { MobileWorkspace } from './components/MobileWorkspace';
import { THEMES } from '@mdtodocs/compiler-core/src/theme';
import type { RouteLandingSpec } from './routes/landingData';
export function renderLanding(spec: RouteLandingSpec, mobile = false) {
 const diagram = spec.path.startsWith('/mermaid-');
 const signature = { enabled: false, placement: 'every-page' as const };
 return renderToStaticMarkup(<LandingContext.Provider value={spec}>
 <div className={`${mobile && !diagram ? 'mobile-app' : 'min-h-screen'} flex flex-col bg-surface text-on-surface`}>
 {(!mobile || diagram) && <Header appState="EMPTY" markdown="" destination={spec.destination} onDestinationChange={() => {}} activeTheme={THEMES.default} documentSignature={signature} />}
 <main className={`flex-1 flex flex-col relative ${mobile && !diagram ? 'mobile-main' : 'mt-12'}`}>
 {diagram ? <HomeIntroduction /> : mobile ? <MobileWorkspace markdown="" onInput={() => {}} destination={spec.destination} onDestinationChange={() => {}} activeTheme={THEMES.default} documentSignature={signature} isCompiling={false} diagnostics={[]} compilationError={false} /> : <EmptyState onInput={() => {}} />}
 <LandingPageContent spec={spec} /></main><SiteFooter /></div></LandingContext.Provider>);
}
