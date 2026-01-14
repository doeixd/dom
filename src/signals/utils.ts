/**
 * @module reactive-control-flow
 * 
 * Control flow primitives for reactive views: For, Show, Switch, Resource, etc.
 * SolidJS-inspired patterns with linked signal flexibility.
 * 
 * @example
 * ```typescript
 * import { signal, For, Show, Switch, Match, resource } from '@doeixd/dom';
 * 
 * const items = signal([{ id: 1, name: 'Alice' }]);
 * const isLoading = signal(false);
 * const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
 * 
 * const view = div(
 *   Show(() => !isLoading.value, 
 *     For(() => items.value, 
 *       (item) => div(text(item.name)),
 *       (item) => item.id
 *     ),
 *     div(text('Loading...'))
 *   ),
 *   
 *   Switch(() => status.value,
 *     Match('idle', div(text('Ready'))),
 *     Match('loading', Spinner()),
 *     Match('success', SuccessMessage()),
 *     Match('error', ErrorMessage())
 *   )
 * );
 * ```
 */

import { computed, effect, signal } from './signals';
import type { 
  ReadonlySignal
} from './signals';

import type { ViewNode, Reactive } from './dom';

// ============================================
// Types
// ============================================


/** Resource state */
type ResourceState = 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored';

/** Resource options */
interface ResourceOptions<T, S = unknown> {
  /** Initial value before first load */
  initialValue?: T;
  /** Source signal that triggers refetch */
  source?: Reactive<S>;
  /** Skip fetching when source is falsy */
  lazy?: boolean;
  /** Custom fetch function */
  fetcher: (source: S, info: { value: T | undefined; refetching: boolean }) => Promise<T>;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Dedupe strategy */
  deferStream?: boolean;
  /** Storage for SSR */
  storage?: () => [() => T | undefined, (v: T) => void];
  /** Name for debugging */
  name?: string;
}

/** Resource return type */
interface Resource<T> {
  /** Current value (reactive) */
  (): T | undefined;
  /** Current value (reactive) */
  readonly value: T | undefined;
  /** Loading state */
  readonly loading: boolean;
  /** Error if any */
  readonly error: Error | undefined;
  /** Current state */
  readonly state: ResourceState;
  /** Latest resolved value (doesn't clear on refetch) */
  readonly latest: T | undefined;
  /** Refetch data */
  refetch: (info?: unknown) => Promise<T | undefined>;
  /** Mutate local data without refetch */
  mutate: (value: T | ((prev: T | undefined) => T)) => T;
}

/** Resource actions */
interface ResourceActions<T> {
  refetch: (info?: unknown) => Promise<T | undefined>;
  mutate: (value: T | ((prev: T | undefined) => T)) => T;
}

/** Async state for createAsync */
interface AsyncState<T> {
  readonly value: T | undefined;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly state: 'pending' | 'ready' | 'errored';
}

/** Pagination options */
interface PaginationOptions<T, S = unknown> {
  source?: Reactive<S>;
  fetcher: (page: number, source: S) => Promise<{ data: T[]; hasMore: boolean }>;
  initialPage?: number;
}

/** Paginated resource */
interface PaginatedResource<T> {
  readonly items: T[];
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly error: Error | undefined;
  readonly hasMore: boolean;
  readonly page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/** Infinite query options */
interface InfiniteQueryOptions<T, C = unknown> {
  fetcher: (cursor: C | undefined) => Promise<{ data: T[]; nextCursor: C | undefined }>;
  initialCursor?: C;
}

/** Infinite query result */
interface InfiniteQuery<T, C = unknown> {
  readonly items: T[];
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly error: Error | undefined;
  readonly hasMore: boolean;
  readonly cursor: C | undefined;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}


// ============================================
// Helpers
// ============================================

function unwrap<T>(reactive: Reactive<T>): T {
  if (reactive === null || reactive === undefined) {
    return reactive as T;
  }
  if (typeof reactive === 'object' && 'value' in reactive) {
    return (reactive as ReadonlySignal<T>).value;
  }
  if (typeof reactive === 'function') {
    return (reactive as () => T)();
  }
  return reactive;
}

function isReactive<T>(value: Reactive<T>): value is ReadonlySignal<T> | (() => T) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && 'value' in value) return true;
  if (typeof value === 'function') return true;
  return false;
}


// ============================================
// For - Keyed List Iteration
// ============================================

/**
 * Keyed list iteration - items are tracked by key, efficient updates.
 * 
 * When items move, their DOM nodes move with them (no re-render).
 * When items are added/removed, only those nodes change.
 * 
 * @param each - Reactive array of items
 * @param render - Render function for each item
 * @param keyFn - Key extraction function (defaults to index)
 * @returns View node
 * 
 * @example Basic Usage
 * ```typescript
 * const users = signal([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' }
 * ]);
 * 
 * const view = For(
 *   () => users.value,
 *   (user, index) => div(
 *     text(() => `${index() + 1}. ${user.name}`)
 *   ),
 *   (user) => user.id
 * );
 * ```
 * 
 * @example With Reactive Index
 * ```typescript
 * const items = signal(['a', 'b', 'c']);
 * 
 * For(
 *   () => items.value,
 *   (item, index) => li(
 *     // index() is reactive - updates when position changes
 *     cls({ first: () => index() === 0 }),
 *     text(() => `${index() + 1}: ${item}`)
 *   )
 * );
 * ```
 * 
 * @example Nested For
 * ```typescript
 * const grid = signal([
 *   [1, 2, 3],
 *   [4, 5, 6]
 * ]);
 * 
 * For(
 *   () => grid.value,
 *   (row, rowIdx) => div(
 *     cls({ row: true }),
 *     For(
 *       () => row,
 *       (cell, colIdx) => span(
 *         text(() => `[${rowIdx()},${colIdx()}]: ${cell}`)
 *       )
 *     )
 *   )
 * );
 * ```
 */
export interface ForView<T> {
  readonly nodeType: 'for';
  readonly each: Reactive<T[]>;
  readonly render: (item: T, index: () => number) => ViewNode;
  readonly keyFn: (item: T, index: number) => string | number;
  readonly fallback?: ViewNode;
}

export function For<T>(
  each: Reactive<T[]>,
  render: (item: T, index: () => number) => ViewNode,
  keyFn?: (item: T, index: number) => string | number
): ForView<T>;

export function For<T>(
  each: Reactive<T[]>,
  options: {
    render: (item: T, index: () => number) => ViewNode;
    key?: (item: T, index: number) => string | number;
    fallback?: ViewNode;
  }
): ForView<T>;

export function For<T>(
  each: Reactive<T[]>,
  renderOrOptions: 
    | ((item: T, index: () => number) => ViewNode)
    | { render: (item: T, index: () => number) => ViewNode; key?: (item: T, index: number) => string | number; fallback?: ViewNode },
  keyFn?: (item: T, index: number) => string | number
): ForView<T> {
  if (typeof renderOrOptions === 'function') {
    return {
      nodeType: 'for',
      each,
      render: renderOrOptions,
      keyFn: keyFn ?? ((_, i) => i)
    };
  }
  
  return {
    nodeType: 'for',
    each,
    render: renderOrOptions.render,
    keyFn: renderOrOptions.key ?? ((_, i) => i),
    fallback: renderOrOptions.fallback
  };
}


// ============================================
// Index - Non-Keyed List Iteration
// ============================================

/**
 * Non-keyed list iteration - items are tracked by index, not identity.
 * 
 * More efficient when items don't move, just change in place.
 * The item itself is a signal that updates when that index changes.
 * 
 * @param each - Reactive array of items
 * @param render - Render function receiving reactive item and index
 * @returns View node
 * 
 * @example
 * ```typescript
 * const names = signal(['Alice', 'Bob', 'Charlie']);
 * 
 * const view = Index(
 *   () => names.value,
 *   (name, index) => li(
 *     // name() is reactive - updates when names[index] changes
 *     text(() => `${index}: ${name()}`)
 *   )
 * );
 * 
 * // Updating names[1] just updates that item's signal, no DOM recreation
 * names.value = ['Alice', 'Robert', 'Charlie'];
 * ```
 * 
 * @example Grid of Cells
 * ```typescript
 * const cells = signal(Array(100).fill(false));
 * 
 * Index(
 *   () => cells.value,
 *   (active, index) => div(
 *     cls({ cell: true, active: () => active() }),
 *     on('click', () => {
 *       const newCells = [...cells.value];
 *       newCells[index] = !newCells[index];
 *       cells.value = newCells;
 *     })
 *   )
 * );
 * ```
 */
export interface IndexView<T> {
  readonly nodeType: 'index';
  readonly each: Reactive<T[]>;
  readonly render: (item: () => T, index: number) => ViewNode;
  readonly fallback?: ViewNode;
}

export function Index<T>(
  each: Reactive<T[]>,
  render: (item: () => T, index: number) => ViewNode,
  options?: { fallback?: ViewNode }
): IndexView<T> {
  return {
    nodeType: 'index',
    each,
    render,
    fallback: options?.fallback
  };
}


// ============================================
// Show - Conditional Rendering
// ============================================

/**
 * Conditional rendering - renders children when condition is truthy.
 * 
 * Unlike `when()`, Show provides the truthy value to the render function,
 * useful for narrowing types.
 * 
 * @param when - Condition (reactive)
 * @param children - Content to show, or function receiving truthy value
 * @param fallback - Optional content when falsy
 * @returns View node
 * 
 * @example Basic Show
 * ```typescript
 * const isVisible = signal(true);
 * 
 * Show(
 *   () => isVisible.value,
 *   div(text('Visible content')),
 *   div(text('Hidden - showing fallback'))
 * );
 * ```
 * 
 * @example With Type Narrowing
 * ```typescript
 * const user = signal<User | null>(null);
 * 
 * Show(
 *   () => user.value,
 *   (u) => div(
 *     // u is User, not User | null
 *     text(() => `Welcome, ${u.name}!`)
 *   ),
 *   div(text('Please log in'))
 * );
 * ```
 * 
 * @example Keyed Show (re-renders on key change)
 * ```typescript
 * const userId = signal(1);
 * 
 * Show(
 *   () => userId.value,
 *   (id) => UserProfile({ userId: id }),  // Re-mounts when id changes
 *   { keyed: true }
 * );
 * ```
 */
export interface ShowView<T> {
  readonly nodeType: 'show';
  readonly when: Reactive<T>;
  readonly children: ViewNode | ((value: NonNullable<T>) => ViewNode);
  readonly fallback?: ViewNode;
  readonly keyed?: boolean;
}

export function Show<T>(
  when: Reactive<T>,
  children: ViewNode | ((value: NonNullable<T>) => ViewNode),
  fallback?: ViewNode
): ShowView<T>;

export function Show<T>(
  when: Reactive<T>,
  children: ViewNode | ((value: NonNullable<T>) => ViewNode),
  options: { fallback?: ViewNode; keyed?: boolean }
): ShowView<T>;

export function Show<T>(
  when: Reactive<T>,
  children: ViewNode | ((value: NonNullable<T>) => ViewNode),
  fallbackOrOptions?: ViewNode | { fallback?: ViewNode; keyed?: boolean }
): ShowView<T> {
  if (fallbackOrOptions && typeof fallbackOrOptions === 'object' && ('fallback' in fallbackOrOptions || 'keyed' in fallbackOrOptions)) {
    return {
      nodeType: 'show',
      when,
      children,
      fallback: fallbackOrOptions.fallback,
      keyed: fallbackOrOptions.keyed
    };
  }
  
  return {
    nodeType: 'show',
    when,
    children,
    fallback: fallbackOrOptions as ViewNode | undefined
  };
}


// ============================================
// Switch / Match - Multi-Branch Conditional
// ============================================

/**
 * Match case for Switch.
 */
export interface MatchCase<T, V = T> {
  readonly value: V | ((val: T) => boolean);
  readonly render: ViewNode | ((val: T) => ViewNode);
}

/**
 * Create a match case for Switch.
 * 
 * @example
 * ```typescript
 * Match('loading', Spinner())
 * Match('error', (val) => ErrorMessage({ error: val }))
 * Match((v) => v > 100, 'Over 100!')
 * ```
 */
export function Match<T, V = T>(
  value: V | ((val: T) => boolean),
  render: ViewNode | ((val: T) => ViewNode)
): MatchCase<T, V> {
  return { value, render };
}

/**
 * Multi-branch conditional rendering.
 * 
 * @param value - Value to switch on (reactive)
 * @param cases - Match cases
 * @returns View node
 * 
 * @example Basic Switch
 * ```typescript
 * const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
 * 
 * Switch(
 *   () => status.value,
 *   Match('idle', div(text('Ready to start'))),
 *   Match('loading', Spinner()),
 *   Match('success', SuccessMessage()),
 *   Match('error', ErrorMessage())
 * );
 * ```
 * 
 * @example With Predicate Matching
 * ```typescript
 * const count = signal(0);
 * 
 * Switch(
 *   () => count.value,
 *   Match((n) => n < 0, div(text('Negative'))),
 *   Match(0, div(text('Zero'))),
 *   Match((n) => n > 100, div(text('Over 100!'))),
 *   Match(() => true, (n) => div(text(`Count: ${n}`))) // Default
 * );
 * ```
 * 
 * @example With Fallback
 * ```typescript
 * Switch(
 *   () => status.value,
 *   Match('known', KnownContent()),
 *   { fallback: div(text('Unknown status')) }
 * );
 * ```
 */
export interface SwitchView<T> {
  readonly nodeType: 'switch';
  readonly value: Reactive<T>;
  readonly cases: MatchCase<T, any>[];
  readonly fallback?: ViewNode;
}

export function Switch<T>(
  value: Reactive<T>,
  ...casesAndOptions: (MatchCase<T, any> | { fallback?: ViewNode })[]
): SwitchView<T> {
  const cases: MatchCase<T, any>[] = [];
  let fallback: ViewNode | undefined;
  
  for (const item of casesAndOptions) {
    if ('value' in item && 'render' in item) {
      cases.push(item);
    } else if ('fallback' in item) {
      fallback = item.fallback;
    }
  }
  
  return {
    nodeType: 'switch',
    value,
    cases,
    fallback
  };
}


// ============================================
// Dynamic - Dynamic Component Rendering
// ============================================

/**
 * Render a dynamic component based on a reactive value.
 * 
 * @param component - Reactive component reference
 * @param props - Props to pass (reactive)
 * @returns View node
 * 
 * @example
 * ```typescript
 * const currentView = signal<'home' | 'about' | 'contact'>('home');
 * 
 * const views = {
 *   home: HomeView,
 *   about: AboutView,
 *   contact: ContactView
 * };
 * 
 * Dynamic(
 *   () => views[currentView.value],
 *   () => ({ user: currentUser.value })
 * );
 * ```
 * 
 * @example With Component Map
 * ```typescript
 * const componentMap = {
 *   text: TextInput,
 *   number: NumberInput,
 *   select: SelectInput
 * };
 * 
 * For(
 *   () => fields.value,
 *   (field) => Dynamic(
 *     () => componentMap[field.type],
 *     () => ({ name: field.name, value: field.value })
 *   )
 * );
 * ```
 */
export interface DynamicView<P extends object = {}> {
  readonly nodeType: 'dynamic';
  readonly component: Reactive<((props: P) => ViewNode) | null | undefined>;
  readonly props: Reactive<P>;
}

export function Dynamic<P extends object = {}>(
  component: Reactive<((props: P) => ViewNode) | null | undefined>,
  props?: Reactive<P>
): DynamicView<P> {
  return {
    nodeType: 'dynamic',
    component,
    props: props ?? (() => ({} as P))
  };
}


// ============================================
// Portal - Render Elsewhere
// ============================================

/**
 * Render children into a different DOM location.
 * 
 * @param target - Target element or selector
 * @param children - Children to render
 * @param options - Portal options
 * @returns View node
 * 
 * @example Modal
 * ```typescript
 * const showModal = signal(false);
 * 
 * Show(
 *   () => showModal.value,
 *   Portal(
 *     document.body,
 *     div(
 *       cls({ modal: true, overlay: true }),
 *       ModalContent(),
 *       button(on('click', () => showModal.value = false), text('Close'))
 *     )
 *   )
 * );
 * ```
 * 
 * @example Tooltip at Custom Location
 * ```typescript
 * Portal(
 *   '#tooltip-container',
 *   div(
 *     cls({ tooltip: true }),
 *     style({ left: () => `${x.value}px`, top: () => `${y.value}px` }),
 *     text(() => tooltipText.value)
 *   ),
 *   { mount: 'prepend' }
 * );
 * ```
 */
export interface PortalView {
  readonly nodeType: 'portal';
  readonly target: Element | string;
  readonly children: ViewNode[];
  readonly mount?: 'append' | 'prepend' | 'replace';
  readonly isSVG?: boolean;
}

export function Portal(
  target: Element | string,
  ...children: (ViewNode | { mount?: 'append' | 'prepend' | 'replace'; isSVG?: boolean })[]
): PortalView {
  const nodes: ViewNode[] = [];
  let options: { mount?: 'append' | 'prepend' | 'replace'; isSVG?: boolean } = {};
  
  for (const child of children) {
    if (child && typeof child === 'object' && ('mount' in child || 'isSVG' in child)) {
      options = child;
    } else {
      nodes.push(child as ViewNode);
    }
  }
  
  return {
    nodeType: 'portal',
    target,
    children: nodes,
    ...options
  };
}


// ============================================
// ErrorBoundary - Error Catching
// ============================================

/**
 * Catch errors in children and render fallback.
 * 
 * @param children - Children to wrap
 * @param fallback - Fallback to render on error
 * @returns View node
 * 
 * @example
 * ```typescript
 * ErrorBoundary(
 *   RiskyComponent(),
 *   (error, reset) => div(
 *     cls({ error: true }),
 *     text(() => `Error: ${error.message}`),
 *     button(on('click', reset), text('Try Again'))
 *   )
 * );
 * ```
 */
export interface ErrorBoundaryView {
  readonly nodeType: 'errorBoundary';
  readonly children: ViewNode;
  readonly fallback: (error: Error, reset: () => void) => ViewNode;
}

export function ErrorBoundary(
  children: ViewNode,
  fallback: (error: Error, reset: () => void) => ViewNode
): ErrorBoundaryView {
  return {
    nodeType: 'errorBoundary',
    children,
    fallback
  };
}


// ============================================
// Suspense - Loading Boundaries
// ============================================

/**
 * Show fallback while children are loading (async/resources).
 * 
 * @param children - Children (may contain resources)
 * @param fallback - Loading fallback
 * @returns View node
 * 
 * @example
 * ```typescript
 * const userData = resource(() => fetchUser(userId.value));
 * 
 * Suspense(
 *   div(
 *     text(() => `Hello, ${userData()?.name ?? 'Guest'}`)
 *   ),
 *   Spinner()
 * );
 * ```
 */
export interface SuspenseView {
  readonly nodeType: 'suspense';
  readonly children: ViewNode;
  readonly fallback: ViewNode;
}

export function Suspense(
  children: ViewNode,
  fallback: ViewNode
): SuspenseView {
  return {
    nodeType: 'suspense',
    children,
    fallback
  };
}


// ============================================
// Resource - Async Data Fetching
// ============================================

/**
 * Create a resource for async data fetching with loading/error states.
 * 
 * Resources automatically track loading, cache results, and handle errors.
 * They integrate with Suspense for loading states.
 * 
 * @param fetcher - Async function to fetch data
 * @param options - Resource options
 * @returns Resource with value, loading, error states
 * 
 * @example Basic Resource
 * ```typescript
 * const users = resource(() => fetch('/api/users').then(r => r.json()));
 * 
 * // In view:
 * Show(
 *   () => !users.loading,
 *   For(
 *     () => users() ?? [],
 *     (user) => div(text(user.name))
 *   ),
 *   Spinner()
 * );
 * 
 * Show(
 *   () => users.error,
 *   (err) => div(text(`Error: ${err.message}`))
 * );
 * ```
 * 
 * @example With Source Signal
 * ```typescript
 * const userId = signal(1);
 * 
 * const user = resource({
 *   source: () => userId.value,
 *   fetcher: (id) => fetch(`/api/users/${id}`).then(r => r.json())
 * });
 * 
 * // Automatically refetches when userId changes
 * userId.value = 2;
 * ```
 * 
 * @example With Initial Value
 * ```typescript
 * const config = resource({
 *   fetcher: () => fetchConfig(),
 *   initialValue: { theme: 'light', lang: 'en' }
 * });
 * 
 * // Safe to use immediately, no need for nullish checks
 * console.log(config().theme);
 * ```
 * 
 * @example Mutations
 * ```typescript
 * const todos = resource(() => fetchTodos());
 * 
 * async function addTodo(text: string) {
 *   const newTodo = await createTodo(text);
 *   // Optimistic update
 *   todos.mutate(prev => [...(prev ?? []), newTodo]);
 * }
 * 
 * async function refresh() {
 *   await todos.refetch();
 * }
 * ```
 */
export function resource<T>(
  fetcher: () => Promise<T>
): Resource<T>;

export function resource<T, S>(
  options: ResourceOptions<T, S>
): Resource<T>;

export function resource<T, S = undefined>(
  fetcherOrOptions: (() => Promise<T>) | ResourceOptions<T, S>
): Resource<T> {
  const options: ResourceOptions<T, S> = typeof fetcherOrOptions === 'function'
    ? { fetcher: fetcherOrOptions as any }
    : fetcherOrOptions;
  
  const state = signal<ResourceState>('unresolved');
  const value = signal<T | undefined>(options.initialValue);
  const error = signal<Error | undefined>(undefined);
  const latest = signal<T | undefined>(options.initialValue);
  
  let abortController: AbortController | null = null;
  let fetchId = 0;
  
  const load = async (refetching = false): Promise<T | undefined> => {
    // Cancel previous request
    abortController?.abort();
    abortController = new AbortController();
    
    const currentFetchId = ++fetchId;
    const sourceValue = options.source ? unwrap(options.source) : undefined;
    
    // Skip if lazy and source is falsy
    if (options.lazy && !sourceValue && options.source) {
      return value.peek();
    }
    
    state.value = refetching ? 'refreshing' : 'pending';
    error.value = undefined;
    
    try {
      const result = await options.fetcher(sourceValue as S, {
        value: value.peek(),
        refetching
      });
      
      // Check if this is still the current request
      if (currentFetchId !== fetchId) return undefined;
      
      value.value = result;
      latest.value = result;
      state.value = 'ready';
      
      return result;
    } catch (err) {
      if (currentFetchId !== fetchId) return undefined;
      
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      state.value = 'errored';
      options.onError?.(e);
      
      return undefined;
    }
  };
  
  // Initial load
  if (!options.lazy || (options.source && unwrap(options.source))) {
    load();
  }
  
  // React to source changes
  if (options.source && isReactive(options.source)) {
    effect(() => {
      const sourceValue = unwrap(options.source!);
      if (!options.lazy || sourceValue) {
        load(state.peek() === 'ready');
      }
    });
  }
  
  const loading = computed(() => 
    state.value === 'pending' || state.value === 'refreshing'
  );
  
  // Create resource object
  const resourceFn = (() => value.value) as Resource<T>;
  
  Object.defineProperties(resourceFn, {
    value: { get: () => value.value },
    loading: { get: () => loading.value },
    error: { get: () => error.value },
    state: { get: () => state.value },
    latest: { get: () => latest.value }
  });
  
  resourceFn.refetch = (_info?: unknown) => load(true);
  
  resourceFn.mutate = (newValue: T | ((prev: T | undefined) => T)) => {
    const result = typeof newValue === 'function'
      ? (newValue as (prev: T | undefined) => T)(value.peek())
      : newValue;
    
    value.value = result;
    latest.value = result;
    return result;
  };
  
  return resourceFn;
}


// ============================================
// createAsync - Simpler Async State
// ============================================

/**
 * Simple async state without automatic source tracking.
 * 
 * @param fn - Async function
 * @param options - Options
 * @returns Async state
 * 
 * @example
 * ```typescript
 * const data = createAsync(() => fetchData());
 * 
 * Show(
 *   () => data.state === 'ready',
 *   div(text(() => data.value?.name)),
 *   Spinner()
 * );
 * ```
 */
export function createAsync<T>(
  fn: () => Promise<T>,
  options?: { initialValue?: T }
): AsyncState<T> & { refetch: () => Promise<void> } {
  const value = signal<T | undefined>(options?.initialValue);
  const error = signal<Error | undefined>(undefined);
  const state = signal<'pending' | 'ready' | 'errored'>('pending');
  
  const load = async () => {
    state.value = 'pending';
    error.value = undefined;
    
    try {
      value.value = await fn();
      state.value = 'ready';
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      state.value = 'errored';
    }
  };
  
  load();
  
  return {
    get value() { return value.value; },
    get loading() { return state.value === 'pending'; },
    get error() { return error.value; },
    get state() { return state.value; },
    refetch: load
  };
}


// ============================================
// Paginated Resource
// ============================================

/**
 * Resource with pagination support.
 * 
 * @example
 * ```typescript
 * const users = paginated({
 *   fetcher: (page) => fetchUsers({ page, limit: 20 })
 * });
 * 
 * // In view:
 * For(
 *   () => users.items,
 *   (user) => UserCard(user)
 * );
 * 
 * Show(
 *   () => users.hasMore && !users.loadingMore,
 *   button(on('click', users.loadMore), text('Load More'))
 * );
 * ```
 */
export function paginated<T, S = undefined>(
  options: PaginationOptions<T, S>
): PaginatedResource<T> {
  const items = signal<T[]>([]);
  const page = signal(options.initialPage ?? 1);
  const hasMore = signal(true);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal<Error | undefined>(undefined);
  
  const load = async (loadMore = false) => {
    if (loadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      page.value = options.initialPage ?? 1;
    }
    
    error.value = undefined;
    
    try {
      const sourceValue = options.source ? unwrap(options.source) : undefined;
      const result = await options.fetcher(page.value, sourceValue as S);
      
      if (loadMore) {
        items.value = [...items.value, ...result.data];
      } else {
        items.value = result.data;
      }
      
      hasMore.value = result.hasMore;
      page.value++;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };
  
  // Initial load
  load();
  
  return {
    get items() { return items.value; },
    get loading() { return loading.value; },
    get loadingMore() { return loadingMore.value; },
    get error() { return error.value; },
    get hasMore() { return hasMore.value; },
    get page() { return page.value; },
    loadMore: () => load(true),
    refresh: () => load(false),
    reset: () => {
      items.value = [];
      page.value = options.initialPage ?? 1;
      hasMore.value = true;
      load();
    }
  };
}


// ============================================
// Infinite Query
// ============================================

/**
 * Cursor-based infinite loading.
 * 
 * @example
 * ```typescript
 * const feed = infinite({
 *   fetcher: async (cursor) => {
 *     const res = await fetch(`/api/feed?cursor=${cursor ?? ''}`);
 *     const data = await res.json();
 *     return { data: data.posts, nextCursor: data.nextCursor };
 *   }
 * });
 * 
 * // In view:
 * For(
 *   () => feed.items,
 *   (post) => PostCard(post)
 * );
 * 
 * Show(
 *   () => feed.hasMore,
 *   button(on('click', feed.loadMore), text('Load More'))
 * );
 * ```
 */
export function infinite<T, C = string>(
  options: InfiniteQueryOptions<T, C>
): InfiniteQuery<T, C> {
  const items = signal<T[]>([]);
  const cursor = signal<C | undefined>(options.initialCursor);
  const hasMore = signal(true);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal<Error | undefined>(undefined);
  
  const load = async (loadMore = false) => {
    if (loadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      cursor.value = options.initialCursor;
    }
    
    error.value = undefined;
    
    try {
      const result = await options.fetcher(loadMore ? cursor.value : options.initialCursor);
      
      if (loadMore) {
        items.value = [...items.value, ...result.data];
      } else {
        items.value = result.data;
      }
      
      cursor.value = result.nextCursor;
      hasMore.value = result.nextCursor !== undefined;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };
  
  load();
  
  return {
    get items() { return items.value; },
    get loading() { return loading.value; },
    get loadingMore() { return loadingMore.value; },
    get error() { return error.value; },
    get hasMore() { return hasMore.value; },
    get cursor() { return cursor.value; },
    loadMore: () => load(true),
    refresh: () => load(false)
  };
}


// ============================================
// Lazy - Code Splitting
// ============================================

/**
 * Lazy load a component.
 * 
 * @example
 * ```typescript
 * const HeavyChart = lazy(() => import('./HeavyChart'));
 * 
 * // In view:
 * Suspense(
 *   HeavyChart({ data: chartData }),
 *   Spinner()
 * );
 * ```
 */
export interface LazyComponent<P extends object> {
  (props: P): ViewNode;
  preload: () => Promise<void>;
}

export function lazy<P extends object>(
  loader: () => Promise<{ default: (props: P) => ViewNode }>
): LazyComponent<P> {
  let Component: ((props: P) => ViewNode) | null = null;
  let promise: Promise<void> | null = null;
  
  const load = () => {
    if (!promise) {
      promise = loader().then(mod => {
        Component = mod.default;
      });
    }
    return promise;
  };
  
  const LazyComponent = ((props: P) => {
    if (Component) {
      return Component(props);
    }
    
    // Trigger Suspense
    throw load();
  }) as LazyComponent<P>;
  
  LazyComponent.preload = load;
  
  return LazyComponent;
}


// ============================================
// Memo - Memoized Components
// ============================================

/**
 * Memoize a component to prevent re-renders.
 * 
 * @example
 * ```typescript
 * const ExpensiveList = memo(
 *   (props: { items: Item[] }) => {
 *     return For(
 *       () => props.items,
 *       (item) => ExpensiveItem(item)
 *     );
 *   },
 *   (prev, next) => prev.items === next.items
 * );
 * ```
 */
export function memo<P extends object>(
  component: (props: P) => ViewNode,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): (props: Reactive<P>) => ViewNode {
  const equals = areEqual ?? ((a, b) => {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => (a as any)[key] === (b as any)[key]);
  });
  
  let lastProps: P | null = null;
  let lastResult: ViewNode = null;
  
  return (props: Reactive<P>) => {
    const currentProps = unwrap(props);
    
    if (lastProps && equals(lastProps, currentProps)) {
      return lastResult;
    }
    
    lastProps = currentProps;
    lastResult = component(currentProps);
    return lastResult;
  };
}


// ============================================
// Repeat - Simple Repetition
// ============================================

/**
 * Repeat a node n times.
 * 
 * @example
 * ```typescript
 * const stars = signal(5);
 * 
 * Repeat(
 *   () => stars.value,
 *   (i) => span(cls({ star: true }), text('★'))
 * );
 * ```
 */
export interface RepeatView {
  readonly nodeType: 'repeat';
  readonly count: Reactive<number>;
  readonly render: (index: number) => ViewNode;
}

export function Repeat(
  count: Reactive<number>,
  render: (index: number) => ViewNode
): RepeatView {
  return {
    nodeType: 'repeat',
    count,
    render
  };
}


// ============================================
// Await - Promise Resolution
// ============================================

/**
 * Render based on promise resolution.
 * 
 * @example
 * ```typescript
 * const dataPromise = signal(fetchData());
 * 
 * Await(
 *   () => dataPromise.value,
 *   {
 *     pending: Spinner(),
 *     resolved: (data) => DataView({ data }),
 *     rejected: (error) => ErrorView({ error })
 *   }
 * );
 * ```
 */
export interface AwaitView<T> {
  readonly nodeType: 'await';
  readonly promise: Reactive<Promise<T>>;
  readonly pending?: ViewNode;
  readonly resolved: (value: T) => ViewNode;
  readonly rejected?: (error: Error) => ViewNode;
}

export function Await<T>(
  promise: Reactive<Promise<T>>,
  handlers: {
    pending?: ViewNode;
    resolved: (value: T) => ViewNode;
    rejected?: (error: Error) => ViewNode;
  }
): AwaitView<T> {
  return {
    nodeType: 'await',
    promise,
    ...handlers
  };
}


// ============================================
// Range - Numeric Range Iteration
// ============================================

/**
 * Iterate over a numeric range.
 * 
 * @example
 * ```typescript
 * // 0 to 9
 * Range(10, (i) => div(text(String(i))));
 * 
 * // 1 to 10
 * Range({ start: 1, end: 11 }, (i) => div(text(String(i))));
 * 
 * // Reactive range
 * const size = signal(5);
 * Range(() => size.value, (i) => Cell({ index: i }));
 * ```
 */
export interface RangeView {
  readonly nodeType: 'range';
  readonly start: Reactive<number>;
  readonly end: Reactive<number>;
  readonly step: number;
  readonly render: (index: number) => ViewNode;
}

export function Range(
  endOrOptions: Reactive<number> | { start?: Reactive<number>; end: Reactive<number>; step?: number },
  render: (index: number) => ViewNode
): RangeView {
  if (typeof endOrOptions === 'number' || typeof endOrOptions === 'function' || (typeof endOrOptions === 'object' && 'value' in endOrOptions)) {
    return {
      nodeType: 'range',
      start: 0,
      end: endOrOptions as Reactive<number>,
      step: 1,
      render
    };
  }
  
  return {
    nodeType: 'range',
    start: endOrOptions.start ?? 0,
    end: endOrOptions.end,
    step: endOrOptions.step ?? 1,
    render
  };
}


// ============================================
// Entries / Keys / Values - Object Iteration
// ============================================

/**
 * Iterate over object entries.
 * 
 * @example
 * ```typescript
 * const config = signal({ theme: 'dark', lang: 'en' });
 * 
 * Entries(
 *   () => config.value,
 *   ([key, value]) => div(
 *     text(() => `${key}: ${value}`)
 *   )
 * );
 * ```
 */
export interface EntriesView<T extends object> {
  readonly nodeType: 'entries';
  readonly object: Reactive<T>;
  readonly render: (entry: [keyof T, T[keyof T]], index: number) => ViewNode;
}

export function Entries<T extends object>(
  object: Reactive<T>,
  render: (entry: [keyof T, T[keyof T]], index: number) => ViewNode
): EntriesView<T> {
  return {
    nodeType: 'entries',
    object,
    render
  };
}

/**
 * Iterate over object keys.
 */
export function Keys<T extends object>(
  object: Reactive<T>,
  render: (key: keyof T, index: number) => ViewNode
): EntriesView<T> {
  return {
    nodeType: 'entries',
    object,
    render: ([key]: [keyof T, any], index: number) => render(key, index)
  } as EntriesView<T>;
}

/**
 * Iterate over object values.
 */
export function Values<T extends object>(
  object: Reactive<T>,
  render: (value: T[keyof T], index: number) => ViewNode
): EntriesView<T> {
  return {
    nodeType: 'entries',
    object,
    render: ([, value]: [any, T[keyof T]], index: number) => render(value, index)
  } as EntriesView<T>;
}


// ============================================
// Type Exports
// ============================================

export type {
  ResourceState,
  ResourceOptions,
  Resource,
  ResourceActions,
  AsyncState,
  PaginationOptions,
  PaginatedResource,
  InfiniteQueryOptions,
  InfiniteQuery,
};