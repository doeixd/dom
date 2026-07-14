// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('SSR safety', () => {
  it('imports without a DOM (no window access at module evaluation)', async () => {
    expect(typeof window).toBe('undefined');
    const mod = await import('../src/index');
    expect(typeof mod.find).toBe('function');
    expect(typeof mod.component).toBe('function');
    // Storage wrappers exist but defer window access until first use.
    expect(mod.Local).toBeTruthy();
    expect(() => mod.Local.get('x')).toThrow(); // touches window lazily — throws only when used
  });
});
