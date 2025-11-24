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

<br />

## The Toolkit: A Practical Guide

### DOM Querying & Traversal

| Function | Description | Example |
| :--- | :--- | :--- |
| `find` | Find the first matching element. | `const btn = find(document)('.submit-btn');` |
| `findAll` | Find all matches as a standard Array. | `const items = findAll(list)('li');` |
| `closest` | Find the closest matching ancestor. | `const card = closest(btn)('.card');` |
| `exists` | Check if an element exists. | `const exists = exists('.submit-btn');` |
| `has` | Check if an element contains a descendant. | `const has = has('.card')('.submit-btn');` |
| `index` | Get the index of an element. | `const idx = index(btn);` |
| `siblings` | Get all sibling elements. | `const sibs = siblings(btn);` |
| `Traverse.parent` | Get the parent element. | `const parent = Traverse.parent(el);` |
| `Traverse.children` | Get child elements as an array. | `const kids = Traverse.children(el);` |
| `Traverse.siblings` | Get all sibling elements. | `const sibs = Traverse.siblings(el);` |
| `Traverse.next` | Get the next sibling. | `const next = Traverse.next(el);` |
| `Traverse.prev` | Get the previous sibling. | `const prev = Traverse.prev(el);` |

### DOM Manipulation & Creation

| Function | Description | Example |
| :--- | :--- | :--- |
| `modify` | Declaratively set `text`, `class`, `dataset`, `attr`, `value`, etc. | `modify(el)({ text: 'Hi', disabled: true })` |
| `css` | Apply inline styles. | `css(el)({ color: 'red', opacity: '1' })` |
| `tempStyle` | Apply styles temporarily, returns revert function. | `const revert = tempStyle(el)({ opacity: '0.5' });` |
| `el` | Create a new element with props and children. | `el('div')({ class:{box:1} })([child])` |
| `html` | Create an element from a template literal. | ```const div = html`<div>${name}</div>`;``` |
| `htmlMany` | Create a DocumentFragment from HTML. | ```const frag = htmlMany`<li>A</li><li>B</li>`;``` |
| `append` | Append nodes or text to an element. | `append(parent)(child1, 'text')` |
| `prepend` | Prepend nodes or text to an element. | `prepend(list)(newItem)` |
| `after` | Insert content after an element as siblings. | `after(el)(newSibling)` |
| `before` | Insert content before an element as siblings. | `before(el)(newSibling)` |
| `remove` | Remove an element from the DOM. | `remove(modal)` |
| `empty` | Remove all children from an element. | `empty(listContainer)` |
| `wrap` | Wrap an element with another element. | `wrap(img)(figure)` |
| `clone` | Deep clone a node. | `const copy = clone(template);` |

### Event Handling

| Function | Description | Example |
| :--- | :--- | :--- |
| `on` | Attach an event listener. Returns a cleanup function. | `const unsub = on(btn)('click', handler);` |
| `onDelegated` | Attach a delegated listener for dynamic children. | `onDelegated(list)('li')('click', handler)` |
| `dispatch` | Fire a custom event from an element. | `dispatch(el)('modal:close', { id: 123 });` |
| `createListenerGroup` | Create a group of listeners with batch cleanup. | `const group = createListenerGroup();` |
| `Evt.stop` | Stop event propagation. | `Evt.stop(e);` |
| `Evt.prevent` | Prevent default action. | `Evt.prevent(e);` |
| `Key.isEnter` | Check if Enter key was pressed. | `if (Key.isEnter(e)) submit();` |
| `Key.isEscape` | Check if Escape key was pressed. | `if (Key.isEscape(e)) close();` |

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
| `cls.add` | Add one or more CSS classes. | `cls.add(el)('active', 'visible')` |
| `cls.remove` | Remove one or more CSS classes. | `cls.remove(el)('loading')` |
| `cls.toggle` | Toggle a class, with optional force boolean. | `cls.toggle(el)('open', isOpen)` |
| `cls.has` | Check if element has a class. | `if (cls.has(el)('active')) {}` |
| `cls.replace` | Replace one class with another. | `cls.replace(el)('old', 'new')` |
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
| `Focus.trap` | Trap focus within container. | `Focus.trap(modal);` |

### Data & Collections

| Function | Description | Example |
| :--- | :--- | :--- |
| `refs` | Get all `data-ref` elements as object. | `const {btn, input} = refs(root);` |
| `groupRefs` | Get grouped `data-ref` elements as arrays. | `const {items} = groupRefs(root);` |
| `component` | Create typed component from refs. | `const c = component<T>('#root');` |
| `store` | Attach arbitrary data to an element. | `store(el).set('count', 5);` |
| `batch` | Batch operations on element collection. | `batch(items).addClass('active');` |
| `groupBy` | Group elements by attribute or callback. | `groupBy(items)('data-category');` |
| `Obj.clone` | Deep clone an object. | `const copy = Obj.clone(obj);` |
| `Obj.isEqual` | Deep equality check. | `if (Obj.isEqual(a, b)) {}` |
| `Obj.pick` | Pick properties from object. | `const sub = Obj.pick(obj, ['a', 'b']);` |
| `Obj.omit` | Omit properties from object. | `const rest = Obj.omit(obj, ['x']);` |

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

### Advanced Utilities

| Function | Description | Example |
| :--- | :--- | :--- |
| `$` | jQuery-like fluent API wrapper. | `$('.btn').modify({text: 'Hi'}).addClass('active');` |
| `$$` | Collection wrapper for batch operations. | `$$('button').forEach(b => modify(b)({disabled: false}));` |
| `bind.text` | Two-way bind text content. | `bind.text(el, () => count, v => count = v);` |
| `bind.value` | Two-way bind input value. | `bind.value(input, getter, setter);` |
| `bindEvents` | Bind multiple events at once. | `bindEvents(el, {click: h1, input: h2});` |
| `createBus` | Create typed event bus (pub/sub). | `const bus = createBus<Events>();` |
| `Result.ok` | Create success result. | `return Result.ok(value);` |
| `Result.err` | Create error result. | `return Result.err(error);` |
| `Option.some` | Create Some option. | `return Option.some(value);` |
| `Option.none` | Create None option. | `return Option.none();` |
| `Fn.pipe` | Pipe value through functions. | `const result = Fn.pipe(val, fn1, fn2);` |
| `Fn.compose` | Compose functions right-to-left. | `const fn = Fn.compose(fn3, fn2, fn1);` |
| `ViewTransitions.start` | Start view transition. | `ViewTransitions.start(() => updateDOM());` |
| `SW.register` | Register service worker. | `await SW.register('/sw.js');` |
| `stripListeners` | Clone element without event listeners. | `const clean = stripListeners(el);` |
| `instantiate` | Create instance from template. | `const inst = instantiate('#template');` |
| `Text.copy` | Copy text to clipboard. | `Text.copy('Hello');` |
| `Text.paste` | Read from clipboard. | `const text = await Text.paste();` |

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
      if (Key.isEscape(e)) closeModal();
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
