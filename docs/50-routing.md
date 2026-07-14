# Routing

Typed path patterns and a small client-side router, built on the library's
existing primitives — `matchPath`/`buildPath` for paths, the `Query` codec
layer for query params, `History` for navigation, and
`component`/`ComponentHandle` for view lifecycle.

## Path primitives (standalone)

### `matchPath(pattern, path)`
Matches a concrete path against a pattern, returning **typed** params or `null`.
Param values are URI-decoded; the query string is ignored.

```typescript
matchPath('/users/:id', '/users/42');            // { id: '42' }
matchPath('/users/:id/posts/:postId', path);      // { id: string; postId: string } | null
matchPath('/files/*', '/files/a/b.txt');          // { wildcard: 'a/b.txt' }
matchPath('/users/:id', '/posts/9');              // null
```

Keys are inferred from the pattern via the `PathParams<P>` type — `m.id` is a
compile-time-known `string`, `m.nope` is an error.

### `buildPath(pattern, params)`
The inverse: builds a concrete path, URI-encoding values. Every `:param` is
required and type-checked — a missing or extra key is a compile error.
Paramless patterns take no second argument.

```typescript
buildPath('/users/:id/posts/:postId', { id: '42', postId: '7' }); // '/users/42/posts/7'
buildPath('/about');                                              // '/about'
// buildPath('/users/:id', {})            → compile error (missing id)
```

## Router

### `route(pattern, handler)`
Defines one route. The handler's `ctx.params` is typed from the pattern:

```typescript
route('/users/:id', ({ params, signal }) => UserPage({ id: params.id }));
//                     params: { id: string }
```

Handler context (`RouteContext<P>`):
- `params` — typed path params (`PathParams<P>`)
- `query` — raw query params (`Record<string, string>`); for typed values,
  compose the codec layer: `parseQuery(schema, location.search)`
- `path` — the matched pathname
- `signal` — `AbortSignal` that fires when navigation moves away (cancel
  in-flight route loads)

The handler returns a view: a `ComponentHandle` (from `component`) or a `Node`.

### `createRouter(routes, options?)`
```typescript
import { createRouter, route, component, Tag, Attr } from '@doeixd/dom';

const Home = component(() => () => Tag.h1(Attr.innerText('Home')));
const User = component<{ id: string }>((_c, p) => () => Tag.h1(Attr.innerText(`User ${p.id}`)));

const router = createRouter([
  route('/',          () => Home()),
  route('/users/:id', ({ params }) => User({ id: params.id })),
  route('*',          () => Tag.h1(Attr.innerText('Not Found')))   // catch-all
]);

router.mount('#app');           // match current URL, start listening
router.navigate('/users/42');   // pushState + re-render
router.addEventListener('change', e => track((e as CustomEvent).detail.path));
```

**Behavior**
- On each navigation the previous route's view is destroyed (a `ComponentHandle`
  gets `.destroy()`, which aborts its `signal`), then the new view is mounted.
- Same-origin `<a href>` clicks are intercepted by default (modified clicks,
  `target`, external/hash/mailto links are ignored). Scope or disable via
  `options.links` (`false` | selector | element).
- Back/forward (`popstate`) is handled automatically.
- Each navigation gets a fresh `AbortSignal` (`ctx.signal`); navigating away
  aborts it — pairs naturally with `Http` request cancellation and
  `createQueue.preempt`.

**`Router` interface**
```typescript
interface Router {
  mount: (parent: Element | string) => Router;
  navigate: (path: string, mode?: 'push' | 'replace') => void;
  resolve: () => void;          // re-match current URL (e.g. after external change)
  readonly current: string;
  destroy: () => void;
  // EventTarget: fires 'change' (CustomEvent<{ path: string }>)
  addEventListener; removeEventListener; dispatchEvent;
}
```

### Typed query in routes
Query typing is intentionally decoupled from the router (query params are a
separate composable primitive). Use the `Query` codec layer inside a handler:

```typescript
import { parseQuery, Query } from '@doeixd/dom';

const tabs = { tab: Query.oneOf(['posts', 'likes'] as const, 'posts') };

route('/profile', ({ query }) => {
  const raw = query.tab;                        // string (raw)
  const { tab } = parseQuery(tabs, location.search); // 'posts' | 'likes' (typed + defaulted)
  return Profile({ tab });
});
```

## Notes & Limitations
- Flat routes only — no nested layouts or route-level data caches (compose
  components yourself). This stays a primitive: match → view → swap.
- Handlers run synchronously; for async data, kick off the fetch with
  `ctx.signal` and render a loading view, or `await` before constructing the
  component and mount when ready.
