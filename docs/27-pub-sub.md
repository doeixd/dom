# Pub/Sub (Event Bus)

A lightweight, type-safe event bus.

## Why?
Decoupling components is essential for scalable architecture. `createBus` provides a simple way for components to communicate without direct references.

## API Reference

### `createBus`
Creates a typed event bus.

```typescript
function createBus<Events extends Record<string, any>>(): EventBus<Events>;
```

#### `EventBus` Interface
```typescript
interface EventBus<Events> {
  on: <K extends keyof Events>(event: K, handler: (data: Events[K]) => void) => Unsubscribe;
  emit: <K extends keyof Events>(event: K, data: Events[K]) => void;
  once: <K extends keyof Events>(event: K, handler: (data: Events[K]) => void) => void;
}
```

## Examples

### Creating and Using a Bus
```typescript
import { createBus } from '@doeixd/dom';

// Define event types
interface AppEvents {
  'user:login': { id: number; name: string };
  'theme:change': 'light' | 'dark';
}

const bus = createBus<AppEvents>();

// Subscribe
bus.on('user:login', (user) => {
  console.log('Welcome,', user.name);
});

// Emit
bus.emit('user:login', { id: 1, name: 'Alice' });
```
