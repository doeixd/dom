import { describe, it, expect, vi, afterEach } from 'vitest';
import { Http } from '../src/index';

const mockFetch = (response: Partial<Response> & { json?: () => Promise<any> }) => {
  const fn = vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: async () => ({}),
    text: async () => '',
    ...response
  } as unknown as Response));
  vi.stubGlobal('fetch', fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe('Http QUERY (RFC 10008)', () => {
  it('Http.query sends a QUERY request with a JSON body by default', async () => {
    const fetchSpy = mockFetch({ json: async () => [{ name: 'Alice' }] });
    const result = await Http.query('/api/contacts')({ where: { active: true } })();
    expect(result).toEqual([{ name: 'Alice' }]);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/contacts');
    expect(init.method).toBe('QUERY');
    expect(init.body).toBe(JSON.stringify({ where: { active: true } }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('Http.query sends string bodies as-is with an overridable content type', async () => {
    const fetchSpy = mockFetch({});
    await Http.query('/api/db')('SELECT name FROM contacts')({ 'Content-Type': 'application/sql' });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toBe('SELECT name FROM contacts');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/sql');
  });

  it('Http.query throws on non-ok responses', async () => {
    mockFetch({ ok: false, status: 422, statusText: 'Unprocessable' });
    await expect(Http.query('/api/db')({})()).rejects.toThrow('Http.query 422');
  });

  it('client .query() goes through the factory pipeline (baseURL, params, method)', async () => {
    const fetchSpy = mockFetch({
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ rows: [] })
    });
    const api = Http.create({ baseURL: 'https://api.example.com' });
    const res = await (api.query<{ rows: any[] }>('/search')({
      body: { term: 'x' },
      params: { limit: 5 }
    }) as Promise<import('../src/index').HttpResponse<{ rows: any[] }>>);
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ rows: [] });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.com/search?limit=5');
    expect(init.method).toBe('QUERY');
    expect(init.body).toBe(JSON.stringify({ term: 'x' }));
  });

  it('parseAcceptQuery extracts media types from Response, wrapper, or raw value', () => {
    expect(Http.parseAcceptQuery('application/jsonpath, application/sql')).toEqual([
      'application/jsonpath',
      'application/sql'
    ]);
    expect(Http.parseAcceptQuery('"application/sql"; charset=utf-8')).toEqual(['application/sql']);
    expect(Http.parseAcceptQuery(null)).toEqual([]);
    const res = new Response('', { headers: { 'Accept-Query': 'application/jsonpath' } });
    expect(Http.parseAcceptQuery(res)).toEqual(['application/jsonpath']);
    expect(Http.parseAcceptQuery(new Response(''))).toEqual([]);
  });
});
