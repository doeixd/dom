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

import { computed } from './signals';
import type { Unsubscribe, ReadonlySignal, SignalOptions } from './signals';

// ============================================
// Types
// ============================================

/** Deep partial type */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/** Path type for nested access */
type Path = string | readonly (string | number)[];

/** Get type at path */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

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


// ============================================
// Implementation
// ============================================

const STORE_BRAND = Symbol('store');

/** Active tracking context */
let activeStoreEffect: Set<StoreImpl<any>> | null = null;
let storeBatchDepth = 0;
let pendingStoreNotifications = new Map<StoreImpl<any>, StoreChange<any>[]>();

/**
 * Parse path string or array into array of keys
 */
function parsePath(path: Path): string[] {
  if (Array.isArray(path)) {
    return path.map(String);
  }
  if (typeof path === 'string') {
    return path.split('.').filter(Boolean);
  }
  return [];
}

/**
 * Get value at path in object
 */
function getPath<T>(obj: T, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Set value at path in object (immutable)
 */
function setPath<T extends object>(obj: T, path: string[], value: unknown): T {
  if (path.length === 0) return value as T;
  
  const [head, ...tail] = path;
  const current = obj as Record<string, unknown>;
  
  return {
    ...obj,
    [head]: tail.length === 0
      ? value
      : setPath(
          (current[head] as object) ?? {},
          tail,
          value
        )
  } as T;
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return result as T;
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetVal = (target as Record<string, unknown>)[key];
      const sourceVal = (source as Record<string, unknown>)[key];
      
      if (
        sourceVal !== null &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal !== null &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetVal as object,
          sourceVal as DeepPartial<object>
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceVal;
      }
    }
  }
  
  return result;
}



/**
 * Store implementation
 */
class StoreImpl<T extends object> extends EventTarget implements WritableStore<T> {
  readonly [STORE_BRAND] = true as const;
  
  #value: T;
  #initialValue: T;
  #prev: T | undefined;
  #options: StoreOptions<T>;
  #pathListeners = new Map<string, Set<PathCallback<unknown>>>();

  constructor(initial: T, options: StoreOptions<T> = {}) {
    super();
    this.#value = options.immutable ? deepClone(initial) : initial;
    this.#initialValue = deepClone(initial);
    this.#options = options;
  }

  get value(): T {
    if (activeStoreEffect) {
      activeStoreEffect.add(this);
    }
    return this.#options.immutable ? deepClone(this.#value) : this.#value;
  }

  get prev(): T | undefined {
    return this.#prev;
  }

  get<P extends string>(path: P): PathValue<T, P>;
  get<V>(path: Path): V;
  get(path: Path): unknown {
    const keys = parsePath(path);
    return getPath(this.#value, keys);
  }

  set(value: T): void;
  set(partial: DeepPartial<T>): void;
  set<P extends string>(path: P, value: PathValue<T, P>): void;
  set(path: Path, value: unknown): void;
  set(pathOrValue: Path | T | DeepPartial<T>, value?: unknown): void {
    if (arguments.length === 1) {
      // Full or partial state update
      const newValue = pathOrValue as T | DeepPartial<T>;
      
      // Check if it's a full replacement or partial
      if (this.#isFullState(newValue)) {
        this.#setState(newValue as T, []);
      } else {
        // Shallow merge for partial updates
        const merged = { ...this.#value, ...newValue } as T;
        this.#setState(merged, []);
      }
    } else {
      // Path-based update
      const path = parsePath(pathOrValue as Path);
      const prev = getPath(this.#value, path);
      
      if (Object.is(prev, value)) return;
      
      const newState = setPath(this.#value, path, value);
      this.#setState(newState, path);
    }
  }

  update(fn: (current: T) => T): void;
  update<P extends string>(path: P, fn: (current: PathValue<T, P>) => PathValue<T, P>): void;
  update(path: Path, fn: (current: unknown) => unknown): void;
  update(
    pathOrFn: Path | ((current: T) => T),
    fn?: (current: any) => any
  ): void {
    if (typeof pathOrFn === 'function') {
      this.set(pathOrFn(this.#value));
    } else {
      const path = parsePath(pathOrFn);
      const current = getPath(this.#value, path);
      this.set(pathOrFn, fn!(current));
    }
  }

  merge(partial: DeepPartial<T>): void {
    const mergeFn = this.#options.merge ?? deepMerge;
    const merged = mergeFn(this.#value, partial);
    this.#setState(merged, []);
  }

  reset(): void;
  reset(path: Path): void;
  reset(path?: Path): void {
    if (path === undefined) {
      this.#setState(deepClone(this.#initialValue), []);
    } else {
      const keys = parsePath(path);
      const initialValue = getPath(this.#initialValue, keys);
      this.set(path, initialValue);
    }
  }

  subscribe(callback: StoreCallback<T>): Unsubscribe;
  subscribe<P extends string>(path: P, callback: PathCallback<PathValue<T, P>>): Unsubscribe;
  subscribe(path: Path, callback: PathCallback<unknown>): Unsubscribe;
  subscribe(
    pathOrCallback: Path | StoreCallback<T>,
    callback?: PathCallback<any>
  ): Unsubscribe {
    if (typeof pathOrCallback === 'function') {
      // Subscribe to all changes
      const handler = (e: Event) => {
        const change = (e as CustomEvent<StoreChange<T>>).detail;
        pathOrCallback(this.#value, change);
      };
      this.addEventListener('change', handler);
      return () => this.removeEventListener('change', handler);
    } else {
      // Subscribe to path
      const pathKey = parsePath(pathOrCallback).join('.');
      
      if (!this.#pathListeners.has(pathKey)) {
        this.#pathListeners.set(pathKey, new Set());
      }
      
      this.#pathListeners.get(pathKey)!.add(callback!);
      
      return () => {
        const listeners = this.#pathListeners.get(pathKey);
        if (listeners) {
          listeners.delete(callback!);
          if (listeners.size === 0) {
            this.#pathListeners.delete(pathKey);
          }
        }
      };
    }
  }

  select<R>(selector: Selector<T, R>): ReadonlySignal<R> {
    return computed(() => selector(this.value));
  }

  effect(fn: (state: T) => void | Unsubscribe): Unsubscribe;
  effect<P extends string>(path: P, fn: (value: PathValue<T, P>) => void | Unsubscribe): Unsubscribe;
  effect(
    pathOrFn: Path | ((state: T) => void | Unsubscribe),
    fn?: (value: any) => void | Unsubscribe
  ): Unsubscribe {
    let cleanup: Unsubscribe | void;
    
    if (typeof pathOrFn === 'function') {
      const run = () => {
        cleanup?.();
        cleanup = pathOrFn(this.#value);
      };
      
      run();
      const unsub = this.subscribe(() => run());
      
      return () => {
        cleanup?.();
        unsub();
      };
    } else {
      const path = parsePath(pathOrFn);
      let prevValue = getPath(this.#value, path);
      
      const run = () => {
        cleanup?.();
        cleanup = fn!(getPath(this.#value, path));
      };
      
      run();
      
      const unsub = this.subscribe(() => {
        const newValue = getPath(this.#value, path);
        if (!Object.is(newValue, prevValue)) {
          prevValue = newValue;
          run();
        }
      });
      
      return () => {
        cleanup?.();
        unsub();
      };
    }
  }

  peek(): T;
  peek<P extends string>(path: P): PathValue<T, P>;
  peek(path?: Path): unknown {
    if (path === undefined) {
      return this.#value;
    }
    return getPath(this.#value, parsePath(path));
  }

  batch(fn: () => void): void {
    storeBatchDepth++;
    
    try {
      fn();
    } finally {
      storeBatchDepth--;
      
      if (storeBatchDepth === 0) {
        const changes = pendingStoreNotifications.get(this);
        if (changes && changes.length > 0) {
          pendingStoreNotifications.delete(this);
          
          // Merge all changes into one notification
          const mergedChange: StoreChange<T> = {
            path: [],
            prev: changes[0].prevState,
            next: this.#value,
            prevState: changes[0].prevState,
            nextState: this.#value
          };
          
          this.dispatchEvent(new CustomEvent('change', { detail: mergedChange }));
        }
      }
    }
  }

  get readonly(): ReadonlyStore<T> {
    return this as ReadonlyStore<T>;
  }

  #isFullState(value: unknown): value is T {
    // Heuristic: if it has all top-level keys, it's a full state
    if (typeof value !== 'object' || value === null) return false;
    const stateKeys = Object.keys(this.#value);
    const valueKeys = Object.keys(value);
    return stateKeys.every(key => valueKeys.includes(key));
  }

  #setState(newState: T, changedPath: string[]): void {
    if (this.#value === newState) return;
    
    const prevState = this.#value;
    this.#prev = prevState;
    this.#value = newState;
    
    const change: StoreChange<T> = {
      path: changedPath,
      prev: changedPath.length > 0 ? getPath(prevState, changedPath) : prevState,
      next: changedPath.length > 0 ? getPath(newState, changedPath) : newState,
      prevState,
      nextState: newState
    };
    
    if (storeBatchDepth > 0) {
      if (!pendingStoreNotifications.has(this)) {
        pendingStoreNotifications.set(this, []);
      }
      pendingStoreNotifications.get(this)!.push(change);
    } else {
      this.#notify(change);
    }
  }

  #notify(change: StoreChange<T>): void {
    // Notify global subscribers
    this.dispatchEvent(new CustomEvent('change', { detail: change }));
    
    // Notify path-specific subscribers
    const pathKey = change.path.join('.');
    
    // Exact path match
    const exactListeners = this.#pathListeners.get(pathKey);
    if (exactListeners) {
      exactListeners.forEach(cb => cb(change.next, change.prev));
    }
    
    // Parent paths (if we changed 'user.name', notify 'user' listeners too)
    for (let i = change.path.length - 1; i >= 0; i--) {
      const parentPath = change.path.slice(0, i).join('.');
      const parentListeners = this.#pathListeners.get(parentPath);
      if (parentListeners) {
        const value = parentPath ? getPath(this.#value, change.path.slice(0, i)) : this.#value;
        const prev = parentPath ? getPath(this.#prev!, change.path.slice(0, i)) : this.#prev;
        parentListeners.forEach(cb => cb(value, prev));
      }
    }
    
    // Root listeners (empty path)
    const rootListeners = this.#pathListeners.get('');
    if (rootListeners) {
      rootListeners.forEach(cb => cb(this.#value, this.#prev));
    }
  }

  toJSON(): T {
    return this.#value;
  }

  get [Symbol.toStringTag](): string {
    return this.#options.name ? `Store(${this.#options.name})` : 'Store';
  }
}


// ============================================
// Public API
// ============================================

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
export function store<T extends object>(
  initial: T,
  options?: StoreOptions<T>
): WritableStore<T> {
  return new StoreImpl(initial, options);
}


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
export function isStore<T extends object = object>(
  value: unknown
): value is WritableStore<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    STORE_BRAND in value &&
    (value as any)[STORE_BRAND] === true
  );
}


// ============================================
// Type Exports
// ============================================

export type {
  DeepPartial,
  Path,
  PathValue,
  StoreChange,
  StoreOptions,
  Selector,
  StoreCallback,
  PathCallback,
  WritableStore,
  ReadonlyStore,
};

export { STORE_BRAND };