# Components

Component utilities for organizing and managing DOM elements.

## Why?
Organizing related elements and logic into components improves maintainability. These utilities provide patterns for creating reusable, self-contained UI components.

## API Reference

### `component`
Transforms a DOM tree into a component object by mapping `data-ref` nodes.

```typescript
function component<T extends Record<string, HTMLElement>>(
  rootOrSelector: HTMLElement | string | null
): T & { root: HTMLElement | null };
```

### `$$`
Wraps multiple elements for batch operations.

```typescript
function $$(selectorOrList: string | Element[] | NodeListOf<Element>): BatchWrapper;
```

### `defineComponent`
Creates a reactive, self-cleaning component with setup pattern (similar to Vue 3 Composition API).

```typescript
function defineComponent<API, R, G, S>(
  target: string | HTMLElement | null,
  setup: (ctx: ComponentContext<R, G, S>) => API | void
): ComponentInstance<API> | null;
```

### `mountComponent`
Spawns a component dynamically (useful for modals, toasts, etc.).

```typescript
function mountComponent<API>(
  templateFn: () => { root: HTMLElement | DocumentFragment },
  componentFn: (root: HTMLElement) => ComponentInstance<API> | null,
  target: HTMLElement
): ComponentInstance<API> & { destroy: () => void };
```

## Examples

### Simple Component
```typescript
import { component } from '@doeixd/dom';

const card = component<{
  title: HTMLElement;
  content: HTMLElement;
  btn: HTMLButtonElement;
}>('#card');

card.title.textContent = 'Hello';
card.btn.addEventListener('click', () => {
  console.log('Clicked!');
});
```

### Batch Operations
```typescript
import { $$ } from '@doeixd/dom';

$$('.item')
  .modify({ class: { active: true } })
  .css({ opacity: '1' });
```

### Reactive Component
```typescript
import { defineComponent } from '@doeixd/dom';

const Counter = defineComponent('#app', (ctx) => {
  ctx.state.count = 0;

  const ui = ctx.binder({
    display: bind.text
  });

  ctx.bindEvents({
    btn: {
      click: () => ctx.state.count++
    }
  });

  ctx.watch('count', (val) => {
    ui.display(String(val));
  });

  return {
    increment: () => ctx.state.count++,
    reset: () => ctx.state.count = 0
  };
});

Counter?.increment();
```
