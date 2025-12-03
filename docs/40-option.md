# Option

Functional wrapper for nullable values.

## Why?
Null checks clutter code. `Option` provides functional methods for working with nullable values safely.

## API Reference

### `Option`
Option utilities.

```typescript
const Option = {
  from: <T>(val: T | null | undefined) => Option<T>,
  unwrapOr: <T>(val: T | null | undefined, fallback: T) => T,
  map: <T, R>(val: T | null | undefined, fn: (v: T) => R) => R | null,
  then: <T>(val: T | null | undefined, fn: (v: T) => void) => void
};
```

## Examples

### Safe Access
```typescript
import { Option } from '@doeixd/dom';

const name = Option.unwrapOr(user?.name, 'Guest');
```

### Mapping Values
```typescript
import { Option } from '@doeixd/dom';

const length = Option.map(str, s => s.length); // null if str is null
```
