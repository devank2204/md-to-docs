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
  "/": {
    "path": "/",
    "destination": "google-docs",
    "title": "Markdown to Word, PDF & Google Docs Converter | MDToDocs",
    "description": "Paste Markdown, preview technical content, and choose Word, Google Docs, PDF, HTML or formatted rich text. No account required.",
    "canonical": "https://mdtodocs.com/",
    "h1": "Markdown to Docs",
    "lead": "Paste Markdown, preview technical content, and choose Word, Google Docs, PDF, HTML or formatted rich text. No account required.",
    "badge": "Multi-Destination Exporter",
    "sampleFileName": "product-launch-plan.md",
    "sampleMarkdown": "# Product Launch Plan\n\nA high-performance technical document compiler converting Markdown into Word, Google Docs, and PDF.\n\n## Engineering Milestones\n\n| Milestone | Deliverable | Owner | Status |\n| :--- | :--- | :---: | :--- |\n| **Alpha** | AST Parser & Capability Graph | Infra | Done |\n| **Beta** | MathML Equations & Ondine WASM | Systems | Done |\n| **v1.0** | Technical SEO & Conversion Engine | Core | In Progress |\n\n## Throughput Formula\n\n$$\\mathcal{T}_{compiler} = \\frac{N_{nodes}}{\\Delta t_{parse} + \\Delta t_{render}}$$\n\n:::note\nZero silent drops guarantee: unhandled HTML tags degrade to styled code blocks and wide tables linearize cleanly.\n:::\n\n- [x] Client-side in-browser conversion\n- [x] Vector SVG Mermaid diagrams\n- [ ] Automated regression bench\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/markdown-to-word": {
    "path": "/markdown-to-word",
    "destination": "word",
    "title": "Markdown to Word Converter (DOCX) Online | MDToDocs",
    "description": "Paste or import Markdown, inspect the preview, then export a Word document with the existing DOCX workflow.",
    "canonical": "https://mdtodocs.com/markdown-to-word/",
    "h1": "Convert Markdown to Microsoft Word (.docx)",
    "lead": "Paste or import Markdown, inspect the preview, then export a Word document with the existing DOCX workflow.",
    "badge": "Word .docx Specialist",
    "sampleFileName": "system-architecture.docx",
    "sampleMarkdown": "# Distributed System Architecture Spec\n\nA high-performance microservice topology specification with automated schema validation.\n\n## Service Registry & Communication\n\n| Service | Protocol | Port | Replicas | SLA |\n| :--- | :--- | :---: | :---: | :--- |\n| **api-gateway** | HTTP/2 + TLS 1.3 | 443 | 5 | 99.99% |\n| **auth-worker** | gRPC (Internal) | 50051 | 3 | 99.95% |\n| **event-bus** | Kafka v3.6 | 9092 | 6 | 99.99% |\n| **cache-layer** | Redis Cluster | 6379 | 4 | 99.90% |\n\n## Activation Energy & Latency Models\n\n$$\\mathcal{L}_{total} = \\sum_{i=1}^{N} \\left( \\tau_{proc}^{(i)} + \\frac{\\text{PayloadSize}}{\\text{Bandwidth}^{(i)}} \\right)$$\n\n:::note\nWord documents automatically repeat the table header row on multi-page overflows and prevent awkward row page splits with `cantSplit: true`.\n:::\n\n### Infrastructure Checklist\n- [x] Provision VPC peering connections\n- [x] Configure mutual TLS (mTLS) certificates\n- [ ] Run automated load stress benchmark\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/markdown-to-pdf": {
    "path": "/markdown-to-pdf",
    "destination": "pdf",
    "title": "Markdown to PDF Converter Online | MDToDocs",
    "description": "Preview your Markdown document and prepare it for the browser print dialog. Choose Save as PDF where your browser supports it.",
    "canonical": "https://mdtodocs.com/markdown-to-pdf/",
    "h1": "Convert Markdown to PDF",
    "lead": "Preview your Markdown document and prepare it for the browser print dialog. Choose Save as PDF where your browser supports it.",
    "badge": "Print & PDF Engine",
    "sampleFileName": "quarterly-report.pdf",
    "sampleMarkdown": "# Executive Research & Reliability Report\n\nA comprehensive quarterly audit of system stability, throughput, and product roadmap delivery.\n\n## Performance Benchmarks\n\n| Milestone | Latency (p95) | Throughput | Incident Count | Status |\n| :--- | :---: | :---: | :---: | :--- |\n| **Q1 Baseline** | 42ms | 12,000 req/s | 1 | Complete |\n| **Q2 Scaling** | 28ms | 24,000 req/s | 0 | Complete |\n| **Q3 Expansion** | 19ms | 45,000 req/s | 0 | Scheduled |\n\n## Data Transformation Pipeline\n\n```mermaid\ngraph LR\n    Raw[Raw Markdown] --> Core[mdtodocs AST]\n    Core --> Print[Paged Media Engine]\n    Print --> PDF[High-Fidelity PDF]\n```\n\n## Cost Optimization Model\n\n$$\\mathbb{E}[\\text{Cost}] = \\int_{0}^{T} \\lambda(t) \\cdot c(t) \\, dt + \\sigma_{\\text{surge}}$$\n\n:::tip\nPDF export uses clean print styling with `break-inside: avoid` to ensure tables and code snippets never split awkwardly across page breaks.\n:::\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/markdown-to-google-docs": {
    "path": "/markdown-to-google-docs",
    "destination": "google-docs",
    "title": "Markdown to Google Docs Converter | MDToDocs",
    "description": "Preview Markdown and copy formatted content to paste into Google Docs, or download a Word file for import. No Google account connection required.",
    "canonical": "https://mdtodocs.com/markdown-to-google-docs/",
    "h1": "Paste Markdown into Google Docs",
    "lead": "Preview Markdown and copy formatted content to paste into Google Docs, or download a Word file for import. No Google account connection required.",
    "badge": "Google Docs Clipboard Bridge",
    "sampleFileName": "product-requirement-doc.gdoc",
    "sampleMarkdown": "# Product Requirements Document: Realtime Sync\n\nA specification for multi-tab collaboration and client state synchronization.\n\n## Target User Stories\n\n- [x] Engineers can paste architecture docs directly into Google Docs\n- [x] Product managers can copy tables without cell boundary corruption\n- [ ] Design teams can inspect live Mermaid wireframes\n\n## Core Service Contracts\n\n| Method | Endpoint | Description | Auth Required |\n| :--- | :--- | :--- | :---: |\n| `POST` | `/v1/sync/handshake` | Initialize WebSocket connection | Yes |\n| `GET` | `/v1/sync/state` | Fetch differential snapshot | Yes |\n| `DELETE` | `/v1/sync/session` | Terminate active session | No |\n\n## Mathematical Equivalence Guarantee\n\n$$\\lim_{\\Delta t \\to 0} \\frac{S(t + \\Delta t) - S(t)}{\\Delta t} = \\nabla \\mathcal{H}(S)$$\n\n:::note\nGoogle Docs converts the embedded MathML XML directly into native Google Docs equation elements.\n:::\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/markdown-to-html": {
    "path": "/markdown-to-html",
    "destination": "clipboard",
    "title": "Markdown to HTML Converter Online | MDToDocs",
    "description": "Paste Markdown, check the rendered document, and export standalone HTML for viewing in a browser.",
    "canonical": "https://mdtodocs.com/markdown-to-html/",
    "h1": "Convert Markdown to Standalone HTML",
    "lead": "Paste Markdown, check the rendered document, and export standalone HTML for viewing in a browser.",
    "badge": "Standalone HTML Generator",
    "sampleFileName": "developer-docs.html",
    "sampleMarkdown": "# API Specification: Identity & Token Exchange\n\nStandardized OAuth 2.0 and OpenID Connect authorization server endpoints.\n\n## Authentication Endpoints\n\n| Path | Method | Headers | Response Status |\n| :--- | :---: | :--- | :---: |\n| `/oauth/token` | `POST` | `Content-Type: application/x-www-form-urlencoded` | 200 OK |\n| `/oauth/revoke` | `POST` | `Authorization: Bearer <token>` | 204 No Content |\n| `/userinfo` | `GET` | `Accept: application/json` | 200 OK |\n\n## Exchange Protocol\n\n```mermaid\nsequenceDiagram\n    autonumber\n    Client->>AuthServer: POST /oauth/token (code_verifier)\n    AuthServer-->>Client: 200 OK (access_token, id_token)\n```\n\n## Token Payload Example\n\n```json\n{\n  \"sub\": \"usr_948291a8c0\",\n  \"aud\": \"https://api.mdtodocs.com\",\n  \"exp\": 1792880000,\n  \"scope\": \"read:documents write:documents\"\n}\n```\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/markdown-to-rich-text": {
    "path": "/markdown-to-rich-text",
    "destination": "clipboard",
    "title": "Markdown to Rich Text Converter | MDToDocs",
    "description": "Turn Markdown into formatted clipboard content. Preview headings, lists and tables before pasting into a rich text editor.",
    "canonical": "https://mdtodocs.com/markdown-to-rich-text/",
    "h1": "Convert Markdown to Rich Text",
    "lead": "Turn Markdown into formatted clipboard content. Preview headings, lists and tables before pasting into a rich text editor.",
    "badge": "Universal Rich Text Bridge",
    "sampleFileName": "weekly-sync.txt",
    "sampleMarkdown": "# Weekly Engineering Sync & Release Checklist\n\nSprint 42 deliverables, bug triage, and spreadsheet-ready release metrics.\n\n## Sprint Velocity & Status\n\n| Track | Objective | Owner | Progress |\n| :--- | :--- | :--- | :---: |\n| **Engine** | Rust/WASM Ondine upgrade | Systems | 100% |\n| **Design** | Dark mode contrast calibration | Product | 90% |\n| **Infra** | Automated CI fidelity harness | DevOps | 100% |\n\n## Action Items\n- [x] Verify production build artifact sizes\n- [x] Run 20 fidelity fixture benchmarks\n- [ ] Publish release notes to community channel\n\n```json\n{\n  \"release\": \"v2.0.4\",\n  \"status\": \"ready\",\n  \"checksum\": \"sha256:4b91...\"\n}\n```\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/mermaid-to-svg": {
    "path": "/mermaid-to-svg",
    "destination": "clipboard",
    "title": "Mermaid to SVG Converter Online | MDToDocs",
    "description": "Paste Mermaid source, inspect the diagram, and download an SVG image for documents and presentations.",
    "canonical": "https://mdtodocs.com/mermaid-to-svg/",
    "h1": "Mermaid to SVG",
    "lead": "Paste Mermaid source, inspect the diagram, and download an SVG image for documents and presentations.",
    "badge": "Vector Diagram Exporter",
    "sampleFileName": "system-architecture.mmd",
    "sampleMarkdown": "graph TD\n  Client[\"Web Browser (React SPA)\"] --> Gateway[\"API Gateway (Fastify)\"]\n  Gateway --> ServiceA[\"Auth & Session Service\"]\n  Gateway --> ServiceB[\"Document Compiler Engine (WASM)\"]\n  ServiceB --> Worker[\"Background Queue\"]\n  ServiceB --> Storage[(\"Encrypted Local Blob\")]\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  },
  "/mermaid-to-png": {
    "path": "/mermaid-to-png",
    "destination": "pdf",
    "title": "Mermaid to PNG Converter Online | MDToDocs",
    "description": "Render Mermaid source and download a PNG diagram with a choice of scale and background. Inspect the result before sharing.",
    "canonical": "https://mdtodocs.com/mermaid-to-png/",
    "h1": "Mermaid to PNG",
    "lead": "Render Mermaid source and download a PNG diagram with a choice of scale and background. Inspect the result before sharing.",
    "badge": "Raster Diagram Exporter",
    "sampleFileName": "auth-sequence.mmd",
    "sampleMarkdown": "sequenceDiagram\n  autonumber\n  actor User as End User\n  participant App as Client Application\n  participant Auth as OAuth Provider\n  participant API as Backend Service\n\n  User->>App: Click \"Sign in with SSO\"\n  App->>Auth: Request authorization code\n  Auth-->>User: Prompt credentials\n  User->>Auth: Enter 2FA passcode\n  Auth-->>App: Redirect with auth code\n  App->>API: Exchange code for JWT session\n  API-->>App: Return secure HTTP-only token\n  App-->>User: Display authenticated workspace\n",
    "featureBullets": [],
    "limitations": [],
    "formatMatrix": [],
    "faqs": []
  }
};

export function getRouteSpec(pathname: string): RouteLandingSpec | null {
 const normalized = pathname.toLowerCase().replace(/\/$/, "") || "/";
 return LANDING_ROUTES[normalized as LandingRoutePath] || null;
}
