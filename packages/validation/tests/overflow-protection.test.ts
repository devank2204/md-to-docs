import { describe, it, expect } from 'vitest';
import { parseMarkdown, planRepresentation, DiagnosticsCollector, DEFAULT_THEME } from '@mdtodocs/compiler-core';
import { renderToClipboardHtml, renderToDocxBlob, renderToHtml } from '@mdtodocs/renderers';
import JSZip from 'jszip';

describe('Stabilization: Document Overflow Protection', () => {
  const realisticLongDocument = `
# System Architecture Specification & Deployment Model

## 1. Overview & Service Contracts
Here is an unbroken deployment identifier that must wrap properly:
https://deployment-gateway.internal.corp/organizations/org_998877665544332211/clusters/cluster_alpha_node_primary_us_east_1/configurations?active_version=v2.14.0&checksum=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

And an unbroken uppercase token:
CONFIGURATION_ENVIRONMENT_VARIABLE_FOR_EXTREME_SCENARIOS_WITHOUT_SPACES_OR_DELIMITERS_0123456789

## 2. Service Endpoints Table with Long Cell Content
| Endpoint | Method | Path with Complex Query String | Description & Header Contracts |
| :--- | :---: | :--- | :--- |
| Core Service | GET | https://api.internal.service.corp/v1/resource/query?param1=alpha&param2=beta&param3=gamma | Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig |
| Streaming | POST | https://stream.internal.service.corp/v2/events/telemetry/ingestion/continuous | Content-Type: application/x-ndjson; buffer=64kb |

## 3. High-Fidelity Callouts Near Section Boundaries
:::note
Primary gateway instances listen on dual IPv4 and IPv6 sockets with strict TLS 1.3 renegotiation disabled.
:::

:::warning
Ensure database replication lag does not exceed 100ms before triggering automatic failover sequences.
:::

## 4. Code Block with Long Lines and Tab Indentation
\`\`\`typescript
export function initializeCluster(config: ClusterConfig): Promise<DeploymentResult> {
\tconst client = new ServiceBusClient("https://service-bus.internal.corp/namespaces/primary-hub/topics/events");
\treturn client.sendBatch([ { id: "evt_1", type: "system.init", timestamp: Date.now(), metadata: { region: "us-east-1", environment: "production" } } ]);
}
\`\`\`

## 5. Mathematical Formulations
Inline equation $H(X) = -\\sum_{i=1}^{n} P(x_i) \\log_2 P(x_i)$ and display formula:

$$
\\lim_{n \\to \\infty} \\left( 1 + \\frac{1}{n} \\right)^n = e
$$

## 6. Embedded Media
![Cluster Diagram](https://example.com/assets/large-topology.png)

## 7. Mermaid Topology
\`\`\`mermaid
flowchart LR
    Ingress[Global Ingress] --> Gateway[API Gateway]
    Gateway --> Worker1[Service Worker A]
    Gateway --> Worker2[Service Worker B]
    Worker1 --> Cache[(Redis Cache)]
    Worker2 --> Database[(PostgreSQL DB)]
\`\`\`
`;

  it('Clipboard HTML injects word-break and pre-wrap protections across all elements', () => {
    const doc = parseMarkdown(realisticLongDocument);
    const clipboardHtml = renderToClipboardHtml(doc, DEFAULT_THEME);

    // Outer container protection
    expect(clipboardHtml).toContain('word-break:break-word');
    expect(clipboardHtml).toContain('overflow-wrap:break-word');

    // Table cells protection
    expect(clipboardHtml).toContain('word-break:break-word;overflow-wrap:break-word;vertical-align:top;');
    expect(clipboardHtml).toContain('table-layout:auto');

    // Pre / code blocks wrap protection
    expect(clipboardHtml).toContain('white-space:pre-wrap');

    // Callout protection
    expect(clipboardHtml).toContain('border-left:4px solid');
    expect(clipboardHtml).toContain('📝 Note');
  });

  it('DOCX export bounds oversized images and diagrams strictly within printable width', async () => {
    const doc = parseMarkdown(realisticLongDocument);

    // Mock an oversized image asset (1600x1200 px)
    const imgParagraph = doc.children.find(
      (n: any) => n.type === 'paragraph' && n.children?.[0]?.type === 'image'
    ) as any;
    expect(imgParagraph).toBeDefined();

    imgParagraph.children[0].data = {
      resolvedAsset: {
        type: 'png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        dimensions: { width: 1600, height: 1200 },
      },
    };

    // Mock a resolved Mermaid diagram asset
    const mermaidNode = doc.children.find(
      (n: any) => n.type === 'code' && n.lang === 'mermaid'
    ) as any;
    expect(mermaidNode).toBeDefined();

    mermaidNode.data = {
      renderStatus: 'success',
      resolvedAsset: {
        type: 'png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        dimensions: { width: 800, height: 400 },
      },
    };

    const docxBlob = await renderToDocxBlob(doc, DEFAULT_THEME);
    expect(docxBlob.size).toBeGreaterThan(1000);

    const zip = await JSZip.loadAsync(await docxBlob.arrayBuffer());
    const docXml = await zip.file('word/document.xml')?.async('text');
    expect(docXml).toBeDefined();

    // Max printable width is 6.5 inches = 468 points = 5,943,600 EMUs (468 * 12700)
    const MAX_EMUS = 468 * 12700; // 5,943,600
    const extents = docXml?.match(/<wp:extent cx="(\d+)" cy="(\d+)"\/>/g);
    expect(extents).toBeDefined();

    if (extents) {
      for (const ext of extents) {
        const match = ext.match(/cx="(\d+)"/);
        if (match) {
          const cx = parseInt(match[1]);
          expect(cx).toBeLessThanOrEqual(MAX_EMUS);
        }
      }
    }
  });

  it('DOCX table columns strictly equal 9360 twips (6.5 inches) with cantSplit and repeating header', async () => {
    const doc = parseMarkdown(realisticLongDocument);
    const docxBlob = await renderToDocxBlob(doc, DEFAULT_THEME);
    const zip = await JSZip.loadAsync(await docxBlob.arrayBuffer());
    const docXml = await zip.file('word/document.xml')?.async('text');

    expect(docXml).toContain('<w:tblW w:type="dxa" w:w="9360"/>');
    expect(docXml).toContain('<w:cantSplit/>');
    expect(docXml).toContain('<w:tblHeader/>');
  });

  it('DOCX code blocks sanitize tabs to prevent tab stop overflows past margins', async () => {
    const doc = parseMarkdown(realisticLongDocument);
    const docxBlob = await renderToDocxBlob(doc, DEFAULT_THEME);
    const zip = await JSZip.loadAsync(await docxBlob.arrayBuffer());
    const docXml = await zip.file('word/document.xml')?.async('text');

    // Tabs should be replaced with spaces
    expect(docXml).not.toContain('\tconst client');
    expect(docXml).toContain('    const client');
  });

  it('Standalone HTML renderer includes word-break and page-break print protection', () => {
    const doc = parseMarkdown(realisticLongDocument);
    const html = renderToHtml(doc, { fullDocument: true, theme: DEFAULT_THEME, title: 'Architecture' });

    // Word break and overflow wrap
    expect(html).toContain('word-break: break-word');
    expect(html).toContain('overflow-wrap: break-word');
    expect(html).toContain('white-space: pre-wrap');

    // Print page boundary guards
    expect(html).toContain('@media print');
    expect(html).toContain('page-break-after: avoid');
    expect(html).toContain('page-break-inside: avoid');
  });
});
