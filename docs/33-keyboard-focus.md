# Keyboard & Focus

Utilities for keyboard interactions and focus management.

## Why?
Building accessible, keyboard-friendly UIs requires handling key combinations and managing focus. These utilities simplify common patterns.

## API Reference

### `Key`
Keyboard utilities.

```typescript
const Key = {
  is: (e: KeyboardEvent, key: string) => boolean,
  combo: (e: KeyboardEvent, keys: string[]) => boolean,
  modifiers: (e: KeyboardEvent) => { ctrl: boolean, shift: boolean, alt: boolean, meta: boolean }
};
```

### `Focus`
Focus management utilities.

```typescript
const Focus = {
  trap: (container: HTMLElement) => Unsubscribe,
  restore: (el: HTMLElement) => () => void,
  next: (from?: HTMLElement) => void,
  prev: (from?: HTMLElement) => void
};
```

## Examples

### Keyboard Shortcuts
```typescript
import { Key, on } from '@doeixd/dom';

on(document)('keydown', (e) => {
  if (Key.combo(e, ['ctrl', 's'])) {
    e.preventDefault();
    console.log('Save shortcut!');
  }
});
```

### Focus Trap (for Modals)
```typescript
import { Focus, find } from '@doeixd/dom';

const modal = find('.modal');
const releaseTrap = Focus.trap(modal);

// Later, when closing modal
releaseTrap();
```
