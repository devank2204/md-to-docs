import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';

const BOOKMARK_PROMPT_CONFIG = {
  REQUIRED_SESSION_EXPORTS: 2,
  MIN_ACTIVE_DELAY_MS: 60 * 1000, // 60 seconds
  STORAGE_KEY: 'mdtodocs_bookmark_prompt_dismissed',
  IDLE_TYPING_BUFFER_MS: 2500, // 2.5s quiet time after user stops typing
};

export function BookmarkPrompt() {
  const sessionExportCount = useStore((state) => state.sessionExportCount);
  const isCompiling = useStore((state) => state.isCompiling);

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(BOOKMARK_PROMPT_CONFIG.STORAGE_KEY) === 'true';
    } catch {
      // Local storage unavailable or blocked
      return true;
    }
  });

  const [sessionActiveMs, setSessionActiveMs] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Derive platform shortcut without cascading renders
  const [platformShortcut] = useState(() => {
    const isMac = typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    return isMac ? '⌘D' : 'Ctrl+D';
  });

  // Track active time (ticks when tab is visible / active)
  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSessionActiveMs((prev) => prev + 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  // Track user typing / input interactions to avoid interrupting active work
  useEffect(() => {
    if (isDismissed) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleUserActivity = () => {
      setIsTyping(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsTyping(false);
      }, BOOKMARK_PROMPT_CONFIG.IDLE_TYPING_BUFFER_MS);
    };

    const handleFocusChange = () => {
      const activeEl = document.activeElement;
      const isFocused = Boolean(
        activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true' ||
            activeEl.closest('.monaco-editor'))
      );
      setIsInputFocused(isFocused);
    };

    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('input', handleUserActivity, { passive: true });
    window.addEventListener('focusin', handleFocusChange, { passive: true });
    window.addEventListener('focusout', handleFocusChange, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('input', handleUserActivity);
      window.removeEventListener('focusin', handleFocusChange);
      window.removeEventListener('focusout', handleFocusChange);
    };
  }, [isDismissed]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(BOOKMARK_PROMPT_CONFIG.STORAGE_KEY, 'true');
    } catch {
      // Ignore write errors (e.g. private browsing restrictions)
    }
  }, []);

  const isEligible =
    !isDismissed &&
    sessionExportCount >= BOOKMARK_PROMPT_CONFIG.REQUIRED_SESSION_EXPORTS &&
    sessionActiveMs >= BOOKMARK_PROMPT_CONFIG.MIN_ACTIVE_DELAY_MS &&
    !isCompiling &&
    !isTyping &&
    !isInputFocused;

  if (!isEligible) {
    return null;
  }

  return (
    <aside
      role="complementary"
      aria-label="Bookmark suggestion"
      data-print-hide
      className="fixed top-14 right-4 z-40 max-w-xs w-full bg-surface-container-highest/95 backdrop-blur-md border border-outline-variant/60 rounded-xl p-3.5 shadow-md text-on-surface animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start gap-3">
        {/* Subtle bookmark icon */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[18px]">bookmark</span>
        </div>

        {/* Message & Hint */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-medium text-on-surface leading-snug">
            Handy little tool, right? Bookmark it for next time.
          </p>

          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/80 font-mono text-[10px] text-on-surface font-semibold shadow-2xs">
              {platformShortcut}
            </kbd>
            <span>in your browser</span>
            <span
              className="material-symbols-outlined text-[14px] text-primary rotate-45 transform"
              title="Bookmark in browser header"
              aria-hidden="true"
            >
              arrow_upward
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors shrink-0"
          aria-label="Dismiss bookmark prompt"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </aside>
  );
}
