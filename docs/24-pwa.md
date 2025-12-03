# PWA (Service Worker)

Utilities for Progressive Web Apps.

## Why?
Registering a service worker and communicating with it involves boilerplate code. `SW` simplifies this process.

## API Reference

### `SW`
Service Worker utilities.

```typescript
const SW = {
  // Register a service worker
  register: (path: string, options?: RegistrationOptions) => Promise<ServiceWorkerRegistration | null>,
  
  // Post a message to the active service worker
  post: (message: any) => void
};
```

## Examples

### Registering a Service Worker
```typescript
import { SW } from '@doeixd/dom';

// Only registers if supported by the browser
SW.register('/sw.js').then((reg) => {
  if (reg) {
    console.log('Service Worker registered!');
  }
});
```

### Sending Messages
```typescript
import { SW } from '@doeixd/dom';

// Send data to the SW (e.g., to cache a route)
SW.post({ type: 'CACHE_ROUTE', url: '/about' });
```
