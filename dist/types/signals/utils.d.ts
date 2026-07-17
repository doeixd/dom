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
import type { ViewNode, Reactive } from './dom';
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
    fetcher: (source: S, info: {
        value: T | undefined;
        refetching: boolean;
    }) => Promise<T>;
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
    fetcher: (page: number, source: S) => Promise<{
        data: T[];
        hasMore: boolean;
    }>;
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
    fetcher: (cursor: C | undefined) => Promise<{
        data: T[];
        nextCursor: C | undefined;
    }>;
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
export declare function For<T>(each: Reactive<T[]>, render: (item: T, index: () => number) => ViewNode, keyFn?: (item: T, index: number) => string | number): ForView<T>;
export declare function For<T>(each: Reactive<T[]>, options: {
    render: (item: T, index: () => number) => ViewNode;
    key?: (item: T, index: number) => string | number;
    fallback?: ViewNode;
}): ForView<T>;
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
export declare function Index<T>(each: Reactive<T[]>, render: (item: () => T, index: number) => ViewNode, options?: {
    fallback?: ViewNode;
}): IndexView<T>;
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
export declare function Show<T>(when: Reactive<T>, children: ViewNode | ((value: NonNullable<T>) => ViewNode), fallback?: ViewNode): ShowView<T>;
export declare function Show<T>(when: Reactive<T>, children: ViewNode | ((value: NonNullable<T>) => ViewNode), options: {
    fallback?: ViewNode;
    keyed?: boolean;
}): ShowView<T>;
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
export declare function Match<T, V = T>(value: V | ((val: T) => boolean), render: ViewNode | ((val: T) => ViewNode)): MatchCase<T, V>;
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
export declare function Switch<T>(value: Reactive<T>, ...casesAndOptions: (MatchCase<T, any> | {
    fallback?: ViewNode;
})[]): SwitchView<T>;
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
export declare function Dynamic<P extends object = {}>(component: Reactive<((props: P) => ViewNode) | null | undefined>, props?: Reactive<P>): DynamicView<P>;
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
export declare function Portal(target: Element | string, ...children: (ViewNode | {
    mount?: 'append' | 'prepend' | 'replace';
    isSVG?: boolean;
})[]): PortalView;
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
export declare function ErrorBoundary(children: ViewNode, fallback: (error: Error, reset: () => void) => ViewNode): ErrorBoundaryView;
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
export declare function Suspense(children: ViewNode, fallback: ViewNode): SuspenseView;
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
export declare function resource<T>(fetcher: () => Promise<T>): Resource<T>;
export declare function resource<T, S>(options: ResourceOptions<T, S>): Resource<T>;
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
export declare function createAsync<T>(fn: () => Promise<T>, options?: {
    initialValue?: T;
}): AsyncState<T> & {
    refetch: () => Promise<void>;
};
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
export declare function paginated<T, S = undefined>(options: PaginationOptions<T, S>): PaginatedResource<T>;
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
export declare function infinite<T, C = string>(options: InfiniteQueryOptions<T, C>): InfiniteQuery<T, C>;
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
export declare function lazy<P extends object>(loader: () => Promise<{
    default: (props: P) => ViewNode;
}>): LazyComponent<P>;
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
export declare function memo<P extends object>(component: (props: P) => ViewNode, areEqual?: (prevProps: P, nextProps: P) => boolean): (props: Reactive<P>) => ViewNode;
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
export declare function Repeat(count: Reactive<number>, render: (index: number) => ViewNode): RepeatView;
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
export declare function Await<T>(promise: Reactive<Promise<T>>, handlers: {
    pending?: ViewNode;
    resolved: (value: T) => ViewNode;
    rejected?: (error: Error) => ViewNode;
}): AwaitView<T>;
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
export declare function Range(endOrOptions: Reactive<number> | {
    start?: Reactive<number>;
    end: Reactive<number>;
    step?: number;
}, render: (index: number) => ViewNode): RangeView;
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
export declare function Entries<T extends object>(object: Reactive<T>, render: (entry: [keyof T, T[keyof T]], index: number) => ViewNode): EntriesView<T>;
/**
 * Iterate over object keys.
 */
export declare function Keys<T extends object>(object: Reactive<T>, render: (key: keyof T, index: number) => ViewNode): EntriesView<T>;
/**
 * Iterate over object values.
 */
export declare function Values<T extends object>(object: Reactive<T>, render: (value: T[keyof T], index: number) => ViewNode): EntriesView<T>;
export type { ResourceState, ResourceOptions, Resource, ResourceActions, AsyncState, PaginationOptions, PaginatedResource, InfiniteQueryOptions, InfiniteQuery, };
//# sourceMappingURL=utils.d.ts.map