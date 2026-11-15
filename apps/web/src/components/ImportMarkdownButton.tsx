import { importMarkdownFiles } from "@/utils/importMarkdown";
import { useRef, useState } from "react";

export function ImportMarkdownButton() {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-surface-container"
        onClick={() => input.current?.click()}
      >
        Import Markdown
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept=".md,.markdown,.txt,text/plain,text/markdown"
        aria-label="Import Markdown file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (
            !/\.(md|markdown|txt)$/i.test(file.name) ||
            file.size > 1_000_000
          ) {
            setMessage("Choose a Markdown or text file smaller than 1 MB.");
            return;
          }
          try {
            await importMarkdownFiles([file]);
            setMessage("");
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Could not open this file.",
            );
          }
        }}
      />
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
