import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

// Native modal dialog supplies inert background, focus trapping, and Escape.
export function WorkspaceSheet({
  title,
  placement = "default",
  className = "",
  onClose,
  children,
}: {
  title: string;
  placement?: "default" | "export";
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const resize = () =>
      dialog?.style.setProperty(
        "--sheet-available-height",
        `${Math.max(160, (window.visualViewport?.height || innerHeight) - 24)}px`,
      );
    resize();
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => {
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      dialog?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`workspace-sheet ${placement === "export" ? "export-sheet" : ""} ${className}`}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ),
        ).filter((node) => node.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section onClick={(e) => e.stopPropagation()}>
        <div className="sheet-heading">
          <h2 id={id}>{title}</h2>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </section>
    </dialog>
  );
}
