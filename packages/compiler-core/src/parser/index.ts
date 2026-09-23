import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import type { Root } from 'mdast';
import { normalizeMdast } from '../normalizer';
import type { FolioDocument } from '../ir/types';

export function parseMarkdown(source: string): FolioDocument {
  const ast = remark()
    .use(remarkGfm)
    .parse(source) as Root;
    
  return normalizeMdast(ast);
}
