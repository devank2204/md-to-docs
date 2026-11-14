import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store";
import { THEMES } from "@mdtodocs/compiler-core/src/theme";
import {
  prepareDocumentExport,
  downloadFile,
  documentFilename,
} from "@/utils/exportHelpers";
import type { ExportTarget, PreparedExport } from "@/utils/exportHelpers";
import { Button, Menu } from "./Controls";
import { WorkspaceSheet } from "./WorkspaceSheet";
export function DirectDelivery() {
  const identity = useStore((s) =>
    JSON.stringify([
      s.activeDocumentId,
      s.markdown,
      s.themeId,
      s.baseFontSize,
      s.documentSignature,
      s.documents.find((d) => d.id === s.activeDocumentId)?.title,
    ]),
  );
  return <DeliveryControls key={identity} />;
}
function DeliveryControls() {
  const markdown = useStore((s) => s.markdown);
  const [status, setStatus] = useState<
    "idle" | "working" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [retryTarget, setRetryTarget] = useState<ExportTarget>("google-docs");
  const [warning, setWarning] = useState<ExportTarget | null>(null);
  const [print, setPrint] = useState<Extract<
    PreparedExport,
    { kind: "print" }
  > | null>(null);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const printRef = useRef(print);
  useEffect(() => {
    printRef.current = print;
  }, [print]);
  useEffect(
    () => () => {
      request.current++;
      controller.current?.abort();
      printRef.current?.snapshot.dispose();
    },
    [],
  );
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [status]);
  useEffect(() => {
    const deliver=(event:Event)=>run(((event as CustomEvent).detail || 'pdf') as ExportTarget);
    window.addEventListener('mdtodocs:deliver',deliver);
    window.addEventListener('mdtodocs:prepare-print',deliver);
    return()=>{window.removeEventListener('mdtodocs:deliver',deliver);window.removeEventListener('mdtodocs:prepare-print',deliver)};
  });
  function run(target: ExportTarget | "markdown", confirmed = false) {
    if (status === "working") return;
    const state = useStore.getState();
    if (!state.markdown.trim()) return;
    if (
      target !== "markdown" &&
      !confirmed &&
      state.diagnostics.some(
        (n) => n.severity === "warning" || n.severity === "error",
      )
    ) {
      setWarning(target);
      return;
    }
    if (target === "markdown") {
      downloadFile(
        new File(
          [state.markdown],
          documentFilename(
            state.documents.find((d) => d.id === state.activeDocumentId)
              ?.title || "Document",
            "md",
          ),
          { type: "text/markdown;charset=utf-8" },
        ),
      );
      return;
    }
    setRetryTarget(target);
    const version = JSON.stringify([
      state.activeDocumentId,
      state.markdown,
      state.themeId,
      state.baseFontSize,
      state.documentSignature,
      state.documents.find((d) => d.id === state.activeDocumentId)?.title,
    ]);
    const current = () => {
      const s = useStore.getState();
      return (
        version ===
        JSON.stringify([
          s.activeDocumentId,
          s.markdown,
          s.themeId,
          s.baseFontSize,
          s.documentSignature,
          s.documents.find((d) => d.id === s.activeDocumentId)?.title,
        ])
      );
    };
    const id = ++request.current;
    controller.current?.abort();
    controller.current = new AbortController();
    const signal = controller.current.signal;
    let needsDiagramReview = false;
    const input = {
      reviewDiagramFailures: !confirmed,
      markdown: state.markdown,
      destination: target,
      theme: {
        ...THEMES[state.themeId],
        typography: {
          ...THEMES[state.themeId].typography,
          baseFontSizePt: state.baseFontSize,
        },
      },
      signature: state.documentSignature,
      title:
        state.documents.find((d) => d.id === state.activeDocumentId)?.title ||
        "Document",
    };
    setStatus("working");
    setMessage("");
    const prepared = prepareDocumentExport(input, signal)
      .then((data) => {
        if (!current() || signal.aborted) {
          if (data.kind === "print") data.snapshot.dispose();
          throw new Error("Document changed. Try again with the latest text.");
        }
        return data;
      })
      .catch((error) => {
        needsDiagramReview =
          error instanceof Error && error.message === "diagram_review_required";
        throw error;
      });
    let delivery: Promise<unknown>;
    if (target === "google-docs" || target === "clipboard") {
      try {
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
          throw new Error(
            "Formatted copy is unavailable. Try Word download instead.",
          );
        // Invoke write synchronously in the click; deferred preparation feeds promised blobs.
        delivery = navigator.clipboard.write([
          new ClipboardItem({
            "text/html": prepared.then((d) => {
              if (d.kind !== "clipboard")
                throw new Error("Clipboard preparation failed");
              return new Blob([d.html], { type: "text/html" });
            }),
            "text/plain": prepared.then((d) => {
              if (d.kind !== "clipboard")
                throw new Error("Clipboard preparation failed");
              return new Blob([d.plain], { type: "text/plain" });
            }),
          }),
        ]);
      } catch (error) {
        delivery = Promise.reject(error);
      }
      // Preparation may outlive a denied write. Always observe its rejection.
      prepared.catch(() => {});
    } else
      delivery = prepared.then((data) => {
        if (data.kind === "file") downloadFile(data.file);
        else if (data.kind === "print") setPrint(data);
      });
    delivery
      .then(() => {
        if (id !== request.current || !current()) return;
        setStatus(
          target === "google-docs" || target === "clipboard"
            ? "success"
            : "idle",
        );
        if (target === "google-docs" || target === "clipboard")
          useStore.getState().recordSuccessfulExport();
      })
      .catch((error) => {
        if (id !== request.current || !current()) return;
        controller.current?.abort();
        if (needsDiagramReview) {
          setStatus("idle");
          setWarning(target);
          return;
        }
        setStatus("error");
        setMessage(
          error instanceof Error && error.message.includes("Document changed")
            ? error.message
            : "Could not complete this action. Your text is safe. Retry, or download Word instead.",
        );
      });
  }
  return (
    <div
      className="ux-delivery font-code-sm text-code-sm font-medium"
      data-print-hide
    >
      <Button
        className="ux-copy"
        state={status}
        disabled={!markdown.trim() || status === "working"}
        onClick={() => run("google-docs")}
      >
        <span aria-hidden="true">
          {status === "success" ? "✓" : status === "working" ? "…" : ""}
        </span>
        {status === "success"
          ? "Copied"
          : status === "working"
            ? "Preparing…"
            : "Copy for Google Docs"}
      </Button>
      {status === "success" && (
        <span role="status" className="sr-only">
          Copied to clipboard. Paste into Google Docs.
        </span>
      )}
      <Menu label="Download">
        <button
          disabled={!markdown.trim() || status === "working"}
          onClick={() => run("word")}
        >
          Word (.docx)
        </button>
        <button disabled={!markdown.trim()} onClick={() => run("markdown")}>
          Markdown (.md)
        </button>
        <button
          disabled={!markdown.trim() || status === "working"}
          onClick={() => run("html")}
        >
          HTML (.html)
        </button>
        <button
          disabled={!markdown.trim() || status === "working"}
          onClick={() => run("pdf")}
        >
          Print / Save as PDF
        </button>
        <button
          disabled={!markdown.trim() || status === "working"}
          onClick={() => run("clipboard")}
        >
          Copy rich text
        </button>
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("mdtodocs:delivery-options"))
          }
        >
          Document options
        </button>
      </Menu>
      {message && (
        <div className="ux-feedback" role="alert">
          {message}
          <Button onClick={() => run(retryTarget)}>Retry</Button>
          <Button onClick={() => setMessage("")}>Dismiss</Button>
        </div>
      )}
      {warning && (
        <WorkspaceSheet
          title="Review before delivery"
          onClose={() => setWarning(null)}
        >
          <p className="sheet-description">
            Some formatting may change or diagrams may be missing. Review the
            affected source, or continue with the current output.
          </p>
          <Button
            onClick={() => {
              setWarning(null);
              window.dispatchEvent(new CustomEvent("mdtodocs:review"));
            }}
          >
            Review issues
          </Button>
          <Button
            onClick={() => {
              const target = warning;
              setWarning(null);
              run(target, true);
            }}
          >
            Continue anyway
          </Button>
        </WorkspaceSheet>
      )}
      {print && (
        <WorkspaceSheet
          title="Print / Save as PDF"
          onClose={() => {
            print.snapshot.dispose();
            setPrint(null);
          }}
        >
          <p className="sheet-description">
            Your print document is ready. Choose Save as PDF in the browser
            dialog if available.
          </p>
          <Button onClick={() => print.snapshot.print()}>Open Print</Button>
        </WorkspaceSheet>
      )}
    </div>
  );
}
