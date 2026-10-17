import { describe, it, expect } from 'vitest';
import {
  formatJsonCode,
  stripJsonComments,
  beautifyCode,
} from '@mdtodocs/renderers';

describe('JSON & Code Formatter Suite', () => {
  it('strips single-line and multi-line comments from JSON', () => {
    const raw = `{
      // Endpoint configuration
      "endpoint": "/api/v1/render",
      /* Timeout in milliseconds */
      "timeout": 5000
    }`;

    const stripped = stripJsonComments(raw);
    expect(stripped).not.toContain('// Endpoint configuration');
    expect(stripped).not.toContain('/* Timeout in milliseconds */');
    expect(stripped).toContain('"endpoint": "/api/v1/render"');
  });

  it('validates and auto-indents JSON code', () => {
    const unformatted = '{"name":"mdtodocs","version":1,"tools":["docx","pdf","mermaid"]}';
    const result = formatJsonCode(unformatted, 2);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe(
      JSON.stringify(JSON.parse(unformatted), null, 2)
    );
    expect(result.error).toBeUndefined();
  });

  it('detects comments and provides cleanJson for API calls', () => {
    const commented = `{
      // Development server
      "host": "localhost",
      "port": 5173
    }`;
    const result = formatJsonCode(commented, 2);

    expect(result.isValid).toBe(true);
    expect(result.hasComments).toBe(true);
    expect(result.cleanJson).not.toContain('// Development server');
    expect(JSON.parse(result.cleanJson)).toEqual({
      host: 'localhost',
      port: 5173,
    });
  });

  it('handles invalid JSON gracefully with informative error', () => {
    const invalid = '{"broken": True, missingQuotes: 123,}';
    const result = formatJsonCode(invalid);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.formatted).toBe(invalid);
  });

  it('beautifies code by normalizing tabs and trimming lines', () => {
    const messy = 'function test() {\n\tconst a = 1;  \n\treturn a;\n}  ';
    const clean = beautifyCode(messy, 2);

    expect(clean).toBe('function test() {\n  const a = 1;\n  return a;\n}');
  });
});
