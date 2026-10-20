import { useCallback, useRef } from "react";

export type SegmentedOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  options: SegmentedOption[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export function SegmentedControl({
  options,
  label,
  value,
  defaultValue,
  onValueChange,
  className = "",
}: SegmentedControlProps) {
  const current = value ?? defaultValue ?? options[0]?.value ?? "";
  const index = options.findIndex((o) => o.value === current);
  const activeIndex = index < 0 ? 0 : index;
  const count = options.length;

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = useCallback(
    (next: string) => {
      if (next !== current) {
        onValueChange?.(next);
      }
    },
    [current, onValueChange],
  );

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let nextIndex = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (i + 1) % count;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (i - 1 + count) % count;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = count - 1;
    }

    if (nextIndex !== i && !options[nextIndex]?.disabled) {
      buttons.current[nextIndex]?.focus();
      select(options[nextIndex]!.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center select-none rounded-[6px] border border-outline-variant/30 bg-surface-container p-[2px] ${className}`}
    >
      {options.map((option, i) => {
        const isActive = i === activeIndex;

        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={option.disabled || undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !option.disabled && select(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            disabled={option.disabled}
            className={`px-2.5 py-1 text-center font-code-sm text-xs tracking-tight whitespace-nowrap rounded-[4px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              isActive
                ? "bg-surface text-on-surface font-medium shadow-xs border border-outline-variant/20"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-high/50"
            } ${option.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
