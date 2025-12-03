# Signals (AbortController)

Utilities for cancellable async operations using `AbortController`.

## Why?
Cancelling fetch requests or complex async flows is standard practice for robust apps (e.g., cancelling a search when the user types again). `Signal` simplifies creating and using `AbortSignal`.

## API Reference

### `Signal`
Utilities for `AbortController`.

```typescript
const Signal = {
  // Create a new controller
  create: () => { signal: AbortSignal, abort: () => void },
  
  // Create a signal that aborts after a timeout
  timeout: (ms: number) => AbortSignal,
  
  // Wrap a promise to make it abortable (rejects on abort)
  wrap: <T>(promise: Promise<T>, signal?: AbortSignal) => Promise<T>
};
```

## Examples

### Cancellable Fetch
```typescript
import { Signal, on, find } from '@doeixd/dom';

let currentRequest = null;

on(find('#search'))('input', async (e) => {
  // Cancel previous request
  if (currentRequest) currentRequest.abort();
  
  // Create new signal
  currentRequest = Signal.create();
  
  try {
    const res = await fetch(`/api?q=${e.target.value}`, {
      signal: currentRequest.signal
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Request cancelled');
    }
  }
});
```

### Timeout
```typescript
import { Signal } from '@doeixd/dom';

try {
  const res = await fetch('/slow-api', {
    signal: Signal.timeout(5000) // Abort after 5s
  });
} catch (err) {
  console.error('Timed out!');
}
```
