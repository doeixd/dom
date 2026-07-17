import { describe, it, expect } from 'vitest';
import * as dom from '../src/index';

describe('package entry point', () => {
  it('exposes the core API surface', () => {
    // A representative export from each major area — catches broken
    // re-exports and load-time crashes in the entry module.
    expect(typeof dom.find).toBe('function');
    expect(typeof dom.on).toBe('function');
    expect(typeof dom.modify).toBe('function');
    expect(dom.h).toBeDefined(); // proxy-based factory
    expect(typeof dom.component).toBe('function');
    expect(typeof dom.morph).toBe('function');
    expect(typeof dom.enhance).toBe('function');
    expect(typeof dom.createRouter).toBe('function');
    expect(typeof dom.List).toBe('function');
    expect(dom.Tag).toBeDefined();
    expect(dom.Attr).toBeDefined();
    expect(dom.Style).toBeDefined();
  });
});
