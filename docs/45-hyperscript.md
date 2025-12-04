# h/tags - Hyperscript Element Creation

VanJS-style element creation using Proxy-based property access for cleaner, more expressive DOM construction.

## Overview

The `h` proxy (also exported as `tags`) provides an alternative to `el()` that mimics JSX-like syntax without requiring a build step. Access any HTML or SVG tag as a property, and it returns a function that creates that element.

```typescript
import { h } from '@doeixd/dom';

const card = h.div({ class: { card: true } }, [
  h.h2({}, ['Card Title']),
  h.p({}, ['Card content goes here']),
  h.button({ class: { btn: true } }, ['Click Me'])
]);
```

## Why Use h/tags?

**Advantages over `el()`:**
- **Cleaner syntax**: `h.div()` vs `el('div')`
- **Better autocomplete**: Property access provides better IDE support
- **Automatic SVG**: SVG elements get correct namespace automatically
- **Familiar pattern**: Similar to VanJS, Mithril, and hyperscript libraries

**When to use `el()` instead:**
- Dynamic tag names from variables
- Custom elements with hyphens or special characters
- When you need strict type inference (Proxy loses `HTMLDivElement` specificity)

## Basic Usage

### HTML Elements

```typescript
import { h } from '@doeixd/dom';

// Simple element
const div = h.div();

// With text content
const paragraph = h.p({}, ['Hello World']);

// With properties
const button = h.button({
  class: { primary: true },
  attr: { type: 'submit' }
}, ['Submit']);

// Nested structure
const form = h.form({ attr: { action: '/submit' } }, [
  h.label({}, ['Name:']),
  h.input({ attr: { type: 'text', name: 'username' } }),
  h.button({ attr: { type: 'submit' } }, ['Submit'])
]);
```

### SVG Elements

SVG elements are automatically created with the correct namespace:

```typescript
import { h } from '@doeixd/dom';

const icon = h.svg({
  attr: { viewBox: '0 0 24 24', width: '24', height: '24' },
  class: { icon: true }
}, [
  h.path({
    attr: {
      d: 'M12 2L2 12h3v8h5v-6h4v6h5v-8h3z',
      fill: 'currentColor'
    }
  })
]);
```

**Supported SVG elements:**
- Basic shapes: `circle`, `rect`, `line`, `polygon`, `polyline`, `ellipse`, `path`
- Containers: `svg`, `g`, `defs`, `symbol`, `marker`, `pattern`, `mask`
- Text: `text`, `tspan`
- Gradients: `linearGradient`, `radialGradient`, `stop`
- Other: `use`, `image`, `foreignObject`, `clipPath`

## Props

The `h` proxy accepts the same props as `el()` with one addition:

```typescript
interface HElementProps extends ElementProps {
  /** Optional data-ref for use with refs() */
  dataRef?: string;

  /** Class toggles */
  class?: Record<string, boolean>;

  /** Inline styles */
  style?: Partial<CSSStyleDeclaration>;

  /** HTML attributes */
  attr?: Record<string, string | number | boolean>;

  /** Text content (overwrites children) */
  text?: string;

  /** Inner HTML (overwrites children) */
  html?: string;

  /** Dataset attributes */
  dataset?: Record<string, string>;
}
```

### dataRef Property

The `dataRef` prop automatically sets a `data-ref` attribute for use with the `refs()` function:

```typescript
const form = h.form({}, [
  h.input({ dataRef: 'username' }),
  h.input({ dataRef: 'password' }),
  h.button({ dataRef: 'submit' }, ['Login'])
]);

const formRefs = refs(form);
// formRefs.username: HTMLElement
// formRefs.password: HTMLElement
// formRefs.submit: HTMLElement
```

## Children

Children can be:
- **Strings**: Converted to text nodes
- **Numbers**: Converted to text nodes
- **Elements**: Appended as-is
- **null/undefined/false**: Filtered out (useful for conditional rendering)

```typescript
// Mixed children
const card = h.div({}, [
  'Text before',
  h.strong({}, ['bold text']),
  'Text after'
]);

// Conditional rendering
const status = h.div({}, [
  h.span({}, ['Status:']),
  isActive && h.span({ class: { active: true } }, ['Active']),
  !isActive && h.span({}, ['Inactive'])
]);

// Arrays are flattened
const list = h.ul({}, [
  h.li({}, ['Item 1']),
  h.li({}, ['Item 2']),
  h.li({}, ['Item 3'])
]);
```

## Integration with Other Features

### With refs()

```typescript
const toolbar = h.div({ class: { toolbar: true } }, [
  h.button({ dataRef: 'saveBtn' }, ['Save']),
  h.button({ dataRef: 'cancelBtn' }, ['Cancel']),
  h.button({ dataRef: 'deleteBtn' }, ['Delete'])
]);

const { saveBtn, cancelBtn, deleteBtn } = refs(toolbar);

saveBtn.onclick = () => console.log('Save clicked');
cancelBtn.onclick = () => console.log('Cancel clicked');
deleteBtn.onclick = () => console.log('Delete clicked');
```

### With viewRefs()

```typescript
interface CardRefs {
  title: HTMLElement;
  content: HTMLElement;
  button: HTMLElement;
}

const Card = viewRefs<CardRefs>(({ refs }) =>
  h.div({ class: { card: true } }, [
    h.h2({ dataRef: 'title' }),
    h.p({ dataRef: 'content' }),
    h.button({ dataRef: 'button' }, ['Action'])
  ])
);

const { element, refs } = Card();
refs.title.textContent = 'My Card';
refs.content.textContent = 'Card description';
```

### With List()

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const container = h.ul({ class: { 'todo-list': true } });

const list = List<Todo>(container, {
  key: todo => todo.id,
  render: (todo) => h.li({
    class: { done: todo.done }
  }, [
    h.input({ attr: { type: 'checkbox', checked: todo.done } }),
    h.span({}, [todo.text]),
    h.button({}, ['Delete'])
  ])
});

list.set([
  { id: 1, text: 'Buy groceries', done: false },
  { id: 2, text: 'Walk dog', done: true }
]);
```

## Real-World Examples

### Form Component

```typescript
const loginForm = h.form({
  class: { 'login-form': true },
  attr: { action: '/login', method: 'post' }
}, [
  h.div({ class: { 'form-group': true } }, [
    h.label({ attr: { for: 'username' } }, ['Username']),
    h.input({
      attr: { type: 'text', id: 'username', name: 'username' },
      dataRef: 'usernameInput'
    })
  ]),
  h.div({ class: { 'form-group': true } }, [
    h.label({ attr: { for: 'password' } }, ['Password']),
    h.input({
      attr: { type: 'password', id: 'password', name: 'password' },
      dataRef: 'passwordInput'
    })
  ]),
  h.div({ class: { 'form-actions': true } }, [
    h.button({
      attr: { type: 'submit' },
      class: { 'btn-primary': true },
      dataRef: 'submitBtn'
    }, ['Login'])
  ])
]);
```

### Card with Icon

```typescript
const cardWithIcon = h.div({ class: { card: true } }, [
  h.div({ class: { 'card-header': true } }, [
    h.svg({
      attr: { viewBox: '0 0 24 24', width: '24', height: '24' },
      class: { icon: true }
    }, [
      h.path({
        attr: {
          d: 'M12 2L2 12h3v8h5v-6h4v6h5v-8h3z',
          fill: 'currentColor'
        }
      })
    ]),
    h.h3({}, ['Card Title'])
  ]),
  h.div({ class: { 'card-body': true } }, [
    h.p({}, ['This is the card content with an icon in the header.'])
  ]),
  h.div({ class: { 'card-footer': true } }, [
    h.button({ class: { btn: true } }, ['Action'])
  ])
]);
```

### Navigation Menu

```typescript
const nav = h.nav({ class: { navbar: true } }, [
  h.div({ class: { 'navbar-brand': true } }, [
    h.a({ attr: { href: '/' } }, ['My App'])
  ]),
  h.ul({ class: { 'navbar-nav': true } }, [
    h.li({ class: { active: true } }, [
      h.a({ attr: { href: '/home' } }, ['Home'])
    ]),
    h.li({}, [
      h.a({ attr: { href: '/about' } }, ['About'])
    ]),
    h.li({}, [
      h.a({ attr: { href: '/contact' } }, ['Contact'])
    ])
  ])
]);
```

### Modal Dialog

```typescript
const modal = h.div({
  class: { modal: true, 'modal-open': false },
  dataRef: 'modalOverlay'
}, [
  h.div({ class: { 'modal-dialog': true } }, [
    h.div({ class: { 'modal-header': true } }, [
      h.h4({ dataRef: 'modalTitle' }, ['Modal Title']),
      h.button({
        class: { 'modal-close': true },
        dataRef: 'closeBtn',
        attr: { 'aria-label': 'Close' }
      }, ['×'])
    ]),
    h.div({
      class: { 'modal-body': true },
      dataRef: 'modalBody'
    }),
    h.div({ class: { 'modal-footer': true } }, [
      h.button({ class: { 'btn-secondary': true } }, ['Cancel']),
      h.button({ class: { 'btn-primary': true }, dataRef: 'confirmBtn' }, ['Confirm'])
    ])
  ])
]);

const modalRefs = refs(modal);
modalRefs.closeBtn.onclick = () => {
  modal.classList.remove('modal-open');
};
```

## Performance

The `h` proxy has minimal overhead compared to `el()`:

- **Creation time**: ~5% slower than `el()` due to Proxy lookup
- **Memory**: Same as `el()` (Proxy is stateless)
- **Type inference**: Returns `HTMLElement` (loses specific types like `HTMLDivElement`)

For performance-critical code creating thousands of elements per second, consider using `el()` directly. For typical application code, the difference is negligible.

## The `tags` Alias

The `tags` export is an alias for `h`, provided for clarity when importing:

```typescript
import { tags } from '@doeixd/dom';

const div = tags.div({}, ['Content']);
```

Use whichever feels more natural in your codebase.

## Best Practices

1. **Use for declarative structures**: `h` shines when building declarative UI hierarchies
2. **Combine with viewRefs**: Perfect for creating reusable component templates
3. **Leverage dataRef**: Makes ref extraction cleaner than manual `data-ref` attributes
4. **SVG namespaces are automatic**: Don't worry about `createElementNS` for SVG
5. **Conditional rendering**: Use `&&` and ternaries with null/false for clean conditionals

## See Also

- [viewRefs() - Template Factories](./47-viewrefs.md)
- [List() - Reactive Lists](./46-list.md)
- [refs() - Ref Extraction](./14-component-refs.md)
- [modify() - Element Updates](./06-modify.md)
