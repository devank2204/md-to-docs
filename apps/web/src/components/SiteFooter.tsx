import type { LandingRoutePath } from "@/routes/landingData";
import { LANDING_ROUTES } from "@/routes/landingData";
import { BrandWordmark } from "./BrandWordmark";
import { useStore } from "@/store";
type Navigation = {onNavigateRoute?: (path:LandingRoutePath)=>void};
export function ToolsLinks({onNavigateRoute}:Navigation={}) {
  return (
    <>
      {["Documents", "Diagrams"].map((group) => (
        <nav key={group} aria-label={group}>
          <h3>{group}</h3>
          {Object.values(LANDING_ROUTES)
            .filter(
              (r) =>
                r.path !== "/" &&
                r.path.startsWith("/mermaid-") === (group === "Diagrams"),
            )
            .map((r) => (
              <a key={r.path} href={`${r.path}/`} onClick={e=>{if(onNavigateRoute && e.button===0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey){e.preventDefault();onNavigateRoute(r.path)}}}>
                {r.path
                  .slice(1)
                  .split("-")
                  .map(
                    (w) =>
                      ({
                        markdown: "Markdown",
                        google: "Google",
                        docs: "Docs",
                        word: "Word",
                        pdf: "PDF",
                        html: "HTML",
                        rich: "Rich",
                        text: "Text",
                        mermaid: "Mermaid",
                        svg: "SVG",
                        png: "PNG",
                        to: "to",
                      })[w] || w,
                  )
                  .join(" ")}
              </a>
            ))}
        </nav>
      ))}
    </>
  );
}
export function SiteFooter({onNavigateRoute}:Navigation={}) {
  return (
    <footer className="ux-footer" data-print-hide>
      <div className="ux-footer-main">
        <a href="/" className="ux-footer-brand" aria-label="MDToDocs home">
          <BrandWordmark />
        </a>
        <ToolsLinks onNavigateRoute={onNavigateRoute} />
      </div>
      <div className="ux-footer-bottom">
        <a href="#document-privacy">Privacy</a>
        <button
          type="button"
          onClick={() => useStore.getState().setIsAboutModalOpen(true)}
        >
          About
        </button>
        <a
          href="https://github.com/devank2204/md-to-docs/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Feedback
        </a>
        <span>Documents stay in this browser.</span>
      </div>
    </footer>
  );
}
