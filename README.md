# DOM

A lightweight, functional DOM manipulation library with **hybrid calling patterns** and full TypeScript support. Think jQuery meets functional programming with modern TypeScript ergonomics - use imperative, curried, or fluent styles!

## Why Functional?

**Composability** - Functions are small, focused, and combine naturally:
```typescript
import { find, modify, addClass, on } from '@doeixd/dom';

// Compose operations in a pipeline
const setupButton = (selector: string) => 
  pipe(
    find(selector),
    modify({ text: 'Click me!' }),
    addClass('btn', 'btn-primary'),
    on('click', handleClick)
  );
```

**Currying** - Partial application makes code reusable:
```typescript
import { modify, addClass } from '@doeixd/dom';

// Create specialized functions
const makeActive = addClass('active');
const setText = (text: string) => modify({ text });

// Reuse across elements
[button1, button2, button3].forEach(makeActive);
```

**Null Safety** - All functions handle null gracefully:
```typescript
import { modify } from '@doeixd/dom';

const missing = document.querySelector('.nonexistent');
modify(missing)({ text: 'Hello' }); // No error, safely returns null
```

**Immutability** - No hidden state or side effects:
```typescript
import { css } from '@doeixd/dom';

// Pure function - same inputs = same outputs
const redText = css({ color: 'red' });
redText(element1); // Predictable
redText(element2); // Reusable
```

## Hybrid Calling Patterns

**Choose your style** - imperative convenience or functional composition:

```typescript
import { modify, addClass, css } from '@doeixd/dom';

const button = document.querySelector('button');

// 🅰️ Imperative (clean & direct)
modify(button, { text: 'Click me!' });
addClass(button, 'primary', 'large');
css(button, { color: 'blue' });

// 🅱️ Curried (pipeline-friendly)
modify(button)({ text: 'Click me!' });
addClass(button)('primary', 'large');
css(button)({ color: 'blue' });

// 🅲️ Fluent (jQuery-like chaining)
$(button)
  .modify({ text: 'Click me!' })
  .addClass('primary', 'large')
  .css({ color: 'blue' });
```

**All patterns work everywhere** - mix and match based on context!

## Installation

### NPM
```bash
npm install @doeixd/dom
```

### ESM.sh (No Build Step)

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

**Tree-Shaking with ESM.sh**: Use the `?exports` parameter to bundle only specific functions:

```html
<script type="module">
  // Only bundles find, modify, and on (~2KB instead of ~15KB)
  import { find, modify, on } from 'https://esm.sh/@doeixd/dom?exports=find,modify,on';
</script>
```

## Quick Start

### Imperative Style (New!)
```typescript
import { find, modify, addClass, on } from '@doeixd/dom';

// Direct, clean calls - no extra parentheses!
const button = find('button');
modify(button, { text: 'Submit' });
addClass(button, 'btn-primary');
on(button, 'click', handleSubmit);
```

### Functional Style (Curried)
```typescript
import { find, modify, addClass, on } from '@doeixd/dom';

// Curried functions for composition
const button = find('button');
modify(button)({ text: 'Submit' });
addClass(button)('btn-primary');
on(button)('click', handleSubmit);
```

### Fluent Style (jQuery-like)
```typescript
import { $ } from '@doeixd/dom';

// Method chaining
$('button')
  .modify({ text: 'Submit' })
  .addClass('btn-primary')
  .on('click', handleSubmit);
```

## Core Features

### DOM Querying
```typescript
import { find, findAll, closest } from '@doeixd/dom';

// Type-safe selectors
const button = find<HTMLButtonElement>('button');
const inputs = findAll<HTMLInputElement>('input');
const form = closest(button)('form');
```

### Element Creation
```typescript
import { el, html } from '@doeixd/dom';

// Functional element builder
const button = el('button')({ class: { primary: true } })(['Click me']);

// Template literals (auto-detects single vs multiple roots)
const single = html`<div>Hello</div>`; // HTMLElement
const multiple = html`<div>A</div><div>B</div>`; // DocumentFragment
```

### Event Handling
```typescript
import { on, onDelegated } from '@doeixd/dom';

// Direct events
const unsub = on(button)('click', (e) => console.log('Clicked'));

// Event delegation (performance++)
const onRow = onDelegated(table)('tr');
onRow('click', (e, row) => console.log('Row clicked', row));
```

### HTTP Client
```typescript
import { Http } from '@doeixd/dom';

// Create configured client
const api = Http.create({
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000
});

// Type-safe requests
interface User { id: number; name: string; }
const user = await api.get<User>('/users/1');
await api.post('/users', { name: 'John' });
```

### Form Handling
```typescript
import { Form, Input } from '@doeixd/dom';

// Serialize form data
const data = Form.serialize(form);

// Watch input changes
Input.watch(input)((value) => console.log('Value:', value));

// Validation
const isValid = Input.validate(input);
```


## Functional Patterns

### Composition
```typescript
import { find, modify, addClass, on } from '@doeixd/dom';

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const setupButton = pipe(
  modify({ text: 'Submit' }),
  addClass('btn-primary'),
  on('click', handleClick)
);

setupButton(find('button'));
```

### Partial Application
```typescript
import { modify, css } from '@doeixd/dom';

// Create reusable modifiers
const setLoading = modify({ 
  text: 'Loading...', 
  disabled: true 
});

const setSuccess = modify({ 
  text: 'Success!', 
  disabled: false 
});

// Apply to any button
setLoading(submitBtn);
// Later...
setSuccess(submitBtn);
```

### Point-Free Style
```typescript
import { findAll, addClass } from '@doeixd/dom';

// No intermediate variables needed
findAll('.item')
  .map(addClass('active'))
  .forEach(on('click', handleClick));
```

## API Styles

Choose the style that fits your needs - **all functions support multiple patterns**:

### Imperative (Direct)
```typescript
import { modify, addClass, css } from '@doeixd/dom';

// Clean, straightforward calls
modify(button, { text: 'Click' });
addClass(button, 'primary');
css(button, { color: 'blue' });
```

### Functional (Curried)
```typescript
import { modify, addClass, css } from '@doeixd/dom';

// Perfect for composition and pipelines
modify(button)({ text: 'Click' });
addClass(button)('primary');
css(button)({ color: 'blue' });
```

### Fluent (Chaining)
```typescript
import { $ } from '@doeixd/dom';

// jQuery-like method chaining
$('button')
  .modify({ text: 'Click' })
  .addClass('primary')
  .css({ color: 'blue' });
```

### Custom Hybrid Functions
```typescript
import { def } from '@doeixd/dom';

// Create your own hybrid functions
const setText = def((el, text) => el.innerText = text);

setText(button, 'Click');     // Direct call
setText(button)('Click');     // Curried call
```

## Browser Support

- Modern browsers (ES2020+)
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## Bundle Size

- **Full library**: ~15KB minified + gzipped
- **Tree-shaken**: As small as 1-2KB for basic utilities
- **Zero dependencies**
- **TypeScript-first**: Includes full type definitions

## TypeScript

**Advanced TypeScript support** with full type safety and intelligent inference:

```typescript
import { find, modify, addClass, on } from '@doeixd/dom';

// 🎯 Smart type inference from selectors
const button = find('button'); // HTMLButtonElement
const input = find('input');   // HTMLInputElement
const form = find('form');     // HTMLFormElement

// 🔧 Generic support for custom elements
const custom = find<MyCustomElement>('.custom');

// ⚡ Function overloads for hybrid patterns
modify(button, { text: 'Click' });    // Imperative
modify(button)({ text: 'Click' });    // Curried

// 🎪 Event type safety
on(button, 'click', (e) => {
  // e is MouseEvent - fully typed!
  console.log(e.clientX, e.clientY);
});

// 📊 Data attributes with type inference
Data.set(button, 'user-id', 123);     // Accepts any serializable type
const userId = Data.read(button)('user-id'); // Returns any (parsed JSON/number/string)
```

**Key TypeScript Features:**
- ✅ **Strict mode compliant** - no `any` abuse
- ✅ **Function overloads** - both imperative and curried patterns
- ✅ **HTMLElement generics** - type-safe element operations
- ✅ **EventMap inference** - proper event typing
- ✅ **Null safety** - handles `null`/`undefined` gracefully
- ✅ **Advanced generics** - complex type constraints where needed

## The `def` Utility

**Power your own hybrid functions** with the `def` utility:

```typescript
import { def } from '@doeixd/dom';

// Create functions that work both ways
const setText = def((el, text) => el.innerText = text);
const addClasses = def((el, ...classes) => el.classList.add(...classes));

// Use imperatively
setText(button, 'Hello World');
addClasses(div, 'active', 'visible');

// Use in pipelines
pipe(
  find('.button'),
  setText('Click me'),
  addClasses('primary', 'large')
);
```

**How it works:**
```typescript
// def() creates dual-callable functions
const fn = def((target, ...args) => result);

// Imperative: fn(target, ...args)
fn(element, arg1, arg2);

// Curried: fn(target)(...args)
fn(element)(arg1, arg2);
```

## License

MIT © Patrick Glen

## Links

- [GitHub](https://github.com/doeixd/dom)
- [NPM](https://www.npmjs.com/package/@doeixd/dom)
- [Documentation](https://github.com/doeixd/dom/tree/main/docs)
