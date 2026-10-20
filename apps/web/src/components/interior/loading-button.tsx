import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;
const CROSSFADE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;
const INSTANT = { duration: 0 } as const;

export type AsyncActionStatus = "idle" | "pending" | "success" | "error";

export type UseAsyncActionOptions = {
  action: () => unknown;
  resetAfter?: number;
  onError?: (error: unknown) => void;
};

function useAsyncAction({
  action,
  resetAfter = 1400,
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

function Spinner({ still }: { still: boolean }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
      animate={still ? undefined : { rotate: 360 }}
      transition={
        still ? undefined : { duration: 0.85, repeat: Infinity, ease: "linear" }
      }
    >
      <circle
        cx="6"
        cy="6"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.22"
      />
      <path
        d="M10.5 6A4.5 4.5 0 0 0 6 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

function CheckMark() {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
    >
      <motion.path
        d="M2.6 6.3 4.9 8.6 9.4 3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0.2 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25 }}
      />
    </motion.svg>
  );
}

function AlertMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 2.9v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 9.05h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export type LoadingButtonProps = {
  onAction: () => unknown;
  children: string;
  pendingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  resetAfter?: number;
  disabled?: boolean;
  onError?: (error: unknown) => void;
  className?: string;
  idleIcon?: ReactNode;
};

export function LoadingButton({
  onAction,
  children,
  pendingLabel = children,
  successLabel = "Done",
  errorLabel = "Try again",
  resetAfter = 2500,
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

  const fade = reduced ? INSTANT : CROSSFADE;

  const label =
    status === "pending"
      ? pendingLabel
      : status === "success"
        ? successLabel
        : status === "error"
          ? errorLabel
          : children;

  const faces = [
    {
      key: "idle",
      text: children,
      tone: "text-[#f4f3f0]",
      icon: idleIcon,
    },
    {
      key: "pending",
      text: pendingLabel,
      tone: "text-white/80",
      icon: <Spinner still={reduced === true || status !== "pending"} />,
    },
    {
      key: "success",
      text: successLabel,
      tone: "text-emerald-300 font-semibold",
      icon: <CheckMark />,
    },
    {
      key: "error",
      text: errorLabel,
      tone: "text-rose-300 font-semibold",
      icon: <AlertMark />,
    },
  ];

  const glassStyle =
    status === 'success'
      ? 'bg-gradient-to-b from-[#062c1e] to-[#031b12] text-emerald-300 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(52,211,153,0.35)]'
      : status === 'error'
      ? 'bg-gradient-to-b from-[#2e0e0e] to-[#1c0808] text-rose-300 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
      : status === 'pending'
      ? 'bg-[#18191d] text-white/90 border-white/20 shadow-sm'
      : 'bg-gradient-to-b from-[#1c1d21] to-[#101114] text-[#f4f3f0] border-white/15 hover:border-white/35 hover:from-[#25262c] hover:to-[#16171b] shadow-[0_1px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]';

  return (
    <>
      <motion.button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-busy={pending || undefined}
        aria-disabled={pending || undefined}
        whileTap={disabled || pending || reduced ? undefined : { y: 1 }}
        transition={CELL}
        onClick={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }
          run();
        }}
        className={`relative inline-flex h-8 select-none items-center justify-center rounded-lg px-space-md font-code-sm text-code-sm font-medium border outline-none transition-all duration-200 overflow-hidden cursor-pointer disabled:opacity-50 ${glassStyle} ${className}`}
        style={{ touchAction: "manipulation" }}
      >
        {/* Specular Mirror Top Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <span aria-hidden className="relative grid place-items-center">
          {faces.map((face) => (
            <motion.span
              key={face.key}
              initial={false}
              animate={
                face.key === status
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 3, filter: "blur(3px)" }
              }
              transition={fade}
              className={`col-start-1 row-start-1 flex items-center justify-center gap-space-xs whitespace-nowrap ${face.tone}`}
            >
              {face.icon}
              {face.text}
            </motion.span>
          ))}
        </span>
      </motion.button>

      <span role="status" aria-live="polite" className="sr-only">
        {status === "success" ? successLabel : status === "error" ? errorLabel : ""}
      </span>
    </>
  );
}
