import type { LandingRoutePath } from "@/routes/landingData";
import { LANDING_ROUTES } from "@/routes/landingData";
import { BrandWordmark } from "./BrandWordmark";
import { useStore } from "@/store";
type Navigation = {onNavigateRoute?: (path:LandingRoutePath)=>void};
export function ToolsLinks({onNavigateRoute}:Navigation={}) {
  return (
    <>
      <nav aria-label="Compare"><h3>Compare</h3><a href="/text-compare/">Text Compare</a><a href="/json-compare/">JSON Compare</a></nav>
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
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("mdtodocs:support", {detail:"privacy"}))}>Privacy</button>
        <button
          type="button"
          onClick={() => useStore.getState().setIsAboutModalOpen(true)}
        >
          About
        </button>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("mdtodocs:support", {detail:"feedback"}))}>Feedback</button>
        <span>Documents stay in this browser.</span>
      </div>
    </footer>
  );
}
