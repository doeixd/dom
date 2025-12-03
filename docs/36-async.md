# Async

Utilities for async operations and promises.

## Why?
Common async patterns (delays, retries, timeouts) require boilerplate. `Async` provides composable helpers.

## API Reference

### `Async`
Async utilities.

```typescript
const Async = {
  delay: (ms: number) => Promise<void>,
  retry: <T>(fn: () => Promise<T>, attempts: number, delayMs?: number) => Promise<T>,
  timeout: <T>(promise: Promise<T>, ms: number) => Promise<T>,
  parallel: <T>(promises: Promise<T>[]) => Promise<T[]>,
  series: <T>(fns: Array<() => Promise<T>>) => Promise<T[]>
};
```

## Examples

### Delay
```typescript
import { Async } from '@doeixd/dom';

await Async.delay(1000); // Wait 1 second
console.log('Done!');
```

### Retry Logic
```typescript
import { Async, Http } from '@doeixd/dom';

const data = await Async.retry(
  () => Http.get('/api/data'),
  3,  // 3 attempts
  1000 // 1s delay between attempts
);
```
