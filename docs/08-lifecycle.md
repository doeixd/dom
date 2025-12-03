# Lifecycle

Utilities for managing element lifecycle and async waiting.

## Why?
Knowing when an element is ready, mounted, or when a condition is met is crucial for initialization logic. `onReady` and `onMount` provide reliable hooks for these states.

## API Reference

### `onReady`
Executes a callback when the DOM is ready (DOMContentLoaded).

```typescript
function onReady(callback: () => void): void;
```

### `onMount`
Executes a callback when an element is connected to the DOM.

```typescript
function onMount(element: HTMLElement | null, callback: () => void): void;
```

### `waitFor`
Waits for a condition to be true, polling at a specified interval.

```typescript
function waitFor(
  condition: () => boolean, 
  timeout?: number, 
  interval?: number
): Promise<void>;
```

#### Parameters
- `condition`: Function returning true when ready.
- `timeout`: Max time to wait in ms (default: 5000).
- `interval`: Polling interval in ms (default: 50).

#### Returns
- `Promise<void>`: Resolves when condition is true, rejects on timeout.

## Examples

### Initialization
```typescript
import { onReady, find } from '@doeixd/dom';

onReady(() => {
  console.log('DOM is ready!');
  const app = find('#app');
  // Initialize app...
});
```

### Component Mounting
```typescript
import { onMount, el } from '@doeixd/dom';

const widget = el('div');

onMount(widget, () => {
  console.log('Widget is now in the DOM');
  // Safe to measure dimensions or start animations
});

document.body.appendChild(widget);
```

### Waiting for State
```typescript
import { waitFor } from '@doeixd/dom';

async function init() {
  await waitFor(() => window.someGlobalLibrary !== undefined);
  window.someGlobalLibrary.start();
}
```
