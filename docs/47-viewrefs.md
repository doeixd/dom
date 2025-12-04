# viewRefs() - Typed Template Factories

Create reusable, type-safe component templates with automatic ref extraction and smart update methods.

## Overview

`viewRefs()` combines element creation with ref extraction into a single pattern. Define your template structure once, then instantiate it multiple times with type-safe access to internal elements.

```typescript
import { viewRefs, h } from '@doeixd/dom';

interface CardRefs {
  title: HTMLHeadingElement;
  content: HTMLParagraphElement;
  button: HTMLButtonElement;
}

const Card = viewRefs<CardRefs>(({ refs }) =>
  h.div({ class: { card: true } }, [
    h.h2({ dataRef: 'title' }),
    h.p({ dataRef: 'content' }),
    h.button({ dataRef: 'button' }, ['Click'])
  ])
);

// Create instances
const { element, refs, updateRefs, bind } = Card();

// Type-safe ref access
refs.title.textContent = 'My Card';
refs.content.textContent = 'Description';
refs.button.onclick = () => alert('Clicked!');
```

## Basic Usage

### Creating a Template

```typescript
import { viewRefs, h } from '@doeixd/dom';

// Define refs interface
interface MessageRefs {
  icon: HTMLElement;
  text: HTMLElement;
}

// Create template factory
const Message = viewRefs<MessageRefs>(({ refs }) =>
  h.div({ class: { message: true } }, [
    h.span({ dataRef: 'icon', class: { icon: true } }),
    h.span({ dataRef: 'text' })
  ])
);

// Instantiate
const { element, refs } = Message();
refs.icon.textContent = '✓';
refs.text.textContent = 'Success!';

document.body.appendChild(element);
```

### With Options

```typescript
const message = Message({
  className: 'success-message',
  id: 'msg-1',
  props: {
    style: { padding: '10px' },
    attr: { role: 'alert' }
  }
});
```

## API Reference

### viewRefs()

```typescript
function viewRefs<R extends Record<string, HTMLElement>>(
  templateFactory: (ctx: ViewRefsContext<R>) => HTMLElement
): (options?: ViewRefsOptions) => ViewRefsInstance<R>

interface ViewRefsContext<R> {
  /** Extracted refs (populated after template execution) */
  refs: R;
}

interface ViewRefsOptions {
  /** Optional root element class name(s) */
  className?: string | string[];

  /** Optional root element ID */
  id?: string;

  /** Optional initial properties for root element */
  props?: ElementProps;
}
```

### ViewRefsInstance

```typescript
interface ViewRefsInstance<R> {
  /** The root element */
  element: HTMLElement;

  /** Typed refs object */
  refs: R;

  /** Update root element properties */
  update(props: ElementProps): void;

  /** Update individual refs with smart value handling */
  updateRefs(updates: Partial<{[K in keyof R]: any}>): void;

  /** Get a setter function for a specific ref */
  bind<K extends keyof R>(key: K): (value: any) => void;

  /** Destroy element and cleanup */
  destroy(): void;
}
```

## Updating Refs

### updateRefs() Method

The `updateRefs()` method intelligently handles different value types:

```typescript
const { refs, updateRefs } = Card();

// String/number values → textContent
updateRefs({
  title: 'New Title',
  content: 'New content text'
});

// ElementProps objects → modify()
updateRefs({
  button: {
    text: 'Submit',
    class: { primary: true, disabled: false },
    attr: { type: 'submit' }
  }
});

// Mixed updates
updateRefs({
  title: 'Title',                    // Sets textContent
  content: { html: '<b>Bold</b>' },  // Uses modify()
  button: 'Click Me'                  // Sets textContent
});
```

**Value handling rules:**
1. `string` or `number` → Sets `textContent`
2. Object with ElementProps keys (`text`, `html`, `class`, `style`, `attr`) → Calls `modify()`
3. Object with `value` property for input elements → Sets `.value`
4. Other objects → Treated as ElementProps and passed to `modify()`
5. `null` or `undefined` → Ignored (no change)

### bind() Method

Get a setter function for individual refs:

```typescript
const { refs, bind } = Card();

// Get setter functions
const setTitle = bind('title');
const setContent = bind('content');

// Use them
setTitle('New Title');
setContent('New Content');

// Great for callbacks
button.onclick = bind('status').bind(null, 'Clicked!');

// Use in forEach
['Loading', 'Ready', 'Complete'].forEach(bind('status'));
```

### update() Method

Update the root element (not refs):

```typescript
const { element, update } = Card();

update({
  class: { highlighted: true },
  style: { border: '2px solid blue' },
  attr: { 'data-active': 'true' }
});
```

## Patterns and Examples

### Form Template

```typescript
interface FormRefs {
  nameInput: HTMLElement;
  emailInput: HTMLElement;
  submitBtn: HTMLElement;
  errorMsg: HTMLElement;
}

const LoginForm = viewRefs<FormRefs>(({ refs }) =>
  h.form({ class: { 'login-form': true } }, [
    h.div({ class: { 'form-group': true } }, [
      h.label({}, ['Name']),
      h.input({ dataRef: 'nameInput', attr: { type: 'text' } })
    ]),
    h.div({ class: { 'form-group': true } }, [
      h.label({}, ['Email']),
      h.input({ dataRef: 'emailInput', attr: { type: 'email' } })
    ]),
    h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } }, ['Login']),
    h.div({ dataRef: 'errorMsg', class: { error: true, hidden: true } })
  ])
);

// Usage
const { element, refs, updateRefs, bind } = LoginForm();

// Simple text updates
const showError = bind('errorMsg');
showError('Invalid email address');

// Smart updates
updateRefs({
  submitBtn: {
    text: 'Logging in...',
    attr: { disabled: 'true' }
  },
  errorMsg: ''  // Clear error
});
```

### Status Indicator

```typescript
interface StatusRefs {
  icon: HTMLElement;
  text: HTMLElement;
}

const StatusIndicator = viewRefs<StatusRefs>(({ refs }) =>
  h.div({ class: { status: true } }, [
    h.span({ dataRef: 'icon' }),
    h.span({ dataRef: 'text' })
  ])
);

const { element, updateRefs } = StatusIndicator({
  className: 'status-indicator'
});

// Define status configurations
const statuses = {
  loading: { icon: '⏳', text: 'Loading...' },
  success: { icon: '✓', text: 'Complete' },
  error: { icon: '✗', text: 'Failed' }
};

// Easy status switching
function setStatus(status: keyof typeof statuses) {
  updateRefs(statuses[status]);
}

setStatus('loading');
// Later...
setStatus('success');
```

### Card List with viewRefs

```typescript
interface CardRefs {
  title: HTMLElement;
  description: HTMLElement;
  image: HTMLElement;
  actionBtn: HTMLElement;
}

const Card = viewRefs<CardRefs>(({ refs }) =>
  h.div({ class: { card: true } }, [
    h.img({ dataRef: 'image', attr: { alt: '' } }),
    h.div({ class: { 'card-body': true } }, [
      h.h3({ dataRef: 'title' }),
      h.p({ dataRef: 'description' })
    ]),
    h.button({ dataRef: 'actionBtn' }, ['View'])
  ])
);

interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
}

const list = List<Product>(container, {
  key: p => p.id,
  render: (product) => {
    const { element, updateRefs, refs } = Card();

    // Initial render
    updateRefs({
      title: product.name,
      description: product.description,
      image: { attr: { src: product.image, alt: product.name } }
    });

    // Event handlers
    refs.actionBtn.onclick = () => viewProduct(product.id);

    return element;
  }
});
```

### Modal Dialog

```typescript
interface ModalRefs {
  title: HTMLElement;
  body: HTMLElement;
  closeBtn: HTMLElement;
  confirmBtn: HTMLElement;
}

const Modal = viewRefs<ModalRefs>(({ refs }) =>
  h.div({ class: { modal: true } }, [
    h.div({ class: { 'modal-dialog': true } }, [
      h.div({ class: { 'modal-header': true } }, [
        h.h4({ dataRef: 'title' }),
        h.button({
          dataRef: 'closeBtn',
          class: { close: true },
          attr: { 'aria-label': 'Close' }
        }, ['×'])
      ]),
      h.div({ dataRef: 'body', class: { 'modal-body': true } }),
      h.div({ class: { 'modal-footer': true } }, [
        h.button({ dataRef: 'confirmBtn', class: { 'btn-primary': true } }, ['Confirm'])
      ])
    ])
  ])
);

// Create modal
const modal = Modal({ className: 'confirmation-modal' });

// Configure
modal.updateRefs({
  title: 'Confirm Action',
  body: 'Are you sure you want to proceed?'
});

// Add handlers
modal.refs.closeBtn.onclick = () => modal.element.remove();
modal.refs.confirmBtn.onclick = () => {
  confirm();
  modal.element.remove();
};

// Show
document.body.appendChild(modal.element);
```

### Counter Component

```typescript
interface CounterRefs {
  count: HTMLElement;
  decBtn: HTMLElement;
  incBtn: HTMLElement;
}

const Counter = viewRefs<CounterRefs>(({ refs }) =>
  h.div({ class: { counter: true } }, [
    h.button({ dataRef: 'decBtn' }, ['-']),
    h.span({ dataRef: 'count' }, ['0']),
    h.button({ dataRef: 'incBtn' }, ['+'])
  ])
);

function createCounter(initial = 0) {
  const { element, refs, bind } = Counter();
  let count = initial;

  const updateCount = bind('count');
  updateCount(count);

  refs.incBtn.onclick = () => updateCount(++count);
  refs.decBtn.onclick = () => updateCount(--count);

  return element;
}

document.body.appendChild(createCounter(5));
```

## Integration with Other Features

### With List()

```typescript
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

const list = List<Todo>(container, {
  key: todo => todo.id,
  render: (todo) => {
    const { element, refs, updateRefs } = TodoItem();

    updateRefs({ text: todo.text });
    (refs.checkbox as HTMLInputElement).checked = todo.done;
    refs.deleteBtn.onclick = () => deleteTodo(todo.id);

    return element;
  }
});
```

### With createBinder()

```typescript
interface FormRefs {
  nameInput: HTMLElement;
  emailInput: HTMLElement;
  submitBtn: HTMLElement;
}

const Form = viewRefs<FormRefs>(({ refs }) =>
  h.form({}, [
    h.input({ dataRef: 'nameInput', attr: { type: 'text' } }),
    h.input({ dataRef: 'emailInput', attr: { type: 'email' } }),
    h.button({ dataRef: 'submitBtn' }, ['Submit'])
  ])
);

const { refs } = Form();

// Create type-safe binder
const ui = createBinder(refs, {
  nameInput: bind.value,
  emailInput: bind.value,
  submitBtn: (el) => bind.prop('disabled', el)
});

// Update form state
ui({
  nameInput: 'John Doe',
  emailInput: 'john@example.com',
  submitBtn: false
});
```

## Multiple Instances

Each call to the template factory creates an independent instance:

```typescript
const card1 = Card();
const card2 = Card();

card1.updateRefs({ title: 'Card 1' });
card2.updateRefs({ title: 'Card 2' });

// Completely independent
console.log(card1.refs.title.textContent); // "Card 1"
console.log(card2.refs.title.textContent); // "Card 2"
```

## Type Safety

TypeScript provides full type checking for refs:

```typescript
interface Refs {
  title: HTMLHeadingElement;
  input: HTMLInputElement;
}

const { refs } = Template();

refs.title.textContent = 'Hello';  // ✓ OK
refs.input.value = 'test';         // ✓ OK
refs.title.value = 'test';         // ✗ Error: Property 'value' does not exist
refs.nonexistent;                   // ✗ Error: Property 'nonexistent' does not exist
```

## Best Practices

1. **Define ref interfaces**: Always create a TypeScript interface for your refs
2. **Use updateRefs for multiple updates**: More efficient than individual assignments
3. **Use bind() for callbacks**: Creates clean, reusable setter functions
4. **Keep templates pure**: Template factory should only create structure, not add behavior
5. **Use with List()**: Perfect for rendering dynamic collections
6. **Combine with createBinder()**: Get advanced data binding capabilities
7. **Call destroy() when done**: Clean up when component is removed

## Performance

- **Creation**: Minimal overhead, same as manual element creation + `refs()`
- **updateRefs()**: O(n) where n is number of refs being updated
- **bind()**: Zero overhead, returns a simple closure
- **Memory**: Each instance stores its own refs object

## See Also

- [h/tags - Hyperscript Creation](./45-hyperscript.md)
- [List() - Reactive Lists](./46-list.md)
- [createBinder() - Data Binding](./48-binder.md)
- [refs() - Ref Extraction](./14-component-refs.md)
- [modify() - Element Updates](./06-modify.md)
