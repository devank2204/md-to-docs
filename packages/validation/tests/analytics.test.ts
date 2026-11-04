import { describe, it, expect, beforeEach } from 'vitest';
import {
  analytics,
  getDocLengthBucket,
  getExportCountBucket,
} from '../../../apps/web/src/utils/analytics';

describe('Prompt 06: Privacy-First Product Analytics', () => {
  beforeEach(() => {
    analytics.clearHistory();
  });

  it('correctly maps document length to coarse privacy buckets', () => {
    expect(getDocLengthBucket(120)).toBe('<500');
    expect(getDocLengthBucket(499)).toBe('<500');
    expect(getDocLengthBucket(500)).toBe('500-2k');
    expect(getDocLengthBucket(2000)).toBe('500-2k');
    expect(getDocLengthBucket(2001)).toBe('2k-10k');
    expect(getDocLengthBucket(10000)).toBe('2k-10k');
    expect(getDocLengthBucket(10001)).toBe('>10k');
  });

  it('correctly maps repeat export counts to retention buckets', () => {
    expect(getExportCountBucket(1)).toBe('1');
    expect(getExportCountBucket(3)).toBe('2-5');
    expect(getExportCountBucket(5)).toBe('2-5');
    expect(getExportCountBucket(12)).toBe('6-20');
    expect(getExportCountBucket(20)).toBe('6-20');
    expect(getExportCountBucket(21)).toBe('>20');
  });

  it('sanitizes and redacts any property resembling document content or markdown', () => {
    // Attempt to pass raw markdown content in a property
    analytics.track('page_view' as any, {
      path: '/markdown-to-word',
      referrer: '# Confidential Secret\n| Table | Column |\n```code```',
    } as any);

    const history = analytics.getEventHistory();
    expect(history.length).toBe(1);
    expect(history[0].event).toBe('page_view');
    expect(history[0].properties.path).toBe('/markdown-to-word');
    expect(history[0].properties.referrer).toBe('[REDACTED]');
  });

  it('deduplicates consecutive page_view calls for the same route', () => {
    analytics.track('page_view', { path: '/markdown-to-word', referrer: '' });
    analytics.track('page_view', { path: '/markdown-to-word', referrer: '' });
    analytics.track('page_view', { path: '/markdown-to-word', referrer: '' });

    const history = analytics.getEventHistory();
    expect(history.length).toBe(1);

    // Navigating to a different route allows a new page_view
    analytics.track('page_view', { path: '/markdown-to-pdf', referrer: '' });
    expect(analytics.getEventHistory().length).toBe(2);
  });

  it('records full conversion funnel events from editor action to export completion', () => {
    // 1. Landing View
    analytics.track('page_view', { path: '/markdown-to-word', referrer: 'https://google.com' });

    // 2. Editor Paste Action
    analytics.track('editor_action', { action: 'paste', docLengthBucket: '2k-10k' });

    // 3. Destination Change
    analytics.track('destination_change', { from: 'google-docs', to: 'word' });

    // 4. Export Attempt
    analytics.track('export_attempt', { destination: 'word', format: 'docx', hasWarnings: false });

    // 5. Export Success & Repeat Usage
    analytics.trackExportCompleted('word', 'docx', 38);

    const history = analytics.getEventHistory();
    expect(history.length).toBe(6);

    expect(history[0].event).toBe('page_view');
    expect(history[1].event).toBe('editor_action');
    expect(history[2].event).toBe('destination_change');
    expect(history[3].event).toBe('export_attempt');
    expect(history[4].event).toBe('export_success');
    expect(history[5].event).toBe('repeat_usage');

    // Confirm zero raw markdown text is present in any logged payload
    const serialized = JSON.stringify(history);
    expect(serialized).not.toContain('#');
    expect(serialized).not.toContain('```');
    expect(serialized).not.toContain('\n');
  });

  it('handles ad-blocker or network rejection gracefully without throwing', () => {
    // Mock navigator.sendBeacon throwing an ad-blocker error
    const originalBeacon = globalThis.navigator?.sendBeacon;
    if (globalThis.navigator) {
      (globalThis.navigator as any).sendBeacon = () => {
        throw new Error('Blocked by client extension');
      };
    }

    expect(() => {
      analytics.track('export_attempt', { destination: 'pdf', format: 'pdf', hasWarnings: true });
    }).not.toThrow();

    if (globalThis.navigator) {
      (globalThis.navigator as any).sendBeacon = originalBeacon;
    }
  });
});
