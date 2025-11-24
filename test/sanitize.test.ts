import { describe, it, expect } from 'vitest';
import { sanitizeHTMLSimple, sanitizeHTMLTextOnly } from '../src/index';

describe('sanitizeHTMLSimple', () => {
  it('removes script tags', () => {
    const input = '<div><script>alert(1)</script>Hello</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div>Hello</div>');
  });

  it('removes multiple script tags', () => {
    const input = '<script>a</script><div><script>b</script></div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div></div>');
  });

  it('preserves other tags', () => {
    const input = '<div><b>Bold</b></div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div><b>Bold</b></div>');
  });

  it('preserves attributes', () => {
    const input = '<div class="foo" id="bar">Content</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div class="foo" id="bar">Content</div>');
  });

  // Documenting current behavior (limitations)
  it('does NOT remove inline handlers (security limitation)', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div onclick="alert(1)">Click me</div>');
  });
});

describe('sanitizeHTMLTextOnly', () => {
  it('extracts text from simple HTML', () => {
    const input = '<div>Hello</div>';
    const output = sanitizeHTMLTextOnly(input);
    expect(output).toBe('Hello');
  });

  it('extracts text from nested HTML', () => {
    const input = '<div><h1>Title</h1><p>Content</p></div>';
    const output = sanitizeHTMLTextOnly(input);
    expect(output).toBe('TitleContent');
  });

  it('decodes entities', () => {
    const input = 'Fish &amp; Chips';
    const output = sanitizeHTMLTextOnly(input);
    expect(output).toBe('Fish & Chips');
  });

  it('handles empty input', () => {
    const input = '';
    const output = sanitizeHTMLTextOnly(input);
    expect(output).toBe('');
  });

  it('handles no text content', () => {
    const input = '<div/>';
    const output = sanitizeHTMLTextOnly(input);
    expect(output).toBe('');
  });
});
