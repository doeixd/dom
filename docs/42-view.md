# View

Factory pattern for creating maintainable "hard way" views.

## Why?
When building components without a framework, organizing refs, events, and bindings can get messy. `view`, `binder`, `bindEvents`, and `apply` provide structure.

## API Reference

### `view`
Creates a view factory from HTML.

```typescript
function view<K extends string>(htmlString: string): ViewFactory<K>;
```

### `binder`
Generates typed UI updaters from refs.

```typescript
function binder<R>(refs: R): <S>(schema: S) => BoundSetters<S>;
```

### `bindEvents`
Attaches multiple event listeners to refs.

```typescript
function bindEvents<R>(refs: R): (map: EventSchema<R>) => Unsubscribe;
function bindEvents<R>(refs: R, map: EventSchema<R>): Unsubscribe;
```

### `apply`
Connects data to UI setters.

```typescript
function apply<S>(setters: S): (data: InferData<S>) => void;
function apply<S>(setters: S, data: InferData<S>): void;
```

## Examples

### Complete View Pattern
```typescript
import { view, binder, bindEvents, bind } from '@doeixd/dom';

// 1. Define template
const CardView = view<'title' | 'content' | 'btn'>(`
  <div class="card">
    <h2 data-ref="title"></h2>
    <p data-ref="content"></p>
    <button data-ref="btn">Click</button>
  </div>
`);

// 2. Create instance
const { root, refs } = CardView();

// 3. Define UI updaters
const ui = binder(refs)({
  title: bind.text,
  content: bind.text
});

// 4. Bind events
const cleanup = bindEvents(refs)({
  btn: {
    click: () => console.log('Clicked!')
  }
});

// 5. Update UI
apply(ui)({
  title: 'Hello',
  content: 'World'
});

// 6. Cleanup
cleanup();
```
