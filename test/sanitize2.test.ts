import { describe, it, expect } from 'vitest';
import { sanitizeHTMLSimple, sanitizeHTMLTextOnly } from '../src/index';

describe('sanitizeHTMLSimple', () => {
  it('removes script tags', () => {
    const input = '<div><script>alert(1)</script>Hello</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div>Hello</div>');
  });

  it('removes other dangerous tags', () => {
    const input = '<div><iframe></iframe><object></object><embed></embed></div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div></div>');
  });

  it('removes inline event handlers', () => {
    const input = '<div onclick="alert(1)" onmouseover="x()">Click me</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div>Click me</div>');
  });

  it('removes javascript: URIs in href', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<a>Link</a>');
  });

  it('removes javascript: URIs in src', () => {
    const input = '<img src="javascript:alert(1)" />';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<img>');
  });

  it('preserves safe attributes', () => {
    const input = '<div class="foo" id="bar" data-test="1">Content</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div class="foo" id="bar" data-test="1">Content</div>');
  });

  it('preserves safe hrefs', () => {
    const input = '<a href="https://example.com">Link</a>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<a href="https://example.com">Link</a>');
  });

  it('handles mixed case attributes', () => {
    const input = '<div onClick="alert(1)">Test</div>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<div>Test</div>');
  });

  it('handles whitespace in protocols', () => {
    const input = '<a href="  javascript:alert(1)">Link</a>';
    const output = sanitizeHTMLSimple(input);
    expect(output).toBe('<a>Link</a>');
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
});
