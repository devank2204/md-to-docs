export interface ThemeColors {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  border: string;
  codeBackground: string;
  codeText: string;
  blockquoteBorder: string;
  blockquoteText: string;
  tableHeaderBackground: string;

  callouts: {
    note: { bg: string; border: string; text: string };
    tip: { bg: string; border: string; text: string };
    important: { bg: string; border: string; text: string };
    warning: { bg: string; border: string; text: string };
    caution: { bg: string; border: string; text: string };
  };
}

export interface ThemeTypography {
  bodyFont: string;
  headingFont: string;
  codeFont: string;

  baseFontSizePt: number;
  
  headingSizesPt: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
}

export interface ThemeSpacing {
  paragraphSpacingPt: number;
  headingSpacingBeforePt: number;
  headingSpacingAfterPt: number;
  lineHeight: number;
}

export interface DocumentTheme {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}
