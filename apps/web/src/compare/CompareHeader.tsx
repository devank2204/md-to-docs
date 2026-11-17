import { PanelLeft, ArrowRightLeft, Braces } from "lucide-react";
import { BrandWordmark } from "../components/BrandWordmark";
import { AppAppearance } from "../components/AppAppearance";
import { IconButton, Menu } from "../components/Controls";
import { ToolsLinks } from "../components/SiteFooter";
import { useStore } from "../store";
export function CompareHeader({
  path,
  navigate,
}: {
  path: string;
  navigate: (path: string) => void;
}) {
  const toggle = useStore((state) => state.toggleSidebar);
  const link = (route: string, label: string, Icon: typeof Braces) => (
    <a
      href={`${route}/`}
      aria-current={path === route ? "page" : undefined}
      onClick={(event) => {
        if (
          event.button ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        if (path !== route) navigate(route);
      }}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </a>
  );
  return (
    <header className="compare-header font-code-sm text-code-sm">
      <div className="compare-brand">
        <a
          href="/"
          onClick={(event) => {
            if (
              event.button ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            navigate("/");
          }}
        >
          <BrandWordmark />
        </a>
        <span className="compare-sidebar-toggle">
          <IconButton label="Toggle sidebar" onClick={toggle}>
            <PanelLeft size={16} aria-hidden="true" />
          </IconButton>
        </span>
      </div>
      <nav className="compare-tool-switch" aria-label="Comparison tools">
        {link("/text-compare", "Text Compare", ArrowRightLeft)}
        {link("/json-compare", "JSON Compare", Braces)}
      </nav>
      <div className="compare-header-actions">
        <AppAppearance />
        <Menu
          name="Tools"
          label="Tools"
          className="workspace-menu mobile-tools"
        >
          <ToolsLinks onNavigateRoute={navigate} />
        </Menu>
      </div>
    </header>
  );
}
