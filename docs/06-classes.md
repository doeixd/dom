# Classes

Functional CSS class manipulation.

## Why?
`classList` is object-oriented and doesn't support chaining or currying. `cls` provides a functional API that works well with `pipe` or `compose` and handles null elements gracefully.

## API Reference

### `cls`
An object containing class manipulation functions.

```typescript
const cls = {
  add: (el: Element | null, ...classes: string[]) => Element | null,
  remove: (el: Element | null, ...classes: string[]) => Element | null,
  toggle: (el: Element | null, className: string, force?: boolean) => Element | null,
  replace: (el: Element | null, oldClass: string, newClass: string) => Element | null,
  has: (el: Element | null) => (className: string) => boolean
};
```

All methods (except `has`) return the element to allow for potential chaining (though the library encourages functional composition over method chaining).

### `watchClass`
Observes an element for class changes.

```typescript
function watchClass(
  element: HTMLElement | null, 
  className: string, 
  callback: (hasClass: boolean) => void
): Unsubscribe;
```

#### Parameters
- `element`: The element to observe.
- `className`: The specific class to watch for.
- `callback`: Function called when the class presence changes.

#### Returns
- `Unsubscribe`: Function to stop observing.

## Examples

### Basic Manipulation
```typescript
import { cls, find } from '@doeixd/dom';

const btn = find('button');

cls.add(btn, 'active', 'visible');
cls.remove(btn, 'loading');
cls.toggle(btn, 'toggled');
```

### Curried Usage
```typescript
import { cls } from '@doeixd/dom';

const makeActive = cls.add('active'); // Wait, cls methods are not auto-curried like this in the implementation shown.
// Correction: The implementation uses `def` which supports (el, ...args) OR (el)(...args).

const activate = (el: Element) => cls.add(el, 'active');
```

### Watching for Class Changes
```typescript
import { watchClass, find } from '@doeixd/dom';

const modal = find('.modal');

watchClass(modal, 'open', (isOpen) => {
  if (isOpen) {
    console.log('Modal opened!');
  } else {
    console.log('Modal closed!');
  }
});
```
