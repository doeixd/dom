# Queue

Task queue for sequential async operations.

## Why?
When you need to ensure async operations run one at a time (e.g., animations, API calls), a queue prevents race conditions.

## API Reference

### `createQueue`
Creates a task queue.

```typescript
function createQueue(): Queue;
```

#### `Queue` Interface
```typescript
interface Queue {
  add: <T>(task: () => Promise<T>) => Promise<T>;
  clear: () => void;
  size: number;
}
```

## Examples

### Sequential Animations
```typescript
import { createQueue } from '@doeixd/dom';

const queue = createQueue();

queue.add(() => animateElement(el1));
queue.add(() => animateElement(el2));
queue.add(() => animateElement(el3));
// Runs one at a time
```
