# Storage

Typed wrappers for `localStorage` and `sessionStorage`.

## Why?
`localStorage` only stores strings. These wrappers handle JSON serialization/deserialization automatically and provide a cleaner API.

## API Reference

### `Local` / `Session`
Wrappers for `localStorage` and `sessionStorage`.

```typescript
const Local = {
  get: <T>(key: string) => T | null,
  set: (key: string, val: any) => void,
  remove: (key: string) => void,
  clear: () => void
};

// Session has the same API
```

## Examples

### Storing Objects
```typescript
import { Local } from '@doeixd/dom';

const user = { id: 1, name: 'Alice' };

// Automatically stringifies
Local.set('user', user);

// Automatically parses
const savedUser = Local.get<{ id: number, name: string }>('user');
```
