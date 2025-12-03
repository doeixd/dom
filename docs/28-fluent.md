# Fluent Wrapper ($)

Object-oriented wrapper for functional DOM utilities.

## Why?
While the library is primarily functional, some developers prefer method chaining. `$` wraps an element and provides all library functions as methods.

## API Reference

### `$`
Wraps an element for method chaining.

```typescript
function $<T extends HTMLElement>(target: T | null): FluentWrapper<T>;
```

#### Methods
All library functions are available as methods, e.g.:
- `.on(event, handler)`
- `.modify(props)`
- `.css(styles)`
- `.append(...children)`
- `.find(selector)`
- etc.

## Examples

### Method Chaining
```typescript
import { $ } from '@doeixd/dom';

const btn = $('button#submit')
  .modify({ text: 'Click Me' })
  .css({ backgroundColor: 'blue' })
  .on('click', () => console.log('Clicked!'))
  .raw; // Access the underlying element
```

### Combining Styles
```typescript
import { $ } from '@doeixd/dom';

const card = $('.card')
  .modify({
    class: { active: true },
    attr: { 'data-id': '123' }
  })
  .css({ padding: '20px' });
```
