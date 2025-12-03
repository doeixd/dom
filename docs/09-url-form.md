# URL & Form

Utilities for URL parameters and form handling.

## Why?
`URLSearchParams` is great but can be verbose. `Params` provides a simpler API for reading and writing URL parameters. `Form` helpers simplify serialization.

## API Reference

### `Params`
Utilities for URL parameters.

```typescript
const Params = {
  // Get a parameter value
  get: (key: string) => string | null,
  
  // Set a parameter value (updates URL history)
  set: (key: string, val: string | number | boolean) => void,
  
  // Delete a parameter
  delete: (key: string) => void,
  
  // Get all parameters as an object
  all: () => Record<string, string>
};
```

### `Form`
Utilities for form handling.

```typescript
const Form = {
  // Serialize form to object
  serialize: (form: HTMLFormElement) => Record<string, any>,
  
  // Populate form from object
  populate: (form: HTMLFormElement) => (data: Record<string, any>) => void
};
```

## Examples

### Managing URL State
```typescript
import { Params } from '@doeixd/dom';

// URL: /?tab=users
const currentTab = Params.get('tab');

// Switch tab
Params.set('tab', 'settings');
// URL: /?tab=settings
```

### Form Serialization
```typescript
import { Form, on, find } from '@doeixd/dom';

const form = find('form');

on(form)('submit', (e) => {
  e.preventDefault();
  const data = Form.serialize(form as HTMLFormElement);
  console.log('Form data:', data);
});
```
