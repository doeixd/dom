# Signals Update (createUpdateAfter)

Sync DOM state after function execution with fine-grained control.

## Why?
When managing imperative state, you need to manually trigger DOM updates. `createUpdateAfter` wraps functions to automatically update the DOM after they run, with support for batching and intermediate updates.

## API Reference

### `createUpdateAfter`
Creates an update wrapper that syncs DOM state after function execution.

```typescript
// Element only (returns function waiting for updater)
function createUpdateAfter<T extends Element>(el: T | null): ElementStage<T>;

// Element + updater
function createUpdateAfter<T extends Element, R>(
  el: T | null,
  updater: (el: T, result: R | undefined) => void
): UpdateWrapper<T>;

// Element + updater + initial value
function createUpdateAfter<T extends Element, R>(
  el: T | null,
  updater: (el: T, result: R | undefined) => void,
  initialValue: R
): UpdateWrapper<T>;
```

#### `UpdateWrapper` Methods
```typescript
interface UpdateWrapper<T> {
  // Wrap function with control
  <Args, R>(fn: (control: UpdateControl<R>, ...args: Args) => R): (...args: Args) => R;
  
  // Wrap simple function
  simple<Args, R>(fn: (...args: Args) => R): (...args: Args) => R;
  
  // Wrap multiple functions
  all<A>(actions: A): WrapAll<A>;
  allSimple<A>(actions: A): WrapAllSimple<A>;
  
  // Batch updates
  batch<R>(fn: () => R): R;
  
  // Manual updates
  update<R>(value: R): void;
  refresh(): void;
  
  // State
  readonly isBatching: boolean;
  readonly el: T | null;
}
```

## Examples

### Basic Counter
```typescript
import { createUpdateAfter, find } from '@doeixd/dom';

let count = 0;
const countEl = find('#count');

const sync = createUpdateAfter(countEl, (el, result) => {
  el.textContent = String(result ?? count);
});

const increment = sync.simple(() => ++count);
const decrement = sync.simple(() => --count);

increment(); // DOM shows 1
increment(); // DOM shows 2
```

### Progress Indicator
```typescript
import { createUpdateAfter, find } from '@doeixd/dom';

const progressBar = find('.progress-bar');

const sync = createUpdateAfter(progressBar, (el, percent) => {
  el.style.width = `${percent ?? 0}%`;
  el.textContent = `${percent ?? 0}%`;
});

const processFiles = sync(async (control, files: File[]) => {
  for (let i = 0; i < files.length; i++) {
    await uploadFile(files[i]);
    control(Math.round((i + 1) / files.length * 100));
  }
  return 100;
});

await processFiles(myFiles); // Updates during upload
```

### Batching Updates
```typescript
import { createUpdateAfter, find } from '@doeixd/dom';

let count = 0;
const sync = createUpdateAfter(find('#count'), (el, val) => {
  el.textContent = String(val ?? count);
});

const inc = sync.simple(() => ++count);

// Without batch: 3 DOM updates
inc(); inc(); inc();

// With batch: 1 DOM update
sync.batch(() => {
  inc(); inc(); inc();
});
```
