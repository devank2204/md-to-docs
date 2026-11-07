import { useSyncExternalStore } from 'react';

// The desktop studio needs room for its library, editor, and document canvas.
const query = '(max-width: 1023px)';
const subscribe = (callback: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
export function useMobileLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
