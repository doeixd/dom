# Manipulation

Declarative and functional DOM manipulation.

## Why?
Directly setting properties on DOM elements is imperative and verbose. `modify` allows you to set multiple properties, attributes, styles, and classes in a single, declarative call.

## API Reference

### `modify`
Updates an element's properties, attributes, styles, and content.

```typescript
// Signature
function modify<T extends HTMLElement>(element: T | null, props: ElementProps): T | null;
function modify<T extends HTMLElement>(props: ElementProps): (element: T | null) => T | null;
```

#### `ElementProps` Interface
```typescript
interface ElementProps {
  text?: string;           // textContent
  html?: string;           // innerHTML
  value?: string | number; // input value
  disabled?: boolean;      // disabled attribute
  class?: Record<string, boolean>; // Class toggling
  style?: Partial<CSSStyleDeclaration>; // Inline styles
  attr?: Record<string, string | number | boolean | null>; // Attributes
  dataset?: Record<string, string | number | boolean | null>; // data-* attributes
  [key: string]: any;      // Any other property
}
```

### `css`
Applies inline styles to an element.

```typescript
// Signature
function css(element: HTMLElement | null, styles: Partial<CSSStyleDeclaration>): HTMLElement | null;
```

### `tempStyle`
Applies styles temporarily, then reverts them after a delay. Useful for visual feedback.

```typescript
// Signature
function tempStyle(
  element: HTMLElement | null, 
  styles: Partial<CSSStyleDeclaration>, 
  ms?: number
): void;
```

## Examples

### Declarative Modification
```typescript
import { modify, find } from '@doeixd/dom';

const btn = find('button');

modify(btn)({
  text: 'Loading...',
  disabled: true,
  class: {
    'is-loading': true,
    'btn-primary': true
  },
  style: {
    opacity: '0.5'
  },
  dataset: {
    status: 'processing'
  }
});
```

### Functional Composition
```typescript
import { modify, find } from '@doeixd/dom';

const setComplete = modify({
  class: { complete: true },
  text: 'Done!'
});

const items = document.querySelectorAll('.item');
items.forEach(setComplete);
```

### Temporary Styles
```typescript
import { tempStyle, find } from '@doeixd/dom';

const box = find('.box');

// Flash red for 500ms
tempStyle(box, { backgroundColor: 'red' }, 500);
```
