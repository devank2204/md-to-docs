import type { DocumentTheme } from './types';

export const DARK_THEME: DocumentTheme = {
  name: 'Dark',
  colors: {
    text: 'E5E7EB',
    background: '111827',
    primary: '60A5FA',
    secondary: '9CA3AF',
    border: '374151',
    codeBackground: '1F2937',
    codeText: 'F3F4F6',
    blockquoteBorder: '4B5563',
    blockquoteText: 'D1D5DB',
    tableHeaderBackground: '1F2937',
    callouts: {
      note: { bg: '1E3A8A', border: '3B82F6', text: 'DBEAFE' },
      tip: { bg: '064E3B', border: '10B981', text: 'D1FAE5' },
      important: { bg: '4C1D95', border: '8B5CF6', text: 'EDE9FE' },
      warning: { bg: '78350F', border: 'F59E0B', text: 'FEF3C7' },
      caution: { bg: '7F1D1D', border: 'EF4444', text: 'FEE2E2' },
    }
  },
  typography: {
    bodyFont: "'Inter', sans-serif",
    headingFont: "'Inter', sans-serif",
    codeFont: "'JetBrains Mono', monospace",
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
