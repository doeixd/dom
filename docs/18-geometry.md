# Geometry

Utilities for element dimensions and positioning.

## Why?
`getBoundingClientRect` is the standard way to get dimensions, but it returns a complex object. These wrappers provide simpler access to common metrics and visibility checks.

## API Reference

### `rect`
Gets the bounding client rect of an element.

```typescript
function rect(el: Element | null): DOMRect | null;
```

### `offset`
Gets the element's offset position relative to its offset parent.

```typescript
function offset(el: HTMLElement | null): { top: number, left: number } | null;
```

### `isVisible`
Checks if an element is visible (partially or fully) in the viewport.

```typescript
function isVisible(el: Element | null, fully?: boolean): boolean;
```

## Examples

### Checking Visibility
```typescript
import { isVisible, find } from '@doeixd/dom';

const ad = find('.ad-banner');

if (isVisible(ad)) {
  console.log('Ad is visible, tracking impression...');
}
```

### Getting Dimensions
```typescript
import { rect, find } from '@doeixd/dom';

const box = find('.box');
const dimensions = rect(box);

if (dimensions) {
  console.log(`Width: ${dimensions.width}, Height: ${dimensions.height}`);
}
```
