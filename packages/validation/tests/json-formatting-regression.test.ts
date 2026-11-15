import {describe,it,expect} from 'vitest';
import {formatJsonCode,stripJsonComments} from '../../renderers/src/codeFormatter';
describe('JSON formatting retains string content',()=>{
 it('retains URLs, comment-like strings and escaped quotes',()=>{const value={url:'https://example.com/a//b',text:'/* keep */',quoted:'a "quoted" // value'};const result=formatJsonCode(JSON.stringify(value));expect(result.isValid).toBe(true);expect(result.hasComments).toBe(false);expect(JSON.parse(result.formatted)).toEqual(value)});
 it('strips real comments outside strings',()=>{const result=formatJsonCode('{\n// note\n"url":"https://example.com",/* note */"a":1}');expect(result.isValid).toBe(true);expect(result.hasComments).toBe(true);expect(JSON.parse(result.formatted)).toEqual({url:'https://example.com',a:1})});
 it('leaves invalid JSON visible instead of losing content',()=>{const source='{"a": invalid}';expect(formatJsonCode(source).formatted).toBe(source);expect(formatJsonCode(source).isValid).toBe(false)});
 it('keeps comment markers inside a quoted string',()=>expect(stripJsonComments('"https://example.com/*value*/"')).toBe('"https://example.com/*value*/"'));
});
it('does not join invalid tokens across comments',()=>expect(formatJsonCode('{"a":1/* x */2}').isValid).toBe(false));
it('rejects unterminated comments without changing the displayed source',()=>{const source='{"a":1}/* unfinished';expect(formatJsonCode(source).isValid).toBe(false);expect(formatJsonCode(source).formatted).toBe(source)});
