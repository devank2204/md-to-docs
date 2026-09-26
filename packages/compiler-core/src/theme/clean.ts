import type { DocumentTheme } from './types';

export const CLEAN_THEME: DocumentTheme = {
  name: 'Clean',
  colors: {
    text: '333333',
    background: 'FFFFFF',
    primary: '000000',
    secondary: '888888',
    border: 'EEEEEE',
    codeBackground: 'FAFAFA',
    codeText: '333333',
    blockquoteBorder: '000000',
    blockquoteText: '555555',
    tableHeaderBackground: 'FAFAFA',
    callouts: {
      note: { bg: 'FAFAFA', border: '333333', text: '333333' },
      tip: { bg: 'FAFAFA', border: '333333', text: '333333' },
      important: { bg: 'FAFAFA', border: '333333', text: '333333' },
      warning: { bg: 'FAFAFA', border: '333333', text: '333333' },
      caution: { bg: 'FAFAFA', border: '333333', text: '333333' },
    }
  },
  typography: {
    bodyFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    codeFont: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
    baseFontSizePt: 12,
    headingSizesPt: {
      1: 28,
      2: 20,
      3: 16,
      4: 14,
      5: 12,
      6: 11,
    }
  },
  spacing: {
    paragraphSpacingPt: 12,
    headingSpacingBeforePt: 24,
    headingSpacingAfterPt: 12,
    lineHeight: 1.8,
  }
};
