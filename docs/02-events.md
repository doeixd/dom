# Events

Type-safe, composable event handling with automatic cleanup.

## Why?
`addEventListener` is verbose and returns `void`, making cleanup difficult (you have to keep references to handler functions). It also lacks built-in delegation support.

The events module provides:
- **Unsubscribe Functions**: `on()` returns a function that removes the listener.
- **Delegation**: `onDelegated` simplifies handling events on dynamic children.
- **Type Safety**: Infers event types based on the element and event name.

## API Reference

### `on`
Attaches an event listener.

```typescript
// Signature
function on<T extends EventTarget, K extends keyof HTMLElementEventMap>(
  target: T | null,
  eventType: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): Unsubscribe;

// Curried
function on<T extends EventTarget>(target: T | null): 
  <K extends keyof HTMLElementEventMap>(
    eventType: K, 
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) => Unsubscribe;
```

#### Parameters
- `target`: The element to listen on.
- `eventType`: The event name (e.g., `'click'`, `'input'`).
- `handler`: The callback function.
- `options`: Standard `addEventListener` options.

#### Returns
- `Unsubscribe`: A function that removes the listener.

### `onDelegated`
Attaches a delegated event listener (listens on parent, fires for matching children).

```typescript
// Signature
function onDelegated<S extends string, K extends keyof HTMLElementEventMap>(
  target: HTMLElement | null,
  selector: S,
  eventType: K,
  handler: (e: HTMLElementEventMap[K], target: ParseSelector<S>) => void,
  options?: boolean | AddEventListenerOptions
): Unsubscribe;
```

#### Parameters
- `target`: The parent element to listen on.
- `selector`: CSS selector for the children to match.
- `eventType`: The event name.
- `handler`: Callback receiving the event and the matching child element.

#### Returns
- `Unsubscribe`: A function that removes the listener.

### `dispatch`
Dispatches a custom event.

```typescript
// Signature
function dispatch<T extends any>(
  target: EventTarget | null,
  eventType: string,
  detail?: T,
  options?: EventInit
): void;
```

## Examples

### Basic Event Listener
```typescript
import { on } from '@doeixd/dom';

const btn = document.querySelector('button');

const cleanup = on(btn)('click', (e) => {
  console.log('Clicked!', e);
});

// Later...
cleanup(); // Removes listener
```

### Delegated Events
Useful for lists where items are added/removed dynamically.

```typescript
import { onDelegated } from '@doeixd/dom';

const list = document.querySelector('ul');

onDelegated(list, 'li.item', 'click', (e, target) => {
  // 'target' is the <li> element, even if you clicked a span inside it
  console.log('Clicked item:', target.textContent);
});
```

### Custom Events
```typescript
import { dispatch, on } from '@doeixd/dom';

const box = document.querySelector('.box');

// Listen
on(box)('my-event', (e: CustomEvent) => {
  console.log('Data:', e.detail);
});

// Dispatch
dispatch(box, 'my-event', { some: 'data' });
```
