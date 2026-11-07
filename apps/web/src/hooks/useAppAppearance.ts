import { useLayoutEffect } from 'react';
import { useStore } from '@/store';

// App chrome only. Never feed this preference into the compiler/export key.
export function useAppAppearance() {
  const appearance = useStore((state) => state.appAppearance);
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.appearance =
        appearance === 'dark' || (appearance === 'system' && media.matches)
          ? 'dark'
          : 'cream';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [appearance]);
}
