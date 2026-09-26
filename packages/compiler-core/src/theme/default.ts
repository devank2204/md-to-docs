import type { DocumentTheme } from './types';

export const DEFAULT_THEME: DocumentTheme = {
  name: 'Default',
  colors: {
    text: '1A1A1A',
    background: 'FFFFFF',
    primary: '2563EB',
    secondary: '6B7280',
    border: 'D1D5DB',
    codeBackground: 'F3F4F6',
    codeText: '1F2937',
    blockquoteBorder: 'D1D5DB',
    blockquoteText: '4B5563',
    tableHeaderBackground: 'F3F4F6',
    callouts: {
      note: { bg: 'EFF6FF', border: '3B82F6', text: '1E40AF' },
      tip: { bg: 'F0FDF4', border: '22C55E', text: '166534' },
      important: { bg: 'F5F3FF', border: '8B5CF6', text: '5B21B6' },
      warning: { bg: 'FFFBEB', border: 'F59E0B', text: '92400E' },
      caution: { bg: 'FEF2F2', border: 'EF4444', text: '991B1B' },
    }
  },
  typography: {
    bodyFont: "'Söhne', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    headingFont: "'Söhne', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    codeFont: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    baseFontSizePt: 11,
    headingSizesPt: {
      1: 24,
      2: 18,
      3: 14,
      4: 12,
      5: 11,
      6: 10,
    }
  },
  spacing: {
    paragraphSpacingPt: 8,
    headingSpacingBeforePt: 16,
    headingSpacingAfterPt: 8,
    lineHeight: 1.6,
  }
};
