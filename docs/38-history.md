# History

Browser history and navigation utilities.

## Why?
The History API is powerful but verbose. `History` provides a cleaner interface for SPA routing.

## API Reference

### `History`
History utilities.

```typescript
const History = {
  push: (url: string, state?: any) => void,
  replace: (url: string, state?: any) => void,
  back: () => void,
  forward: () => void,
  listen: (callback: (state: any) => void) => Unsubscribe
};
```

## Examples

### SPA Navigation
```typescript
import { History } from '@doeixd/dom';

// Navigate
History.push('/about', { from: 'home' });

// Listen for changes
History.listen((state) => {
  console.log('Navigated:', location.pathname, state);
});
```
