# Cookies

Utilities for reading and writing browser cookies.

## Why?
The `document.cookie` API is notoriously difficult to use. `Cookie` provides a simple get/set/remove interface.

## API Reference

### `Cookie`
Utilities for cookies.

```typescript
const Cookie = {
  get: (name: string) => string | null,
  set: (name: string, value: string, days?: number) => void,
  remove: (name: string) => void
};
```

## Examples

### Managing Cookies
```typescript
import { Cookie } from '@doeixd/dom';

// Set a cookie for 7 days
Cookie.set('token', 'abc-123', 7);

// Read it
const token = Cookie.get('token');

// Delete it
Cookie.remove('token');
```
