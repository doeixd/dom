import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitTransition, el } from '../src/index';

describe('waitTransition safety timeout fix', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    testElement.remove();
  });

  it('should resolve immediately when no transition is active', async () => {
    const start = Date.now();
    await waitTransition(testElement);
    const duration = Date.now() - start;

    // Should resolve within a few ms (requestAnimationFrame + immediate callback)
    expect(duration).toBeLessThan(100);
  });

  it('should resolve with safety timeout when element has transition duration', async () => {
    // Set a 100ms transition
    testElement.style.transition = 'opacity 0.1s';
    testElement.style.opacity = '0';

    const start = Date.now();

    // Trigger transition
    requestAnimationFrame(() => {
      testElement.style.opacity = '1';
    });

    await waitTransition(testElement);
    const duration = Date.now() - start;

    // Should resolve around 100ms + 50ms buffer = 150ms
    // Allow some variance for timing
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(250);
  });

  it('should resolve with safety timeout when element is detached', async () => {
    // Set a 100ms transition
    testElement.style.transition = 'opacity 0.1s';
    testElement.style.opacity = '0';

    const start = Date.now();

    // Trigger transition then immediately detach
    requestAnimationFrame(() => {
      testElement.style.opacity = '1';
      testElement.remove(); // Detach from DOM
    });

    const result = await waitTransition(testElement);
    const duration = Date.now() - start;

    // Should still resolve via timeout even though transitionend won't fire
    expect(result).toBe(testElement);
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(250);
  });

  it('should resolve immediately for null element', async () => {
    const result = await waitTransition(null);
    expect(result).toBe(null);
  });

  it('should not call onEnd multiple times', async () => {
    const spy = vi.fn();
    testElement.style.transition = 'opacity 0.05s';

    const promise = waitTransition(testElement);
    promise.then(spy);

    await promise;
    await new Promise(resolve => setTimeout(resolve, 100));

    // onEnd should only be called once
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('el function overloaded signature', () => {
  it('should support Hyperscript-style syntax', () => {
    const button = el('button', { class: { primary: true } }, ['Click me']);

    expect(button.tagName).toBe('BUTTON');
    expect(button.classList.contains('primary')).toBe(true);
    expect(button.textContent).toBe('Click me');
  });

  it('should support curried syntax (backward compatibility)', () => {
    const button = el('button')({ class: { primary: true } })(['Click me']);

    expect(button.tagName).toBe('BUTTON');
    expect(button.classList.contains('primary')).toBe(true);
    expect(button.textContent).toBe('Click me');
  });

  it('should support nested elements with Hyperscript syntax', () => {
    const card = el('div', { class: { card: true } }, [
      el('h2', {}, ['Title']),
      el('p', {}, ['Description'])
    ]);

    expect(card.tagName).toBe('DIV');
    expect(card.classList.contains('card')).toBe(true);
    expect(card.children.length).toBe(2);
    expect(card.children[0].tagName).toBe('H2');
    expect(card.children[0].textContent).toBe('Title');
    expect(card.children[1].tagName).toBe('P');
    expect(card.children[1].textContent).toBe('Description');
  });

  it('should support nested elements with curried syntax', () => {
    const card = el('div')({ class: { card: true } })([
      el('h2')({})(['Title']),
      el('p')({})(['Description'])
    ]);

    expect(card.tagName).toBe('DIV');
    expect(card.classList.contains('card')).toBe(true);
    expect(card.children.length).toBe(2);
    expect(card.children[0].tagName).toBe('H2');
    expect(card.children[0].textContent).toBe('Title');
    expect(card.children[1].tagName).toBe('P');
    expect(card.children[1].textContent).toBe('Description');
  });

  it('should infer correct types for Hyperscript syntax', () => {
    const input = el('input', { value: 'test' }, []);
    const anchor = el('a', { attr: { href: '/home' } }, []);

    // TypeScript should infer these as HTMLInputElement and HTMLAnchorElement
    expect(input instanceof HTMLInputElement).toBe(true);
    expect(anchor instanceof HTMLAnchorElement).toBe(true);
  });

  it('should support partial application with curried syntax', () => {
    const createButton = el('button');
    const primaryBtn = createButton({ class: { primary: true } })(['Save']);
    const secondaryBtn = createButton({ class: { secondary: true } })(['Cancel']);

    expect(primaryBtn.classList.contains('primary')).toBe(true);
    expect(primaryBtn.textContent).toBe('Save');
    expect(secondaryBtn.classList.contains('secondary')).toBe(true);
    expect(secondaryBtn.textContent).toBe('Cancel');
  });

  it('should handle empty props and children with Hyperscript syntax', () => {
    const div = el('div', {}, []);

    expect(div.tagName).toBe('DIV');
    expect(div.children.length).toBe(0);
    expect(div.textContent).toBe('');
  });

  it('should handle text content in Hyperscript syntax', () => {
    const p = el('p', { class: { text: true } }, ['Hello', ' ', 'World']);

    expect(p.textContent).toBe('Hello World');
    expect(p.classList.contains('text')).toBe(true);
  });
});
