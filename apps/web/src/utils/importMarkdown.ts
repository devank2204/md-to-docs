import { useStore } from "@/store";
export async function importMarkdownFiles(files: File[]) {
  const valid = files.filter((f) => /\.(md|markdown|txt)$/i.test(f.name));
  if (!valid.length) throw new Error("Choose a .md, .markdown, or .txt file.");
  // Serialize capacity decisions, including multi-file drops, without evicting work.
  for (const file of valid) {
    if (file.size > 1_000_000)
      throw new Error("Choose a Markdown or text file smaller than 1 MB.");
    const text = await file.text();
    if (!text.trim() || text.includes("\0"))
      throw new Error("Choose a nonempty Markdown or text file.");
    const state = useStore.getState();
    state.createDocument(text, file.name.replace(/\.(md|markdown|txt)$/i, ""));
    if (useStore.getState().pendingDocument) {
      const accepted = await new Promise<boolean>((resolve) => {
        const pendingId = useStore.getState().pendingDocument!.id;
        const unsubscribe = useStore.subscribe((next) => {
          if (!next.pendingDocument) {
            unsubscribe();
            resolve(next.documents.some((d) => d.id === pendingId));
          }
        });
      });
      if (!accepted) return;
    }
    window.dispatchEvent(new Event("mdtodocs:document-opened"));
  }
}
