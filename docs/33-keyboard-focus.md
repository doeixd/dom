# Keyboard & Focus

Utilities for keyboard interactions and focus management.

## Why?
Building accessible, keyboard-friendly UIs requires handling key combinations and managing focus. These utilities simplify common patterns.

## API Reference

### `Key`
Keyboard utilities.

```typescript
const Key = {
  matches: (event: KeyboardEvent, key: string | string[] | ((key: string) => boolean)) => boolean,
  matches: (key: string | string[] | ((key: string) => boolean)) => (event: KeyboardEvent) => boolean,
  is: (target: EventTarget | null) => (key: string, handler: (e: KeyboardEvent) => void) => Unsubscribe,
  onTab: (target: EventTarget | null) => (handler: (e: KeyboardEvent) => void) => Unsubscribe,
  onArrow: (target: EventTarget | null) => (handler: (direction: 'Up' | 'Down' | 'Left' | 'Right', e: KeyboardEvent) => void) => Unsubscribe
};
```

### `Focus`
Focus management utilities.

```typescript
const Focus = {
  on: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => Unsubscribe,
  onBlur: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => Unsubscribe,
  onIn: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => Unsubscribe,
  onOut: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => Unsubscribe,
  trap: (container: HTMLElement | null) => Unsubscribe
};
```


## Examples

### Keyboard Shortcuts
```typescript
import { Key, on } from '@doeixd/dom';

on(document)('keydown', (e) => {
  if (Key.matches(e, (key) => key.toLowerCase() === 's') && e.ctrlKey) {
    e.preventDefault();
    console.log('Save shortcut!');
  }
});
```

### Tab and Arrow Handling
```typescript
import { Key } from '@doeixd/dom';

const stopTab = Key.onTab(document)((e) => {
  console.log('Tab pressed', e.shiftKey ? 'backwards' : 'forwards');
});

const stopArrow = Key.onArrow(document)((direction) => {
  console.log('Arrow direction:', direction);
});

// Later
stopTab();
stopArrow();
```

### Focus Trap (for Modals)
```typescript
import { Focus, find } from '@doeixd/dom';

const modal = find('.modal');
const releaseTrap = Focus.trap(modal);

// Later, when closing modal
releaseTrap();
```

