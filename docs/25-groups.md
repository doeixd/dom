# Groups (Listener Groups)

Manage multiple event listeners and cleanups as a single unit.

## Why?
Manually tracking every `Unsubscribe` function for a component is tedious. `createListenerGroup` collects them all and allows you to clear them with one call.

## API Reference

### `createListenerGroup`
Creates a manager for grouping cleanups.

```typescript
function createListenerGroup(): ListenerGroup;
```

#### `ListenerGroup` Interface
```typescript
interface ListenerGroup {
  // Add a cleanup function (e.g., return value of on())
  add: (fn: Unsubscribe) => void;
  
  // Execute all cleanup functions and clear the group
  clear: () => void;
}
```

## Examples

### Component Cleanup
```typescript
import { createListenerGroup, on, find } from '@doeixd/dom';

const group = createListenerGroup();
const btn = find('button');
const input = find('input');

// Add listeners to the group
group.add(on(btn)('click', handleClick));
group.add(on(input)('input', handleInput));

// Later, when component unmounts
group.clear(); // Removes both listeners
```
