# Timing

Utilities for controlling function execution frequency.

## Why?
Handling high-frequency events like `scroll`, `resize`, or `input` directly can kill performance. `debounce` and `throttle` limit how often a function runs.

## API Reference

### `debounce`
Delays execution until a certain amount of time has passed since the last call. Good for search inputs.

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T, 
  ms: number
): (...args: Parameters<T>) => void;
```

### `throttle`
Ensures execution happens at most once every specified interval. Good for scroll events.

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T, 
  ms: number
): (...args: Parameters<T>) => void;
```

## Examples

### Search Input (Debounce)
```typescript
import { debounce, on, find } from '@doeixd/dom';

const searchInput = find('#search');

const searchApi = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

on(searchInput)('input', (e) => {
  searchApi((e.target as HTMLInputElement).value);
});
```

### Infinite Scroll (Throttle)
```typescript
import { throttle, on } from '@doeixd/dom';

const checkScroll = throttle(() => {
  if (window.scrollY > 1000) {
    console.log('Scrolled far!');
  }
}, 100);

on(window)('scroll', checkScroll);
```
