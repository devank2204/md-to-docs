import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';

const BOOKMARK_PROMPT_CONFIG = {
  REQUIRED_SESSION_EXPORTS: 2,
  MIN_ACTIVE_DELAY_MS: 60 * 1000, // 60 seconds
  STORAGE_KEY: 'mdtodocs_bookmark_prompt_dismissed',
  IDLE_TYPING_BUFFER_MS: 2500, // 2.5s quiet time after user stops typing
};

type CreatureId = 'pip' | 'moss' | 'lurk' | 'kitty';

interface CreatureDef {
  id: CreatureId;
  name: string;
  title: string;
  quote: string;
  celebration: string;
  perchStyle: string;
}

const CREATURE_PALS: CreatureDef[] = [
  {
    id: 'pip',
    name: 'Pip',
    title: 'The Percher Bird',
    quote: 'Chirp! Don’t lose this tool! 🔖',
    celebration: 'Chirp chirp! Saved! ✨',
    perchStyle: '-top-8 left-5',
  },
  {
    id: 'moss',
    name: 'Moss',
    title: 'The Reading Mushroom',
    quote: 'Keep this doc bookmarked! 📖',
    celebration: 'Bookmarked! Ready whenever you are 🍄',
    perchStyle: '-top-8 left-5',
  },
  {
    id: 'lurk',
    name: 'Lurk',
    title: 'The Card Peeker',
    quote: 'Peek! Keep me in your bookmarks! 👀',
    celebration: 'Yay! Saved to bookmarks! 💫',
    perchStyle: '-top-8 left-5',
  },
  {
    id: 'kitty',
    name: 'Kitty',
    title: 'The Desk Companion',
    quote: 'Purrr... press ⌘D to save me! 🐾',
    celebration: 'Purrr-fectly bookmarked! 💖',
    perchStyle: '-top-8 left-5',
  },
];

/**
 * Authentic 16x16 Pixel Art Creature Renderer
 * Inspired by Piixpal's retro-modern pixel companions.
 * Uses integer pixel coordinates for crisp High-DPI vectors without blurring.
 */
function PixelCreature({
  id,
  isPoked,
  isCelebrated,
}: {
  id: CreatureId;
  isPoked: boolean;
  isCelebrated: boolean;
}) {
  if (id === 'pip') {
    // Pip: Round blue bird with yellow belly, orange beak & flapping wing
    return (
      <svg
        viewBox="0 0 16 16"
        className={`w-9 h-9 drop-shadow-md transition-transform duration-200 ${
          isCelebrated ? 'animate-bounce' : isPoked ? '-translate-y-1.5 rotate-6' : ''
        }`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Feet / Perch claws */}
        <rect x="5" y="14" width="2" height="1" fill="#ea580c" />
        <rect x="9" y="14" width="2" height="1" fill="#ea580c" />
        {/* Tail feathers */}
        <rect x="2" y="9" width="2" height="2" fill="#0284c7" />
        <rect x="1" y="8" width="2" height="2" fill="#0369a1" />
        {/* Body (Round Sky Blue) */}
        <rect x="4" y="4" width="8" height="9" fill="#38bdf8" />
        <rect x="5" y="3" width="6" height="1" fill="#38bdf8" />
        <rect x="3" y="6" width="1" height="6" fill="#0284c7" />
        <rect x="12" y="6" width="1" height="5" fill="#0284c7" />
        {/* Yellow Belly */}
        <rect x="6" y="8" width="5" height="5" fill="#fde047" />
        <rect x="7" y="7" width="3" height="1" fill="#fef08a" />
        {/* Beak */}
        <rect x="12" y="6" width="3" height="2" fill="#f97316" />
        <rect x="12" y="7" width="2" height="1" fill="#ea580c" />
        {/* Expressive Eye with Blinking Spark */}
        <rect x="9" y="5" width="2" height="2" fill="#0f172a" />
        <rect x="9" y="5" width="1" height="1" fill="#ffffff" />
        {/* Wing (Flaps when poked or celebrated) */}
        <g className={isPoked || isCelebrated ? 'animate-pulse' : ''}>
          <rect x="4" y="7" width="3" height="4" fill="#0284c7" />
          <rect x="4" y="8" width="2" height="2" fill="#0369a1" />
        </g>
        {/* Little top feather tuft */}
        <rect x="6" y="1" width="1" height="2" fill="#0ea5e9" />
        <rect x="7" y="2" width="1" height="1" fill="#38bdf8" />
      </svg>
    );
  }

  if (id === 'moss') {
    // Moss: Mushroom reading a tiny document
    return (
      <svg
        viewBox="0 0 16 16"
        className={`w-9 h-9 drop-shadow-md transition-transform duration-200 ${
          isCelebrated ? 'animate-bounce' : isPoked ? '-translate-y-1.5 rotate-3' : ''
        }`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Red Mushroom Cap */}
        <rect x="3" y="3" width="10" height="5" fill="#ef4444" />
        <rect x="4" y="2" width="8" height="1" fill="#ef4444" />
        <rect x="2" y="6" width="12" height="2" fill="#dc2626" />
        {/* White Cap Spots */}
        <rect x="4" y="4" width="2" height="2" fill="#ffffff" />
        <rect x="9" y="3" width="2" height="2" fill="#ffffff" />
        <rect x="7" y="6" width="2" height="1" fill="#ffffff" />
        {/* Stem (Cream) */}
        <rect x="5" y="8" width="6" height="6" fill="#fef08a" />
        <rect x="6" y="14" width="4" height="1" fill="#fef08a" />
        {/* Little Blush & Eyes */}
        <rect x="6" y="9" width="1" height="2" fill="#0f172a" />
        <rect x="9" y="9" width="1" height="2" fill="#0f172a" />
        <rect x="5" y="10" width="1" height="1" fill="#f87171" opacity="0.8" />
        <rect x="10" y="10" width="1" height="1" fill="#f87171" opacity="0.8" />
        {/* Tiny Open Book */}
        <rect x="6" y="12" width="4" height="2" fill="#ffffff" />
        <rect x="5" y="12" width="1" height="2" fill="#3b82f6" />
        <rect x="10" y="12" width="1" height="2" fill="#3b82f6" />
      </svg>
    );
  }

  if (id === 'lurk') {
    // Lurk: Shadow peeker with giant glowing eyes
    return (
      <svg
        viewBox="0 0 16 16"
        className={`w-9 h-9 drop-shadow-md transition-transform duration-200 ${
          isCelebrated ? 'animate-bounce' : isPoked ? '-translate-y-1.5' : ''
        }`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Shadow body peeking from below */}
        <rect x="3" y="5" width="10" height="9" fill="#0f172a" rx="1" />
        <rect x="4" y="4" width="8" height="2" fill="#1e293b" />
        {/* Giant Glowing Cyan Eyes */}
        <rect x="4" y="6" width="3" height="4" fill="#38bdf8" />
        <rect x="9" y="6" width="3" height="4" fill="#38bdf8" />
        {/* Pupils looking around */}
        <rect x="5" y="7" width="2" height="2" fill="#0f172a" />
        <rect x="10" y="7" width="2" height="2" fill="#0f172a" />
        <rect x="5" y="7" width="1" height="1" fill="#ffffff" />
        <rect x="10" y="7" width="1" height="1" fill="#ffffff" />
        {/* Tiny hands peeking over border */}
        <rect x="3" y="13" width="2" height="2" fill="#1e293b" />
        <rect x="11" y="13" width="2" height="2" fill="#1e293b" />
      </svg>
    );
  }

  // Kitty: Ginger marmalade cat
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-9 h-9 drop-shadow-md transition-transform duration-200 ${
        isCelebrated ? 'animate-bounce' : isPoked ? '-translate-y-1.5 rotate-3' : ''
      }`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Ears */}
      <rect x="4" y="2" width="2" height="2" fill="#f59e0b" />
      <rect x="10" y="2" width="2" height="2" fill="#f59e0b" />
      <rect x="5" y="3" width="1" height="1" fill="#fecdd3" />
      <rect x="10" y="3" width="1" height="1" fill="#fecdd3" />
      {/* Head & Body */}
      <rect x="4" y="4" width="8" height="9" fill="#f59e0b" />
      <rect x="3" y="5" width="1" height="7" fill="#d97706" />
      <rect x="12" y="5" width="1" height="7" fill="#d97706" />
      {/* Green Slit Eyes */}
      <rect x="5" y="6" width="2" height="2" fill="#22c55e" />
      <rect x="9" y="6" width="2" height="2" fill="#22c55e" />
      <rect x="6" y="6" width="1" height="2" fill="#0f172a" />
      <rect x="10" y="6" width="1" height="2" fill="#0f172a" />
      {/* Pink Nose */}
      <rect x="7.5" y="8" width="1" height="1" fill="#f43f5e" />
      {/* Whiskers */}
      <rect x="2" y="8" width="2" height="1" fill="#ffffff" opacity="0.9" />
      <rect x="12" y="8" width="2" height="1" fill="#ffffff" opacity="0.9" />
      {/* Paws */}
      <rect x="5" y="13" width="2" height="1" fill="#ffffff" />
      <rect x="9" y="13" width="2" height="1" fill="#ffffff" />
    </svg>
  );
}

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

  // Creature state
  const [palIndex, setPalIndex] = useState(0);
  const [isPoked, setIsPoked] = useState(false);
  const [isGuiding, setIsGuiding] = useState(false);
  const [isCelebrated, setIsCelebrated] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const currentPal = CREATURE_PALS[palIndex];

  // Derive platform shortcut without cascading renders
  const [platformShortcut] = useState(() => {
    const isMac =
      typeof navigator !== 'undefined' &&
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

  // Handle Creature Poke Interaction
  const handlePoke = useCallback(() => {
    setIsPoked(true);
    setTimeout(() => {
      setIsPoked(false);
    }, 2400);
  }, []);

  // Handle Companion Switcher
  const handleCyclePal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPalIndex((prev) => (prev + 1) % CREATURE_PALS.length);
    setIsPoked(true);
    setTimeout(() => {
      setIsPoked(false);
    }, 2000);
  }, []);

  // Handle Genuine Bookmark Celebration (when user presses shortcut, finishes drag, or confirms)
  const handleCelebration = useCallback(() => {
    setIsCelebrated(true);
    setIsGuiding(false);
    try {
      localStorage.setItem(BOOKMARK_PROMPT_CONFIG.STORAGE_KEY, 'true');
    } catch {
      // Ignore write error
    }
    // Auto-dismiss smoothly after celebratory dance
    setTimeout(() => {
      setIsDismissed(true);
    }, 2800);
  }, []);

  // Handle CTA Click: Copy URL, try Web Share API, or guide user to the address bar star
  const handleBookmarkAction = useCallback(async () => {
    // 1. Copy URL to clipboard for convenience
    try {
      const url = typeof window !== 'undefined' ? window.location.origin : 'https://mdtodocs.app';
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Clipboard write failed or blocked
    }

    // 2. Try Web Share API (native on supported mobile/desktop browsers)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'md.to.docs - Markdown Document Studio',
          url: window.location.origin,
        });
        handleCelebration();
        return;
      } catch {
        // User cancelled share dialog or unsupported target; fall back to guidance
      }
    }

    // 3. Switch to guidance mode pointing to address bar star
    setIsGuiding(true);
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 2400);
  }, [handleCelebration]);

  // Handle 1-click Windows / Desktop Shortcut Download (.url file)
  const handleDownloadShortcut = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://mdtodocs.app';
    const content = `[InternetShortcut]\nURL=${url}/\nIconIndex=0\n`;
    const blob = new Blob([content], { type: 'application/internet-shortcut' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'md-to-docs.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    handleCelebration();
  }, [handleCelebration]);

  // Listen for Ctrl+D / Cmd+D to celebrate in-app when user presses the native shortcut
  useEffect(() => {
    const handleBookmarkKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        handleCelebration();
      }
    };
    window.addEventListener('keydown', handleBookmarkKey);
    return () => window.removeEventListener('keydown', handleBookmarkKey);
  }, [handleCelebration]);

  // Dev preview support: allows instant testing via #bookmark or ?preview=bookmark
  const isDevPreview =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('bookmark') ||
      window.location.search.includes('preview=bookmark'));

  const isEligible =
    isDevPreview ||
    (!isDismissed &&
      sessionExportCount >= BOOKMARK_PROMPT_CONFIG.REQUIRED_SESSION_EXPORTS &&
      sessionActiveMs >= BOOKMARK_PROMPT_CONFIG.MIN_ACTIVE_DELAY_MS &&
      !isCompiling &&
      !isTyping &&
      !isInputFocused);

  if (!isEligible) {
    return null;
  }

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://mdtodocs.app';

  return (
    <aside
      role="complementary"
      aria-label="Bookmark suggestion"
      data-print-hide
      className="fixed top-20 right-5 z-50 max-w-[360px] w-full select-none animate-in fade-in slide-in-from-top-3 duration-300"
    >
      {/* Living Piixpal Creature Perched on Top Edge */}
      <div
        className={`absolute z-30 flex items-center gap-2 ${currentPal.perchStyle} transition-all duration-300`}
      >
        <button
          type="button"
          onClick={handlePoke}
          title={`Poke ${currentPal.name} (${currentPal.title})!`}
          className="relative group cursor-pointer focus:outline-hidden transition-transform duration-200 active:scale-90 hover:scale-110"
        >
          {/* Subtle creature shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1.5 bg-black/40 rounded-full blur-xs pointer-events-none" />

          {/* Living Pixel Creature */}
          <div className={`transform transition-transform ${isPoked ? '-translate-y-1 scale-110' : ''}`}>
            <PixelCreature
              id={currentPal.id}
              isPoked={isPoked}
              isCelebrated={isCelebrated}
            />
          </div>

          {/* Floating Dialogue Speech Bubble on Poke or Guidance */}
          {(isPoked || isGuiding) && !isCelebrated && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950 text-white font-mono text-[10px] px-2.5 py-1 rounded-lg border border-primary/40 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1 z-50 pointer-events-none">
              <span>{isGuiding ? `Press ${platformShortcut} or drag to save! 🌟` : currentPal.quote}</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-primary/40 rotate-45 transform" />
            </div>
          )}

          {/* Floating Dialogue Speech Bubble on Celebration */}
          {isCelebrated && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950 text-emerald-200 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1 z-50 pointer-events-none">
              <span>{currentPal.celebration}</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-950 border-r border-b border-emerald-500/40 rotate-45 transform" />
            </div>
          )}

          {/* Sparkle effects on celebration */}
          {isCelebrated && (
            <div className="absolute -top-3 -right-2 flex gap-0.5 text-xs animate-bounce pointer-events-none">
              <span>✨</span>
              <span>⭐</span>
            </div>
          )}
        </button>

        {/* Pal Switcher Pill */}
        <button
          type="button"
          onClick={handleCyclePal}
          title="Switch creature companion (Pip, Moss, Lurk, Kitty)"
          className="bg-slate-900/90 dark:bg-black/90 hover:bg-slate-800 text-white/90 hover:text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-primary/30 backdrop-blur-md flex items-center gap-1 cursor-pointer shadow-md transition-colors"
        >
          <span className="material-symbols-outlined text-[12px] text-primary">sync</span>
          <span>{currentPal.name}</span>
        </button>
      </div>

      {/* Glassmorphic Toast Card Body */}
      <div className="relative pt-4 px-4 pb-3.5 rounded-2xl bg-surface-container-highest/95 dark:bg-slate-900/95 backdrop-blur-xl border border-outline-variant/60 dark:border-white/15 shadow-xl text-on-surface overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

        <div className="flex items-start gap-3">
          {/* Animated Bookmark Badge with Creature Head */}
          <div
            onClick={handlePoke}
            title={`Poke ${currentPal.name}!`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 p-1 ${
              isCelebrated
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 scale-105 shadow-md shadow-emerald-500/20'
                : 'bg-primary/15 text-primary border border-primary/25 hover:scale-105 hover:bg-primary/25 shadow-xs'
            }`}
          >
            {isCelebrated ? (
              <span className="material-symbols-outlined text-[22px] text-emerald-400 animate-in zoom-in-75 duration-200">
                check_circle
              </span>
            ) : (
              <PixelCreature
                id={currentPal.id}
                isPoked={isPoked}
                isCelebrated={isCelebrated}
              />
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-semibold text-on-surface leading-tight flex items-center gap-1.5">
              <span>
                {isCelebrated
                  ? 'Bookmark Saved!'
                  : isGuiding
                    ? `Save with ${platformShortcut} or Drag`
                    : 'Loving md.to.docs?'}
              </span>
              <span className="text-[10px] font-normal text-on-surface-variant/80">
                ({currentPal.name} says hi)
              </span>
            </h4>

            <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
              {isCelebrated ? (
                currentPal.celebration
              ) : isGuiding ? (
                <span>
                  Press <kbd className="px-1 py-0.5 rounded bg-surface-container border border-outline-variant/50 font-mono text-[10px] font-semibold text-on-surface">{platformShortcut}</kbd> or click the <span className="font-semibold text-amber-400">★</span> in your browser’s address bar!
                </span>
              ) : (
                'Save this workspace so you can jump right back in anytime.'
              )}
            </p>

            {/* Guiding Beacon / Clipboard notification */}
            {isGuiding && !isCelebrated && (
              <div className="mt-2 py-1 px-2 rounded-md bg-primary/10 border border-primary/20 text-[10px] text-primary flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                <span>{copiedLink ? 'Studio URL copied to clipboard!' : 'Ready to save in your browser'}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
              {isCelebrated ? (
                /* Celebrated Badge */
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-medium border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[13px]">done_all</span>
                  <span>Saved in your Bookmarks!</span>
                </div>
              ) : isGuiding ? (
                /* In Guidance Mode */
                <>
                  <button
                    type="button"
                    onClick={handleCelebration}
                    title="Confirm you have bookmarked the page"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-medium border border-emerald-500/30 transition-colors cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[12px]">check</span>
                    <span>Done, I Saved It!</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadShortcut}
                    title="Download 1-click Windows / Desktop launcher shortcut (.url)"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[10px] font-medium border border-outline-variant/40 transition-colors cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[12px]">download</span>
                    <span>Desktop App</span>
                  </button>
                </>
              ) : (
                /* Initial Prompt Mode */
                <>
                  {/* Real Draggable Bookmark Link: Natively accepted by Chrome/Edge/Firefox Bookmarks Bar! */}
                  <a
                    href={siteOrigin}
                    title="md.to.docs — Markdown Document Studio"
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', siteOrigin);
                      e.dataTransfer.setData('text/uri-list', siteOrigin);
                    }}
                    onDragEnd={handleCelebration}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-medium border border-primary/30 transition-all cursor-grab active:cursor-grabbing active:scale-95 shadow-2xs group"
                  >
                    <span className="material-symbols-outlined text-[13px] group-hover:scale-110 transition-transform">drag_indicator</span>
                    <span>Drag to Bookmark Bar</span>
                  </a>

                  {/* Hotkey / Guide CTA Button */}
                  <button
                    type="button"
                    onClick={handleBookmarkAction}
                    title={`Click to copy URL or press ${platformShortcut}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-medium border border-outline-variant/50 transition-colors cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[13px] text-amber-400">star</span>
                    <span>{platformShortcut}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
            aria-label="Dismiss bookmark prompt"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
