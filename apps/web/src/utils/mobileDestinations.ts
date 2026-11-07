import type { ExportTarget } from './exportHelpers';

export const mobileDestinations: {
  value: ExportTarget;
  label: string;
  detail: string;
  action: string;
}[] = [
  {
    value: 'word',
    label: 'Word document',
    detail: 'Save or share a .docx file',
    action: 'Prepare Word document',
  },
  {
    value: 'google-docs',
    label: 'Google Docs',
    detail: 'Copy formatting, then paste in Docs',
    action: 'Prepare for Google Docs',
  },
  {
    value: 'pdf',
    label: 'PDF',
    detail: 'Use your browser’s print and save options',
    action: 'Print / Save as PDF',
  },
  {
    value: 'html',
    label: 'HTML',
    detail: 'Download a standalone web document',
    action: 'Prepare HTML file',
  },
  {
    value: 'clipboard',
    label: 'Formatted text',
    detail: 'Copy into another app',
    action: 'Prepare formatted text',
  },
];

export type MobileSheet =
  'documents' | 'destination' | 'options' | 'notes' | 'import' | 'history';
