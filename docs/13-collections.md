# Collections

Utilities for working with arrays and collections.

## Why?
Common operations like batching updates or grouping items are frequent needs in UI development.

## API Reference

### `batch`
Batches multiple function calls into a single execution frame (microtask).

```typescript
function batch(fn: () => void): void;
```

### `groupBy`
Groups an array of objects by a key.

```typescript
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
```

## Examples

### Batching DOM Updates
```typescript
import { batch, modify, find } from '@doeixd/dom';

const list = find('ul');

// Prevents layout thrashing by batching writes
batch(() => {
  modify(list)({ class: { loading: true } });
  // ... other updates
});
```

### Grouping Data
```typescript
import { groupBy } from '@doeixd/dom';

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'user' }
];

const byRole = groupBy(users, 'role');
// {
//   admin: [{ name: 'Alice', ... }],
//   user: [{ name: 'Bob', ... }, { name: 'Charlie', ... }]
// }
```
