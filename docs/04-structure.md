# Structure

Functions for traversing and modifying the DOM tree structure.

## Why?
Standard DOM methods like `appendChild` or `insertBefore` can be verbose. These wrappers provide a more functional and chainable approach to moving elements around.

## API Reference

### `append` / `prepend`
Adds children to a parent.

```typescript
function append(parent: ParentNode | null): (...children: (Node | string)[]) => ParentNode | null;
function prepend(parent: ParentNode | null): (...children: (Node | string)[]) => ParentNode | null;
```

### `after` / `before`
Inserts elements adjacent to a reference element.

```typescript
function after(ref: Element | null): (...nodes: (Node | string)[]) => void;
function before(ref: Element | null): (...nodes: (Node | string)[]) => void;
```

### `remove`
Removes an element from the DOM.

```typescript
function remove(element: Element | null): void;
```

### `wrap`
Wraps an element with a parent element.

```typescript
function wrap(target: Element | null, wrapper: Element): void;
```

### `mount`
Mounts a component or element to a target, clearing the target first.

```typescript
function mount(target: Element | null, child: Node | string): void;
```

## Examples

### Appending Elements
```typescript
import { el, append, find } from '@doeixd/dom';

const list = find('ul');
const item = el('li', { text: 'New Item' });

append(list)(item);
```

### Inserting Adjacent
```typescript
import { el, after, find } from '@doeixd/dom';

const title = find('h1');
const subtitle = el('h2', { text: 'Subtitle' });

after(title)(subtitle); // Inserts h2 after h1
```

### Wrapping
```typescript
import { el, wrap, find } from '@doeixd/dom';

const img = find('img');
const figure = el('figure');

wrap(img, figure); // Result: <figure><img></figure>
```
