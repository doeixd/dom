# Store

DOM-backed reactive state using `data-*` attributes.

## Why?
Sometimes you want state to persist in the DOM itself. `store` creates a Proxy that syncs properties with `data-*` attributes, enabling 2-way binding.

## API Reference

### `store`
Creates a reactive store backed by an element's dataset.

```typescript
function store<T extends Record<string, any>>(
  element: HTMLElement | null
): T & EventTarget;
```

#### Features
- Reading properties reads from `data-*` attributes
- Writing properties updates `data-*` attributes
- Emits events on changes (extends `EventTarget`)

## Examples

### Basic Usage
```typescript
import { store, find } from '@doeixd/dom';

const box = find('.box');
const state = store<{ count: number }>(box);

state.count = 5;
// DOM now has: <div class="box" data-count="5">

console.log(state.count); // 5
```

### Listening to Changes
```typescript
import { store, find } from '@doeixd/dom';

const el = find('#app');
const state = store<{ theme: string }>(el);

state.addEventListener('theme', (e: CustomEvent) => {
  console.log('Theme changed to:', e.detail);
});

state.theme = 'dark'; // Triggers event
```
