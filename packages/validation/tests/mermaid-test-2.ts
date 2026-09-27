import { parseMarkdown } from '@mdtodocs/compiler-core';
import { resolveAssets } from '@mdtodocs/asset-pipeline';
import { renderToClipboardHtml } from '@mdtodocs/renderers/src/clipboard';
import { THEMES } from '@mdtodocs/compiler-core';

async function test() {
  const md = `
\`\`\`mermaid
flowchart TD
    subgraph Frontend["Frontend (delhivery-one-frontend)"]
        UI[Appointments Page - 3 Tabs]
        TB1[Tab: Appointment Booked]
        TB2[Tab: Appointment Needed]
        TB3[Tab: Other Exceptions]
    end

    subgraph Backend["Backend (megazord)"]
        GW[UCP Gateway]
        HQ[HQ Service]
        EMS_SVC[EMS Service Layer]
        ES[Elasticsearch - HQ ES]
        EMS[External EMS]
    end

    subgraph APIs["API Calls"]
        API1["POST /hq_es_shipments_search/list<br/>(with slot.apt + cs.st filters)"]
        API2["POST /exceptions/list_exceptions<br/>(bucket=EB05)"]
        API3["POST /exceptions/list_exceptions<br/>(filter by AWB list, all buckets)"]
        API4["NEW: POST /exceptions/batch_check_exceptions<br/>(accepts AWB list, returns exceptions map)"]
    end

    %% Tab 1 Flow
    TB1 -->|"1. Get booked appointments"| API1
    API1 --> GW --> HQ --> ES
    ES -->|"Filter: slot.apt.date EXISTS<br/>AND cs.st = 'UD'"| HQ
    HQ -->|"Return shipments with slot data"| TB1
    TB1 -->|"2. Check for other exceptions"| API4
    API4 --> EMS_SVC --> EMS

    %% Tab 2 Flow
    TB2 -->|"1. Get appointment exceptions"| API2
    API2 --> GW --> EMS_SVC --> EMS
    EMS -->|"Return EB05 exceptions"| TB2
    TB2 -->|"2. Enrich with shipment data"| API1
    TB2 -->|"3. Get slot.apt for PO#/expiry"| API1

    %% Tab 3 Flow
    TB3 -->|"1. Collect AWBs from Tab1 + Tab2"| TB3
    TB3 -->|"2. Batch check exceptions"| API4
    API4 -->|"Return exceptions map<br/>(AWB → exception details)"| TB3

    style UI fill:#e1f5fe
    style TB1 fill:#c8e6c9
    style TB2 fill:#fff9c4
    style TB3 fill:#ffccbc
\`\`\`
  `;
  const ast = parseMarkdown(md);
  const resolvedAst = await resolveAssets(ast);
  const html = renderToClipboardHtml(resolvedAst, THEMES.default);
  console.log("HTML length:", html.length);
  if (!html.includes('data:image/svg+xml;base64')) {
    console.error("NO IMAGE GENERATED");
  } else {
    console.log("Image generated.");
  }
}

test().catch(console.error);
