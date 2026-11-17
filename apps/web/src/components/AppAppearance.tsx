import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useStore } from "@/store";
import { Menu, Button } from "./Controls";
import { Sun, Moon, Circle, Check } from "lucide-react";
function subscribe(cb: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
}
const modes = [
  { value: "cream", label: "Cream", Icon: Sun },
  { value: "dark", label: "Dark green", Icon: Moon },
  { value: "black", label: "Black", Icon: Circle },
] as const;
export function AppAppearance() {
  const appearance = useStore((s) => s.appAppearance);
  const deviceDark = useSyncExternalStore(
    subscribe,
    () => matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const active =
    modes.find(
      (mode) =>
        mode.value ===
        (appearance === "system"
          ? deviceDark
            ? "dark"
            : "cream"
          : appearance),
    ) ?? modes[0];
  const choose = (
    value: (typeof modes)[number]["value"],
    element: HTMLElement,
  ) => {
    const trigger = element.closest("details")!.querySelector("summary")!;
    const r = trigger.getBoundingClientRect();
    trigger.focus({ preventScroll: true });
    if (active.value === value) return;
    const apply = () =>
      flushSync(() => useStore.getState().setAppAppearance(value));
    if (
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }
    const transition = document.startViewTransition(apply);
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
  };
  return (
    <Menu
      className="app-appearance-menu"
      name={`Appearance: ${active.label}`}
      label={<active.Icon size={18} strokeWidth={1.6} aria-hidden="true" />}
    >
      <div className="app-appearance-options" aria-label="Appearance options">
        {modes.map((mode) => (
          <Button
            key={mode.value}
            aria-pressed={active.value === mode.value}
            onClick={(event) => choose(mode.value, event.currentTarget)}
          >
            <span
              className="app-appearance-swatch"
              data-mode={mode.value}
              aria-hidden="true"
            />
            {mode.label}
            {active.value === mode.value && (
              <Check size={14} aria-hidden="true" />
            )}
          </Button>
        ))}
      </div>
    </Menu>
  );
}
