import { describe, it, expect } from 'vitest';
import { createQueue } from '../src/index';

const tick = () => new Promise<void>(r => setTimeout(r, 0));
const deferred = <T = void>() => {
  let resolve!: (v: T) => void, reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

describe('createQueue', () => {
  it('runs tasks with concurrency control and resolves results', async () => {
    const q = createQueue({ concurrency: 2 });
    let running = 0, maxRunning = 0;
    const task = (n: number) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await tick();
      running--;
      return n;
    };
    const results = await Promise.all([q.add(task(1)), q.add(task(2)), q.add(task(3))]);
    expect(results).toEqual([1, 2, 3]);
    expect(maxRunning).toBe(2);
  });

  it('runs higher priority tasks first, FIFO within equal priority', async () => {
    const q = createQueue({ concurrency: 1 });
    const order: string[] = [];
    const gate = deferred();
    // Occupy the single slot so subsequent adds stay pending and get ordered.
    q.add(() => gate.promise);
    q.add(() => { order.push('low'); }, { priority: -10 });
    q.add(() => { order.push('a'); });
    q.add(() => { order.push('high'); }, { priority: 5 });
    q.add(() => { order.push('b'); });
    gate.resolve();
    await q.drain();
    expect(order).toEqual(['high', 'a', 'b', 'low']);
  });

  it('preempt() removes pending tasks below the given priority', async () => {
    const q = createQueue({ concurrency: 1 });
    const gate = deferred();
    q.add(() => gate.promise);
    const bg = q.add(() => 'bg', { priority: -1 });
    const fg = q.add(() => 'fg');
    q.preempt(0);
    await expect(bg).rejects.toMatchObject({ name: 'AbortError' });
    gate.resolve();
    await expect(fg).resolves.toBe('fg');
  });

  it('preempt() aborts the signal of in-flight tasks below the given priority', async () => {
    const q = createQueue({ concurrency: 2 });
    let bgSignal: AbortSignal | undefined;
    let fgSignal: AbortSignal | undefined;
    const bg = q.add(signal => {
      bgSignal = signal;
      return new Promise((_, rej) => signal.addEventListener('abort', () => rej(signal.reason)));
    }, { priority: -1 });
    const fg = q.add(async signal => { fgSignal = signal; return 'fg'; });
    await tick();
    q.preempt(0);
    expect(bgSignal!.aborted).toBe(true);
    expect(fgSignal!.aborted).toBe(false);
    await expect(bg).rejects.toMatchObject({ name: 'AbortError' });
    await expect(fg).resolves.toBe('fg');
  });

  it('abort() cancels pending and in-flight tasks', async () => {
    const q = createQueue({ concurrency: 1 });
    let seen: AbortSignal | undefined;
    const a = q.add(signal => {
      seen = signal;
      return new Promise((_, rej) => signal.addEventListener('abort', () => rej(signal.reason)));
    });
    const b = q.add(() => 'b');
    await tick();
    q.abort();
    expect(seen!.aborted).toBe(true);
    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    expect(q.size()).toBe(0);
  });

  it('clear() rejects pending tasks with AbortError but leaves in-flight tasks running', async () => {
    const q = createQueue({ concurrency: 1 });
    const gate = deferred<string>();
    const a = q.add(() => gate.promise);
    const b = q.add(() => 'b');
    q.clear();
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    gate.resolve('a');
    await expect(a).resolves.toBe('a');
  });

  it('does not fire onError for aborted tasks, but does for failures', async () => {
    const q = createQueue({ concurrency: 1 });
    const errors: any[] = [];
    q.onError(e => errors.push(e));
    let signalRef: AbortSignal | undefined;
    const aborted = q.add(signal => {
      signalRef = signal;
      return new Promise((_, rej) => signal.addEventListener('abort', () => rej(signal.reason)));
    });
    await tick();
    q.abort();
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    expect(signalRef!.aborted).toBe(true);
    expect(errors).toHaveLength(0);

    const failing = q.add(() => { throw new Error('boom'); });
    await expect(failing).rejects.toThrow('boom');
    expect(errors).toHaveLength(1);
  });

  it('drain() resolves after preemption and remaining work completes', async () => {
    const q = createQueue({ concurrency: 1 });
    q.add(() => tick(), { priority: -1 }).catch(() => {});
    q.add(() => tick(), { priority: -1 }).catch(() => {});
    q.preempt(0);
    q.add(() => tick());
    await q.drain();
    expect(q.size()).toBe(0);
  });

  it('respects pause/resume with priorities', async () => {
    const q = createQueue({ concurrency: 1, autoStart: false });
    const order: number[] = [];
    q.add(() => { order.push(0); });
    q.add(() => { order.push(1); }, { priority: 1 });
    expect(order).toEqual([]);
    q.resume();
    await q.drain();
    expect(order).toEqual([1, 0]);
  });
});
