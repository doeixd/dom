# Event Helpers

Higher-order functions for event handling.

## Why?
Common event patterns (preventing default, stopping propagation, filtering by key) require boilerplate. `Evt` provides composable helpers.

## API Reference

### `Evt`
Event helper functions.

```typescript
const Evt = {
  stop: (e: Event) => void,           // stopPropagation
  prevent: (e: Event) => void,        // preventDefault
  kill: (e: Event) => void,           // both stop and prevent
  key: (key: string) => (e: KeyboardEvent) => boolean,
  isSelf: (e: Event) => boolean       // target === currentTarget
};
```

## Examples

### Preventing Default
```typescript
import { Evt, on, find } from '@doeixd/dom';

const form = find('form');

on(form)('submit', (e) => {
  Evt.prevent(e);
  // Handle submission
});
```

### Key Filtering
```typescript
import { Evt, on, find } from '@doeixd/dom';

const input = find('input');

on(input)('keydown', (e) => {
  if (Evt.key('Enter')(e)) {
    console.log('Enter pressed!');
  }
});
```
