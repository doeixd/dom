[![Bundlejs](https://deno.bundlejs.com/badge?q=@doeixd/dom&treeshake=[*])](https://deno.bundlejs.com/?q=@doeixd/dom&treeshake=[*])
[![npm version](https://img.shields.io/npm/v/@doeixd/dom)](https://www.npmjs.com/package/@doeixd/dom)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/doeixd/dom)


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

## The Toolkit: A Practical Guide

### DOM Querying & Traversal

| Function | Description | Example |
| :--- | :--- | :--- |
| `find` | Find the first matching element. | `const btn = find('.submit-btn');` |
| `findAll` | Find all matches as a standard Array. | `const items = findAll(list, 'li');` |
| `closest` | Find the closest matching ancestor. | `const card = closest(btn)('.card');` |
| `Traverse` | Utilities for `parent`, `children`, `siblings`, `next`, `prev`. | `const parent = Traverse.parent(el);` |

### DOM Manipulation & Creation

| Function | Description | Example |
| :--- | :--- | :--- |
| `modify` | The powerhouse. Declaratively set `text`, `class`, `dataset`, `attr`, `value`, etc. | `modify(el)({ text: 'Hi', disabled: true })` |
| `css` | Apply a map of inline styles. | `css(el)({ color: 'red', opacity: '1' })` |
| `el` | Create a new element with props and children. | `el('div')({ class:{box:1} })([child])` |
| `html` | Create elements from a template literal. | `const div = html\`<div>${name}</div>\`;` |
| `append` | Append nodes or text to an element. | `append(parent)(child1, 'and text')` |
| `prepend` | Prepend nodes or text to an element. | `prepend(list)(newItem)` |
| `remove` | Remove an element from the DOM. | `remove(modal)` |
| `empty` | Remove all children from an element. | `empty(listContainer)` |

### Event Handling

| Function | Description | Example |
| :--- | :--- | :--- |
| `on` | Attach an event listener. Returns a cleanup function. | `const unsub = on(btn)('click', handler);` |
| `onDelegated` | Attach a single listener to a container for many children. More performant for lists. | `onDelegated(list)('click', 'li', handler)` |
| `dispatch` | Fire a custom event from an element. | `dispatch(el)('modal:close', { id: 123 });` |

### Forms & Inputs

The `Input` module provides smart getters/setters that automatically handle different input types (checkboxes, numbers, files, etc.).

```typescript
import { Form, Input, find } from '@doeixd/dom';

const formEl = find('form');
const input = find('input[name="username"]');

// Get all form data as a clean object
const data = Form.serialize(formEl);
// { username: "...", subscribe: true, ... }

// Watch for input changes (debounced for performance)
Input.watchDebounced(input)(async (value) => {
  const isValid = await api.validateUsername(value);
  Input.validate(input)(isValid ? '' : 'Username taken');
}, 300);
```

### State & Attributes

| Function | Description | Example |
| :--- | :--- | :--- |
| `cls.add` | Add one or more CSS classes. | `cls.add(el)('active', 'visible')` |
| `cls.remove` | Remove one or more CSS classes. | `cls.remove(el)('loading')` |
| `cls.toggle` | Toggle a class, with an optional force boolean. | `cls.toggle(el)('open', isOpen)` |
| `Data.set` | Set a `data-*` attribute. Converts objects to JSON. | `Data.set(el)('userId', 123)` |
| `Data.read` | Read and parse a `data-*` attribute (detects numbers, booleans, JSON). | `const id = Data.read(el)('userId');` |
| `watchAttr` | Run a callback when an attribute changes. | `watchAttr(el)('disabled', (isDisabled) => {})` |

### Network & Async

A flexible HTTP client is included, from simple static methods to a fully configurable factory for creating API clients.

```typescript
import { Http } from '@doeixd/dom';

// Simple, one-off GET request
const user = await Http.get<User>('/api/users/1');

// Create a configured API client for your app
const api = Http.create({
  baseURL: 'https://api.myapp.com',
  timeout: 5000,
  retries: 2
});

// Use the client
const products = await api.get<Product[]>('/products')({});
```

| Function | Description | Example |
| :--- | :--- | :--- |
| `debounce` | Delay a function's execution until a pause in calls. | `debounce(search, 300)` |
| `throttle`| Limit a function's execution to once per interval. | `throttle(onScroll, 100)` |
| `Async.retry` | Retry a promise-based function with backoff. | `Async.retry(() => fetch(url), { retries: 3 })` |
| `Signal`| A wrapper for `AbortController` to cancel async tasks. | `fetch(url, { signal: Signal.timeout(5000) })` |

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

## License

MIT