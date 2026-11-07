import type { StateStorage } from 'zustand/middleware';

let available = true;
const listeners = new Set<() => void>();
function report(value: boolean) {
  if (available === value) return;
  available = value;
  listeners.forEach((listener) => listener());
}
export const deviceStorageHealth = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => available,
};

// A full/disabled browser store must not interrupt editing or claim a saved draft.
export const deviceStorage: StateStorage = {
  getItem(key) {
    try {
      const value = localStorage.getItem(key);
      report(true);
      return value;
    } catch {
      report(false);
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      report(true);
    } catch {
      report(false);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      report(true);
    } catch {
      report(false);
    }
  },
};
