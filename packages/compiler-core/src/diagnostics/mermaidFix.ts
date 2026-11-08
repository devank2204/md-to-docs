/** Predictable flowchart repairs only; callers must validate before applying. */
export function proposeMermaidRepair(raw: string): {
  code: string;
  changes: string[];
} {
  let code = raw;
  const changes: string[] = [];
  if (code.startsWith('\uFEFF')) {
    code = code.slice(1);
    changes.push('Remove an invisible leading byte-order mark.');
  }
  // Do not reinterpret sequence messages, ER cardinality, class syntax or valid edges.
  if (
    !/^\s*(?:%%[^\n]*\n\s*)*(?:graph|flowchart)\s+(?:TB|TD|BT|RL|LR)\b/.test(
      code,
    )
  )
    return { code, changes };
  const outsideStrings = (
    line: string,
    transform: (part: string) => string,
  ) => {
    let comment = false;
    return line
      .split(/("(?:[^"\\]|\\.)*")/)
      .map((part, index) => {
        if (comment || index % 2) return part;
        const start = part.indexOf('%%');
        if (start < 0) return transform(part);
        comment = true;
        return transform(part.slice(0, start)) + part.slice(start);
      })
      .join('');
  };
  const beforeQuotes = code;
  code = code
    .split('\n')
    .map((line) =>
      outsideStrings(line, (part) =>
        part.replace(/([\[{(])“([^”\n]*)”(?=[\]})])/g, '$1"$2"'),
      ),
    )
    .join('\n');
  if (code !== beforeQuotes)
    changes.push(
      'Replace smart quote delimiters with Mermaid string delimiters.',
    );
  const beforeLabels = code;
  const quote = (open: string, close: string, excluded: string) => {
    const expression = new RegExp(
      '(\\b[a-zA-Z0-9_-]+)\\' +
        open +
        '([^"\\n]+?)\\' +
        close +
        '(?=\\s*(?:-->|---|==>|-\\.->|\\||;|\\n|$))',
      'g',
    );
    code = code
      .split('\n')
      .map((line) => {
        if (line.trimStart().startsWith('%%')) return line;
        // Protect already quoted strings from matching fake nodes inside labels.
        return line
          .split(/("(?:[^"\\]|\\.)*")/)
          .map((part, index) =>
            index % 2
              ? part
              : part.replace(expression, (match, id, text) => {
                  if (
                    excluded.includes(text[0]) ||
                    (part.indexOf('%%') >= 0 &&
                      part.indexOf(match) > part.indexOf('%%'))
                  )
                    return match;
                  return /[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text) ||
                    text === 'end'
                    ? `${id}${open}"${text.replaceAll('"', '#quot;')}"${close}`
                    : match;
                }),
          )
          .join('');
      })
      .join('\n');
  };
  quote('[', ']', '([/\\');
  quote('{', '}', '{');
  quote('(', ')', '([');
  if (code !== beforeLabels)
    changes.push(
      'Quote labels with parser-sensitive punctuation or the reserved word end.',
    );
  const beforeArrows = code;
  code = code
    .split('\n')
    .map((line) =>
      line.trimStart().startsWith('%%')
        ? line
        : line
            .split(/("(?:[^"\\]|\\.)*")/)
            .map((part, index) =>
              index % 2
                ? part
                : outsideStrings(part, (value) =>
                    value
                      .replace(/--[ \t]+>/g, '-->')
                      .replace(
                        /--[ \t]+\|[ \t]*([^|]+)[ \t]*\|[ \t]*>/g,
                        '-->|$1|',
                      ),
                  ),
            )
            .join(''),
    )
    .join('\n');
  if (code !== beforeArrows)
    changes.push(
      'Join a split arrow token without changing edge types or lengths.',
    );
  // Count statements, not words inside comments, labels or node IDs.
  let depth = 0;
  for (const line of code.split('\n')) {
    const statements = line
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/%%.*$/, '')
      .split(';');
    for (const statement of statements) {
      if (/^\s*subgraph\s+/.test(statement)) depth++;
      else if (/^\s*end\s*$/.test(statement)) depth = Math.max(0, depth - 1);
    }
  }
  if (depth) {
    code += '\n' + Array(depth).fill('end').join('\n');
    changes.push(
      `Close ${depth} unfinished subgraph${depth === 1 ? '' : 's'}.`,
    );
  }
  return { code, changes };
}

export function autoFixMermaidCode(raw: string): string {
  return proposeMermaidRepair(raw).code;
}
