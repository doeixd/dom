# Cleanup

Utilities for managing cleanup and preventing memory leaks.

## Why?
In SPAs and dynamic applications, failing to remove event listeners or stop intervals can lead to memory leaks. `stripListeners` and `instantiate` help manage this lifecycle.

## API Reference

### `stripListeners`
Removes all event listeners attached via `on` from an element (and optionally its children).
*Note: This only works for listeners attached with this library's `on` function.*

```typescript
function stripListeners(element: HTMLElement | null, recursive?: boolean): void;
```

### `instantiate`
Creates an instance of a component/template and provides a destroy method.

```typescript
function instantiate<T>(
  factory: () => T, 
  cleanup?: (instance: T) => void
): { instance: T, destroy: () => void };
```

### `cloneMany`
Clones an element multiple times.

```typescript
function cloneMany<T extends Node>(node: T, count: number): T[];
```

## Examples

### Cleaning up a Component
```typescript
import { on, stripListeners, find } from '@doeixd/dom';

const modal = find('.modal');

on(modal)('click', () => { /* ... */ });

// Later, before removing modal
stripListeners(modal, true); // Recursive cleanup
modal.remove();
```
