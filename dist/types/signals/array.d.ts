/**
 * @module array
 *
 * Reactive array with fine-grained change tracking.
 *
 * @example Basic Usage
 * ```typescript
 * import { array, effect } from '@doeixd/dom';
 *
 * const todos = array([
 *   { id: 1, text: 'Buy milk', done: false },
 *   { id: 2, text: 'Walk dog', done: true }
 * ]);
 *
 * effect(() => {
 *   console.log(`${todos.length} todos`);
 * });
 *
 * todos.push({ id: 3, text: 'Call mom', done: false });
 * // Logs: "3 todos"
 * ```
 */
import type { Unsubscribe, ReadonlySignal, SignalOptions } from './signals';
/** Array change types */
type ArrayChangeType = 'push' | 'pop' | 'shift' | 'unshift' | 'splice' | 'set' | 'sort' | 'reverse' | 'fill' | 'remove' | 'clear' | 'swap' | 'move';
/** Array change event */
interface ArrayChange<T> {
    /** Type of change */
    type: ArrayChangeType;
    /** Index where change occurred */
    index?: number;
    /** Items added */
    added?: T[];
    /** Items removed */
    removed?: T[];
    /** Previous array state */
    prev: readonly T[];
    /** New array state */
    next: readonly T[];
}
/** Array options */
interface ArrayOptions<T> extends SignalOptions<T[]> {
    /** Key function for efficient updates. If provided, enables keyed operations. */
    key?: (item: T) => string | number;
    /** Name for debugging */
    name?: string;
}
/** Predicate function */
type Predicate<T> = (item: T, index: number, array: readonly T[]) => boolean;
/** Map function */
type MapFn<T, U> = (item: T, index: number, array: readonly T[]) => U;
/** Sort compare function */
type CompareFn<T> = (a: T, b: T) => number;
/** Array subscription callback */
type ArrayCallback<T> = (items: readonly T[], change: ArrayChange<T>) => void;
/** Index subscription callback */
type IndexCallback<T> = (item: T | undefined, prev: T | undefined) => void;
/** Reactive array interface */
interface ReactiveArray<T> {
    /** Current array (reactive read) */
    readonly value: readonly T[];
    /** Array length (reactive) */
    readonly length: number;
    /** Previous state */
    readonly prev: readonly T[] | undefined;
    /** Get item at index (reactive) */
    at(index: number): T | undefined;
    /** Get first item */
    readonly first: T | undefined;
    /** Get last item */
    readonly last: T | undefined;
    /** Check if array is empty */
    readonly isEmpty: boolean;
    /** Read without tracking */
    peek(): readonly T[];
    peek(index: number): T | undefined;
    /** Add items to end */
    push(...items: T[]): number;
    /** Remove and return last item */
    pop(): T | undefined;
    /** Remove and return first item */
    shift(): T | undefined;
    /** Add items to beginning */
    unshift(...items: T[]): number;
    /** Remove/insert items at index */
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
    /** Set item at index */
    set(index: number, item: T): void;
    /** Set entire array */
    set(items: T[]): void;
    /** Update item at index */
    update(index: number, fn: (item: T) => T): void;
    /** Update all items */
    update(fn: (item: T, index: number) => T): void;
    /** Sort in place */
    sort(compare?: CompareFn<T>): this;
    /** Reverse in place */
    reverse(): this;
    /** Fill with value */
    fill(value: T, start?: number, end?: number): this;
    /** Swap two indices */
    swap(indexA: number, indexB: number): void;
    /** Move item from one index to another */
    move(from: number, to: number): void;
    /** Clear all items */
    clear(): void;
    /** Reset to initial value */
    reset(): void;
    /** Find item by key (requires key option) */
    getByKey(key: string | number): T | undefined;
    /** Update item by key (requires key option) */
    updateByKey(key: string | number, fn: (item: T) => T): boolean;
    /** Remove item by key (requires key option) */
    removeByKey(key: string | number): T | undefined;
    /** Check if key exists (requires key option) */
    hasKey(key: string | number): boolean;
    /** Find first matching item */
    find(predicate: Predicate<T>): T | undefined;
    /** Find index of first match */
    findIndex(predicate: Predicate<T>): number;
    /** Find last matching item */
    findLast(predicate: Predicate<T>): T | undefined;
    /** Find index of last match */
    findLastIndex(predicate: Predicate<T>): number;
    /** Check if any item matches */
    some(predicate: Predicate<T>): boolean;
    /** Check if all items match */
    every(predicate: Predicate<T>): boolean;
    /** Check if array includes item */
    includes(item: T): boolean;
    /** Get index of item */
    indexOf(item: T): number;
    /** Get last index of item */
    lastIndexOf(item: T): number;
    /** Create filtered reactive array */
    filter(predicate: Predicate<T>): ReactiveArray<T>;
    /** Create mapped reactive array */
    map<U>(fn: MapFn<T, U>): ReactiveArray<U>;
    /** Create sorted reactive array */
    sorted(compare?: CompareFn<T>): ReactiveArray<T>;
    /** Create reversed reactive array */
    reversed(): ReactiveArray<T>;
    /** Create sliced reactive array */
    slice(start?: number, end?: number): ReactiveArray<T>;
    /** Create concatenated reactive array */
    concat(...items: (T | T[] | ReactiveArray<T>)[]): ReactiveArray<T>;
    /** Create flat reactive array */
    flat<D extends number = 1>(depth?: D): ReactiveArray<unknown>;
    /** Create flatMapped reactive array */
    flatMap<U>(fn: MapFn<T, U | U[]>): ReactiveArray<U>;
    /** Create unique reactive array */
    unique(key?: (item: T) => unknown): ReactiveArray<T>;
    /** Reduce array to single value (reactive signal) */
    reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): ReadonlySignal<U>;
    /** Join items as string (reactive signal) */
    join(separator?: string): ReadonlySignal<string>;
    /** Subscribe to changes */
    subscribe(callback: ArrayCallback<T>): Unsubscribe;
    /** Subscribe to specific index */
    subscribe(index: number, callback: IndexCallback<T>): Unsubscribe;
    /** Run effect on changes */
    effect(fn: (items: readonly T[]) => void | Unsubscribe): Unsubscribe;
    /** Run effect on specific index */
    effect(index: number, fn: (item: T | undefined) => void | Unsubscribe): Unsubscribe;
    /** Iterate items */
    forEach(fn: (item: T, index: number, array: readonly T[]) => void): void;
    /** Get entries iterator */
    entries(): IterableIterator<[number, T]>;
    /** Get keys iterator */
    keys(): IterableIterator<number>;
    /** Get values iterator */
    values(): IterableIterator<T>;
    /** Symbol.iterator */
    [Symbol.iterator](): IterableIterator<T>;
    /** Batch multiple operations */
    batch(fn: () => void): void;
    /** Transaction with rollback on error */
    transaction(fn: () => void): void;
    /** Create plain array copy */
    toArray(): T[];
    /** Get JSON representation */
    toJSON(): T[];
    /** Create readonly view */
    readonly: ReadonlyReactiveArray<T>;
    /** Array brand for type guards */
    readonly [ARRAY_BRAND]: true;
}
/** Read-only reactive array */
interface ReadonlyReactiveArray<T> {
    readonly value: readonly T[];
    readonly length: number;
    at(index: number): T | undefined;
    readonly first: T | undefined;
    readonly last: T | undefined;
    readonly isEmpty: boolean;
    peek(): readonly T[];
    peek(index: number): T | undefined;
    find(predicate: Predicate<T>): T | undefined;
    findIndex(predicate: Predicate<T>): number;
    some(predicate: Predicate<T>): boolean;
    every(predicate: Predicate<T>): boolean;
    includes(item: T): boolean;
    indexOf(item: T): number;
    filter(predicate: Predicate<T>): ReactiveArray<T>;
    map<U>(fn: MapFn<T, U>): ReactiveArray<U>;
    sorted(compare?: CompareFn<T>): ReactiveArray<T>;
    reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): ReadonlySignal<U>;
    join(separator?: string): ReadonlySignal<string>;
    subscribe(callback: ArrayCallback<T>): Unsubscribe;
    subscribe(index: number, callback: IndexCallback<T>): Unsubscribe;
    effect(fn: (items: readonly T[]) => void | Unsubscribe): Unsubscribe;
    forEach(fn: (item: T, index: number, array: readonly T[]) => void): void;
    entries(): IterableIterator<[number, T]>;
    keys(): IterableIterator<number>;
    values(): IterableIterator<T>;
    [Symbol.iterator](): IterableIterator<T>;
    toArray(): T[];
    toJSON(): T[];
    readonly [ARRAY_BRAND]: true;
}
declare const ARRAY_BRAND: unique symbol;
/**
 * Creates a reactive array with fine-grained change tracking.
 *
 * Reactive arrays notify subscribers when modified and provide
 * reactive derived views (filter, map, sort).
 *
 * @param initial - Initial array items
 * @param options - Array options
 * @returns A reactive array
 *
 * @example Basic Usage
 * ```typescript
 * const todos = array([
 *   { id: 1, text: 'Buy milk', done: false }
 * ]);
 *
 * todos.push({ id: 2, text: 'Walk dog', done: false });
 * todos.set(0, { ...todos.at(0)!, done: true });
 * console.log(todos.length); // 2
 * ```
 *
 * @example With Effects
 * ```typescript
 * const items = array(['a', 'b', 'c']);
 *
 * items.effect((list) => {
 *   console.log('Items:', list.join(', '));
 * });
 * // Logs: "Items: a, b, c"
 *
 * items.push('d');
 * // Logs: "Items: a, b, c, d"
 * ```
 *
 * @example Keyed Operations
 * ```typescript
 * interface User { id: number; name: string; }
 *
 * const users = array<User>([], {
 *   key: user => user.id
 * });
 *
 * users.push({ id: 1, name: 'Alice' });
 * users.push({ id: 2, name: 'Bob' });
 *
 * users.getByKey(1); // { id: 1, name: 'Alice' }
 * users.updateByKey(1, u => ({ ...u, name: 'Alicia' }));
 * users.removeByKey(2);
 * ```
 *
 * @example Derived Arrays
 * ```typescript
 * const numbers = array([1, 2, 3, 4, 5]);
 *
 * // Reactive filtered view
 * const evens = numbers.filter(n => n % 2 === 0);
 * console.log(evens.value); // [2, 4]
 *
 * // Reactive mapped view
 * const doubled = numbers.map(n => n * 2);
 * console.log(doubled.value); // [2, 4, 6, 8, 10]
 *
 * numbers.push(6);
 * console.log(evens.value); // [2, 4, 6] - auto-updated!
 * console.log(doubled.value); // [2, 4, 6, 8, 10, 12]
 * ```
 *
 * @example Change Tracking
 * ```typescript
 * const list = array(['a', 'b']);
 *
 * list.subscribe((items, change) => {
 *   console.log('Type:', change.type);
 *   console.log('Added:', change.added);
 *   console.log('Removed:', change.removed);
 * });
 *
 * list.push('c');
 * // Type: push, Added: ['c'], Removed: []
 *
 * list.splice(1, 1, 'x', 'y');
 * // Type: splice, Added: ['x', 'y'], Removed: ['b']
 * ```
 *
 * @example Index Subscription
 * ```typescript
 * const items = array(['first', 'second', 'third']);
 *
 * // Watch specific index
 * items.subscribe(0, (item, prev) => {
 *   console.log(`First item changed from ${prev} to ${item}`);
 * });
 *
 * items.set(0, 'new first');
 * // Logs: "First item changed from first to new first"
 * ```
 *
 * @example Batched Updates
 * ```typescript
 * const list = array([1, 2, 3]);
 *
 * list.batch(() => {
 *   list.push(4);
 *   list.push(5);
 *   list.set(0, 100);
 * });
 * // Single notification after batch
 * ```
 *
 * @example Transaction with Rollback
 * ```typescript
 * const items = array([1, 2, 3]);
 *
 * try {
 *   items.transaction(() => {
 *     items.push(4);
 *     items.push(5);
 *     throw new Error('Oops!');
 *   });
 * } catch {
 *   console.log(items.value); // [1, 2, 3] - rolled back!
 * }
 * ```
 *
 * @example Aggregates
 * ```typescript
 * const prices = array([10, 20, 30]);
 *
 * const total = prices.reduce((sum, n) => sum + n, 0);
 * console.log(total.value); // 60
 *
 * prices.push(40);
 * console.log(total.value); // 100 - reactive!
 *
 * const csv = prices.join(', ');
 * console.log(csv.value); // "10, 20, 30, 40"
 * ```
 *
 * @example Swap and Move
 * ```typescript
 * const items = array(['a', 'b', 'c', 'd']);
 *
 * items.swap(0, 2);
 * console.log(items.value); // ['c', 'b', 'a', 'd']
 *
 * items.move(3, 0);
 * console.log(items.value); // ['d', 'c', 'b', 'a']
 * ```
 *
 * @example Unique Items
 * ```typescript
 * const items = array([1, 2, 2, 3, 3, 3]);
 * const unique = items.unique();
 * console.log(unique.value); // [1, 2, 3]
 *
 * // With key function for objects
 * const users = array([
 *   { id: 1, name: 'Alice' },
 *   { id: 1, name: 'Alice Copy' },
 *   { id: 2, name: 'Bob' }
 * ]);
 * const uniqueUsers = users.unique(u => u.id);
 * // [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 * ```
 */
export declare function array<T>(initial?: T[], options?: ArrayOptions<T>): ReactiveArray<T>;
/**
 * Check if a value is a reactive array.
 *
 * @example
 * ```typescript
 * const list = array([1, 2, 3]);
 * const plain = [1, 2, 3];
 *
 * isArray(list);  // true
 * isArray(plain); // false
 * ```
 */
export declare function isArray<T = unknown>(value: unknown): value is ReactiveArray<T>;
export type { ArrayChangeType, ArrayChange, ArrayOptions, Predicate, MapFn, CompareFn, ArrayCallback, IndexCallback, ReactiveArray, ReadonlyReactiveArray, };
export { ARRAY_BRAND };
//# sourceMappingURL=array.d.ts.map