import type { DestinationType } from '@mdtodocs/capability-graph';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  destination?: DestinationType;
}

export interface DocumentSnapshot {
  id: string;
  docId: string;
  docTitle: string;
  label: string;
  timestamp: number;
  content: string;
  wordCount: number;
  lineCount: number;
}

/**
 * Cleanly extracts a human-readable title from Markdown source text.
 * Prioritizes the first top-level H1 `# Heading`, then first non-empty line.
 */
export function extractDocumentTitle(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return 'Untitled Document';
  }

  // 1. Look for top-level H1
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]?.trim()) {
    return h1Match[1]
      .replace(/[*_`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  }

  // 2. Look for any heading H2/H3
  const anyHMatch = markdown.match(/^#{2,6}\s+(.+)$/m);
  if (anyHMatch && anyHMatch[1]?.trim()) {
    return anyHMatch[1]
      .replace(/[*_`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  }

  // 3. Fallback to first non-empty line
  const lines = markdown.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const cleanFirstLine = lines[0].replace(/[*_`#~-]/g, '').trim();
    if (cleanFirstLine) {
      return cleanFirstLine.length > 36
        ? `${cleanFirstLine.slice(0, 36)}...`
        : cleanFirstLine;
    }
  }

  return 'Untitled Document';
}

/**
 * Creates a new DocumentItem with timestamps and inferred title
 */
export function createDocumentItem(
  initialMarkdown = '',
  customTitle?: string,
  destination: DestinationType = 'google-docs'
): DocumentItem {
  const title = customTitle?.trim() || extractDocumentTitle(initialMarkdown);
  const now = Date.now();
  return {
    id: `doc-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    content: initialMarkdown,
    createdAt: now,
    updatedAt: now,
    destination,
  };
}

/**
 * Duplicates a document item with a new unique ID and "(Copy)" suffix
 */
export function duplicateDocumentItem(doc: DocumentItem): DocumentItem {
  const now = Date.now();
  return {
    id: `doc-${now}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${doc.title} (Copy)`,
    content: doc.content,
    createdAt: now,
    updatedAt: now,
    destination: doc.destination,
  };
}

/**
 * Creates a point-in-time DocumentSnapshot
 */
export function createDocumentSnapshot(
  doc: DocumentItem,
  label = 'Snapshot'
): DocumentSnapshot {
  const text = doc.content || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\r?\n/).length;

  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    docId: doc.id,
    docTitle: doc.title,
    label,
    timestamp: Date.now(),
    content: text,
    wordCount: words,
    lineCount: lines,
  };
}

/**
 * Reverts a document to a snapshot and generates an automatic backup of the current state
 */
export function restoreDocumentSnapshot(
  currentDoc: DocumentItem,
  snapshot: DocumentSnapshot
): {
  updatedDoc: DocumentItem;
  backupSnapshot: DocumentSnapshot;
} {
  const backupSnapshot = createDocumentSnapshot(
    currentDoc,
    `Pre-Restore Backup (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
  );

  const updatedDoc: DocumentItem = {
    ...currentDoc,
    title: extractDocumentTitle(snapshot.content),
    content: snapshot.content,
    updatedAt: Date.now(),
  };

  return {
    updatedDoc,
    backupSnapshot,
  };
}
