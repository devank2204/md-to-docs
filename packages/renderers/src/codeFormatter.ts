export interface JsonFormatResult {
  formatted: string;
  isValid: boolean;
  hasComments: boolean;
  cleanJson: string;
  error?: string;
}

/**
 * Strips single-line and multi-line comments from JSON-like text.
 */
export function stripJsonComments(input: string): string {
  return input
    .replace(/\/\/[^\r\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

/**
 * Validates, formats, and handles comments for JSON code snippets.
 */
export function formatJsonCode(input: string, indent = 2): JsonFormatResult {
  const trimmed = input.trim();
  const hasComments = /\/\/|\/\*/.test(trimmed);
  const cleanJson = stripJsonComments(trimmed);

  try {
    const parsed = JSON.parse(cleanJson);
    const formatted = JSON.stringify(parsed, null, indent);
    return {
      formatted,
      isValid: true,
      hasComments,
      cleanJson: JSON.stringify(parsed, null, indent),
    };
  } catch (err: any) {
    return {
      formatted: input,
      isValid: false,
      hasComments,
      cleanJson,
      error: err?.message || 'Invalid JSON syntax',
    };
  }
}

/**
 * Normalizes tab indentation and trailing whitespace across code snippets.
 */
export function beautifyCode(input: string, indentSize = 2): string {
  const spaces = ' '.repeat(indentSize);
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, spaces).trimEnd())
    .join('\n');
}
