# Functional Programming Guide

**@doeixd/dom** - A comprehensive guide to functional programming utilities for DOM manipulation.

<br />

## Table of Contents

**Part 1: Conceptual Guide**
1. [Introduction](#1-introduction)
2. [Core Concepts](#2-core-concepts)
3. [Essential Patterns](#3-essential-patterns)
4. [Real-World Examples](#4-real-world-examples)

**Part 2: Detailed Reference**
5. [The Fn Namespace](#5-the-fn-namespace)
6. [The def() Pattern](#6-the-def-pattern)
7. [Element Transformation](#7-element-transformation)
8. [Reactive Binding](#8-reactive-binding)
9. [Async Utilities](#9-async-utilities)
10. [Error Handling](#10-error-handling)
11. [Timing & Control Flow](#11-timing--control-flow)
12. [Collection Operations](#12-collection-operations)
13. [Quick Reference](#13-quick-reference)

<br />

# Part 1: Conceptual Guide

## 1. Introduction

### What is Functional Programming in DOM?

Traditional DOM manipulation is imperative - you tell the browser *how* to do things step by step. Functional programming focuses on *what* you want to achieve by composing small, reusable functions.

**Imperative approach:**
```typescript
const button = document.querySelector('button');
if (button) {
  button.classList.add('btn', 'btn-primary');
  button.style.padding = '10px 20px';
  button.textContent = 'Click me';
  button.disabled = false;
}
```

**Functional approach:**
```typescript
import { find, chain, cls, css, modify } from '@doeixd/dom';

chain(
  find('button'),
  cls.add('btn', 'btn-primary'),
  css({ padding: '10px 20px' }),
  modify({ text: 'Click me', disabled: false })
);
```

### Why Functional DOM?

**Advantages:**
- **Composability** - Build complex behaviors from simple functions
- **Reusability** - Create transformation pipelines you can reuse
- **Null Safety** - Built-in null handling throughout
- **Type Safety** - Full TypeScript inference
- **Declarative** - Express *what* you want, not *how* to get it
- **Point-Free Style** - Write cleaner code without intermediate variables

### The Library's Philosophy

This library follows three core principles:

1. **Dual-Mode API** - Works imperatively AND in pipelines
2. **Element Returns** - Most functions return the element for chaining
3. **Null Safety** - All utilities handle null gracefully

<br />

## 2. Core Concepts

### 2.1 Currying

Currying transforms a function that takes multiple arguments into a sequence of functions that each take one argument.

```typescript
// Regular function
function add(a: number, b: number) {
  return a + b;
}
add(5, 3); // 8

// Curried version
const curriedAdd = (a: number) => (b: number) => a + b;
const add5 = curriedAdd(5);
add5(3); // 8
add5(10); // 15
```

**Why curry?** It enables partial application and point-free style.

### 2.2 The Dual-Mode API Pattern

Most utilities in this library work in two modes:

```typescript
import { cls } from '@doeixd/dom';

// Mode 1: Imperative (all arguments at once)
cls.add(button, 'active', 'selected');

// Mode 2: Curried (partial application)
const addActive = cls.add(button);
addActive('active', 'selected');
```

This is powered by the `def()` helper (explained in detail later).

**When to use each mode:**
- **Imperative** - Quick one-off operations
- **Curried** - Building reusable functions, pipelines, array methods

### 2.3 Function Composition

Composition chains functions together, where the output of one becomes the input of the next.

```typescript
import { Fn, find, cls, modify } from '@doeixd/dom';

// Compose multiple transformations
const makeActiveButton = Fn.pipe(
  cls.add('btn'),
  cls.add('btn-primary'),
  modify({ text: 'Active' })
);

// Apply to any button
makeActiveButton(find('button'));
```

**`pipe()` vs `compose()`:**
- `pipe(f, g, h)` - Left to right: `h(g(f(x)))`
- Most libraries use `compose(h, g, f)` - Right to left

This library uses `pipe()` because it reads naturally like a recipe.

### 2.4 Point-Free Style

Point-free style means writing functions without explicitly mentioning their arguments.

```typescript
import { findAll, Fn, cls } from '@doeixd/dom';

// With arguments (pointed)
const buttons = findAll('button');
buttons.forEach(btn => cls.add(btn)('active'));

// Point-free (no 'btn' variable)
const addActive = Fn.swap(cls.add)('active');
buttons.forEach(addActive);
```

**Benefits:**
- More concise
- Focuses on *what* not *how*
- Easier to compose

**When to avoid:**
- When it reduces clarity
- Complex multi-step logic
- Debugging scenarios

### 2.5 Partial Application

Partial application fixes some arguments of a function, creating a new function.

```typescript
import { on, find } from '@doeixd/dom';

// Create specialized event handler
const onClick = on(button)('click'); // Partially applied
onClick(() => console.log('Clicked!'));
onClick(() => handleSubmit());

// Reusable configuration
const onFormInput = on(form)('input');
onFormInput((e) => validateField(e.target));
```

### 2.6 Combinators

Combinators are higher-order functions that encode common patterns. This library includes:

- **`pipe`** (B-Combinator) - Composition
- **`tap`** (K-Combinator) - Side effects without breaking chain
- **`swap`** (C-Combinator) - Argument flipping
- **`converge`** (W-Combinator) - Multiple functions, same input

More details in the [Fn Namespace](#5-the-fn-namespace) section.

<br />

## 3. Essential Patterns

### 3.1 Building Transformation Pipelines

Create reusable element transformations:

```typescript
import { chain, cls, css, modify, attr } from '@doeixd/dom';

// Define a transformation
const stylePrimaryButton = [
  cls.add('btn', 'btn-primary'),
  css({
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: '600'
  }),
  attr.set('type', 'button')
];

// Apply to multiple elements
findAll('.needs-styling').forEach(el =>
  chain(el, ...stylePrimaryButton, modify({ text: 'Submit' }))
);
```

### 3.2 Element-First vs Element-Last

**Element-First** functions take the element as the first parameter:
```typescript
// Built-in utilities are element-first when curried
cls.add(element)('active');
css(element)({ color: 'red' });
modify(element)({ text: 'Hello' });
```

**Element-Last** functions take the element as the last parameter (better for `chain()`):
```typescript
// These are already element-last (pre-configured)
chain(
  element,
  cls.add('active'),      // Returns (el) => el
  css({ color: 'red' })   // Returns (el) => el
);
```

### 3.3 Converting Functions with `chainable()`

Turn any element-first function into a chainable (element-last) function:

```typescript
import { Fn, chain } from '@doeixd/dom';

// Your custom element-first function
function setDataId(el: HTMLElement, id: string) {
  el.dataset.id = id;
}

// Convert to chainable
const withDataId = Fn.chainable(setDataId);

// Now use in chain!
chain(
  element,
  withDataId('user-123'),
  cls.add('has-id')
);
```

### 3.4 Null-Safe Operations

All utilities handle null gracefully - no need for defensive checks:

```typescript
import { find, cls, css } from '@doeixd/dom';

// If button doesn't exist, nothing happens (no errors)
cls.add(find('.missing-button'))('active');
css(find('.missing-element'))({ color: 'red' });

// chain returns null if element is null
const result = chain(
  find('.maybe-missing'),
  cls.add('active'),
  css({ display: 'block' })
); // result is null if element not found
```

### 3.5 Side Effects with `tap()`

Insert side effects (logging, debugging) without breaking the pipeline:

```typescript
import { Fn, find, cls, modify } from '@doeixd/dom';

const processButton = Fn.pipe(
  find('.submit'),
  Fn.tap(el => console.log('Found:', el)),
  cls.add('processing'),
  Fn.tap(el => console.log('After class:', el.className)),
  modify({ disabled: true }),
  Fn.tap(el => console.log('Final state:', el))
);

processButton(); // Logs at each step, returns the button
```

### 3.6 Conditional Logic

Use `Fn.ifElse()` for conditional transformations:

```typescript
import { Fn, cls } from '@doeixd/dom';

const toggleValidation = Fn.ifElse(
  (input: HTMLInputElement) => input.value.length > 0,
  cls.add('is-valid'),
  cls.remove('is-valid')
);

// Apply to input
toggleValidation(inputElement);
```

### 3.7 Reusable Element Configurations

Create factories for common element types:

```typescript
import { Fn, chain, cls, css, modify, attr } from '@doeixd/dom';

// Button factory
const createPrimaryButton = (text: string) =>
  Fn.pipe(
    cls.add('btn', 'btn-primary'),
    css({ padding: '10px 20px' }),
    modify({ text }),
    attr.set('type', 'button')
  );

// Use it
const submitBtn = createPrimaryButton('Submit')(find('button'));
const cancelBtn = createPrimaryButton('Cancel')(find('.cancel'));
```

<br />

## 4. Real-World Examples

### Example 1: Form Validation with Functional Utilities

```typescript
import {
  findAll, batch, on, cls, modify, Fn, attr
} from '@doeixd/dom';

// Validation rules
const validators = {
  email: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  password: (val: string) => val.length >= 8,
  required: (val: string) => val.trim().length > 0
};

// Validation feedback
const showError = (input: HTMLInputElement, message: string) =>
  Fn.pipe(
    cls.add('is-invalid'),
    cls.remove('is-valid'),
    attr.set('aria-invalid', 'true')
  )(input);

const showSuccess = (input: HTMLInputElement) =>
  Fn.pipe(
    cls.remove('is-invalid'),
    cls.add('is-valid'),
    attr.set('aria-invalid', 'false')
  )(input);

// Validate single field
const validateField = (input: HTMLInputElement) => {
  const rules = input.dataset.validate?.split(',') || [];
  const value = input.value;

  const isValid = rules.every(rule =>
    validators[rule]?.(value) ?? true
  );

  return isValid
    ? showSuccess(input)
    : showError(input, `Invalid ${input.name}`);
};

// Set up form
const form = find('form');
const inputs = findAll('input[data-validate]', form);

// Attach validation to all inputs
batch(inputs)((input) => {
  on(input)('blur', () => validateField(input));
  on(input)('input', Fn.debounce(() => validateField(input), 300));
});

// Form submission
on(form)('submit', (e) => {
  e.preventDefault();

  const allValid = inputs.every(validateField);

  if (allValid) {
    // Submit form
    console.log('Form valid!');
  }
});
```

### Example 2: Building a Card Component System

```typescript
import {
  chain, exec, Fn, cls, css, modify, append, el, find
} from '@doeixd/dom';

// Reusable card styles
const cardBaseStyles = [
  cls.add('card'),
  css({
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  })
];

const cardVariants = {
  primary: css({ borderLeft: '4px solid #007bff' }),
  success: css({ borderLeft: '4px solid #28a745' }),
  danger: css({ borderLeft: '4px solid #dc3545' })
};

// Card factory
function createCard(options: {
  title: string;
  content: string;
  variant?: 'primary' | 'success' | 'danger';
  actions?: Array<{ text: string; handler: () => void }>;
}) {
  const card = el('div')();

  // Apply base styles + variant
  chain(
    card,
    ...cardBaseStyles,
    cardVariants[options.variant || 'primary']
  );

  // Add title
  const title = el('h3')({ text: options.title });
  cls.add(title)('card-title');

  // Add content
  const content = el('p')({ text: options.content });
  cls.add(content)('card-content');

  // Add actions if provided
  const actions = options.actions?.map(action => {
    const btn = el('button')({ text: action.text });
    on(btn)('click', action.handler);
    cls.add(btn)('btn', 'btn-sm');
    return btn;
  }) || [];

  // Assemble card
  append(card)(title, content, ...actions);

  return card;
}

// Usage
const container = find('#cards');

const card1 = createCard({
  title: 'Success',
  content: 'Operation completed successfully!',
  variant: 'success',
  actions: [
    { text: 'OK', handler: () => console.log('OK clicked') },
    { text: 'Details', handler: () => console.log('Details') }
  ]
});

append(container)(card1);
```

### Example 3: Dynamic Theme Switcher

```typescript
import {
  findAll, batch, exec, Fn, cls, css, createStore, on
} from '@doeixd/dom';

// Theme configuration
const themes = {
  light: {
    background: '#ffffff',
    text: '#333333',
    primary: '#007bff',
    secondary: '#6c757d'
  },
  dark: {
    background: '#1a1a1a',
    text: '#f0f0f0',
    primary: '#4da3ff',
    secondary: '#9ba3a8'
  }
};

// Create theme store
const themeStore = createStore({
  current: 'light' as 'light' | 'dark'
});

// Apply theme to element
const applyTheme = (themeName: 'light' | 'dark') => {
  const theme = themes[themeName];
  const root = document.documentElement;

  exec(
    root,
    el => css(el)({
      '--bg-color': theme.background,
      '--text-color': theme.text,
      '--primary-color': theme.primary,
      '--secondary-color': theme.secondary
    } as any),
    el => cls.remove(el)('theme-light', 'theme-dark'),
    el => cls.add(el)(`theme-${themeName}`)
  );

  // Update all themed components
  const cards = findAll('.card');
  batch(cards)((card) => {
    css(card)({
      backgroundColor: theme.background,
      color: theme.text
    });
  });
};

// Subscribe to theme changes
themeStore.subscribe((state) => {
  applyTheme(state.current);
});

// Toggle theme function
const toggleTheme = () => {
  const newTheme = themeStore.get().current === 'light'
    ? 'dark'
    : 'light';
  themeStore.set({ current: newTheme });
};

// Attach to toggle button
on(find('#theme-toggle'))('click', toggleTheme);

// Initialize with saved preference
const saved = localStorage.getItem('theme') as 'light' | 'dark';
if (saved) {
  themeStore.set({ current: saved });
}
```

<br />

# Part 2: Detailed Reference

## 5. The Fn Namespace

The `Fn` namespace contains pure functional programming utilities, combinators, and function transformation tools.

### 5.1 Core Combinators

#### `Fn.pipe(...fns)`

**B-Combinator** - Chains functions left-to-right.

```typescript
Fn.pipe<T>(...fns: Array<(arg: any) => any>): (x: T) => any
```

**Equivalence:** `pipe(f, g, h)(x)` = `h(g(f(x)))`

**Example:**
```typescript
const makeActive = Fn.pipe(
  find('.button'),
  cls.add('active'),
  css({ opacity: '1' }),
  modify({ disabled: false })
);

makeActive(); // Returns the button
```

#### `Fn.curry(fn)`

Converts a binary function to curried form.

```typescript
Fn.curry<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R
```

**Example:**
```typescript
const add = (a: number, b: number) => a + b;
const curriedAdd = Fn.curry(add);

const add5 = curriedAdd(5);
add5(3); // 8
add5(10); // 15

// Use in array methods
[1, 2, 3].map(curriedAdd(10)); // [11, 12, 13]
```

#### `Fn.swap(fn)`

**C-Combinator** - Swaps arguments of a curried function.

```typescript
Fn.swap<A, B, R>(fn: (a: A) => (b: B) => R): (b: B) => (a: A) => R
```

Transforms `fn(config)(target)` into `fn(target)(config)`.

**Use Case:** Essential for using config-first functions in point-free style.

**Example:**
```typescript
const buttons = findAll('button');

// Instead of:
buttons.forEach(btn => cls.add(btn)('active'));

// Use swap for point-free:
const addActive = Fn.swap(cls.add)('active');
buttons.forEach(addActive);
```

#### `Fn.flip(fn)`

Flips arguments of a non-curried binary function.

```typescript
Fn.flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R
```

**Example:**
```typescript
const divide = (a: number, b: number) => a / b;
const divideBy = Fn.flip(divide);

divide(10, 2); // 5
divideBy(2, 10); // 5 (same result, flipped args)
```

#### `Fn.tap(fn)`

**K-Combinator** - Executes side effect, returns original value.

```typescript
Fn.tap<T>(fn: (x: T) => void): (x: T) => T
```

**Use Case:** Debugging and logging in pipes without breaking the chain.

**Example:**
```typescript
const processElement = Fn.pipe(
  find('#element'),
  Fn.tap(el => console.log('Found:', el)),
  cls.add('processing'),
  Fn.tap(el => console.log('Classes:', el.className)),
  modify({ disabled: true }),
  Fn.tap(el => console.log('Final:', el))
);
```

#### `Fn.identity(x)`

**I-Combinator** - Returns input unchanged.

```typescript
Fn.identity<T>(x: T): T
```

**Use Case:** Default or placeholder in functional compositions.

**Example:**
```typescript
// As default transform
const transform = shouldTransform
  ? cls.add('active')
  : Fn.identity;

// In array filter/map chains
array.filter(Fn.identity); // Remove falsy values
```

#### `Fn.noop()`

Does nothing, returns nothing.

```typescript
Fn.noop(): void
```

**Use Case:** Default no-op callback.

**Example:**
```typescript
function setupHandlers(onSuccess = Fn.noop, onError = Fn.noop) {
  try {
    // ... operation
    onSuccess();
  } catch (e) {
    onError(e);
  }
}
```

### 5.2 Advanced Combinators

#### `Fn.converge(h, ...fns)`

**W-Combinator** - Applies multiple functions to same input, passes results to combiner.

```typescript
Fn.converge<T, O>(
  h: (...args: any[]) => O,
  ...fns: Array<(x: T) => any>
): (x: T) => O
```

**Equivalence:** `converge(h, f, g)(x)` = `h(f(x), g(x))`

**Example:**
```typescript
const logInputState = Fn.converge(
  (id, value) => console.log({ id, value }),
  el => el.dataset.id,
  el => el.value
);

logInputState(myInput); // { id: '123', value: 'text' }

// Build objects from element data
const extractData = Fn.converge(
  (name, email, phone) => ({ name, email, phone }),
  el => el.querySelector('[name="name"]').value,
  el => el.querySelector('[name="email"]').value,
  el => el.querySelector('[name="phone"]').value
);

const userData = extractData(form);
```

#### `Fn.maybe(fn)`

Creates function that executes only if input is not nullish.

```typescript
Fn.maybe<T, R>(fn: (x: T) => R): (x: T | null | undefined) => R | null
```

**Use Case:** Safely wrap functions that would throw on null/undefined.

**Example:**
```typescript
const safeFocus = Fn.maybe((el: HTMLElement) => el.focus());

safeFocus(find('.maybe-missing')); // No crash if null

// Chain multiple maybe operations
const safeOperation = Fn.pipe(
  find('.element'),
  Fn.maybe(cls.add('active')),
  Fn.maybe(modify({ text: 'Updated' }))
);
```

#### `Fn.ifElse(predicate, ifTrue, ifFalse)`

Conditional execution based on predicate.

```typescript
Fn.ifElse<T, R1, R2>(
  predicate: (x: T) => boolean,
  ifTrue: (x: T) => R1,
  ifFalse: (x: T) => R2
): (x: T) => R1 | R2
```

**Example:**
```typescript
const hasValue = (input: HTMLInputElement) => input.value.length > 0;

const toggleValid = Fn.ifElse(
  hasValue,
  cls.add('is-valid'),
  cls.remove('is-valid')
);

toggleValid(inputElement);

// With side effects
const handleFormState = Fn.ifElse(
  form => form.checkValidity(),
  form => {
    form.submit();
    return 'submitted';
  },
  form => {
    cls.add(form)('invalid');
    return 'invalid';
  }
);
```

#### `Fn.thunk(fn, ...args)`

Creates nullary function with pre-filled arguments.

```typescript
Fn.thunk<A extends any[], R>(
  fn: (...args: A) => R,
  ...args: A
): () => R
```

**Use Case:** Event handlers that don't need the event object.

**Example:**
```typescript
const increment = (amount: number) => console.log(amount + 1);

on(button)('click', Fn.thunk(increment, 5)); // Logs 6

// Delay execution
const tasks = [
  Fn.thunk(saveData, user1),
  Fn.thunk(saveData, user2),
  Fn.thunk(saveData, user3)
];

tasks.forEach(task => setTimeout(task, 1000));
```

### 5.3 Element Transformation Utilities

#### `Fn.chainable(fn)`

Converts element-first function to element-last chainable function.

```typescript
Fn.chainable<T extends HTMLElement, A extends any[]>(
  fn: (element: T, ...args: A) => any
): (...args: A) => (element: T) => T
```

**Returns:** Element for chaining

**Example:**
```typescript
// Custom element-first function
function setTextColor(el: HTMLElement, color: string) {
  el.style.color = color;
}

// Convert to chainable
const withTextColor = Fn.chainable(setTextColor);

// Use in chain
chain(
  find('#app'),
  withTextColor('red'),
  withTextColor('blue'), // Overwrites
  cls.add('styled')
);

// Reusable configurations
const cardConfig = [
  Fn.chainable((el, shadow: boolean) => {
    el.style.boxShadow = shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none';
  })(true),
  cls.add('card'),
  css({ padding: '20px' })
];

findAll('.card').forEach(card => chain(card, ...cardConfig));
```

#### `Fn.chainableWith(fn)`

Like `chainable`, but preserves function's return value.

```typescript
Fn.chainableWith<T extends HTMLElement, A extends any[], R>(
  fn: (element: T, ...args: A) => R
): (...args: A) => (element: T) => R
```

**Returns:** Function result instead of element

**Example:**
```typescript
function getComputedWidth(el: HTMLElement, includeMargin: boolean): number {
  const styles = window.getComputedStyle(el);
  const width = parseFloat(styles.width);
  if (!includeMargin) return width;

  const marginLeft = parseFloat(styles.marginLeft);
  const marginRight = parseFloat(styles.marginRight);
  return width + marginLeft + marginRight;
}

const getWidth = Fn.chainableWith(getComputedWidth);

const element = find('#box');
const totalWidth = getWidth(true)(element); // Returns number

// Use in pipe for value extraction
const calculateTotal = Fn.pipe(
  findAll('.item'),
  items => items.map(getWidth(true)),
  widths => widths.reduce((a, b) => a + b, 0)
);
```

#### `Fn.withSelector(fn, root?)`

Transforms an element-accepting function to also accept string selectors or functions that return elements.

```typescript
Fn.withSelector<T extends HTMLElement, A extends any[], R>(
  fn: (element: T | null, ...args: A) => R,
  root?: ParentNode
): SelectorFunction<T, A, R>
```

**Purpose**: Makes any element-first function work with selectors while preserving dual-mode API and type inference.

**Parameters:**
- `fn` - Original element-accepting function
- `root` - Optional root element for scoped searches (default: `document`)

**Returns**: Function accepting `ElementInput<S>` (element | selector | function | null)

**Input Types:**
- **String selector**: `'button'`, `.card`, `#app` - Uses `ParseSelector` for type inference
- **Function getter**: `() => find('button')` - Lazy evaluation, good for dynamic elements
- **Direct element**: `myButton` - Pass through existing element references
- **Null**: `null` - Null-safe, returns null without errors

**Example:**
```typescript
// Create selector-enabled version of cls.add
const clsAdd = Fn.withSelector((el: HTMLElement | null, ...classes: string[]) => {
  if (!el) return null;
  cls.add(el)(...classes);
  return el;
});

// Use with selectors (dual-mode)
clsAdd('button', 'active', 'btn');           // Immediate
clsAdd('button')('active', 'btn');           // Curried

// Type inference preserved
const btn = clsAdd('button')('active');      // HTMLButtonElement | null
const svg = clsAdd('svg')('icon');           // SVGSVGElement | null
const div = clsAdd('div')('card');           // HTMLDivElement | null

// Function getters for dynamic elements
clsAdd(() => find('.modal'))('open');

// Null-safe
clsAdd(null)('active');                      // Returns null
clsAdd('.missing')('active');                // Returns null if not found

// Scoped searches
const container = find('#container');
const scopedAdd = Fn.withSelector(
  (el: HTMLElement | null, ...classes: string[]) => {
    if (!el) return null;
    cls.add(el)(...classes);
    return el;
  },
  container // Searches within container only
);
scopedAdd('.item')('active');
```

**Use Cases:**
- Creating reusable selector-enabled utilities
- Component-scoped DOM operations
- Dynamic element resolution
- Safer selector-based code

### 5.4 The $sel Namespace

Pre-wrapped versions of common utilities using `Fn.withSelector` for convenience.

**Available utilities:**
```typescript
$sel.addClass(selector, ...classes)         // Add classes
$sel.removeClass(selector, ...classes)      // Remove classes
$sel.toggleClass(selector, className, force?) // Toggle class
$sel.css(selector, styles)                  // Apply CSS
$sel.modify(selector, props)                // Modify element
$sel.on(selector, event, handler, options?) // Attach event
$sel.focus(selector, options?)              // Focus element
$sel.blur(selector)                         // Blur element
$sel.scrollInto(selector, options?)         // Scroll into view
$sel.rect(selector)                         // Get bounding rect
$sel.remove(selector)                       // Remove from DOM
$sel.empty(selector)                        // Remove all children
```

**Example:**
```typescript
import { $sel, find } from '@doeixd/dom';

// Add classes using selector
$sel.addClass('button', 'active', 'btn');
$sel.addClass('button')('active', 'btn'); // Curried

// Apply CSS
$sel.css('.card', { padding: '20px' });
$sel.css('.card')({ padding: '20px' });

// Modify elements
$sel.modify('#app', { text: 'Hello', disabled: false });

// Attach events
$sel.on('button', 'click', (e) => console.log('Clicked!'));
$sel.on('button')('click', (e) => console.log('Clicked!'));

// Function getters for dynamic elements
$sel.focus(() => find('.modal input'))();

// Type inference preserved
const btn = $sel.addClass('button')('active'); // HTMLButtonElement | null
const svg = $sel.css('svg')({ fill: 'red' });  // SVGSVGElement | null

// Works in pipelines
const configureButton = Fn.pipe(
  () => $sel.addClass('button', 'btn'),
  () => $sel.css('button', { padding: '10px' }),
  () => $sel.modify('button', { text: 'Click me' })
);
```

**Benefits:**
- More ergonomic than creating wrappers manually
- All utilities preserve type inference
- Dual-mode API (immediate + curried)
- Null-safe by design
- Consistent naming convention

**When to use `$sel` vs `Fn.withSelector`:**
- Use **`$sel`** for common operations (addClass, css, modify, etc.)
- Use **`Fn.withSelector`** for custom functions or less common utilities

<br />

## 6. The def() Pattern

The `def()` helper powers the library's dual-mode API, allowing utilities to work both imperatively and in functional pipelines.

### How It Works

```typescript
def<T, A extends any[], R>(
  fn: (target: T | null, ...args: A) => R
)
```

Creates a function with two call signatures:
1. **Immediate:** `fn(target, ...args)` → `R`
2. **Curried:** `fn(target)` → `(...args) => R`

### Example Implementation

```typescript
import { def } from '@doeixd/dom';

// Create a dual-mode function
const setColor = def((el: HTMLElement | null, color: string) => {
  if (el) el.style.color = color;
  return el;
});

// Mode 1: Imperative
setColor(button, 'red');

// Mode 2: Curried
const makeRed = setColor(button);
makeRed('red');
makeRed('blue'); // Change it again
```

### Utilities Using def()

All these utilities support both modes:

**Class Manipulation:**
- `cls.add`, `cls.remove`, `cls.toggle`, `cls.replace`

**Styling:**
- `css`, `tempStyle`

**Structure:**
- `append`, `prepend`, `after`, `before`, `replace`

**Attributes:**
- `attr.set`, `attr.remove`, `prop.set`

**Modification:**
- `modify`, `set` (alias)

**Example Usage:**
```typescript
// All of these work:
css(div, { color: 'red' });              // Imperative
css(div)({ color: 'red' });              // Curried
Fn.pipe(find('div'), css({ color: 'red' }))(); // In pipeline

// Same with classes
cls.add(btn, 'active', 'primary');       // Imperative
cls.add(btn)('active', 'primary');       // Curried
findAll('button').forEach(cls.add('btn')); // Point-free (won't work without swap)
findAll('button').forEach(Fn.swap(cls.add)('btn')); // Point-free (correct)
```

<br />

## 7. Element Transformation

### 7.1 chain()

Applies multiple pre-configured transformers to an element.

```typescript
chain<T extends HTMLElement>(
  element: T | null,
  ...transforms: Array<(el: T) => any>
): T | null
```

**Use Case:** When you have pre-configured transformers (element-last functions)

**Returns:** Element for further chaining (or null)

**Example:**
```typescript
chain(
  find('#submit'),
  cls.add('btn', 'btn-primary'),
  css({ padding: '10px 20px', borderRadius: '4px' }),
  modify({ text: 'Submit', disabled: false }),
  attr.set('data-action', 'submit')
);

// Reusable configurations
const buttonStyle = [
  cls.add('btn'),
  css({ padding: '10px 20px' })
];

const buttons = findAll('button');
buttons.forEach(btn => chain(btn, ...buttonStyle));
```

### 7.2 exec()

Executes multiple callback functions on an element.

```typescript
exec<T extends HTMLElement>(
  element: T | null,
  ...operations: Array<(el: T) => any>
): T | null
```

**Use Case:** Runtime values, complex logic, conditional operations

**Returns:** Element for further chaining (or null)

**Example:**
```typescript
const isActive = true;
const theme = 'dark';

exec(
  find('#app'),
  el => cls.add(el)('app-container'),
  el => cls.toggle(el)('is-active', isActive), // Runtime value
  el => cls.add(el)(`theme-${theme}`),         // Dynamic class
  el => css(el)({
    backgroundColor: theme === 'dark' ? '#333' : '#fff'
  }),
  el => on(el)('click', () => console.log('Clicked!', el)),
  el => console.log('Configured:', el)          // Debugging
);

// Conditional operations
const config = getUserConfig();
exec(
  element,
  el => config.showBorder && cls.add(el)('bordered'),
  el => config.animated && attr.set(el)('data-animated', 'true'),
  el => config.onInit?.(el)
);
```

### 7.3 When to Use Which

| Feature | `chain()` | `exec()` |
|---------|-----------|----------|
| **Input** | Pre-configured transformers | Direct callbacks |
| **Style** | `cls.add('active')` | `el => cls.add(el)('active')` |
| **Best for** | Static configuration | Runtime logic |
| **Reusability** | Easy (spread arrays) | Harder (function closures) |
| **Conditionals** | Limited | Full access |
| **Debugging** | Cleaner | More verbose |

**Rule of thumb:** Use `chain()` for static transforms, `exec()` for dynamic logic.

<br />

## 8. Reactive Binding

### 8.1 The bind Namespace

The `bind` namespace provides reactive setters with automatic diffing (only updates when value changes).

#### `bind.val(initial, effect)`

Generic value binder with diffing.

```typescript
bind.val<T>(initial: T, effect: (val: T) => void): Setter<T>
```

**Example:**
```typescript
const setScore = bind.val(0, (n) => {
  scoreDisplay.textContent = String(n);
});

setScore(10); // Updates
setScore(10); // Skipped (same value)
setScore(20); // Updates
```

#### `bind.text(el)`

Binds to `textContent`.

```typescript
bind.text(el: HTMLElement | null): Setter<string>
```

**Example:**
```typescript
const setText = bind.text(h1);
setText('Hello');
setText('World');
```

#### `bind.html(el)`

Binds to `innerHTML`.

```typescript
bind.html(el: HTMLElement | null): Setter<string>
```

**Example:**
```typescript
const setContent = bind.html(div);
setContent('<strong>Bold</strong>');
```

#### `bind.attr(name, el?)`

Binds to an attribute. Supports optional currying.

```typescript
bind.attr(name: string, el?: HTMLElement | null):
  Setter<string | number | boolean | null>
```

**Example:**
```typescript
// Direct binding
const setId = bind.attr('id', div);
setId('main-content');
setId(123); // Converts to string
setId(null); // Removes attribute

// Curried form
const setDataId = bind.attr('data-id');
const setButtonId = setDataId(button);
setButtonId('btn-1');
```

#### `bind.toggle(className, el?)`

Binds to class toggle. Supports optional currying.

```typescript
bind.toggle(className: string, el?: HTMLElement | null): Setter<boolean>
```

**Example:**
```typescript
const toggleActive = bind.toggle('active', button);
toggleActive(true);  // Adds 'active'
toggleActive(false); // Removes 'active'

// Curried
const toggleLoading = bind.toggle('is-loading');
const toggleButton = toggleLoading(button);
```

#### `bind.list(container, renderItem)`

Binds array to container (replaces children on reference change).

```typescript
bind.list<T>(
  container: HTMLElement | null,
  renderItem: (item: T, index: number) => Node
): Setter<T[]>
```

**Example:**
```typescript
const updateList = bind.list(ul, (user, i) => {
  const li = el('li')({ text: `${i + 1}. ${user.name}` });
  return li;
});

updateList([{ name: 'Alice' }, { name: 'Bob' }]);
updateList([]); // Clears list
```

#### `bind.style(el, property)`

Binds to inline style property.

```typescript
bind.style(el: HTMLElement | null, property: string): Setter<string | number>
```

**Example:**
```typescript
const setWidth = bind.style(div, 'width');
setWidth('100px');
setWidth(200); // Converts to '200px' if appropriate
```

#### `bind.cssVar(el, varName)`

Binds to CSS custom property.

```typescript
bind.cssVar(el: HTMLElement | null, varName: string): Setter<string | number>
```

**Example:**
```typescript
const setPrimary = bind.cssVar(document.documentElement, '--primary-color');
setPrimary('#007bff');
setPrimary('#28a745');
```

### 8.2 binder()

Creates strongly-typed setters from refs and schema.

```typescript
// Overload 1: Curried
binder<R>(refs: R): <S>(schema: S) => BoundSetters<S>

// Overload 2: Immediate
binder<R, S>(refs: R, schema: S): BoundSetters<S>
```

**Example:**
```typescript
const refs = {
  title: find('h1'),
  avatar: find('img'),
  adminBadge: find('.badge')
};

// Create typed UI updaters
const ui = binder(refs, {
  title: bind.text,
  avatar: bind.attr('src'),
  adminBadge: bind.toggle('visible')
});

// Now ui is strongly typed:
ui.title('Welcome'); // (val: string) => void
ui.avatar('/img/user.jpg'); // (val: string) => void
ui.adminBadge(true); // (val: boolean) => void
```

### 8.3 apply()

Connects data object to setter map (eliminates manual setter calls).

```typescript
// Overload 1: Curried
apply<S>(setters: S): (data: InferData<S>) => void

// Overload 2: Immediate
apply<S>(setters: S, data: InferData<S>): void
```

**Behaviors:**
- **Partial updates:** `undefined` keys are ignored
- **Null support:** `null` values are passed through
- **Type inference:** Data shape inferred from setters

**Example:**
```typescript
const ui = binder(refs, {
  title: bind.text,
  count: bind.text,
  isVisible: bind.toggle('visible')
});

// Immediate usage
apply(ui, {
  title: 'Hello',
  count: '42',
  isVisible: true
});

// Partial update (only changes count)
apply(ui, { count: '43' });

// Curried (recommended pattern for components)
const update = apply(ui);

function MyComponent(props) {
  update(props);
  return root;
}
```

<br />

## 9. Async Utilities

The `Async` namespace provides Promise-based functional utilities.

### `Async.resolve(value)`

Safe Promise normalization.

```typescript
Async.resolve<T>(v: T | PromiseLike<T>): Promise<T>
```

### `Async.sleep(ms)`

Waits for specified milliseconds.

```typescript
Async.sleep(ms: number): Promise<void>
```

**Example:**
```typescript
await Async.sleep(1000);
console.log('1 second later');
```

### `Async.nextFrame()`

Waits for next animation frame.

```typescript
Async.nextFrame(): Promise<void>
```

**Example:**
```typescript
cls.add(element)('active');
await Async.nextFrame();
css(element)({ opacity: '1' }); // Transition triggers
```

### `Async.retry(fn, options)`

Retries function with exponential backoff.

```typescript
Async.retry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delay?: number; factor?: number }
): Promise<T>
```

**Defaults:** `{ retries: 3, delay: 1000, factor: 2 }`

**Example:**
```typescript
const data = await Async.retry(
  () => fetch('/api/data').then(r => r.json()),
  { retries: 5, delay: 500 }
);
```

### `Async.timeout(promise, ms)`

Races promise against timeout.

```typescript
Async.timeout<T>(promise: Promise<T>, ms: number): Promise<T>
```

**Throws:** `'TimeoutError'` if exceeded

**Example:**
```typescript
try {
  const data = await Async.timeout(
    fetch('/api/slow'),
    5000 // 5 second timeout
  );
} catch (e) {
  if (e === 'TimeoutError') {
    console.log('Request timed out');
  }
}
```

### `Async.map(items, fn, concurrency)`

Maps with concurrency limit.

```typescript
Async.map<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency?: number
): Promise<R[]>
```

**Default concurrency:** `Infinity` (all parallel)

**Example:**
```typescript
// Fetch users, max 3 at a time
const users = await Async.map(
  userIds,
  id => fetch(`/api/users/${id}`).then(r => r.json()),
  3
);
```

### `Async.defer()`

Creates deferred promise with exposed resolve/reject.

```typescript
Async.defer<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}
```

**Example:**
```typescript
const deferred = Async.defer<string>();

setTimeout(() => {
  deferred.resolve('Done!');
}, 1000);

const result = await deferred.promise;
```

### `Async.cancelable(promise)`

Wraps promise to be cancelable (ignores result after cancel).

```typescript
Async.cancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
}
```

**Note:** Doesn't stop the operation, just ignores the result.

**Example:**
```typescript
const { promise, cancel } = Async.cancelable(
  fetch('/api/data')
);

// Cancel after 2 seconds
setTimeout(cancel, 2000);

try {
  const data = await promise;
} catch (e) {
  console.log('Canceled');
}
```

<br />

## 10. Error Handling

### 10.1 Result Type

Rust-inspired Result type for explicit error handling without try/catch.

**Types:**
```typescript
type Ok<T> = { ok: true; val: T; err: null };
type Err<E> = { ok: false; val: null; err: E };
type Result<T, E = Error> = Ok<T> | Err<E>;
```

#### `Result.ok(value)`

Creates success result.

```typescript
Result.ok<T>(val: T): Ok<T>
```

**Example:**
```typescript
const success = Result.ok(42);
// { ok: true, val: 42, err: null }
```

#### `Result.err(error)`

Creates failure result.

```typescript
Result.err<E>(err: E): Err<E>
```

**Example:**
```typescript
const failure = Result.err(new Error('Failed'));
// { ok: false, val: null, err: Error }
```

#### `Result.try(fn)`

Wraps synchronous function that might throw.

```typescript
Result.try<T>(fn: () => T): Result<T, Error>
```

**Example:**
```typescript
const parseJSON = (str: string) => Result.try(() => JSON.parse(str));

const result = parseJSON('{"name":"Alice"}');
if (result.ok) {
  console.log(result.val.name); // 'Alice'
} else {
  console.error(result.err);
}
```

#### `Result.async(fn)`

Wraps Promise that might reject.

```typescript
Result.async<T>(fn: () => Promise<T>): Promise<Result<T, Error>>
```

**Example:**
```typescript
const fetchUser = async (id: string) =>
  await Result.async(() => fetch(`/api/users/${id}`).then(r => r.json()));

const result = await fetchUser('123');
if (result.ok) {
  console.log(result.val);
} else {
  console.error(result.err);
}
```

#### `Result.unwrap(result)`

Returns value if Ok, throws if Err.

```typescript
Result.unwrap<T, E>(res: Result<T, E>): T
```

**Example:**
```typescript
const value = Result.unwrap(result); // Throws if err
```

#### `Result.unwrapOr(result, fallback)`

Returns value if Ok, fallback if Err.

```typescript
Result.unwrapOr<T, E>(res: Result<T, E>, fallback: T): T
```

**Example:**
```typescript
const name = Result.unwrapOr(result, 'Unknown');
```

#### `Result.map(result, fn)`

Maps value if Ok, ignores if Err.

```typescript
Result.map<T, U, E>(res: Result<T, E>, fn: (v: T) => U): Result<U, E>
```

**Example:**
```typescript
const doubled = Result.map(result, n => n * 2);
```

### 10.2 Option Type

Functional wrapper for nullable values.

#### `Option.from(value)`

Wraps nullable value.

```typescript
Option.from<T>(val: T | null | undefined): {
  val: T | null;
  isSome: boolean;
  isNone: boolean;
}
```

**Example:**
```typescript
const opt = Option.from(find('.element'));
if (opt.isSome) {
  cls.add(opt.val)('found');
}
```

#### `Option.unwrapOr(value, fallback)`

Returns value if exists, fallback otherwise.

```typescript
Option.unwrapOr<T>(val: T | null | undefined, fallback: T): T
```

**Example:**
```typescript
const element = Option.unwrapOr(find('.element'), document.body);
```

#### `Option.map(value, fn)`

Maps value if exists, returns null otherwise.

```typescript
Option.map<T, R>(val: T | null | undefined, fn: (v: T) => R): R | null
```

**Example:**
```typescript
const width = Option.map(find('.box'), el => el.offsetWidth);
```

#### `Option.then(value, fn)`

Executes side effect if value exists.

```typescript
Option.then<T>(val: T | null | undefined, fn: (v: T) => void): void
```

**Example:**
```typescript
Option.then(find('.button'), btn => {
  cls.add(btn)('active');
  on(btn)('click', handler);
});
```

<br />

## 11. Timing & Control Flow

### 11.1 debounce()

Delays execution until after pause in calls.

```typescript
debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T
```

**Use Case:** Search input, auto-save, resize handlers

**Example:**
```typescript
const performSearch = debounce((query: string) => {
  fetch(`/api/search?q=${query}`);
}, 300);

on(searchInput)('input', (e) => {
  performSearch(e.target.value);
});
```

### 11.2 throttle()

Limits execution frequency.

```typescript
throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T
```

**Use Case:** Scroll handlers, frequent events

**Example:**
```typescript
const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

on(window)('scroll', handleScroll);
```

### 11.3 createQueue()

Creates task queue with concurrency control.

```typescript
createQueue(options?: {
  concurrency?: number;
  autoStart?: boolean;
}): Queue
```

**Queue API:**
- `add<T>(fn: () => Promise<T>): Promise<T>` - Adds task
- `pause()` - Pauses processing
- `resume()` - Resumes processing
- `clear()` - Clears pending tasks
- `size()` - Returns pending + active count
- `drain()` - Promise that resolves when empty
- `onError(fn)` - Error listener

**Example:**
```typescript
const queue = createQueue({ concurrency: 2 });

queue.add(() => saveUser(user1));
queue.add(() => saveUser(user2));
queue.add(() => saveUser(user3));

await queue.drain(); // Wait for all tasks
console.log('All saved!');
```

<br />

## 12. Collection Operations

### 12.1 batch()

Executes function on each element in collection.

```typescript
batch<T extends Element>(
  list: Iterable<T> | ArrayLike<T> | null
): (fn: (el: T, index: number) => void) => T[]
```

**Returns:** Array of elements

**Example:**
```typescript
const buttons = findAll('button');

batch(buttons)((btn, i) => {
  cls.add(btn)('btn', `btn-${i}`);
  modify(btn)({ text: `Button ${i + 1}` });
  on(btn)('click', () => console.log(`Clicked ${i}`));
});
```

### 12.2 groupBy()

Groups elements by key function.

```typescript
groupBy<T extends Element>(
  list: Iterable<T> | ArrayLike<T> | null
): (keyFn: (el: T) => string) => Record<string, T[]>
```

**Example:**
```typescript
const items = findAll('[data-category]');
const byCategory = groupBy(items)(el =>
  el.dataset.category || 'uncategorized'
);

// { electronics: [...], clothing: [...], uncategorized: [...] }

// Process each group
Object.entries(byCategory).forEach(([category, elements]) => {
  console.log(`${category}: ${elements.length} items`);
  batch(elements)(el => cls.add(el)(`category-${category}`));
});
```

<br />

## 13. Quick Reference

### 13.1 All Utilities by Use Case

#### Function Composition
- `Fn.pipe` - Chain functions left-to-right
- `Fn.curry` - Convert binary to curried
- `Fn.swap` - Flip curried arguments
- `Fn.flip` - Flip binary arguments
- `Fn.converge` - Multiple functions, same input

#### Side Effects & Control
- `Fn.tap` - Side effect without breaking chain
- `Fn.ifElse` - Conditional execution
- `Fn.maybe` - Null-safe execution
- `Fn.thunk` - Pre-filled nullary function

#### Element Transformation
- `chain` - Apply pre-configured transformers
- `exec` - Execute callbacks
- `Fn.chainable` - Convert to chainable (returns element)
- `Fn.chainableWith` - Convert to chainable (returns value)
- `Fn.withSelector` - Enable selector inputs (element | string | function | null)

#### Selector Utilities
- `$sel.addClass` - Add classes via selector
- `$sel.removeClass` - Remove classes via selector
- `$sel.toggleClass` - Toggle class via selector
- `$sel.css` - Apply CSS via selector
- `$sel.modify` - Modify element via selector
- `$sel.on` - Attach event via selector
- `$sel.focus` - Focus via selector
- `$sel.blur` - Blur via selector
- `$sel.scrollInto` - Scroll into view via selector
- `$sel.rect` - Get bounding rect via selector
- `$sel.remove` - Remove element via selector
- `$sel.empty` - Empty element via selector

#### Reactive Binding
- `bind.val` - Generic binder with diffing
- `bind.text` - Text content
- `bind.html` - Inner HTML
- `bind.attr` - Attributes
- `bind.toggle` - Class toggle
- `bind.list` - Array to DOM
- `bind.style` - Inline styles
- `bind.cssVar` - CSS variables
- `binder` - Create typed setters
- `apply` - Connect data to setters

#### Async Operations
- `Async.resolve` - Normalize to Promise
- `Async.sleep` - Delay
- `Async.nextFrame` - Wait for RAF
- `Async.retry` - Retry with backoff
- `Async.timeout` - Timeout promise
- `Async.map` - Concurrent mapping
- `Async.defer` - Deferred promise
- `Async.cancelable` - Cancelable promise

#### Error Handling
- `Result.ok` - Success result
- `Result.err` - Failure result
- `Result.try` - Wrap sync function
- `Result.async` - Wrap promise
- `Result.unwrap` - Extract or throw
- `Result.unwrapOr` - Extract or default
- `Result.map` - Map success value
- `Option.from` - Wrap nullable
- `Option.unwrapOr` - Extract or default
- `Option.map` - Map if exists
- `Option.then` - Side effect if exists

#### Timing & Control Flow
- `debounce` - Delay until pause
- `throttle` - Limit frequency
- `createQueue` - Task queue with concurrency

#### Collections
- `batch` - Execute on each element
- `groupBy` - Group by key function

### 13.2 Currying Patterns Cheat Sheet

| Pattern | Example | Use Case |
|---------|---------|----------|
| **Dual-mode (def)** | `cls.add(el, 'active')` or `cls.add(el)('active')` | Most library utilities |
| **Element-first** | `on(button)('click', handler)` | Event handlers, queries |
| **Config-first** | `cls.add('active')(button)` | After swap for point-free |
| **Optional curry** | `bind.attr('id', el)` or `bind.attr('id')(el)` | Flexible binding |
| **Multi-level** | `onDelegated(root)(selector)(event, handler)` | Delegated events |

### 13.3 Combinator Quick Reference

| Combinator | Function | Pattern | Use Case |
|------------|----------|---------|----------|
| **B** | `pipe` | `h(g(f(x)))` | Composition |
| **K** | `tap` | `f(x); return x` | Side effects |
| **C** | `swap` | `f(b)(a)` from `f(a)(b)` | Flip curried |
| **W** | `converge` | `h(f(x), g(x))` | Multiple branches |
| **I** | `identity` | `x => x` | Passthrough |

### 13.4 When to Use What

**For static configuration:**
```typescript
chain(element, cls.add('active'), css({ color: 'red' }))
```

**For runtime logic:**
```typescript
exec(element, el => cls.add(el)(className), el => console.log(el))
```

**For reusable transforms:**
```typescript
const config = [cls.add('card'), css({ padding: '20px' })];
elements.forEach(el => chain(el, ...config));
```

**For point-free style:**
```typescript
const addActive = Fn.swap(cls.add)('active');
findAll('button').forEach(addActive);
```

**For error handling:**
```typescript
const result = await Result.async(() => fetch('/api'));
if (result.ok) use(result.val);
```

**For reactive updates:**
```typescript
const ui = binder(refs, { title: bind.text });
const update = apply(ui);
update({ title: 'Hello' });
```

<br />

## Summary

This library provides a comprehensive functional programming toolkit for DOM manipulation with:

- **50+ utilities** organized into logical namespaces
- **Consistent patterns** throughout (currying, null-safety, element returns)
- **Full type safety** with TypeScript inference
- **Real-world focus** - designed for actual DOM challenges
- **Composability** - build complex behaviors from simple functions

Start with `Fn.pipe`, `chain`, and the `bind` namespace, then explore the advanced combinators and patterns as needed.

**Next Steps:**
- Try the real-world examples in your own projects
- Combine utilities to create your own reusable patterns
- Explore the source code for implementation details
- Check the main README for DOM manipulation utilities

Happy functional programming! 🚀
