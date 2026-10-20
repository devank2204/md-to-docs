import http from 'node:http';
import { parseMarkdown, planRepresentation, DiagnosticsCollector, DEFAULT_THEME } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import {
  renderToDocxBlob,
  renderToHtml,
  renderToClipboardHtml,
  reconcileMarkdown,
  parseReviewNotesText,
  extractDocxComments,
  type ReconciliationPatch,
} from '@mdtodocs/renderers';
import { validateMarkdownDocument } from './validator.js';


export function createServer(): http.Server {
  return http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    // 1. CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // 2. Health check route
    if (req.method === 'GET' && (pathname === '/api/v1/health' || pathname === '/health')) {
      sendJson(res, 200, {
        status: 'ok',
        service: 'mdtodocs-agent-api',
        version: '1.0.0',
        supportedFormats: ['docx', 'html', 'clipboard'],
        supportedDestinations: ['word', 'google-docs', 'pdf', 'clipboard'],
      });
      return;
    }

    // Read JSON body for POST routes
    if (req.method === 'POST') {
      let body: any;
      try {
        body = await readJsonBody(req);
      } catch (err: any) {
        sendJson(res, 400, {
          error: 'invalid_json',
          message: err?.message || 'Failed to parse JSON body',
        });
        return;
      }

      // 3. /api/v1/validate
      if (pathname === '/api/v1/validate') {
        const { markdown, destination = 'word' } = body || {};

        if (typeof markdown !== 'string') {
          sendJson(res, 400, {
            error: 'missing_parameter',
            message: "Missing or invalid 'markdown' string in request body.",
          });
          return;
        }

        const result = validateMarkdownDocument(markdown, destination as DestinationType);
        sendJson(res, 200, result);
        return;
      }

      // 4. /api/v1/render
      if (pathname === '/api/v1/render') {
        const {
          markdown,
          format = 'docx',
          destination = 'word',
          signature,
        } = body || {};

        if (typeof markdown !== 'string') {
          sendJson(res, 400, {
            error: 'missing_parameter',
            message: "Missing or invalid 'markdown' string in request body.",
          });
          return;
        }

        try {
          const validation = validateMarkdownDocument(markdown, destination as DestinationType);
          const tree = parseMarkdown(markdown);
          const collector = new DiagnosticsCollector();
          planRepresentation(tree, destination as DestinationType, collector);

          if (format === 'docx') {
            const blob = await renderToDocxBlob(tree, DEFAULT_THEME, signature);
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');

            sendJson(res, 200, {
              format: 'docx',
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              filename: 'document.docx',
              fileBase64: base64,
              sizeBytes: arrayBuffer.byteLength,
              metrics: validation.metrics,
              diagnostics: collector.getAll(),
            });
            return;
          }

          if (format === 'html') {
            const html = renderToHtml(tree, { theme: DEFAULT_THEME, fullDocument: true });
            sendJson(res, 200, {
              format: 'html',
              mimeType: 'text/html',
              filename: 'document.html',
              content: html,
              fileBase64: Buffer.from(html, 'utf-8').toString('base64'),
              sizeBytes: Buffer.byteLength(html, 'utf-8'),
              metrics: validation.metrics,
              diagnostics: collector.getAll(),
            });
            return;
          }

          if (format === 'clipboard') {
            const html = renderToClipboardHtml(tree, DEFAULT_THEME, signature);
            sendJson(res, 200, {
              format: 'clipboard',
              mimeType: 'text/html',
              content: html,
              fileBase64: Buffer.from(html, 'utf-8').toString('base64'),
              sizeBytes: Buffer.byteLength(html, 'utf-8'),
              metrics: validation.metrics,
              diagnostics: collector.getAll(),
            });
            return;
          }

          sendJson(res, 400, {
            error: 'unsupported_format',
            message: `Unsupported format '${format}'. Supported: 'docx', 'html', 'clipboard'.`,
          });
          return;
        } catch (err: any) {
          sendJson(res, 500, {
            error: 'render_failure',
            message: err?.message || 'Failed to render document',
          });
          return;
        }
      }

      // 5. /api/v1/repair
      if (pathname === '/api/v1/repair') {
        const { originalMarkdown, edits, reviewNotes, docxBase64 } = body || {};

        if (typeof originalMarkdown !== 'string') {
          sendJson(res, 400, {
            error: 'missing_parameters',
            message: "Request must include 'originalMarkdown' (string).",
          });
          return;
        }

        let patches: ReconciliationPatch[] = [];

        try {
          if (typeof docxBase64 === 'string' && docxBase64.trim()) {
            const buf = Buffer.from(docxBase64, 'base64');
            patches = await extractDocxComments(buf);
          } else if (typeof reviewNotes === 'string' && reviewNotes.trim()) {
            patches = parseReviewNotesText(reviewNotes);
          } else if (Array.isArray(edits)) {
            patches = edits.map((edit: any, idx: number) => ({
              id: `api-edit-${idx + 1}`,
              targetText: edit.targetText || '',
              replacementText: edit.replacementText || '',
              comment: edit.comment,
              status: 'matched',
              selected: true,
            }));
          } else {
            sendJson(res, 400, {
              error: 'missing_parameters',
              message: "Request must include 'edits' (array), 'reviewNotes' (string), or 'docxBase64' (base64 string).",
            });
            return;
          }

          const report = reconcileMarkdown(originalMarkdown, patches);

          const changelog = report.patches.map((p) => ({
            targetText: p.targetText,
            replacementText: p.replacementText,
            status: p.status === 'matched' || p.status === 'already_applied' ? ('applied' as const) : ('not_found' as const),
            comment: p.comment,
          }));

          sendJson(res, 200, {
            success: report.unmatchedCount === 0,
            updatedMarkdown: report.updatedMarkdown,
            appliedCount: report.appliedCount,
            unmatchedCount: report.unmatchedCount,
            changelog,
            patches: report.patches,
          });
          return;
        } catch (err: any) {
          sendJson(res, 500, {
            error: 'repair_failed',
            message: err?.message || 'Failed to reconcile document comments',
          });
          return;
        }
      }

    }

    // 404 handler
    sendJson(res, 404, {
      error: 'not_found',
      message: `Endpoint ${req.method} ${pathname} not found.`,
    });
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
      // Protect against gigantic payloads (10MB max)
      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err: any) {
        reject(err);
      }
    });

    req.on('error', (err: any) => {
      reject(err);
    });
  });
}
