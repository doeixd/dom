import { describe, it, expect, beforeEach } from 'vitest';
import {
  encodeQueryParams, Query, parseQuery, serializeQuery,
  matchPath, buildPath, createRouter, route, History,
  component, Tag, Attr
} from '../src/index';

describe('encodeQueryParams', () => {
  it('skips nullish/empty and expands arrays into repeated keys', () => {
    const qs = encodeQueryParams({ page: 2, q: '', tag: ['a', 'b'], off: null, on: true }).toString();
    expect(qs).toBe('page=2&tag=a&tag=b&on=true');
  });
});

describe('Query codecs', () => {
  it('parses typed values with defaults', () => {
    const schema = {
      page: Query.number(1),
      sort: Query.oneOf(['asc', 'desc'] as const, 'asc'),
      tags: Query.array(Query.string()),
      open: Query.boolean(false),
      q: Query.string('none')
    };
    const parsed = parseQuery(schema, '?page=3&sort=desc&tags=a&tags=b&open=true');
    expect(parsed).toEqual({ page: 3, sort: 'desc', tags: ['a', 'b'], open: true, q: 'none' });
    // Type-level: sort narrows to the literal union.
    const s: 'asc' | 'desc' = parsed.sort;
    expect(s).toBe('desc');
  });

  it('falls back on missing, invalid, or out-of-set values', () => {
    const schema = { page: Query.number(1), sort: Query.oneOf(['asc', 'desc'] as const, 'asc') };
    expect(parseQuery(schema, '')).toEqual({ page: 1, sort: 'asc' });
    expect(parseQuery(schema, '?page=abc&sort=sideways')).toEqual({ page: 1, sort: 'asc' });
  });

  it('parses numeric arrays', () => {
    const schema = { ids: Query.array(Query.number()) };
    expect(parseQuery(schema, '?ids=1&ids=2&ids=3')).toEqual({ ids: [1, 2, 3] });
  });

  it('round-trips symmetrically through serializeQuery', () => {
    const schema = {
      page: Query.number(1),
      sort: Query.oneOf(['asc', 'desc'] as const, 'asc'),
      tags: Query.array(Query.string()),
      open: Query.boolean(false)
    };
    const values = { page: 5, sort: 'desc' as const, tags: ['x', 'y'], open: true };
    const qs = encodeQueryParams(serializeQuery(schema, values)).toString();
    expect(parseQuery(schema, '?' + qs)).toEqual(values);
  });

  it('serializes booleans as a flag or omission', () => {
    const schema = { open: Query.boolean(false) };
    expect(serializeQuery(schema, { open: true })).toEqual({ open: 'true' });
    expect(serializeQuery(schema, { open: false })).toEqual({ open: null });
  });
});

describe('matchPath', () => {
  it('extracts named params (URI-decoded), typed by the pattern', () => {
    const m = matchPath('/users/:id/posts/:postId', '/users/42/posts/hello%20world');
    expect(m).toEqual({ id: '42', postId: 'hello world' });
    if (m) {
      const id: string = m.id;       // typed keys
      const post: string = m.postId;
      expect(id + post).toBeTruthy();
    }
  });

  it('returns null on mismatch and ignores the query string', () => {
    expect(matchPath('/users/:id', '/posts/42')).toBeNull();
    expect(matchPath('/users/:id', '/users/9?tab=x')).toEqual({ id: '9' });
  });

  it('supports trailing slash and wildcard', () => {
    expect(matchPath('/a/:b', '/a/x/')).toEqual({ b: 'x' });
    expect(matchPath('/files/*', '/files/deep/path.txt')).toEqual({ wildcard: 'deep/path.txt' });
  });
});

describe('buildPath', () => {
  it('fills and URI-encodes params', () => {
    expect(buildPath('/users/:id/posts/:postId', { id: '42', postId: 'a b' }))
      .toBe('/users/42/posts/a%20b');
  });

  it('needs no args for paramless patterns', () => {
    expect(buildPath('/about')).toBe('/about');
  });

  it('round-trips with matchPath', () => {
    const built = buildPath('/users/:id', { id: '7' });
    expect(matchPath('/users/:id', built)).toEqual({ id: '7' });
  });

  it('type-checks required params', () => {
    // @ts-expect-error — missing required param
    buildPath('/users/:id', {});
    // @ts-expect-error — unknown param key
    buildPath('/users/:id', { id: '1', extra: 'x' });
    // @ts-expect-error — paramless pattern takes no params arg
    buildPath('/about', { x: '1' });
    expect(buildPath('/users/:id', { id: '1' })).toBe('/users/1');
  });
});

describe('route() typed params', () => {
  it('infers params from the pattern in the handler', () => {
    route('/users/:id/posts/:postId', ({ params }) => {
      const id: string = params.id;         // typed
      const postId: string = params.postId; // typed
      // @ts-expect-error — no such param
      const nope = params.nope;
      return Tag.div(Attr.innerText(id + postId + String(nope)));
    });
    expect(true).toBe(true);
  });
});

describe('createRouter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState(null, '', '/');
  });

  const makeApp = () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.append(app);
    return app;
  };

  it('renders the matched route and swaps on navigate, passing typed params', () => {
    const app = makeApp();
    const seen: string[] = [];
    const router = createRouter([
      route('/', () => Tag.div(Attr.className('home'), Attr.innerText('Home'))),
      route('/users/:id', ({ params }) => { seen.push(params.id); return Tag.div(Attr.className('user'), Attr.innerText(`User ${params.id}`)); }),
      route('*', () => Tag.div(Attr.className('nf'), Attr.innerText('Not Found')))
    ]);
    router.mount(app);
    expect(app.querySelector('.home')).not.toBeNull();

    router.navigate('/users/42');
    expect(app.querySelector('.home')).toBeNull();
    expect(app.querySelector('.user')!.textContent).toBe('User 42');
    expect(seen).toEqual(['42']);

    router.navigate('/nowhere');
    expect(app.querySelector('.nf')).not.toBeNull();
    router.destroy();
  });

  it('fires a change event with the path', () => {
    const app = makeApp();
    const router = createRouter([route('/', () => Tag.div()), route('/x', () => Tag.div())]);
    const paths: string[] = [];
    router.addEventListener('change', e => paths.push((e as CustomEvent).detail.path));
    router.mount(app);
    router.navigate('/x');
    expect(paths).toEqual(['/', '/x']);
    router.destroy();
  });

  it('destroys the previous route ComponentHandle on navigation', () => {
    const app = makeApp();
    let destroyed = 0;
    const Tracked = component((ctx) => {
      ctx.signal.addEventListener('abort', () => destroyed++);
      return () => Tag.div(Attr.className('tracked'));
    });
    const router = createRouter([route('/', () => Tracked()), route('/next', () => Tag.div(Attr.className('next')))]);
    router.mount(app);
    expect(app.querySelector('.tracked')).not.toBeNull();
    router.navigate('/next');
    expect(destroyed).toBe(1);
    expect(app.querySelector('.tracked')).toBeNull();
    router.destroy();
  });

  it('aborts the route signal when navigating away', () => {
    const app = makeApp();
    let capturedSignal: AbortSignal | undefined;
    const router = createRouter([
      route('/', ({ signal }) => { capturedSignal = signal; return Tag.div(); }),
      route('/other', () => Tag.div())
    ]);
    router.mount(app);
    expect(capturedSignal!.aborted).toBe(false);
    router.navigate('/other');
    expect(capturedSignal!.aborted).toBe(true);
    router.destroy();
  });

  it('exposes raw query on ctx and composes with the codec layer for typed values', () => {
    const app = makeApp();
    const schema = { tab: Query.oneOf(['posts', 'likes'] as const, 'posts'), page: Query.number(1) };
    let rawTab: string | undefined;
    let typed: { tab: 'posts' | 'likes'; page: number } | undefined;
    const router = createRouter([
      route('/', ({ query }) => {
        rawTab = query.tab;                         // raw string
        typed = parseQuery(schema, location.search); // typed + defaulted
        return Tag.div();
      })
    ]);
    window.history.replaceState(null, '', '/?tab=likes');
    router.mount(app);
    expect(rawTab).toBe('likes');
    expect(typed).toEqual({ tab: 'likes', page: 1 });
    router.destroy();
  });

  it('intercepts same-origin link clicks', () => {
    const app = makeApp();
    const router = createRouter([
      route('/', () => Tag.a({ href: '/go', className: 'link' }, 'Go')),
      route('/go', () => Tag.div(Attr.className('arrived')))
    ]);
    router.mount(app);
    (app.querySelector('.link') as HTMLAnchorElement).click();
    expect(window.location.pathname).toBe('/go');
    expect(app.querySelector('.arrived')).not.toBeNull();
    router.destroy();
  });

  it('responds to popstate (back/forward)', () => {
    const app = makeApp();
    const router = createRouter([route('/', () => Tag.div(Attr.className('home'))), route('/x', () => Tag.div(Attr.className('x')))]);
    router.mount(app);
    router.navigate('/x');
    expect(app.querySelector('.x')).not.toBeNull();
    window.history.back();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(app.querySelector('.home')).not.toBeNull();
    router.destroy();
  });
});

describe('History.setQuery / readQuery schema', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('writes typed values through a schema and reads them back', () => {
    const schema = { page: Query.number(1), sort: Query.oneOf(['asc', 'desc'] as const, 'asc') };
    History.setQuery(schema, { page: 4, sort: 'desc' })();
    expect(window.location.search).toBe('?page=4&sort=desc');
    expect(History.readQuery(schema)).toEqual({ page: 4, sort: 'desc' });
  });

  it('legacy readQuery still returns raw strings', () => {
    window.history.replaceState(null, '', '/?a=1&b=hi');
    expect(History.readQuery<{ a: string; b: string }>()).toEqual({ a: '1', b: 'hi' });
  });
});
