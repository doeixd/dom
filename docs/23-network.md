# Network (Http)

A lightweight wrapper around `fetch`.

## Why?
`fetch` is great but requires repetitive boilerplate for JSON parsing, error handling, and setting headers. `Http` simplifies common requests.

## API Reference

### `Http`
Methods for HTTP requests.

```typescript
const Http = {
  get: <T>(url: string, headers?: HeadersInit) => Promise<T>,
  post: <T>(url: string, body: any, headers?: HeadersInit) => Promise<T>,
  put: <T>(url: string, body: any, headers?: HeadersInit) => Promise<T>,
  delete: <T>(url: string, headers?: HeadersInit) => Promise<T>
};
```

#### Features
- Automatically parses JSON responses.
- Automatically stringifies JSON bodies.
- Sets `Content-Type: application/json` by default for write methods.
- Throws if `response.ok` is false.

## Examples

### Fetching Data
```typescript
import { Http } from '@doeixd/dom';

interface User {
  id: number;
  name: string;
}

try {
  const users = await Http.get<User[]>('/api/users');
  console.log(users);
} catch (err) {
  console.error('Failed to fetch users', err);
}
```

### Posting Data
```typescript
import { Http } from '@doeixd/dom';

await Http.post('/api/users', { name: 'Alice' });
```
