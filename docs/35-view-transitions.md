# View Transitions

Utilities for the View Transitions API.

## Why?
The View Transitions API enables smooth transitions between DOM states. These utilities simplify using this modern browser feature.

## API Reference

### `ViewTransitions`
View Transitions utilities.

```typescript
const ViewTransitions = {
  supported: boolean,
  transition: (callback: () => void | Promise<void>) => Promise<void>,
  named: (name: string, callback: () => void | Promise<void>) => Promise<void>
};
```

## Examples

### Basic Transition
```typescript
import { ViewTransitions, modify, find } from '@doeixd/dom';

const box = find('.box');

await ViewTransitions.transition(() => {
  modify(box)({ class: { expanded: true } });
});
```

### Named Transition
```typescript
import { ViewTransitions } from '@doeixd/dom';

await ViewTransitions.named('slide-in', () => {
  // DOM updates
});
```
