import { describe, it, expect } from 'vitest';
import {
  extractDocumentTitle,
  createDocumentItem,
  duplicateDocumentItem,
  createDocumentSnapshot,
  restoreDocumentSnapshot,
} from '@mdtodocs/renderers';

describe('Multi-Document Local Workspace & History', () => {
  describe('extractDocumentTitle', () => {
    it('extracts top-level H1 heading cleanly', () => {
      const md = `# RFC 9110: HTTP Architecture & Semantics\n\nThis is an RFC document.`;
      expect(extractDocumentTitle(md)).toBe('RFC 9110: HTTP Architecture & Semantics');
    });

    it('strips markdown formatting like bold, code, and links from heading', () => {
      const md = `# **System Architecture**: [RFC-001](https://example.com) with \`v2.0\``;
      expect(extractDocumentTitle(md)).toBe('System Architecture: RFC-001 with v2.0');
    });

    it('falls back to H2 or H3 when H1 is missing', () => {
      const md = `## Architecture Decision Record: Event Sourcing\n\nDetails here.`;
      expect(extractDocumentTitle(md)).toBe('Architecture Decision Record: Event Sourcing');
    });

    it('falls back to first line or Untitled Document for empty text', () => {
      expect(extractDocumentTitle('Just plain text on first line\nSecond line')).toBe('Just plain text on first line');
      expect(extractDocumentTitle('')).toBe('Untitled Document');
      expect(extractDocumentTitle('   \n  \n')).toBe('Untitled Document');
    });
  });

  describe('createDocumentItem & duplicateDocumentItem', () => {
    it('creates a DocumentItem with unique ID and inferred title', () => {
      const md = `# SEV-1 Post-Mortem: Outage Report\n\nIncident summary.`;
      const doc = createDocumentItem(md);

      expect(doc.id).toMatch(/^doc-\d+-[a-z0-9]+$/);
      expect(doc.title).toBe('SEV-1 Post-Mortem: Outage Report');
      expect(doc.content).toBe(md);
      expect(doc.createdAt).toBeGreaterThan(0);
      expect(doc.updatedAt).toBeGreaterThan(0);
    });

    it('duplicates a document item cleanly with (Copy) label and unique ID', () => {
      const original = createDocumentItem('# Core Product Spec\n\nSpec content.');
      const copy = duplicateDocumentItem(original);

      expect(copy.id).not.toBe(original.id);
      expect(copy.title).toBe('Core Product Spec (Copy)');
      expect(copy.content).toBe(original.content);
    });
  });

  describe('createDocumentSnapshot & restoreDocumentSnapshot', () => {
    it('captures point-in-time snapshot with word and line counts', () => {
      const doc = createDocumentItem('# Release Notes v2.5\n\n- Feature A\n- Feature B\n- Bugfix C');
      const snapshot = createDocumentSnapshot(doc, 'Pre-Deploy Review');

      expect(snapshot.id).toMatch(/^snap-\d+-[a-z0-9]+$/);
      expect(snapshot.docId).toBe(doc.id);
      expect(snapshot.label).toBe('Pre-Deploy Review');
      expect(snapshot.content).toBe(doc.content);
      expect(snapshot.wordCount).toBeGreaterThan(5);
      expect(snapshot.lineCount).toBe(5);
    });

    it('restores snapshot and creates an automated safety backup', () => {
      const originalDoc = createDocumentItem('# Original Spec\n\nVersion 1 content.');
      const v1Snapshot = createDocumentSnapshot(originalDoc, 'Version 1');

      // Mutate document to Version 2
      const modifiedDoc = {
        ...originalDoc,
        title: 'Modified Spec',
        content: '# Modified Spec\n\nVersion 2 new changes that user wants to rollback.',
      };

      const { updatedDoc, backupSnapshot } = restoreDocumentSnapshot(modifiedDoc, v1Snapshot);

      // Verify rollback succeeded
      expect(updatedDoc.content).toBe(v1Snapshot.content);
      expect(updatedDoc.title).toBe('Original Spec');

      // Verify safety backup was created of Version 2
      expect(backupSnapshot.content).toBe(modifiedDoc.content);
      expect(backupSnapshot.label).toContain('Pre-Restore Backup');
    });
  });
});
