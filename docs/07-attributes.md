# Attributes & Data

Utilities for working with HTML attributes and `data-*` attributes.

## Why?
`dataset` is great but lacks type conversion (everything is a string). `Data` provides automatic type parsing (JSON, numbers, booleans) and a consistent API for both reading and writing.

## API Reference

### `Data`
Utilities for `data-*` attributes.

```typescript
const Data = {
  // Get raw string value
  get: (el: HTMLElement | null) => (key: string) => string | undefined,
  
  // Set value (automatically stringifies objects/primitives)
  set: (el: HTMLElement | null, key: string, val: any) => void,
  
  // Read and parse value (JSON, number, boolean)
  read: (el: HTMLElement | null) => (key: string) => any,
  
  // Bind a callback to changes in a data attribute
  bind: (el: HTMLElement | null, key: string, callback: (val: any, el: HTMLElement) => void) => Unsubscribe
};
```

### `watchAttr`
Observes an arbitrary attribute for changes.

```typescript
function watchAttr(
  element: HTMLElement | null, 
  attrName: string, 
  callback: (value: string | null) => void
): Unsubscribe;
```

### `watchText`
Observes text content changes.

```typescript
function watchText(
  element: HTMLElement | null, 
  callback: (text: string | null) => void
): Unsubscribe;
```

## Examples

### Working with Data Attributes
```typescript
import { Data, find } from '@doeixd/dom';

const userCard = find('.user-card');

// Set complex data
Data.set(userCard, 'info', { id: 1, name: 'Alice' });

// Read parsed data
const info = Data.read(userCard)('info'); 
// { id: 1, name: 'Alice' }
```

### Reactive Data Binding
```typescript
import { Data, find } from '@doeixd/dom';

const counter = find('#counter');

// React to changes in data-count
Data.bind(counter, 'count', (newCount) => {
  console.log('Count changed to:', newCount);
});

// Triggers the callback
Data.set(counter, 'count', 5);
```
