import JSZip from 'jszip';

export interface ReviewComment {
  id: string;
  author?: string;
  date?: string;
  targetText: string;
  commentText: string;
  replacementText?: string;
  status?: 'pending' | 'applied' | 'rejected';
  lineNumber?: number;
}

export interface ReconciliationPatch {
  id: string;
  targetText: string;
  replacementText: string;
  author?: string;
  comment?: string;
  date?: string;
  status: 'matched' | 'unmatched' | 'already_applied';
  line?: number;
  matchIndex?: number;
  selected: boolean;
}

export interface ReconciliationReport {
  originalMarkdown: string;
  updatedMarkdown: string;
  patches: ReconciliationPatch[];
  matchedCount: number;
  unmatchedCount: number;
  appliedCount: number;
}

/**
 * Decode common XML entities into plaintext characters
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Extract clean text content from <w:t> tags within an XML string snippet
 */
function extractTextFromXml(xmlSnippet: string): string {
  const matches = xmlSnippet.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
  return decodeXmlEntities(
    matches
      .map((tag) => tag.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
      .join('')
  );
}

/**
 * Heuristically parses replacement text from reviewer comment text.
 * e.g. "Replace with: 250ms p99 SLA" -> "250ms p99 SLA"
 *      "Change to PostgreSQL 16" -> "PostgreSQL 16"
 *      "Suggest: 'foo bar'" -> "foo bar"
 */
export function inferReplacementFromComment(commentText: string): string {
  const clean = commentText.trim();
  const prefixes = [
    /^(?:replace\s+with|replace\s+by|change\s+to|update\s+to|suggest(?:ion)?:\s*|fix:\s*|use:\s*)\s*[:"']?([^"']+)["']?$/i,
    /^(?:please\s+change\s+to|please\s+update\s+to)\s*[:"']?([^"']+)["']?$/i,
    /^(?:->|=>)\s*(.+)$/,
  ];

  for (const regex of prefixes) {
    const match = clean.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If reviewer put the proposed replacement in quotes: e.g. Did you mean "250ms"?
  const quotedMatch = clean.match(/"([^"]{2,})"/);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  return '';
}

/**
 * Parse comments and track changes from a Word (.docx) binary package
 */
export async function extractDocxComments(
  docxData: ArrayBuffer | Uint8Array
): Promise<ReconciliationPatch[]> {
  const zip = await JSZip.loadAsync(docxData);
  const patches: ReconciliationPatch[] = [];

  // 1. Parse comments from word/comments.xml
  const commentsXmlFile = zip.file('word/comments.xml');
  const commentMap = new Map<
    string,
    { author: string; date?: string; text: string }
  >();

  if (commentsXmlFile) {
    const commentsXml = await commentsXmlFile.async('text');
    const commentRegex = /<w:comment\s+([^>]*?)>([\s\S]*?)<\/w:comment>/g;
    let commentMatch: RegExpExecArray | null;

    while ((commentMatch = commentRegex.exec(commentsXml)) !== null) {
      const attrs = commentMatch[1];
      const body = commentMatch[2];

      const idMatch = attrs.match(/w:id="([^"]+)"/);
      if (!idMatch) continue;
      const id = idMatch[1];

      const authorMatch = attrs.match(/w:author="([^"]*)"/);
      const author = authorMatch ? decodeXmlEntities(authorMatch[1]) : 'Reviewer';

      const dateMatch = attrs.match(/w:date="([^"]*)"/);
      const date = dateMatch ? dateMatch[1] : undefined;

      const text = extractTextFromXml(body).trim();
      commentMap.set(id, { author, date, text });
    }
  }

  // 2. Parse word/document.xml to map comment anchors (<w:commentRangeStart>) to target text
  const docXmlFile = zip.file('word/document.xml');
  if (docXmlFile) {
    const docXml = await docXmlFile.async('text');

    // Extract comment ranges: <w:commentRangeStart w:id="X"/> ... <w:commentRangeEnd w:id="X"/>
    commentMap.forEach((commentData, commentId) => {
      const rangeRegex = new RegExp(
        `<w:commentRangeStart\\s+[^>]*?w:id="${commentId}"[^>]*?>([\\s\\S]*?)<w:commentRangeEnd\\s+[^>]*?w:id="${commentId}"[^>]*?>`,
        'g'
      );
      const match = rangeRegex.exec(docXml);

      if (match && match[1]) {
        const targetText = extractTextFromXml(match[1]).trim();
        if (targetText) {
          const replacementText = inferReplacementFromComment(commentData.text);
          patches.push({
            id: `docx-comment-${commentId}`,
            targetText,
            replacementText: replacementText || '',
            author: commentData.author,
            comment: commentData.text,
            date: commentData.date,
            status: 'matched',
            selected: true,
          });
        }
      }
    });

    // 3. Extract Word Track Changes (w:del + w:ins)
    // <w:del w:author="Alice" ...><w:r><w:delText>old</w:delText></w:r></w:del>
    // <w:ins w:author="Alice" ...><w:r><w:t>new</w:t></w:r></w:ins>
    const trackChangesRegex =
      /<w:del\s+([^>]*?)>([\s\S]*?)<\/w:del>\s*<w:ins\s+([^>]*?)>([\s\S]*?)<\/w:ins>/g;
    let trackMatch: RegExpExecArray | null;
    let tcIndex = 1;

    while ((trackMatch = trackChangesRegex.exec(docXml)) !== null) {
      const delAttrs = trackMatch[1];
      const delBody = trackMatch[2];
      const insBody = trackMatch[4];

      const authorMatch = delAttrs.match(/w:author="([^"]*)"/);
      const author = authorMatch ? decodeXmlEntities(authorMatch[1]) : 'Word Track Changes';

      const oldMatches = delBody.match(/<w:delText[^>]*>(.*?)<\/w:delText>/g) || [];
      const targetText = decodeXmlEntities(
        oldMatches
          .map((m) => m.replace(/<w:delText[^>]*>/, '').replace(/<\/w:delText>/, ''))
          .join('')
      ).trim();

      const replacementText = extractTextFromXml(insBody).trim();

      if (targetText) {
        patches.push({
          id: `docx-track-change-${tcIndex++}`,
          targetText,
          replacementText,
          author,
          comment: 'Track Changes Revision',
          status: 'matched',
          selected: true,
        });
      }
    }
  }

  return patches;
}

/**
 * Parses review notes, feedback text, or structured JSON into reconciliation patches.
 * Supports:
 * 1. JSON array: `[{ targetText: string, replacementText: string, comment?: string }]`
 * 2. SuggestEditModal format:
 *    **Referenced Passage:**
 *    > target text
 *    **Proposed Improvement / Feedback:**
 *    replacement text
 * 3. Key-Value format:
 *    Target: target text
 *    Replacement: replacement text
 *    Comment: feedback
 * 4. Markdown quote format:
 *    > target text
 *    replacement text
 */
export function parseReviewNotesText(text: string): ReconciliationPatch[] {
  const clean = text.trim();
  if (!clean) return [];

  // 1. Try parsing JSON
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item.targetText === 'string')
          .map((item, idx) => ({
            id: `json-patch-${idx + 1}`,
            targetText: item.targetText.trim(),
            replacementText: (item.replacementText || '').trim(),
            author: item.author || 'Reviewer',
            comment: item.comment || undefined,
            date: item.date || undefined,
            status: 'matched',
            selected: true,
          }));
      }
    } catch {
      // Fall through to text heuristics
    }
  }

  const patches: ReconciliationPatch[] = [];

  // 2. Parse SuggestEditModal format:
  // **Referenced Passage:**\n> passage\n\n**Proposed Improvement / Feedback:**\nproposal
  const suggestModalRegex =
    /(?:\*\*Referenced Passage:\*\*|Referenced Passage:)\s*\n+>\s*([^\n]+(?:\n>[^\n]+)*)\s*\n+(?:\*\*Proposed Improvement \/ Feedback:\*\*|Proposed Improvement \/ Feedback:|Proposed Edit:)\s*\n+([^\n]+(?:\n[^\n]+)*?)(?=\n+---|\n+(?:\*\*Referenced Passage|\Z))/gi;

  let modalMatch: RegExpExecArray | null;
  let modalIndex = 1;

  while ((modalMatch = suggestModalRegex.exec(clean)) !== null) {
    const rawTarget = modalMatch[1].replace(/^>\s*/gm, '').trim();
    const rawProposal = modalMatch[2].replace(/\n+---[\s\S]*$/, '').trim();

    if (rawTarget) {
      const inferredReplacement = inferReplacementFromComment(rawProposal) || rawProposal;
      patches.push({
        id: `review-modal-${modalIndex++}`,
        targetText: rawTarget,
        replacementText: inferredReplacement,
        author: 'Stakeholder Review',
        comment: rawProposal !== inferredReplacement ? rawProposal : undefined,
        status: 'matched',
        selected: true,
      });
    }
  }

  if (patches.length > 0) {
    return patches;
  }

  // 3. Parse Key-Value format:
  // Target: ...\nReplacement: ...\nComment: ...
  const kvBlocks = clean.split(/\n\s*---\s*\n|\n\s*\n\s*(?=Target:|Original:)/i);
  let kvIndex = 1;

  for (const block of kvBlocks) {
    const targetMatch = block.match(/(?:Target|Original|Find):\s*([^\n]+)/i);
    const replMatch = block.match(/(?:Replacement|Proposed|Change To|Replace With):\s*([^\n]+)/i);
    const commentMatch = block.match(/(?:Comment|Note|Reason|Author):\s*([^\n]+)/i);

    if (targetMatch && targetMatch[1].trim()) {
      patches.push({
        id: `kv-patch-${kvIndex++}`,
        targetText: targetMatch[1].trim(),
        replacementText: replMatch ? replMatch[1].trim() : '',
        comment: commentMatch ? commentMatch[1].trim() : undefined,
        author: 'Reviewer',
        status: 'matched',
        selected: true,
      });
    }
  }

  if (patches.length > 0) {
    return patches;
  }

  // 4. Parse simple blockquote followed by replacement:
  // > target text
  // replacement text
  const quoteLines = clean.split('\n');
  let currentTarget: string[] = [];
  let currentReplacement: string[] = [];
  let inQuote = false;
  let quoteIndex = 1;

  const flushQuotePatch = () => {
    if (currentTarget.length > 0 && currentReplacement.length > 0) {
      const target = currentTarget.join('\n').trim();
      const repl = currentReplacement.join('\n').trim();
      if (target && repl) {
        patches.push({
          id: `quote-patch-${quoteIndex++}`,
          targetText: target,
          replacementText: repl,
          author: 'Reviewer',
          status: 'matched',
          selected: true,
        });
      }
    }
    currentTarget = [];
    currentReplacement = [];
  };

  for (const line of quoteLines) {
    if (line.startsWith('>')) {
      if (!inQuote && currentReplacement.length > 0) {
        flushQuotePatch();
      }
      inQuote = true;
      currentTarget.push(line.replace(/^>\s*/, ''));
    } else if (inQuote && line.trim()) {
      inQuote = false;
      currentReplacement.push(line);
    } else if (!inQuote && line.trim() && currentTarget.length > 0) {
      currentReplacement.push(line);
    } else if (!line.trim() && currentReplacement.length > 0) {
      flushQuotePatch();
    }
  }
  flushQuotePatch();

  return patches;
}

/**
 * Reconciles and applies patches to the target Markdown document.
 * Detects match locations, line numbers, and computes updated Markdown.
 */
export function reconcileMarkdown(
  originalMarkdown: string,
  patches: ReconciliationPatch[]
): ReconciliationReport {
  const evaluatedPatches: ReconciliationPatch[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let appliedCount = 0;

  // 1. Evaluate match status and line numbers
  for (const patch of patches) {
    const target = patch.targetText.trim();
    if (!target) {
      evaluatedPatches.push({
        ...patch,
        status: 'unmatched',
      });
      unmatchedCount++;
      continue;
    }

    const matchIdx = originalMarkdown.indexOf(target);
    if (matchIdx !== -1) {
      // Find line number
      const preText = originalMarkdown.slice(0, matchIdx);
      const lineNumber = preText.split('\n').length;

      evaluatedPatches.push({
        ...patch,
        status: 'matched',
        line: lineNumber,
        matchIndex: matchIdx,
      });
      matchedCount++;
    } else if (
      patch.replacementText &&
      originalMarkdown.includes(patch.replacementText.trim())
    ) {
      evaluatedPatches.push({
        ...patch,
        status: 'already_applied',
      });
      appliedCount++;
    } else {
      evaluatedPatches.push({
        ...patch,
        status: 'unmatched',
      });
      unmatchedCount++;
    }
  }

  // 2. Apply selected and matched patches
  // To avoid index displacement issues when replacing multiple occurrences,
  // sort matched patches by their matchIndex in descending order (from bottom to top)
  const patchesToApply = evaluatedPatches
    .filter(
      (p) =>
        p.selected &&
        p.status === 'matched' &&
        typeof p.matchIndex === 'number' &&
        p.matchIndex !== -1
    )
    .sort((a, b) => (b.matchIndex || 0) - (a.matchIndex || 0));

  let updatedMarkdown = originalMarkdown;

  for (const patch of patchesToApply) {
    const target = patch.targetText.trim();
    const replacement = patch.replacementText || '';

    // Verify target still exists before replacing
    if (updatedMarkdown.includes(target)) {
      updatedMarkdown = updatedMarkdown.replace(target, replacement);
      appliedCount++;
    }
  }

  return {
    originalMarkdown,
    updatedMarkdown,
    patches: evaluatedPatches,
    matchedCount,
    unmatchedCount,
    appliedCount,
  };
}
