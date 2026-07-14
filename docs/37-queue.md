# Queue

Task queue with concurrency control, priorities, and cancellation.

## Why?
When you need to ensure async operations run in a controlled way (e.g., animations, API calls), a queue prevents race conditions. Priorities and abort support let background work (like prefetching) yield to user-triggered requests.

## API Reference

### `createQueue`
Creates a task queue.

```typescript
function createQueue(options?: { concurrency?: number; autoStart?: boolean }): Queue;
```

- `concurrency` — max tasks running at once (default `1`).
- `autoStart` — pass `false` to start paused (default: starts immediately).

#### `Queue` Interface
```typescript
interface Queue {
  /** Task receives an AbortSignal; higher priority runs first (default 0). */
  add: <T>(task: (signal: AbortSignal) => Promise<T> | T, opts?: { priority?: number }) => Promise<T>;
  pause: () => void;
  resume: () => void;
  /** Rejects all pending tasks with AbortError; in-flight tasks keep running. */
  clear: () => void;
  /** Removes pending + aborts in-flight tasks with priority < minPriority (default 0). */
  preempt: (minPriority?: number) => void;
  /** Cancels everything: pending rejected, in-flight signals aborted. */
  abort: () => void;
  /** Pending + active task count. */
  size: () => number;
  /** Resolves when the queue is empty and idle. */
  drain: () => Promise<void>;
  /** Aborted tasks do NOT trigger this. */
  onError: (fn: (err: any) => void) => void;
}
```

Cancelled tasks reject with a `DOMException` named `'AbortError'` — check `err.name === 'AbortError'` to distinguish "cancelled" from "failed". Abort-rejections never fire `onError`, and fire-and-forget tasks won't surface unhandled rejections when cancelled.

## Examples

### Sequential Animations
```typescript
import { createQueue } from '@doeixd/dom';

const queue = createQueue();

queue.add(() => animateElement(el1));
queue.add(() => animateElement(el2));
queue.add(() => animateElement(el3));
// Runs one at a time
```

### Background Prefetching That Yields to User Actions
```typescript
import { createQueue, Http } from '@doeixd/dom';

const queue = createQueue({ concurrency: 4 });

// On page load: prewarm data at low priority
prefetchUrls.forEach(url =>
  queue.add(signal => fetch(url, { signal }), { priority: -10 })
);

// On user interaction: cancel background work so it doesn't starve the important request
button.addEventListener('click', async () => {
  queue.preempt(0); // drops pending + aborts in-flight tasks with priority < 0
  const res = await queue.add(signal => fetch('/api/important', { signal }));
  render(await res.json());
});
```
