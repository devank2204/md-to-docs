import { describe, expect, it } from 'vitest';
import { sourceBlock } from '../../../apps/web/src/utils/sourceReview';

describe('source review ranges', () => {
  it('selects the actual nested code block instead of its entire surrounding list', () => {
    const source = '- A surrounding list\n\n  ```js\n  const value = 1;\n  ```\n\n  More content';
    const block = sourceBlock(source, 4);
    expect(block?.start).toBe(source.indexOf('```js'));
    expect(block?.text).toBe('```js\n  const value = 1;\n  ```');
    expect(block?.text).not.toContain('surrounding list');
  });
  it('uses offsets when equal paragraphs repeat and refuses nonexistent positions', () => {
    const source = 'Same paragraph\n\nSame paragraph';
    expect(sourceBlock(source, 3)?.start).toBe(source.lastIndexOf('Same paragraph'));
    expect(sourceBlock(source, 2)).toBeNull();
    expect(sourceBlock(source, 99)).toBeNull();
    expect(sourceBlock(source, 0)).toBeNull();
  });
});
