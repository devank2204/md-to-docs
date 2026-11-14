import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useStore } from "@/store";
import { IconButton } from "./Controls";
function subscribe(cb: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
}
export function AppAppearance() {
  const appearance = useStore((s) => s.appAppearance);
  const deviceDark = useSyncExternalStore(
    subscribe,
    () => matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const dark = appearance === "dark" || (appearance === "system" && deviceDark);
  return (
    <IconButton
      label={`Switch to ${dark ? "light" : "dark"} appearance`}
      onClick={(event) => {
        const r = event.currentTarget.getBoundingClientRect();
        const apply = () =>
          flushSync(() =>
            useStore.getState().setAppAppearance(dark ? "cream" : "dark"),
          );
        const doc = document as Document & {
          startViewTransition?: (cb: () => void) => { ready: Promise<void> };
        };
        if (
          !doc.startViewTransition ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          apply();
          return;
        }
        const transition = doc.startViewTransition(apply);
        transition.ready
          .then(() =>
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${r.x + r.width / 2}px ${r.y + r.height / 2}px)`,
                  `circle(${Math.hypot(innerWidth, innerHeight)}px at ${r.x + r.width / 2}px ${r.y + r.height / 2}px)`,
                ],
              },
              {
                duration: 230,
                easing: "ease-out",
                pseudoElement: "::view-transition-new(root)",
              },
            ),
          )
          .catch(() => {});
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20 15A8 8 0 019 4a8 8 0 1011 11Z" />
        )}
      </svg>
    </IconButton>
  );
}
