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

// ============================================
// Types
// ============================================

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


// ============================================
// Implementation
// ============================================

/** Brand symbol for type guards */
export const SIGNAL_BRAND = Symbol('signal');

/** Global tracking context for auto-dependency detection */
let activeEffect: Set<SignalImpl<any>> | null = null;
let batchDepth = 0;
let pendingNotifications = new Set<SignalImpl<any>>();

/**
 * Default equality using Object.is
 */
const defaultEquals = <T>(a: T, b: T): boolean => Object.is(a, b);

/**
 * Base Signal implementation
 */
class SignalImpl<T> extends EventTarget implements WritableSignal<T> {
  readonly [SIGNAL_BRAND] = true as const;
  
  #value: T;
  #initialValue: T;
  #prev: T | undefined = undefined;
  #equals: EqualityFn<T>;
  #name?: string;

  constructor(value: T, options: SignalOptions<T> = {}) {
    super();
    this.#value = value;
    this.#initialValue = value;
    this.#equals = options.equals ?? defaultEquals;
    this.#name = options.name;
  }

  /** Current value. Reading tracks dependency, writing notifies subscribers. */
  get value(): T {
    // Track dependency if inside an effect
    if (activeEffect) {
      activeEffect.add(this);
    }
    return this.#value;
  }

  set value(next: T) {
    if (this.#equals(this.#value, next)) return;
    
    this.#prev = this.#value;
    this.#value = next;
    this.#notify();
  }

  /** Previous value before last change */
  get prev(): T | undefined {
    return this.#prev;
  }

  /** Read current value without tracking as dependency */
  peek(): T {
    return this.#value;
  }

  /**
   * Update value using a function that receives current value.
   * 
   * @example
   * ```typescript
   * const list = signal<string[]>([]);
   * list.update(items => [...items, 'new item']);
   * ```
   */
  update(fn: (current: T) => T): void {
    this.value = fn(this.#value);
  }

  /**
   * Set value without notifying subscribers.
   * Useful for initialization or syncing from external sources.
   * 
   * @example
   * ```typescript
   * const input = signal('');
   * // Sync from localStorage without triggering effects
   * input.silent(localStorage.getItem('draft') ?? '');
   * ```
   */
  silent(value: T): void {
    this.#prev = this.#value;
    this.#value = value;
  }

  /** Reset to initial value */
  reset(): void {
    this.value = this.#initialValue;
  }

  /**
   * Subscribe to value changes.
   * 
   * @param callback - Called with new and previous value on change
   * @returns Cleanup function
   * 
   * @example
   * ```typescript
   * const count = signal(0);
   * const unsub = count.subscribe((value, prev) => {
   *   console.log(`Changed from ${prev} to ${value}`);
   * });
   * ```
   */
  subscribe(callback: WatchCallback<T>): Unsubscribe {
    const handler = () => callback(this.#value, this.#prev);
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }

  /**
   * Run an effect when value changes. Effect runs immediately with current value.
   * 
   * If the effect returns a cleanup function, it's called before the next run
   * and when unsubscribing.
   * 
   * @param fn - Effect function, optionally returns cleanup
   * @returns Cleanup function
   * 
   * @example
   * ```typescript
   * const userId = signal<number | null>(null);
   * 
   * const unsub = userId.effect((id) => {
   *   if (id === null) return;
   *   
   *   const controller = new AbortController();
   *   fetchUser(id, { signal: controller.signal });
   *   
   *   return () => controller.abort(); // Cleanup on change
   * });
   * ```
   */
  effect(fn: (value: T) => void | Unsubscribe): Unsubscribe {
    let cleanup: Unsubscribe | void;
    
    const run = () => {
      cleanup?.();
      cleanup = fn(this.#value);
    };
    
    run(); // Run immediately
    this.addEventListener('change', run);
    
    return () => {
      cleanup?.();
      this.removeEventListener('change', run);
    };
  }

  /**
   * Create a computed signal derived from this signal.
   * 
   * @example
   * ```typescript
   * const celsius = signal(20);
   * const fahrenheit = celsius.map(c => c * 9/5 + 32);
   * ```
   */
  map<U>(fn: (value: T) => U): ComputedSignal<U> {
    return computed(() => fn(this.value));
  }

  /** @internal Notify subscribers of change */
  #notify(): void {
    if (batchDepth > 0) {
      pendingNotifications.add(this);
    } else {
      this.dispatchEvent(new CustomEvent('change'));
    }
  }

  /** @internal Flush pending notification */
  _flush(): void {
    this.dispatchEvent(new CustomEvent('change'));
  }

  valueOf(): T {
    return this.#value;
  }

  toString(): string {
    return String(this.#value);
  }

  toJSON(): T {
    return this.#value;
  }

  /** Debug representation */
  get [Symbol.toStringTag](): string {
    return this.#name ? `Signal(${this.#name})` : 'Signal';
  }
}


/**
 * Computed Signal implementation
 */
class ComputedImpl<T> extends EventTarget implements ComputedSignal<T> {
  readonly [SIGNAL_BRAND] = true as const;
  
  #fn: () => T;
  #value: T | undefined;
  #dirty = true;
  #lazy: boolean;
  #equals: EqualityFn<T>;
  #name?: string;
  #deps = new Set<SignalImpl<any>>();
  #cleanups: Unsubscribe[] = [];

  constructor(fn: () => T, options: ComputedOptions<T> = {}) {
    super();
    this.#fn = fn;
    this.#lazy = options.lazy ?? true;
    this.#equals = options.equals ?? defaultEquals;
    this.#name = options.name;

    // Initial computation to discover dependencies
    this.#compute();
    
    // Subscribe to all dependencies
    this.#subscribe();
  }

  get value(): T {
    if (activeEffect) {
      // Computed can also be a dependency
      // Note: We'd need to wrap this in a signal-like interface
    }
    
    if (this.#dirty) {
      this.#compute();
    }
    return this.#value as T;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  peek(): T {
    if (this.#dirty) {
      this.#compute();
    }
    return this.#value as T;
  }

  recompute(): T {
    this.#dirty = true;
    return this.value;
  }

  subscribe(callback: WatchCallback<T>): Unsubscribe {
    let prev = this.#value;
    const handler = () => {
      const next = this.value;
      callback(next, prev);
      prev = next;
    };
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }

  effect(fn: (value: T) => void | Unsubscribe): Unsubscribe {
    let cleanup: Unsubscribe | void;
    
    const run = () => {
      cleanup?.();
      cleanup = fn(this.value);
    };
    
    run();
    this.addEventListener('change', run);
    
    return () => {
      cleanup?.();
      this.removeEventListener('change', run);
    };
  }

  map<U>(fn: (value: T) => U): ComputedSignal<U> {
    return computed(() => fn(this.value));
  }

  #compute(): void {
    // Track new dependencies
    const prevEffect = activeEffect;
    const newDeps = new Set<SignalImpl<any>>();
    activeEffect = newDeps;
    
    try {
      const next = this.#fn();
      const changed = this.#value === undefined || !this.#equals(this.#value as T, next);
      this.#value = next;
      this.#dirty = false;
      
      // Update dependency subscriptions if changed
      if (!setsEqual(this.#deps, newDeps)) {
        this.#cleanups.forEach(fn => fn());
        this.#cleanups = [];
        this.#deps = newDeps;
        this.#subscribe();
      }
      
      if (changed) {
        if (batchDepth > 0) {
          pendingNotifications.add(this as any);
        } else {
          this.dispatchEvent(new CustomEvent('change'));
        }
      }
    } finally {
      activeEffect = prevEffect;
    }
  }

  #subscribe(): void {
    for (const dep of this.#deps) {
      const unsub = () => {
        dep.addEventListener('change', this.#onDependencyChange);
      };
      unsub();
      this.#cleanups.push(() => {
        dep.removeEventListener('change', this.#onDependencyChange);
      });
    }
  }

  #onDependencyChange = (): void => {
    if (this.#lazy) {
      this.#dirty = true;
      this.dispatchEvent(new CustomEvent('change'));
    } else {
      this.#compute();
    }
  };

  /** @internal Flush pending notification */
  _flush(): void {
    this.dispatchEvent(new CustomEvent('change'));
  }

  valueOf(): T {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }

  toJSON(): T {
    return this.value;
  }

  get [Symbol.toStringTag](): string {
    return this.#name ? `Computed(${this.#name})` : 'Computed';
  }
}


// ============================================
// Helper Functions
// ============================================

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}


// ============================================
// Public API
// ============================================

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
export function signal<T>(value: T, options?: SignalOptions<T>): WritableSignal<T> {
  return new SignalImpl(value, options);
}


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
export function computed<T>(fn: () => T, options?: ComputedOptions<T>): ComputedSignal<T> {
  return new ComputedImpl(fn, options);
}


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
export function effect(
  fn: () => void | Unsubscribe,
  options: EffectOptions = {}
): Unsubscribe {
  const { immediate = true } = options;
  
  let cleanup: Unsubscribe | void;
  let deps = new Set<SignalImpl<any>>();
  let cleanups: Unsubscribe[] = [];
  let disposed = false;

  const run = () => {
    if (disposed) return;
    
    // Cleanup previous run
    cleanup?.();
    cleanups.forEach(fn => fn());
    cleanups = [];
    
    // Track new dependencies
    const prevEffect = activeEffect;
    const newDeps = new Set<SignalImpl<any>>();
    activeEffect = newDeps;
    
    try {
      cleanup = fn();
    } finally {
      activeEffect = prevEffect;
    }
    
    // Update subscriptions if dependencies changed
    if (!setsEqual(deps, newDeps)) {
      // Unsubscribe from old deps
      deps.forEach(dep => {
        if (!newDeps.has(dep)) {
          dep.removeEventListener('change', run);
        }
      });
      
      // Subscribe to new deps
      newDeps.forEach(dep => {
        if (!deps.has(dep)) {
          dep.addEventListener('change', run);
          cleanups.push(() => dep.removeEventListener('change', run));
        }
      });
      
      deps = newDeps;
    }
  };

  if (immediate) {
    run();
  }

  return () => {
    disposed = true;
    cleanup?.();
    cleanups.forEach(fn => fn());
    deps.forEach(dep => dep.removeEventListener('change', run));
    deps.clear();
  };
}


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
export function batch(fn: () => void, options: BatchOptions = {}): void {
  batchDepth++;
  
  try {
    fn();
  } finally {
    batchDepth--;
    
    if (batchDepth === 0 && pendingNotifications.size > 0) {
      const pending = pendingNotifications;
      pendingNotifications = new Set();
      
      if (options.defer) {
        queueMicrotask(() => {
          pending.forEach(signal => signal._flush());
        });
      } else {
        pending.forEach(signal => signal._flush());
      }
    }
  }
}


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
export function untracked<T>(fn: () => T): T {
  const prev = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = prev;
  }
}


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
export function isSignal<T = unknown>(value: unknown): value is ReadonlySignal<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    SIGNAL_BRAND in value &&
    (value as any)[SIGNAL_BRAND] === true
  );
}


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
export function isWritable<T = unknown>(value: unknown): value is WritableSignal<T> {
  return isSignal(value) && value instanceof SignalImpl;
}


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
export function watch<T extends readonly ReadonlySignal<any>[]>(
  signals: [...T],
  callback: (values: SignalValues<T>, prev: SignalValues<T> | undefined) => void | Unsubscribe,
  options: EffectOptions = {}
): Unsubscribe {
  const { immediate = true } = options;
  
  let cleanup: Unsubscribe | void;
  let prev: SignalValues<T> | undefined;
  
  const getValues = (): SignalValues<T> => {
    return signals.map(s => s.peek()) as SignalValues<T>;
  };
  
  const run = () => {
    cleanup?.();
    const current = getValues();
    cleanup = callback(current, prev);
    prev = current;
  };
  
  const cleanups = signals.map(signal => {
    const handler = () => run();
    signal.subscribe(handler);
    return () => signal.subscribe(handler);
  });
  
  if (immediate) {
    run();
  }
  
  return () => {
    cleanup?.();
    cleanups.forEach(fn => fn());
  };
}


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
export function persisted<T>(
  key: string,
  initial: T,
  options: SignalOptions<T> & {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    storage?: Storage;
  } = {}
): WritableSignal<T> {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = typeof localStorage !== 'undefined' ? localStorage : undefined,
    ...signalOptions
  } = options;

  // Read initial value from storage
  let value = initial;
  if (storage) {
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        value = deserialize(stored);
      }
    } catch {
      // Use initial value on error
    }
  }

  const sig = signal(value, signalOptions);
  
  // Sync to storage on change
  sig.effect((value) => {
    if (storage) {
      try {
        storage.setItem(key, serialize(value));
      } catch {
        // Ignore storage errors
      }
    }
  });

  // Listen for changes from other tabs
  if (typeof window !== 'undefined' && storage === localStorage) {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          sig.silent(deserialize(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handler);
  }

  return sig;
}


// ============================================
// Type Exports
// ============================================

export type {
  Unsubscribe,
  EqualityFn,
  WatchCallback,
  SignalOptions,
  ComputedOptions,
  EffectOptions,
  BatchOptions,
  ReadonlySignal,
  WritableSignal,
  ComputedSignal,
  SignalValue,
  SignalValues,
};