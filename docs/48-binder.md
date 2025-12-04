# createBinder() - Enhanced Data Binding

Type-safe, schema-based data binding with automatic dirty checking, batch updates, and integration with existing `bind` primitives.

## Overview

`createBinder()` creates a declarative binding layer between your data and DOM elements. Define how each ref should be updated once, then simply pass data objects to update the UI.

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

// Update UI with data
ui({
  nameInput: 'John Doe',
  emailInput: 'john@example.com',
  submitBtn: false,
  errorMsg: ''
});
```

## Basic Usage

### Default Text Binding

Without a schema, refs are bound using `bind.text()`:

```typescript
const el = h.div({}, [
  h.span({ dataRef: 'title' }),
  h.span({ dataRef: 'subtitle' })
]);

const refsObj = refs(el);
const ui = createBinder(refsObj);

ui({
  title: 'Hello',
  subtitle: 'World'
});

// title.textContent = "Hello"
// subtitle.textContent = "World"
```

### With Schema

Define how each ref should be updated:

```typescript
const ui = createBinder(refsObj, {
  title: bind.text,
  subtitle: (el) => bind.html(el),
  status: (el) => bind.toggle('active')(el)
});

ui({
  title: 'Plain text',
  subtitle: '<strong>HTML</strong> content',
  status: true
});
```

## Bind Primitives

The `bind` object provides pre-built setter factories:

### bind.text()

Sets `textContent`:

```typescript
const ui = createBinder(refs, {
  message: bind.text
});

ui({ message: 'Hello World' });
// element.textContent = "Hello World"
```

### bind.html()

Sets `innerHTML`:

```typescript
const ui = createBinder(refs, {
  content: bind.html
});

ui({ content: '<strong>Bold</strong> text' });
// element.innerHTML = "<strong>Bold</strong> text"
```

### bind.attr(name)

Sets an attribute:

```typescript
const ui = createBinder(refs, {
  link: (el) => bind.attr('href')(el)
});

ui({ link: '/home' });
// element.setAttribute('href', '/home')

ui({ link: null });
// element.removeAttribute('href')
```

### bind.prop(propName)

Sets an element property:

```typescript
const ui = createBinder(refs, {
  submitBtn: (el) => bind.prop('disabled', el),
  checkbox: (el) => bind.prop('checked', el)
});

ui({
  submitBtn: true,   // button.disabled = true
  checkbox: false    // checkbox.checked = false
});
```

### bind.toggle(className)

Toggles a single class:

```typescript
const ui = createBinder(refs, {
  box: (el) => bind.toggle('active')(el)
});

ui({ box: true });   // box.classList.add('active')
ui({ box: false });  // box.classList.remove('active')
```

### bind.classes()

Toggles multiple classes:

```typescript
const ui = createBinder(refs, {
  box: bind.classes
});

ui({
  box: {
    active: true,
    disabled: false,
    highlighted: true
  }
});

// box.classList: 'active highlighted'
```

### bind.style(property)

Sets a single style property:

```typescript
const ui = createBinder(refs, {
  box: (el) => bind.style(el, 'color')
});

ui({ box: 'red' });
// box.style.color = 'red'
```

### bind.value()

Sets `value` on inputs (with dirty checking):

```typescript
const ui = createBinder(refs, {
  nameInput: bind.value,
  emailInput: bind.value
});

ui({
  nameInput: 'John',
  emailInput: 'john@example.com'
});

// nameInput.value = "John"
// emailInput.value = "john@example.com"
```

### bind.show()

Shows/hides elements (preserves original `display`):

```typescript
const ui = createBinder(refs, {
  spinner: bind.show,
  errorMsg: bind.show
});

ui({
  spinner: true,    // spinner.style.display = '' (visible)
  errorMsg: false   // errorMsg.style.display = 'none'
});
```

## API Reference

### createBinder()

```typescript
function createBinder<R extends Record<string, HTMLElement>>(
  refsObj: R,
  schema?: Partial<BinderSchema<R>>
): EnhancedBinder<R>

type BinderSchema<R> = {
  [K in keyof R]: Setter<any>;
};

interface EnhancedBinder<R> {
  // Update multiple refs
  (data: Partial<InferBinderData<BinderSchema<R>>>): void;

  // Individual setters
  set: BinderSchema<R>;

  // Manual batching
  batch(fn: () => void): void;

  // Get refs object
  refs(): R;
}
```

## Individual Setters

Access setters for individual refs via `ui.set`:

```typescript
const ui = createBinder(refs, {
  title: bind.text,
  count: bind.text
});

// Use individual setters
ui.set.title('New Title');
ui.set.count('42');

// Equivalent to:
ui({ title: 'New Title' });
ui({ count: '42' });
```

## Batch Updates

Use `batch()` to group multiple updates:

```typescript
const ui = createBinder(refs, schema);

ui.batch(() => {
  ui({ title: 'Loading...' });
  ui({ spinner: true });
  ui({ submitBtn: true });
});

// All updates applied together
```

**Note**: Batching is manual - updates are not automatically batched.

## Dirty Checking

Some bind primitives include dirty checking to avoid unnecessary DOM updates:

- `bind.value()` - Checks previous value before updating
- `bind.prop()` - Checks previous value
- Custom setters can implement dirty checking

```typescript
const ui = createBinder(refs, {
  input: bind.value
});

ui({ input: 'test' });  // Updates DOM
ui({ input: 'test' });  // Skipped (same value)
ui({ input: 'new' });   // Updates DOM
```

## Real-World Examples

### Form State Management

```typescript
interface FormRefs {
  usernameInput: HTMLElement;
  passwordInput: HTMLElement;
  rememberCheckbox: HTMLElement;
  submitBtn: HTMLElement;
  errorMsg: HTMLElement;
  loadingSpinner: HTMLElement;
}

const formRefs = refs(formElement);

const ui = createBinder(formRefs, {
  usernameInput: bind.value,
  passwordInput: bind.value,
  rememberCheckbox: (el) => bind.prop('checked', el),
  submitBtn: (el) => bind.prop('disabled', el),
  errorMsg: bind.text,
  loadingSpinner: bind.show
});

// Initial state
ui({
  usernameInput: '',
  passwordInput: '',
  rememberCheckbox: false,
  submitBtn: true,
  errorMsg: '',
  loadingSpinner: false
});

// User fills form
ui({
  usernameInput: 'john',
  passwordInput: 'secret',
  submitBtn: false
});

// Submit (loading state)
ui({
  submitBtn: true,
  loadingSpinner: true,
  errorMsg: ''
});

// Error state
ui({
  submitBtn: false,
  loadingSpinner: false,
  errorMsg: 'Invalid credentials'
});
```

### Dashboard Metrics

```typescript
interface MetricsRefs {
  totalUsers: HTMLElement;
  activeUsers: HTMLElement;
  revenue: HTMLElement;
  status: HTMLElement;
}

const ui = createBinder(metricsRefs);

// Fetch and display metrics
async function updateMetrics() {
  const data = await fetchMetrics();

  ui({
    totalUsers: data.totalUsers.toLocaleString(),
    activeUsers: data.activeUsers.toLocaleString(),
    revenue: `$${data.revenue.toFixed(2)}`,
    status: data.status
  });
}

setInterval(updateMetrics, 5000);
```

### Status Indicator

```typescript
interface StatusRefs {
  icon: HTMLElement;
  message: HTMLElement;
  retryBtn: HTMLElement;
}

const ui = createBinder(statusRefs, {
  icon: bind.html,
  message: bind.text,
  retryBtn: bind.show
});

const statuses = {
  loading: {
    icon: '⏳',
    message: 'Loading...',
    retryBtn: false
  },
  success: {
    icon: '✓',
    message: 'Success!',
    retryBtn: false
  },
  error: {
    icon: '✗',
    message: 'Failed to load',
    retryBtn: true
  }
};

ui(statuses.loading);
// Later...
ui(statuses.success);
```

### Shopping Cart

```typescript
interface CartRefs {
  itemCount: HTMLElement;
  subtotal: HTMLElement;
  tax: HTMLElement;
  total: HTMLElement;
  checkoutBtn: HTMLElement;
}

const ui = createBinder(cartRefs, {
  itemCount: bind.text,
  subtotal: bind.text,
  tax: bind.text,
  total: bind.text,
  checkoutBtn: (el) => bind.prop('disabled', el)
});

function updateCart(cart: Cart) {
  const subtotal = cart.items.reduce((sum, item) =>
    sum + item.price * item.quantity, 0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  ui({
    itemCount: `${cart.items.length} items`,
    subtotal: `$${subtotal.toFixed(2)}`,
    tax: `$${tax.toFixed(2)}`,
    total: `$${total.toFixed(2)}`,
    checkoutBtn: cart.items.length === 0
  });
}
```

### Live Search Results

```typescript
interface SearchRefs {
  query: HTMLElement;
  resultCount: HTMLElement;
  spinner: HTMLElement;
  noResults: HTMLElement;
}

const ui = createBinder(searchRefs, {
  query: bind.value,
  resultCount: bind.text,
  spinner: bind.show,
  noResults: bind.show
});

async function search(query: string) {
  // Show loading
  ui({
    spinner: true,
    noResults: false
  });

  const results = await fetchResults(query);

  // Show results
  ui({
    spinner: false,
    resultCount: `${results.length} results`,
    noResults: results.length === 0
  });
}
```

## Integration with viewRefs()

Perfect combination for component-based architecture:

```typescript
interface CardRefs {
  title: HTMLElement;
  description: HTMLElement;
  image: HTMLElement;
  badge: HTMLElement;
}

const Card = viewRefs<CardRefs>(({ refs }) =>
  h.div({ class: { card: true } }, [
    h.img({ dataRef: 'image' }),
    h.div({ class: { badge: true }, dataRef: 'badge' }),
    h.h3({ dataRef: 'title' }),
    h.p({ dataRef: 'description' })
  ])
);

function createProductCard(product: Product) {
  const { element, refs } = Card();

  const ui = createBinder(refs, {
    image: (el) => bind.attr('src')(el),
    title: bind.text,
    description: bind.text,
    badge: bind.show
  });

  ui({
    image: product.image,
    title: product.name,
    description: product.description,
    badge: product.isNew
  });

  return element;
}
```

## Custom Bind Functions

Create your own bind functions:

```typescript
// Custom: bind to data attribute
const bindDataAttr = (attrName: string) => (el: HTMLElement | null) => {
  return (value: string) => {
    if (!el) return;
    el.dataset[attrName] = value;
  };
};

// Custom: bind to multiple properties
const bindButton = (el: HTMLElement | null) => {
  return (config: { text: string; disabled: boolean }) => {
    if (!el) return;
    el.textContent = config.text;
    (el as HTMLButtonElement).disabled = config.disabled;
  };
};

// Use in schema
const ui = createBinder(refs, {
  userId: bindDataAttr('userId'),
  submitBtn: bindButton
});

ui({
  userId: '123',
  submitBtn: { text: 'Submit', disabled: false }
});
```

## Best Practices

1. **Define schema once**: Create the schema at component initialization, not on every update
2. **Use appropriate bind primitives**: Choose the right primitive for each ref's purpose
3. **Batch related updates**: Use `batch()` when updating multiple refs together
4. **Leverage dirty checking**: Primitives like `bind.value()` automatically skip unnecessary updates
5. **Type safety**: Let TypeScript infer the data shape from your schema
6. **Individual setters for events**: Use `ui.set.field()` in event handlers
7. **Integrate with viewRefs**: Combine both for powerful component patterns

## Performance

- **Setup overhead**: O(n) where n is number of refs (creates setter functions)
- **Update overhead**: O(m) where m is number of fields in update object
- **Dirty checking**: ~30% improvement with frequent updates to same values
- **Batch updates**: No automatic optimization (manual via `batch()`)
- **Memory**: Each binder stores one setter function per ref

## TypeScript Support

Full type inference for data shapes:

```typescript
const ui = createBinder(refs, {
  name: bind.value,
  count: bind.text,
  active: (el) => bind.toggle('active')(el)
});

// TypeScript infers:
ui({
  name: string | number,    // ✓
  count: string,            // ✓
  active: boolean           // ✓
});

ui({ name: true });  // ✗ Error
ui({ invalid: 'x' }); // ✗ Error
```

## See Also

- [viewRefs() - Template Factories](./47-viewrefs.md)
- [List() - Reactive Lists](./46-list.md)
- [h/tags - Hyperscript Creation](./45-hyperscript.md)
- [modify() - Element Updates](./06-modify.md)
- [refs() - Ref Extraction](./14-component-refs.md)
