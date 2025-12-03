# Objects

Utilities for working with plain objects, often used in conjunction with state management.

## Why?
Helper functions for common object operations like deep cloning, equality checking, and property picking/omitting are essential for immutable state updates and efficient rendering.

## API Reference

### `Obj`
A collection of object utilities.

```typescript
const Obj = {
  // Deep clone an object
  clone: <T>(obj: T) => T,
  
  // Deep equality check
  isEqual: (a: any, b: any) => boolean,
  
  // Pick specific keys
  pick: <T, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>,
  
  // Omit specific keys
  omit: <T, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>
};
```

## Examples

### Deep Cloning
```typescript
import { Obj } from '@doeixd/dom';

const state = { user: { name: 'Alice', settings: { theme: 'dark' } } };
const newState = Obj.clone(state);

newState.user.settings.theme = 'light';
// state.user.settings.theme is still 'dark'
```

### Equality Check
```typescript
import { Obj } from '@doeixd/dom';

const a = { id: 1 };
const b = { id: 1 };

console.log(a === b); // false
console.log(Obj.isEqual(a, b)); // true
```
