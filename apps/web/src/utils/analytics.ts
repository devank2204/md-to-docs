export type DocLengthBucket = '<500' | '500-2k' | '2k-10k' | '>10k';
export type ExportCountBucket = '1' | '2-5' | '6-20' | '>20';

export function getDocLengthBucket(length: number): DocLengthBucket {
  if (length < 500) return '<500';
  if (length <= 2000) return '500-2k';
  if (length <= 10000) return '2k-10k';
  return '>10k';
}

export function getExportCountBucket(count: number): ExportCountBucket {
  if (count <= 1) return '1';
  if (count <= 5) return '2-5';
  if (count <= 20) return '6-20';
  return '>20';
}

export type AnalyticsEvent =
  | { name: 'page_view'; properties: { path: string; referrer: string } }
  | {
      name: 'editor_action';
      properties: {
        action: 'paste' | 'sample' | 'type' | 'clear' | 'drop';
        docLengthBucket: DocLengthBucket;
      };
    }
  | { name: 'destination_change'; properties: { from: string; to: string } }
  | {
      name: 'export_attempt';
      properties: { destination: string; format: string; hasWarnings: boolean };
    }
  | {
      name: 'export_success';
      properties: { destination: string; format: string; durationMs: number };
    }
  | {
      name: 'export_failure';
      properties: { destination: string; format: string; errorType: string };
    }
  | { name: 'preset_change'; properties: { presetId: string } }
  | { name: 'canvas_studio_open'; properties: { diagramType: string } }
  | {
      name: 'repeat_usage';
      properties: { exportCountBucket: ExportCountBucket };
    };

export interface AnalyticsRecord {
  event: AnalyticsEvent['name'];
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

class AnalyticsService {
  private eventLog: AnalyticsRecord[] = [];
  private maxLogSize = 100;
  private lastEditorActionTime = 0;
  private lastPageViewPath = '';

  /**
   * Validates that no raw document content, markdown formatting,
   * or personal data is present in telemetry payloads.
   */
  private sanitizePayload(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, val] of Object.entries(props)) {
      if (typeof val === 'string') {
        // Reject any string that resembles markdown or document text
        if (
          val.includes('\n') ||
          val.includes('#') ||
          val.includes('```') ||
          val.includes('|') ||
          val.length > 100
        ) {
          console.warn(`[Analytics] Stripped potentially sensitive string for key "${key}"`);
          sanitized[key] = '[REDACTED]';
          continue;
        }
        sanitized[key] = val.trim();
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  public track<T extends AnalyticsEvent>(name: T['name'], properties: T['properties']): void {
    try {
      // Debounce duplicate page_view events for same path
      if (name === 'page_view') {
        const path = (properties as any).path;
        if (path === this.lastPageViewPath) return;
        this.lastPageViewPath = path;
      }

      // Debounce high-frequency 'type' editor actions (max 1 per 15s)
      if (name === 'editor_action' && (properties as any).action === 'type') {
        const now = Date.now();
        if (now - this.lastEditorActionTime < 15000) {
          return;
        }
        this.lastEditorActionTime = now;
      }

      const cleanProps = this.sanitizePayload(properties);
      const record: AnalyticsRecord = {
        event: name,
        properties: cleanProps,
        timestamp: Date.now(),
      };

      this.eventLog.push(record);
      if (this.eventLog.length > this.maxLogSize) {
        this.eventLog.shift();
      }

      // Safe dispatch to navigator.sendBeacon if configured, never throws
      this.dispatchBeacon(record);
    } catch {
      // Analytics failures must NEVER break user application flows
    }
  }

  private dispatchBeacon(record: AnalyticsRecord): void {
    if (typeof window === 'undefined') return;

    // Optional self-hosted telemetry endpoint
    const endpoint = (window as any).__MDTD_TELEMETRY_ENDPOINT__;
    if (endpoint && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const payload = JSON.stringify(record);
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } catch {
        // Ignore blocked network errors silently
      }
    }
  }

  public trackExportCompleted(destination: string, format: string, durationMs: number): void {
    this.track('export_success', { destination, format, durationMs });

    // Track repeat usage buckets without tracking personal identity
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const prev = parseInt(localStorage.getItem('mdtodocs_export_count') || '0', 10);
        const next = prev + 1;
        localStorage.setItem('mdtodocs_export_count', next.toString());
        this.track('repeat_usage', { exportCountBucket: getExportCountBucket(next) });
      } catch {
        // LocalStorage access restricted in private mode
      }
    }
  }

  public getEventHistory(): readonly AnalyticsRecord[] {
    return this.eventLog;
  }

  public clearHistory(): void {
    this.eventLog = [];
    this.lastPageViewPath = '';
    this.lastEditorActionTime = 0;
  }
}

export const analytics = new AnalyticsService();
