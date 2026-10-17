export interface DocumentTemplate {
  id: string;
  title: string;
  category: 'Architecture' | 'Decisions' | 'Product' | 'Reliability' | 'Process';
  summary: string;
  icon: string;
  tags: string[];
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'technical-rfc',
    title: 'Technical RFC & Architecture Spec',
    category: 'Architecture',
    summary: 'Distributed systems specification with Mermaid topology, SLA budget tables, and throughput models.',
    icon: 'architecture',
    tags: ['RFC', 'Mermaid', 'Math', 'SLAs'],
    content: `# RFC 9110: High-Throughput Event Streaming Architecture

> **Author:** Distributed Systems Core Team  
> **Status:** Proposed  
> **Target Release:** Q1 2027  
> **Review Period:** October 2026 – November 2026  

---

## 1. Executive Summary

This Request for Comments (RFC) specifies the next-generation event ingestion pipeline for high-scale document telemetry. The primary objective is achieving sub-25ms end-to-end event propagation with zero message loss during regional failovers.

### 1.1 Non-Negotiable SLOs

| Tier | Metric | Target | Failover Threshold |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Ingress)** | P99 Ingestion Latency | $\\le 18\\text{ ms}$ | $35\\text{ ms}$ |
| **Tier 1 (Ingress)** | Availability | $99.995\\%$ | $99.900\\%$ |
| **Tier 2 (Processing)** | Max Backlog Duration | $< 60\\text{ s}$ | $300\\text{ s}$ |
| **Tier 3 (Export)** | DOCX / PDF Render Time | $< 800\\text{ ms}$ | $2000\\text{ ms}$ |

---

## 2. Ingress & Routing Topology

The architecture decouples stateless edge terminators from durable log partitions:

\`\`\`mermaid
flowchart TD
    Client[Edge Telemetry Client] -->|mTLS 1.3| Gateway[Envoy Ingress Gateway]
    Gateway -->|gRPC Stream| ShardRouter[Consistent Hash Shard Router]
    ShardRouter -->|Partition 0-15| KafkaCluster[(Durable Storage Cluster)]
    ShardRouter -->|Failover Replica| S3Backup[(Cold Storage Sink)]
    KafkaCluster -->|Consumer Group| WorkerFleet[Renderer Worker Fleet]
    WorkerFleet -->|Artifact| CDN[Global Edge Cache]
\`\`\`

---

## 3. Mathematical Performance Model

The streaming buffer capacity $C$ required to withstand a maximum consumer outage duration $\\Delta t_{\\max}$ without packet drop is derived as:

$$
C = \\int_{t_0}^{t_0 + \\Delta t_{\\max}} \\lambda(t) \\cdot \\bar{S} \\, dt + \\alpha \\cdot \\sigma_{\\lambda}
$$

Where:
- $\\lambda(t)$ is the incoming request arrival rate (events/second).
- $\\bar{S}$ is the average payload size in bytes ($4.2\\text{ KB}$).
- $\\alpha = 3.0$ provides a $99.7\\%$ confidence interval against burst traffic variance $\\sigma_{\\lambda}$.

---

## 4. Rollback and Disaster Recovery

In the event that the primary partition broker enters an unrecoverable state:
1. Edge ingress drains in-flight connections within **5,000ms**.
2. DNS routing fails over to secondary availability zone via route health checks.
3. Cold storage replay reconciles missing offsets using idempotent message hashes.
`,
  },

  {
    id: 'adr-architecture-decision',
    title: 'Architecture Decision Record (ADR)',
    category: 'Decisions',
    summary: 'Immutable record of architectural decisions, tradeoffs, context, and validation benchmarks.',
    icon: 'gavel',
    tags: ['ADR', 'Decisions', 'Tradeoffs'],
    content: `# ADR-042: Client-First Vector Diagram & Rasterization Strategy

> **Status:** Accepted  
> **Date:** October 2026  
> **Deciders:** Principal Architect, Lead UI Engineer, Security Lead  
> **Supersedes:** ADR-018 (Server-Side Puppeteer Pool)  

---

## 1. Context and Problem Statement

Exporting rich visual diagrams (Mermaid flowcharts, sequence diagrams, state machines) to Microsoft Word and PDF requires rasterized image assets. 

Previously, we evaluated running \`mermaid-cli\` on a dedicated Node.js Puppeteer microservice. Under high concurrent workloads, server-side Chromium instances introduced:
- $450\\text{ ms} - 1,200\\text{ ms}$ cold start penalties.
- High memory pressure ($180\\text{ MB}$ per headless browser process).
- Operational costs exceeding $1,400/\\text{month}$ on Kubernetes.

We need a zero-infrastructure, instant (<25ms) vector rasterization approach.

---

## 2. Decision Matrix

| Dimension | Option A: Server Puppeteer Pool | Option B: Browser HTML5 Canvas (Selected) | Option C: Pre-rendered Static SVGs |
| :--- | :--- | :--- | :--- |
| **Latency** | $850\\text{ ms}$ | **$12\\text{ ms}$** | $0\\text{ ms}$ (Stale) |
| **Infrastructure Cost** | $1,400/\\text{mo}$ | **$0.00** | $0.00 |
| **Offline Capability** | No | **Yes (100% Client-Side)** | Partial |
| **Retina / 2x DPI** | Requires CLI flags | **Native High-Res Canvas** | Fixed resolution |
| **Security Risk** | SSRF / Sandbox Escape | **Zero Server Attack Surface** | Low |

---

## 3. Decision Outcome

**Chosen Option:** Option B — Client-side HTML5 Canvas rasterization via SVG XML serialization.

### 3.1 State Progression

\`\`\`mermaid
stateDiagram-v2
    [*] --> MarkdownSource: User types / imports
    MarkdownSource --> AstParsing: remark / unist
    AstParsing --> ClientMermaid: Vector SVG generation
    ClientMermaid --> CanvasBuffer: Image drawing at 2x Scale
    CanvasBuffer --> HighResPng: Word .docx embedding
    CanvasBuffer --> JpegExport: Standalone image download
    HighResPng --> [*]: Zero Cloud Infrastructure
\`\`\`

---

## 4. Consequences and Validation

### Positive Consequences
- **Zero latency**: Generation occurs synchronously in the user's browser.
- **Air-gapped security**: Sensitive architecture diagrams never transit through third-party rendering APIs.
- **Full offline resilience**: Complete fidelity available without internet connectivity.

### Negative Consequences & Mitigations
- In isolated JSDOM automated tests, canvas elements lack native GPU hardware.  
  *Mitigation:* Mocked fallback dimensions in \`packages/asset-pipeline\` ensure $100\\%$ CI coverage without headless browser dependencies.
`,
  },

  {
    id: 'executive-prd',
    title: 'Executive Product Requirements (PRD)',
    category: 'Product',
    summary: 'Executive-level product requirements document with user personas, scope matrix, and OKR targets.',
    icon: 'assignment',
    tags: ['PRD', 'Product', 'OKRs', 'Scope'],
    content: `# PRD: Autonomous Document Quality & Stakeholder Bridge

> **Product:** mdtodocs Enterprise  
> **Product Lead:** VP of Engineering & Product  
> **Target Release:** Q4 2026  
> **Status:** Execution Ready  

---

## 1. Problem Statement

Modern software engineering teams write technical specifications in Markdown, while executive stakeholders, legal teams, and clients review documents exclusively in **Microsoft Word** and **Google Docs**.

This divide causes:
1. **$4.5\\text{ hours/week}$ per senior engineer** spent manually re-formatting tables, equations, and diagrams.
2. Broken equations and truncated tables bleeding past printable page margins.
3. Divergence between version-controlled source code and external stakeholder doc copies.

---

## 2. User Journey

\`\`\`mermaid
journey
    title Developer to Stakeholder Document Lifecycle
    section Authoring
      Write Markdown & Math in IDE: 5: Developer
      Live Preview with Destination Guard: 5: Developer
    section Export
      1-Click Copy for Google Docs: 5: Developer
      Download High-Res Word .docx: 5: Developer
    section Stakeholder Review
      Executive Review Mode (?mode=review): 5: Executive
      Suggest Edits linked to GitHub: 4: Stakeholder
    section Reconciliation
      Auto-repair Markdown from Comments: 5: Developer
\`\`\`

---

## 3. Scope & Phasing Matrix

| Capability | Priority | Target Release | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Table Excel/Sheets Clipboard** | **P0** | Sprint 1 | Preserves colors, header cells, numbers, and TSV tabs. |
| **Mermaid 2x JPEG/SVG Export** | **P0** | Sprint 1 | Pure client-side export with white canvas background. |
| **JSON Comment Stripper** | **P0** | Sprint 2 | Strips comments to prevent 400 Bad Request API errors. |
| **Headless Validation API** | **P1** | Sprint 2 | Lightweight REST endpoint for CI/CD documentation gates. |
| **Stakeholder Review Mode** | **P1** | Sprint 3 | Clean URL-synced presentation hiding editor panes. |
| **Command Palette (⌘K)** | **P1** | Sprint 3 | Universal keyboard acceleration for all document actions. |

---

## 4. Key Performance Indicators (KPIs)

$$
\\text{Engineer Time Saved} = N_{\\text{docs}} \\times 1.75\\text{ hrs} \\times \\text{Hourly Rate}
$$

- **Target 1:** Zero formatting repairs required after pasting into Google Docs.
- **Target 2:** P95 Word DOCX compilation time $< 450\\text{ ms}$.
- **Target 3:** $100\\%$ CI automated test pass rate across all 17 fidelity fixtures.
`,
  },

  {
    id: 'incident-postmortem',
    title: 'Incident Post-Mortem & Root Cause Analysis',
    category: 'Reliability',
    summary: 'Blameless incident review with incident timeline, impact metrics, root cause topology, and action items.',
    icon: 'warning',
    tags: ['Incident', 'Post-Mortem', 'SEV-1', 'Reliability'],
    content: `# Incident Post-Mortem: Event Ingestion Saturation (SEV-1)

> **Incident ID:** INC-84920  
> **Severity:** SEV-1 (Critical)  
> **Date:** October 12, 2026  
> **Incident Commander:** Reliability Operations Lead  
> **Impact:** 14 minutes elevated API error rate  

---

## 1. Incident Overview & Impact

Between 14:02 UTC and 14:16 UTC, our primary edge ingress gateway experienced connection queue saturation following an upstream TLS certificate renewal reload.

### Impact Metrics
- **Impact Duration:** 14 minutes, 22 seconds.
- **Affected Endpoints:** \`/api/v1/render\` ($18.4\\%$ error rate during peak).
- **Estimated Unserved Documents:** 2,140 document exports.
- **Data Loss:** $0\\text{ records}$ (durable buffer queue retained all requests).

---

## 2. Sequence of Events & Failure Cascade

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Ingress Client
    participant Envoy as Edge Gateway
    participant TLS as Vault CA Service
    participant Queue as Event Ingestion Queue
    participant Worker as Render Workers

    Note over Envoy,TLS: Automated Certificate Rotation
    TLS->>Envoy: Push renewed x509 leaf cert
    Envoy->>Envoy: Graceful reload of listener workers
    Note over Envoy: Worker thread lock contention
    Client->>Envoy: Burst traffic (35,000 req/s)
    Envoy-->>Client: 504 Gateway Timeout (Queue full)
    Envoy->>Queue: Drain remaining TCP sockets
    Worker->>Queue: Pull backlog and resume rendering
    Note over Worker: Fleet auto-scales +200 instances
\`\`\`

---

## 3. Timeline of Detection and Response

| Timestamp (UTC) | Elapsed | Event / Action Taken |
| :--- | :--- | :--- |
| **14:02:11** | $T + 00:00$ | Vault CA triggers routine TLS reload on ingress nodes. |
| **14:03:45** | $T + 01:34$ | Automated P99 latency alert fires in Slack #ops-critical. |
| **14:05:10** | $T + 02:59$ | Incident Commander declared; traffic shunted to backup AZ. |
| **14:11:00** | $T + 08:49$ | Thread lock identified; worker thread concurrency increased. |
| **14:16:33** | $T + 14:22$ | Error rate drops below $0.01\\%$; all queues fully drained. |

---

## 4. Preventative Action Items

| Action Item | Priority | Owner | Target Due Date |
| :--- | :--- | :--- | :--- |
| Decouple TLS secret renewal from listener process reloads | **P0** | Platform Team | Oct 24, 2026 |
| Implement client-side exponential backoff with jitter | **P0** | SDK Team | Oct 28, 2026 |
| Double connection backlog buffer on all edge nodes | **P1** | SRE Core | Nov 04, 2026 |
`,
  },

  {
    id: 'sprint-retro',
    title: 'Engineering Sprint Retrospective',
    category: 'Process',
    summary: 'Team retrospective template with delivery velocity tables, sprint highlights, blockers, and next commitments.',
    icon: 'groups',
    tags: ['Retro', 'Agile', 'Engineering', 'Process'],
    content: `# Sprint 48 Retrospective: Core Architecture Hardening

> **Sprint Duration:** October 1 – October 15, 2026  
> **Team:** Document Engine Core  
> **Scrum Master / Lead:** Eng Lead  
> **Sprint Theme:** AI Workspace Strategy & Monorepo Integration  

---

## 1. Delivery Scorecard

| Milestone Goal | Target Points | Delivered | Completion Rate |
| :--- | :--- | :--- | :--- |
| **Table Copy Fidelity Engine** | 8 | 8 | $100\\%$ |
| **Mermaid Export Suite (JPEG/SVG)** | 8 | 8 | $100\\%$ |
| **Code Block Live Formatter** | 5 | 5 | $100\\%$ |
| **Headless Validation API** | 13 | 13 | $100\\%$ |
| **Stakeholder Review Mode** | 8 | 8 | $100\\%$ |
| **Command Palette (⌘K)** | 5 | 5 | $100\\%$ |
| **Total Sprint Velocity** | **47 pts** | **47 pts** | **100% Commitment Met** |

---

## 2. Sprint Velocity Progression

\`\`\`mermaid
flowchart LR
    subgraph Sprint46[Sprint 46]
      S46[32 pts delivered]
    end
    subgraph Sprint47[Sprint 47]
      S47[38 pts delivered]
    end
    subgraph Sprint48[Sprint 48]
      S48[47 pts delivered - High Velocity]
    end
    Sprint46 --> Sprint47 --> Sprint48
\`\`\`

---

## 3. Retrospective Feedback

### What Went Exceptionally Well
- **Zero-regress validation gate**: 61/61 automated tests protected core AST transformations while adding major features.
- **Direct browser subagent verification**: Caught UI regressions and edge cases before code landing.
- **Client-first architecture**: Rejecting heavy server-side Chromium in favor of HTML5 canvas kept infrastructure costs at $0.

### What Could Be Improved
- **TypeScript workspace linking**: Ensure Node global types are pre-cached in monorepo packages to minimize CI rebuild times.
- **Large fixture execution time**: Vitest runs with JSDOM take $\\sim 20\\text{ seconds}$; moving to worker pool threads will accelerate fast loops.

---

## 4. Next Sprint Commitments

1. **Executive Template Gallery**: Deploy 1-click templates for technical and product teams.
2. **Reverse Word Reconciler UI**: Merge Word doc comments back into Markdown source.
3. **Multi-Document Tabs**: Retain document history and multiple open drafts.
`,
  },
];
