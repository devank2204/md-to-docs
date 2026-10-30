import type { DocumentTheme } from '../theme/types';
import { DEFAULT_THEME } from '../theme/default';

export type DocumentPresetId =
  | 'default'
  | 'ai-prd'
  | 'tech-arch'
  | 'research-report'
  | 'executive-brief';

export interface DocumentPreset {
  id: DocumentPresetId;
  name: string;
  description: string;
  badge: string;
  icon: string;
  theme: DocumentTheme;
  layoutRules: {
    tableStyle: 'striped' | 'bordered' | 'minimal' | 'academic';
    calloutStyle: 'border-left' | 'boxed' | 'tinted';
    codeBlockContrast: 'normal' | 'high-contrast' | 'subtle';
    headingStyle: 'accent-underline' | 'pill' | 'classic' | 'uppercase-muted';
  };
}

export const AI_PRD_THEME: DocumentTheme = {
  name: 'AI PRD & Specification',
  colors: {
    text: '18181B',
    background: 'FFFFFF',
    primary: '2563EB',
    secondary: '71717A',
    border: 'E4E4E7',
    codeBackground: 'F4F4F5',
    codeText: '09090B',
    blockquoteBorder: '2563EB',
    blockquoteText: '3F3F46',
    tableHeaderBackground: 'F4F4F5',
    callouts: {
      note: { bg: 'EFF6FF', border: '3B82F6', text: '1D4ED8' },
      tip: { bg: 'ECFDF5', border: '10B981', text: '047857' },
      important: { bg: 'F5F3FF', border: '8B5CF6', text: '6D28D9' },
      warning: { bg: 'FFFBEB', border: 'F59E0B', text: 'B45309' },
      caution: { bg: 'FEF2F2', border: 'EF4444', text: 'B91C1C' },
    },
  },
  typography: {
    bodyFont: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    headingFont: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    codeFont: "'JetBrains Mono', Consolas, monospace",
    baseFontSizePt: 10.5,
    headingSizesPt: {
      1: 22,
      2: 16,
      3: 13,
      4: 11.5,
      5: 10.5,
      6: 9.5,
    },
  },
  spacing: {
    paragraphSpacingPt: 8,
    headingSpacingBeforePt: 18,
    headingSpacingAfterPt: 8,
    lineHeight: 1.55,
  },
};

export const TECH_ARCH_THEME: DocumentTheme = {
  name: 'Technical Architecture Spec',
  colors: {
    text: '0F172A',
    background: 'FFFFFF',
    primary: '0284C7',
    secondary: '64748B',
    border: 'CBD5E1',
    codeBackground: '1E293B',
    codeText: 'F8FAFC',
    blockquoteBorder: '0284C7',
    blockquoteText: '334155',
    tableHeaderBackground: 'F1F5F9',
    callouts: {
      note: { bg: 'F0F9FF', border: '0284C7', text: '0369A1' },
      tip: { bg: 'ECFDF5', border: '059669', text: '047857' },
      important: { bg: 'F8FAFC', border: '475569', text: '1E293B' },
      warning: { bg: 'FFFBEB', border: 'D97706', text: '92400E' },
      caution: { bg: 'FEF2F2', border: 'DC2626', text: '991B1B' },
    },
  },
  typography: {
    bodyFont: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    headingFont: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    codeFont: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    baseFontSizePt: 10,
    headingSizesPt: {
      1: 20,
      2: 15,
      3: 12.5,
      4: 11,
      5: 10,
      6: 9,
    },
  },
  spacing: {
    paragraphSpacingPt: 6,
    headingSpacingBeforePt: 14,
    headingSpacingAfterPt: 6,
    lineHeight: 1.5,
  },
};

export const RESEARCH_REPORT_THEME: DocumentTheme = {
  name: 'Research & Analysis Report',
  colors: {
    text: '1C1917',
    background: 'FFFFFF',
    primary: '78350F',
    secondary: '78716C',
    border: 'D6D3D1',
    codeBackground: 'F5F5F4',
    codeText: '292524',
    blockquoteBorder: '78350F',
    blockquoteText: '44403C',
    tableHeaderBackground: 'F5F5F4',
    callouts: {
      note: { bg: 'FDF8F6', border: '78350F', text: '451A03' },
      tip: { bg: 'F0FDF4', border: '166534', text: '14532D' },
      important: { bg: 'FAF5FF', border: '6B21A8', text: '581C87' },
      warning: { bg: 'FFFBEB', border: '92400E', text: '78350F' },
      caution: { bg: 'FEF2F2', border: '991B1B', text: '7F1D1D' },
    },
  },
  typography: {
    bodyFont: "'Newsreader', 'Georgia', 'Times New Roman', serif",
    headingFont: "'Newsreader', 'Georgia', 'Times New Roman', serif",
    codeFont: "'JetBrains Mono', Consolas, monospace",
    baseFontSizePt: 11,
    headingSizesPt: {
      1: 24,
      2: 17,
      3: 14,
      4: 12,
      5: 11,
      6: 10,
    },
  },
  spacing: {
    paragraphSpacingPt: 10,
    headingSpacingBeforePt: 20,
    headingSpacingAfterPt: 10,
    lineHeight: 1.65,
  },
};

export const EXECUTIVE_BRIEF_THEME: DocumentTheme = {
  name: 'Executive & Client Deliverable',
  colors: {
    text: '1E293B',
    background: 'FFFFFF',
    primary: '1E3A8A',
    secondary: '64748B',
    border: 'E2E8F0',
    codeBackground: 'F8FAFC',
    codeText: '0F172A',
    blockquoteBorder: '1E3A8A',
    blockquoteText: '334155',
    tableHeaderBackground: 'F8FAFC',
    callouts: {
      note: { bg: 'F0F4FA', border: '1E3A8A', text: '172554' },
      tip: { bg: 'F0FDF4', border: '15803D', text: '166534' },
      important: { bg: 'F1F5F9', border: '334155', text: '0F172A' },
      warning: { bg: 'FFFBEB', border: 'B45309', text: '78350F' },
      caution: { bg: 'FEF2F2', border: 'B91C1C', text: '7F1D1D' },
    },
  },
  typography: {
    bodyFont: "'Söhne', 'Helvetica Neue', Arial, sans-serif",
    headingFont: "'Söhne', 'Helvetica Neue', Arial, sans-serif",
    codeFont: "'JetBrains Mono', Consolas, monospace",
    baseFontSizePt: 11,
    headingSizesPt: {
      1: 26,
      2: 18,
      3: 14,
      4: 12,
      5: 11,
      6: 10,
    },
  },
  spacing: {
    paragraphSpacingPt: 10,
    headingSpacingBeforePt: 24,
    headingSpacingAfterPt: 10,
    lineHeight: 1.7,
  },
};

export const DOCUMENT_PRESETS: Record<DocumentPresetId, DocumentPreset> = {
  'default': {
    id: 'default',
    name: 'Default Balanced',
    description: 'Clean modern standard styling for all technical documents.',
    badge: 'Standard',
    icon: 'format_paint',
    theme: DEFAULT_THEME,
    layoutRules: {
      tableStyle: 'bordered',
      calloutStyle: 'border-left',
      codeBlockContrast: 'normal',
      headingStyle: 'classic',
    },
  },
  'ai-prd': {
    id: 'ai-prd',
    name: 'Product Spec (PRD)',
    description: 'Modern clean typography, royal blue accents, boxed requirements, and alternating table fills.',
    badge: 'PRD Spec',
    icon: 'description',
    theme: AI_PRD_THEME,
    layoutRules: {
      tableStyle: 'striped',
      calloutStyle: 'boxed',
      codeBlockContrast: 'normal',
      headingStyle: 'pill',
    },
  },
  'tech-arch': {
    id: 'tech-arch',
    name: 'Technical Architecture',
    description: 'High-contrast engineering layout with monospace calibration, dark code fences, and full-bleed diagrams.',
    badge: 'Tech Spec',
    icon: 'terminal',
    theme: TECH_ARCH_THEME,
    layoutRules: {
      tableStyle: 'bordered',
      calloutStyle: 'border-left',
      codeBlockContrast: 'high-contrast',
      headingStyle: 'uppercase-muted',
    },
  },
  'research-report': {
    id: 'research-report',
    name: 'Research & Analysis Report',
    description: 'Academic publication layout with Newsreader serif body, centered quotes, and formal tables.',
    badge: 'Research Report',
    icon: 'menu_book',
    theme: RESEARCH_REPORT_THEME,
    layoutRules: {
      tableStyle: 'academic',
      calloutStyle: 'tinted',
      codeBlockContrast: 'subtle',
      headingStyle: 'classic',
    },
  },
  'executive-brief': {
    id: 'executive-brief',
    name: 'Executive Deliverable',
    description: 'Boardroom deliverable with deep navy accents, generous line heights, and minimalist tables.',
    badge: 'Executive Brief',
    icon: 'business_center',
    theme: EXECUTIVE_BRIEF_THEME,
    layoutRules: {
      tableStyle: 'minimal',
      calloutStyle: 'tinted',
      codeBlockContrast: 'subtle',
      headingStyle: 'accent-underline',
    },
  },
};

export function getPreset(id: DocumentPresetId): DocumentPreset {
  return DOCUMENT_PRESETS[id] || DOCUMENT_PRESETS.default;
}

export function applyPresetTheme(presetId: DocumentPresetId, baseFontSize?: number): DocumentTheme {
  const preset = getPreset(presetId);
  const theme = structuredClone(preset.theme);
  if (baseFontSize) {
    theme.typography.baseFontSizePt = baseFontSize;
  }
  return theme;
}
