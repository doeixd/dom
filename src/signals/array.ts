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

import { computed } from './signals';
import type { Unsubscribe, ReadonlySignal, SignalOptions } from './signals';

// ============================================
// Types
// ============================================

/** Array change types */
type ArrayChangeType = 
  | 'push' 
  | 'pop' 
  | 'shift' 
  | 'unshift' 
  | 'splice' 
  | 'set' 
  | 'sort' 
  | 'reverse'
  | 'fill'
  | 'remove'
  | 'clear'
  | 'swap'
  | 'move';

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
  // ============ Properties ============
  
  /** Current array (reactive read) */
  readonly value: readonly T[];
  
  /** Array length (reactive) */
  readonly length: number;
  
  /** Previous state */
  readonly prev: readonly T[] | undefined;
  
  // ============ Access ============
  
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
  
  // ============ Mutation ============
  
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
  
  // ============ Keyed Operations ============
  
  /** Find item by key (requires key option) */
  getByKey(key: string | number): T | undefined;
  
  /** Update item by key (requires key option) */
  updateByKey(key: string | number, fn: (item: T) => T): boolean;
  
  /** Remove item by key (requires key option) */
  removeByKey(key: string | number): T | undefined;
  
  /** Check if key exists (requires key option) */
  hasKey(key: string | number): boolean;
  
  // ============ Query (Non-Mutating) ============
  
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
  
  // ============ Derived (Returns New Reactive Array) ============
  
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
  
  // ============ Aggregate ============
  
  /** Reduce array to single value (reactive signal) */
  reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): ReadonlySignal<U>;
  
  /** Join items as string (reactive signal) */
  join(separator?: string): ReadonlySignal<string>;
  
  // ============ Subscription ============
  
  /** Subscribe to changes */
  subscribe(callback: ArrayCallback<T>): Unsubscribe;
  
  /** Subscribe to specific index */
  subscribe(index: number, callback: IndexCallback<T>): Unsubscribe;
  
  /** Run effect on changes */
  effect(fn: (items: readonly T[]) => void | Unsubscribe): Unsubscribe;
  
  /** Run effect on specific index */
  effect(index: number, fn: (item: T | undefined) => void | Unsubscribe): Unsubscribe;
  
  // ============ Iteration ============
  
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
  
  // ============ Batch ============
  
  /** Batch multiple operations */
  batch(fn: () => void): void;
  
  /** Transaction with rollback on error */
  transaction(fn: () => void): void;
  
  // ============ Utility ============
  
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


// ============================================
// Implementation
// ============================================

const ARRAY_BRAND = Symbol('reactiveArray');

let arrayBatchDepth = 0;
let pendingArrayNotifications = new Map<ReactiveArrayImpl<any>, ArrayChange<any>[]>();

/**
 * Reactive array implementation
 */
class ReactiveArrayImpl<T> extends EventTarget implements ReactiveArray<T> {
  readonly [ARRAY_BRAND] = true as const;
  
  #items: T[];
  #initialItems: T[];
  #prev: T[] | undefined;
  #options: ArrayOptions<T>;
  #keyMap: Map<string | number, T> | null = null;
  #indexListeners = new Map<number, Set<IndexCallback<T>>>();

  constructor(initial: T[] = [], options: ArrayOptions<T> = {}) {
    super();
    this.#items = [...initial];
    this.#initialItems = [...initial];
    this.#options = options;
    
    if (options.key) {
      this.#rebuildKeyMap();
    }
  }

  // ============ Properties ============

  get value(): readonly T[] {
    return this.#items;
  }

  get length(): number {
    return this.#items.length;
  }

  get prev(): readonly T[] | undefined {
    return this.#prev;
  }

  get first(): T | undefined {
    return this.#items[0];
  }

  get last(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  get isEmpty(): boolean {
    return this.#items.length === 0;
  }

  // ============ Access ============

  at(index: number): T | undefined {
    const i = index < 0 ? this.#items.length + index : index;
    return this.#items[i];
  }

  peek(): readonly T[];
  peek(index: number): T | undefined;
  peek(index?: number): readonly T[] | T | undefined {
    if (index === undefined) {
      return this.#items;
    }
    const i = index < 0 ? this.#items.length + index : index;
    return this.#items[i];
  }

  // ============ Mutation ============

  push(...items: T[]): number {
    if (items.length === 0) return this.#items.length;
    
    const prev = [...this.#items];
    this.#items.push(...items);
    
    if (this.#options.key) {
      items.forEach(item => {
        const key = this.#options.key!(item);
        this.#keyMap!.set(key, item);
      });
    }
    
    this.#notify({
      type: 'push',
      index: prev.length,
      added: items,
      removed: [],
      prev,
      next: this.#items
    });
    
    return this.#items.length;
  }

  pop(): T | undefined {
    if (this.#items.length === 0) return undefined;
    
    const prev = [...this.#items];
    const item = this.#items.pop();
    
    if (item !== undefined && this.#options.key) {
      const key = this.#options.key(item);
      this.#keyMap!.delete(key);
    }
    
    this.#notify({
      type: 'pop',
      index: prev.length - 1,
      added: [],
      removed: item !== undefined ? [item] : [],
      prev,
      next: this.#items
    });
    
    return item;
  }

  shift(): T | undefined {
    if (this.#items.length === 0) return undefined;
    
    const prev = [...this.#items];
    const item = this.#items.shift();
    
    if (item !== undefined && this.#options.key) {
      const key = this.#options.key(item);
      this.#keyMap!.delete(key);
    }
    
    this.#notify({
      type: 'shift',
      index: 0,
      added: [],
      removed: item !== undefined ? [item] : [],
      prev,
      next: this.#items
    });
    
    return item;
  }

  unshift(...items: T[]): number {
    if (items.length === 0) return this.#items.length;
    
    const prev = [...this.#items];
    this.#items.unshift(...items);
    
    if (this.#options.key) {
      items.forEach(item => {
        const key = this.#options.key!(item);
        this.#keyMap!.set(key, item);
      });
    }
    
    this.#notify({
      type: 'unshift',
      index: 0,
      added: items,
      removed: [],
      prev,
      next: this.#items
    });
    
    return this.#items.length;
  }

  splice(start: number, deleteCount: number = 0, ...items: T[]): T[] {
    const prev = [...this.#items];
    const removed = this.#items.splice(start, deleteCount, ...items);
    
    if (this.#options.key) {
      removed.forEach(item => {
        const key = this.#options.key!(item);
        this.#keyMap!.delete(key);
      });
      items.forEach(item => {
        const key = this.#options.key!(item);
        this.#keyMap!.set(key, item);
      });
    }
    
    if (removed.length > 0 || items.length > 0) {
      this.#notify({
        type: 'splice',
        index: start,
        added: items,
        removed,
        prev,
        next: this.#items
      });
    }
    
    return removed;
  }

  set(index: number, item: T): void;
  set(items: T[]): void;
  set(indexOrItems: number | T[], item?: T): void {
    if (typeof indexOrItems === 'number') {
      const index = indexOrItems;
      if (index < 0 || index >= this.#items.length) return;
      
      const prev = [...this.#items];
      const oldItem = this.#items[index];
      this.#items[index] = item!;
      
      if (this.#options.key) {
        const oldKey = this.#options.key(oldItem);
        const newKey = this.#options.key(item!);
        this.#keyMap!.delete(oldKey);
        this.#keyMap!.set(newKey, item!);
      }
      
      this.#notify({
        type: 'set',
        index,
        added: [item!],
        removed: [oldItem],
        prev,
        next: this.#items
      });
    } else {
      const prev = [...this.#items];
      this.#items = [...indexOrItems];
      
      if (this.#options.key) {
        this.#rebuildKeyMap();
      }
      
      this.#notify({
        type: 'set',
        added: this.#items,
        removed: prev,
        prev,
        next: this.#items
      });
    }
  }

  update(index: number, fn: (item: T) => T): void;
  update(fn: (item: T, index: number) => T): void;
  update(indexOrFn: number | ((item: T, index: number) => T), fn?: (item: T) => T): void {
    if (typeof indexOrFn === 'number') {
      const index = indexOrFn;
      if (index < 0 || index >= this.#items.length) return;
      this.set(index, fn!(this.#items[index]));
    } else {
      this.batch(() => {
        for (let i = 0; i < this.#items.length; i++) {
          this.set(i, indexOrFn(this.#items[i], i));
        }
      });
    }
  }

  sort(compare?: CompareFn<T>): this {
    const prev = [...this.#items];
    this.#items.sort(compare);
    
    this.#notify({
      type: 'sort',
      prev,
      next: this.#items
    });
    
    return this;
  }

  reverse(): this {
    const prev = [...this.#items];
    this.#items.reverse();
    
    this.#notify({
      type: 'reverse',
      prev,
      next: this.#items
    });
    
    return this;
  }

  fill(value: T, start: number = 0, end: number = this.#items.length): this {
    const prev = [...this.#items];
    this.#items.fill(value, start, end);
    
    if (this.#options.key) {
      this.#rebuildKeyMap();
    }
    
    this.#notify({
      type: 'fill',
      index: start,
      prev,
      next: this.#items
    });
    
    return this;
  }

  swap(indexA: number, indexB: number): void {
    if (
      indexA < 0 || indexA >= this.#items.length ||
      indexB < 0 || indexB >= this.#items.length ||
      indexA === indexB
    ) return;
    
    const prev = [...this.#items];
    [this.#items[indexA], this.#items[indexB]] = [this.#items[indexB], this.#items[indexA]];
    
    this.#notify({
      type: 'swap',
      prev,
      next: this.#items
    });
  }

  move(from: number, to: number): void {
    if (
      from < 0 || from >= this.#items.length ||
      to < 0 || to >= this.#items.length ||
      from === to
    ) return;
    
    const prev = [...this.#items];
    const [item] = this.#items.splice(from, 1);
    this.#items.splice(to, 0, item);
    
    this.#notify({
      type: 'move',
      prev,
      next: this.#items
    });
  }

  clear(): void {
    if (this.#items.length === 0) return;
    
    const prev = [...this.#items];
    this.#items = [];
    
    if (this.#options.key) {
      this.#keyMap!.clear();
    }
    
    this.#notify({
      type: 'clear',
      removed: prev,
      prev,
      next: this.#items
    });
  }

  reset(): void {
    this.set([...this.#initialItems]);
  }

  // ============ Keyed Operations ============

  getByKey(key: string | number): T | undefined {
    this.#ensureKeyMap();
    return this.#keyMap!.get(key);
  }

  updateByKey(key: string | number, fn: (item: T) => T): boolean {
    this.#ensureKeyMap();
    const item = this.#keyMap!.get(key);
    if (item === undefined) return false;
    
    const index = this.#items.indexOf(item);
    if (index === -1) return false;
    
    this.set(index, fn(item));
    return true;
  }

  removeByKey(key: string | number): T | undefined {
    this.#ensureKeyMap();
    const item = this.#keyMap!.get(key);
    if (item === undefined) return undefined;
    
    const index = this.#items.indexOf(item);
    if (index === -1) return undefined;
    
    const [removed] = this.splice(index, 1);
    return removed;
  }

  hasKey(key: string | number): boolean {
    this.#ensureKeyMap();
    return this.#keyMap!.has(key);
  }

  // ============ Query ============

  find(predicate: Predicate<T>): T | undefined {
    return this.#items.find(predicate);
  }

  findIndex(predicate: Predicate<T>): number {
    return this.#items.findIndex(predicate);
  }

  findLast(predicate: Predicate<T>): T | undefined {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      if (predicate(this.#items[i], i, this.#items)) {
        return this.#items[i];
      }
    }
    return undefined;
  }

  findLastIndex(predicate: Predicate<T>): number {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      if (predicate(this.#items[i], i, this.#items)) {
        return i;
      }
    }
    return -1;
  }

  some(predicate: Predicate<T>): boolean {
    return this.#items.some(predicate);
  }

  every(predicate: Predicate<T>): boolean {
    return this.#items.every(predicate);
  }

  includes(item: T): boolean {
    return this.#items.includes(item);
  }

  indexOf(item: T): number {
    return this.#items.indexOf(item);
  }

  lastIndexOf(item: T): number {
    return this.#items.lastIndexOf(item);
  }

  // ============ Derived ============

  filter(predicate: Predicate<T>): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    // Initial + reactive updates
    const update = () => {
      derived.set(this.#items.filter(predicate));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  map<U>(fn: MapFn<T, U>): ReactiveArray<U> {
    const derived = array<U>([]);
    
    const update = () => {
      derived.set(this.#items.map(fn));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  sorted(compare?: CompareFn<T>): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    const update = () => {
      derived.set([...this.#items].sort(compare));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  reversed(): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    const update = () => {
      derived.set([...this.#items].reverse());
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  slice(start?: number, end?: number): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    const update = () => {
      derived.set(this.#items.slice(start, end));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  concat(...items: (T | T[] | ReactiveArray<T>)[]): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    const update = () => {
      let result = [...this.#items];
      for (const item of items) {
        if (isArray(item)) {
          result = result.concat(item.peek());
        } else if (Array.isArray(item)) {
          result = result.concat(item);
        } else {
          result.push(item);
        }
      }
      derived.set(result);
    };
    
    update();
    this.subscribe(() => update());
    
    // Subscribe to reactive array sources
    for (const item of items) {
      if (isArray(item)) {
        item.subscribe(() => update());
      }
    }
    
    return derived;
  }

  flat<D extends number = 1>(depth?: D): ReactiveArray<unknown> {
    const derived = array<unknown>([]);
    
    const update = () => {
      derived.set(this.#items.flat(depth));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  flatMap<U>(fn: MapFn<T, U | U[]>): ReactiveArray<U> {
    const derived = array<U>([]);
    
    const update = () => {
      derived.set(this.#items.flatMap(fn));
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  unique(key?: (item: T) => unknown): ReactiveArray<T> {
    const derived = array<T>([], this.#options);
    
    const update = () => {
      if (key) {
        const seen = new Set<unknown>();
        const result: T[] = [];
        for (const item of this.#items) {
          const k = key(item);
          if (!seen.has(k)) {
            seen.add(k);
            result.push(item);
          }
        }
        derived.set(result);
      } else {
        derived.set([...new Set(this.#items)]);
      }
    };
    
    update();
    this.subscribe(() => update());
    
    return derived;
  }

  // ============ Aggregate ============

  reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): ReadonlySignal<U> {
    return computed(() => this.#items.reduce(fn, initial));
  }

  join(separator: string = ','): ReadonlySignal<string> {
    return computed(() => this.#items.join(separator));
  }

  // ============ Subscription ============

  subscribe(callback: ArrayCallback<T>): Unsubscribe;
  subscribe(index: number, callback: IndexCallback<T>): Unsubscribe;
  subscribe(
    callbackOrIndex: ArrayCallback<T> | number,
    callback?: IndexCallback<T>
  ): Unsubscribe {
    if (typeof callbackOrIndex === 'function') {
      const handler = (e: Event) => {
        const change = (e as CustomEvent<ArrayChange<T>>).detail;
        callbackOrIndex(this.#items, change);
      };
      this.addEventListener('change', handler);
      return () => this.removeEventListener('change', handler);
    } else {
      const index = callbackOrIndex;
      
      if (!this.#indexListeners.has(index)) {
        this.#indexListeners.set(index, new Set());
      }
      
      this.#indexListeners.get(index)!.add(callback!);
      
      return () => {
        const listeners = this.#indexListeners.get(index);
        if (listeners) {
          listeners.delete(callback!);
          if (listeners.size === 0) {
            this.#indexListeners.delete(index);
          }
        }
      };
    }
  }

  effect(fn: (items: readonly T[]) => void | Unsubscribe): Unsubscribe;
  effect(index: number, fn: (item: T | undefined) => void | Unsubscribe): Unsubscribe;
  effect(
    fnOrIndex: ((items: readonly T[]) => void | Unsubscribe) | number,
    fn?: (item: T | undefined) => void | Unsubscribe
  ): Unsubscribe {
    let cleanup: Unsubscribe | void;
    
    if (typeof fnOrIndex === 'function') {
      const run = () => {
        cleanup?.();
        cleanup = fnOrIndex(this.#items);
      };
      
      run();
      const unsub = this.subscribe(() => run());
      
      return () => {
        cleanup?.();
        unsub();
      };
    } else {
      const index = fnOrIndex;
      let prevItem = this.#items[index];
      
      const run = () => {
        cleanup?.();
        cleanup = fn!(this.#items[index]);
      };
      
      run();
      
      const unsub = this.subscribe(() => {
        const newItem = this.#items[index];
        if (newItem !== prevItem) {
          prevItem = newItem;
          run();
        }
      });
      
      return () => {
        cleanup?.();
        unsub();
      };
    }
  }

  // ============ Iteration ============

  forEach(fn: (item: T, index: number, array: readonly T[]) => void): void {
    this.#items.forEach(fn);
  }

  entries(): IterableIterator<[number, T]> {
    return this.#items.entries();
  }

  keys(): IterableIterator<number> {
    return this.#items.keys();
  }

  values(): IterableIterator<T> {
    return this.#items.values();
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.#items[Symbol.iterator]();
  }

  // ============ Batch ============

  batch(fn: () => void): void {
    arrayBatchDepth++;
    
    try {
      fn();
    } finally {
      arrayBatchDepth--;
      
      if (arrayBatchDepth === 0) {
        const changes = pendingArrayNotifications.get(this);
        if (changes && changes.length > 0) {
          pendingArrayNotifications.delete(this);
          
          // Merge all changes
          const mergedChange: ArrayChange<T> = {
            type: 'set',
            prev: changes[0].prev,
            next: this.#items,
            added: changes.flatMap(c => c.added ?? []),
            removed: changes.flatMap(c => c.removed ?? [])
          };
          
          this.dispatchEvent(new CustomEvent('change', { detail: mergedChange }));
          this.#notifyIndexListeners(mergedChange);
        }
      }
    }
  }

  transaction(fn: () => void): void {
    const backup = [...this.#items];
    
    try {
      this.batch(fn);
    } catch (error) {
      this.#items = backup;
      if (this.#options.key) {
        this.#rebuildKeyMap();
      }
      throw error;
    }
  }

  // ============ Utility ============

  toArray(): T[] {
    return [...this.#items];
  }

  toJSON(): T[] {
    return this.#items;
  }

  get readonly(): ReadonlyReactiveArray<T> {
    return this as ReadonlyReactiveArray<T>;
  }

  // ============ Private ============

  #notify(change: ArrayChange<T>): void {
    this.#prev = change.prev as T[];
    
    if (arrayBatchDepth > 0) {
      if (!pendingArrayNotifications.has(this)) {
        pendingArrayNotifications.set(this, []);
      }
      pendingArrayNotifications.get(this)!.push(change);
    } else {
      this.dispatchEvent(new CustomEvent('change', { detail: change }));
      this.#notifyIndexListeners(change);
    }
  }

  #notifyIndexListeners(change: ArrayChange<T>): void {
    for (const [index, listeners] of this.#indexListeners) {
      const prevItem = change.prev[index];
      const nextItem = change.next[index];
      
      if (prevItem !== nextItem) {
        listeners.forEach(cb => cb(nextItem, prevItem));
      }
    }
  }

  #ensureKeyMap(): void {
    if (!this.#options.key) {
      throw new Error('Key function not provided. Pass { key: (item) => ... } to array().');
    }
    if (!this.#keyMap) {
      this.#rebuildKeyMap();
    }
  }

  #rebuildKeyMap(): void {
    if (!this.#options.key) return;
    
    this.#keyMap = new Map();
    for (const item of this.#items) {
      const key = this.#options.key(item);
      this.#keyMap.set(key, item);
    }
  }

  get [Symbol.toStringTag](): string {
    return this.#options.name ? `Array(${this.#options.name})` : 'ReactiveArray';
  }
}


// ============================================
// Public API
// ============================================

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
export function array<T>(
  initial: T[] = [],
  options?: ArrayOptions<T>
): ReactiveArray<T> {
  return new ReactiveArrayImpl(initial, options);
}


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
export function isArray<T = unknown>(
  value: unknown
): value is ReactiveArray<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    ARRAY_BRAND in value &&
    (value as any)[ARRAY_BRAND] === true
  );
}


// ============================================
// Type Exports
// ============================================

export type {
  ArrayChangeType,
  ArrayChange,
  ArrayOptions,
  Predicate,
  MapFn,
  CompareFn,
  ArrayCallback,
  IndexCallback,
  ReactiveArray,
  ReadonlyReactiveArray,
};

export { ARRAY_BRAND };