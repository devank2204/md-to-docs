import { useEffect, useId, useRef } from "react";
/** Keep the established web wordmark identical across shells. */
export function BrandWordmark() {
  const id = "logo-snow-" + useId().replace(/:/g, "");
  const stop = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stop.current?.(), []);
  return (
    <span
      id={id}
      className="brand-wordmark brand-snow-box"
      onPointerEnter={async (event) => {
        const host = event.currentTarget;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        try {
          stop.current?.();
          const module = await import("@/utils/logoSnow");
          stop.current = await module.startLogoSnow(host);
        } catch {
          /* Decoration must never interrupt the product. */
        }
      }}
      onPointerLeave={() => {
        stop.current?.();
        stop.current = undefined;
      }}
    >
      <span className="brand-wordmark-name">mdtodocs</span>
      <span className="brand-wordmark-domain">.com</span>
    </span>
  );
}
