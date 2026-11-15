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
  let result = "",
    quoted = false,
    escaped = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i],
      next = input[i + 1];
    if (quoted) {
      result += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') {
      quoted = true;
      result += char;
      continue;
    }
    if (char === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n" && input[i] !== "\r") i++;
      if (i < input.length) result += input[i];
      continue;
    }
    if (char === "/" && next === "*") {
      result += " ";
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        if (input[i] === "\n") result += "\n";
        i++;
      }
      if (i >= input.length) result += "/*";
      i++;
      continue;
    }
    result += char;
  }
  return result.trim();
}

/**
 * Validates, formats, and handles comments for JSON code snippets.
 */
export function formatJsonCode(input: string, indent = 2): JsonFormatResult {
  const trimmed = input.trim();
  const cleanJson = stripJsonComments(trimmed);
  const hasComments = cleanJson !== trimmed;

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
      error: err?.message || "Invalid JSON syntax",
    };
  }
}

/**
 * Normalizes tab indentation and trailing whitespace across code snippets.
 */
export function beautifyCode(input: string, indentSize = 2): string {
  const spaces = " ".repeat(indentSize);
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, spaces).trimEnd())
    .join("\n");
}
