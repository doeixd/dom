# Cycling

State machine utilities for cycling through classes.

## Why?
Common UI patterns involve cycling through a set of states (e.g., a carousel, a toggle button with 3 states). `cycleClass` simplifies this logic.

## API Reference

### `cycleClass`
Cycles through a list of classes on an element.

```typescript
function cycleClass(
  element: HTMLElement | null, 
  classes: string[], 
  callback?: (activeClass: string) => void
): void;
```

#### Parameters
- `element`: The target element.
- `classes`: An array of class names to cycle through.
- `callback` (Optional): Function called with the new active class.

#### Behavior
- Finds the first class from the list that is currently present on the element.
- Removes it and adds the next class in the list.
- If the last class is active, it loops back to the first.
- If none are active, it adds the first class.

## Examples

### Toggle Button
```typescript
import { cycleClass, on, find } from '@doeixd/dom';

const themeBtn = find('#theme-toggle');
const themes = ['light', 'dark', 'auto'];

on(themeBtn)('click', () => {
  cycleClass(document.body, themes, (newTheme) => {
    console.log('Switched to:', newTheme);
  });
});
```
