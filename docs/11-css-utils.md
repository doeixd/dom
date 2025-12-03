# CSS Utils

Utilities for working with CSS variables, computed styles, and dynamic style injection.

## Why?
Reading computed styles or managing CSS variables usually involves `getComputedStyle` which is verbose. These utilities simplify CSS interactions.

## API Reference

### `CssVar`
Get or set CSS variables.

```typescript
const CssVar = {
  get: (el: HTMLElement | null, prop: string) => string,
  set: (el: HTMLElement | null, prop: string, val: string) => void
};
```

### `computed`
Get computed style value.

```typescript
function computed(el: Element | null, prop: string): string;
```

### `injectStyles`
Injects a global stylesheet into the head.

```typescript
function injectStyles(id: string, css: string): void;
```

### `waitTransition`
Waits for a CSS transition to complete on an element.

```typescript
function waitTransition(el: HTMLElement | null): Promise<void>;
```

## Examples

### CSS Variables
```typescript
import { CssVar, find } from '@doeixd/dom';

const root = document.documentElement;

// Set theme color
CssVar.set(root, '--primary-color', '#ff0000');

// Get value
const color = CssVar.get(root, '--primary-color');
```

### Waiting for Transition
```typescript
import { waitTransition, cls, find } from '@doeixd/dom';

const menu = find('.menu');

async function closeMenu() {
  cls.remove(menu, 'open');
  await waitTransition(menu);
  menu.style.display = 'none';
}
```
