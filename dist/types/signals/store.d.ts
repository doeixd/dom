/**
 * @module store
 *
 * Reactive store for objects with path-based access and partial updates.
 * Integrates with signals, computed, and effects.
 *
 * @example Basic Usage
 * ```typescript
 * import { store, effect } from '@doeixd/dom';
 *
 * const state = store({
 *   user: { name: 'Alice', age: 30 },
 *   settings: { theme: 'dark' }
 * });
 *
 * effect(() => {
 *   console.log(`Hello, ${state.value.user.name}`);
 * });
 *
 * state.set('user.name', 'Bob'); // Effect runs
 * ```
 */
import type { Unsubscribe, ReadonlySignal, SignalOptions } from './signals';
/** Deep partial type */
type DeepPartial<T> = T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;
/** Path type for nested access */
type Path = string | readonly (string | number)[];
/** Get type at path */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}` ? K extends keyof T ? PathValue<T[K], Rest> : never : P extends keyof T ? T[P] : never;
/** Store change event */
interface StoreChange<T> {
    /** Full path that changed */
    path: string[];
    /** Previous value at path */
    prev: unknown;
    /** New value at path */
    next: unknown;
    /** Full previous state */
    prevState: T;
    /** Full new state */
    nextState: T;
}
/** Store options */
interface StoreOptions<T> extends SignalOptions<T> {
    /** Deep clone values on get. Default: `false` */
    immutable?: boolean;
    /** Custom merge function for partial updates */
    merge?: (target: T, source: DeepPartial<T>) => T;
}
/** Selector function */
type Selector<T, R> = (state: T) => R;
/** Store subscription callback */
type StoreCallback<T> = (state: T, change: StoreChange<T>) => void;
/** Path subscription callback */
type PathCallback<V> = (value: V, prev: V | undefined) => void;
/** Writable store interface */
interface WritableStore<T extends object> {
    /** Current state (reactive read) */
    readonly value: T;
    /** Previous state */
    readonly prev: T | undefined;
    /** Get value at path */
    get<P extends string>(path: P): PathValue<T, P>;
    get<V>(path: Path): V;
    /** Set entire state */
    set(value: T): void;
    /** Partial update (shallow merge) */
    set(partial: DeepPartial<T>): void;
    /** Set value at path */
    set<P extends string>(path: P, value: PathValue<T, P>): void;
    set(path: Path, value: unknown): void;
    /** Update state using function */
    update(fn: (current: T) => T): void;
    /** Update value at path using function */
    update<P extends string>(path: P, fn: (current: PathValue<T, P>) => PathValue<T, P>): void;
    update(path: Path, fn: (current: unknown) => unknown): void;
    /** Merge partial state (deep merge) */
    merge(partial: DeepPartial<T>): void;
    /** Reset to initial state */
    reset(): void;
    /** Reset specific path to initial value */
    reset(path: Path): void;
    /** Subscribe to all changes */
    subscribe(callback: StoreCallback<T>): Unsubscribe;
    /** Subscribe to specific path */
    subscribe<P extends string>(path: P, callback: PathCallback<PathValue<T, P>>): Unsubscribe;
    subscribe(path: Path, callback: PathCallback<unknown>): Unsubscribe;
    /** Create computed selector */
    select<R>(selector: Selector<T, R>): ReadonlySignal<R>;
    /** Run effect when store changes */
    effect(fn: (state: T) => void | Unsubscribe): Unsubscribe;
    /** Run effect when path changes */
    effect<P extends string>(path: P, fn: (value: PathValue<T, P>) => void | Unsubscribe): Unsubscribe;
    /** Read without tracking */
    peek(): T;
    peek<P extends string>(path: P): PathValue<T, P>;
    peek(path: Path): unknown;
    /** Batch multiple updates */
    batch(fn: () => void): void;
    /** Create a readonly view */
    readonly: ReadonlyStore<T>;
    /** Store brand for type guards */
    readonly [STORE_BRAND]: true;
}
/** Read-only store interface */
interface ReadonlyStore<T extends object> {
    readonly value: T;
    get<P extends string>(path: P): PathValue<T, P>;
    get<V>(path: Path): V;
    subscribe(callback: StoreCallback<T>): Unsubscribe;
    subscribe<P extends string>(path: P, callback: PathCallback<PathValue<T, P>>): Unsubscribe;
    select<R>(selector: Selector<T, R>): ReadonlySignal<R>;
    effect(fn: (state: T) => void | Unsubscribe): Unsubscribe;
    peek(): T;
    peek(path: Path): unknown;
    readonly [STORE_BRAND]: true;
}
declare const STORE_BRAND: unique symbol;
/**
 * Creates a reactive store for managing complex state objects.
 *
 * Stores provide path-based access, partial updates, and fine-grained
 * subscriptions. They integrate with signals and effects.
 *
 * @param initial - Initial state object
 * @param options - Store options
 * @returns A writable store
 *
 * @example Basic Usage
 * ```typescript
 * const state = store({
 *   count: 0,
 *   user: { name: 'Alice', email: 'alice@example.com' }
 * });
 *
 * // Read
 * console.log(state.value.count); // 0
 * console.log(state.get('user.name')); // 'Alice'
 *
 * // Write
 * state.set({ count: 1 }); // Partial update
 * state.set('user.name', 'Bob'); // Path update
 * ```
 *
 * @example Subscriptions
 * ```typescript
 * // Subscribe to all changes
 * const unsub = state.subscribe((value, change) => {
 *   console.log('Changed:', change.path, change.next);
 * });
 *
 * // Subscribe to specific path
 * state.subscribe('user.name', (name, prev) => {
 *   console.log(`Name changed from ${prev} to ${name}`);
 * });
 * ```
 *
 * @example With Effects
 * ```typescript
 * // Effect on entire store
 * state.effect((value) => {
 *   document.title = `${value.user.name} - ${value.count}`;
 * });
 *
 * // Effect on specific path
 * state.effect('user.email', (email) => {
 *   validateEmail(email);
 * });
 * ```
 *
 * @example Computed Selectors
 * ```typescript
 * const fullName = state.select(s =>
 *   `${s.user.firstName} ${s.user.lastName}`
 * );
 *
 * effect(() => {
 *   console.log(fullName.value);
 * });
 * ```
 *
 * @example Batched Updates
 * ```typescript
 * state.batch(() => {
 *   state.set('user.name', 'Charlie');
 *   state.set('user.email', 'charlie@example.com');
 *   state.set({ count: 10 });
 * });
 * // Single notification after batch completes
 * ```
 *
 * @example Deep Merge
 * ```typescript
 * state.merge({
 *   user: { name: 'Updated' }
 *   // email preserved, not overwritten
 * });
 * ```
 *
 * @example Update Functions
 * ```typescript
 * state.update(s => ({
 *   ...s,
 *   count: s.count + 1
 * }));
 *
 * state.update('user.name', name => name.toUpperCase());
 * ```
 */
export declare function store<T extends object>(initial: T, options?: StoreOptions<T>): WritableStore<T>;
/**
 * Check if a value is a store.
 *
 * @example
 * ```typescript
 * const state = store({ count: 0 });
 * const sig = signal(0);
 *
 * isStore(state); // true
 * isStore(sig);   // false
 * ```
 */
export declare function isStore<T extends object = object>(value: unknown): value is WritableStore<T>;
export type { DeepPartial, Path, PathValue, StoreChange, StoreOptions, Selector, StoreCallback, PathCallback, WritableStore, ReadonlyStore, };
export { STORE_BRAND };
//# sourceMappingURL=store.d.ts.map