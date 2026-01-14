# Components in @doeixd/dom

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [TypeScript Integration](#typescript-integration)
4. [Core Concepts](#core-concepts)
5. [Component Context API](#component-context-api)
6. [Gotchas & Best Practices](#gotchas--best-practices)
7. [Real-World Examples](#real-world-examples)
8. [API Reference](#api-reference)

## Introduction

### What are Components?

Components in @doeixd/dom provide a structured way to organize interactive DOM elements with:

- **Automatic cleanup** - All event listeners, watchers, and observers are automatically cleaned up
- **Reactive state** - DOM-synced state via `data-*` attributes with automatic watchers
- **Scoped utilities** - All DOM queries and operations scoped to the component root
- **Type safety** - Full TypeScript inference for refs, state, and component APIs
- **Zero dependencies** - No framework overhead or virtual DOM

### Why Use Components?

**Instead of this:**
```javascript
const btn = document.querySelector('#counter button');
const display = document.querySelector('#counter .display');
let count = 0;

const listener = () => {
  count++;
  display.textContent = count;
};

btn.addEventListener('click', listener);

// Manual cleanup required!
// btn.removeEventListener('click', listener);
```

**Write this:**
```typescript
const Counter = defineComponent('#counter', (ctx) => {
  ctx.state.count = 0;

  ctx.on('click', ctx.refs.btn, () => {
    ctx.state.count++;
  });

  ctx.watch('count', (val) => {
    ctx.refs.display.textContent = String(val);
  });

  return {
    reset: () => { ctx.state.count = 0; }
  };
});

// Cleanup is automatic when you call:
Counter?.destroy();
```

### Core Philosophy

1. **DOM-as-State** - Use `data-*` attributes as your source of truth
2. **No Re-rendering** - Updates are imperative via setters, not declarative re-renders
3. **Target-First** - Components are bound to existing DOM elements
4. **Explicit Updates** - You control exactly what updates when

## Getting Started

### Basic Example

HTML:
```html
<div id="counter" data-count="0">
  <span class="display" data-ref="display">0</span>
  <button data-ref="btn">Increment</button>
</div>
```

TypeScript:
```typescript
import { defineComponent } from '@doeixd/dom';

interface Refs {
  display: HTMLElement;
  btn: HTMLButtonElement;
}

interface State {
  count: number;
}

const Counter = defineComponent<any, Refs, any, State>(
  '#counter',
  (ctx) => {
    // Initialize state
    ctx.state.count = 0;

    // Set up event listeners
    ctx.on('click', ctx.refs.btn, () => {
      ctx.state.count++;
    });

    // Watch for state changes
    ctx.watch('count', (val) => {
      ctx.refs.display.textContent = String(val);
    });

    // Return public API
    return {
      increment: () => { ctx.state.count++; },
      reset: () => { ctx.state.count = 0; },
      getValue: () => ctx.state.count
    };
  }
);

// Use the component
if (Counter) {
  Counter.increment();
  console.log(Counter.getValue()); // 1

  // Cleanup when done
  Counter.destroy();
}
```

### Anatomy of defineComponent

```typescript
const Component = defineComponent(target, setup);
```

**Parameters:**
- `target` - CSS selector string or HTMLElement to use as root
- `setup` - Function receiving ComponentContext and the `auto` helper, returns public API

**Returns:**
- `ComponentInstance<API> | null` - Component instance with your API + `root` + `destroy()`, or null if element not found

**The Setup Function:**
```typescript
(ctx: ComponentContext, auto: AutoCleanup) => API | void
```

The setup function:
1. Receives a ComponentContext with utilities plus the `auto` cleanup helper
2. Runs once when component is created
3. Returns an object that becomes the public API
4. All `ctx.onMount()` callbacks execute after setup completes


### Understanding ComponentContext

ComponentContext (`ctx`) provides everything you need:

```typescript
{
  // Core properties
  root: HTMLElement,           // The root element
  refs: Record<string, HTMLElement>,      // Single elements with data-ref
  groups: Record<string, HTMLElement[]>,  // Element arrays with data-ref
  state: Proxy,                // Reactive data-* attributes
  store: typeof createStore,   // Pure JS state (not DOM-synced)

  // DOM queries (scoped to root)
  find: (selector) => HTMLElement | null,
  findAll: (selector) => HTMLElement[],

  // Reactive bindings
  bind: { /* ... */ },
  binder: (schema) => BoundSetters,

  // Events
  on: (event, element, handler, options?) => Unsubscribe,
  bindEvents: (schema) => void,

  // Reactivity
  watch: (key, handler) => void,
  computed: (deps, compute) => ComputedValue,

  // Lifecycle
  onMount: (fn) => void,
  onUnmount: (fn) => void,
  effect: (cleanup) => void,

  // Observers
  observe: {
    intersection: (el, callback, options?) => void,
    resize: (el, callback) => void
  },

  // Utilities
  chain: (el, ...transforms) => any,
  exec: (el, ...operations) => any
}
```

### Auto Cleanup Helper

`defineComponent` provides a second argument called `auto` for generator-style cleanup registration. It accepts a function that receives a `register` helper for cleanup functions, and supports async setup.

```typescript
const App = defineComponent('#app', (ctx, auto) => {
  auto((register) => {
    register(on(window)('resize', handleResize));
    return 'ready';
  });

  auto(async (register) => {
    await doAsyncWork();
    register(on(document)('keydown', handleKey));
  });

  return {};
});
```

### The Component Lifecycle


```
1. Target Resolution
   ↓
2. Refs Collection (data-ref elements)
   ↓
3. Context Creation
   ↓
4. Setup Function Execution
   ↓
5. onMount Callbacks Execution
   ↓
6. Component Active
   ↓
7. destroy() Called
   ↓
8. All Cleanup Functions Execute
```

## TypeScript Integration

### Type Parameters

```typescript
defineComponent<API, Refs, Groups, State>(target, setup)
```

**Generic Parameters:**
1. `API` - Shape of the returned public interface
2. `Refs` - Type map for single `data-ref` elements
3. `Groups` - Type map for grouped `data-ref` elements
4. `State` - Shape of reactive state (data-* attributes)

### Typing Refs

```typescript
interface CounterRefs {
  display: HTMLSpanElement;
  btn: HTMLButtonElement;
  input: HTMLInputElement;
}

interface CounterGroups {
  items: HTMLLIElement[];
  tabs: HTMLDivElement[];
}

const Counter = defineComponent<any, CounterRefs, CounterGroups, any>(
  '#counter',
  (ctx) => {
    // ctx.refs.display is HTMLSpanElement
    // ctx.refs.btn is HTMLButtonElement
    // ctx.groups.items is HTMLLIElement[]

    ctx.refs.display.textContent = '0'; // ✓ Type-safe
    ctx.refs.btn.disabled = false;      // ✓ Type-safe
  }
);
```

### Typing State

```typescript
interface CounterState {
  count: number;
  name: string;
  active: boolean;
}

const Counter = defineComponent<any, any, any, CounterState>(
  '#counter',
  (ctx) => {
    // All state properties are typed
    ctx.state.count = 0;      // ✓
    ctx.state.name = 'Alice'; // ✓
    ctx.state.active = true;  // ✓

    // TypeScript will error on wrong types
    // ctx.state.count = 'string'; // ✗ Error
  }
);
```

### Typing the Component API

```typescript
interface CounterAPI {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  getValue: () => number;
  setValue: (n: number) => void;
}

const Counter = defineComponent<CounterAPI, Refs, any, State>(
  '#counter',
  (ctx): CounterAPI => {
    ctx.state.count = 0;

    return {
      increment: () => { ctx.state.count++; },
      decrement: () => { ctx.state.count--; },
      reset: () => { ctx.state.count = 0; },
      getValue: () => ctx.state.count,
      setValue: (n: number) => { ctx.state.count = n; }
    };
  }
);

// Counter has the typed API
if (Counter) {
  Counter.increment();           // ✓
  Counter.setValue(10);          // ✓
  const val = Counter.getValue(); // ✓ Returns number

  // Plus built-in properties
  Counter.root;     // HTMLElement
  Counter.destroy(); // () => void
}
```

### Full Type Example

```typescript
interface TodoRefs {
  input: HTMLInputElement;
  addBtn: HTMLButtonElement;
  list: HTMLUListElement;
}

interface TodoState {
  filter: 'all' | 'active' | 'completed';
}

interface TodoAPI {
  addTodo: (text: string) => void;
  setFilter: (filter: TodoState['filter']) => void;
  clearCompleted: () => void;
}

const TodoApp = defineComponent<TodoAPI, TodoRefs, any, TodoState>(
  '#todo-app',
  (ctx): TodoAPI => {
    ctx.state.filter = 'all';

    const addTodo = (text: string) => {
      // Implementation
    };

    const setFilter = (filter: TodoState['filter']) => {
      ctx.state.filter = filter;
    };

    const clearCompleted = () => {
      // Implementation
    };

    return { addTodo, setFilter, clearCompleted };
  }
);
```

## Core Concepts

### The Refs System

#### Single Refs

Add `data-ref="name"` to elements:

```html
<div id="app">
  <input data-ref="username" />
  <input data-ref="email" />
  <button data-ref="submit">Submit</button>
</div>
```

Access via `ctx.refs`:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.refs.username; // HTMLInputElement
  ctx.refs.email;    // HTMLInputElement
  ctx.refs.submit;   // HTMLButtonElement
});
```

#### Grouped Refs

Multiple elements with the same `data-ref` become arrays:

```html
<ul id="list">
  <li data-ref="item">Item 1</li>
  <li data-ref="item">Item 2</li>
  <li data-ref="item">Item 3</li>
</ul>
```

Access via `ctx.groups`:

```typescript
const List = defineComponent('#list', (ctx) => {
  ctx.groups.item; // HTMLLIElement[]
  ctx.groups.item.forEach(li => {
    console.log(li.textContent);
  });
});
```

**Important:** Refs are collected once at initialization. Dynamic refs added later won't be included.

### Reactive State

#### ctx.state - DOM-Synced State

`ctx.state` is a proxy over the root element's `data-*` attributes:

```typescript
const App = defineComponent('#app', (ctx) => {
  // Write to state
  ctx.state.count = 5;
  // Updates: <div id="app" data-count="5">

  // Read from state
  console.log(ctx.state.count); // "5" (string from DOM)

  // Watch for changes
  ctx.watch('count', (value) => {
    console.log('Count changed:', value);
  });
});
```

**Key Points:**
- Values are stored as strings in DOM attributes
- Reading `ctx.state.count` reads `data-count` attribute
- Writing triggers MutationObservers for watchers
- Good for: component state, configuration, small data
- Avoid for: large data, high-frequency updates

#### ctx.store() - Pure JavaScript State

For non-DOM state:

```typescript
const App = defineComponent('#app', (ctx) => {
  const localState = ctx.store({ items: [], cache: {} });

  localState.items.push('item1');
  localState.cache.key = 'value';

  // Not synced to DOM, faster for internal state
});
```

### Event Handling

#### ctx.on() - Event Listeners

```typescript
ctx.on(eventName, element, handler, options?)
```

```typescript
const App = defineComponent('#app', (ctx) => {
  // Single element
  ctx.on('click', ctx.refs.btn, () => {
    console.log('Button clicked');
  });

  // With selector (scoped to root)
  ctx.on('submit', 'form', (e) => {
    e.preventDefault();
  });

  // With options
  ctx.on('scroll', window, handleScroll, { passive: true });

  // Returns unsubscribe function
  const unsub = ctx.on('mousemove', ctx.root, handleMove);
  // unsub(); // Manual cleanup if needed
});
```

**Automatic Cleanup:** All listeners are removed when `destroy()` is called.

#### ctx.bindEvents() - Declarative Events

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.bindEvents({
    btn: {
      click: () => console.log('clicked'),
      mouseenter: () => console.log('hover')
    },
    input: {
      input: (e) => ctx.state.value = e.target.value,
      blur: () => validate()
    }
  });
});
```

### Watchers

#### ctx.watch() - State Watchers

```typescript
ctx.watch(key, handler)
```

Watch `data-*` attribute changes:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.state.count = 0;

  ctx.watch('count', (value) => {
    console.log('Count is now:', value);
    ctx.refs.display.textContent = value;
  });

  // Watcher fires immediately with current value!
  // Then fires on every change

  ctx.state.count = 5; // Triggers watcher
});
```

**Important:**
- Watchers fire immediately with the current value
- Values are always strings (from DOM attributes)
- Use type conversion if needed: `parseInt(value, 10)`

### Computed Values

#### ctx.computed() - Derived State

```typescript
ctx.computed(deps, compute)
```

Create derived reactive values:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.state.firstName = 'John';
  ctx.state.lastName = 'Doe';

  const fullName = ctx.computed(['firstName', 'lastName'], () => {
    return `${ctx.state.firstName} ${ctx.state.lastName}`;
  });

  console.log(fullName.value); // "John Doe"

  fullName.onChange((name) => {
    ctx.refs.display.textContent = name;
  });

  ctx.state.firstName = 'Jane'; // Triggers computed update
});
```

**Note:** Dependencies are explicit - list all state keys used in the computation.

### Lifecycle Hooks

#### ctx.onMount()

Executes after the setup function completes:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.onMount(() => {
    console.log('Component mounted');
    // Fetch initial data, start animations, etc.
  });

  // Multiple onMount callbacks are supported
  ctx.onMount(() => {
    console.log('Another mount callback');
  });

  return { /* API */ };
  // onMount callbacks run after this returns
});
```

#### ctx.onUnmount() & ctx.effect()

Register cleanup functions:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.onUnmount(() => {
    console.log('Component unmounting');
    // Cleanup custom resources
  });

  // ctx.effect() is an alias
  ctx.effect(() => {
    console.log('This runs on destroy');
  });

  // Both run when destroy() is called
});
```

**Note:** Most cleanup is automatic. Use these for custom resources like WebSockets, timers, or external libraries.

#### No onDeferred

**Important:** Despite what you might expect, there is no `onDeferred` hook in this library. Use `ctx.onMount()` for deferred execution after setup.

### Binding Utilities

#### ctx.bind.* - Pre-built Setters

The `bind` object provides common DOM update patterns:

```typescript
const App = defineComponent('#app', (ctx) => {
  // Text content
  const setText = ctx.bind.text(ctx.refs.title);
  setText('Hello World'); // Sets textContent

  // HTML content
  const setHtml = ctx.bind.html(ctx.refs.content);
  setHtml('<strong>Bold</strong>');

  // Attributes
  const setDisabled = ctx.bind.attr('disabled', ctx.refs.btn);
  setDisabled(true);

  // CSS classes
  const toggleActive = ctx.bind.toggle('active', ctx.refs.item);
  toggleActive(true); // Adds 'active' class

  // Styles
  const setColor = ctx.bind.style(ctx.refs.box, 'backgroundColor');
  setColor('red');

  // CSS variables
  const setThemeColor = ctx.bind.cssVar(ctx.root, '--theme-color');
  setThemeColor('#ff0000');

  // Input value
  const setInputValue = ctx.bind.input(ctx.refs.input, 'username');
  // Two-way binding: input ↔ ctx.state.username
});
```

#### ctx.bind.list() - List Rendering

```typescript
const renderItem = (item: Todo) => `
  <li>
    <span>${item.text}</span>
    <button data-id="${item.id}">Delete</button>
  </li>
`;

const App = defineComponent('#app', (ctx) => {
  const setTodos = ctx.bind.list(ctx.refs.list, renderItem);

  const todos = [
    { id: 1, text: 'Learn components' },
    { id: 2, text: 'Build app' }
  ];

  setTodos(todos); // Renders all items
});
```

#### ctx.bind.val() - Custom Reactive Values

```typescript
const App = defineComponent('#app', (ctx) => {
  const count = ctx.bind.val(0, (value) => {
    ctx.refs.display.textContent = String(value);
  });

  count(5);  // Sets to 5, triggers effect
  count(10); // Sets to 10, triggers effect
});
```

### Observers

#### ctx.observe.intersection()

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.observe.intersection(
    ctx.refs.lazyImage,
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
        }
      });
    },
    { threshold: 0.1 }
  );
});
```

#### ctx.observe.resize()

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.observe.resize(ctx.refs.panel, (entries) => {
    const { width, height } = entries[0].contentRect;
    console.log(`Panel resized to ${width}x${height}`);
  });
});
```

**Automatic Cleanup:** Observers disconnect when `destroy()` is called.

### Cleanup Architecture

All resources are automatically cleaned up when `destroy()` is called:

```typescript
const App = defineComponent('#app', (ctx) => {
  // These are all auto-tracked:
  ctx.on('click', ctx.refs.btn, handler);          // ✓
  ctx.watch('count', handler);                     // ✓
  ctx.observe.intersection(ctx.refs.img, handler); // ✓
  ctx.observe.resize(ctx.refs.panel, handler);     // ✓

  // Custom cleanup:
  ctx.onUnmount(() => {
    // Clean up non-tracked resources
    clearInterval(myInterval);
  });
});

// Later:
App?.destroy(); // Everything cleaned up automatically
```

**How it works:**
- `defineComponent` creates a `ListenerGroup`
- All tracked operations register cleanup functions
- `destroy()` calls `ListenerGroup.clear()`
- All cleanup functions execute in sequence

## Gotchas & Best Practices

### 1. Null Element Safety

`defineComponent` returns `null` if the target element doesn't exist:

```typescript
const App = defineComponent('#nonexistent', (ctx) => { /* ... */ });

// ✗ Don't do this:
App.increment(); // Runtime error if App is null

// ✓ Always check:
if (App) {
  App.increment();
}

// ✓ Or use optional chaining:
App?.increment();
App?.destroy();
```

### 2. Selector Scoping

All string selectors in context methods are scoped to the component root:

```typescript
const App = defineComponent('#app', (ctx) => {
  // ✓ Scoped: finds button inside #app
  ctx.find('button');
  ctx.on('click', 'button', handler);

  // ✗ Won't find elements outside #app
  ctx.find('#other-component button'); // null if outside

  // ✓ Use absolute references for global access
  ctx.on('click', document.querySelector('#global-btn'), handler);
});
```

### 3. State is DOM-Synced

`ctx.state` reads and writes actual DOM attributes:

```typescript
const App = defineComponent('#app', (ctx) => {
  // This writes to the DOM
  ctx.state.count = 0;
  // Result: <div id="app" data-count="0">

  // ✗ Don't do frequent updates via state
  for (let i = 0; i < 1000; i++) {
    ctx.state.value = i; // 1000 DOM writes!
  }

  // ✓ Use local variables for transient state
  let transient = 0;
  for (let i = 0; i < 1000; i++) {
    transient = i;
  }
  ctx.state.value = transient; // 1 DOM write

  // ✓ Or use ctx.store() for pure JS state
  const local = ctx.store({ count: 0 });
});
```

### 4. Refs are Collected Once

Refs are queried once during component initialization:

```typescript
const App = defineComponent('#app', (ctx) => {
  console.log(ctx.refs.dynamic); // undefined if added later

  // Add new element dynamically
  ctx.root.innerHTML += '<div data-ref="dynamic">New</div>';

  console.log(ctx.refs.dynamic); // Still undefined!

  // ✓ Re-query manually
  const dynamic = ctx.find('[data-ref="dynamic"]');
});
```

### 5. Watchers Fire Immediately

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.state.count = 5;

  ctx.watch('count', (val) => {
    // ⚠️ This runs IMMEDIATELY with current value
    console.log('Count:', val); // Logs "Count: 5" instantly

    // Be careful with side effects
    fetchData(val); // This will run on setup!
  });

  // ✓ Skip initial execution if needed
  let isFirst = true;
  ctx.watch('count', (val) => {
    if (isFirst) {
      isFirst = false;
      return;
    }
    fetchData(val);
  });
});
```

### 6. Type Coercion from State

DOM attributes are always strings:

```typescript
const App = defineComponent('#app', (ctx) => {
  ctx.state.count = 5;

  const value = ctx.state.count;
  console.log(typeof value); // "string"
  console.log(value === 5);  // false
  console.log(value === "5"); // true

  // ✓ Convert types explicitly
  const num = parseInt(ctx.state.count, 10);
  const bool = ctx.state.active === 'true';

  // ✓ Or use Data.read() for auto-parsing
  import { Data } from '@doeixd/dom';
  const parsed = Data.read(ctx.root)('count'); // Converts to number
});
```

### 7. No Re-rendering

Unlike React, components don't "re-render":

```typescript
// ✗ React-style thinking doesn't work
const App = defineComponent('#app', (ctx) => {
  ctx.state.items = [];

  // This won't update the UI automatically
  ctx.state.items.push('new item');
});

// ✓ Explicitly update the UI
const App = defineComponent('#app', (ctx) => {
  const items = ctx.store({ list: [] });

  const renderItems = ctx.bind.list(ctx.refs.list, item => `<li>${item}</li>`);

  const addItem = (item: string) => {
    items.list.push(item);
    renderItems(items.list); // Explicit update
  };

  return { addItem };
});
```

### 8. Avoid Duplicate Event Bindings

```typescript
// ✗ Don't bind events in loops or conditionals without cleanup
const App = defineComponent('#app', (ctx) => {
  function setupHandlers() {
    ctx.on('click', ctx.refs.btn, handler); // Multiple bindings!
  }

  setupHandlers();
  setupHandlers(); // btn now has 2 click handlers
});

// ✓ Bind once during setup
const App = defineComponent('#app', (ctx) => {
  ctx.on('click', ctx.refs.btn, handler);
});

// ✓ Or track and cleanup
const App = defineComponent('#app', (ctx) => {
  let unsub: (() => void) | null = null;

  function setupHandlers() {
    unsub?.(); // Remove previous
    unsub = ctx.on('click', ctx.refs.btn, handler);
  }
});
```

### Best Practices Summary

✓ **DO:**
- Check for null components: `App?.method()`
- Use `ctx.store()` for high-frequency state
- Convert types from `ctx.state` explicitly
- Use local variables for transient state
- Bind events once during setup
- Leverage automatic cleanup

✗ **DON'T:**
- Assume elements exist without checking
- Use `ctx.state` for high-frequency updates
- Expect watchers to skip initial execution
- Expect dynamic refs to appear automatically
- Bind events multiple times unintentionally
- Think in terms of "re-rendering"

## Real-World Examples

### Form with Validation

```typescript
interface FormRefs {
  username: HTMLInputElement;
  email: HTMLInputElement;
  password: HTMLInputElement;
  submitBtn: HTMLButtonElement;
  errorMsg: HTMLElement;
}

interface FormState {
  isValid: boolean;
}

interface FormAPI {
  submit: () => Promise<void>;
  reset: () => void;
  validate: () => boolean;
}

const SignupForm = defineComponent<FormAPI, FormRefs, any, FormState>(
  '#signup-form',
  (ctx): FormAPI => {
    ctx.state.isValid = false;

    const errors = ctx.store({ username: '', email: '', password: '' });

    const validateUsername = () => {
      const val = ctx.refs.username.value;
      if (val.length < 3) {
        errors.username = 'Username must be at least 3 characters';
        return false;
      }
      errors.username = '';
      return true;
    };

    const validateEmail = () => {
      const val = ctx.refs.email.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors.email = 'Invalid email address';
        return false;
      }
      errors.email = '';
      return true;
    };

    const validatePassword = () => {
      const val = ctx.refs.password.value;
      if (val.length < 8) {
        errors.password = 'Password must be at least 8 characters';
        return false;
      }
      errors.password = '';
      return true;
    };

    const validate = () => {
      const results = [
        validateUsername(),
        validateEmail(),
        validatePassword()
      ];

      const isValid = results.every(r => r);
      ctx.state.isValid = String(isValid);
      ctx.refs.submitBtn.disabled = !isValid;

      const errorText = Object.values(errors).filter(e => e).join(', ');
      ctx.refs.errorMsg.textContent = errorText;

      return isValid;
    };

    // Validate on blur
    ctx.on('blur', ctx.refs.username, validateUsername);
    ctx.on('blur', ctx.refs.email, validateEmail);
    ctx.on('blur', ctx.refs.password, validatePassword);

    // Validate on input
    ctx.on('input', ctx.refs.username, validate);
    ctx.on('input', ctx.refs.email, validate);
    ctx.on('input', ctx.refs.password, validate);

    const submit = async () => {
      if (!validate()) return;

      const data = {
        username: ctx.refs.username.value,
        email: ctx.refs.email.value,
        password: ctx.refs.password.value
      };

      try {
        await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        ctx.refs.errorMsg.textContent = 'Success!';
      } catch (err) {
        ctx.refs.errorMsg.textContent = 'Signup failed';
      }
    };

    const reset = () => {
      ctx.refs.username.value = '';
      ctx.refs.email.value = '';
      ctx.refs.password.value = '';
      ctx.refs.errorMsg.textContent = '';
      errors.username = '';
      errors.email = '';
      errors.password = '';
      ctx.state.isValid = 'false';
    };

    ctx.on('submit', 'form', (e) => {
      e.preventDefault();
      submit();
    });

    return { submit, reset, validate };
  }
);
```

### Dynamic List Component

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface ListRefs {
  input: HTMLInputElement;
  list: HTMLUListElement;
  addBtn: HTMLButtonElement;
}

interface ListAPI {
  addTodo: (text: string) => void;
  removeTodo: (id: number) => void;
  toggleTodo: (id: number) => void;
  clearCompleted: () => void;
}

const TodoList = defineComponent<ListAPI, ListRefs>(
  '#todo-list',
  (ctx): ListAPI => {
    const state = ctx.store<{ todos: Todo[]; nextId: number }>({
      todos: [],
      nextId: 1
    });

    const renderTodo = (todo: Todo) => `
      <li data-id="${todo.id}" class="${todo.completed ? 'completed' : ''}">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} />
        <span>${todo.text}</span>
        <button class="delete">Delete</button>
      </li>
    `;

    const render = ctx.bind.list(ctx.refs.list, renderTodo);

    const addTodo = (text: string) => {
      if (!text.trim()) return;

      state.todos.push({
        id: state.nextId++,
        text: text.trim(),
        completed: false
      });

      render(state.todos);
    };

    const removeTodo = (id: number) => {
      state.todos = state.todos.filter(t => t.id !== id);
      render(state.todos);
    };

    const toggleTodo = (id: number) => {
      const todo = state.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        render(state.todos);
      }
    };

    const clearCompleted = () => {
      state.todos = state.todos.filter(t => !t.completed);
      render(state.todos);
    };

    // Event delegation
    ctx.on('click', ctx.refs.list, (e) => {
      const target = e.target as HTMLElement;
      const li = target.closest('li');
      if (!li) return;

      const id = parseInt(li.dataset.id!, 10);

      if (target.matches('.delete')) {
        removeTodo(id);
      } else if (target.matches('input[type="checkbox"]')) {
        toggleTodo(id);
      }
    });

    ctx.on('click', ctx.refs.addBtn, () => {
      addTodo(ctx.refs.input.value);
      ctx.refs.input.value = '';
    });

    ctx.on('keypress', ctx.refs.input, (e) => {
      if (e.key === 'Enter') {
        addTodo(ctx.refs.input.value);
        ctx.refs.input.value = '';
      }
    });

    return { addTodo, removeTodo, toggleTodo, clearCompleted };
  }
);
```

### Tab Component

```typescript
interface TabRefs {
  container: HTMLElement;
}

interface TabGroups {
  tabs: HTMLButtonElement[];
  panels: HTMLDivElement[];
}

interface TabState {
  activeTab: number;
}

interface TabAPI {
  selectTab: (index: number) => void;
  next: () => void;
  prev: () => void;
}

const Tabs = defineComponent<TabAPI, TabRefs, TabGroups, TabState>(
  '#tabs',
  (ctx): TabAPI => {
    ctx.state.activeTab = 0;

    const selectTab = (index: number) => {
      if (index < 0 || index >= ctx.groups.tabs.length) return;

      ctx.state.activeTab = index;

      // Update tabs
      ctx.groups.tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
        tab.setAttribute('aria-selected', String(i === index));
      });

      // Update panels
      ctx.groups.panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
    };

    const next = () => {
      const current = parseInt(ctx.state.activeTab, 10);
      selectTab((current + 1) % ctx.groups.tabs.length);
    };

    const prev = () => {
      const current = parseInt(ctx.state.activeTab, 10);
      const newIndex = current - 1;
      selectTab(newIndex < 0 ? ctx.groups.tabs.length - 1 : newIndex);
    };

    // Click handlers
    ctx.groups.tabs.forEach((tab, index) => {
      ctx.on('click', tab, () => selectTab(index));
    });

    // Keyboard navigation
    ctx.on('keydown', ctx.refs.container, (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    });

    // Initialize
    ctx.onMount(() => {
      selectTab(0);
    });

    return { selectTab, next, prev };
  }
);
```

### Modal Component

```typescript
interface ModalRefs {
  overlay: HTMLElement;
  dialog: HTMLElement;
  closeBtn: HTMLButtonElement;
  content: HTMLElement;
}

interface ModalState {
  isOpen: boolean;
}

interface ModalAPI {
  open: (content?: string) => void;
  close: () => void;
  toggle: () => void;
}

const Modal = defineComponent<ModalAPI, ModalRefs, any, ModalState>(
  '#modal',
  (ctx): ModalAPI => {
    ctx.state.isOpen = false;

    const open = (content?: string) => {
      if (content) {
        ctx.refs.content.innerHTML = content;
      }

      ctx.state.isOpen = true;
      ctx.root.style.display = 'block';
      ctx.refs.overlay.classList.add('visible');
      ctx.refs.dialog.classList.add('visible');
      document.body.style.overflow = 'hidden';

      // Focus trap
      ctx.refs.closeBtn.focus();
    };

    const close = () => {
      ctx.state.isOpen = false;
      ctx.refs.overlay.classList.remove('visible');
      ctx.refs.dialog.classList.remove('visible');

      // Wait for animation
      setTimeout(() => {
        ctx.root.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
    };

    const toggle = () => {
      ctx.state.isOpen === 'true' ? close() : open();
    };

    // Close button
    ctx.on('click', ctx.refs.closeBtn, close);

    // Overlay click
    ctx.on('click', ctx.refs.overlay, close);

    // Prevent dialog clicks from closing
    ctx.on('click', ctx.refs.dialog, (e) => {
      e.stopPropagation();
    });

    // ESC key
    ctx.on('keydown', document, (e) => {
      if (e.key === 'Escape' && ctx.state.isOpen === 'true') {
        close();
      }
    });

    // Cleanup
    ctx.onUnmount(() => {
      document.body.style.overflow = '';
    });

    return { open, close, toggle };
  }
);
```

## API Reference

### defineComponent

```typescript
function defineComponent<API, R, G, S>(
  target: string | HTMLElement | null,
  setup: (ctx: ComponentContext<R, G, S>, auto: AutoCleanup) => API | void
): ComponentInstance<API> | null
```

Creates a component instance.

**Parameters:**
- `target` - CSS selector or element reference
- `setup` - Setup function receiving ComponentContext and `auto`


**Returns:**
- Component instance with merged API or null if element not found

### ComponentContext

Complete context object provided to setup function:

#### Properties

- `root: HTMLElement` - The component root element
- `refs: R` - Single `data-ref` elements
- `groups: G` - Grouped `data-ref` elements (arrays)
- `state: S` - Reactive proxy over `data-*` attributes
- `store: typeof createStore` - Pure JS state creator

#### DOM Methods

- `find(selector: string): HTMLElement | null` - Query scoped to root
- `findAll(selector: string): HTMLElement[]` - Query all scoped to root

#### Binding Methods

- `bind.text(el): Setter<string>` - Text content setter
- `bind.html(el): Setter<string>` - HTML setter
- `bind.attr(name, el?): Setter<any>` - Attribute setter
- `bind.toggle(className, el?): Setter<boolean>` - Class toggle
- `bind.style(el, property): Setter<string | number>` - Style setter
- `bind.cssVar(el, varName): Setter<string | number>` - CSS variable setter
- `bind.input(el, stateKey): void` - Two-way input binding
- `bind.list<T>(el, renderFn): Setter<T[]>` - List renderer
- `bind.val<T>(initial, effect): Setter<T>` - Custom reactive value
- `binder<S>(schema: S): BoundSetters<S>` - Create setter map from schema
- `bindEvents(schema: EventSchema): void` - Declarative event binding

#### Reactivity

- `watch(key: string, handler: (val: any) => void): void` - Watch state changes
- `computed<T>(deps: string[], compute: () => T): ComputedValue<T>` - Computed value

#### Events

- `on(event: string, element: string | Element, handler: Function, options?): Unsubscribe` - Event listener

#### Lifecycle

- `onMount(fn: () => void): void` - Execute after setup
- `onUnmount(fn: () => void): void` - Execute on destroy
- `effect(cleanup: Unsubscribe): void` - Register cleanup (alias for onUnmount)

#### Observers

- `observe.intersection(el, callback, options?): void` - Intersection observer
- `observe.resize(el, callback): void` - Resize observer

#### Utilities

- `chain<T>(el, ...transforms): T | null` - Apply transforms pipeline
- `exec<T>(el, ...operations): T | null` - Execute operations pipeline

### ComponentInstance

```typescript
type ComponentInstance<API> = API & {
  root: HTMLElement;
  destroy: () => void;
}
```

Returned component instance includes:
- All properties from your returned API
- `root` - Reference to root element
- `destroy()` - Cleanup function

### mountComponent

```typescript
function mountComponent<P>(
  template: (props: P) => HTMLElement,
  component: (el: HTMLElement, props: P) => ComponentInstance<any> | null,
  target: HTMLElement,
  props: P
): ComponentInstance<any> | null
```

Dynamically create and mount a component.

**Parameters:**
- `template` - Function creating the element
- `component` - Component factory function
- `target` - Where to append the element
- `props` - Initial props

**Returns:**
- Component instance or null

**Example:**
```typescript
const template = (props) => {
  const div = document.createElement('div');
  div.id = props.id;
  div.innerHTML = `<span data-ref="label">${props.label}</span>`;
  return div;
};

const component = (el, props) => defineComponent(el, (ctx) => {
  return { /* API */ };
});

const instance = mountComponent(template, component, document.body, {
  id: 'my-component',
  label: 'Hello'
});
```

---

For advanced patterns and abstractions, see [Component Patterns](./component-patterns.md).
