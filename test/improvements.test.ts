import { describe, it, expect, vi } from 'vitest';
import { require as req, Data, store, onReady } from '../src/index';

describe('require', () => {
  it('returns element if found', () => {
    document.body.innerHTML = '<div id="test"></div>';
    const el = req('#test');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.id).toBe('test');
  });

  it('throws if element not found', () => {
    document.body.innerHTML = '';
    expect(() => req('#missing')).toThrow('Element not found: #missing');
  });
});

describe('Data.read', () => {
  it('parses JSON', () => {
    const div = document.createElement('div');
    div.dataset.test = '{"a":1}';
    expect(Data.read(div)('test')).toEqual({ a: 1 });
  });

  it('returns string for non-JSON', () => {
    const div = document.createElement('div');
    div.dataset.test = 'simple string';
    expect(Data.read(div)('test')).toBe('simple string');
  });

  it('returns string for malformed JSON starting with {', () => {
    const div = document.createElement('div');
    div.dataset.test = '{malformed';
    expect(Data.read(div)('test')).toBe('{malformed');
  });
});

describe('store', () => {
  it('updates DOM and triggers events', () => {
    const div = document.createElement('div');
    const s = store(div);
    const listener = vi.fn();

    s.addEventListener('change', listener);
    s.addEventListener('count', listener);

    s.count = 10;

    expect(div.dataset.count).toBe('10');
    expect(listener).toHaveBeenCalledTimes(2); // One for 'change', one for 'count'

    // Check event details
    const changeEvent = listener.mock.calls[0][0]; // First call might be 'count' or 'change' depending on dispatch order
    // Actually dispatch order is specific property first, then 'change'

    const propEvent = listener.mock.calls[0][0];
    expect(propEvent.type).toBe('count');
    expect(propEvent.detail).toBe(10);

    const genericEvent = listener.mock.calls[1][0];
    expect(genericEvent.type).toBe('change');
    expect(genericEvent.detail).toEqual({ prop: 'count', value: 10 });
  });

  it('reads from DOM', () => {
    const div = document.createElement('div');
    div.dataset.msg = 'hello';
    const s = store(div);
    expect(s.msg).toBe('hello');
  });
});

describe('onReady', () => {
  it('executes immediately if ready', () => {
    const fn = vi.fn();
    // HappyDOM/JSDOM usually starts as complete
    onReady(fn);
    expect(fn).toHaveBeenCalled();
  });
});
