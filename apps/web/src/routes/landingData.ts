import type { DestinationType } from '@mdtodocs/capability-graph';

export type LandingRoutePath =
  | '/'
  | '/markdown-to-word'
  | '/markdown-to-pdf'
  | '/markdown-to-google-docs'
  | '/markdown-to-html'
  | '/markdown-to-rich-text'
  | '/mermaid-to-svg'
  | '/mermaid-to-png';

export interface LimitationItem {
  boundary: string;
  details: string;
  status: 'supported' | 'handled-gracefully' | 'blocked';
}

export interface FormatMatrixItem {
  feature: string;
  targetBehavior: string;
  status: 'native' | 'styled' | 'fallback' | 'blocked';
  evidence: string;
}

export interface RouteLandingSpec {
  path: LandingRoutePath;
  destination: DestinationType;
  title: string;
  description: string;
  canonical: string;
  h1: string;
  lead: string;
  badge: string;
  sampleFileName: string;
  sampleMarkdown: string;
  featureBullets: string[];
  limitations: LimitationItem[];
  formatMatrix: FormatMatrixItem[];
  faqs: { q: string; a: string }[];
}

export const BASE_URL = 'https://mdtodocs.com';

export const LANDING_ROUTES: Record<LandingRoutePath, RouteLandingSpec> = {
  '/': {
    path: '/',
    destination: 'google-docs',
    title: 'mdtodocs: Convert Markdown to Word, Google Docs, and PDF',
    description: 'Convert AI-generated technical Markdown into dependable Word (.docx), Google Docs, or PDF files without clipped tables, broken KaTeX equations, or blurry diagrams.',
    canonical: `${BASE_URL}/`,
    h1: 'Markdown to Docs',
    lead: 'The dependable output layer for technical documentation. Convert Markdown into clean Word, Google Docs, or PDF files with formatted tables, math, and diagrams.',
    badge: 'Multi-Destination Exporter',
    sampleFileName: 'product-launch-plan.md',
    sampleMarkdown: `# Product Launch Plan

A high-performance technical document compiler converting Markdown into Word, Google Docs, and PDF.

## Engineering Milestones

| Milestone | Deliverable | Owner | Status |
| :--- | :--- | :---: | :--- |
| **Alpha** | AST Parser & Capability Graph | Infra | Done |
| **Beta** | MathML Equations & Ondine WASM | Systems | Done |
| **v1.0** | Technical SEO & Conversion Engine | Core | In Progress |

## Throughput Formula

$$\\mathcal{T}_{compiler} = \\frac{N_{nodes}}{\\Delta t_{parse} + \\Delta t_{render}}$$

:::note
Zero silent drops guarantee: unhandled HTML tags degrade to styled code blocks and wide tables linearize cleanly.
:::

- [x] Client-side in-browser conversion
- [x] Vector SVG Mermaid diagrams
- [ ] Automated regression bench
`,
    featureBullets: [
      'Proportional table column widths with repeating headers and cantSplit page protection',
      'Dual-rendered MathML and KaTeX equations for native Google Docs and Word formulas',
      'Sub-millisecond Rust/WASM Ondine compilation for vector SVG Mermaid diagrams',
      'Universal ballot box task list checkboxes and 9-level list nesting',
      '100% client-side in-browser conversion — zero document data is ever sent to external servers',
    ],
    limitations: [
      {
        boundary: 'Client Sandbox Storage',
        details: 'All documents, history snapshots, and preferences are stored locally in your browser (IndexedDB and localStorage). Clear your browser cache only if you wish to reset.',
        status: 'supported',
      },
      {
        boundary: 'Wide Tables (> 20 cols Docs / > 63 cols Word)',
        details: 'Destination planning automatically detects table overflow and linearizes rows into structured bullet lists to preserve all data.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Unsupported HTML Embeds',
        details: 'Raw HTML tags like <video> or <canvas> are safely converted to code blocks rather than silently dropped.',
        status: 'handled-gracefully',
      },
    ],
    formatMatrix: [
      { feature: 'Word (.docx)', targetBehavior: 'ECMA-376 OpenXML with Cambria Math, twip table bounds, and vector diagrams', status: 'native', evidence: 'Direct local .docx generation' },
      { feature: 'Google Docs', targetBehavior: 'Clipboard HTML with MathML XML formulas and high-DPI diagram embeds', status: 'native', evidence: 'Paste into docs.google.com' },
      { feature: 'Print / PDF', targetBehavior: '@media print stylesheet with @page margin controls and vector SVG', status: 'native', evidence: 'Browser print-to-PDF output' },
      { feature: 'Standalone HTML', targetBehavior: 'Single-file self-contained HTML document with embedded styles', status: 'native', evidence: 'Valid HTML5 output' },
      { feature: 'Rich Text Clipboard', targetBehavior: 'Simultaneous text/html and text/plain multi-MIME payload', status: 'native', evidence: 'Compatible across Notion & Slack' },
    ],
    faqs: [
      {
        q: 'How does mdtodocs prevent tables from clipping in Word or Google Docs?',
        a: 'mdtodocs computes proportional column widths based on cell text content length bounded to standard printable margins (6.5 inches / 9360 twips). For tables exceeding 20 columns in Google Docs or 63 columns in Word, the destination capability planner automatically linearizes rows into structured bullet lists.',
      },
      {
        q: 'Is my document private and secure?',
        a: 'Yes. All parsing, Ondine WASM diagram rendering, and document compilation execute entirely inside your local browser sandbox. No document text, images, or files are uploaded to any server.',
      },
      {
        q: 'Which formats are supported for export?',
        a: 'Microsoft Word (.docx), Google Docs rich clipboard, vector PDF via calibrated print stylesheet, standalone semantic HTML, and universal clipboard rich text.',
      },
    ],
  },
  '/markdown-to-word': {
    path: '/markdown-to-word',
    destination: 'word',
    title: 'Convert Markdown to Word (.docx) | Tables, Math & Diagrams | mdtodocs',
    description: 'Export technical Markdown to Microsoft Word (.docx) with proportional table column widths, Cambria Math equations, and vector Mermaid diagrams.',
    canonical: `${BASE_URL}/markdown-to-word`,
    h1: 'Convert Markdown to Microsoft Word (.docx)',
    lead: 'Generate clean, publication-ready Word documents from Markdown. Tables stay bounded to printable margins, formulas use Cambria Math, and diagrams stay razor-sharp.',
    badge: 'Word .docx Specialist',
    sampleFileName: 'system-architecture.docx',
    sampleMarkdown: `# Distributed System Architecture Spec

A high-performance microservice topology specification with automated schema validation.

## Service Registry & Communication

| Service | Protocol | Port | Replicas | SLA |
| :--- | :--- | :---: | :---: | :--- |
| **api-gateway** | HTTP/2 + TLS 1.3 | 443 | 5 | 99.99% |
| **auth-worker** | gRPC (Internal) | 50051 | 3 | 99.95% |
| **event-bus** | Kafka v3.6 | 9092 | 6 | 99.99% |
| **cache-layer** | Redis Cluster | 6379 | 4 | 99.90% |

## Activation Energy & Latency Models

$$\\mathcal{L}_{total} = \\sum_{i=1}^{N} \\left( \\tau_{proc}^{(i)} + \\frac{\\text{PayloadSize}}{\\text{Bandwidth}^{(i)}} \\right)$$

:::note
Word documents automatically repeat the table header row on multi-page overflows and prevent awkward row page splits with \`cantSplit: true\`.
:::

### Infrastructure Checklist
- [x] Provision VPC peering connections
- [x] Configure mutual TLS (mTLS) certificates
- [ ] Run automated load stress benchmark
`,
    featureBullets: [
      'Strict 9,360-twip (6.5-inch) table bounds preventing Word page margin overflow',
      'Native Cambria Math font typesetting for inline and display equations',
      'Repeating table header rows (tableHeader: true) across multi-page tables',
      'Anti-split table row protection (cantSplit: true) to eliminate awkward page-break cuts',
      'Built-in callouts rendered as accent-bordered single-cell tables',
    ],
    limitations: [
      {
        boundary: 'Maximum 63 Table Columns',
        details: 'Microsoft Word OpenXML strictly rejects tables exceeding 63 columns. mdtodocs detects wide tables and linearizes rows into structured bullet lists to avoid corrupt files.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Dynamic HTML Elements (<video>, <iframe>, <canvas>)',
        details: 'Word documents cannot run client-side JavaScript or media frames. mdtodocs preserves these constructs as formatted code blocks instead of silently dropping them.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Arbitrary LaTeX Macros (e.g. \\usepackage, tikz)',
        details: 'Word OMML supports standard math expressions but not arbitrary LaTeX package executions. Standard math commands (fractions, integrals, matrices) work natively.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Proportional Tables', targetBehavior: 'Twip-calculated column widths with tableHeader & cantSplit', status: 'native', evidence: '6.5in printable margin enforcement' },
      { feature: 'Math Equations', targetBehavior: 'Cambria Math inline and centered display blocks', status: 'native', evidence: 'Standard Office MathML translation' },
      { feature: 'Mermaid Diagrams', targetBehavior: 'Rendered via Rust/WASM Ondine and embedded cleanly', status: 'styled', evidence: 'High-res rasterized graphic' },
      { feature: 'Callout Boxes', targetBehavior: 'Single-cell table with 3.5pt colored left border and light background', status: 'styled', evidence: 'Preserves note/warning/tip semantics' },
      { feature: 'Task Checklists', targetBehavior: 'Unicode ballot box symbols (☑ / ☐) with indent preservation', status: 'native', evidence: 'Universal Word symbol compatibility' },
    ],
    faqs: [
      {
        q: 'Does the Word exporter require Microsoft Office or a cloud server?',
        a: 'No. The Word exporter constructs standard Office Open XML (.docx) packages directly in JavaScript using the docx library inside your browser. No server is ever contacted.',
      },
      {
        q: 'What happens to wide tables with many columns in Word?',
        a: 'Word tables up to 63 columns are supported with proportional width weights. If a table exceeds Word limits, mdtodocs provides an actionable warning and linearizes rows into an indented list.',
      },
      {
        q: 'Can I open the generated .docx in Google Docs or LibreOffice?',
        a: 'Yes. The output adheres strictly to ECMA-376 OpenXML standards and opens reliably in Microsoft Word (Desktop/Web), Google Docs, Apple Pages, and LibreOffice.',
      },
    ],
  },

  '/markdown-to-pdf': {
    path: '/markdown-to-pdf',
    destination: 'pdf',
    title: 'Convert Markdown to PDF | Clean Print Styles & Vector Graphics | mdtodocs',
    description: 'Convert Markdown to printable PDF with calibrated print margins, page-break containment, syntax-highlighted code, and crisp vector Mermaid diagrams.',
    canonical: `${BASE_URL}/markdown-to-pdf`,
    h1: 'Convert Markdown to PDF',
    lead: 'Export clean, professional PDF reports directly from Markdown. All editor UI chrome is stripped in print mode, delivering edge-to-edge typography and crisp vectors.',
    badge: 'Print & PDF Engine',
    sampleFileName: 'quarterly-report.pdf',
    sampleMarkdown: `# Executive Research & Reliability Report

A comprehensive quarterly audit of system stability, throughput, and product roadmap delivery.

## Performance Benchmarks

| Milestone | Latency (p95) | Throughput | Incident Count | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Q1 Baseline** | 42ms | 12,000 req/s | 1 | Complete |
| **Q2 Scaling** | 28ms | 24,000 req/s | 0 | Complete |
| **Q3 Expansion** | 19ms | 45,000 req/s | 0 | Scheduled |

## Data Transformation Pipeline

\`\`\`mermaid
graph LR
    Raw[Raw Markdown] --> Core[mdtodocs AST]
    Core --> Print[Paged Media Engine]
    Print --> PDF[High-Fidelity PDF]
\`\`\`

## Cost Optimization Model

$$\\mathbb{E}[\\text{Cost}] = \\int_{0}^{T} \\lambda(t) \\cdot c(t) \\, dt + \\sigma_{\\text{surge}}$$

:::tip
PDF export uses clean print styling with \`break-inside: avoid\` to ensure tables and code snippets never split awkwardly across page breaks.
:::
`,
    featureBullets: [
      '@media print stylesheet that hides UI chrome, header, and toolbars automatically',
      'Page-break-inside avoid rules on tables, callouts, and code blocks',
      'Crisp vector SVG rendering for Mermaid flowcharts and sequence diagrams',
      'High-resolution KaTeX typesetting with centered equations and baseline alignment',
      'Automatic word-wrap and overflow containment preventing horizontal clipping',
    ],
    limitations: [
      {
        boundary: 'Page Break Tuning',
        details: 'Browser printing engines respect CSS page-break rules (break-inside: avoid), but exceptionally long code blocks (> 1 page) will naturally break at line boundaries.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Interactive Animations',
        details: 'Static PDF paper formats cannot display interactive tooltips or CSS hover animations; all static content is expanded cleanly.',
        status: 'supported',
      },
      {
        boundary: 'Zero-Upload Local Privacy',
        details: 'We do not run a server-side Chromium instance to generate PDFs because doing so would require uploading your private documents. Browser print generates pure vector PDFs locally.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Print CSS Stylesheet', targetBehavior: 'Chrome-less full-page typography with @page margin controls', status: 'native', evidence: 'Zero toolbars or sidebars in output' },
      { feature: 'Vector Mermaid', targetBehavior: 'Direct SVG elements preserved in DOM for infinite vector resolution', status: 'native', evidence: 'Sharp lines at 400% zoom' },
      { feature: 'Math Rendering', targetBehavior: 'KaTeX HTML typesetting with sub-pixel horizontal alignment', status: 'native', evidence: 'High-DPI print formula clarity' },
      { feature: 'Syntax Highlighting', targetBehavior: 'Code blocks styled with light/dark contrast and word-wrap containment', status: 'native', evidence: 'No right-edge text clipping' },
      { feature: 'Footnotes & Citations', targetBehavior: 'Superscript citations linked to bottom document notes', status: 'styled', evidence: 'Clean academic layout' },
    ],
    faqs: [
      {
        q: 'How does PDF export work without a server backend?',
        a: 'mdtodocs leverages calibrated browser print stylesheets (@media print) with precise CSS paged media rules (@page { margin: 20mm; }), allowing your browser’s high-precision PDF generator to produce pure vector PDFs.',
      },
      {
        q: 'Are diagrams rasterized into blurry PNGs in PDF export?',
        a: 'No. Diagrams remain pure vector SVG nodes in the DOM during print export, ensuring crisp, infinite-resolution lines and text when zoomed in.',
      },
      {
        q: 'How do I save the PDF in Google Chrome or Microsoft Edge?',
        a: 'When you click "Export PDF", the browser print dialog opens. Select "Save as PDF" as the Destination and click Save.',
      },
    ],
  },

  '/markdown-to-google-docs': {
    path: '/markdown-to-google-docs',
    destination: 'google-docs',
    title: 'Paste Markdown into Google Docs | MathML & Native Tables | mdtodocs',
    description: 'Paste formatted Markdown into Google Docs without losing tables, callout backgrounds, or formulas. Features dual MathML and KaTeX clipboard HTML.',
    canonical: `${BASE_URL}/markdown-to-google-docs`,
    h1: 'Paste Markdown into Google Docs',
    lead: 'Copy rich technical Markdown directly to your clipboard and paste into Google Docs. Tables keep their borders, math translates to native Docs equations, and code blocks retain background shading.',
    badge: 'Google Docs Clipboard Bridge',
    sampleFileName: 'product-requirement-doc.gdoc',
    sampleMarkdown: `# Product Requirements Document: Realtime Sync

A specification for multi-tab collaboration and client state synchronization.

## Target User Stories

- [x] Engineers can paste architecture docs directly into Google Docs
- [x] Product managers can copy tables without cell boundary corruption
- [ ] Design teams can inspect live Mermaid wireframes

## Core Service Contracts

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| \`POST\` | \`/v1/sync/handshake\` | Initialize WebSocket connection | Yes |
| \`GET\` | \`/v1/sync/state\` | Fetch differential snapshot | Yes |
| \`DELETE\` | \`/v1/sync/session\` | Terminate active session | No |

## Mathematical Equivalence Guarantee

$$\\lim_{\\Delta t \\to 0} \\frac{S(t + \\Delta t) - S(t)}{\\Delta t} = \\nabla \\mathcal{H}(S)$$

:::note
Google Docs converts the embedded MathML XML directly into native Google Docs equation elements.
:::
`,
    featureBullets: [
      'Dual MathML (<math>) and KaTeX HTML markup for native equation translation in Docs',
      'Semantic <thead> and <tbody> table structures with cell alignments',
      'Ballot box glyphs (☑ / ☐) mapping task lists cleanly without broken bullets',
      'Indented footnote endnotes with superscript citation references',
      'Callout blocks converted to border-accented tables with soft tinted backgrounds',
    ],
    limitations: [
      {
        boundary: 'Direct SVG Vector Pasting',
        details: 'Google Docs clipboard importer silently drops raw inline <svg> XML. mdtodocs converts Mermaid diagrams to crisp high-DPI PNGs in clipboard HTML so diagrams paste seamlessly.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Wide Tables (> 20 Columns)',
        details: 'Google Docs web editor does not provide horizontal scrolling for wide tables; tables over 20 columns trigger an advisory warning to linearize or split.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Custom CSS Font Imports',
        details: 'Google Docs paste engine ignores custom web font @font-face rules and maps text to standard fonts like Arial or Roboto.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Math Equations', targetBehavior: 'MathML <math xmlns="..."> XML translated to native Google Docs equation objects', status: 'native', evidence: 'Editable formula objects in Docs' },
      { feature: 'Data Tables', targetBehavior: 'HTML table with explicit cell borders and grey header fills', status: 'native', evidence: 'Border preservation on paste' },
      { feature: 'Callout Notes', targetBehavior: 'Single-cell table with left border highlight and tinted background', status: 'styled', evidence: 'Distinct visual callout cards' },
      { feature: 'Task Checklists', targetBehavior: 'Unicode ballot box characters (☑ and ☐)', status: 'native', evidence: 'No missing-bullet paste artifacts' },
      { feature: 'Mermaid Flowcharts', targetBehavior: 'High-resolution PNG clipboard embed', status: 'fallback', evidence: 'Bypasses Google Docs SVG drop bug' },
    ],
    faqs: [
      {
        q: 'Why do formulas usually break when pasting Markdown into Google Docs?',
        a: 'Google Docs does not understand raw LaTeX or Markdown math syntax ($...$). mdtodocs translates LaTeX into standard MathML XML alongside rendered KaTeX HTML, which Google Docs clipboard importer recognizes and translates into native equation objects.',
      },
      {
        q: 'Do I need a Google Workspace plugin or extension?',
        a: 'No plugins required. Just click "Copy for Google Docs" in mdtodocs and press Ctrl+V (or Cmd+V) inside your Google Doc.',
      },
      {
        q: 'Why are diagrams converted to images when copying for Google Docs?',
        a: 'Google Docs does not support pasting raw SVG code directly into documents. mdtodocs embeds a high-DPI PNG representation in clipboard HTML to ensure your diagrams show up crisp and intact.',
      },
    ],
  },

  '/markdown-to-html': {
    path: '/markdown-to-html',
    destination: 'clipboard',
    title: 'Convert Markdown to Clean Standalone HTML | mdtodocs',
    description: 'Export technical Markdown as self-contained semantic HTML documents with embedded SVG diagrams, KaTeX typography, and print-ready CSS.',
    canonical: `${BASE_URL}/markdown-to-html`,
    h1: 'Convert Markdown to Standalone HTML',
    lead: 'Produce self-contained, valid HTML documents from Markdown with embedded styles, semantic heading IDs, pure SVG Mermaid diagrams, and no external stylesheet dependencies.',
    badge: 'Standalone HTML Generator',
    sampleFileName: 'developer-docs.html',
    sampleMarkdown: `# API Specification: Identity & Token Exchange

Standardized OAuth 2.0 and OpenID Connect authorization server endpoints.

## Authentication Endpoints

| Path | Method | Headers | Response Status |
| :--- | :---: | :--- | :---: |
| \`/oauth/token\` | \`POST\` | \`Content-Type: application/x-www-form-urlencoded\` | 200 OK |
| \`/oauth/revoke\` | \`POST\` | \`Authorization: Bearer <token>\` | 204 No Content |
| \`/userinfo\` | \`GET\` | \`Accept: application/json\` | 200 OK |

## Exchange Protocol

\`\`\`mermaid
sequenceDiagram
    autonumber
    Client->>AuthServer: POST /oauth/token (code_verifier)
    AuthServer-->>Client: 200 OK (access_token, id_token)
\`\`\`

## Token Payload Example

\`\`\`json
{
  "sub": "usr_948291a8c0",
  "aud": "https://api.mdtodocs.com",
  "exp": 1792880000,
  "scope": "read:documents write:documents"
}
\`\`\`
`,
    featureBullets: [
      'Full semantic HTML document wrapper with responsive viewport meta and title tags',
      'Embedded vector SVG diagrams with no external image hosting required',
      'Self-contained typography and table styles with modern CSS variables',
      'Print pagination rules baked in for clean Ctrl+P printing from any browser',
      'Zero tracking scripts or external telemetry in exported HTML files',
    ],
    limitations: [
      {
        boundary: 'External Script Execution',
        details: 'Exported standalone HTML does not run external trackers or unvetted scripts; all styling and vector graphics are purely static and self-contained.',
        status: 'supported',
      },
      {
        boundary: 'Dark/Light Theme Preference',
        details: 'The HTML file includes clean default typography styles that respect standard user print and browser view settings.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Self-Contained Bundle', targetBehavior: 'Zero external CSS or JS dependencies; open anywhere offline', status: 'native', evidence: 'Valid single-file HTML5' },
      { feature: 'Semantic Slugs', targetBehavior: 'Headings receive auto-generated id attributes for deep linking', status: 'native', evidence: 'Clean URL anchors' },
      { feature: 'Embedded Vector SVGs', targetBehavior: 'Inline SVG diagrams embedded directly without remote hosting', status: 'native', evidence: 'Instant loading offline' },
      { feature: 'Table Borders', targetBehavior: 'Responsive tables with 100% width and clean border collapse', status: 'native', evidence: 'Zero text overflow' },
      { feature: 'Print CSS', targetBehavior: 'Embedded @media print rules for instant browser print accuracy', status: 'native', evidence: 'Clean page formatting' },
    ],
    faqs: [
      {
        q: 'Can the exported HTML be opened offline?',
        a: 'Yes. All CSS rules, diagrams (as embedded SVGs), and layout styling are bundled directly into the standalone HTML file without external CDN links.',
      },
      {
        q: 'Can I copy the raw HTML snippet instead of downloading the file?',
        a: 'Yes. You can copy the complete HTML document to your clipboard or download it as a ready-to-host .html file.',
      },
    ],
  },

  '/markdown-to-rich-text': {
    path: '/markdown-to-rich-text',
    destination: 'clipboard',
    title: 'Convert Markdown to Rich Text Clipboard | Slack, Notion & Email | mdtodocs',
    description: 'Copy Markdown as rich text to paste into Slack, Linear, Notion, Apple Notes, Gmail, or Microsoft Outlook with formatted tables and inline code.',
    canonical: `${BASE_URL}/markdown-to-rich-text`,
    h1: 'Convert Markdown to Rich Text',
    lead: 'Instantly paste Markdown tables, code snippets, and formatted lists into Slack, Linear, Notion, or email clients without tedious manual reformatting.',
    badge: 'Universal Rich Text Bridge',
    sampleFileName: 'weekly-sync.txt',
    sampleMarkdown: `# Weekly Engineering Sync & Release Checklist

Sprint 42 deliverables, bug triage, and spreadsheet-ready release metrics.

## Sprint Velocity & Status

| Track | Objective | Owner | Progress |
| :--- | :--- | :--- | :---: |
| **Engine** | Rust/WASM Ondine upgrade | Systems | 100% |
| **Design** | Dark mode contrast calibration | Product | 90% |
| **Infra** | Automated CI fidelity harness | DevOps | 100% |

## Action Items
- [x] Verify production build artifact sizes
- [x] Run 20 fidelity fixture benchmarks
- [ ] Publish release notes to community channel

\`\`\`json
{
  "release": "v2.0.4",
  "status": "ready",
  "checksum": "sha256:4b91..."
}
\`\`\`
`,
    featureBullets: [
      'Multi-MIME clipboard writer supporting text/html and text/plain simultaneously',
      'Table copy options for Excel, Google Sheets (TSV grid paste), and rich documents',
      'Clean comment stripping for JSON code blocks to prevent 400 Bad Request API errors',
      'Task list checkboxes converted to ballot symbols compatible with rich text editors',
      'Single-click copy action with instant checkmark feedback',
    ],
    limitations: [
      {
        boundary: 'Legacy Email Clients (Desktop Outlook)',
        details: 'Legacy desktop Outlook drops CSS flexbox and custom spacing. mdtodocs produces standard HTML table markup to guarantee universal cross-client rendering.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Plain Text Fallback',
        details: 'In applications that do not support rich text/HTML paste (like standard terminal windows), the raw Markdown text is gracefully provided via the text/plain MIME layer.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Multi-MIME Clipboard', targetBehavior: 'Writes text/html and text/plain concurrently', status: 'native', evidence: 'Works in rich and raw targets' },
      { feature: 'Spreadsheet Grid Paste', targetBehavior: 'Tab-separated values (TSV) paste cleanly into Excel & Sheets cells', status: 'native', evidence: 'No squished single-column pasting' },
      { feature: 'Task Checklists', targetBehavior: 'Ballot boxes (☑ / ☐) recognized across Notion and Apple Notes', status: 'native', evidence: 'Clean bullet representation' },
      { feature: 'Inline Code Styling', targetBehavior: 'Light background highlight with monospace font family', status: 'styled', evidence: 'Distinct code badges' },
      { feature: 'JSON Beautifier', targetBehavior: 'Strips non-standard comments while maintaining syntax indenting', status: 'native', evidence: 'Valid JSON payload paste' },
    ],
    faqs: [
      {
        q: 'Which applications accept the rich text clipboard?',
        a: 'Slack, Notion, Linear, Apple Notes, Gmail, Microsoft Outlook, Google Sheets, Microsoft Excel, Bear, and virtually any application that accepts rich text or HTML paste.',
      },
      {
        q: 'How does table pasting into Google Sheets or Excel work?',
        a: 'The clipboard output formats table rows and columns with standard tab delimiters alongside HTML tables, so pasting into a spreadsheet populates individual grid cells instead of cramming everything into one column.',
      },
    ],
  },
  '/mermaid-to-svg': {
    path: '/mermaid-to-svg',
    destination: 'clipboard',
    title: 'Mermaid to SVG: Export Clean Vector Diagrams Online | mdtodocs',
    description: 'Convert Mermaid.js diagrams into crisp SVG vector files in milliseconds. Built with in-browser Ondine WASM. Transparent backgrounds, zero server uploads, and no clipped labels.',
    canonical: `${BASE_URL}/mermaid-to-svg`,
    h1: 'Mermaid to SVG',
    lead: 'The instant, client-side Mermaid vector compiler. Turn flowcharts, sequence diagrams, and architecture maps into crisp SVG vectors with transparent export and zero clipping.',
    badge: 'Vector Diagram Exporter',
    sampleFileName: 'system-architecture.mmd',
    sampleMarkdown: `graph TD
  Client["Web Browser (React SPA)"] --> Gateway["API Gateway (Fastify)"]
  Gateway --> ServiceA["Auth & Session Service"]
  Gateway --> ServiceB["Document Compiler Engine (WASM)"]
  ServiceB --> Worker["Background Queue"]
  ServiceB --> Storage[("Encrypted Local Blob")]
`,
    featureBullets: [
      'Sub-millisecond WASM vector compilation powered by the Ondine layout engine',
      'Transparent background export ready for Figma, Illustrator, Pitch, and Keynote',
      'Automatic viewBox boundary calculation preventing clipped node borders and markers',
      'Inline CSS custom property translation ensuring vector graphics render cleanly in third-party viewers',
      'Automatic Mermaid syntax repair quoting unescaped brackets and special characters',
    ],
    limitations: [
      {
        boundary: 'Embedded Bitmap Images',
        details: 'Mermaid diagrams containing external HTML <img> tags require CORS-enabled assets. Standard vector nodes and SVGs render 100% offline.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Font Availability in Vector Viewers',
        details: 'Exported SVGs use standard system font stacks (ui-sans-serif, Inter). Opening in Illustrator without local font fallback matches clean default sans-serif.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'Vector Scalability', targetBehavior: 'Infinite resolution with 0px blur or pixelation', status: 'native', evidence: 'Standard SVG 1.1 with viewBox' },
      { feature: 'Transparent Background', targetBehavior: 'Strips container fills for transparent overlays in slides', status: 'native', evidence: 'Clean alpha channel' },
      { feature: 'Automatic Syntax Repair', targetBehavior: 'Detects and auto-quotes special characters in node labels', status: 'native', evidence: 'Fixes unquoted brackets' },
      { feature: 'Accessible Descriptions', targetBehavior: 'Extracts node hierarchies and sequence interactions as ARIA text', status: 'native', evidence: 'extractMermaidAccessibleText' },
      { feature: 'Zero Server Upload', targetBehavior: 'Compiles 100% in local browser memory via WASM', status: 'native', evidence: 'Ondine WASM compiler' },
    ],
    faqs: [
      {
        q: 'Can I import the exported SVG into Figma or Canva?',
        a: 'Yes. The SVG includes standard viewBox dimensions, inlined vector fills, and clean stroke paths that import as native editable vector shapes in Figma, Canva, Adobe Illustrator, and Sketch.',
      },
      {
        q: 'Does this tool upload my proprietary architecture code to any server?',
        a: 'No. The entire compilation happens in your browser using client-side WebAssembly. No diagram code or vector data ever leaves your computer.',
      },
    ],
  },
  '/mermaid-to-png': {
    path: '/mermaid-to-png',
    destination: 'pdf',
    title: 'Mermaid to PNG: High-Resolution Diagram Converter (1x, 2x, 4x) | mdtodocs',
    description: 'Convert Mermaid diagrams to high-resolution PNG images up to 4x Ultra HD print quality. Transparent or solid background, 1-click clipboard copy, and zero server upload.',
    canonical: `${BASE_URL}/mermaid-to-png`,
    h1: 'Mermaid to PNG',
    lead: 'Convert Mermaid.js diagrams to high-resolution PNG images with Retina 2x and 4x print quality scaling. Copy directly to clipboard or download with transparent or solid backgrounds.',
    badge: 'Raster Diagram Exporter',
    sampleFileName: 'auth-sequence.mmd',
    sampleMarkdown: `sequenceDiagram
  autonumber
  actor User as End User
  participant App as Client Application
  participant Auth as OAuth Provider
  participant API as Backend Service

  User->>App: Click "Sign in with SSO"
  App->>Auth: Request authorization code
  Auth-->>User: Prompt credentials
  User->>Auth: Enter 2FA passcode
  Auth-->>App: Redirect with auth code
  App->>API: Exchange code for JWT session
  API-->>App: Return secure HTTP-only token
  App-->>User: Display authenticated workspace
`,
    featureBullets: [
      'Resolution multiplier scaling: 1x (Standard Web), 2x (Retina 144 DPI), 4x (Ultra HD Print 300 DPI)',
      'Direct PNG-to-clipboard copy via native browser ClipboardItem API',
      'Transparent alpha channel support or solid background (White, Dark #0f172a)',
      'Zero blur canvas rasterization with devicePixelRatio compensation',
      'Private, instant client-side rendering with no cloud queue latency',
    ],
    limitations: [
      {
        boundary: 'Very Large Diagram Dimensions at 4x',
        details: 'Diagrams exceeding 4096px width at 4x resolution may hit canvas memory caps on low-end mobile devices. 2x Retina is automatically recommended for extreme widths.',
        status: 'handled-gracefully',
      },
      {
        boundary: 'Browser Clipboard Permission',
        details: 'Directly writing image/png blobs to the system clipboard requires user-initiated click events in modern browsers.',
        status: 'supported',
      },
    ],
    formatMatrix: [
      { feature: 'High-DPI 2x & 4x Scaling', targetBehavior: 'Multiplies canvas pixels for razor-sharp text on Retina and 4K displays', status: 'native', evidence: 'Scale factor canvas rendering' },
      { feature: 'Copy Image to Clipboard', targetBehavior: 'Writes image/png directly into OS clipboard for pasting into Slack or Docs', status: 'native', evidence: 'ClipboardItem async writer' },
      { feature: 'Transparent Background Option', targetBehavior: 'Exports transparent PNGs for drag-and-drop into slide decks', status: 'native', evidence: 'Canvas alpha preservation' },
      { feature: 'Dark Mode Palette', targetBehavior: 'High-contrast dark mode palette matching modern IDEs', status: 'styled', evidence: 'Hex #1e1e24 surface' },
      { feature: 'Client-Side Privacy', targetBehavior: '100% in-browser rendering with zero analytics transmission of diagram code', status: 'native', evidence: 'Strict analytics redaction' },
    ],
    faqs: [
      {
        q: 'How do I paste the diagram directly into Slack, Notion, or Docs without saving a file?',
        a: 'Click the "Copy Image" button. This writes a high-resolution PNG directly to your operating system clipboard, allowing you to simply press Cmd+V / Ctrl+V in Slack, Notion, Linear, Google Docs, or Word.',
      },
      {
        q: 'What is the difference between 1x, 2x, and 4x resolution?',
        a: '1x exports at native screen pixels (ideal for web pages); 2x renders at 200% resolution (perfect for Retina displays and presentation slides); 4x renders at 400% resolution (300 DPI print quality suitable for PDFs and technical publications).',
      },
    ],
  },
};

export function getRouteSpec(pathname: string): RouteLandingSpec | null {
  if (!pathname) return null;
  const normalized = pathname.toLowerCase().replace(/\/$/, '') as LandingRoutePath;
  return LANDING_ROUTES[normalized] || null;
}
