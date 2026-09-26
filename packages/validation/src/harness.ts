import { load } from 'cheerio';
import type { CheerioAPI, Cheerio, AnyNode } from 'cheerio';

export class HtmlTestHarness {
  private $: CheerioAPI;

  constructor(html: string) {
    this.$ = load(html);
  }

  /**
   * Select elements using standard CSS selectors
   */
  find(selector: string): Cheerio<AnyNode> {
    return this.$(selector);
  }

  /**
   * Helper to parse inline styles into a JS object
   */
  getInlineStyles(selector: string): Record<string, string> {
    const styleString = this.$(selector).attr('style') || '';
    const styles: Record<string, string> = {};
    
    styleString.split(';').forEach(rule => {
      if (!rule.trim()) return;
      const [key, value] = rule.split(':');
      if (key && value) {
        styles[key.trim()] = value.trim();
      }
    });
    
    return styles;
  }

  /**
   * Verify an element has a specific inline style key/value
   */
  hasStyle(selector: string, key: string, value: string): boolean {
    const styles = this.getInlineStyles(selector);
    return styles[key] === value;
  }

  /**
   * Verify the number of elements matching a selector
   */
  count(selector: string): number {
    return this.$(selector).length;
  }

  /**
   * Extract text from an element
   */
  text(selector: string): string {
    return this.$(selector).text();
  }
}
