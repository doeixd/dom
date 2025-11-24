# @doeixd/dom Component Architecture Guide

This guide covers the high-level architecture for building robust, type-safe, and performant components using `@doeixd/dom`. It focuses on the **"Hard Way"** pattern: explicit data flow, strict separation of concerns, and native DOM performance without Virtual DOM overhead.

<br />

## 1. Core Concepts

The architecture consists of four distinct phases:

1.  **View Construction (`view`)**: Parsing HTML and mapping `data-ref` nodes to JavaScript objects.
2.  **Output Binding (`binder`, `bind`)**: Defining how data maps to the DOM (One-way binding).
3.  **Input Handling (`bindEvents`)**: Batching event listeners to update state.
4.  **State Management**: Explicit updates via `apply` OR reactive updates via `store`.

<br />

## 2. The View & Refs

The entry point is the `view` function. It takes an HTML string and returns a **Factory Function**.

### Why a Factory?
We parse the HTML template string **once** into a `<template>` element. Every time you call the factory, it clones that template. This is significantly faster than `document.createElement` or `innerHTML` loops.

### `data-ref` vs IDs
We use `data-ref="key"` instead of `id="key"`. IDs must be global; refs are scoped to the component instance.

```typescript
import { view } from '@doeixd/dom';

// 1. Define the template
// This parses only once.
const createCard = view(`
  <div class="user-card">
    <h2 data-ref="nameNode"></h2>
    <img data-ref="avatarNode" />
    <button data-ref="toggleBtn">Toggle Status</button>
  </div>
`);

// 2. Instantiate
function init() {
  // 'root' is the wrapper div
  // 'refs' contains { nameNode, avatarNode, toggleBtn } mapped automatically
  const { root, refs } = createCard();
  
  return root;
}
```

<br />

## 3. Output Binding (Data -> DOM)

Instead of manually writing `el.textContent = val` inside `if` statements, we use a declarative **Schema** approach.

### The Primitives: `bind`
These are low-level functions that return a **Setter**. A Setter is a function `(val) => void` that updates the DOM only if the value has changed (Dirty Checking).

*   `bind.text(el)`: Updates `textContent`.
*   `bind.html(el)`: Updates `innerHTML`.
*   `bind.toggle(class, el)`: Toggles a CSS class based on a boolean.
*   `bind.attr(name, el)`: Sets/Removes an attribute.
*   `bind.prop(name, el)`: Sets a JS property (like `checked` or `value`).

### The Schema: `binder`
`binder` maps your `refs` to these primitives. It creates a strictly typed "UI Object".

```typescript
import { binder, bind } from '@doeixd/dom';

const ui = binder(refs, {
  // Map ref 'nameNode' to text content
  nameNode: bind.text, 
  
  // Map ref 'avatarNode' to src attribute
  avatarNode: bind.attr('src'),

  // Map ref 'toggleBtn' to a CSS class toggle
  toggleBtn: bind.toggle('is-active')
});

// usage:
ui.nameNode('Alice');       // ✅ OK
ui.toggleBtn(true);         // ✅ OK
// ui.nameNode(123);        // ❌ Error: bind.text expects string
```

### The Execution: `apply`
`apply` connects a data object to your UI binders. It handles partial updates automatically and supports partial application (currying).

```typescript
import { apply } from '@doeixd/dom';

// Updates nameNode and toggleBtn, ignores avatarNode (undefined)
apply(ui, {
  nameNode: 'Bob',
  toggleBtn: false
});

// OR Create a reusable update function
const render = apply(ui);
render({ nameNode: 'Bob' });
```

<br />

## 4. Event Handling (DOM -> Logic)

`bindEvents` allows you to define all event listeners for a component in one structural object. It handles type inference for events (`MouseEvent`, `InputEvent`) and returns a **single cleanup function**.

```typescript
import { bindEvents } from '@doeixd/dom';

const cleanup = bindEvents(refs, {
  toggleBtn: {
    click: (e, el) => {
      // 'el' is strongly typed as the specific element from refs
      console.log('Clicked!', el);
    }
  },
  nameNode: {
    // Custom events work too
    'my-custom-event': (e) => console.log(e.detail)
  }
});

// Later, when destroying component:
cleanup();
```

<br />

## 5. State Management Strategies

You have two choices for managing state in `@doeixd/dom`.

### Strategy A: Explicit (The "Hard Way")
Best for performance, debugging, and strict data flow. You hold state in a plain JS object/variable and explicitly call `update()`.

```typescript
export default function UserCard() {
  const { root, refs } = createCard();
  
  // 1. Output Schema
  const ui = binder(refs, {
    nameNode: bind.text,
    toggleBtn: bind.toggle('active')
  });

  // 2. Create Update Function (Pre-bound to UI)
  const render = apply(ui);

  // 3. Internal State
  let state = { name: 'Guest', active: false };

  // 4. Input Handling
  bindEvents(refs, {
    toggleBtn: {
      click: () => {
        state.active = !state.active;
        render({ toggleBtn: state.active }); // Explicit Render
      }
    }
  });

  // Initial Render
  render({ nameNode: state.name });

  return root;
}
```

### Strategy B: Reactive (`store`)
Best for simple interactions where you want "Vue-like" behavior. State is a Proxy stored in the DOM dataset.

```typescript
import { store, watchAttr } from '@doeixd/dom';

export default function UserCard() {
  const { root, refs } = createCard();
  
  // 1. Create Reactive Store on the Root
  const state = store<{ name: string; active: boolean }>(root);

  // 2. Watch for changes
  watchAttr(root, 'data-name', (val) => {
    refs.nameNode.textContent = val || '';
  });
  
  // 3. Update state (Updates DOM attributes automatically)
  state.name = 'Alice'; // Sets data-name="Alice" -> triggers watcher
  
  return root;
}
```

<br />

## 6. Advanced Usage: Partial Application

`binder`, `bindEvents`, and `apply` all support "Target-First" partial application (Currying). This allows you to define logic/schemas separate from the DOM initialization.

**Standard Style (Inline):**
```typescript
const ui = binder(refs, { ... });
```

**Curried Style (Separated):**
```typescript
// Define schema definition logic separately
const defineUI = binder({
  title: bind.text
}); 
// defineUI is now a function waiting for Refs

function init() {
  const { root, refs } = view(...)();
  
  // Apply schema to specific refs instance
  const ui = binder(refs)({
    title: bind.text
  });
}
```

<br />

## 7. TypeScript Tips & Gotchas

### 1. Refs Typing
`view` returns `refs` as `Record<string, HTMLElement>`. If you need specific element types (e.g. `HTMLInputElement`), you have two options:

**Option A: Cast at usage (Easy)**
```typescript
const ui = binder(refs, {
  myInput: bind.prop<string>('value') // Works on HTMLElement
});
```

**Option B: Generic View (Strict)**
```typescript
interface MyRefs {
  myInput: HTMLInputElement;
  submitBtn: HTMLButtonElement;
}

// You'll need to cast the result of createView
const { refs } = createView() as unknown as { root: HTMLElement, refs: MyRefs };
```

### 2. `store` Serialization
The `store` proxy saves data to `data-*` attributes.
*   **Strings/Numbers/Booleans:** Work natively.
*   **Objects/Arrays:** Are `JSON.stringify`'d into the attribute.
*   **Functions/Dates:** Will be lost or converted to string representations. **Do not put complex classes in `store`.** Use Strategy A (Explicit State) for complex data.

### 3. Event Typing
`bindEvents` infers the event type from the key name *if* it is a standard DOM event.
```typescript
bindEvents(refs, {
  btn: {
    click: (e) => {} // e is MouseEvent
    input: (e) => {} // e is Event (buttons don't have input events usually)
  },
  inp: {
    input: (e) => {} // e is Event (generic) - cast if needed
  }
})
```

<br />

## 8. Complete Example: User Editor

Putting it all together into a robust component using `@doeixd/dom`.

```typescript
import { view, binder, bind, bindEvents, apply, type Unsubscribe } from '@doeixd/dom';

// 1. Template
const createView = view(`
  <div class="user-editor">
    <h3>Editing: <span data-ref="label"></span></h3>
    <input type="text" data-ref="input" />
    <label>
      <input type="checkbox" data-ref="check" /> Is Admin
    </label>
    <div class="actions">
      <button data-ref="save">Save</button>
      <button data-ref="cancel">Cancel</button>
    </div>
  </div>
`);

// 2. Props Interface
interface Props {
  username: string;
  isAdmin: boolean;
  onSave: (data: { username: string; isAdmin: boolean }) => void;
}

export function UserEditor(initialProps: Props) {
  const { root, refs } = createView();
  
  // 3. Internal State
  // We use a simple object because we want explicit control over when the UI updates.
  let state = { 
    username: initialProps.username, 
    isAdmin: initialProps.isAdmin 
  };

  // 4. Output Schema (Data -> DOM)
  // This defines exactly how data shapes the DOM.
  const ui = binder(refs, {
    label: bind.text,
    input: bind.prop<string>('value'), // 2-way bind part 1
    check: bind.prop<boolean>('checked'),
    save: bind.attr('disabled') // Disable save if invalid (logic below)
  });

  // Pre-bound update function
  const render = apply(ui);

  // 5. Input Handling (DOM -> Data)
  // Centralized event listener definition with auto-cleanup.
  const cleanup = bindEvents(refs, {
    input: {
      input: (e, el) => {
        state.username = (el as HTMLInputElement).value;
        render({ label: state.username }); // Update just the label live
      }
    },
    check: {
      change: (e, el) => {
        state.isAdmin = (el as HTMLInputElement).checked;
      }
    },
    save: {
      click: () => {
        initialProps.onSave(state);
      }
    },
    cancel: {
      click: () => {
        // Reset state
        state = { 
          username: initialProps.username, 
          isAdmin: initialProps.isAdmin 
        };
        // Update UI to reflect reset
        render({ 
          input: state.username, 
          label: state.username, 
          check: state.isAdmin 
        });
      }
    }
  });

  // 6. Initial Render
  render({
    label: state.username,
    input: state.username,
    check: state.isAdmin
  });

  // 7. Return Component Instance
  return {
    root,
    destroy: () => cleanup()
  };
}
```