# Scroll & Focus

Utilities for scrolling and managing focus.

## Why?
`scrollIntoView` and `focus` are standard, but having them as safe, composable functions fits better with the library's philosophy.

## API Reference

### `scrollInto`
Scrolls an element into view.

```typescript
function scrollInto(
  el: Element | null, 
  arg?: boolean | ScrollIntoViewOptions
): void;
```

### `focus`
Focuses an element.

```typescript
function focus(el: HTMLElement | null, options?: FocusOptions): void;
```

### `blur`
Blurs (unfocuses) an element.

```typescript
function blur(el: HTMLElement | null): void;
```

## Examples

### Smooth Scroll to Element
```typescript
import { scrollInto, find } from '@doeixd/dom';

const section = find('#features');

scrollInto(section, { behavior: 'smooth', block: 'start' });
```

### Managing Focus
```typescript
import { focus, find } from '@doeixd/dom';

const input = find('input[name="email"]');

// Focus with options
focus(input, { preventScroll: true });
```
