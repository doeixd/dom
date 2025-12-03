# Reactive Bindings

"Hard way" reactive helpers for manual state management.

## Why?
When you need fine-grained control over DOM updates without a framework, these utilities provide reactive bindings with minimal overhead.

## API Reference

### `bind`
Binding utilities.

```typescript
const bind = {
  val: <T>(initial: T, effect: (val: T) => void) => Setter<T>,
  text: (el: HTMLElement | null) => Setter<string>,
  html: (el: HTMLElement | null) => Setter<string>,
  attr: (name: string, el?: HTMLElement | null) => Setter<string>,
  toggle: (className: string, el?: HTMLElement | null) => Setter<boolean>,
  style: (el: HTMLElement | null, property: string) => Setter<string>,
  cssVar: (el: HTMLElement | null, varName: string) => Setter<string>,
  list: <T>(container: HTMLElement | null, renderItem: (item: T, index: number) => Node) => Setter<T[]>
};
```

### `createStore`
Creates a lightweight observable store (not DOM-backed).

```typescript
function createStore<T>(initialState: T): Store<T>;
```

## Examples

### Text Binding
```typescript
import { bind, find } from '@doeixd/dom';

const display = find('#display');
const setText = bind.text(display);

setText('Hello'); // Updates textContent
setText('World'); // Updates again
```

### Observable Store
```typescript
import { createStore } from '@doeixd/dom';

const store = createStore({ count: 0 });

store.subscribe((state) => {
  console.log('Count:', state.count);
});

store.set({ count: 1 }); // Triggers subscriber
```
