# Functional Components (`component`, `Tag`, `Attr`)

JS-first components: the render function creates the DOM, state lives in plain
closure variables, and re-rendering is explicit.

> **Own the HTML? Use `component`. The server owns it? Use [`enhance`](29-components.md).**
> `enhance` attaches behavior to DOM that already exists (server-rendered,
> templates) and patches it fine-grained; `component` renders its own DOM and
> replaces — or, with the `morph` reconciler, patches — it on update.

## Why?
For dynamically spawned, self-contained widgets — counters, toasts, modals,
list items — you want to describe the view in JS and get a managed instance
(mount, update, events, cleanup) without a framework.

## API Reference

### `component`
```typescript
function component<P = void, Events extends ComponentEvents = ComponentEvents>(
  setup: (ctx: ComponentCtx<Events>, props: P) => () => Node | Node[],
  options?: {
    reconcile?: (from: Element, to: Element) => void; // morph instead of replace
    onError?: (error: unknown) => void;               // render threw: old DOM kept
  }
): (props: P) => ComponentHandle<Events>;
```

The setup function runs **once per instance**; it returns the render function.
`Events` maps event names to CustomEvent detail types (see typed events below).

#### `ComponentCtx<Events>`
```typescript
interface ComponentCtx<Events> {
  target: EventTarget;                       // the component's event bus
  signal: AbortSignal;                       // aborted on destroy — pass to fetch/listeners
  update: () => void;                        // queue a re-render (batched per microtask)
  event: <A, R>(fn: (...a: A) => R) => (...a: A) => R; // run fn, then update()
  dispatch: <K extends keyof Events>(type: K, detail: Events[K]) => boolean; // typed CustomEvent
  on: <K extends keyof Events>(type: K, fn: (e: CustomEvent<Events[K]>) => void) => Unsubscribe;
  child: {                                   // keep-alive child instances
    <T extends ComponentHandle>(key: string | number, create: () => T): T;
    <T extends ComponentHandle, P>(key: string | number, factory: (props: P) => T,
      props: P, update?: (handle: T, props: P) => void): T;
  };
  afterRender: (fn: (nodes: Node[]) => void) => Unsubscribe; // post-render hook (focus, measure)
  readonly last: Node[];                     // currently rendered nodes
}
```

#### `ComponentHandle<Events>`
```typescript
interface ComponentHandle<Events> {
  readonly nodes: Node[];        // rendered top-level nodes
  readonly el: HTMLElement | null; // first node (single-root convenience)
  mount: (parent: Element | string) => ComponentHandle<Events>; // selector ok; throws if missing
  update: () => void;            // batched re-render
  destroy: () => void;           // aborts ctx.signal, removes nodes
  // fires 'render' (untyped, via addEventListener) after every render
  on: <K extends keyof Events>(type: K, fn: (e: CustomEvent<Events[K]>) => void) => Unsubscribe;
  // Implements EventTarget (delegates to ctx.target):
  addEventListener; removeEventListener; dispatchEvent;
}
```

Update semantics: `update()` calls in the same task collapse into one render on
the next microtask, and are no-ops after `destroy()`. By default each render
**replaces** the previous nodes in place (position among siblings is
preserved); pass a `reconcile` option to morph instead (see below).

### Morphing updates — the `reconcile` option
By default, updating swaps the rendered subtree, so focus, selection, and
scroll state inside it are lost. Pass `reconcile` to keep the existing DOM and
morph it instead: each previously rendered top-level element whose tag matches
the new render at the same position is kept and passed to
`reconcile(from, to)` — `from` is the live element, `to` is the fresh render.
Non-matching nodes (different tag, non-elements) fall back to replacement, and
kept-alive `ctx.child` nodes are never reconciled against themselves.

A built-in zero-dependency reconciler is included — pass `morph`:

```typescript
import { component, morph, Tag } from '@doeixd/dom';

const Editor = component((ctx) => {
  let value = '';
  return () => Tag.div(
    Tag.input({ value, oninput: ctx.event(e => value = (e.target as HTMLInputElement).value) }),
    Tag.p(Attr.innerText(`${value.length} chars`))
  );
}, { reconcile: morph });
// The <input> keeps focus and caret position across re-renders.
```

`morph` syncs attributes, `Tag`/`Attr` listeners, and live form state
(`value`/`checked`/`selected` follow the new render — keep inputs controlled),
and matches children by `data-key` (or `id`) when present, else pairwise by
node type and tag. Give list items a `data-key` to survive reordering with
identity intact. `ctx.child` subtrees are treated as opaque and adopted
untouched. For fancier diffing, adapt a library instead (e.g. idiomorph):

```typescript
import { component, syncListeners, type Reconciler } from '@doeixd/dom';
import { Idiomorph } from 'idiomorph';

const idiomorphReconcile: Reconciler = (from, to) => Idiomorph.morph(from, to, {
  callbacks: {
    beforeNodeMorphed: (oldNode, newNode) => {
      if (oldNode instanceof Element && newNode instanceof Element) {
        syncListeners(oldNode, newNode);
      }
      return true;
    }
  }
});

component(setup, { reconcile: idiomorphReconcile });
```

#### Listener tracking — `syncListeners` / `getTrackedListeners`
Morph libraries copy attributes but not listeners, so a morphed element would
keep the previous render's handlers and never receive conditionally-added
ones. Every listener attached through `Tag`/`Attr` (props objects and
`Attr.on*`) is recorded on the element; `syncListeners(target, source)`
removes `target`'s tracked listeners and attaches `source`'s, leaving
listeners added directly via `addEventListener` untouched.
`getTrackedListeners(el)` exposes the record for custom reconcilers.

Note that handlers close over setup-scope variables, so even *without*
`syncListeners` stale handlers are often still semantically correct — sync
matters when handlers are conditional or capture render-scope values.

### `Tag`
Hyperscript factory with a modifier calling convention. `Tag.div(...args)`
creates a `<div>`; each argument is discriminated by type:

- `Node` / string / number → appended as a child
- a `ComponentHandle` → its rendered nodes are appended (component composition)
- function → an element modifier, called with the element (see `Attr`)
- plain object → props (same semantics as `Attr`, key by key)
- `null` / `undefined` / `false` → skipped; arrays → flattened

Known tag names return their concrete element type — `Tag.input()` is an
`HTMLInputElement`, no cast needed; unknown tags (custom elements) return
`HTMLElement`.

Complements [`h`](45-hyperscript.md) (props-first). Prefer `Tag` + `Attr` for
the curried, composition-friendly style used by `component`. The two systems
mix freely at the element level, but component composition and morph-time
listener syncing are `Tag`-only — see
[Templating Interop](51-templating-interop.md) for the exact boundaries.

### `Attr`
Any property access returns a curried setter `(value) => (el) => void`:

- `on*` keys with a function value attach a listener: `Attr.onclick(fn)`
- keys that exist on the element set the property: `Attr.innerText('Hi')`
- anything else sets an attribute; `true` → empty attr, `false`/`null` → removed

Typing: `on<event>` handlers get the right event type (`Attr.onclick` receives
a `MouseEvent`); known `HTMLElement` properties are checked against their
property type; and element-specific properties (`disabled`, `value`, `href`, …)
are both value-checked **and element-constrained** — the setter's return type
records which elements have that property, so `Tag.div(Attr.value('x'))` is a
compile error while `Tag.input(Attr.value('x'))` is fine. `data-*`/`aria-*`
accept anything. Props objects on `Tag` are typed per tag with excess-property
checking (`Tag.input({ value: 3 })` and `{ innrText: 'typo' }` are compile
errors).

### `Style`
Curried, type-safe style modifiers for use with `Tag` — inline styles plus a
scoped-stylesheet layer for everything inline styles can't express.

#### Inline styles
```typescript
Tag.div(
  Style.color('red'),                                  // property access — curried setter
  Style({ 'background-color': 'red', opacity: 0.5 }),  // callable — props object
  Style(baseStyles, overrides),                        // composition: merged left-to-right
  Style({ '--accent': '#f00', width: size })           // custom props; JS variables just work
)
```

- camelCase names are checked against `CSSStyleDeclaration` — `Style.colr('red')`
  and `Style({ colr: 'red' })` are compile errors; common enum properties
  (`display`, `position`, `cursor`, …) get literal-value autocomplete.
- Numbers get `px` (`Style.width(200)` → `'200px'`) except unitless properties
  (`opacity`, `zIndex`, `flex`, `lineHeight`, …). `0` stays bare.
- Kebab-case and `--custom-property` keys pass through `style.setProperty`;
  `null` removes a declaration.

#### Scoped styles — `Style.scope`
Compiles nested rules into a shared `<style data-doeixd-dom>` sheet under a
generated unique class and returns a modifier that adds the class. Rules are
injected once, on first application (creation is SSR-safe):

```typescript
const card = Style.scope({
  padding: 16,
  '--accent': '#f00',
  '&:hover':  { backgroundColor: 'var(--accent)' },   // & = the generated class
  '& > h2':   { margin: 0 },
  '@media (max-width: 600px)': { padding: 8 },
  '@supports (display: grid)': { display: 'grid' },
  '@layer utilities': { '&.raised': { boxShadow: '0 2px 8px #0003' } }
});

Tag.div(card, Tag.h2('Title'));
```

Keys are typed: declarations as in inline styles, `'&...'` for selector
nesting, `'@...'` for (nestable) at-rules — anything else is a compile error.

#### Animations — `Style.keyframes`
Registers `@keyframes` in the shared sheet and returns the animation name.
Steps are typed as `from` / `to` / `'NN%'`:

```typescript
const spin = Style.keyframes({
  from: { rotate: '0deg' },
  '50%': { opacity: 0.5 },
  to:   { rotate: '360deg' }
});

Tag.div(Style.animationName(spin), Style.animationDuration('1s'));
```

## Examples

### Counter
```typescript
import { component, Tag, Attr } from '@doeixd/dom';

const Counter = component((ctx) => {
  let count = 0;
  return () => Tag.div(
    Tag.button(Attr.onclick(ctx.event(() => count += 1)), Attr.innerText('Inc')),
    Tag.div(Attr.innerText(String(count))),
    Tag.button({ onclick: ctx.event(() => count -= 1), innerText: 'Dec' })
  );
});

const counter = Counter();
counter.mount(document.body);
counter.update();  // manual re-render (batched)
counter.destroy(); // aborts ctx.signal, removes nodes
```

### Component events (typed)
Declare an event map (name → CustomEvent detail type) as the second generic
to get a typed `ctx.dispatch` and a typed `handle.on`:

```typescript
type PickerEvents = { pick: { value: number }; clear: undefined };

const Picker = component<void, PickerEvents>((ctx) => {
  return () => Tag.button(
    Attr.onclick(() => ctx.dispatch('pick', { value: 42 })), // detail type checked
    Attr.innerText('Pick')
  );
});

const picker = Picker().mount(document.body);
const off = picker.on('pick', (e) => {
  console.log(e.detail.value); // e: CustomEvent<{ value: number }> — 42
});
// picker.on('nope', ...)      — compile error: unknown event
// ctx.dispatch('pick')        — compile error: missing detail
off(); // listeners are also removed automatically on destroy
```

The untyped `addEventListener`/`dispatchEvent` remain available (the handle
implements the EventTarget interface).

### Cleanup via `ctx.signal`
```typescript
const Clock = component((ctx) => {
  let now = new Date();
  const id = setInterval(ctx.event(() => now = new Date()), 1000);
  ctx.signal.addEventListener('abort', () => clearInterval(id));

  window.addEventListener('focus', ctx.event(() => now = new Date()), { signal: ctx.signal });

  return () => Tag.time(Attr.innerText(now.toLocaleTimeString()));
});
```

### Child components — `ctx.child` (keep-alive)
Calling a component factory inside render creates a **new instance every
render** (state reset) and leaks the old one (its `ctx.signal` never aborts).
Use `ctx.child(key, create)` instead: `create` runs once per key, later renders
return the cached handle, so the child's state and DOM survive parent updates —
its live nodes are simply re-appended into the new tree.

```typescript
const TodoList = component((ctx) => {
  let todos = [{ id: 1, text: 'a' }, { id: 2, text: 'b' }];
  return () => Tag.ul(
    todos.map(t => ctx.child(t.id, () => TodoItem({ todo: t })))
  );
});
```

For prop-driven children, use the factory form —
`ctx.child(key, Factory, props, update?)`. `Factory(props)` runs once; on
later renders the `update` callback receives the cached handle and the new
props. When `update` is omitted and both props are objects, the default
shallow-assigns the new props into the object the child's setup received
(setup closures read through it) and calls `handle.update()`:

```typescript
return () => Tag.ul(
  todos.map(t => ctx.child(t.id, TodoItem, { todo: t }))
);
// TodoItem's render reads props.todo — it sees the new value after each parent render
```

Lifecycle rules:
- A cached child whose key is **not requested** during a render is destroyed
  and evicted after that render (conditionals and list removals clean up
  automatically).
- Children created **during setup** (outside a render pass) are pinned — never
  auto-evicted, even in renders that don't include them.
- All cached children are destroyed when the parent is destroyed.

With the two-argument `create` form, the closure runs once — so don't capture
changing values in it; use the factory form above for changing props, keep
shared state in the parent's closure and read it from the child via functions,
or communicate through events.

In development (`NODE_ENV !== 'production'`), instantiating a component
factory directly inside a render function logs a one-time warning pointing at
`ctx.child`, since that pattern resets child state every render and leaks the
previous instance.

### Props
```typescript
const Greeting = component<{ name: string }>((_ctx, props) => {
  return () => Tag.p(Attr.innerText(`Hello ${props.name}`));
});

Greeting({ name: 'Pat' }).mount(document.body);
```

Props are fully typed: `Greeting()` and `Greeting({ name: 7 })` are compile
errors. The same checking applies through `ctx.child(key, Greeting, props)` —
including excess-property checks, so a typo'd prop key fails to compile.

### Render lifecycle — `afterRender`, the `render` event, `onError`

**`ctx.afterRender(fn)`** runs after every render (including the initial one)
with the freshly rendered nodes — the place for focus management, measuring,
or initializing third-party widgets. It returns an unsubscribe function.

```typescript
const SearchBox = component((ctx) => {
  let editing = false;
  ctx.afterRender((nodes) => {
    if (editing) (nodes[0] as HTMLElement).querySelector('input')?.focus();
  });
  return () => Tag.div(
    editing
      ? Tag.input({ onblur: ctx.event(() => editing = false) })
      : Tag.button({ onclick: ctx.event(() => editing = true), innerText: 'Search…' })
  );
});
```

**The `'render'` event** fires on the handle's event bus after every render.
Since replace-mode updates swap `handle.nodes`, integrations that hold node
references can use it to re-read them:

```typescript
const c = Widget().mount('#app');
c.addEventListener('render', () => syncSomething(c.nodes));
```

**`onError`** makes render failures recoverable. Without it, a throwing render
propagates (from an unhandled microtask, when the update was batched). With it,
the error is reported, the previous DOM and all kept-alive children stay
intact, and a later `update()` renders normally:

```typescript
const Risky = component((ctx) => {
  return () => renderThatMightThrow();
}, {
  onError: (err) => console.error('render failed, keeping last good DOM', err)
});
```

## Notes & Limitations
- **Replace by default**: without a `reconcile` option, each update swaps the
  rendered subtree, so focus, selection, and scroll state inside the
  component's nodes are not preserved. Pass `reconcile` (see above) to morph
  instead, or for fine-grained updates over existing DOM use
  [`enhance`](29-components.md) or the [binder](48-binder.md).
- **`cloneNode` is not a shortcut**: cloning copies markup but silently drops
  event listeners (and the listener-tracking record), so it can't keep
  children alive or speed up re-renders of interactive DOM. Caching the actual
  node (via `ctx.child` or setup scope) is both faster and correct.
- Renamed in 0.0.9: the old `component` (typed `data-ref` gatherer) is now
  [`refsOf`](29-components.md); `defineComponent` → `enhance`;
  `mountComponent` → `spawn` (deprecated aliases remain for one release).
