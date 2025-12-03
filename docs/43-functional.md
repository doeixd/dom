# Functional Combinators

Utilities for functional composition and element transformation.

## Why?
Composing multiple transformations on elements is a common pattern. These utilities make it cleaner and more expressive.

## API Reference

### `Fn`
Functional utilities.

```typescript
const Fn = {
  pipe: <T>(...fns: Array<(x: T) => T>) => (x: T) => T,
  compose: <T>(...fns: Array<(x: T) => T>) => (x: T) => T,
  withSelector: <F>(fn: F) => SelectorEnabled<F>
};
```

### `chain`
Applies transformations to an element, returning the element.

```typescript
function chain<T extends HTMLElement>(
  element: T | null,
  ...transforms: Array<(el: T) => any>
): T | null;
```

### `exec`
Executes operations on an element (doesn't return the element).

```typescript
function exec<T extends HTMLElement>(
  element: T | null,
  ...operations: Array<(el: T) => any>
): T | null;
```

## Examples

### Chaining Transformations
```typescript
import { chain, modify, cls, find } from '@doeixd/dom';

const btn = chain(
  find('button'),
  (el) => modify(el)({ text: 'Click Me' }),
  (el) => cls.add(el, 'primary'),
  (el) => { el.disabled = false; return el; }
);
```

### Pipe Composition
```typescript
import { Fn } from '@doeixd/dom';

const transform = Fn.pipe(
  (x: number) => x * 2,
  (x) => x + 10,
  (x) => x.toString()
);

transform(5); // "20"
```
