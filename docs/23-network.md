# Network (Http)

A flexible HTTP client built on top of `fetch`, with both a simple static API and a fully-configurable client factory.

## Why?
Raw `fetch` calls often repeat the same patterns: JSON parsing, base URLs, headers, timeouts, retries, error handling, and abort controllers. `Http` gives you:
- A simple static API for quick requests.
- A configurable client with defaults, interceptors, retries, and timeouts.
- Consistent response wrappers and helpers to unwrap data safely.

## What
`Http` exposes two layers:
- **Static helpers**: quick one-off requests (`Http.get`, `Http.post`, `Http.put`, `Http.delete`).
- **Client factory**: `Http.create()` returns a configurable client with typed responses and extended features.

## How
Use the static helpers for simple calls, or create a client when you need base URLs, retries, interceptors, or abortable requests.

## API Reference

### Static Helpers
Simple, direct JSON requests.

```typescript
const Http = {
  get: <T>(url: string, headers?: Record<string, string>) => Promise<T>,
  post: (url: string) => <T>(body: any) => (headers?: Record<string, string>) => Promise<T>,
  put: (url: string) => <T>(body: any) => (headers?: Record<string, string>) => Promise<T>,
  delete: <T>(url: string, headers?: Record<string, string>) => Promise<T>,
  create: (config?: HttpConfig) => HttpClient
};
```

**Behavior**
- JSON body encoding for `post`/`put`.
- JSON response parsing.
- Throws on non-2xx responses with a descriptive error.

### `Http.create(config)`
Create a configured client with defaults, interceptors, and helpers.

```typescript
const api = Http.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'secret' },
  timeout: 5000,
  retries: 2,
  retryDelay: 1000,
  interceptRequest: async (init) => ({
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${await getToken()}` }
  }),
  interceptResponse: async (res) => res,
  interceptors: {
    request: async (init) => init,
    response: async (res) => res,
    error: async (res) => res
  }
});
```

**Config features**
- `baseURL`: prefix for all requests.
- `headers`: default headers merged per request.
- `timeout`: per-request timeout in ms.
- `retries` / `retryDelay`: retry failed requests.
- `interceptRequest` / `interceptResponse`: per-client interception hooks.
- `interceptors.request/response/error`: grouped interceptor variant.

### Client Methods
Each method returns a curried request function that accepts request options.

```typescript
const res = await api.get<User>('/users/123')({
  params: { verbose: true },
  timeout: 3000,
  retries: 1,
  headers: { 'X-Trace': 'abc' }
});
```

Available methods:
```typescript
api.get<T>(path)(init)
api.post<T>(path)(init)
api.put<T>(path)(init)
api.delete<T>(path)(init)
api.patch<T>(path)(init)
```

### Request Options (`HttpRequestInit`)
Common per-request options:
- `body`: request body (object auto-JSON encoded unless `FormData`).
- `params`: query params appended to the URL.
- `headers`: request-specific headers.
- `timeout`: override default timeout.
- `retries`: override retry count.
- `retryDelay`: override retry delay.
- `baseURL`: override client base URL.
- `transform`: transform parsed JSON before returning.
- `abortable: true`: returns `{ promise, abort }`.

### Response Helpers
```typescript
api.isOk(res)      // narrows to ok responses
api.unwrap(res)    // throws if not ok
api.unwrapOr(res, fallback)
```

## Examples

### Simple GET
```typescript
import { Http } from '@doeixd/dom';

const users = await Http.get<User[]>('/api/users');
```

### Curried POST
```typescript
import { Http } from '@doeixd/dom';

const createUser = Http.post('/api/users');
const user = await createUser<{ id: number }>({ name: 'Alice' })({
  Authorization: `Bearer ${token}`
});
```

### Client with Base URL + Params
```typescript
import { Http } from '@doeixd/dom';

const api = Http.create({ baseURL: 'https://api.example.com' });
const res = await api.get<User[]>('/users')({
  params: { page: 2, pageSize: 20 }
});
```

### Abortable Request
```typescript
import { Http } from '@doeixd/dom';

const api = Http.create();
const { promise, abort } = api.get<User[]>('/users')({ abortable: true });

setTimeout(() => abort(), 1000);
const res = await promise;
```

### Transform Response
```typescript
import { Http } from '@doeixd/dom';

const api = Http.create();
const res = await api.get<string[]>('/tags')({
  transform: (data) => data.map((tag: any) => tag.name)
});
```

### Unwrap Helpers
```typescript
import { Http } from '@doeixd/dom';

const api = Http.create();
const res = await api.get<User[]>('/users')({});

if (api.isOk(res)) {
  console.log(res.data);
}

const users = api.unwrap(res);
const usersOrEmpty = api.unwrapOr(res, [] as User[]);
```

## Notes
- JSON bodies are auto-encoded unless you pass `FormData`.
- Errors return `{ ok: false, error }` for client requests (non-static).
- Static helpers throw on non-OK responses.