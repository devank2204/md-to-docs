import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  parseReviewNotesText,
  reconcileMarkdown,
  inferReplacementFromComment,
  extractDocxComments,
} from '@mdtodocs/renderers';

describe('Reconciliation Engine', () => {
  describe('inferReplacementFromComment', () => {
    it('extracts replacements from common prefix patterns', () => {
      expect(inferReplacementFromComment('Replace with: 250ms p99 SLA')).toBe('250ms p99 SLA');
      expect(inferReplacementFromComment('Change to: PostgreSQL 16')).toBe('PostgreSQL 16');
      expect(inferReplacementFromComment('Update to: v2.4.0')).toBe('v2.4.0');
      expect(inferReplacementFromComment('Suggest: Redis 7.2')).toBe('Redis 7.2');
      expect(inferReplacementFromComment('Please change to: 10,000 req/sec')).toBe('10,000 req/sec');
      expect(inferReplacementFromComment('-> Apache Kafka')).toBe('Apache Kafka');
      expect(inferReplacementFromComment('Did you mean "TLS 1.3"?')).toBe('TLS 1.3');
    });

    it('returns empty string when no clear replacement is provided', () => {
      expect(inferReplacementFromComment('This section is unclear to the security team.')).toBe('');
    });
  });

  describe('parseReviewNotesText', () => {
    it('parses structured JSON array of edits', () => {
      const json = JSON.stringify([
        {
          targetText: '500ms timeout',
          replacementText: '250ms p99 SLA',
          comment: 'Tighten SLA per network team',
          author: 'Devank',
        },
        {
          targetText: 'PostgreSQL 14',
          replacementText: 'PostgreSQL 16',
        },
      ]);

      const patches = parseReviewNotesText(json);
      expect(patches).toHaveLength(2);
      expect(patches[0].targetText).toBe('500ms timeout');
      expect(patches[0].replacementText).toBe('250ms p99 SLA');
      expect(patches[0].comment).toBe('Tighten SLA per network team');
      expect(patches[0].author).toBe('Devank');
      expect(patches[1].targetText).toBe('PostgreSQL 14');
      expect(patches[1].replacementText).toBe('PostgreSQL 16');
    });

    it('parses SuggestEditModal format', () => {
      const notes = `
### Document Review Suggestion

**Document:** Architecture RFC
**Section / Context:** Section 2

**Referenced Passage:**
> The queue worker processes jobs with a 500ms timeout.

**Proposed Improvement / Feedback:**
Replace with: The queue worker processes jobs with a 250ms p99 SLA.

---
*Generated via mdtodocs*
`;

      const patches = parseReviewNotesText(notes);
      expect(patches).toHaveLength(1);
      expect(patches[0].targetText).toBe('The queue worker processes jobs with a 500ms timeout.');
      expect(patches[0].replacementText).toBe('The queue worker processes jobs with a 250ms p99 SLA.');
      expect(patches[0].author).toBe('Stakeholder Review');
    });

    it('parses Key-Value format', () => {
      const kv = `
Target: 500ms timeout
Replacement: 250ms p99 SLA
Comment: Network SLA update

---

Target: AWS S3
Replacement: Cloudflare R2
Comment: Egress cost reduction
`;

      const patches = parseReviewNotesText(kv);
      expect(patches).toHaveLength(2);
      expect(patches[0].targetText).toBe('500ms timeout');
      expect(patches[0].replacementText).toBe('250ms p99 SLA');
      expect(patches[0].comment).toBe('Network SLA update');
      expect(patches[1].targetText).toBe('AWS S3');
      expect(patches[1].replacementText).toBe('Cloudflare R2');
    });

    it('parses simple Markdown blockquotes with revisions', () => {
      const blockquoteNotes = `
> The database runs on single replica.
The database runs as a multi-region active-passive cluster.
`;

      const patches = parseReviewNotesText(blockquoteNotes);
      expect(patches).toHaveLength(1);
      expect(patches[0].targetText).toBe('The database runs on single replica.');
      expect(patches[0].replacementText).toBe(
        'The database runs as a multi-region active-passive cluster.'
      );
    });
  });

  describe('reconcileMarkdown', () => {
    const sampleDoc = `# System Architecture RFC

## 1. Overview
The queue worker processes jobs with a 500ms timeout.
All messages are serialized as JSON payloads.

## 2. Storage Layer
The database runs on PostgreSQL 14 with 3 read replicas.
Blobs are persisted in AWS S3 buckets.
`;

    it('identifies matched and unmatched patches with exact line numbers', () => {
      const patches = [
        {
          id: 'p1',
          targetText: '500ms timeout',
          replacementText: '250ms p99 SLA',
          selected: true,
          status: 'matched' as const,
        },
        {
          id: 'p2',
          targetText: 'PostgreSQL 14',
          replacementText: 'PostgreSQL 16',
          selected: true,
          status: 'matched' as const,
        },
        {
          id: 'p3',
          targetText: 'Non-existent text passage',
          replacementText: 'New text',
          selected: true,
          status: 'matched' as const,
        },
      ];

      const report = reconcileMarkdown(sampleDoc, patches);

      expect(report.matchedCount).toBe(2);
      expect(report.unmatchedCount).toBe(1);
      expect(report.patches[0].status).toBe('matched');
      expect(report.patches[0].line).toBe(4);
      expect(report.patches[1].status).toBe('matched');
      expect(report.patches[1].line).toBe(8);
      expect(report.patches[2].status).toBe('unmatched');

      // Verify updatedMarkdown has replaced both matched items
      expect(report.updatedMarkdown).toContain('250ms p99 SLA');
      expect(report.updatedMarkdown).toContain('PostgreSQL 16');
      expect(report.updatedMarkdown).not.toContain('500ms timeout');
      expect(report.updatedMarkdown).not.toContain('PostgreSQL 14');
    });

    it('detects already applied patches', () => {
      const docWithUpdate = sampleDoc.replace('PostgreSQL 14', 'PostgreSQL 16');
      const patches = [
        {
          id: 'p1',
          targetText: 'PostgreSQL 14',
          replacementText: 'PostgreSQL 16',
          selected: true,
          status: 'matched' as const,
        },
      ];

      const report = reconcileMarkdown(docWithUpdate, patches);
      expect(report.patches[0].status).toBe('already_applied');
      expect(report.appliedCount).toBe(1);
    });
  });

  describe('extractDocxComments', () => {
    it('extracts comments and anchors from a mock DOCX archive', async () => {
      const zip = new JSZip();

      // Comments XML
      zip.file(
        'word/comments.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:comment w:id="1" w:author="Alice Chen" w:date="2026-10-16T14:30:00Z">
    <w:p><w:r><w:t>Replace with: 250ms p99 SLA</w:t></w:r></w:p>
  </w:comment>
</w:comments>`
      );

      // Document XML with comment range anchors
      zip.file(
        'word/document.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>The queue worker processes jobs with a </w:t></w:r>
      <w:commentRangeStart w:id="1"/>
      <w:r><w:t>500ms timeout</w:t></w:r>
      <w:commentRangeEnd w:id="1"/>
      <w:r><w:commentReference w:id="1"/></w:r>
      <w:r><w:t>.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
      );

      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      const patches = await extractDocxComments(buffer);

      expect(patches).toHaveLength(1);
      expect(patches[0].targetText).toBe('500ms timeout');
      expect(patches[0].replacementText).toBe('250ms p99 SLA');
      expect(patches[0].author).toBe('Alice Chen');
      expect(patches[0].comment).toBe('Replace with: 250ms p99 SLA');
    });

    it('extracts Word track changes (w:del + w:ins)', async () => {
      const zip = new JSZip();
      zip.file(
        'word/document.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Database engine: </w:t></w:r>
      <w:del w:author="Bob Martin"><w:r><w:delText>MySQL 8.0</w:delText></w:r></w:del>
      <w:ins w:author="Bob Martin"><w:r><w:t>PostgreSQL 16</w:t></w:r></w:ins>
    </w:p>
  </w:body>
</w:document>`
      );

      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      const patches = await extractDocxComments(buffer);

      expect(patches).toHaveLength(1);
      expect(patches[0].targetText).toBe('MySQL 8.0');
      expect(patches[0].replacementText).toBe('PostgreSQL 16');
      expect(patches[0].author).toBe('Bob Martin');
    });
  });
});
