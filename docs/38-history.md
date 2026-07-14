# History & URL State

Browser history, navigation, and typed query-parameter utilities.

## Why?
The History API is powerful but verbose. `History` provides a cleaner interface
for SPA navigation and URL state, and the `Query` codec layer makes query
params type-safe (URLs are strings; codecs parse and serialize them).

## API Reference

### `History`
```typescript
const History = {
  // URL query params (current page)
  query: (params: QueryParams) => (mode?: 'push' | 'replace') => void,
  setQuery: <S>(schema: S, values: Partial<ParsedQuery<S>>) => (mode?) => void,
  readQuery: <S>(schema: S) => ParsedQuery<S>,   // typed via schema
  readQuery: <T>() => T,                          // legacy: raw strings
  readQueryAll: () => Record<string, string[]>,

  // Navigation + history state
  push: <T>(path: string, state?: T) => void,
  replace: <T>(path: string, state?: T) => void,
  state: <T>() => T | null,
  back: () => void,
  forward: () => void,
  reload: () => void,
  onPop: (handler: (e: PopStateEvent) => void) => Unsubscribe,

  // State encoding + input binding
  encodeState / decodeState / syncToUrl
};
```

### Query params
`History.query` merges params into the current URL (arrays become repeated keys
`?tag=a&tag=b`; `null`/`undefined`/`''` removes a key):

```typescript
History.query({ page: 2, sort: 'desc' })();      // ?page=2&sort=desc  (pushState)
History.query({ tab: 'settings' })('replace');   // replaceState
History.query({ sort: null })();                 // removes ?sort
```

### Typed query with `Query` codecs
URLs are stringly-typed. A `Query` schema parses raw params into real,
defaulted values and serializes them back symmetrically.

```typescript
import { History, Query } from '@doeixd/dom';

const schema = {
  page: Query.number(1),
  sort: Query.oneOf(['asc', 'desc'] as const, 'asc'),
  tags: Query.array(Query.string()),
  open: Query.boolean(false)
};

// Read: parsed + typed + defaulted
const { page, sort, tags, open } = History.readQuery(schema);
// page: number; sort: 'asc' | 'desc'; tags: string[]; open: boolean

// Write: typed values serialized back into the URL
History.setQuery(schema, { page: 2, sort: 'desc' })();   // ?page=2&sort=desc
```

Codecs (all bidirectional): `Query.string(fallback?)`, `Query.number(fallback?)`,
`Query.boolean(fallback?)`, `Query.oneOf(values, fallback)`,
`Query.array(itemCodec?)`. Standalone helpers `parseQuery(schema, search)` and
`serializeQuery(schema, values)` work outside `History` (e.g. on the server),
and `encodeQueryParams(params)` is the shared `QueryParams → URLSearchParams`
codec used by both `History` and the `Http` module.

### Navigation
```typescript
History.push('/about', { from: 'home' });   // pushState with typed state
History.replace('/login');
const s = History.state<{ from: string }>(); // typed history state
const off = History.onPop((e) => render());  // back/forward
History.back(); History.forward();
```

### `History.syncToUrl(paramName, debounceMs?)`
Two-way binds an input's value to a query param (debounced):

```typescript
History.syncToUrl('search', 300)(document.querySelector('#q'));
```

## See also
- [Routing](50-routing.md) — `createRouter`, `route`, `matchPath`, `buildPath`
  build on these primitives.
