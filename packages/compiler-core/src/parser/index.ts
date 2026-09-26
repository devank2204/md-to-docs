import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Root } from 'mdast';
import { normalizeMdast } from '../normalizer';
import type { FolioDocument } from '../ir/types';

export function parseMarkdown(source: string): FolioDocument {
  const ast = remark()
    .use(remarkGfm)
    .use(remarkMath)
    .parse(source) as Root;
    
  return normalizeMdast(ast);
}
