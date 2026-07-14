# Functional Components (`component`, `Tag`, `Attr`)

JS-first components: the render function creates the DOM, state lives in plain
closure variables, and re-rendering is explicit.

> **Own the HTML? Use `component`. The server owns it? Use [`enhance`](29-components.md).**
> `enhance` attaches behavior to DOM that already exists (server-rendered,
> templates) and patches it fine-grained; `component` renders its own DOM and
> replaces it on update.

## Why?
For dynamically spawned, self-contained widgets — counters, toasts, modals,
list items — you want to describe the view in JS and get a managed instance
(mount, update, events, cleanup) without a framework.

## API Reference

### `component`
```typescript
function component<P = void, Events extends ComponentEvents = ComponentEvents>(
  setup: (ctx: ComponentCtx<Events>, props: P) => () => Node | Node[]
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
  readonly last: Node[];                     // currently rendered nodes
}
```

#### `ComponentHandle<Events>`
```typescript
interface ComponentHandle<Events> {
  readonly nodes: Node[];        // rendered top-level nodes
  readonly el: HTMLElement | null; // first node (single-root convenience)
  mount: (parent: Element) => ComponentHandle<Events>;
  update: () => void;            // batched re-render
  destroy: () => void;           // aborts ctx.signal, removes nodes
  on: <K extends keyof Events>(type: K, fn: (e: CustomEvent<Events[K]>) => void) => Unsubscribe;
  // Implements EventTarget (delegates to ctx.target):
  addEventListener; removeEventListener; dispatchEvent;
}
```

Update semantics: `update()` calls in the same task collapse into one render on
the next microtask, and are no-ops after `destroy()`. Each render **replaces**
the previous nodes in place (position among siblings is preserved).

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
the curried, composition-friendly style used by `component`.

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

### Props
```typescript
const Greeting = component<{ name: string }>((_ctx, props) => {
  return () => Tag.p(Attr.innerText(`Hello ${props.name}`));
});

Greeting({ name: 'Pat' }).mount(document.body);
```

## Notes & Limitations
- **Replace, not morph**: each update swaps the rendered subtree, so focus,
  selection, and scroll state inside the component's nodes are not preserved.
  For state-preserving fine-grained updates over existing DOM, use
  [`enhance`](29-components.md) or the [binder](48-binder.md).
- Renamed in 0.0.9: the old `component` (typed `data-ref` gatherer) is now
  [`refsOf`](29-components.md); `defineComponent` → `enhance`;
  `mountComponent` → `spawn` (deprecated aliases remain for one release).
