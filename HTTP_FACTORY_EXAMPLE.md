# Http - Type-Safe HTTP Client

Complete, production-grade HTTP client with full generics, inference, and flexible configuration.

Includes both simple one-off request methods and a powerful factory for creating configured clients.

## Quick Start

### Simple Requests (One-off)

```typescript
import { Http } from './src';

// Simple GET - throws on error
const users = await Http.get<User[]>('/api/users');

// Simple POST with curried API
const user = await Http.post('/api/users')
  ({ name: 'John', email: 'john@example.com' })
  ({ 'Authorization': 'Bearer token' });
```

### Advanced: Configured Client

```typescript
import { Http } from './src';

// Create a configured client
const api = Http.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'secret123' },
  timeout: 5000,
  retries: 2,
  retryDelay: 1000
});

// Type-safe GET
interface User { id: number; name: string; email: string }
const res = await api.get<User>('/users/123')({});
if (res.ok) {
  console.log(res.data.name); // Full type inference
}

// Type-safe POST
interface CreateUserInput { name: string; email: string }
const created = await api.post<User>('/users')({
  body: { name: 'Alice', email: 'alice@example.com' },
  params: { notify: true }
});

// Response helpers
const user = api.unwrap(created); // throws on error
const users = api.unwrapOr(created, null); // fallback value
```

## Key Features

### 1. **Flexible Configuration**
```typescript
const api = Http.create({
  baseURL: 'https://api.example.com',      // Default base URL
  headers: {                                 // Default headers
    'X-API-Key': 'secret',
    'Accept-Language': 'en-US'
  },
  timeout: 5000,                            // Default timeout (ms)
  retries: 2,                               // Retry on network error
  retryDelay: 1000                          // Delay between retries
});
```

### 2. **Per-Request Overrides**
```typescript
// Override baseURL
await api.get('/status')({
  baseURL: 'https://status.example.com'
});

// Override timeout
await api.get<Data>('/slow-endpoint')({
  timeout: 30000,
  retries: 5
});

// Add query params
await api.get<User>('/search')({
  params: { q: 'alice', limit: 10, active: true }
});

// Add request body (POST/PUT/PATCH)
await api.post<User>('/users')({
  body: { name: 'Bob', email: 'bob@example.com' },
  params: { notify: true }
});

// Custom headers per-request
await api.get<Data>('/protected')({
  headers: { 'Authorization': 'Bearer token123' }
});

// Transform response
await api.get<Tag[]>('/tags')({
  transform: (data) => data.map((t: any) => t.name)
});
```

### 3. **Interceptors (Auth, Logging, Error Handling)**
```typescript
const api = Http.create({
  baseURL: 'https://api.example.com',
  
  // Request interceptor - modify all requests
  interceptRequest: async (init) => {
    const token = await getAuthToken();
    return {
      ...init,
      headers: {
        ...init.headers,
        'Authorization': `Bearer ${token}`
      }
    };
  },
  
  // Response interceptor - handle all responses
  interceptResponse: async (res) => {
    if (res.status === 401) {
      // Token expired - refresh and retry
      await refreshAuthToken();
      // Your retry logic here
    }
    
    if (!res.ok) {
      // Global error logging
      console.error(`API Error: ${res.status} ${res.statusText}`);
    }
    
    return res;
  }
});
```

### 4. **Type-Safe Methods**
```typescript
interface ApiUser { id: number; name: string }
interface ApiPost { id: number; title: string; userId: number }

// GET
const user = await api.get<ApiUser>('/users/1')({});

// POST
const newPost = await api.post<ApiPost>('/posts')({
  body: { title: 'My Post', userId: 1 }
});

// PUT (full replacement)
const updated = await api.put<ApiUser>('/users/1')({
  body: { name: 'Updated Name' }
});

// PATCH (partial update)
const patched = await api.patch<ApiUser>('/users/1')({
  body: { name: 'New Name' }
});

// DELETE
const deleted = await api.delete<void>('/users/1')({});
```

### 5. **Response Object & Helpers**
```typescript
// All responses return HttpResponse<T>
interface HttpResponse<T> {
  ok: boolean;           // true if 2xx status
  status: number;        // HTTP status code
  statusText: string;    // e.g. "OK", "Not Found"
  data: T | null;        // Parsed response data
  error: Error | null;   // Error if failed
  response: Response;    // Raw Fetch Response
}

const res = await api.get<User>('/users/1')({});

// Check success (with type narrowing)
if (api.isOk(res)) {
  console.log(res.data); // Guaranteed to be User
}

// Unwrap or throw
try {
  const user = api.unwrap(res);
} catch (err) {
  console.error(`HTTP ${res.status}: ${res.statusText}`);
}

// Unwrap with fallback
const user = api.unwrapOr(res, null);

// Access raw response
const headers = res.response.headers;
```

### 6. **Automatic Content-Type Detection**
```typescript
// JSON responses
const users = await api.get<User[]>('/api/users')({});
// Automatically parsed as JSON

// Text responses
const html = await api.get<string>('/page.html')({});
// Automatically read as text

// Binary responses
const image = await api.get<Blob>('/image.png')({});
// Automatically read as Blob

// ArrayBuffer responses
const buffer = await api.get<ArrayBuffer>('/data.bin')({});
// Automatically read as ArrayBuffer
```

### 7. **Timeout & Retry Logic**
```typescript
// Default timeout and retries
const api = Http.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,   // All requests timeout after 5s
  retries: 2,      // Retry 2 times on network failure
  retryDelay: 1000 // Wait 1s between retries
});

// Override for specific request
await api.get<Data>('/expensive-operation')({
  timeout: 30000,  // Allow 30s
  retries: 5       // Retry up to 5 times
});

// Query parameter handling (auto-encodes and filters nulls)
await api.get('/users')({
  params: {
    search: 'alice',     // Included
    page: 1,             // Included
    filter: null,        // Automatically excluded
    active: undefined    // Automatically excluded
  }
  // Result: /users?search=alice&page=1
});
```

## Complete Example: Real-world API Client

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface CreateUserDto {
  name: string;
  email: string;
}

// api.ts
import { Http, HttpResponse } from './src';

export const api = Http.create<'Authorization' | 'X-Request-ID'>({
  baseURL: process.env.VITE_API_URL || 'https://api.example.com',
  
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '2.0'
  },
  
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  
  interceptRequest: async (init) => {
    // Add auth token
    const token = localStorage.getItem('authToken');
    const requestId = crypto.randomUUID();
    
    return {
      ...init,
      headers: {
        ...init.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Request-ID': requestId
      }
    };
  },
  
  interceptResponse: async (res) => {
    // Handle auth failures globally
    if (res.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    if (res.status === 429) {
      console.warn('Rate limited - backing off');
      // Could implement exponential backoff here
    }
    
    return res;
  }
});

// Usage in components
export async function fetchUser(id: number): Promise<User | null> {
  const res = await api.get<User>(`/users/${id}`)({});
  return api.unwrapOr(res, null);
}

export async function createUser(data: CreateUserDto): Promise<User | null> {
  const res = await api.post<User>('/users')({
    body: data
  });
  
  if (!api.isOk(res)) {
    console.error(`Failed to create user: ${res.statusText}`);
    return null;
  }
  
  return res.data;
}

export async function searchUsers(query: string): Promise<User[]> {
  const res = await api.get<User[]>('/users')({
    params: { q: query, limit: 50 }
  });
  
  return api.unwrapOr(res, []);
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  const res = await api.patch<User>(`/users/${id}`)({
    body: updates,
    timeout: 3000 // Fast response expected
  });
  
  return api.unwrapOr(res, null);
}

export async function deleteUser(id: number): Promise<boolean> {
  const res = await api.delete<void>(`/users/${id}`)({});
  return res.ok;
}
```

## Advanced: Custom Header Types

```typescript
// Define your custom headers
type CustomHeaders = 'Authorization' | 'X-API-Key' | 'X-Request-ID' | 'X-Correlation-ID';

const api = Http.create<CustomHeaders>({
  baseURL: 'https://api.example.com',
  headers: {
    'X-API-Key': 'secret',
    'X-Request-ID': crypto.randomUUID()
  }
});

// TypeScript will ensure you only use valid header names
// This is checked at the config and per-request level
```

## API Overview

### Static Methods (Simple One-off Requests)

```typescript
// These throw errors on non-2xx responses
Http.get<T>(url, headers?)          // Returns T
Http.post<T>(url)(body)(headers?)   // Returns T (curried)
Http.put<T>(url)(body)(headers?)    // Returns T (curried)
Http.delete<T>(url, headers?)       // Returns T
```

### Http.create() (Configured Client)

```typescript
// Returns a client with methods:
client.get<T>(path)(config)         // Returns HttpResponse<T>
client.post<T>(path)(config)        // Returns HttpResponse<T>
client.put<T>(path)(config)         // Returns HttpResponse<T>
client.patch<T>(path)(config)       // Returns HttpResponse<T>
client.delete<T>(path)(config)      // Returns HttpResponse<T>

// Plus helpers:
client.isOk<T>(res)                 // Type guard for res.ok
client.unwrap<T>(res)               // Throws on error
client.unwrapOr<T>(res, fallback)   // Returns fallback on error
```

## Summary

**Http** provides:
- ✅ Full type safety with generics
- ✅ Flexible per-client defaults (baseURL, headers, timeout, retries)
- ✅ Per-request overrides
- ✅ Async request/response interceptors
- ✅ Automatic JSON serialization/deserialization
- ✅ Query parameter handling
- ✅ Timeout with AbortController
- ✅ Automatic retry on network failure
- ✅ Content-type detection
- ✅ Response helpers (isOk, unwrap, unwrapOr)
- ✅ Curried API for composition
