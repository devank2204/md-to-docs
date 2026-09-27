import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import type { Root } from 'mdast';


export function parseMarkdown(source: string): Root {
  return remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .parse(source) as Root;
}
