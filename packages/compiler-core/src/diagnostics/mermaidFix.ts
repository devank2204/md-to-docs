/**
 * Heuristic auto-repair for common Mermaid syntax errors during typing.
 * Quotes node labels containing special characters, fixes curly quotes,
 * auto-closes unclosed subgraphs, and normalizes arrow tokens.
 */
export function autoFixMermaidCode(raw: string): string {
  let fixed = raw;

  // 1. Replace typographic / curly quotes with standard quotes
  fixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // 2. Fix square bracket node labels: A[Calculate (Total)] -> A["Calculate (Total)"]
  fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\[([^"\n]+?)\](?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
    if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
      return `${id}["${text}"]`;
    }
    return match;
  });

  // 3. Fix curly brace node labels: B{Is Valid? [Yes/No]} -> B{"Is Valid? [Yes/No]"}
  fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\{([^"\n]+?)\}(?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
    if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
      return `${id}{"${text}"}`;
    }
    return match;
  });

  // 4. Fix round bracket node labels: C(Start (v1)) -> C("Start (v1)")
  fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\(([^"\n]+?)\)(?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
    if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
      return `${id}("${text}")`;
    }
    return match;
  });

  // 5. Ensure missing 'end' statements for subgraphs
  const subgraphs = (fixed.match(/\bsubgraph\b/g) || []).length;
  const ends = (fixed.match(/\bend\b/g) || []).length;
  if (subgraphs > ends) {
    fixed = fixed + '\n' + Array(subgraphs - ends).fill('end').join('\n');
  }

  // 6. Fix malformed arrow tokens (e.g., -- > or --->)
  fixed = fixed.replace(/--\s+>/g, '-->').replace(/--\s+\|\s*([^|]+)\s*\|\s*>/g, '-->|$1|');

  return fixed;
}
