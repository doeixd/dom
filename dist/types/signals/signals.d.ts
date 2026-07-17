/**
 * @module signal
 *
 * Reactive primitives for fine-grained state management.
 *
 * Signals are reactive containers that notify subscribers when their value changes.
 * They integrate with the library's patterns: cleanup functions, null-safety, and composition.
 *
 * @example Basic Usage
 * ```typescript
 * import { signal, computed, effect } from '@doeixd/dom';
 *
 * const count = signal(0);
 * const doubled = computed(() => count.value * 2);
 *
 * const cleanup = effect(() => {
 *   console.log(`Count: ${count.value}, Doubled: ${doubled.value}`);
 * });
 *
 * count.value = 5; // Logs: "Count: 5, Doubled: 10"
 * cleanup();
 * ```
 */
/** Cleanup function returned by subscriptions */
type Unsubscribe = () => void;
/** Equality function for comparing values */
type EqualityFn<T> = (prev: T, next: T) => boolean;
/** Callback for watching signal changes */
type WatchCallback<T> = (value: T, prev: T | undefined) => void;
/** Signal options */
interface SignalOptions<T> {
    /** Custom equality function. Default: `Object.is` */
    equals?: EqualityFn<T>;
    /** Name for debugging */
    name?: string;
}
/** Computed options */
interface ComputedOptions<T> extends SignalOptions<T> {
    /**
     * Evaluation strategy.
     * - `'lazy'`: Recompute on read (default)
     * - `'eager'`: Recompute immediately on dependency change
     */
    lazy?: boolean;
}
/** Effect options */
interface EffectOptions {
    /** Run effect immediately. Default: `true` */
    immediate?: boolean;
    /** Name for debugging */
    name?: string;
}
/** Batch options */
interface BatchOptions {
    /** Defer notifications until next microtask */
    defer?: boolean;
}
/** Read-only signal interface */
interface ReadonlySignal<T> {
    /** Current value (reactive read) */
    readonly value: T;
    /** Read value without tracking */
    peek(): T;
    /** Subscribe to changes */
    subscribe(callback: WatchCallback<T>): Unsubscribe;
    /** Run effect when value changes */
    effect(fn: (value: T) => void | Unsubscribe): Unsubscribe;
    /** Map to a new computed signal */
    map<U>(fn: (value: T) => U): ReadonlySignal<U>;
    /** Get primitive value */
    valueOf(): T;
    /** Get string representation */
    toString(): string;
    /** Signal identifier for type guards */
    readonly [SIGNAL_BRAND]: true;
}
/** Writable signal interface */
interface WritableSignal<T> extends ReadonlySignal<T> {
    /** Current value (reactive read/write) */
    value: T;
    /** Previous value (undefined before first change) */
    readonly prev: T | undefined;
    /** Update value using current value */
    update(fn: (current: T) => T): void;
    /** Set value without notifying subscribers */
    silent(value: T): void;
    /** Reset to initial value */
    reset(): void;
}
/** Computed signal interface */
interface ComputedSignal<T> extends ReadonlySignal<T> {
    /** Force recomputation */
    recompute(): T;
    /** Whether the computed is stale */
    readonly dirty: boolean;
}
/** Extract value type from signal */
type SignalValue<S> = S extends ReadonlySignal<infer T> ? T : never;
/** Extract value types from signal tuple */
type SignalValues<T extends readonly ReadonlySignal<any>[]> = {
    [K in keyof T]: T[K] extends ReadonlySignal<infer V> ? V : never;
};
/** Brand symbol for type guards */
export declare const SIGNAL_BRAND: unique symbol;
/**
 * Creates a reactive signal with the given initial value.
 *
 * Signals are reactive containers - when their value changes, any effects
 * or computed signals that depend on them automatically update.
 *
 * @param value - Initial value
 * @param options - Signal options
 * @returns A writable signal
 *
 * @example Basic Usage
 * ```typescript
 * const name = signal('Alice');
 * console.log(name.value); // 'Alice'
 *
 * name.value = 'Bob';
 * console.log(name.value); // 'Bob'
 * ```
 *
 * @example With Effects
 * ```typescript
 * const count = signal(0);
 *
 * // Runs immediately and on every change
 * const cleanup = count.effect((value) => {
 *   document.title = `Count: ${value}`;
 * });
 *
 * count.value++; // Title updates automatically
 * cleanup(); // Stop watching
 * ```
 *
 * @example Custom Equality
 * ```typescript
 * const user = signal(
 *   { id: 1, name: 'Alice' },
 *   { equals: (a, b) => a.id === b.id }
 * );
 *
 * // Won't trigger update (same id)
 * user.value = { id: 1, name: 'Alice Updated' };
 * ```
 *
 * @example Update Function
 * ```typescript
 * const items = signal<string[]>([]);
 *
 * // Immutable update pattern
 * items.update(list => [...list, 'new item']);
 * items.update(list => list.filter(x => x !== 'remove me'));
 * ```
 */
export declare function signal<T>(value: T, options?: SignalOptions<T>): WritableSignal<T>;
/**
 * Creates a computed signal that derives its value from other signals.
 *
 * Dependencies are tracked automatically - any signal accessed during
 * computation becomes a dependency. When dependencies change, the
 * computed value updates.
 *
 * @param fn - Computation function
 * @param options - Computed options
 * @returns A read-only computed signal
 *
 * @example Basic Computed
 * ```typescript
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * const fullName = computed(() => `${firstName.value} ${lastName.value}`);
 * console.log(fullName.value); // 'John Doe'
 *
 * firstName.value = 'Jane';
 * console.log(fullName.value); // 'Jane Doe'
 * ```
 *
 * @example Conditional Dependencies
 * ```typescript
 * const showDetails = signal(false);
 * const user = signal({ name: 'Alice', email: 'alice@example.com' });
 *
 * // Only depends on `user` when `showDetails` is true
 * const display = computed(() => {
 *   if (!showDetails.value) return 'Hidden';
 *   return `${user.value.name} (${user.value.email})`;
 * });
 * ```
 *
 * @example Chained Computeds
 * ```typescript
 * const items = signal([1, 2, 3, 4, 5]);
 * const filtered = computed(() => items.value.filter(x => x > 2));
 * const sum = computed(() => filtered.value.reduce((a, b) => a + b, 0));
 *
 * console.log(sum.value); // 12 (3 + 4 + 5)
 * ```
 *
 * @example Eager Evaluation
 * ```typescript
 * // Recomputes immediately on change, not on read
 * const expensive = computed(
 *   () => heavyCalculation(data.value),
 *   { lazy: false }
 * );
 * ```
 */
export declare function computed<T>(fn: () => T, options?: ComputedOptions<T>): ComputedSignal<T>;
/**
 * Creates an effect that runs when any accessed signals change.
 *
 * Dependencies are tracked automatically on each run. The effect runs
 * immediately and again whenever any dependency changes.
 *
 * @param fn - Effect function, optionally returns cleanup
 * @param options - Effect options
 * @returns Cleanup function
 *
 * @example Basic Effect
 * ```typescript
 * const count = signal(0);
 *
 * const cleanup = effect(() => {
 *   console.log(`Count is ${count.value}`);
 * });
 * // Logs: "Count is 0"
 *
 * count.value = 1;
 * // Logs: "Count is 1"
 *
 * cleanup(); // Stop effect
 * ```
 *
 * @example With Cleanup
 * ```typescript
 * const url = signal('/api/users');
 *
 * const cleanup = effect(() => {
 *   const controller = new AbortController();
 *
 *   fetch(url.value, { signal: controller.signal })
 *     .then(r => r.json())
 *     .then(setData);
 *
 *   // Cleanup runs before next effect and on dispose
 *   return () => controller.abort();
 * });
 * ```
 *
 * @example Conditional Dependencies
 * ```typescript
 * const enabled = signal(true);
 * const data = signal('initial');
 *
 * effect(() => {
 *   // Only tracks `data` when `enabled` is true
 *   if (enabled.value) {
 *     console.log(data.value);
 *   }
 * });
 * ```
 *
 * @example Deferred Start
 * ```typescript
 * const query = signal('');
 *
 * // Don't run until explicitly triggered
 * effect(() => {
 *   search(query.value);
 * }, { immediate: false });
 * ```
 */
export declare function effect(fn: () => void | Unsubscribe, options?: EffectOptions): Unsubscribe;
/**
 * Batch multiple signal updates into a single notification.
 *
 * Normally, each signal update notifies subscribers immediately.
 * Inside a batch, notifications are deferred until the batch completes.
 * This prevents redundant computations and effects.
 *
 * @param fn - Function containing updates to batch
 * @param options - Batch options
 *
 * @example Basic Batching
 * ```typescript
 * const a = signal(1);
 * const b = signal(2);
 * const sum = computed(() => a.value + b.value);
 *
 * effect(() => console.log(sum.value));
 * // Logs: 3
 *
 * // Without batch: logs twice (4, then 5)
 * // With batch: logs once (5)
 * batch(() => {
 *   a.value = 2;
 *   b.value = 3;
 * });
 * // Logs: 5
 * ```
 *
 * @example Nested Batches
 * ```typescript
 * batch(() => {
 *   a.value = 1;
 *   batch(() => {
 *     b.value = 2;
 *     c.value = 3;
 *   });
 *   d.value = 4;
 * });
 * // All updates notified together when outermost batch completes
 * ```
 */
export declare function batch(fn: () => void, options?: BatchOptions): void;
/**
 * Read a signal's value without tracking it as a dependency.
 *
 * Useful in effects when you need to read a value without
 * subscribing to its changes.
 *
 * @param fn - Function to run without tracking
 * @returns The function's return value
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const multiplier = signal(2);
 *
 * effect(() => {
 *   // Always reacts to `count` changes
 *   const c = count.value;
 *
 *   // Read `multiplier` without subscribing
 *   const m = untracked(() => multiplier.value);
 *
 *   console.log(c * m);
 * });
 *
 * count.value = 5; // Effect runs
 * multiplier.value = 3; // Effect does NOT run
 * ```
 */
export declare function untracked<T>(fn: () => T): T;
/**
 * Check if a value is a signal.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const doubled = computed(() => count.value * 2);
 * const plain = 5;
 *
 * isSignal(count);   // true
 * isSignal(doubled); // true
 * isSignal(plain);   // false
 * ```
 */
export declare function isSignal<T = unknown>(value: unknown): value is ReadonlySignal<T>;
/**
 * Check if a signal is writable.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const doubled = computed(() => count.value * 2);
 *
 * isWritable(count);   // true
 * isWritable(doubled); // false
 * ```
 */
export declare function isWritable<T = unknown>(value: unknown): value is WritableSignal<T>;
/**
 * Watch multiple signals and run callback when any change.
 *
 * Unlike `effect`, dependencies are explicit and the callback
 * receives all values as arguments.
 *
 * @param signals - Signals to watch
 * @param callback - Called with current values when any signal changes
 * @param options - Watch options
 * @returns Cleanup function
 *
 * @example
 * ```typescript
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * const cleanup = watch(
 *   [firstName, lastName],
 *   ([first, last]) => {
 *     console.log(`Name: ${first} ${last}`);
 *   }
 * );
 * ```
 *
 * @example With Previous Values
 * ```typescript
 * const count = signal(0);
 *
 * watch([count], ([current], [previous]) => {
 *   console.log(`Changed from ${previous} to ${current}`);
 * });
 * ```
 */
export declare function watch<T extends readonly ReadonlySignal<any>[]>(signals: [...T], callback: (values: SignalValues<T>, prev: SignalValues<T> | undefined) => void | Unsubscribe, options?: EffectOptions): Unsubscribe;
/**
 * Create a signal that syncs with localStorage.
 *
 * @param key - localStorage key
 * @param initial - Initial value if key doesn't exist
 * @param options - Signal options plus serialization
 * @returns A writable signal synced to localStorage
 *
 * @example
 * ```typescript
 * const theme = persisted('theme', 'light');
 *
 * theme.value = 'dark'; // Saved to localStorage
 *
 * // On page reload:
 * console.log(theme.value); // 'dark' (restored from localStorage)
 * ```
 *
 * @example Custom Serialization
 * ```typescript
 * const settings = persisted('settings', { volume: 50 }, {
 *   serialize: JSON.stringify,
 *   deserialize: JSON.parse
 * });
 * ```
 */
export declare function persisted<T>(key: string, initial: T, options?: SignalOptions<T> & {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    storage?: Storage;
}): WritableSignal<T>;
export type { Unsubscribe, EqualityFn, WatchCallback, SignalOptions, ComputedOptions, EffectOptions, BatchOptions, ReadonlySignal, WritableSignal, ComputedSignal, SignalValue, SignalValues, };
//# sourceMappingURL=signals.d.ts.map