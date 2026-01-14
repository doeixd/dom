[![Bundlejs](https://deno.bundlejs.com/badge?q=@doeixd/dom&treeshake=[*])](https://deno.bundlejs.com/?q=@doeixd/dom&treeshake=[*])
[![npm version](https://img.shields.io/npm/v/@doeixd/dom)](https://www.npmjs.com/package/@doeixd/dom)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/doeixd/dom)

<br /> 

# DOM


A modern utility library for the DOM and frontend development. It's a collection of type-safe, composable functions for the 80% of tasks you do every day, without the overhead of a framework.

**Key Features:**
*   **Lightweight & Zero-Dependency:** Tiny and tree-shakeable.
*   **Type-Safe by Default:** Automatically infers element and event types from your code.
*   **Null-Safe:** Stop writing `if (element)` checks. Functions handle missing elements gracefully.
*   **Composable by Design:** Small, focused utilities that work together seamlessly.

<br />

## Installation

```bash
npm install @doeixd/dom
```

### Or With ESM.sh (No Build Step)
Use directly in the browser without npm or build tools:

```html
<script type="module">
  // Import only what you need - automatic tree-shaking
  import { find, modify, on } from 'https://esm.sh/@doeixd/dom';
  
  const button = find('button');
  modify(button)({ text: 'Click me!' });
  on(button)('click', () => alert('Clicked!'));
</script>
```

#### Tree-Shaking with ESM.sh: Use the ?exports parameter to bundle only specific functions:

```html
<script type="module">
  // Only bundles find, modify, and on (~2KB instead of ~15KB)
  import { find, modify, on } from 'https://esm.sh/@doeixd/dom?exports=find,modify,on';
</script>
```

<br />

## Quick Start

Here’s a taste of how the library feels. Let's find a button, update it, and handle a click.

```typescript
import { find, modify, on, addClass } from '@doeixd/dom';

// 1. Find an element (types are inferred)
const btn = find('button.submit'); // HTMLButtonElement | null

// 2. Modify its properties
modify(btn)({
  text: 'Submit Order',
  disabled: false
});
addClass(btn)('btn-primary');

// 3. Listen for an event (returns a cleanup function)
const stopListening = on(btn)('click', () => {
  console.log('Order submitted!');
});
```

<br />

## Design Philosophy

The library is built on a few simple, powerful ideas.

**1. A Predictable API: `Action(Target)(Config)`**
Most functions follow a "target-first" pattern. You first specify *what* you're working with, then you describe the *action*.

```typescript
//   Action(Target)  (Configuration)
modify(myButton)  ({ text: 'Hello' });
addClass(myButton)('active');
```
This design makes your code highly reusable. You can prepare an action and apply it to many elements:
```typescript
const makeActive = addClass('active');
buttons.forEach(makeActive);
```
*(This pattern is also known as currying, which is what makes composing functions so easy.)*

**2. Flexible Usage Styles**
While the target-first style is great for composition, you can also use a more direct, imperative style or a fluent, jQuery-like style. Choose what fits the situation best.

```typescript
// A) Functional (Recommended)
modify(btn)({ text: 'Click' });

// B) Imperative (Direct)
modify(btn, { text: 'Click' });

// C) Fluent (jQuery-like)
$('button').modify({ text: 'Click' }).addClass('active');
```

<br />

## The Component Pattern

For complex applications, `@doeixd/dom` provides a lightweight component architecture. It bridges the gap between low-level DOM manipulation and high-level frameworks like React or Vue, without the build steps or virtual DOM overhead.

### `defineComponent`

This function creates a self-contained logic unit attached to a DOM element. It solves three major problems in Vanilla JS development:
1.  **Ref Management:** Automatically maps `data-ref` elements to variables.
2.  **Lifecycle Management:** Automatically cleans up event listeners and observers when the component is destroyed.
3.  **State Sync:** Provides a simple way to sync JavaScript state with DOM data attributes.

#### Example: Counter Component

**HTML:**
```html
<div id="counter">
  <span data-ref="display">0</span>
  <button data-ref="btn">Increment</button>
</div>
```

**TypeScript:**
```typescript
import { defineComponent } from '@doeixd/dom';

// 1. Define Types (Optional)
interface Refs { display: HTMLElement; btn: HTMLButtonElement; }
interface State { count: number; }

// 2. Define Logic
const Counter = defineComponent<any, Refs, any, State>('#counter', (ctx) => {
  const { display, btn } = ctx.refs;

  // Initialize State (sets data-count="0" in DOM)
  ctx.state.count = 0;

  // Event Listener (auto-cleaned on destroy)
  ctx.on('click', btn, () => {
    ctx.state.count++;
  });

  // Reactive Watcher (runs when state changes)
  ctx.watch('count', (val) => {
    display.textContent = String(val);
  });
  
  // Return Public API
  return {
    reset: () => { ctx.state.count = 0; }
  };
});

// 3. Usage
// Counter.reset();
// Counter.destroy(); // Removes all listeners
```

#### The `ComponentContext` (ctx)

The `ctx` object passed to your setup function provides scoped, auto-cleaning utilities:

| Property | Description |
| :--- | :--- |
| `ctx.root` | The root element of the component. |
| `ctx.refs` | Object map of elements with `data-ref="name"`. |
| `ctx.groups` | Object map of element lists with `data-ref="name"`. |
| `ctx.state` | Proxy object for reading/writing `data-*` attributes. |
| `ctx.on` | Add event listener (auto-removed on destroy). |
| `ctx.watch` | Watch state changes. |
| `ctx.bind` | Two-way bind an input to a state key. |
| `ctx.observe` | Add Intersection/Resize observer (auto-disconnected). |
| `ctx.effect` | Register arbitrary cleanup logic. |

#### Learn More

For comprehensive guides on components:
- **[Component Documentation](./docs/components.md)** - Complete guide to components, TypeScript integration, lifecycle, state management, real-world examples, and best practices
- **[Advanced Component Patterns](./docs/component-patterns.md)** - The binder pattern, custom hooks, plugin systems, state management strategies, dynamic components, and testing

<br />

## The Toolkit: A Practical Guide

### DOM Querying & Traversal

| Function | Description | Example |
| :--- | :--- | :--- |
| `find` | Find the first matching element. | `const btn = find(document)('.submit-btn');` |
| `findAll` | Find all matches as a standard Array. | `const items = findAll(list)('li');` |
| `require` | Find element or throw if not found. | `const btn = require('button');` |
| `closest` | Find the closest matching ancestor. | `const card = closest(btn)('.card');` |
| `exists` | Check if an element exists. | `const exists = exists('.submit-btn');` |
| `has` | Check if an element contains a descendant. | `const has = has('.card')('.submit-btn');` |
| `index` | Get the index of an element. | `const idx = index(btn);` |
| `siblings` | Get all sibling elements. | `const sibs = siblings(btn);` |
| `attr` | Get or set element attributes. | `const id = attr(el)('id'); attr(el)('id', '123');` |
| `prop` | Get or set element properties. | `const checked = prop(input)('checked');` |
| `Traverse.parent` | Get the parent element. | `const parent = Traverse.parent(el);` |
| `Traverse.children` | Get child elements as an array. | `const kids = Traverse.children(el);` |
| `Traverse.siblings` | Get all sibling elements. | `const sibs = Traverse.siblings(el);` |
| `Traverse.next` | Get the next sibling. | `const next = Traverse.next(el);` |
| `Traverse.prev` | Get the previous sibling. | `const prev = Traverse.prev(el);` |

### DOM Manipulation & Creation

| Function | Description | Example |
| :--- | :--- | :--- |
| `modify` | Declaratively set `text`, `class`, `dataset`, `attr`, `value`, etc. | `modify(el)({ text: 'Hi', disabled: true })` |
| `set` | Alias for `modify`. | `set(el)({ text: 'Hi' })` |
| `css` | Apply inline styles. | `css(el)({ color: 'red', opacity: '1' })` |
| `tempStyle` | Apply styles temporarily, returns revert function. | `const revert = tempStyle(el)({ opacity: '0.5' });` |
| `el` | Create a new element with props and children. | `el('div')({ class:{box:1} })([child])` |
| `h` | Hyperscript proxy for element creation. | `h.div({ class: { box: true } }, ['Hi'])` |
| `tags` | Alias for `h` (tag factory). | `tags.button({})(['Click'])` |
| `html` | Create an element from a template literal. | ```const div = html`<div>${name}</div>`;``` |
| `htmlMany` | Create a DocumentFragment from HTML. | ```const frag = htmlMany`<li>A</li><li>B</li>`;``` |
| `createWebComponent` | Register a custom element with defaults. | `createWebComponent(MyEl, { name: 'my-el' })` |
| `append` | Append nodes or text to an element. | `append(parent)(child1, 'text')` |
| `prepend` | Prepend nodes or text to an element. | `prepend(list)(newItem)` |
| `after` | Insert content after an element as siblings. | `after(el)(newSibling)` |
| `before` | Insert content before an element as siblings. | `before(el)(newSibling)` |
| `remove` | Remove an element from the DOM. | `remove(modal)` |
| `empty` | Remove all children from an element. | `empty(listContainer)` |
| `wrap` | Wrap an element with another element. | `wrap(img)(figure)` |
| `mount` | Append and auto-unsubscribe on cleanup. | `mount(parent)(child)` |
| `clone` | Deep clone a node. | `const copy = clone(template);` |
| `sanitizeHTMLSimple` | Sanitize HTML by removing dangerous tags and attributes. | `const safe = sanitizeHTMLSimple(userInput);` |
| `sanitizeHTMLTextOnly` | Extract text content only from HTML. | `const text = sanitizeHTMLTextOnly(html);` |

### Event Handling

| Function | Description | Example |
| :--- | :--- | :--- |
| `on` | Attach an event listener. Returns a cleanup function. | `const unsub = on(btn)('click', handler);` |
| `onDelegated` | Attach a delegated listener for dynamic children. | `onDelegated(list)('li')('click', handler)` |
| `dispatch` | Fire a custom event from an element. | `dispatch(el)('modal:close', { id: 123 });` |
| `createListenerGroup` | Create a group of listeners with batch cleanup. | `const group = createListenerGroup();` |
| `Evt.stop` | Stop event propagation. | `Evt.stop(e);` |
| `Evt.prevent` | Prevent default action. | `Evt.prevent(e);` |
| `Key.matches` | Check key against matcher. | `if (Key.matches(e, 'Enter')) submit();` |
| `Key.is` | Listen for a specific key. | `Key.is(input)('Enter', submit);` |
| `Key.onTab` | Listen for Tab key. | `Key.onTab(root)(handler);` |
| `Key.onArrow` | Listen for arrow keys. | `Key.onArrow(menu)((dir) => {})` |
| `Focus.on` | Listen for focus events. | `Focus.on(input)(handler);` |
| `Focus.onBlur` | Listen for blur events. | `Focus.onBlur(input)(handler);` |
| `Focus.onIn` | Listen for focusin events. | `Focus.onIn(root)(handler);` |
| `Focus.onOut` | Listen for focusout events. | `Focus.onOut(root)(handler);` |
| `Focus.trap` | Trap focus within container. | `Focus.trap(modal);` |

### Forms & Inputs

| Function | Description | Example |
| :--- | :--- | :--- |
| `Form.serialize` | Get all form data as an object. | `const data = Form.serialize(formEl);` |
| `Form.populate` | Fill form fields from an object. | `Form.populate(formEl)(data);` |
| `form` | Enhanced form wrapper with utilities. | `const f = form('#myForm');` |
| `Input.get` | Get input value (handles checkboxes, numbers, etc). | `const val = Input.get(input);` |
| `Input.set` | Set input value. | `Input.set(input)('value');` |
| `Input.watch` | Watch for input changes. | `Input.watch(input)(handler);` |
| `Input.watchDebounced` | Watch with debouncing. | `Input.watchDebounced(input)(handler, 300);` |
| `Input.validate` | Set validation message. | `Input.validate(input)('Invalid');` |

### State & Attributes

| Function | Description | Example |
| :--- | :--- | :--- |
| `cls` | Class helpers (add/remove/toggle/etc.). | `cls.add(el)('active')` |
| `cls.add` | Add one or more CSS classes. | `cls.add(el)('active', 'visible')` |
| `cls.remove` | Remove one or more CSS classes. | `cls.remove(el)('loading')` |
| `cls.toggle` | Toggle a class, with optional force boolean. | `cls.toggle(el)('open', isOpen)` |
| `cls.has` | Check if element has a class. | `if (cls.has(el)('active')) {}` |
| `cls.replace` | Replace one class with another. | `cls.replace(el)('old', 'new')` |
| `cls.watch` | Alias for `watchClass`. | `cls.watch(el)('active', handler)` |
| `cls.cycle` | Alias for `cycleClass`. | `cls.cycle(el)(['idle', 'loading'])` |
| `watch.class` | Watch class changes. | `watch.class(el, 'active', handler)` |
| `watch.attr` | Watch attribute changes. | `watch.attr(el, 'disabled', handler)` |
| `watch.text` | Watch text changes. | `watch.text(el, handler)` |
| `watch.mutations` | Watch DOM mutations. | `watch.mutations(el, handler)` |
| `watchClass` | Run callback when a class changes. | `watchClass(el)('active', handler)` |
| `cycleClass` | Cycle through a list of classes (state machine). | `cycleClass(el)(['idle', 'loading', 'done'])` |
| `Data.set` | Set a `data-*` attribute. | `Data.set(el)('userId', 123)` |
| `Data.get` | Get a `data-*` attribute as string. | `const val = Data.get(el)('userId');` |
| `Data.read` | Parse a `data-*` attribute (auto-detects type). | `const id = Data.read(el)('userId');` |
| `Data.bind` | Two-way bind data attribute to variable. | `Data.bind(el)('count', getter, setter)` |
| `watchAttr` | Run callback when attribute changes. | `watchAttr(el)('disabled', handler)` |
| `watchText` | Run callback when text content changes. | `watchText(el)(handler)` |

### Lifecycle & Observation

| Function | Description | Example |
| :--- | :--- | :--- |
| `onReady` | Run callback when DOM is ready. | `onReady(() => init());` |
| `ready` | Object with ready state utilities. | `if (ready.is()) { /* DOM ready */ }` |
| `onMount` | Run callback when element appears in DOM. | `onMount('.modal')(handler);` |
| `waitFor` | Wait for element to match a predicate. | `await waitFor(el)(e => e.classList.contains('ready'));` |

### CSS & Styling

| Function | Description | Example |
| :--- | :--- | :--- |
| `CssVar.get` | Get CSS variable value. | `const val = CssVar.get(el)('--color');` |
| `CssVar.set` | Set CSS variable. | `CssVar.set(el)('--color', 'red');` |
| `computed` | Get computed style property. | `const color = computed(el)('color');` |
| `cssTemplate` | Create CSS string from template. | `const css = cssTemplate\`color: ${c};\`;` |
| `injectStyles` | Inject CSS into document. Returns cleanup. | `const unsub = injectStyles('.box{color:red}');` |
| `waitTransition` | Wait for CSS transition to complete. | `await waitTransition(el);` |
| `toColorSpace` | Convert color to different color space. | `const rgb = toColorSpace('#fff', 'srgb');` |

### Layout & Geometry

| Function | Description | Example |
| :--- | :--- | :--- |
| `rect` | Get DOMRect (position & dimensions). | `const r = rect(el);` |
| `offset` | Get element offset relative to document. | `const {top, left} = offset(el);` |
| `isVisible` | Check if element is visible. | `if (isVisible(el)) {}` |
| `scrollInto` | Scroll element into view with options. | `scrollInto(el)({ behavior: 'smooth' });` |
| `focus` | Focus an element. | `focus(input);` |
| `blur` | Blur an element. | `blur(input);` |

### Data & Collections


| Function | Description | Example |
| :--- | :--- | :--- |
| `refs` | Get all `data-ref` elements as object. | `const {btn, input} = refs(root);` |
| `groupRefs` | Get grouped `data-ref` elements as arrays. | `const {items} = groupRefs(root);` |
| `viewRefs` | Create a view with typed refs. | `const view = viewRefs<Refs>((ctx) => ...);` |
| `component` | Create typed component from refs. | `const c = component<T>('#root');` |
| `store` | Attach arbitrary data to an element. | `store(el).set('count', 5);` |
| `batch` | Batch operations on element collection. | `batch(items).addClass('active');` |
| `groupBy` | Group elements by attribute or callback. | `groupBy(items)('data-category');` |
| `Obj.clone` | Deep clone an object. | `const copy = Obj.clone(obj);` |
| `Obj.isEqual` | Deep equality check. | `if (Obj.isEqual(a, b)) {}` |
| `Obj.pick` | Pick properties from object. | `const sub = Obj.pick(obj, ['a', 'b']);` |
| `Obj.omit` | Omit properties from object. | `const rest = Obj.omit(obj, ['x']);` |
| `Obj.map` | Map object entries or values. | `Obj.map(obj, ([k, v]) => [k, v])` |
| `Obj.renameKey` | Rename a key (immutable). | `Obj.renameKey(obj, 'a', 'b')` |
| `Obj.get` | Read nested value by path. | `Obj.get(obj, 'a.b.0')` |
| `Obj.set` | Set nested value by path. | `Obj.set(obj, 'a.b', 1)` |

### Network & HTTP

| Function | Description | Example |
| :--- | :--- | :--- |
| `Http.get` | Simple GET request. | `const data = await Http.get<T>(url);` |
| `Http.post` | Simple POST request. | `const res = await Http.post(url)(body)();` |
| `Http.put` | Simple PUT request. | `const res = await Http.put(url)(body)();` |
| `Http.delete` | Simple DELETE request. | `const res = await Http.delete(url)({});` |
| `Http.create` | Create configured API client. | `const api = Http.create({baseURL: '...'});` |
| `Async.retry` | Retry async function with backoff. | `await Async.retry(fn, {retries: 3});` |
| `Async.race` | Race promises with timeout. | `await Async.race(promise, 1000);` |
| `Async.parallel` | Run promises in parallel with limit. | `await Async.parallel(tasks, 5);` |
| `createQueue` | Create async task queue. | `const q = createQueue({concurrency: 3});` |

### Timing & Async Control

| Function | Description | Example |
| :--- | :--- | :--- |
| `debounce` | Delay function until pause in calls. | `const search = debounce(fn, 300);` |
| `throttle` | Limit function to once per interval. | `const scroll = throttle(fn, 100);` |
| `wait` | Promise-based delay. | `await wait(1000);` |
| `nextFrame` | Wait for next animation frame. | `await nextFrame();` |
| `Signal.timeout` | Create timeout signal for fetch. | `fetch(url, {signal: Signal.timeout(5000)});` |
| `Signal.manual` | Create manual abort signal. | `const [signal, abort] = Signal.manual();` |

### Storage & State

| Function | Description | Example |
| :--- | :--- | :--- |
| `Local.get` | Get from localStorage (typed). | `const val = Local.get<T>('key');` |
| `Local.set` | Set to localStorage. | `Local.set('key', value);` |
| `Local.remove` | Remove from localStorage. | `Local.remove('key');` |
| `Local.watch` | Watch localStorage key for changes. | `Local.watch('key')(handler);` |
| `Session.get` | Get from sessionStorage (typed). | `const val = Session.get<T>('key');` |
| `Session.set` | Set to sessionStorage. | `Session.set('key', value);` |
| `Cookie.get` | Get cookie value. | `const val = Cookie.get('name');` |
| `Cookie.set` | Set cookie with options. | `Cookie.set('name', 'val', {maxAge: 3600});` |
| `Cookie.remove` | Remove cookie. | `Cookie.remove('name');` |

### URL & Navigation

| Function | Description | Example |
| :--- | :--- | :--- |
| `Params.get` | Get URL parameter. | `const id = Params.get('id');` |
| `Params.set` | Set URL parameter. | `Params.set('id', '123');` |
| `Params.remove` | Remove URL parameter. | `Params.remove('id');` |
| `Params.getAll` | Get all URL parameters as object. | `const params = Params.getAll();` |
| `History.push` | Push new history state. | `History.push('/page', {data});` |
| `History.replace` | Replace current history state. | `History.replace('/page', {data});` |
| `History.back` | Go back in history. | `History.back();` |
| `History.forward` | Go forward in history. | `History.forward();` |

<br />

### Advanced Utilities

| Function | Description | Example |
| :--- | :--- | :--- |
| `def` | Create hybrid curried/imperative functions. | `const fn = def((el, val) => el.value = val);` |
| `$` | jQuery-like fluent API wrapper. | `$('.btn').modify({text: 'Hi'}).addClass('active');` |
| `$$` | Collection wrapper for batch operations. | `$$('button').forEach(b => modify(b)({disabled: false}));` |
| `bind` | Reactive binding primitives. | `bind.text(el)('Hi')` |
| `bind.text` | Two-way bind text content. | `bind.text(el, () => count, v => count = v);` |
| `bind.value` | Two-way bind input value. | `bind.value(input, getter, setter);` |
| `Input.watchComposed` | Input watcher with IME support. | `Input.watchComposed(input)(handler)` |
| `bindEvents` | Bind multiple events at once. | `bindEvents(el, {click: h1, input: h2});` |
| `onClickOutside` | Handle clicks outside a target. | `onClickOutside(menu, close)` |
| `autoResize` | Auto-resize a textarea. | `autoResize(textarea, { maxHeight: 300 })` |
| `createUpload` | Dropzone + file picker helper. | `createUpload(zone, { accept: ['image/*'] })` |
| `createSortable` | Basic sortable list helper. | `createSortable(list, { items: 'li' })` |
| `draggable` | Make an element draggable. | `draggable(el, { axis: 'y' })` |
| `createBinder` | Create a typed binder from refs. | `createBinder(refs, schema)` |
| `binder` | Bind events to refs with schema. | `binder(refs, schema);` |
| `view` | Create views from HTML strings. | `const v = view('<div></div>');` |
| `chain` | Apply a list of transforms to an element. | `chain(el, cls.add('active'))` |
| `exec` | Execute callbacks on an element. | `exec(el, el => console.log(el))` |
| `createUpdateAfter` | Batch DOM updates after async work. | `createUpdateAfter(el, updater)` |
| `apply` | Apply setters to state. | `apply(setters)(state);` |
| `createBus` | Create typed event bus (pub/sub). | `const bus = createBus<Events>();` |
| `createStore` | Create reactive store. | `const store = createStore({count: 0});` |
| `createMediaQuery` | Reactive media query helper. | `createMediaQuery({ mobile: '(max-width: 640px)' })` |
| `defineComponent` | Define a component with lifecycle. | `defineComponent('#app', (ctx) => {...});` |
| `domCtx` | Create a scoped component context. | `const ctx = domCtx('#root');` |
| `A11y.announce` | Screen reader announcement. | `A11y.announce('Saved', 'polite')` |
| `A11y.setExpanded` | Manage aria-expanded/controls. | `A11y.setExpanded(btn, panel)` |
| `A11y.setSelected` | Manage aria-selected in listbox. | `A11y.setSelected(option, listbox)` |
| `A11y.roving` | Roving tabindex navigation. | `A11y.roving(toolbar, 'button')` |
| `mountComponent` | Mount a component instance. | `mountComponent(instance, '#root');` |
| `Result.ok` | Create success result. | `return Result.ok(value);` |
| `Result.err` | Create error result. | `return Result.err(error);` |
| `Option.some` | Create Some option. | `return Option.some(value);` |
| `Option.none` | Create None option. | `return Option.none();` |
| `Fn.pipe` | Pipe value through functions. | `const result = Fn.pipe(val, fn1, fn2);` |
| `Fn.compose` | Compose functions right-to-left. | `const fn = Fn.compose(fn3, fn2, fn1);` |
| `Fn.withArg` | Prefill first argument for functions. | `Fn.withArg(el, on, modify)` |
| `Fn.dataLast` | Convert data-first to data-last (dual-mode). | `Fn.dataLast(on, { arity: 3 })` |
| `Fn.dataLastPred` | Data-last via predicate. | `Fn.dataLastPred(isEl)(on)` |
| `Fn.dataLastEl` | Data-last for ElementInput. | `Fn.dataLastEl(on)` |
| `Fn.flex` | Flexible first/last argument order. | `Fn.flex(on, isEl)` |
| `Fn.flexEl` | Flex for ElementInput. | `Fn.flexEl(on)` |
| `ViewTransitions.start` | Start view transition. | `ViewTransitions.start(() => updateDOM());` |
| `SW.register` | Register service worker. | `await SW.register('/sw.js');` |
| `stripListeners` | Clone element without event listeners. | `const clean = stripListeners(el);` |
| `instantiate` | Create instance from template. | `const inst = instantiate('#template');` |
| `cloneMany` | Clone element multiple times. | `const copies = cloneMany(el);` |
| `cast` | Type-safe element casting. | `const btn = cast<'button'>('button');` |
| `isElement` | Check if node is an element. | `if (isElement(node)) {...}` |
| `isTag` | Check if element matches tag. | `if (isTag('button')(el)) {...}` |
| `isInViewport` | Check if element is in viewport. | `if (isInViewport(el)) {...}` |
| `animate` | Animate element with Web Animations API. | `animate(el).fadeIn();` |
| `Text.copy` | Copy text to clipboard. | `Text.copy('Hello');` |
| `Text.paste` | Read from clipboard. | `const text = await Text.paste();` |

## Type Utilities

The library exports TypeScript types and interfaces for better type safety:

| Type/Interface | Description |
| :--- | :--- |
| `ParseSelector` | Infers element type from CSS selector string. |
| `ElementInput` | Element or selector input union. |
| `SelectorFunction` | Dual-mode selector function signature. |
| `SVGElementTags` | Supported SVG tag names. |
| `Unsubscribe` | Cleanup function type returned by event listeners. |
| `Register` | Cleanup register function type. |
| `EventMap` | Event map for HTML elements, extensible for custom events. |
| `ExtractEventDetail` | Extracts detail type from CustomEvent. |
| `ElementProps` | Properties for creating/modifying elements. |
| `HElementProps` | Hyperscript element props. |
| `StrictElementProps` | Element properties with element-specific validation. |
| `DeepReadonly` | Makes all properties deeply readonly. |
| `DeepPartial` | Makes all properties deeply partial. |
| `Path` | String or array path for `Obj.get/set`. |
| `FormSerializeOptions` | Options for `Form.serialize`. |
| `ClickOutsideOptions` | Options for `onClickOutside`. |
| `AutoResizeOptions` | Options for `autoResize`. |
| `UploadOptions` | Options for `createUpload`. |
| `UploadController` | Return type for `createUpload`. |
| `DraggableBounds` | Boundaries for draggable. |
| `DraggableOptions` | Options for `draggable`. |
| `SortableOptions` | Options for `createSortable`. |
| `SortableController` | Return type for `createSortable`. |
| `MediaQueryMap` | Map of media query strings. |
| `MediaQueryMatches` | Match state for queries. |
| `MediaQueryController` | Controller from `createMediaQuery`. |
| `A11yRovingOptions` | Options for `A11y.roving`. |
| `ListOptions` | List helper configuration. |
| `BoundList` | Bound list helper type. |
| `ViewRefsOptions` | Options for `viewRefs`. |
| `ViewRefsContext` | Context passed to `viewRefs`. |
| `ViewRefsInstance` | Instance returned by `viewRefs`. |
| `BindPrimitives` | Binding primitive type map. |
| `BinderSchema` | Binder schema type. |
| `InferBinderData` | Infers binder input data. |
| `EnhancedBinder` | Enhanced binder interface. |
| `HttpInterceptors` | HTTP interceptors. |
| `HttpAbortController` | Abortable HTTP result. |
| `HttpRequestResult` | Promise or abortable HTTP result. |
| `CreateWebComponentOptions` | Options for `createWebComponent`. |
| `WithArgMapped` | Result type for `Fn.withArg`. |
| `WithArgFn` | Type signature for `Fn.withArg`. |
| `DataLastFn` | Dual-mode data-last function type. |
| `DataLastMapped` | Tuple mapped type for `dataLast`. |
| `DataLastPredFn` | Type signature for `Fn.dataLastPred`. |
| `DataLastElFn` | Type signature for `Fn.dataLastEl`. |
| `FlexFn` | Flexible first/last argument function type. |
| `FlexMapped` | Tuple mapped type for `Fn.flex`. |
| `FlexElFn` | Type signature for `Fn.flexEl`. |
| `FormElement` | Union type for form elements (input, select, textarea). |
| `QueryValue` | Valid URL query parameter value types. |
| `QueryParams` | Record of query parameters. |
| `Ok` | Success result type. |
| `Err` | Error result type. |
| `Result` | Union of Ok and Err types. |
| `Setter` | Setter function type. |
| `EventSchema` | Event schema for binding. |
| `Refs` | Record of element refs. |
| `HttpMethod` | HTTP method types. |
| `HttpStatus` | HTTP status code types. |
| `HttpRequestInit` | HTTP request configuration. |
| `HttpResponse` | HTTP response type. |
| `HttpConfig` | HTTP client configuration. |
| `ComponentContext` | Component context interface. |
| `DomContext` | Context type returned by `domCtx`. |
| `ComponentInstance` | Component instance type. |

<br />

## Advanced Patterns

### Example: Form Submission

This shows how the utilities compose to handle a common, real-world scenario.

```typescript
import { find, on, modify, Form, Http } from '@doeixd/dom';

const form = find<HTMLFormElement>('#login-form');
const submitBtn = find<HTMLButtonElement>('button[type="submit"]', form);

on(form)('submit', async (e) => {
  e.preventDefault();

  // 1. Show loading state
  modify(submitBtn)({ disabled: true, text: 'Logging in...' });

  try {
    // 2. Get form data and make API call
    const data = Form.serialize(form);
    const response = await Http.post('/api/login')(data)();

    // 3. Show success state
    modify(submitBtn)({ text: 'Success!' });
    addClass(form)('form-success');
    
  } catch (error) {
    // 4. Handle errors
    modify(submitBtn)({ disabled: false, text: 'Try Again' });
    addClass(form)('form-error');
  }
});
```

### Organizing with `component`

For more complex UI, the `component` helper collects elements with `data-ref` attributes into a typed object, avoiding repeated `find` calls.

**HTML:**
```html
<div id="profile-card">
  <h2 data-ref="name"></h2>
  <p data-ref="email"></p>
  <button data-ref="editBtn">Edit</button>
</div>
```
**TypeScript:**
```typescript
import { component, on, modify } from '@doeixd/dom';

const profile = component<{
  name: HTMLHeadingElement;
  email: HTMLParagraphElement;
  editBtn: HTMLButtonElement;
}>('#profile-card');

// Now access elements directly and with full type safety
modify(profile.name)({ text: 'Jane Doe' });
on(profile.editBtn)('click', () => openEditModal());
```

<br />

## Advanced Features

The library includes powerful features for building modern, reactive UIs without a framework.

### h/tags - Hyperscript Element Creation

VanJS-style element creation using Proxy-based property access. Cleaner syntax than `el()` with automatic SVG namespace handling.

```typescript
import { h, refs } from '@doeixd/dom';

// Create elements with clean syntax
const card = h.div({ class: { card: true } }, [
  h.h2({ dataRef: 'title' }, ['Card Title']),
  h.p({ dataRef: 'content' }, ['Card description']),
  h.button({ dataRef: 'btn' }, ['Action'])
]);

// SVG elements get correct namespace automatically
const icon = h.svg({ attr: { viewBox: '0 0 24 24', width: '24', height: '24' } }, [
  h.path({ attr: { d: 'M12 2L2 12h3v8h5v-6h4v6h5v-8h3z', fill: 'currentColor' } })
]);

// Extract refs for type-safe access
const { title, content, btn } = refs(card);
title.textContent = 'Updated Title';
```

**When to use:**
- Building declarative UI hierarchies
- Creating SVG graphics (automatic namespace)
- Component templates with viewRefs()

📖 [Full Documentation](./docs/45-hyperscript.md)

### viewRefs() - Typed Component Templates

Create reusable component templates with automatic ref extraction and smart update methods.

```typescript
import { viewRefs, h } from '@doeixd/dom';

// Define typed template
interface CardRefs {
  title: HTMLElement;
  content: HTMLElement;
  button: HTMLElement;
}

const Card = viewRefs<CardRefs>(({ refs }) =>
  h.div({ class: { card: true } }, [
    h.h2({ dataRef: 'title' }),
    h.p({ dataRef: 'content' }),
    h.button({ dataRef: 'button' }, ['Click'])
  ])
);

// Create instances with full type safety
const { element, refs, updateRefs, bind } = Card({
  className: 'featured-card'
});

// Smart updates handle strings, numbers, and ElementProps
updateRefs({
  title: 'Card Title',
  content: 'Description text',
  button: { text: 'Buy Now', class: { primary: true } }
});

// Get setter functions for individual refs
const setTitle = bind('title');
setTitle('Updated Title');

document.body.appendChild(element);
```

**When to use:**
- Reusable component patterns
- Type-safe ref access
- Dynamic UI that needs frequent updates

📖 [Full Documentation](./docs/47-viewrefs.md)

### List() - Reactive Array Binding

Efficient DOM rendering for dynamic collections with three reconciliation strategies.

```typescript
import { List, h } from '@doeixd/dom';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const container = document.querySelector('#todos');

// Keyed mode for efficient updates
const list = List<Todo>(container, {
  key: todo => todo.id,  // Enables smart diffing
  render: (todo) => h.li({
    class: { done: todo.done }
  }, [
    h.input({ attr: { type: 'checkbox', checked: todo.done } }),
    h.span({}, [todo.text])
  ]),
  update: (el, todo) => {
    // Optional: efficient update without re-rendering
    el.classList.toggle('done', todo.done);
  }
});

// Rich API for list manipulation
list.set([
  { id: 1, text: 'Buy groceries', done: false },
  { id: 2, text: 'Walk dog', done: true }
]);

list.append([{ id: 3, text: 'Call mom', done: false }]);
list.remove(todo => todo.done);  // Remove completed items
```

**Three modes:**
- **Default**: Simple blow-away (fast for small lists)
- **Keyed**: Efficient diffing with key function (reuses elements)
- **Custom**: User-provided reconciliation (e.g., morphdom)

📖 [Full Documentation](./docs/46-list.md)

### createBinder() - Type-Safe Data Binding

Schema-based binding between data and DOM with automatic dirty checking.

```typescript
import { createBinder, bind, refs, h } from '@doeixd/dom';

const form = h.form({}, [
  h.input({ dataRef: 'nameInput', attr: { type: 'text' } }),
  h.input({ dataRef: 'emailInput', attr: { type: 'email' } }),
  h.button({ dataRef: 'submitBtn' }, ['Submit']),
  h.div({ dataRef: 'errorMsg', class: { error: true } })
]);

const formRefs = refs(form);

// Create binder with schema
const ui = createBinder(formRefs, {
  nameInput: bind.value,
  emailInput: bind.value,
  submitBtn: (el) => bind.prop('disabled', el),
  errorMsg: bind.text
});

// Update UI declaratively
ui({
  nameInput: 'John Doe',
  emailInput: 'john@example.com',
  submitBtn: false,
  errorMsg: ''
});

// Individual setters for event handlers
ui.set.errorMsg('Invalid email address');

// Batch updates
ui.batch(() => {
  ui({ submitBtn: true });
  ui({ errorMsg: 'Submitting...' });
});
```

**Bind primitives:**
- `bind.text` - Text content
- `bind.html` - Inner HTML
- `bind.value` - Input values (with dirty checking)
- `bind.prop()` - Element properties (disabled, checked, etc.)
- `bind.classes` - Multiple class toggles
- `bind.show` - Show/hide elements
- `bind.attr()` - HTML attributes
- `bind.toggle()` - Single class toggle

📖 [Full Documentation](./docs/48-binder.md)

### Complete Example: Todo App

Combining all features for a complete reactive UI:

```typescript
import { h, viewRefs, List, createBinder, bind, refs } from '@doeixd/dom';

// 1. Define component template
interface TodoRefs {
  checkbox: HTMLElement;
  text: HTMLElement;
  deleteBtn: HTMLElement;
}

const TodoItem = viewRefs<TodoRefs>(({ refs }) =>
  h.li({ class: { 'todo-item': true } }, [
    h.input({ dataRef: 'checkbox', attr: { type: 'checkbox' } }),
    h.span({ dataRef: 'text' }),
    h.button({ dataRef: 'deleteBtn' }, ['×'])
  ])
);

// 2. Create form with binder
const form = h.div({ class: { 'todo-app': true } }, [
  h.input({ dataRef: 'input', attr: { type: 'text', placeholder: 'Add todo...' } }),
  h.button({ dataRef: 'addBtn' }, ['Add']),
  h.ul({ dataRef: 'list' })
]);

const { input, addBtn, list } = refs(form);

const formUI = createBinder({ input, addBtn }, {
  input: bind.value,
  addBtn: (el) => bind.prop('disabled', el)
});

// 3. Create reactive list
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

let todos: Todo[] = [];

const todoList = List<Todo>(list, {
  key: todo => todo.id,
  render: (todo) => {
    const { element, refs } = TodoItem();
    const ui = createBinder(refs, {
      checkbox: (el) => bind.prop('checked', el),
      text: bind.text
    });

    ui({ checkbox: todo.done, text: todo.text });

    refs.checkbox.addEventListener('change', () => {
      todo.done = (refs.checkbox as HTMLInputElement).checked;
      todos = [...todos];  // Trigger re-render
      todoList.set(todos);
    });

    refs.deleteBtn.onclick = () => {
      todos = todos.filter(t => t.id !== todo.id);
      todoList.set(todos);
    };

    return element;
  }
});

// 4. Add todo handler
addBtn?.addEventListener('click', () => {
  const text = (input as HTMLInputElement)?.value.trim();
  if (text) {
    todos.push({ id: Date.now(), text, done: false });
    todoList.set(todos);
    formUI({ input: '' });
  }
});

document.body.appendChild(form);
```

<br />

## Troubleshooting & Common Patterns

### Gotchas & Things to Know

**1. Null Safety is Built-in**
All functions handle `null`/`undefined` gracefully. You don't need to check if elements exist:

```typescript
// This is safe - no errors even if button doesn't exist
const btn = find(document)('.missing-button'); // null
modify(btn)({ text: 'Hello' }); // Does nothing, returns null
on(btn)('click', handler); // Returns no-op cleanup function
```

**2. Curried Functions Support Two Styles**

Most functions work in both imperative and curried style:

```typescript
// Imperative (all args at once)
modify(element, { text: 'Hello' });
css(element, { color: 'red' });

// Curried (target first, config later)
modify(element)({ text: 'Hello' });
css(element)({ color: 'red' });

// Curried style enables composition
const updateButton = modify(button);
updateButton({ text: 'Loading...' });
updateButton({ text: 'Done!' });
```

**3. Class Objects Use Boolean Toggles**

When using the `class` property in `modify`, use boolean values to toggle classes:

```typescript
// Correct ✓
modify(el)({
  class: {
    active: true,      // Add 'active'
    disabled: false,   // Remove 'disabled'
    loading: isLoading // Conditional
  }
});

// Wrong ✗
modify(el)({ class: 'active disabled' }); // This won't work
```

**4. Dataset Auto-Converts to Kebab-Case**

Data attributes are automatically converted:

```typescript
modify(el)({
  dataset: {
    userId: 123,       // becomes data-user-id="123"
    isActive: true,    // becomes data-is-active="true"
    apiEndpoint: '/api' // becomes data-api-endpoint="/api"
  }
});
```

**5. Event Listeners Return Cleanup Functions**

Always store and call cleanup functions to prevent memory leaks:

```typescript
// Store the cleanup
const unsub = on(button)('click', handler);

// Later, when component unmounts or modal closes
unsub(); // Removes the listener

// For multiple listeners
const cleanups = [
  on(btn1)('click', h1),
  on(btn2)('click', h2),
  on(input)('input', h3)
];

// Clean up all at once
cleanups.forEach(fn => fn());
```

**6. Type Inference Works Best with Literals**

Use string literals (not variables) for selectors to get automatic type inference:

```typescript
// Good: Type is inferred as HTMLButtonElement | null
const btn = find(document)('button');

// Less ideal: Type is generic HTMLElement | null
const selector = 'button';
const btn2 = find(document)(selector);

// Solution: Use type annotation
const btn3 = find(document)<'button'>(selector);
// Or: Type assertion
const btn4 = find(document)(selector) as HTMLButtonElement | null;
```

**7. onDelegated Has Different Signature**

Event delegation requires selector first, then event:

```typescript
// Regular event listener
on(button)('click', handler);

// Delegated listener (note the extra selector call)
onDelegated(container)('button')('click', handler);
//                     ^^^^^^^^ selector for matching children
```

**8. HTML Templates Don't Auto-Escape**

The `html` function uses `innerHTML`, so be careful with user input:

```typescript
// Unsafe with user input ✗
const userInput = getUserInput();
const div = html`<div>${userInput}</div>`; // XSS risk!

// Safe alternatives ✓
const div = el('div')({ text: userInput }); // Uses innerText
modify(div)({ text: userInput }); // Uses innerText
```

### Common Patterns & Idioms

**Pattern 1: Conditional Element Updates**

```typescript
// Update multiple elements based on state
const updateUI = (state: AppState) => {
  modify(submitBtn)({
    text: state.loading ? 'Loading...' : 'Submit',
    disabled: state.loading,
    class: { loading: state.loading, error: state.error }
  });

  if (state.error) {
    modify(errorMsg)({ text: state.error, style: { display: 'block' } });
  } else {
    modify(errorMsg)({ style: { display: 'none' } });
  }
};
```

**Pattern 2: Batch Operations on Collections**

```typescript
// Apply same operation to multiple elements
const buttons = findAll(document)('button');

// Imperative style
buttons.forEach(btn => modify(btn)({ disabled: true }));

// Or use the $$ wrapper
$$(buttons).forEach(btn => {
  modify(btn)({ disabled: true });
  cls.add(btn)('disabled-state');
});
```

**Pattern 3: Cleanup on Component Unmount**

```typescript
class MyComponent {
  private cleanups: Unsubscribe[] = [];

  mount(root: HTMLElement) {
    const btn = find(root)('button');

    // Store all cleanup functions
    this.cleanups.push(
      on(btn)('click', this.handleClick),
      on(window)('resize', this.handleResize),
      Local.watch('user')(this.handleUserChange)
    );
  }

  unmount() {
    // Clean up all listeners at once
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}
```

**Pattern 4: Loading States with tempStyle**

```typescript
async function fetchData() {
  const btn = find(document)('button');

  // Apply temporary loading styles
  const revert = tempStyle(btn)({
    opacity: '0.6',
    pointerEvents: 'none',
    cursor: 'wait'
  });

  try {
    const data = await Http.get('/api/data');
    return data;
  } finally {
    revert(); // Always restore original styles
  }
}
```

**Pattern 5: Form Validation with Input Watchers**

```typescript
const emailInput = find<HTMLInputElement>(document)('#email');

Input.watchDebounced(emailInput)(async (value) => {
  // Don't validate if empty
  if (!value) {
    Input.validate(emailInput)('');
    return;
  }

  // Async validation
  const isValid = await checkEmailAvailable(value);
  Input.validate(emailInput)(
    isValid ? '' : 'Email already taken'
  );
}, 300);
```

**Pattern 6: Modal with Focus Trap and Cleanup**

```typescript
function openModal() {
  const modal = find(document)('.modal');
  const closeBtn = find(modal)('.close-btn');

  modify(modal)({ style: { display: 'block' } });
  cls.add(document.body)('modal-open');

  // Trap focus within modal
  const releaseFocus = Focus.trap(modal);

  // Close on button or escape
  const cleanups = [
    releaseFocus,
    on(closeBtn)('click', closeModal),
    on(document)('keydown', (e) => {
      if (Key.matches(e, 'Escape')) closeModal();
    })
  ];

  function closeModal() {
    modify(modal)({ style: { display: 'none' } });
    cls.remove(document.body)('modal-open');
    cleanups.forEach(fn => fn());
  }
}
```

**Pattern 7: Optimistic UI Updates**

```typescript
async function deleteItem(itemId: string) {
  const item = find(document)(`[data-id="${itemId}"]`);

  // Optimistic: Remove from UI immediately
  const parent = item?.parentElement;
  const nextSibling = item?.nextSibling;
  remove(item);

  try {
    await Http.delete(`/api/items/${itemId}`)({});
  } catch (error) {
    // Rollback: Restore item on error
    if (parent && item) {
      if (nextSibling) {
        before(nextSibling)(item);
      } else {
        append(parent)(item);
      }
    }
    alert('Failed to delete item');
  }
}
```

**Pattern 8: Infinite Scroll with Intersection Observer**

```typescript
const container = find(document)('.infinite-scroll');
const sentinel = find(container)('.sentinel');

let page = 1;
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    const items = await fetchPage(page++);
    const elements = items.map(item =>
      el('div')({ class: { item: true } })([item.name])
    );
    append(container)(...elements);
  }
});

if (sentinel) observer.observe(sentinel);
```

**Pattern 9: Component Pattern with Refs**

```typescript
interface ProfileCardRefs {
  name: HTMLHeadingElement;
  email: HTMLParagraphElement;
  avatar: HTMLImageElement;
  editBtn: HTMLButtonElement;
}

function createProfileCard(userData: User) {
  const card = component<ProfileCardRefs>('#profile-card');

  // Type-safe access to all refs
  modify(card.name)({ text: userData.name });
  modify(card.email)({ text: userData.email });
  modify(card.avatar)({ attr: { src: userData.avatarUrl } });

  return on(card.editBtn)('click', () => editProfile(userData.id));
}
```

**Pattern 10: State Machine with cycleClass**

```typescript
const button = find(document)('.toggle-btn');

// Define state classes
const states = ['idle', 'loading', 'success', 'error'];
const nextState = cycleClass(button)(states);

// Initial state
cls.add(button)('idle');

async function handleAction() {
  nextState(); // idle -> loading

  try {
    await performAction();
    nextState(); // loading -> success

    setTimeout(() => {
      nextState(); // success -> error
      nextState(); // error -> idle (cycles back)
    }, 2000);
  } catch (err) {
    nextState(); // loading -> success
    nextState(); // success -> error
  }
}
```

<br />

## License

MIT
