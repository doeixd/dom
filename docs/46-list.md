# List() - Reactive Array Binding

Efficient DOM rendering for dynamic collections with three reconciliation strategies: default (simple), keyed (efficient updates), and custom (user-provided).

## Overview

`List()` binds an array of data to a container element, rendering each item as a DOM element. It provides a rich API for manipulating the list and automatically updates the DOM to match.

```typescript
import { List, h } from '@doeixd/dom';

const container = document.querySelector('#todos');

const list = List<Todo>(container, {
  key: todo => todo.id,
  render: (todo) => h.li({}, [todo.text])
});

list.set([
  { id: 1, text: 'Buy groceries' },
  { id: 2, text: 'Walk dog' }
]);
```

## Three Reconciliation Modes

### 1. Default Mode (Simple Blow-Away)

When no `key` or `reconcile` function is provided, List uses a simple strategy: clear the container and render all items fresh.

**Best for:**
- Small lists (< 20 items)
- Lists that completely change on updates
- Simple use cases where performance isn't critical

```typescript
const list = List<string>(container, {
  render: (item) => h.li({}, [item])
});

list.set(['Item 1', 'Item 2', 'Item 3']);
// DOM: <li>Item 1</li><li>Item 2</li><li>Item 3</li>

list.set(['Item 4', 'Item 5']);
// DOM cleared and rebuilt: <li>Item 4</li><li>Item 5</li>
```

### 2. Keyed Mode (Efficient Diffing)

Provide a `key` function to enable efficient reconciliation that reuses existing elements.

**Best for:**
- Medium to large lists
- Lists where items are added/removed/reordered
- When you want to preserve element identity (animations, focus, etc.)

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const list = List<Todo>(container, {
  key: todo => todo.id,  // Enables keyed mode
  render: (todo) => h.li({}, [todo.text]),
  update: (el, todo) => {
    // Optional: efficient update without re-rendering
    el.textContent = todo.text;
    el.classList.toggle('done', todo.done);
  }
});

list.set([
  { id: 1, text: 'Buy groceries', done: false },
  { id: 2, text: 'Walk dog', done: true }
]);

// Add item - only creates one new element
list.append([{ id: 3, text: 'Call mom', done: false }]);

// Reorder - moves existing elements without recreating
list.set([
  { id: 2, text: 'Walk dog', done: true },
  { id: 1, text: 'Buy groceries', done: false },
  { id: 3, text: 'Call mom', done: false }
]);
```

**How it works:**
1. Build a Set of new item keys
2. Remove elements for deleted items (calls `onRemove` if provided)
3. For each new item:
   - If key exists: call `update()` if provided, otherwise reuse element as-is
   - If key is new: call `render()` to create element, then call `onAdd()` if provided
4. Reorder DOM using `insertBefore()` to match new order

**Time complexity:** O(n) where n is the number of items

### 3. Custom Mode (User-Provided Reconciliation)

Provide a `reconcile` function for complete control over the diffing algorithm.

**Best for:**
- Integration with third-party libraries (morphdom, nanomorph, etc.)
- Custom diffing strategies
- Advanced optimization requirements

```typescript
import morphdom from 'morphdom';

const list = List<Item>(container, {
  render: (item) => h.li({}, [item.text]),
  reconcile: (oldItems, newItems, container, renderFn) => {
    // Custom reconciliation logic
    const fragment = document.createDocumentFragment();
    newItems.forEach((item, i) => {
      fragment.appendChild(renderFn(item, i));
    });

    morphdom(container, fragment);
  }
});
```

## API Reference

### Creating a List

```typescript
function List<T>(
  container: HTMLElement | null,
  options: ListOptions<T>
): BoundList<T>

interface ListOptions<T> {
  /** Function to render each item (required) */
  render: (item: T, index: number) => HTMLElement;

  /** Optional: key function enables keyed reconciliation */
  key?: (item: T) => string | number;

  /** Optional: update function for efficient keyed updates */
  update?: (element: HTMLElement, item: T, index: number) => void;

  /** Optional: lifecycle hooks */
  onAdd?: (element: HTMLElement, item: T) => void;
  onRemove?: (element: HTMLElement, item: T) => void;

  /** Optional: custom reconciliation function */
  reconcile?: (
    oldItems: T[],
    newItems: T[],
    container: HTMLElement,
    renderFn: (item: T, index: number) => HTMLElement
  ) => void;
}
```

### BoundList Methods

```typescript
interface BoundList<T> {
  /** Replace all items */
  set(items: T[]): void;

  /** Add items to the end */
  append(items: T[]): void;

  /** Add items to the beginning */
  prepend(items: T[]): void;

  /** Insert items at specific index */
  insert(index: number, items: T[]): void;

  /** Remove items matching predicate */
  remove(predicate: (item: T) => boolean): void;

  /** Update items matching predicate */
  update(
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): void;

  /** Clear all items */
  clear(): void;

  /** Get current items (readonly) */
  items(): readonly T[];

  /** Get current elements (readonly) */
  elements(): readonly HTMLElement[];

  /** Destroy and cleanup */
  destroy(): void;
}
```

## Examples

### Simple String List

```typescript
const list = List<string>(container, {
  render: (item) => h.li({}, [item])
});

list.set(['Apple', 'Banana', 'Cherry']);
list.append(['Date', 'Elderberry']);
list.prepend(['Apricot']);
```

### Todo List with Keyed Mode

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const TodoItem = viewRefs<{
  checkbox: HTMLElement;
  label: HTMLElement;
  deleteBtn: HTMLElement;
}>(({ refs }) =>
  h.li({ class: { 'todo-item': true } }, [
    h.input({
      dataRef: 'checkbox',
      attr: { type: 'checkbox' }
    }),
    h.span({ dataRef: 'label' }),
    h.button({ dataRef: 'deleteBtn' }, ['×'])
  ])
);

const list = List<Todo>(container, {
  key: todo => todo.id,
  render: (todo) => {
    const { element, refs } = TodoItem();
    (refs.checkbox as HTMLInputElement).checked = todo.done;
    refs.label.textContent = todo.text;
    refs.deleteBtn.onclick = () => deleteTodo(todo.id);
    return element;
  },
  update: (el, todo) => {
    const checkbox = el.querySelector('[data-ref="checkbox"]') as HTMLInputElement;
    const label = el.querySelector('[data-ref="label"]') as HTMLElement;
    if (checkbox) checkbox.checked = todo.done;
    if (label) label.textContent = todo.text;
  }
});

// Initial render
list.set([
  { id: 1, text: 'Buy groceries', done: false },
  { id: 2, text: 'Walk dog', done: true }
]);

// Toggle todo
list.update(
  todo => todo.id === 1,
  todo => ({ ...todo, done: !todo.done })
);

// Remove completed
list.remove(todo => todo.done);
```

### User List with Lifecycle Hooks

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const list = List<User>(container, {
  key: user => user.id,
  render: (user) => {
    const card = h.div({ class: { 'user-card': true } }, [
      h.h3({}, [user.name]),
      h.p({}, [user.email])
    ]);

    // Animate in
    card.style.opacity = '0';
    return card;
  },
  onAdd: (el) => {
    // Fade in animation
    el.animate([
      { opacity: 0, transform: 'translateY(-10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  },
  onRemove: (el) => {
    // Fade out animation before removal
    el.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(10px)' }
    ], {
      duration: 200,
      easing: 'ease-in'
    });
  }
});
```

### Dynamic Insert and Remove

```typescript
const list = List<string>(container, {
  render: (item) => h.li({}, [item])
});

list.set(['A', 'B', 'D', 'E']);

// Insert at index 2
list.insert(2, ['C']);
// Result: ['A', 'B', 'C', 'D', 'E']

// Remove items matching predicate
list.remove(item => item === 'D' || item === 'E');
// Result: ['A', 'B', 'C']
```

### Using with createBinder()

```typescript
interface Item {
  id: number;
  title: string;
  count: number;
}

const ItemTemplate = viewRefs<{
  title: HTMLElement;
  count: HTMLElement;
}>(({ refs }) =>
  h.div({}, [
    h.h4({ dataRef: 'title' }),
    h.span({ dataRef: 'count' })
  ])
);

const list = List<Item>(container, {
  key: item => item.id,
  render: (item) => {
    const { element, refs } = ItemTemplate();
    const ui = createBinder(refs);

    ui({
      title: item.title,
      count: `Count: ${item.count}`
    });

    return element;
  },
  update: (el, item) => {
    const title = el.querySelector('[data-ref="title"]') as HTMLElement;
    const count = el.querySelector('[data-ref="count"]') as HTMLElement;
    if (title) title.textContent = item.title;
    if (count) count.textContent = `Count: ${item.count}`;
  }
});
```

## Null Container Handling

If the container is `null`, List returns a no-op implementation that safely ignores all operations:

```typescript
const list = List<string>(null, {
  render: (item) => h.li({}, [item])
});

list.set(['A', 'B']); // Safe, does nothing
list.items(); // Returns []
list.elements(); // Returns []
```

## Performance

### Default Mode
- **Time**: O(n) - clears and rebuilds entire list
- **Best for**: Small lists, complete replacements

### Keyed Mode
- **Time**: O(n) - single pass with Set lookups
- **Space**: O(n) - Map storing key→element
- **Best for**: Medium/large lists with frequent updates

### Benchmarks
- 100 items: < 10ms (keyed mode)
- 1,000 items: < 100ms (keyed mode)
- Reordering 100 items: < 5ms (keyed mode)

## Memory Management

**Important**: Call `destroy()` to clean up when the list is no longer needed:

```typescript
const list = List<Item>(container, options);

// Later, when component unmounts
list.destroy();
```

This clears all items and internal maps, preventing memory leaks.

## Best Practices

1. **Use keyed mode for identity**: When items have unique IDs, always provide a `key` function
2. **Implement update() for efficiency**: In keyed mode, `update()` avoids full re-renders
3. **Use onAdd/onRemove for animations**: Perfect for fade in/out effects
4. **Call destroy() on cleanup**: Prevent memory leaks in long-running apps
5. **Keep render pure**: The `render` function should not have side effects
6. **Batch updates**: Call `set()` once instead of multiple `append()`/`prepend()` calls

## Common Patterns

### Filtered List

```typescript
const allItems = [/* ... */];
const filterText = 'search';

list.set(allItems.filter(item =>
  item.text.toLowerCase().includes(filterText.toLowerCase())
));
```

### Sorted List

```typescript
list.set([...items].sort((a, b) =>
  a.priority - b.priority
));
```

### Paginated List

```typescript
const page = 2;
const pageSize = 10;
const start = page * pageSize;
const end = start + pageSize;

list.set(allItems.slice(start, end));
```

### Live Search

```typescript
const searchInput = find('input[type="search"]');

searchInput?.addEventListener('input', (e) => {
  const query = (e.target as HTMLInputElement).value.toLowerCase();

  const filtered = allItems.filter(item =>
    item.text.toLowerCase().includes(query)
  );

  list.set(filtered);
});
```

## See Also

- [viewRefs() - Template Factories](./47-viewrefs.md)
- [h/tags - Hyperscript Creation](./45-hyperscript.md)
- [createBinder() - Data Binding](./48-binder.md)
- [refs() - Ref Extraction](./14-component-refs.md)
