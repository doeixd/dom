# Signals Views (`@doeixd/dom/signals`)

A fine-grained reactive view system, shipped as its own subpath entry. Views
are built once as lightweight descriptions; reactivity lives in per-part
bindings, so there is no re-render and no diffing — only leaf values change.

```typescript
import { signal, tag, text, attr, cls, list, mount } from '@doeixd/dom/signals';

const user = signal({ name: 'Alice', role: 'admin' });
const items = signal(['one', 'two']);

const view = tag('div')(
  attr('data-role', () => user.value.role),
  cls({ admin: () => user.value.role === 'admin' }),
  tag('h1')(text(() => `Hello, ${user.value.name}!`)),
  tag('ul')(list(() => items.value, item => tag('li')(text(item)), item => item))
);

const { element, cleanup } = mount(view, document.body);
user.value = { name: 'Bob', role: 'user' };   // patches in place, synchronously
```

> **Naming:** several exports (`text`, `attr`, `on`, `mount`, `list`, `tags`,
> `render`) intentionally share names with *different* APIs on the main
> entry. Import from one entry per file, or alias:
> `import { mount as mountView } from '@doeixd/dom/signals'`.

## Concepts

### Reactive values
Anywhere a value is expected you may pass a static value, a signal, or a
getter: `Reactive<T> = T | ReadonlySignal<T> | (() => T)`. Getters are
dependency-tracked — `() => user.value.name` re-runs when `user` changes.

### Parts — bindings with a manual override
Each factory (`text`, `attr`, `attrs`, `prop`, `cls`, `style`, `on`, `ref`)
creates a **part**: a binding that auto-updates from its reactive source but
can also be overridden imperatively:

```typescript
const label = text(() => status.value);
const view = tag('span')(label);

label.set('Saving…');   // manual override — reactivity paused for this part
label.reset();          // back to the reactive source
```

`cls` and `style` parts track overrides **per key**, so you can pin one class
while the rest stay reactive.

### View builders
`tag('div')(...parts, ...children)` returns a plain description object (not a
DOM node). Also: `tags.div(...)` proxy sugar, `textNode()`, `fragment()`,
`portal(target, ...children)`, and:

- **`when(condition, then, else?)`** — conditional. Each toggle **destroys**
  the inactive branch (cleanups run) and rebuilds the other; branches do not
  keep state while hidden. Lift state that must survive into signals above
  the `when`.
- **`list(items, render, key?)`** — keyed list. Existing items are **moved,
  never re-rendered** (their bindings keep running), removed items run their
  cleanups, and reordering performs the minimal number of DOM moves (longest
  increasing subsequence — moving one item to the front of an n-item list is
  one move; an unchanged list performs zero moves).

### Mount and cleanup
`mount(view, container)` / `render(view)` create the real DOM, bind every
part, and return a single `cleanup` that tears down all bindings. There is no
update method — updates happen through signals.

## Interop with the main entry

Mounted view nodes are **branded opaque**: the main entry's
[`morph`](49-component.md) reconciler adopts them wholesale instead of
morphing into them, so a signals view can sit inside a morph-reconciled
`component` and keep its bindings alive. The subtree is still managed
exclusively by its own cleanup — don't hand-edit it with `modify`/`Attr` and
expect parts to know. See [Templating Interop](51-templating-interop.md).

## When to use which

- **`component` + `Tag`**: explicit updates, closure state, morphing, typed
  events — best for self-contained widgets and imperative control.
- **Signals views**: shared reactive state driving many small DOM bindings —
  best when updates are frequent and fine-grained (dashboards, live values).
- They compose: mount a signals view inside a component's DOM (safe under
  morph), or drive both from the same signals.
