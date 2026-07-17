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
import type { ReadonlySignal, WritableSignal, SignalOptions } from './signals';
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
type LinkedComputationWithPrevious<S, T> = (source: S, previous: LinkedPrevious<S, T>) => T;
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
declare const LINKED_BRAND: unique symbol;
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
export declare function linkedSignal<T>(computation: LinkedComputation<T>, options?: LinkedSignalOptions<T>): LinkedSignal<T>;
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
export declare function linkedSignal<S, T>(options: LinkedSignalOptionsWithSource<S, T>): LinkedSignal<T>;
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
export declare function isLinkedSignal<T = unknown>(value: unknown): value is LinkedSignal<T>;
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
export declare function linkedFields<T extends object, K extends keyof T>(source: ReadonlySignal<T>, keys: K[]): {
    [P in K]: LinkedSignal<T[P]>;
};
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
export declare function linkedPath<T extends object, P extends string>(storeSignal: {
    value: T;
    get: (path: P) => any;
}, path: P): LinkedSignal<any>;
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
export declare function linkedForm<T extends object>(initial: ReadonlySignal<T>): {
    fields: {
        [K in keyof T]: LinkedSignal<T[K]>;
    };
    values: ReadonlySignal<T>;
    isDirty: ReadonlySignal<boolean>;
    dirtyFields: ReadonlySignal<(keyof T)[]>;
    reset: () => void;
    resetField: (key: keyof T) => void;
};
export type { LinkedPrevious, LinkedComputation, LinkedComputationWithPrevious, LinkedSource, LinkedSignalOptions, LinkedSignalOptionsWithSource, LinkedSignal, };
export { LINKED_BRAND };
//# sourceMappingURL=linked.d.ts.map