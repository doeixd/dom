# Refs

Select elements within a container using `data-ref` attributes.

## Why?
Querying elements by class name or ID can be brittle and lead to conflicts. `data-ref` provides a dedicated way to mark elements for JavaScript access, scoping them to a specific component or container.

## API Reference

### `refs`
Selects single elements marked with `data-ref`.

```typescript
function refs<T = Record<string, HTMLElement>>(root: HTMLElement | null): T;
```

#### Parameters
- `root`: The container element to search within.

#### Returns
- An object where keys are the `data-ref` values and values are the corresponding elements.

### `groupRefs`
Selects groups of elements marked with the same `data-ref`.

```typescript
function groupRefs<T = Record<string, HTMLElement[]>>(root: HTMLElement | null): T;
```

#### Parameters
- `root`: The container element to search within.

#### Returns
- An object where keys are the `data-ref` values and values are arrays of matching elements.

## Examples

### Basic Usage
```html
<div id="card">
  <h2 data-ref="title">Title</h2>
  <p data-ref="content">Content</p>
  <button data-ref="action">Click Me</button>
</div>
```

```typescript
import { refs, find } from '@doeixd/dom';

const card = find('#card');
const { title, content, action } = refs(card);

title.textContent = 'New Title';
```

### Grouped Refs
```html
<ul id="list">
  <li data-ref="item">Item 1</li>
  <li data-ref="item">Item 2</li>
  <li data-ref="item">Item 3</li>
</ul>
```

```typescript
import { groupRefs, find } from '@doeixd/dom';

const list = find('#list');
const { item } = groupRefs(list); // item is HTMLElement[]

item.forEach(el => el.style.color = 'blue');
```
