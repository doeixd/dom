# Event Helpers

Higher-order functions for event handling.

## Why?
Common event patterns (preventing default, stopping propagation, filtering by key) require boilerplate. `Evt` provides composable helpers.

## API Reference

### `Evt`
Event helper functions.

```typescript
const Evt = {
  stop: <E extends Event>(fn?: (e: E) => void) => (e: E) => void,
  prevent: <E extends Event>(fn?: (e: E) => void) => (e: E) => void,
  kill: <E extends Event>(fn?: (e: E) => void) => (e: E) => void,
  key: (keyOrKeys: string | string[], fn: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => void,
  isSelf: (e: Event) => boolean,
  pointer: (e: MouseEvent | TouchEvent | Event) => { x: number; y: number }
};
```


## Examples

### Preventing Default
```typescript
import { Evt, on, find } from '@doeixd/dom';

const form = find('form');

on(form)('submit', Evt.prevent((e) => {
  // Handle submission
}));
```

### Stop + Prevent
```typescript
import { Evt, on, find } from '@doeixd/dom';

const form = find('form');

on(form)('submit', Evt.kill((e) => {
  // Handle submission without bubbling
}));
```

### Key Filtering
```typescript
import { Evt, on, find } from '@doeixd/dom';

const input = find('input');

on(input)('keydown', Evt.key('Enter', () => {
  console.log('Enter pressed!');
}));
```

### Pointer Coordinates
```typescript
import { Evt, on, find } from '@doeixd/dom';

const panel = find('.panel');

on(panel)('pointermove', (e) => {
  const { x, y } = Evt.pointer(e);
  console.log(x, y);
});
```

