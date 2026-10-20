export const isMac = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const platform =
    (navigator as any).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    '';
  return /Mac|iPhone|iPad|iPod/i.test(platform);
};

export const getModifierKey = (): string => (isMac() ? '⌘' : 'Ctrl');
export const getCommandShortcut = (): string => (isMac() ? '⌘K' : 'Ctrl+K');
