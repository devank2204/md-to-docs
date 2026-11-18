export function ComparePaneResize({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.max(25, Math.min(75, next));
  return (
    <div
      className="compare-pane-resize"
      role="separator"
      aria-label="Resize comparison panes"
      aria-orientation="vertical"
      aria-valuemin={25}
      aria-valuemax={75}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        onChange(
          event.key === "Home"
            ? 25
            : event.key === "End"
              ? 75
              : clamp(value + (event.key === "ArrowRight" ? 5 : -5)),
        );
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const box = event.currentTarget.parentElement!.getBoundingClientRect();
        onChange(clamp(((event.clientX - box.left) / box.width) * 100));
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onDoubleClick={() => onChange(50)}
    />
  );
}
