import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
export function Button({
  state = "idle",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  state?: "idle" | "working" | "success" | "error" | "selected";
}) {
  return (
    <button
      type="button"
      {...props}
      data-state={state}
      aria-busy={state === "working" || undefined}
      className={`ux-button ${className}`}
    />
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Button {...props} aria-label={label} title={label} className="ux-icon">
      {children}
    </Button>
  );
}
export function Toggle({
  selected,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <Button
      {...props}
      aria-pressed={selected}
      state={selected ? "selected" : "idle"}
    />
  );
}
// Native disclosure with ordinary links/buttons retains Tab navigation and semantics.
export function Menu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node))
        ref.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details
      ref={ref}
      className="ux-menu"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary")?.focus();
        }
        if (["ArrowDown", "ArrowUp"].includes(e.key)) {
          e.preventDefault();
          const items = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>("a,button"),
          );
          const i = items.indexOf(document.activeElement as HTMLElement);
          items[
            (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
          ]?.focus();
        }
      }}
    >
      <summary className="ux-button">{label}</summary>
      <div
        className="ux-menu-items"
        onClick={(e) => {
          if ((e.target as Element).closest("a,button"))
            ref.current?.removeAttribute("open");
        }}
      >
        {children}
      </div>
    </details>
  );
}
