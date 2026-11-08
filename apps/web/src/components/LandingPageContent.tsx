import { DESTINATIONS } from '@mdtodocs/capability-graph';
import { LANDING_ROUTES } from '../routes/landingData';
import type { RouteLandingSpec, LandingRoutePath } from '../routes/landingData';

export function LandingPageContent({ spec, onNavigateRoute }: {
  spec: RouteLandingSpec;
  onLoadSample?: (markdown: string) => void;
  onNavigateRoute?: (path: LandingRoutePath) => void;
}) {
  const diagram = spec.path.startsWith('/mermaid-');
  const action = spec.path === '/markdown-to-word' ? 'Choose Export and download the Word document.'
    : spec.path === '/markdown-to-pdf' ? 'Choose Export, prepare PDF, then use the browser print dialog to save or print.'
    : spec.path === '/markdown-to-html' ? 'Choose Export and download HTML.'
    : diagram ? `Download the ${spec.path.endsWith('svg') ? 'SVG' : 'PNG'} from the diagram toolbar.`
    : spec.path === '/' ? 'Choose your destination, then copy or export the prepared document.'
    : 'Choose Export and copy formatted content, then paste into your destination editor.';
  return <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 text-secondary text-sm leading-relaxed select-text" aria-label={`${spec.h1} guidance`}>
    <h2 className="font-serif text-lg font-medium text-on-surface mb-3">How to convert</h2>
    <ol className="list-decimal pl-5 mb-6"><li>{diagram ? 'Paste Mermaid source into the diagram editor.' : 'Paste Markdown or import a Markdown file.'}</li><li>{diagram ? 'Inspect the rendered diagram and resolve any syntax errors.' : 'Inspect the preview and review formatting warnings.'}</li><li>{action}</li></ol>
    <details className="border-t border-outline-variant/30 py-3"><summary className="cursor-pointer text-on-surface">Formatting and limitations</summary>
      <p className="mt-3">{diagram ? 'SVG keeps vector shapes; PNG is a raster image. Larger scales use more browser memory and do not guarantee a particular print quality. Fonts and image support can vary in the receiving application.' : `Headings, lists, tables and code are rendered by the application. The ${DESTINATIONS[spec.destination].name} planner supports up to ${DESTINATIONS[spec.destination].maxTableColumns} table columns before a layout fallback may apply. Column widths and pagination can change in the receiving application.`}</p>
      {!diagram && <p className="mt-3">Math and diagrams have destination-specific representations. Clipboard paste may change equations, images, footnotes and spacing. Inspect the result in your destination and use a Word-file handoff if formatted paste needs adjustment. Automated rendering checks do not establish compatibility with every receiving application.</p>}
      {spec.destination === 'google-docs' && <p className="mt-3">Google Docs also offers native Markdown workflows. This tool adds a document preview and technical formatting preparation. Formatted copy does not create a cloud Google Doc; paste into an open document or import the downloaded DOCX.</p>}
    </details>
    <details className="border-t border-outline-variant/30 py-3"><summary className="cursor-pointer text-on-surface">Is my document private?</summary><p className="mt-3">Conversion runs in your browser without mandatory login. Saved documents stay in this browser. Remote images, fonts and application resources can make network requests; avoid remote assets when your workflow requires no external requests.</p></details>
    <details className="border-t border-outline-variant/30 py-3"><summary className="cursor-pointer text-on-surface">What if the result needs adjustment?</summary><p className="mt-3">Keep your source, inspect the preview and diagnostics, simplify wide tables or unsupported content, then prepare the output again. Check the downloaded file or pasted result before sharing.</p></details>
    <nav aria-label="Related conversion tools" className="border-t border-outline-variant/30 pt-4 flex flex-wrap gap-x-5 gap-y-2">
      {Object.values(LANDING_ROUTES).filter(r => r.path !== spec.path).map(r => <a key={r.path} href={r.path === '/' ? '/' : `${r.path}/`} className="underline hover:text-on-surface" onClick={e => {
        if (onNavigateRoute && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) { e.preventDefault(); onNavigateRoute(r.path); }
      }}>{r.h1}</a>)}
    </nav>
  </section>;
}
