import { test, expect } from 'vitest';
import mermaid from 'mermaid';

test('mermaid render', async () => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  const source = `graph TD\nA-->B`;
  
  try {
    const { svg } = await mermaid.render('test-1', source);
    console.log('SVG:', svg);
    expect(svg).toContain('<svg');
  } catch (err: any) {
    console.error('Mermaid render error:', err);
    throw err;
  }
});
