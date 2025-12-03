# Advanced Component Patterns

This guide covers advanced patterns and techniques for building higher-level abstractions on top of the `defineComponent` system.

## Table of Contents

1. [The Binder Pattern](#the-binder-pattern)
2. [Chain and Exec Patterns](#chain-and-exec-patterns)
3. [Component Composition](#component-composition)
4. [Custom Hooks Pattern](#custom-hooks-pattern)
5. [Plugin System](#plugin-system)
6. [State Management Patterns](#state-management-patterns)
7. [Dynamic Components](#dynamic-components)
8. [Testing Components](#testing-components)

## The Binder Pattern

The binder pattern separates UI updates from business logic by creating a typed map of setter functions.

### Basic Binder Usage

```typescript
import { defineComponent, bind, apply } from '@doeixd/dom';

interface UserRefs {
  name: HTMLElement;
  email: HTMLElement;
  avatar: HTMLImageElement;
  status: HTMLElement;
}

const UserCard = defineComponent<any, UserRefs>('#user-card', (ctx) => {
  // Create setter map from schema
  const ui = ctx.binder({
    name: bind.text,
    email: bind.text,
    avatar: bind.attr('src'),
    status: bind.toggle('online')
  });

  // Apply data to UI in one call
  apply(ui, {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: '/avatars/alice.jpg',
    status: true
  });

  return {
    updateUser: (data) => apply(ui, data)
  };
});
```

### Type-Safe Binder Pattern

```typescript
import { BoundSetters, InferData } from '@doeixd/dom';

interface ProductRefs {
  title: HTMLElement;
  price: HTMLElement;
  stock: HTMLElement;
  image: HTMLImageElement;
  badge: HTMLElement;
}

const ProductCard = defineComponent<any, ProductRefs>('#product', (ctx) => {
  const ui = ctx.binder({
    title: bind.text,
    price: bind.text,
    stock: bind.text,
    image: bind.attr('src'),
    badge: bind.toggle('sale')
  });

  // InferData extracts the shape from setters
  type ProductData = InferData<typeof ui>;
  // {
  //   title: string,
  //   price: string,
  //   stock: string,
  //   image: string,
  //   badge: boolean
  // }

  const update = apply(ui);

  return {
    setProduct: (product: ProductData) => update(product)
  };
});
```

### Computed Binder Values

```typescript
interface DashboardRefs {
  total: HTMLElement;
  average: HTMLElement;
  trend: HTMLElement;
}

const Dashboard = defineComponent<any, DashboardRefs>('#dashboard', (ctx) => {
  const ui = ctx.binder({
    total: bind.text,
    average: bind.text,
    trend: bind.toggle('trending-up')
  });

  const updateStats = (values: number[]) => {
    const total = values.reduce((a, b) => a + b, 0);
    const average = total / values.length;
    const trend = values[values.length - 1] > values[values.length - 2];

    apply(ui, {
      total: String(total),
      average: average.toFixed(2),
      trend
    });
  };

  return { updateStats };
});
```

### Custom Bind Functions

Create your own bind utilities:

```typescript
import { Setter } from '@doeixd/dom';

// Currency formatter
const bindCurrency = (el: HTMLElement | null): Setter<number> => {
  if (!el) return () => {};
  return (value: number) => {
    el.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
};

// Date formatter
const bindDate = (el: HTMLElement | null, format: 'short' | 'long' = 'short'): Setter<Date> => {
  if (!el) return () => {};
  return (value: Date) => {
    el.textContent = new Intl.DateTimeFormat('en-US', {
      dateStyle: format
    }).format(value);
  };
};

// Markdown renderer
const bindMarkdown = (el: HTMLElement | null): Setter<string> => {
  if (!el) return () => {};
  return (markdown: string) => {
    // Use your markdown parser
    el.innerHTML = parseMarkdown(markdown);
  };
};

// Usage
const Article = defineComponent('#article', (ctx) => {
  const ui = ctx.binder({
    title: bind.text,
    price: bindCurrency,
    publishDate: bindDate,
    content: bindMarkdown
  });

  apply(ui, {
    title: 'My Article',
    price: 29.99,
    publishDate: new Date(),
    content: '# Hello\n\nThis is **markdown**'
  });
});
```

## Chain and Exec Patterns

These utilities allow you to compose transformations in a pipeline style.

### Chain Pattern - Pre-configured Transforms

```typescript
import { defineComponent, cls, css, modify } from '@doeixd/dom';

const Card = defineComponent('#card', (ctx) => {
  // Apply multiple transforms at once
  ctx.chain(
    ctx.refs.button,
    cls.add('btn', 'btn-primary'),
    css({
      padding: '10px 20px',
      borderRadius: '4px'
    }),
    modify({ text: 'Click me' })
  );

  // Works with selectors (scoped to root)
  ctx.chain(
    '.card-header',
    cls.add('sticky'),
    css({ top: '0', zIndex: '10' })
  );

  return {};
});
```

### Exec Pattern - Runtime Callbacks

```typescript
const ThemeCard = defineComponent('#themed-card', (ctx) => {
  const theme = ctx.state.theme || 'light';

  // Execute functions with runtime values
  ctx.exec(
    ctx.root,
    el => cls.add(el)(`theme-${theme}`),
    el => css(el)({ backgroundColor: theme === 'dark' ? '#333' : '#fff' }),
    el => on(el)('click', () => console.log('Theme:', theme))
  );

  return {};
});
```

### Building Custom Transform Pipelines

```typescript
type Transform<T> = (el: HTMLElement) => T;

function pipeline<T>(el: HTMLElement | string | null, ...transforms: Transform<any>[]): T | null {
  if (!el) return null;

  const element = typeof el === 'string'
    ? document.querySelector(el)
    : el;

  if (!element) return null;

  let result: any = element;
  for (const transform of transforms) {
    result = transform(result);
  }

  return result;
}

// Create reusable transforms
const makeClickable = (handler: () => void): Transform<HTMLElement> => {
  return (el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', handler);
    return el;
  };
};

const fadeIn = (duration: number = 300): Transform<HTMLElement> => {
  return (el) => {
    el.style.opacity = '0';
    el.style.transition = `opacity ${duration}ms`;
    setTimeout(() => { el.style.opacity = '1'; }, 0);
    return el;
  };
};

const withTooltip = (text: string): Transform<HTMLElement> => {
  return (el) => {
    el.title = text;
    el.setAttribute('data-tooltip', text);
    return el;
  };
};

// Use in components
const App = defineComponent('#app', (ctx) => {
  pipeline(
    ctx.refs.button,
    makeClickable(() => console.log('clicked')),
    fadeIn(500),
    withTooltip('Click to continue')
  );
});
```

## Component Composition

### Parent-Child Communication

```typescript
// Child component
interface CounterAPI {
  increment: () => void;
  getValue: () => number;
  onChange: (cb: (val: number) => void) => void;
}

const Counter = defineComponent<CounterAPI>('#counter', (ctx) => {
  ctx.state.count = 0;
  const listeners: Array<(val: number) => void> = [];

  const increment = () => {
    ctx.state.count++;
    const val = parseInt(ctx.state.count, 10);
    listeners.forEach(cb => cb(val));
  };

  const getValue = () => parseInt(ctx.state.count, 10);

  const onChange = (cb: (val: number) => void) => {
    listeners.push(cb);
  };

  ctx.on('click', ctx.refs.btn, increment);

  return { increment, getValue, onChange };
});

// Parent component
const App = defineComponent('#app', (ctx) => {
  if (!Counter) return {};

  // Listen to child changes
  Counter.onChange((value) => {
    console.log('Counter changed:', value);
    ctx.refs.display.textContent = `Total: ${value}`;
  });

  return {
    resetCounter: () => Counter.destroy()
  };
});
```

### Component Registry Pattern

```typescript
type ComponentFactory<T = any> = (el: HTMLElement) => T | null;

class ComponentRegistry {
  private components = new Map<string, ComponentFactory>();
  private instances = new Map<HTMLElement, any>();

  register(name: string, factory: ComponentFactory) {
    this.components.set(name, factory);
  }

  mount(name: string, el: HTMLElement) {
    const factory = this.components.get(name);
    if (!factory) {
      console.warn(`Component "${name}" not registered`);
      return null;
    }

    const instance = factory(el);
    if (instance) {
      this.instances.set(el, instance);
    }
    return instance;
  }

  mountAll(name: string, selector: string) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => this.mount(name, el as HTMLElement));
  }

  destroy(el: HTMLElement) {
    const instance = this.instances.get(el);
    if (instance?.destroy) {
      instance.destroy();
    }
    this.instances.delete(el);
  }

  destroyAll() {
    this.instances.forEach((instance, el) => {
      if (instance?.destroy) {
        instance.destroy();
      }
    });
    this.instances.clear();
  }
}

// Usage
const registry = new ComponentRegistry();

registry.register('counter', (el) =>
  defineComponent(el, (ctx) => {
    // Counter implementation
    return {};
  })
);

registry.register('todo-list', (el) =>
  defineComponent(el, (ctx) => {
    // TodoList implementation
    return {};
  })
);

// Mount components
registry.mountAll('counter', '[data-component="counter"]');
registry.mountAll('todo-list', '[data-component="todo-list"]');

// Cleanup
registry.destroyAll();
```

### Slots Pattern

```typescript
interface CardRefs {
  header: HTMLElement;
  body: HTMLElement;
  footer: HTMLElement;
}

interface CardAPI {
  setHeader: (content: string | HTMLElement) => void;
  setBody: (content: string | HTMLElement) => void;
  setFooter: (content: string | HTMLElement) => void;
}

const Card = defineComponent<CardAPI, CardRefs>('#card', (ctx): CardAPI => {
  const setSlot = (slot: HTMLElement, content: string | HTMLElement) => {
    if (typeof content === 'string') {
      slot.innerHTML = content;
    } else {
      slot.innerHTML = '';
      slot.appendChild(content);
    }
  };

  return {
    setHeader: (content) => setSlot(ctx.refs.header, content),
    setBody: (content) => setSlot(ctx.refs.body, content),
    setFooter: (content) => setSlot(ctx.refs.footer, content)
  };
});

// Usage
if (Card) {
  Card.setHeader('<h2>Title</h2>');
  Card.setBody('<p>Content here</p>');
  Card.setFooter('<button>Close</button>');
}
```

## Custom Hooks Pattern

Create reusable logic that can be shared across components:

### useDebounce Hook

```typescript
function useDebounce(delay: number = 300) {
  let timeoutId: number | null = null;

  return (callback: () => void) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(callback, delay) as any;
  };
}

// Usage
const SearchBox = defineComponent('#search', (ctx) => {
  const debounce = useDebounce(500);

  ctx.on('input', ctx.refs.input, () => {
    debounce(() => {
      const query = ctx.refs.input.value;
      performSearch(query);
    });
  });

  return {};
});
```

### useLocalStorage Hook

```typescript
interface StorageHook<T> {
  get: () => T | null;
  set: (value: T) => void;
  remove: () => void;
  onChange: (callback: (value: T | null) => void) => () => void;
}

function useLocalStorage<T>(key: string, defaultValue?: T): StorageHook<T> {
  const listeners: Array<(value: T | null) => void> = [];

  const get = (): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  };

  const set = (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      listeners.forEach(cb => cb(value));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const remove = () => {
    localStorage.removeItem(key);
    listeners.forEach(cb => cb(null));
  };

  const onChange = (callback: (value: T | null) => void) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  };

  return { get, set, remove, onChange };
}

// Usage
const PrefsPanel = defineComponent('#prefs', (ctx) => {
  const storage = useLocalStorage<{ theme: string; fontSize: number }>('user-prefs', {
    theme: 'light',
    fontSize: 16
  });

  const prefs = storage.get();
  if (prefs) {
    ctx.state.theme = prefs.theme;
    ctx.state.fontSize = String(prefs.fontSize);
  }

  ctx.watch('theme', (theme) => {
    const current = storage.get()!;
    storage.set({ ...current, theme });
  });

  ctx.watch('fontSize', (size) => {
    const current = storage.get()!;
    storage.set({ ...current, fontSize: parseInt(size, 10) });
  });

  return {};
});
```

### useFetch Hook

```typescript
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface FetchHook<T> {
  fetch: (url: string, options?: RequestInit) => Promise<void>;
  state: FetchState<T>;
  refetch: () => Promise<void>;
}

function useFetch<T>(): FetchHook<T> {
  const state: FetchState<T> = {
    data: null,
    loading: false,
    error: null
  };

  let lastUrl: string = '';
  let lastOptions: RequestInit | undefined;

  const fetchData = async (url: string, options?: RequestInit) => {
    lastUrl = url;
    lastOptions = options;

    state.loading = true;
    state.error = null;

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      state.data = await response.json();
    } catch (err) {
      state.error = err as Error;
    } finally {
      state.loading = false;
    }
  };

  const refetch = () => fetchData(lastUrl, lastOptions);

  return {
    fetch: fetchData,
    state,
    refetch
  };
}

// Usage
interface User {
  id: number;
  name: string;
  email: string;
}

const UserProfile = defineComponent('#profile', (ctx) => {
  const { fetch, state, refetch } = useFetch<User>();

  const ui = ctx.binder({
    name: bind.text,
    email: bind.text,
    loading: bind.toggle('loading'),
    error: bind.text
  });

  const loadUser = async (userId: number) => {
    await fetch(`/api/users/${userId}`);

    apply(ui, {
      name: state.data?.name || '',
      email: state.data?.email || '',
      loading: state.loading,
      error: state.error?.message || ''
    });
  };

  ctx.on('click', ctx.refs.refreshBtn, () => refetch());

  ctx.onMount(() => {
    loadUser(1);
  });

  return { loadUser };
});
```

### useEventBus Hook

```typescript
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);

    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    handlers.forEach(handler => handler(...args));
  }

  clear() {
    this.events.clear();
  }
}

const globalBus = new EventBus();

function useEventBus(bus: EventBus = globalBus) {
  return {
    on: (event: string, handler: EventHandler) => bus.on(event, handler),
    emit: (event: string, ...args: any[]) => bus.emit(event, ...args),
    bus
  };
}

// Usage - Component A
const ComponentA = defineComponent('#comp-a', (ctx) => {
  const { emit } = useEventBus();

  ctx.on('click', ctx.refs.btn, () => {
    emit('user:login', { userId: 123, name: 'Alice' });
  });

  return {};
});

// Usage - Component B
const ComponentB = defineComponent('#comp-b', (ctx) => {
  const { on } = useEventBus();

  const unsub = on('user:login', (userData) => {
    console.log('User logged in:', userData);
    ctx.refs.welcome.textContent = `Welcome, ${userData.name}!`;
  });

  ctx.onUnmount(unsub);

  return {};
});
```

## Plugin System

Create a plugin architecture for extending component functionality:

```typescript
interface ComponentPlugin {
  name: string;
  install: (ctx: any) => any;
}

function createPluginSystem() {
  const plugins: ComponentPlugin[] = [];

  return {
    register(plugin: ComponentPlugin) {
      plugins.push(plugin);
    },

    enhance<R, G, S>(ctx: ComponentContext<R, G, S>) {
      const enhancements = {};
      plugins.forEach(plugin => {
        Object.assign(enhancements, plugin.install(ctx));
      });
      return { ...ctx, ...enhancements };
    }
  };
}

// Example plugins
const loggerPlugin: ComponentPlugin = {
  name: 'logger',
  install: (ctx) => ({
    log: (message: string, ...args: any[]) => {
      console.log(`[${ctx.root.id}]`, message, ...args);
    },
    logState: () => {
      console.log(`[${ctx.root.id}] State:`, ctx.state);
    }
  })
};

const validatorPlugin: ComponentPlugin = {
  name: 'validator',
  install: (ctx) => {
    const rules = new Map<string, (value: any) => boolean>();

    return {
      addRule: (field: string, validator: (value: any) => boolean) => {
        rules.set(field, validator);
      },
      validate: (field: string, value: any) => {
        const rule = rules.get(field);
        return rule ? rule(value) : true;
      },
      validateAll: (data: Record<string, any>) => {
        return Object.entries(data).every(([field, value]) => {
          const rule = rules.get(field);
          return rule ? rule(value) : true;
        });
      }
    };
  }
};

// Usage
const pluginSystem = createPluginSystem();
pluginSystem.register(loggerPlugin);
pluginSystem.register(validatorPlugin);

const App = defineComponent('#app', (baseCtx) => {
  const ctx = pluginSystem.enhance(baseCtx);

  // Now ctx has logger and validator methods
  ctx.log('Component initialized');

  ctx.addRule('email', (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  ctx.addRule('age', (val: number) => val >= 18);

  const isValid = ctx.validate('email', 'test@example.com');
  ctx.log('Email valid:', isValid);

  return {};
});
```

## State Management Patterns

### Centralized Store

```typescript
interface StoreState {
  user: { id: number; name: string } | null;
  cart: Array<{ id: number; quantity: number }>;
  isLoading: boolean;
}

class Store<T extends Record<string, any>> {
  private state: T;
  private listeners = new Map<keyof T, Array<(value: any) => void>>();

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    this.state[key] = value;
    this.notify(key, value);
  }

  update<K extends keyof T>(key: K, updater: (prev: T[K]) => T[K]) {
    const newValue = updater(this.state[key]);
    this.set(key, newValue);
  }

  subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(listener);

    // Return unsubscribe function
    return () => {
      const arr = this.listeners.get(key);
      if (!arr) return;
      const index = arr.indexOf(listener);
      if (index > -1) arr.splice(index, 1);
    };
  }

  private notify<K extends keyof T>(key: K, value: T[K]) {
    const arr = this.listeners.get(key);
    if (!arr) return;
    arr.forEach(listener => listener(value));
  }

  getState(): Readonly<T> {
    return { ...this.state };
  }
}

// Create global store
const appStore = new Store<StoreState>({
  user: null,
  cart: [],
  isLoading: false
});

// Use in components
const Header = defineComponent('#header', (ctx) => {
  const unsub = appStore.subscribe('user', (user) => {
    ctx.refs.username.textContent = user?.name || 'Guest';
  });

  ctx.onUnmount(unsub);

  return {};
});

const Cart = defineComponent('#cart', (ctx) => {
  const unsub = appStore.subscribe('cart', (cart) => {
    ctx.refs.count.textContent = String(cart.length);
  });

  ctx.onUnmount(unsub);

  return {
    addItem: (id: number) => {
      appStore.update('cart', (prev) => [...prev, { id, quantity: 1 }]);
    }
  };
});
```

### Action/Reducer Pattern

```typescript
type Action<T = any> = { type: string; payload?: T };
type Reducer<S> = (state: S, action: Action) => S;

function createReducerStore<S>(initialState: S, reducer: Reducer<S>) {
  let state = initialState;
  const listeners: Array<(state: S) => void> = [];

  return {
    dispatch: (action: Action) => {
      state = reducer(state, action);
      listeners.forEach(listener => listener(state));
    },

    getState: () => state,

    subscribe: (listener: (state: S) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    }
  };
}

// Example reducer
interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
}

function todoReducer(state: TodoState, action: Action): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload
      };

    default:
      return state;
  }
}

const todoStore = createReducerStore<TodoState>(
  { todos: [], filter: 'all' },
  todoReducer
);

// Use in component
const TodoApp = defineComponent('#todo-app', (ctx) => {
  const renderTodos = ctx.bind.list(ctx.refs.list, (todo) => `
    <li class="${todo.completed ? 'completed' : ''}">
      <input type="checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''} />
      <span>${todo.text}</span>
    </li>
  `);

  const unsub = todoStore.subscribe((state) => {
    const filtered = state.todos.filter(todo => {
      if (state.filter === 'active') return !todo.completed;
      if (state.filter === 'completed') return todo.completed;
      return true;
    });

    renderTodos(filtered);
  });

  ctx.onUnmount(unsub);

  return {
    addTodo: (text: string) => {
      todoStore.dispatch({
        type: 'ADD_TODO',
        payload: { id: Date.now(), text, completed: false }
      });
    },

    toggleTodo: (id: number) => {
      todoStore.dispatch({
        type: 'TOGGLE_TODO',
        payload: id
      });
    },

    setFilter: (filter: TodoState['filter']) => {
      todoStore.dispatch({
        type: 'SET_FILTER',
        payload: filter
      });
    }
  };
});
```

## Dynamic Components

### Runtime Component Creation

```typescript
import { mountComponent } from '@doeixd/dom';

interface DynamicCardProps {
  title: string;
  content: string;
  onClose?: () => void;
}

// Template factory
const cardTemplate = (props: DynamicCardProps) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <h3 data-ref="title">${props.title}</h3>
      <button data-ref="closeBtn">×</button>
    </div>
    <div class="card-body" data-ref="content">${props.content}</div>
  `;
  return card;
};

// Component factory
const cardComponent = (el: HTMLElement, props: DynamicCardProps) => {
  return defineComponent(el, (ctx) => {
    if (props.onClose) {
      ctx.on('click', ctx.refs.closeBtn, () => {
        props.onClose!();
        ctx.root.remove();
      });
    }

    return {
      setTitle: (title: string) => {
        ctx.refs.title.textContent = title;
      },
      setContent: (content: string) => {
        ctx.refs.content.innerHTML = content;
      }
    };
  });
};

// Usage
const App = defineComponent('#app', (ctx) => {
  const cards: any[] = [];

  return {
    addCard: (props: DynamicCardProps) => {
      const card = mountComponent(
        cardTemplate,
        cardComponent,
        ctx.refs.container,
        {
          ...props,
          onClose: () => {
            const index = cards.indexOf(card);
            if (index > -1) cards.splice(index, 1);
          }
        }
      );

      if (card) cards.push(card);
      return card;
    },

    clearCards: () => {
      cards.forEach(card => card?.destroy());
      cards.length = 0;
    }
  };
});

// Create cards dynamically
App?.addCard({
  title: 'Card 1',
  content: 'This is card 1'
});

App?.addCard({
  title: 'Card 2',
  content: 'This is card 2'
});
```

### Component Factory Pattern

```typescript
function createComponentFactory<P, API>(
  template: (props: P) => HTMLElement,
  setup: (ctx: any, props: P) => API
) {
  return {
    create: (props: P, target?: HTMLElement): (API & { destroy: () => void }) | null => {
      const el = template(props);

      if (target) {
        target.appendChild(el);
      }

      const component = defineComponent(el, (ctx) => setup(ctx, props));

      return component;
    },

    createMany: (items: P[], target: HTMLElement) => {
      return items.map(props => {
        const el = template(props);
        target.appendChild(el);
        return defineComponent(el, (ctx) => setup(ctx, props));
      }).filter(Boolean);
    }
  };
}

// Usage
interface ItemProps {
  id: number;
  label: string;
}

const itemFactory = createComponentFactory<ItemProps, any>(
  (props) => {
    const div = document.createElement('div');
    div.innerHTML = `<span data-ref="label">${props.label}</span>`;
    return div;
  },
  (ctx, props) => ({
    update: (label: string) => {
      ctx.refs.label.textContent = label;
    },
    getId: () => props.id
  })
);

// Create single item
const item = itemFactory.create({ id: 1, label: 'Item 1' }, container);

// Create many items
const items = itemFactory.createMany(
  [
    { id: 1, label: 'Item 1' },
    { id: 2, label: 'Item 2' },
    { id: 3, label: 'Item 3' }
  ],
  container
);
```

## Testing Components

### Unit Testing Setup

```typescript
// test-utils.ts
export function createTestElement(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div.firstElementChild as HTMLElement;
}

export function cleanupTestElement(el: HTMLElement) {
  el.parentElement?.remove();
}

export async function wait(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function fireEvent(el: HTMLElement, eventName: string, detail?: any) {
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  el.dispatchEvent(event);
}
```

### Example Tests

```typescript
import { defineComponent } from '@doeixd/dom';
import { createTestElement, cleanupTestElement, fireEvent } from './test-utils';

describe('Counter Component', () => {
  let root: HTMLElement;
  let component: any;

  beforeEach(() => {
    root = createTestElement(`
      <div id="counter" data-count="0">
        <span data-ref="display">0</span>
        <button data-ref="btn">+</button>
      </div>
    `);

    component = defineComponent('#counter', (ctx) => {
      ctx.state.count = 0;

      ctx.on('click', ctx.refs.btn, () => {
        ctx.state.count++;
      });

      ctx.watch('count', (val) => {
        ctx.refs.display.textContent = val;
      });

      return {
        increment: () => { ctx.state.count++; },
        getValue: () => parseInt(ctx.state.count, 10)
      };
    });
  });

  afterEach(() => {
    component?.destroy();
    cleanupTestElement(root);
  });

  test('initializes with count 0', () => {
    expect(component.getValue()).toBe(0);
    expect(root.querySelector('[data-ref="display"]')?.textContent).toBe('0');
  });

  test('increments on button click', () => {
    const btn = root.querySelector('[data-ref="btn"]') as HTMLButtonElement;
    fireEvent(btn, 'click');

    expect(component.getValue()).toBe(1);
  });

  test('updates display on increment', async () => {
    component.increment();

    // Wait for watchers to fire
    await wait(10);

    const display = root.querySelector('[data-ref="display"]');
    expect(display?.textContent).toBe('1');
  });

  test('cleans up on destroy', () => {
    const btn = root.querySelector('[data-ref="btn"]') as HTMLButtonElement;

    component.destroy();
    fireEvent(btn, 'click');

    // Count should not change after destroy
    expect(component.getValue()).toBe(0);
  });
});
```

### Integration Testing

```typescript
describe('Todo App Integration', () => {
  let root: HTMLElement;
  let app: any;

  beforeEach(() => {
    root = createTestElement(`
      <div id="todo-app">
        <input data-ref="input" />
        <button data-ref="addBtn">Add</button>
        <ul data-ref="list"></ul>
      </div>
    `);

    app = TodoApp; // Assuming TodoApp is already defined
  });

  afterEach(() => {
    app?.destroy();
    cleanupTestElement(root);
  });

  test('adds todo on button click', async () => {
    const input = root.querySelector('[data-ref="input"]') as HTMLInputElement;
    const btn = root.querySelector('[data-ref="addBtn"]') as HTMLButtonElement;

    input.value = 'Test todo';
    fireEvent(btn, 'click');

    await wait(10);

    const list = root.querySelector('[data-ref="list"]');
    expect(list?.children.length).toBe(1);
    expect(list?.textContent).toContain('Test todo');
  });

  test('removes todo on delete click', async () => {
    // Add a todo first
    app.addTodo('Test todo');
    await wait(10);

    // Click delete button
    const deleteBtn = root.querySelector('.delete') as HTMLButtonElement;
    fireEvent(deleteBtn, 'click');

    await wait(10);

    const list = root.querySelector('[data-ref="list"]');
    expect(list?.children.length).toBe(0);
  });
});
```

---

These patterns provide a solid foundation for building complex applications with @doeixd/dom. Mix and match them based on your needs, and don't hesitate to create your own patterns that fit your use case.

For more information, see the main [Component Documentation](./components.md).
