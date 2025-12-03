# Querying

Efficiently locate elements in the DOM with type inference.

## Why?
Standard `querySelector` and `querySelectorAll` return generic `Element` or `NodeList` types, requiring manual casting. They also don't support chaining or functional composition easily.

The querying module provides:
- **Automatic Type Inference**: Infers `HTMLButtonElement` from `'button'`, etc.
- **Currying**: Create reusable selectors like `const findBtn = find('button')`.
- **Safety**: Returns `null` instead of throwing or returning `undefined`.

## API Reference

### `find`
Finds the **first** element matching a selector.

```typescript
// Signature
function find<S extends string>(selector: S): ParseSelector<S> | null;
function find(root: ParentNode): <S extends string>(selector: S) => ParseSelector<S> | null;
```

#### Parameters
- `selector`: CSS selector string.
- `root` (Optional): The element to search within (defaults to `document`).

#### Returns
- The matching element (typed) or `null`.

### `findAll`
Finds **all** elements matching a selector.

```typescript
// Signature
function findAll<S extends string>(selector: S): NodeListOf<ParseSelector<S>>;
function findAll(root: ParentNode): <S extends string>(selector: S) => NodeListOf<ParseSelector<S>>;
```

#### Parameters
- `selector`: CSS selector string.
- `root` (Optional): The element to search within (defaults to `document`).

#### Returns
- A `NodeList` of matching elements (typed).

### `closest`
Finds the closest ancestor matching a selector.

```typescript
// Signature
function closest<S extends string>(selector: S): (element: Element | null) => ParseSelector<S> | null;
```

#### Parameters
- `selector`: CSS selector string.
- `element`: The element to start searching from.

#### Returns
- The matching ancestor (typed) or `null`.

## Examples

### Basic Usage
```typescript
import { find, findAll } from '@doeixd/dom';

const btn = find('button#submit'); // HTMLButtonElement | null
const items = findAll('ul > li');  // NodeListOf<HTMLLIElement>
```

### Scoped Search (Currying)
```typescript
const form = find('form.login');
if (form) {
  // Create a finder scoped to this form
  const findInForm = find(form);
  
  const input = findInForm('input[name="email"]'); // HTMLInputElement | null
}
```

### Finding Ancestors
```typescript
import { closest, on } from '@doeixd/dom';

on(document.body)('click', (e) => {
  const target = e.target as HTMLElement;
  const card = closest('.card')(target);
  
  if (card) {
    console.log('Clicked inside a card:', card);
  }
});
```
