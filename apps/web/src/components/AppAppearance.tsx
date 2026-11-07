import { useStore } from '@/store';

export function AppAppearance() {
  const appearance = useStore((state) => state.appAppearance);
  const setAppearance = useStore((state) => state.setAppAppearance);
  return (
    <label className="app-appearance">
      <span>App appearance</span>
      <select
        aria-label="App appearance"
        value={appearance}
        onChange={(event) =>
          setAppearance(event.target.value as typeof appearance)
        }
      >
        <option value="cream">Cream</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
