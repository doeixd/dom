# Navigation (Traverse)

Utilities for traversing the DOM tree.

## Why?
Finding siblings, parents, or checking for existence often involves verbose checks (e.g., `el.nextElementSibling`). `Traverse` provides safe, functional wrappers for these operations.

## API Reference

### `Traverse`
A collection of traversal functions.

```typescript
const Traverse = {
  // Get next sibling
  next: (el: Element | null) => Element | null,
  
  // Get previous sibling
  prev: (el: Element | null) => Element | null,
  
  // Get parent
  parent: (el: Element | null) => Element | null,
  
  // Get all children
  children: (el: Element | null) => Element[],
  
  // Check if element contains another
  contains: (parent: Element | null, child: Element | null) => boolean
};
```

## Examples

### Walking the DOM
```typescript
import { Traverse, find } from '@doeixd/dom';

const item = find('.current-item');
const nextItem = Traverse.next(item);
const parentList = Traverse.parent(item);
```
