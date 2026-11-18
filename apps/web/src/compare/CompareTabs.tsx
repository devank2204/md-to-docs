import { Button } from "../components/Controls";
export function InputTabs({
  active,
  onChange,
  unified = false,
  options,
  disabledChanges = false,
}: {
  active: string;
  onChange: (value: string) => void;
  unified?: boolean;
  options?: string[][];
  disabledChanges?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Comparison view"
      onKeyDown={(event) => {
        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        const index = tabs.indexOf(event.target as HTMLButtonElement);
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus();
      }}
    >
      {(
        options ?? [
          ["original", "Original"],
          ["updated", "Updated"],
          ...(unified ? [["unified", "Unified"]] : []),
        ]
      ).map(([value, label]) => (
        <Button
          key={value}
          disabled={
            value === "changes" && disabledChanges && active !== "changes"
          }
          role="tab"
          aria-selected={active === value}
          state={active === value ? "selected" : "idle"}
          tabIndex={active === value ? 0 : -1}
          onClick={() => onChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
