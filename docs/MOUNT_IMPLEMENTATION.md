# Mount Function Implementation

## Overview

The `mount` function has been added to `index.ts` (in the DOM Structure/Manipulation section) with comprehensive features and documentation.

## Signature

```typescript
export const mount = def((parent: Element | string | null, child: Element | null): Unsubscribe => {
  // Implementation
});
```

## Key Features

### Flexible Parent Input
- **Element**: `mount(containerElement, childElement)`
- **Selector**: `mount(".container", childElement)`
- **Null-safe**: `mount(null, child)` returns no-op cleanup

### Cleanup Pattern
Returns an `Unsubscribe` function that safely removes the child:

```typescript
const cleanup = mount(parent, child);
cleanup(); // Removes child from parent
```

### Curried API
Supports both imperative and functional styles:

```typescript
// Imperative
mount(parent, child);

// Curried
mount(parent)(child);
```

## Usage Examples

### Basic Mount & Unmount
```typescript
const parent = document.querySelector('.container');
const child = document.createElement('div');
child.textContent = 'Hello';

const cleanup = mount(parent, child);
// element is now in the DOM

cleanup();
// element is removed from the DOM
```

### With Selector
```typescript
const modal = el('div')({
  class: { modal: true },
  attr: { role: 'dialog' }
})(['Modal Content']);

const cleanup = mount(".modal-container")(modal);
```

### Mounting Multiple Elements
```typescript
const list = document.querySelector('ul');
const items = [
  el('li')({})(['Item 1']),
  el('li')({})(['Item 2']),
  el('li')({})(['Item 3'])
];

// Mount all items
const cleanups = items.map(item => mount(list, item));

// Cleanup all at once
const cleanupAll = () => cleanups.forEach(fn => fn());
```

### Temporary UI Elements (Modals, Popovers, Toasts)
```typescript
const showModal = (content: string) => {
  const modal = el('div')({
    class: { modal: true },
    attr: { role: 'dialog' }
  })([content]);

  const cleanup = mount(document.body, modal);

  // Auto-cleanup on close button
  const closeBtn = modal.querySelector('[data-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', cleanup);
  }

  return cleanup;
};

// Show modal
const hideModal = showModal('Are you sure?');

// Hide later
hideModal();
```

### Dynamic List Rendering
```typescript
const renderItems = (container: Element, items: string[]) => {
  const cleanups: Unsubscribe[] = [];

  items.forEach(text => {
    const li = el('li')({})([text]);
    const cleanup = mount(container, li);
    cleanups.push(cleanup);
  });

  // Return function to clear all
  return () => cleanups.forEach(fn => fn());
};

const list = document.querySelector('ul');
const clearList = renderItems(list, ['Apple', 'Banana', 'Cherry']);

// Later: remove all items
clearList();
```

### Delegation with Mount
```typescript
const showNotification = (message: string, duration = 3000) => {
  const notification = el('div')({
    class: { notification: true },
    text: message
  })([]);

  const cleanup = mount(document.body, notification);

  // Auto-remove after timeout
  setTimeout(cleanup, duration);

  return cleanup;
};

showNotification('Changes saved!', 2000);
```

### Building Complex UIs
```typescript
const createCard = (title: string, content: string) => {
  return el('div')({
    class: { card: true }
  })([
    el('h3')({})([title]),
    el('p')({})([content])
  ]);
};

const container = document.querySelector('.cards');
const card1 = createCard('Title 1', 'Content 1');
const card2 = createCard('Title 2', 'Content 2');

const remove1 = mount(container, card1);
const remove2 = mount(container, card2);

// Remove only card1
remove1();

// Remove card2
remove2();
```

## Integration with Existing API

`mount` integrates seamlessly with other fdom functions:

```typescript
// With el() for element creation
const modal = el('div')({ class: { modal: true } })(['Content']);
const cleanup = mount(".modal-container", modal);

// With append() for content
const container = el('div')({ class: { container: true } })([]);
mount(document.body, container);
append(container, 'Initial content');

// With event listeners
const btn = el('button')({})(['Click me']);
on(btn)('click', () => console.log('Clicked'));
mount(document.body, btn);

// With classes and transitions
const item = el('div')({ class: { item: true } })(['Item']);
const cleanup = mount(list, item);
cls.add(item)('active');
```

## Safety Features

### Null Handling
```typescript
mount(null, child);        // Returns no-op cleanup
mount(parent, null);       // Returns no-op cleanup
mount(null, null);         // Returns no-op cleanup
mount(".no-match", child); // Returns no-op cleanup (selector doesn't exist)
```

### Safe Removal
The cleanup function checks if the child is still a child of the parent before removing:

```typescript
const cleanup = mount(parent, child);

// If child was manually removed
parent.removeChild(child);

// Cleanup won't throw—it safely checks parentNode
cleanup(); // Safe, no error
```

### Parent Verification
Selector-based mounting only works if the selector exists:

```typescript
const cleanup = mount(".non-existent", child);
// cleanup is a no-op, child wasn't mounted
```

## Type Safety

```typescript
// Full type inference
const input = el('input')({
  attr: { type: 'email' },
  value: 'test@example.com'
})([]);

const form = el('form')({})([]);

// Cleanup function is properly typed as Unsubscribe
const cleanup: Unsubscribe = mount(form, input);
cleanup(); // TypeScript knows this is a function
```

## Composition & Chaining

```typescript
// Mount multiple elements in sequence
const container = el('div')({})([]);

mount(document.body, container);
mount(container, el('h1')({})(['Title']));
mount(container, el('p')({})(['Description']));

// Cleanup all
const cleanups = [
  mount(document.body, container),
  mount(container, el('h1')({})(['Title'])),
  mount(container, el('p')({})(['Description']))
];

const cleanupAll = () => cleanups.forEach(fn => fn());
```

## Performance Considerations

- **Direct appendChild**: No overhead, uses native DOM API
- **Single traversal**: Selector is only queried once at mount time
- **Lightweight cleanup**: Simple parentNode check and removeChild
- **No memory leaks**: Returns a cleanup function for explicit cleanup

## Comparison with Alternatives

### vs. innerHTML
```typescript
// innerHTML (not recommended for dynamic content)
container.innerHTML = '<div>Content</div>';

// mount (safer, more flexible)
mount(container, el('div')({})(['Content']));
```

### vs. insertAdjacentHTML
```typescript
// insertAdjacentHTML
container.insertAdjacentHTML('beforeend', '<div>Content</div>');

// mount (with cleanup)
const cleanup = mount(container, el('div')({})(['Content']));
cleanup(); // Easy cleanup
```

### vs. appendChild directly
```typescript
// Direct appendChild
const child = el('div')({})(['Content']);
container.appendChild(child);

// mount (returns cleanup)
const cleanup = mount(container, el('div')({})(['Content']));
cleanup(); // Easy cleanup
```

## API Reference

| Method | Returns | Purpose |
|--------|---------|---------|
| `mount(parent, child)` | `Unsubscribe` | Imperative mount with cleanup |
| `mount(parent)(child)` | `Unsubscribe` | Curried mount for composition |
| `cleanup()` | `void` | Unmounts the child from parent |
| Supports selectors | Yes | Parent can be Element or selector string |
| Null-safe | Yes | Returns no-op on null/invalid inputs |
| Type-safe | Yes | Full TypeScript support with Unsubscribe type |
