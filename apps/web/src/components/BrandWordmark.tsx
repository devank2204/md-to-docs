/** Keep the established web wordmark identical across shells. */
export function BrandWordmark() {
  return (
    <span className="flex items-center gap-space-sm">
      <img
        src="/mark.png"
        alt=""
        className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
      />
      <span className="flex items-baseline gap-space-xxs mt-0.5">
        <span className="font-code-lg text-code-lg font-semibold tracking-tighter text-on-surface">
          mdtodocs
        </span>
        <span className="font-code-sm text-code-sm text-outline font-normal">
          .com
        </span>
      </span>
    </span>
  );
}
