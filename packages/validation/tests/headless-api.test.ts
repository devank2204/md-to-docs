import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { createServer } from '../../../apps/api/src/server';
import JSZip from 'jszip';

describe('Headless AI-Agent API Pipeline', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  async function postJson(endpoint: string, data: any) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  it('GET /api/v1/health returns service metadata', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.status).toBe('ok');
    expect(json.service).toBe('mdtodocs-agent-api');
    expect(json.supportedFormats).toContain('docx');
    expect(json.supportedFormats).toContain('html');
    expect(json.supportedFormats).toContain('clipboard');
  });

  it('POST /api/v1/validate parses and checks Markdown document', async () => {
    const markdown = `
# Executive Strategy
A comprehensive report on engineering metrics.

| Service | Target SLO | Actual |
| :--- | :---: | ---: |
| Auth | 99.9% | 99.95% |
| Billing | 99.99% | 99.99% |

\`\`\`mermaid
flowchart TD
  Client --> Gateway
  Gateway --> Service
\`\`\`

Here is performance math: $$E = mc^2$$.
`;

    const { status, json } = await postJson('/api/v1/validate', { markdown });
    expect(status).toBe(200);
    expect(json.valid).toBe(true);
    expect(json.metrics.headingCount).toBe(1);
    expect(json.metrics.tableCount).toBe(1);
    expect(json.metrics.diagramCount).toBe(1);
    expect(json.metrics.equationCount).toBe(1);
    expect(json.errors.length).toBe(0);
  });

  it('POST /api/v1/validate flags ragged tables and empty diagrams', async () => {
    const brokenMarkdown = `
# Broken Doc
| Col 1 | Col 2 | Col 3 |
| :--- | :--- | :--- |
| Val 1 | Val 2 |

\`\`\`mermaid
\`\`\`
`;

    const { status, json } = await postJson('/api/v1/validate', { markdown: brokenMarkdown });
    expect(status).toBe(200);
    expect(json.valid).toBe(false); // empty mermaid is an error
    expect(json.errors.some((e: any) => e.type === 'empty_mermaid_block')).toBe(true);
    expect(json.warnings.some((w: any) => w.type === 'ragged_table_row')).toBe(true);
  });

  it('POST /api/v1/render compiles Markdown to valid DOCX with base64 payload', async () => {
    const markdown = `
# Release Plan
Verified deployment plan for production cluster.

| Stage | Owner | Status |
| :--- | :--- | :--- |
| Canary | SRE | Verified |
| Rollout | Dev | In Progress |
`;

    const { status, json } = await postJson('/api/v1/render', {
      markdown,
      format: 'docx',
      destination: 'word',
    });

    expect(status).toBe(200);
    expect(json.format).toBe('docx');
    expect(json.filename).toBe('document.docx');
    expect(json.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(typeof json.fileBase64).toBe('string');
    expect(json.sizeBytes).toBeGreaterThan(1000);

    // Verify DOCX internal XML structure
    const buffer = Buffer.from(json.fileBase64, 'base64');
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file('word/document.xml')?.async('text');
    expect(docXml).toBeDefined();
    expect(docXml).toContain('Release Plan');
    expect(docXml).toContain('Canary');
  });

  it('POST /api/v1/render compiles Markdown to standalone HTML', async () => {
    const markdown = `# Architecture Spec\n\nHigh-level system topology.`;
    const { status, json } = await postJson('/api/v1/render', {
      markdown,
      format: 'html',
    });

    expect(status).toBe(200);
    expect(json.format).toBe('html');
    expect(json.content).toContain('<!DOCTYPE html>');
    expect(json.content).toContain('Architecture Spec');
    expect(json.content).toContain('High-level system topology');
  });

  it('POST /api/v1/repair reconciles review comments into updated Markdown', async () => {
    const originalMarkdown = `
# Security Policy

All production services must require OAuth 2.0 authentication.
Tokens expire after 24 hours.
`;

    const edits = [
      {
        targetText: 'OAuth 2.0 authentication.',
        replacementText: 'OAuth 2.0 or mTLS authentication.',
        comment: 'Include zero-trust machine identities',
      },
      {
        targetText: '24 hours.',
        replacementText: '12 hours with automated rotation.',
        comment: 'Compliance requirement SOC2',
      },
    ];

    const { status, json } = await postJson('/api/v1/repair', {
      originalMarkdown,
      edits,
    });

    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.appliedCount).toBe(2);
    expect(json.unmatchedCount).toBe(0);
    expect(json.updatedMarkdown).toContain('OAuth 2.0 or mTLS authentication.');
    expect(json.updatedMarkdown).toContain('12 hours with automated rotation.');
    expect(json.changelog.length).toBe(2);
  });
});
