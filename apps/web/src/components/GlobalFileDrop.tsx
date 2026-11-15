import { useEffect, useState } from "react";
import { importMarkdownFiles } from "@/utils/importMarkdown";
export function GlobalFileDrop() {
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const over = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        setDragging(true);
      }
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    let busy = false;
    const drop = (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (busy) {
        setMessage("Finish opening the current files before dropping more.");
        return;
      }
      busy = true;
      importMarkdownFiles(Array.from(e.dataTransfer.files))
        .then(() => setMessage(""))
        .catch((error) => setMessage(error.message))
        .finally(() => {
          busy = false;
        });
    };
    window.addEventListener("dragover", over, true);
    window.addEventListener("dragleave", leave, true);
    window.addEventListener("drop", drop, true);
    const startup = (event: Event) => {
      const files = (event as CustomEvent<File[]>).detail;
      void importMarkdownFiles(files).catch((error) =>
        setMessage(error.message),
      );
    };
    window.addEventListener("mdtodocs:import-files", startup);
    const queued = (window as any).__mdDroppedFiles as File[] | undefined;
    if (queued?.length) {
      delete (window as any).__mdDroppedFiles;
      void importMarkdownFiles(queued).catch((error) =>
        setMessage(error.message),
      );
    }
    return () => {
      window.removeEventListener("dragover", over, true);
      window.removeEventListener("dragleave", leave, true);
      window.removeEventListener("drop", drop, true);
      window.removeEventListener("mdtodocs:import-files", startup);
    };
  }, []);
  return (
    <>
      {dragging && (
        <div className="file-drop-overlay" aria-hidden="true">
          Drop Markdown to open a new document
        </div>
      )}
      {message && (
        <div className="import-error" role="alert">
          {message}
          <button onClick={() => setMessage("")}>Dismiss</button>
        </div>
      )}
    </>
  );
}
