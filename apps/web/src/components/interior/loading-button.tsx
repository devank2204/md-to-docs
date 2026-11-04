import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { DestinationType } from "@mdtodocs/capability-graph";

// Emil Kowalski Design Engineering tokens:
// Strong ease-out: cubic-bezier(0.23, 1, 0.32, 1)
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export type AsyncActionStatus = "idle" | "pending" | "success" | "error";

export type UseAsyncActionOptions = {
  action: () => unknown;
  resetAfter?: number;
  onError?: (error: unknown) => void;
};

function useAsyncAction({
  action,
  resetAfter = 1500,
  onError,
}: UseAsyncActionOptions) {
  const [status, setStatus] = useState<AsyncActionStatus>("idle");

  const phase = useRef<AsyncActionStatus>("idle");
  const runId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const act = useRef(action);
  const fail = useRef(onError);

  useEffect(() => {
    act.current = action;
    fail.current = onError;
  });

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    runId.current += 1;
    clear();
    phase.current = "idle";
    setStatus("idle");
  }, [clear]);

  const run = useCallback(() => {
    if (phase.current === "pending") return;

    clear();
    const id = ++runId.current;
    phase.current = "pending";
    setStatus("pending");

    const settle = (next: "success" | "error") => {
      if (!alive.current || id !== runId.current) return;
      clear();
      phase.current = next;
      setStatus(next);
      timer.current = setTimeout(() => {
        if (!alive.current || id !== runId.current) return;
        phase.current = "idle";
        setStatus("idle");
      }, resetAfter);
    };

    Promise.resolve()
      .then(() => act.current())
      .then(
        () => settle("success"),
        (error: unknown) => {
          fail.current?.(error);
          settle("error");
        },
      );
  }, [clear, resetAfter]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clear();
    };
  }, [clear]);

  return {
    status,
    run,
    reset,
    pending: status === "pending",
  };
}

export type LoadingButtonProps = {
  onAction: () => unknown;
  children: ReactNode;
  pendingLabel?: ReactNode;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  resetAfter?: number;
  disabled?: boolean;
  onError?: (error: unknown) => void;
  className?: string;
  idleIcon?: ReactNode;
  destination?: DestinationType;
};

export function LoadingButton({
  onAction,
  children,
  pendingLabel = children,
  successLabel = "Copied!",
  errorLabel = "Try again",
  resetAfter = 1500,
  disabled = false,
  onError,
  className = "",
  idleIcon,
}: LoadingButtonProps) {
  const reduced = useReducedMotion();

  const { status, run, pending } = useAsyncAction({
    action: onAction,
    resetAfter,
    onError,
  });

  const label =
    status === "pending"
      ? pendingLabel
      : status === "success"
        ? successLabel
        : status === "error"
          ? errorLabel
          : children;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={typeof label === "string" ? label : undefined}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      // Emil Kowalski rule: Buttons must feel responsive.
      // scale(0.97) on :active with 160ms ease-out
      whileTap={disabled || pending || reduced ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.16, ease: EASE_OUT }}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        run();
      }}
      className={`relative inline-flex h-8 select-none items-center justify-center rounded-lg px-3 font-code-sm text-code-sm font-medium outline-none cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 border border-black/5 dark:border-white/10 ${className}`}
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {status === "idle" && (
            <motion.span
              key="idle"
              initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex items-center gap-1.5"
            >
              {idleIcon}
              <span>{children}</span>
            </motion.span>
          )}

          {status === "pending" && (
            <motion.span
              key="pending"
              initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex items-center gap-1.5"
            >
              {/* Fast-spinning spinner: 0.6s linear per Emil Kowalski perceived performance rule */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="animate-spin text-current opacity-80"
                style={{ animationDuration: "600ms" }}
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.25" />
                <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <span>{pendingLabel}</span>
            </motion.span>
          )}

          {status === "success" && (
            <motion.span
              key="success"
              initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex items-center gap-1.5"
            >
              {/* Crisp, clean checkmark */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="text-current"
              >
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{successLabel}</span>
            </motion.span>
          )}

          {status === "error" && (
            <motion.span
              key="error"
              initial={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="flex items-center gap-1.5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="text-current"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.3" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{errorLabel}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
