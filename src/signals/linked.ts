/**
 * @module linkedSignal
 * 
 * Linked signals combine computed and writable signals: they automatically
 * update when dependencies change, but can also be manually overridden.
 * When dependencies change again, the signal recomputes from its source.
 * 
 * Perfect for forms, reset logic, and derived state that needs manual override.
 * 
 * @example Basic Usage
 * ```typescript
 * import { signal, linkedSignal } from '@doeixd/dom';
 * 
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * 
 * // Derives from sources, but can be overwritten
 * const fullName = linkedSignal(() => `${firstName.value} ${lastName.value}`);
 * 
 * console.log(fullName.value); // "John Doe"
 * 
 * // Manual override
 * fullName.set('Jane Smith');
 * console.log(fullName.value); // "Jane Smith"
 * 
 * // Source changes → recomputes, override is cleared
 * firstName.value = 'Bob';
 * console.log(fullName.value); // "Bob Doe"
 * ```
 */

import { computed, SIGNAL_BRAND } from './signals';
import type { 
  Unsubscribe, 
  ReadonlySignal, 
  WritableSignal,
  SignalOptions,
  EqualityFn,
  WatchCallback 
} from './signals';

// ============================================
// Types
// ============================================

/** Previous state passed to computation */
interface LinkedPrevious<S, T> {
  /** Previous source value (undefined on first run) */
  source: S | undefined;
  /** Previous linked signal value (undefined on first run) */
  value: T | undefined;
}

/** Computation function for linkedSignal */
type LinkedComputation<T> = () => T;

/** Computation function with previous state access */
type LinkedComputationWithPrevious<S, T> = (
  source: S,
  previous: LinkedPrevious<S, T>
) => T;

/** Source signal or getter */
type LinkedSource<S> = ReadonlySignal<S> | (() => S);

/** Simple linkedSignal options */
interface LinkedSignalOptions<T> extends SignalOptions<T> {
  /** 
   * If true, manual writes persist until explicitly reset.
   * If false (default), source changes always recompute.
   */
  sticky?: boolean;
}

/** Options for linkedSignal with explicit source */
interface LinkedSignalOptionsWithSource<S, T> extends LinkedSignalOptions<T> {
  /** Explicit source signal */
  source: LinkedSource<S>;
  /** Computation receiving source value and previous state */
  computation: LinkedComputationWithPrevious<S, T>;
}

/** Linked signal interface */
interface LinkedSignal<T> extends WritableSignal<T> {
  /** Whether the signal has been manually overridden */
  readonly isOverridden: boolean;
  
  /** 
   * Reset to computed value from sources.
   * Clears any manual override.
   */
  recompute(): T;
  
  /** 
   * Alias for recompute.
   * Useful semantically in form contexts.
   */
  resetToSource(): T;
  
  /**
   * Set value without marking as overridden.
   * Behaves as if the value came from computation.
   */
  setFromSource(value: T): void;
}


// ============================================
// Implementation
// ============================================

const LINKED_BRAND = Symbol('linkedSignal');

/** Active tracking context */
let activeLinkedEffect: Set<any> | null = null;

/**
 * Normalize source to a getter function
 */
function normalizeSource<S>(source: LinkedSource<S>): () => S {
  if (typeof source === 'function' && !('value' in source)) {
    return source as () => S;
  }
  return () => (source as ReadonlySignal<S>).value;
}

/**
 * Track dependencies during a computation
 */
function trackDependencies<T>(fn: () => T): { value: T; deps: Set<any> } {
  const deps = new Set<any>();
  const prevEffect = activeLinkedEffect;
  activeLinkedEffect = deps;
  
  try {
    const value = fn();
    return { value, deps };
  } finally {
    activeLinkedEffect = prevEffect;
  }
}


/**
 * LinkedSignal implementation
 */
class LinkedSignalImpl<S, T> extends EventTarget implements LinkedSignal<T> {
  readonly [LINKED_BRAND] = true as const;
  readonly [SIGNAL_BRAND] = true as const;
  
  #value: T | undefined;
  #prev: T | undefined;
  #sourceValue: S | undefined;
  #prevSourceValue: S | undefined;
  #isOverridden = false;
  #initialized = false;
  
  #getSource: () => S;
  #computation: LinkedComputationWithPrevious<S, T>;
  #equals: EqualityFn<T>;
  #sticky: boolean;
  #name?: string;
  
  #cleanups: Unsubscribe[] = [];

  constructor(
    source: () => S,
    computation: LinkedComputationWithPrevious<S, T>,
    options: LinkedSignalOptions<T> = {}
  ) {
    super();
    this.#getSource = source;
    this.#computation = computation;
    this.#equals = options.equals ?? Object.is;
    this.#sticky = options.sticky ?? false;
    this.#name = options.name;
    
    // Initial computation
    this.#compute();
    this.#initialized = true;
  }

  // ============ ReadonlySignal ============

  get value(): T {
    if (activeLinkedEffect) {
      activeLinkedEffect.add(this);
    }
    return this.#value as T;
  }

  set value(next: T) {
    this.set(next);
  }

  get prev(): T | undefined {
    return this.#prev;
  }

  peek(): T {
    return this.#value as T;
  }

  // ============ WritableSignal ============

  /**
   * Manually set the value, marking it as overridden.
   * 
   * The override persists until:
   * - A source dependency changes (recomputes)
   * - `reset()` or `recompute()` is called
   * - `sticky: true` was set (then persists until explicit reset)
   */
  set(next: T): void {
    if (this.#initialized && this.#equals(this.#value as T, next)) return;
    
    this.#prev = this.#value;
    this.#value = next;
    this.#isOverridden = true;
    
    this.#notify();
  }

  /**
   * Update using current value.
   */
  update(fn: (current: T) => T): void {
    this.set(fn(this.#value as T));
  }

  /**
   * Set without triggering notifications.
   */
  silent(next: T): void {
    this.#prev = this.#value;
    this.#value = next;
    this.#isOverridden = true;
  }

  /**
   * Reset to initial computed value.
   */
  reset(): void {
    this.recompute();
  }

  // ============ LinkedSignal ============

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  /**
   * Force recomputation from sources.
   * Clears any manual override.
   */
  recompute(): T {
    this.#isOverridden = false;
    this.#compute();
    return this.#value as T;
  }

  /**
   * Alias for recompute - semantically clear for form resets.
   */
  resetToSource(): T {
    return this.recompute();
  }

  /**
   * Set value as if it came from computation.
   * Does not mark as overridden.
   */
  setFromSource(value: T): void {
    if (this.#equals(this.#value as T, value)) return;
    
    this.#prev = this.#value;
    this.#value = value;
    this.#isOverridden = false;
    
    this.#notify();
  }

  // ============ Subscription ============

  subscribe(callback: WatchCallback<T>): Unsubscribe {
    const handler = () => callback(this.#value as T, this.#prev);
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }

  effect(fn: (value: T) => void | Unsubscribe): Unsubscribe {
    let cleanup: Unsubscribe | void;
    
    const run = () => {
      cleanup?.();
      cleanup = fn(this.#value as T);
    };
    
    run();
    this.addEventListener('change', run);
    
    return () => {
      cleanup?.();
      this.removeEventListener('change', run);
    };
  }

  map<U>(fn: (value: T) => U): ReadonlySignal<U> {
    return computed(() => fn(this.value));
  }

  // ============ Private ============

  #compute(): void {
    // Get source value and track dependencies
    const { value: sourceValue, deps: sourceDeps } = trackDependencies(this.#getSource);
    
    // Check if source actually changed
    const sourceChanged = !Object.is(this.#sourceValue, sourceValue);
    
    // If sticky mode and overridden, only update on explicit reset
    if (this.#sticky && this.#isOverridden && this.#initialized) {
      this.#prevSourceValue = this.#sourceValue;
      this.#sourceValue = sourceValue;
      this.#updateSubscriptions(sourceDeps);
      return;
    }
    
    // If overridden but source changed, we recompute
    if (this.#isOverridden && !sourceChanged && this.#initialized) {
      return;
    }
    
    // Build previous state
    const previous: LinkedPrevious<S, T> = {
      source: this.#prevSourceValue,
      value: this.#prev
    };
    
    // Store previous source
    this.#prevSourceValue = this.#sourceValue;
    this.#sourceValue = sourceValue;
    
    // Run computation with full dependency tracking
    const { value: nextValue, deps: computationDeps } = trackDependencies(() => 
      this.#computation(sourceValue, previous)
    );
    
    // Merge all dependencies
    const allDeps = new Set([...sourceDeps, ...computationDeps]);
    
    // Update value if changed
    const valueChanged = !this.#initialized || !this.#equals(this.#value as T, nextValue);
    
    if (valueChanged) {
      this.#prev = this.#value;
      this.#value = nextValue;
      this.#isOverridden = false;
      
      if (this.#initialized) {
        this.#notify();
      }
    }
    
    // Update subscriptions
    this.#updateSubscriptions(allDeps);
  }

  #updateSubscriptions(newDeps: Set<any>): void {
    // Unsubscribe from deps no longer needed
    this.#cleanups.forEach(fn => fn());
    this.#cleanups = [];
    
    // Subscribe to all dependencies
    for (const dep of newDeps) {
      if (dep && typeof dep.addEventListener === 'function') {
        const handler = () => this.#onDependencyChange();
        dep.addEventListener('change', handler);
        this.#cleanups.push(() => dep.removeEventListener('change', handler));
      }
    }
    
  }

  #onDependencyChange = (): void => {
    // Recompute when dependencies change
    this.#compute();
  };

  #notify(): void {
    this.dispatchEvent(new CustomEvent('change'));
  }

  valueOf(): T {
    return this.#value as T;
  }

  toString(): string {
    return String(this.#value);
  }

  toJSON(): T {
    return this.#value as T;
  }

  get [Symbol.toStringTag](): string {
    return this.#name ? `LinkedSignal(${this.#name})` : 'LinkedSignal';
  }
}


// ============================================
// Public API
// ============================================

/**
 * Creates a linked signal that combines computed and writable behavior.
 * 
 * Linked signals automatically recompute when their dependencies change,
 * but can also be manually overwritten. When dependencies change after
 * a manual override, the signal recomputes from its sources.
 * 
 * @param computation - Function that computes the value (dependencies auto-tracked)
 * @param options - Signal options
 * @returns A linked signal
 * 
 * @example Basic Usage
 * ```typescript
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * 
 * const fullName = linkedSignal(() => `${firstName.value} ${lastName.value}`);
 * 
 * console.log(fullName.value); // "John Doe"
 * 
 * // Override manually
 * fullName.set('Custom Name');
 * console.log(fullName.value); // "Custom Name"
 * console.log(fullName.isOverridden); // true
 * 
 * // Source change recomputes
 * firstName.value = 'Jane';
 * console.log(fullName.value); // "Jane Doe"
 * console.log(fullName.isOverridden); // false
 * ```
 * 
 * @example Form Field Reset
 * ```typescript
 * const selectedUser = signal<User | null>(null);
 * 
 * // Form field derives from selection, but can be edited
 * const emailField = linkedSignal(() => selectedUser.value?.email ?? '');
 * 
 * // User edits the field
 * emailField.set('custom@example.com');
 * 
 * // Reset button → back to derived value
 * emailField.resetToSource();
 * 
 * // Or: selecting new user auto-resets
 * selectedUser.value = anotherUser; // emailField recomputes
 * ```
 * 
 * @example With Previous Value Access
 * ```typescript
 * const count = signal(0);
 * 
 * const doubled = linkedSignal({
 *   source: () => count.value,
 *   computation: (source, prev) => {
 *     console.log(`Previous: ${prev.value}, Source was: ${prev.source}`);
 *     return source * 2;
 *   }
 * });
 * ```
 * 
 * @example Sticky Override Mode
 * ```typescript
 * const source = signal('default');
 * 
 * // Override persists even when source changes
 * const derived = linkedSignal(() => source.value.toUpperCase(), {
 *   sticky: true
 * });
 * 
 * derived.set('CUSTOM');
 * source.value = 'changed'; // derived stays "CUSTOM"
 * 
 * derived.resetToSource(); // Now it's "CHANGED"
 * ```
 * 
 * @example Conditional Computation
 * ```typescript
 * const mode = signal<'auto' | 'manual'>('auto');
 * const autoValue = signal(100);
 * 
 * const value = linkedSignal(() => {
 *   if (mode.value === 'auto') {
 *     return autoValue.value;
 *   }
 *   // In manual mode, just return current (or previous) value
 *   return value.peek() ?? 0;
 * });
 * 
 * // Auto mode: tracks autoValue
 * autoValue.value = 200;
 * console.log(value.value); // 200
 * 
 * // Switch to manual
 * mode.value = 'manual';
 * value.set(500);
 * autoValue.value = 300; // Ignored in manual mode
 * console.log(value.value); // 500
 * ```
 */
export function linkedSignal<T>(
  computation: LinkedComputation<T>,
  options?: LinkedSignalOptions<T>
): LinkedSignal<T>;

/**
 * Creates a linked signal with explicit source and previous state access.
 * 
 * @param options - Options including source and computation
 * @returns A linked signal
 * 
 * @example History-Aware Computation
 * ```typescript
 * const input = signal('');
 * 
 * const processed = linkedSignal({
 *   source: () => input.value,
 *   computation: (current, prev) => {
 *     // Only process if changed significantly
 *     if (prev.source && current.length - prev.source.length < 3) {
 *       return prev.value ?? current; // Keep previous result
 *     }
 *     return expensiveProcess(current);
 *   }
 * });
 * ```
 * 
 * @example Animated Transitions
 * ```typescript
 * const target = signal(0);
 * 
 * const animated = linkedSignal({
 *   source: () => target.value,
 *   computation: (targetVal, prev) => {
 *     // Smooth transition from previous
 *     const from = prev.value ?? targetVal;
 *     return lerp(from, targetVal, 0.1);
 *   }
 * });
 * ```
 */
export function linkedSignal<S, T>(
  options: LinkedSignalOptionsWithSource<S, T>
): LinkedSignal<T>;

// Implementation
export function linkedSignal<S, T>(
  computationOrOptions: LinkedComputation<T> | LinkedSignalOptionsWithSource<S, T>,
  options?: LinkedSignalOptions<T>
): LinkedSignal<T> {
  if (typeof computationOrOptions === 'function') {
    // Simple form: linkedSignal(() => ...)
    const computation = computationOrOptions;
    return new LinkedSignalImpl<undefined, T>(
      () => undefined,
      () => computation(),
      options ?? {}
    );
  } else {
    // Full form: linkedSignal({ source, computation })
    const opts = computationOrOptions;
    const getSource = normalizeSource(opts.source);
    return new LinkedSignalImpl<S, T>(
      getSource,
      opts.computation,
      opts
    );
  }
}


/**
 * Check if a value is a linked signal.
 * 
 * @example
 * ```typescript
 * const regular = signal(0);
 * const comp = computed(() => regular.value * 2);
 * const linked = linkedSignal(() => regular.value * 2);
 * 
 * isLinkedSignal(regular); // false
 * isLinkedSignal(comp);    // false
 * isLinkedSignal(linked);  // true
 * ```
 */
export function isLinkedSignal<T = unknown>(
  value: unknown
): value is LinkedSignal<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    LINKED_BRAND in value &&
    (value as any)[LINKED_BRAND] === true
  );
}


// ============================================
// Utility Functions
// ============================================

/**
 * Create multiple linked signals from a source object.
 * 
 * Useful for form state where each field derives from a source
 * but can be independently edited.
 * 
 * @param source - Source signal containing object
 * @param keys - Keys to create linked signals for
 * @returns Object of linked signals
 * 
 * @example Form Fields
 * ```typescript
 * const user = signal({
 *   name: 'John',
 *   email: 'john@example.com',
 *   age: 30
 * });
 * 
 * const fields = linkedFields(user, ['name', 'email', 'age']);
 * 
 * // Edit individual fields
 * fields.name.set('Jane');
 * fields.email.set('jane@example.com');
 * 
 * // Reset all to source
 * Object.values(fields).forEach(f => f.resetToSource());
 * 
 * // Or when source changes, all reset automatically
 * user.value = { name: 'Bob', email: 'bob@example.com', age: 25 };
 * ```
 */
export function linkedFields<T extends object, K extends keyof T>(
  source: ReadonlySignal<T>,
  keys: K[]
): { [P in K]: LinkedSignal<T[P]> } {
  const result = {} as { [P in K]: LinkedSignal<T[P]> };
  
  for (const key of keys) {
    result[key] = linkedSignal(() => source.value[key]);
  }
  
  return result;
}


/**
 * Create a linked signal that syncs with a specific path in a store.
 * 
 * @param store - Source store
 * @param path - Path to sync with
 * @returns Linked signal for that path
 * 
 * @example
 * ```typescript
 * const state = store({
 *   user: { name: 'John', settings: { theme: 'dark' } }
 * });
 * 
 * const theme = linkedPath(state, 'user.settings.theme');
 * 
 * theme.set('light'); // Override
 * state.set('user.settings.theme', 'system'); // Recomputes
 * ```
 */
export function linkedPath<T extends object, P extends string>(
  storeSignal: { value: T; get: (path: P) => any },
  path: P
): LinkedSignal<any> {
  return linkedSignal(() => storeSignal.get(path));
}


/**
 * Create a form state manager with linked signals.
 * 
 * @param initial - Initial form data signal
 * @returns Form state with linked fields and utilities
 * 
 * @example
 * ```typescript
 * const userData = signal({ name: '', email: '', age: 0 });
 * 
 * const form = linkedForm(userData);
 * 
 * // Access fields
 * form.fields.name.set('John');
 * form.fields.email.set('john@example.com');
 * 
 * // Check if any field was modified
 * console.log(form.isDirty.value); // true
 * 
 * // Get current values
 * console.log(form.values.value); // { name: 'John', email: '...', age: 0 }
 * 
 * // Reset all fields
 * form.reset();
 * 
 * // Reset specific field
 * form.resetField('name');
 * ```
 */
export function linkedForm<T extends object>(
  initial: ReadonlySignal<T>
): {
  fields: { [K in keyof T]: LinkedSignal<T[K]> };
  values: ReadonlySignal<T>;
  isDirty: ReadonlySignal<boolean>;
  dirtyFields: ReadonlySignal<(keyof T)[]>;
  reset: () => void;
  resetField: (key: keyof T) => void;
} {
  const keys = Object.keys(initial.value) as (keyof T)[];
  const fields = {} as { [K in keyof T]: LinkedSignal<T[K]> };
  
  for (const key of keys) {
    fields[key] = linkedSignal(() => initial.value[key]);
  }
  
  const values = computed(() => {
    const result = {} as T;
    for (const key of keys) {
      result[key] = fields[key].value;
    }
    return result;
  });
  
  const dirtyFields = computed(() => 
    keys.filter(key => fields[key].isOverridden)
  );
  
  const isDirty = computed(() => dirtyFields.value.length > 0);
  
  return {
    fields,
    values,
    isDirty,
    dirtyFields,
    reset: () => {
      for (const key of keys) {
        fields[key].resetToSource();
      }
    },
    resetField: (key: keyof T) => {
      fields[key].resetToSource();
    }
  };
}


// ============================================
// Type Exports
// ============================================

export type {
  LinkedPrevious,
  LinkedComputation,
  LinkedComputationWithPrevious,
  LinkedSource,
  LinkedSignalOptions,
  LinkedSignalOptionsWithSource,
  LinkedSignal,
};

export { LINKED_BRAND };