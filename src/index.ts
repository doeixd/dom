/**
 * fdom (Functional DOM) - v2.0.0
 * ==========================================
 * A production-grade, target-first, type-safe DOM library.
 *
 * -----------------------------------------------------------------------------
 * 🧠 DESIGN PHILOSOPHY
 * -----------------------------------------------------------------------------
 * 1. Target-First: `Action(Element)(Config)` pattern for intuitive chaining.
 * 2. Curried: Functions return closures for composition/piping.
 * 3. Null-Safe: All functions fail gracefully on `null`/`undefined` targets.
 * 4. Type-Safe: Full Generics for HTML Elements, Events, and Return types.
 *
 * -----------------------------------------------------------------------------
 * 📚 API DIRECTORY (27 MODULES)
 * -----------------------------------------------------------------------------
 *
 * 🟢 DOM CORE
 *    1. Querying ......... find, findAll, closest
 *    2. Events ........... on, onDelegated, dispatch
 *    3. Manipulation ..... modify, css, tempStyle
 *    4. Structure ........ append, prepend, after, before, remove, wrap
 *    5. Creation ......... el, html, htmlMany, clone
 *
 * 🔵 STATE & ATTRIBUTES
 *    6. Classes .......... cls (add/remove/toggle), watchClass
 *    7. Attributes ....... Data (get/set/read/bind), watchAttr, watchText
 *    12. Objects ......... Obj (clone, isEqual, pick, omit)
 *    14. Refs ............ refs, groupRefs (data-ref handling)
 *    16. Cycling ......... cycleClass (State machines)
 *
 * 🟡 LIFECYCLE & OBSERVATION
 *    8. Lifecycle ........ onReady, onMount, waitFor
 *    17. Cleanup ......... stripListeners, instantiate, cloneMany
 *    20. Timing .......... debounce, throttle
 *    25. Groups .......... createListenerGroup (Batch cleanup)
 *    26. Signals ......... Signal (AbortController wrappers)
 *
 * 🟣 LAYOUT & NAVIGATION
 *    10. Navigation ...... Traverse (parent, children, siblings, next, prev)
 *    11. CSS Utils ....... CssVar, computed, injectStyles, waitTransition
 *    15. Color ........... toColorSpace (Color mix utils)
 *    18. Geometry ........ rect, offset, isVisible
 *    19. Scroll/Focus .... scrollInto, focus, blur
 *
 * 🟠 DATA & NETWORK
 *    9. URL/Form ......... Params, Form (serialize/populate)
 *    13. Collections ..... batch, groupBy
 *    21. Storage ......... Local, Session (Typed wrappers)
 *    22. Cookies ......... Cookie (get/set/remove)
 *    23. Network ......... Http (get/post/put/delete)
 *    24. PWA ............. SW (Service Worker reg/post)
 *    27. Pub/Sub ......... createBus (Typed Event Emitter)
 *
 * @module fdom
 * @author Patrick Glenn
 * @license MIT
 */

// =============================================================================
// 0. TYPES & HELPERS
// =============================================================================

/**
 * Infers a DOM element type from a CSS selector string.
 * 
 * Supports:
 * - Tag names: `'div'` → `HTMLDivElement`
 * - SVG tags: `'svg'` → `SVGSVGElement`
 * - ID selectors: `'#app'` → `HTMLElement`
 * - Class selectors: `'.card'` → `HTMLElement`
 * - Complex selectors: `'div.card'` → `HTMLElement`
 * 
 * @template S - The selector string literal type
 * 
 * @example
 * ```typescript
 * type ButtonEl = ParseSelector<'button'>; // HTMLButtonElement
 * type AnchorEl = ParseSelector<'a'>; // HTMLAnchorElement
 * type SvgEl = ParseSelector<'svg'>; // SVGSVGElement
 * ```
 */
export type ParseSelector<S extends string> =
  S extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[S]
  : S extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[S]
  : S extends `#${string}` ? HTMLElement
  : S extends `.${string}` ? HTMLElement
  : HTMLElement;

/**
 * A cleanup/unsubscribe function returned by event listeners and subscriptions.
 * 
 * Call this function to remove the listener and free resources.
 * 
 * @example
 * ```typescript
 * const cleanup = on(button)('click', handler);
 * // Later...
 * cleanup(); // Removes the event listener
 * ```
 */
export type Unsubscribe = () => void;

/**
 * Event map for HTML elements, extensible for custom events.
 * 
 * @template T - Additional custom event mappings
 * 
 * @example
 * ```typescript
 * type MyEvents = EventMap<{
 *   'custom:save': CustomEvent<{ id: number }>;
 *   'custom:delete': CustomEvent<{ id: number }>;
 * }>;
 * ```
 */
export type EventMap<T extends Record<string, Event> = {}> = HTMLElementEventMap & T;

/**
 * Extracts the detail type from a CustomEvent.
 * 
 * @template T - The CustomEvent type
 * 
 * @example
 * ```typescript
 * type SaveEvent = CustomEvent<{ id: number }>;
 * type Detail = ExtractEventDetail<SaveEvent>; // { id: number }
 * ```
 */
export type ExtractEventDetail<T> = T extends CustomEvent<infer D> ? D : never;

/**
 * Properties for creating/modifying elements.
 * 
 * Supports declarative configuration of:
 * - Text content
 * - HTML content
 * - Inline styles
 * - Data attributes
 * - CSS classes
 * - HTML attributes
 * - Form element properties
 * 
 * @example
 * ```typescript
 * const props: ElementProps = {
 *   text: 'Click me',
 *   class: { active: true, disabled: false },
 *   dataset: { userId: 123, role: 'admin' },
 *   style: { color: 'red', fontSize: '16px' },
 *   attr: { 'aria-label': 'Submit button' }
 * };
 * ```
 */
export interface ElementProps {
  /** Sets innerText (safer than html) */
  text?: string;
  /** Sets innerHTML (use with caution - XSS risk) */
  html?: string;
  /** Inline CSS styles */
  style?: Partial<CSSStyleDeclaration>;
  /** Data attributes (data-*) - auto-converts to kebab-case */
  dataset?: Record<string, string | number | boolean | null | undefined>;
  /** CSS classes with boolean toggles */
  class?: Record<string, boolean>;
  /** HTML attributes */
  attr?: Record<string, string | number | boolean | null | undefined>;
  /** Value for form inputs */
  value?: string | number;
  /** Disabled state for form inputs */
  disabled?: boolean;
}

/**
 * Strict element properties with element-specific validation.
 * 
 * Provides better type safety by constraining properties based on element type.
 * 
 * @template T - The HTML element type
 * 
 * @example
 * ```typescript
 * const inputProps: StrictElementProps<HTMLInputElement> = {
 *   value: 'test',
 *   disabled: true,
 *   attr: { type: 'text', placeholder: 'Enter name' }
 * };
 * ```
 */
export type StrictElementProps<T extends HTMLElement> = ElementProps & {
  value?: T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement ? string | number : never;
  disabled?: T extends HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement ? boolean : never;
};

/**
 * Makes all properties in T deeply readonly.
 * 
 * @template T - The type to make readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Makes all properties in T deeply partial.
 * 
 * @template T - The type to make partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Internal: Normalizes content into an array of Nodes.
 * 
 * Handles:
 * - Flattening nested arrays
 * - Filtering out null/undefined/false
 * - Converting strings to text nodes
 * - Preserving existing Node instances
 * 
 * @internal
 */
const _nodes = (args: any[]): Node[] =>
  args.flat()
    .filter(x => x != null && x !== false)
    .map(x => x instanceof Node ? x : document.createTextNode(String(x)));

/**
 * Hybrid Function Builder.
 * Creates a function that supports both Curried and Imperative usage.
 * 
 * @template T - The Target type (Element, string, etc)
 * @template A - The Arguments tuple type
 * @template R - The Return type
 * 
 * @example
 * const add = def((el: HTMLElement, cls: string) => el.classList.add(cls));
 * 
 * // Usage 1: Imperative (Cleaner DX)
 * add(div, 'active');
 * 
 * // Usage 2: Curried (Pipeline friendly)
 * pipe(
 *   find('.btn'),
 *   el => add(el)('active')
 * );
 */
export const def = <T, A extends any[], R>(
  // The implementation function takes target + args all at once
  fn: (target: T | null, ...args: A) => R
) => {
  // Overload 1: Called with arguments -> Execute immediately
  function wrapper(target: T | null, ...args: A): R;

  // Overload 2: Called with just target -> Return curried function
  function wrapper(target: T | null): (...args: A) => R;

  // Implementation
  function wrapper(target: T | null, ...args: any[]) {
    // If we have extra args, run immediately
    if (args.length > 0) {
      // @ts-ignore - spread is safe here due to generics
      return fn(target, ...args);
    }
    // Otherwise return the closure
    return (...lateArgs: A) => fn(target, ...lateArgs);
  }

  return wrapper;
};

// =============================================================================
// 1. QUERYING
// =============================================================================

/**
 * Finds the first element matching the selector.
 *
 * Overloads allow calling in two ways:
 * 1. `find(root)(selector)` — search within a specific root (default: document)
 * 2. `find(selector)` — root is implicitly `document`
 *
 * @template S - CSS selector (literal string for best inference)
 *
 * @overload
 * @param selector - The selector to search for within `document`
 * @returns The matched element or `null`, inferred from selector
 *
 * @example
 * // String-first API
 * const btn = find("button");   // HTMLButtonElement | null
 * const app = find("#app");     // HTMLElement | null
 *
 * @overload
 * @param root - The root to search within (defaults to document)
 * @returns A function that accepts a selector and returns the matched element
 *
 * @example
 * // Curried API
 * const findIn = find(document.querySelector(".card")!);
 * const title = findIn("h1");   // HTMLHeadingElement | null
 */
export function find<S extends string>(
  selector: S
): ParseSelector<S> | null;

export function find(root?: ParentNode):
  <S extends string>(selector: S) => ParseSelector<S> | null;

export function find(arg: any) {
  // Case 1: string passed — treat as selector with implicit document root
  if (typeof arg === "string") {
    const selector = arg;
    return document.querySelector(selector) as any;
  }

  // Case 2: root passed — return curried selector function
  const root: ParentNode = arg ?? document;
  return <S extends string>(selector: S): ParseSelector<S> | null => {
    return root.querySelector(selector) as ParseSelector<S> | null;
  };
}


/**
 * Finds all elements matching the selector.
 *
 * Supports two call styles:
 * 1. `findAll(selector)` — searches `document`
 * 2. `findAll(root)(selector)` — searches a specific root
 *
 * @template S - CSS selector (literal string for best inference)
 *
 * @overload
 * @param selector - Selector to search for within `document`
 * @returns Array of matched elements (empty if none)
 *
 * @example
 * const items = findAll("li");   // HTMLLIElement[]
 *
 * @overload
 * @param root - The root to search within (defaults to document)
 * @returns Function that accepts a selector and returns an array of elements
 *
 * @example
 * const findInside = findAll(container);
 * const inputs = findInside("input");  // HTMLInputElement[]
 */
export function findAll<S extends string>(
  selector: S
): ParseSelector<S>[];

export function findAll(root?: ParentNode):
  <S extends string>(selector: S) => ParseSelector<S>[];

export function findAll(arg: any) {
  if (typeof arg === "string") {
    const selector = arg;
    return Array.from(document.querySelectorAll(selector)) as any[];
  }

  const root: ParentNode = arg ?? document;
  return <S extends string>(selector: S): ParseSelector<S>[] => {
    return Array.from(root.querySelectorAll(selector)) as ParseSelector<S>[];
  };
}


/**
 * Finds the closest ancestor (including self) matching the selector.
 *
 * Supports:
 * 1. `closest(selector)` — uses `document.documentElement` as the starting point
 * 2. `closest(element)(selector)` — starts from a specific element
 *
 * Note: Using `closest(selector)` alone is rarely useful unless you
 * intentionally want to search from the root element.
 *
 * @template S - CSS selector (literal type for best inference)
 *
 * @overload
 * @param selector - Selector to match when starting at `document.documentElement`
 * @returns The matched ancestor or `null`
 *
 * @example
 * const htmlOrNull = closest("html");
 *
 * @overload
 * @param element - Starting element (null-safe)
 * @returns Function accepting a selector that returns the matched ancestor
 *
 * @example
 * const card = closest(button)(".card"); // HTMLElement | null
 */
export function closest<S extends string>(
  selector: S
): ParseSelector<S> | null;

export function closest(element: Element | null):
  <S extends string>(selector: S) => ParseSelector<S> | null;

export function closest(arg: any) {
  if (typeof arg === "string") {
    const selector = arg;
    return document.documentElement.closest(selector) as any;
  }

  const element: Element | null = arg;
  return <S extends string>(selector: S): ParseSelector<S> | null => {
    return element?.closest(selector) as ParseSelector<S> | null;
  };
}


/**
 * Checks whether an element matching the selector exists.
 *
 * Overloads:
 * 1. `exists(selector)` — searches `document`
 * 2. `exists(root)(selector)` — searches within a specific root
 *
 * @template S - CSS selector (literal for best inference)
 *
 * @overload
 * @param selector - Selector to test within `document`
 * @returns `true` if a matching element exists, otherwise `false`
 *
 * @example
 * exists("button");    // boolean
 * exists("#app");      // boolean
 */
export function exists<S extends string>(
  selector: S
): boolean;

export function exists(root?: ParentNode):
  <S extends string>(selector: S) => boolean;

export function exists(arg: any) {
  if (typeof arg === "string") {
    return document.querySelector(arg) !== null;
  }

  const root: ParentNode = arg ?? document;
  return <S extends string>(selector: S): boolean => {
    return root.querySelector(selector) !== null;
  };
}


/**
 * Checks whether a given element contains a descendant matching the selector.
 *
 * Overloads:
 * 1. `has(selector)` — checks within `document`
 * 2. `has(element)(selector)` — checks within a given element
 *
 * Null-safe: Passing `null` returns a function that always returns false.
 *
 * @template S - CSS selector string
 *
 * @overload
 * @param selector - Selector checked inside `document`
 * @returns `true` if a match exists, otherwise `false`
 *
 * @example
 * has(".card");  // boolean
 *
 * @overload
 * @param element - Element to test within (null-safe)
 * @returns Function testing a selector inside that element
 *
 * @example
 * const card = document.querySelector(".card");
 * const result = has(card)("button");
 */
export function has<S extends string>(
  selector: S
): boolean;

export function has(element: ParentNode | null):
  <S extends string>(selector: S) => boolean;

export function has(arg: any) {
  if (typeof arg === "string") {
    return document.querySelector(arg) !== null;
  }

  const root: ParentNode | null = arg;
  return <S extends string>(selector: S): boolean => {
    if (!root) return false;
    return root.querySelector(selector) !== null;
  };
}

/**
 * Returns the index of a node among its siblings.
 *
 * Overloads:
 * 1. `index(node)` — returns the node's index or -1
 * 2. `index(root)(node)` — curries the "list parent" (rare but consistent)
 *
 * Note: When called as `index(node)`, the parent is automatically the node's
 * actual parent element.
 *
 * @example
 * const item = document.querySelector("li");
 * index(item);  // 0, 1, 2, ...
 *
 * @example
 * // Curried
 * const list = document.querySelector("ul");
 * index(list)(someLi);
 */
export function index(node: Element | null): number;

export function index(root: ParentNode | null):
  (node: Element | null) => number;

export function index(arg: any): any {
  // Case: Direct index(node)
  if (!(arg instanceof Element) && arg !== null) {
    // Treat as curried root
    const root: ParentNode | null = arg;
    return (node: Element | null): number => {
      if (!root || !node) return -1;
      const children = Array.from(root.children);
      return children.indexOf(node);
    };
  }

  // Direct element case
  const node: Element | null = arg;
  if (!node || !node.parentElement) return -1;
  return Array.from(node.parentElement.children).indexOf(node);
}

/**
 * Returns all siblings of an element (excluding the element itself).
 *
 * Overloads:
 * 1. `siblings(node)` — returns its siblings
 * 2. `siblings(root)(node)` — sibling list relative to a specific parent
 *
 * Null-safe: returns an empty array if `node` or parent is null.
 *
 * @example
 * const btn = document.querySelector("button");
 * const sibs = siblings(btn);   // Element[]
 *
 * @example
 * const list = document.querySelector("ul");
 * const sibsOf = siblings(list);
 * sibsOf(list.querySelector("li"));
 */
export function siblings(node: Element | null): Element[];

export function siblings(root: ParentNode | null):
  (node: Element | null) => Element[];

export function siblings(arg: any): any {
  if (!(arg instanceof Element) && arg !== null) {
    const root: ParentNode | null = arg;
    return (node: Element | null): Element[] => {
      if (!root || !node) return [];
      return Array.from(root.children).filter(el => el !== node);
    };
  }

  const node: Element | null = arg;
  if (!node || !node.parentElement) return [];
  return Array.from(node.parentElement.children).filter(el => el !== node);
}



// =============================================================================
// 2. EVENTS
// =============================================================================

/**
 * Attaches an event listener to the target element.
 *
 * Returns a cleanup function to remove the listener. Supports all standard
 * DOM events with full type inference. The handler receives both the event
 * and the target element for convenience.
 *
 * @template T - The event target type (EventTarget or more specific)
 * @template K - The event type key from HTMLElementEventMap
 * @param target - The element to attach the listener to (null-safe)
 * @returns A curried function that accepts event type, handler, and options
 *
 * @example
 * ```typescript
 * // Basic click handler
 * const button = document.querySelector('button');
 * const cleanup = on(button)('click', (e, target) => {
 *   console.log('Clicked!', target); // target is typed as the button
 *   e.preventDefault();
 * });
 *
 * // Later: remove the listener
 * cleanup();
 *
 * // Input events with type inference
 * const input = document.querySelector('input');
 * on(input)('input', (e) => {
 *   console.log(e.target.value); // e is InputEvent
 * });
 *
 * // Keyboard events
 * on(document)('keydown', (e) => {
 *   if (e.key === 'Escape') {
 *     console.log('Escape pressed');
 *   }
 * });
 *
 * // With options (capture, once, passive)
 * on(window)('scroll', handler, { passive: true });
 * on(button)('click', handler, { once: true });
 *
 * // Null-safe: returns no-op cleanup if target is null
 * const missing = document.querySelector('.missing');
 * const noop = on(missing)('click', handler); // Safe, returns () => {}
 * ```
 */
export const on = <T extends EventTarget = EventTarget>(target: T | null) => {
  return <K extends keyof HTMLElementEventMap>(
    eventType: K,
    handler: (event: HTMLElementEventMap[K], target: T) => void,
    options: boolean | AddEventListenerOptions = false
  ): Unsubscribe => {
    if (!target) return () => { };

    const listener = (e: Event) => handler(e as HTMLElementEventMap[K], target);
    target.addEventListener(eventType, listener, options);
    return () => target.removeEventListener(eventType, listener, options);
  };
};

/**
 * Attaches a **Delegated Event Listener** using event bubbling.
 * 
 * 🧠 **Architecture**: `Root -> Selector -> Event`
 * This ordering allows you to group interactions by the target element type.
 * 
 * 🛡️ **Type Safety**:
 * - The `match` argument is inferred from the CSS selector (e.g. `'button'` -> `HTMLButtonElement`).
 * - The `event` argument is inferred from the event name (e.g. `'click'` -> `MouseEvent`).
 * 
 * @param root - The container element (e.g. `<ul>`, `form`, `document`).
 * 
 * @example
 * ```typescript
 * // 1. Define the scope (e.g. a User Table)
 * const table = find(document)('#user-table');
 * const onTable = onDelegated(table);
 * 
 * // 2. Define interactions for specific child elements
 * // Type inference knows 'tr' is HTMLTableRowElement
 * const onRow = onTable('tr');
 * 
 * onRow('click', (e, row) => {
 *   console.log('Row clicked', row.dataset.id);
 *   cls.toggle(row)('selected');
 * });
 * 
 * // 3. Define interactions for buttons
 * // Type inference knows 'button.delete' is HTMLButtonElement
 * onTable('button.delete')('click', (e, btn) => {
 *   e.stopPropagation();
 *   const id = btn.dataset.id;
 *   api.delete(id);
 * });
 * ```
 */
export const onDelegated = (root: ParentNode | null = document) => {
  /**
   * @param selector - CSS Selector to match target elements against (e.g. 'li', '.btn')
   */
  return <S extends string>(selector: S) => {
    /**
     * @param eventType - Standard DOM event name (click, input, change, etc)
     * @param handler - Callback receiving the typed Event and the typed Matched Element
     * @param options - EventListener options (capture, passive, etc)
     */
    return <K extends keyof HTMLElementEventMap>(
      eventType: K,
      handler: (event: HTMLElementEventMap[K], match: ParseSelector<S>) => void,
      options: boolean | AddEventListenerOptions = false
    ): Unsubscribe => {
      if (!root) return () => { };

      const listener = (e: Event) => {
        const target = e.target as Element;

        // 1. Find the closest ancestor (or self) that matches the selector
        const match = target.closest ? target.closest(selector) : null;

        // 2. Ensure the match exists AND is actually inside our root container
        // (Prevents edge cases with disconnected nodes or Shadow DOM)
        if (match && root.contains(match)) {
          // @ts-ignore - TS inference here is complex but safe due to ParseSelector
          handler(e as HTMLElementEventMap[K], match as ParseSelector<S>);
        }
      };

      root.addEventListener(eventType, listener, options);
      return () => root.removeEventListener(eventType, listener, options);
    };
  };
};

/**
 * Dispatches a CustomEvent from the target element.
 * 
 * Creates and dispatches a CustomEvent with optional detail data. The detail
 * type is inferred from the provided data. By default, events bubble up the
 * DOM tree.
 * 
 * @template T - The type of the detail data
 * @param target - The element to dispatch the event from (null-safe)
 * @returns A curried function that accepts event name, detail, and options
 * 
 * @example
 * ```typescript
 * // Simple custom event
 * const button = document.querySelector('button');
 * dispatch(button)('clicked', { timestamp: Date.now() });
 * 
 * // Typed custom events
 * interface SaveEvent {
 *   id: number;
 *   data: { name: string; email: string };
 * }
 * dispatch(form)('save', { id: 123, data: formData } as SaveEvent);
 * 
 * // Listen for custom events
 * on(button)('clicked' as any, (e: CustomEvent) => {
 *   console.log('Detail:', e.detail); // { timestamp: ... }
 * });
 * 
 * // Non-bubbling event
 * dispatch(element)('custom', data, { bubbles: false });
 * 
 * // Cancelable event
 * dispatch(element)('beforeSave', data, { cancelable: true });
 * 
 * // Component communication pattern
 * const modal = document.querySelector('.modal');
 * dispatch(modal)('modal:close', { reason: 'user-action' });
 * 
 * // Null-safe: does nothing if target is null
 * const missing = document.querySelector('.missing');
 * dispatch(missing)('event', data); // Safe, no error
 * ```
 */
export const dispatch = (target: EventTarget | null) => {
  return <T = any>(eventName: string, detail?: T, options: EventInit = { bubbles: true }) => {
    if (target) {
      target.dispatchEvent(new CustomEvent(eventName, { detail, ...options }));
    }
    return target;
  };
};


// =============================================================================
// 3. MANIPULATION (MODIFY & STYLE)
// =============================================================================

/**
 * Declaratively modifies an element's properties.
 *
 * Provides a unified API for setting text, HTML, styles, classes, attributes,
 * and dataset values. All modifications are applied in a single call. Returns
 * the element for chaining.
 *
 * @template T - The HTML element type
 * @param element - The element to modify (null-safe)
 * @returns A curried function that accepts props and returns the modified element
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 *
 * // Imperative (cleaner DX)
 * modify(button, { text: 'Click me!' });
 *
 * // Curried (pipeline friendly)
 * modify(button)({ text: 'Click me!' });
 *
 * // Multiple properties at once
 * modify(button)({
 *   text: 'Submit',
 *   class: { active: true, disabled: false },
 *   dataset: { userId: '123', action: 'save' },
 *   style: { backgroundColor: 'blue', color: 'white' },
 *   attr: { 'aria-label': 'Submit form', type: 'submit' }
 * });
 *
 * // Form inputs
 * const input = document.querySelector('input');
 * modify(input)({
 *   value: 'John Doe',
 *   disabled: false,
 *   attr: { placeholder: 'Enter name', required: true }
 * });
 *
 * // Conditional classes
 * modify(element)({
 *   class: {
 *     loading: isLoading,
 *     error: hasError,
 *     success: isSuccess
 *   }
 * });
 *
 * // Data attributes (auto-converts to kebab-case)
 * modify(element)({
 *   dataset: {
 *     userId: 123,        // becomes data-user-id="123"
 *     isActive: true,     // becomes data-is-active="true"
 *     config: { a: 1 }    // becomes data-config='{"a":1}'
 *   }
 * });
 *
 * // Null-safe: returns null if element is null
 * modify(null)({ text: 'test' }); // null
 * ```
 */
export const modify = def(<T extends HTMLElement>(element: T | null, props: ElementProps): T | null => {
  if (!element) return null;

  if (props.text !== undefined) element.innerText = props.text;
  if (props.html !== undefined) element.innerHTML = props.html;
  if (props.value !== undefined) (element as any).value = props.value;
  if (props.disabled !== undefined) (element as any).disabled = props.disabled;

  if (props.style) Object.assign(element.style, props.style);

  if (props.dataset) {
    Object.entries(props.dataset).forEach(([k, v]) => {
      if (v === undefined) return;
      element.dataset[k] = v === null ? undefined : String(v);
    });
  }

  if (props.class) {
    Object.entries(props.class).forEach(([k, v]) => element.classList.toggle(k, !!v));
  }

  if (props.attr) {
    Object.entries(props.attr).forEach(([k, v]) => {
      if (v === false || v === null || v === undefined) element.removeAttribute(k);
      else element.setAttribute(k, String(v));
    });
  }

  return element;
});

/** 
 * Sets properties on an element.
 *  @alias modify 
 */
export const set = modify

/**
 * Applies inline CSS styles to an element.
 *
 * Merges the provided styles with existing inline styles. For removing styles,
 * set the property to empty string. Returns the element for chaining.
 *
 * @param element - The element to style (null-safe)
 * @returns A curried function that accepts styles and returns the element
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 *
 * // Imperative (cleaner DX)
 * css(div, { color: 'red', fontSize: '16px' });
 *
 * // Curried (pipeline friendly)
 * css(div)({
 *   color: 'red',
 *   fontSize: '16px',
 *   marginTop: '10px'
 * });
 *
 * // CSS custom properties (variables)
 * css(div)({
 *   '--primary-color': '#007bff',
 *   '--spacing': '1rem'
 * } as any);
 *
 * // Remove a style (set to empty string)
 * css(div)({ display: '' });
 *
 * // Animation and transitions
 * css(div)({
 *   transition: 'all 0.3s ease',
 *   transform: 'translateX(100px)',
 *   opacity: '0.5'
 * });
 *
 * // Chaining with modify
 * const element = modify(div)({ text: 'Hello' });
 * css(element)({ color: 'blue' });
 * ```
 */
export const css = def((element: HTMLElement | null, styles: Partial<CSSStyleDeclaration>) => {
  if (element) Object.assign(element.style, styles);
  return element;
});

/**
 * Applies styles temporarily and returns a revert function.
 * 
 * Saves the original style values and applies new ones. The returned function
 * restores the original values. Useful for temporary visual states like hover
 * effects or loading states.
 * 
 * @param element - The element to style (null-safe)
 * @returns A curried function that accepts styles and returns a cleanup function
 * 
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * 
 * // Temporarily change opacity
 * const revert = tempStyle(div)({ opacity: '0.5' });
 * // Later...
 * revert(); // Restores original opacity
 * 
 * // Loading state pattern
 * const showLoading = () => {
 *   const revert = tempStyle(button)({
 *     opacity: '0.6',
 *     pointerEvents: 'none',
 *     cursor: 'wait'
 *   });
 *   
 *   fetchData().finally(() => {
 *     revert(); // Restore original styles
 *   });
 * };
 * 
 * // Animation workflow
 * const element = document.querySelector('.box');
 * const cleanup = tempStyle(element)({
 *   transform: 'scale(1.2)',
 *   transition: 'transform 0.3s'
 * });
 * setTimeout(cleanup, 300); // Revert after animation
 * 
 * // Null-safe: returns no-op if element is null
 * const noop = tempStyle(null)({ color: 'red' }); // () => {}
 * ```
 */
export const tempStyle = (element: HTMLElement | null) => {
  return (styles: Partial<CSSStyleDeclaration>): Unsubscribe => {
    if (!element) return () => { };
    const original: Record<string, string> = {};

    // Save original values
    Object.keys(styles).forEach((key) => {
      original[key] = element.style[key as keyof CSSStyleDeclaration] as string;
    });

    Object.assign(element.style, styles);

    return () => Object.assign(element.style, original);
  };
};


// =============================================================================
// 4. STRUCTURE & TRAVERSAL
// =============================================================================

/**
 * Appends content to the end of the target element.
 *
 * Accepts multiple arguments of mixed types (strings, Nodes, null, undefined).
 * Strings are automatically converted to text nodes. Null/undefined values are
 * filtered out. Returns the parent for chaining.
 *
 * @param parent - The parent element to append to (null-safe)
 * @returns A curried function that accepts content and returns the parent
 *
 * @example
 * ```typescript
 * const list = document.querySelector('ul');
 *
 * // Imperative (cleaner DX)
 * append(list, item1, item2, item3);
 *
 * // Curried (pipeline friendly)
 * append(list)(item1, item2, item3);
 *
 * // Append a single element
 * const item = document.createElement('li');
 * append(list)(item);
 *
 * // Mix elements and text
 * append(container)(heading, 'Some text', paragraph);
 *
 * // Append text nodes
 * append(div)('Hello', ' ', 'World');
 *
 * // Null values are safely ignored
 * append(list)(item1, null, item2, undefined); // Only appends item1 and item2
 *
 * // Chaining
 * const parent = append(container)(child1);
 * append(parent)(child2);
 * ```
 */
export const append = def((parent: HTMLElement | null, ...content: (string | Node | null | undefined)[]) => {
  parent?.append(..._nodes(content));
  return parent;
});

/**
 * Prepends content to the start of the target element.
 *
 * Inserts content at the beginning, before any existing children. Accepts
 * multiple arguments of mixed types. Returns the parent for chaining.
 *
 * @param parent - The parent element to prepend to (null-safe)
 * @returns A curried function that accepts content and returns the parent
 *
 * @example
 * ```typescript
 * const list = document.querySelector('ul');
 *
 * // Imperative (cleaner DX)
 * prepend(list, firstItem);
 *
 * // Curried (pipeline friendly)
 * prepend(list)(firstItem);
 *
 * // Add header before content
 * const container = document.querySelector('.container');
 * const header = document.createElement('h1');
 * prepend(container)(header);
 * ```
 */
export const prepend = def((parent: HTMLElement | null, ...content: (string | Node | null | undefined)[]) => {
  parent?.prepend(..._nodes(content));
  return parent;
});

/**
 * Inserts content AFTER the target element as siblings.
 *
 * The content is inserted after the target in the DOM tree, at the same level.
 * Useful for inserting elements without modifying the target's children.
 *
 * @param target - The reference element (null-safe)
 * @returns A curried function that accepts content and returns the target
 *
 * @example
 * ```typescript
 * const header = document.querySelector('h1');
 * const banner = document.createElement('div');
 *
 * // Imperative (cleaner DX)
 * after(header, banner, notice, alert);
 *
 * // Curried (pipeline friendly)
 * after(header)(banner);
 *
 * // Insert multiple elements
 * after(header)(banner, notice, alert);
 * ```
 */
export const after = def((target: Element | null, ...content: (string | Node | null | undefined)[]) => {
  target?.after(..._nodes(content));
  return target;
});

/**
 * Inserts content BEFORE the target element as siblings.
 *
 * The content is inserted before the target in the DOM tree, at the same level.
 *
 * @param target - The reference element (null-safe)
 * @returns A curried function that accepts content and returns the target
 *
 * @example
 * ```typescript
 * const footer = document.querySelector('footer');
 * const disclaimer = document.createElement('p');
 *
 * // Imperative (cleaner DX)
 * before(footer, disclaimer);
 *
 * // Curried (pipeline friendly)
 * before(footer)(disclaimer);
 * ```
 */
export const before = def((target: Element | null, ...content: (string | Node | null | undefined)[]) => {
  target?.before(..._nodes(content));
  return target;
});

/**
 * Removes the target element from the DOM.
 * 
 * Detaches the element from its parent. Event listeners attached via
 * addEventListener will be garbage collected. Always returns `null` for
 * type safety (prevents accidental reuse of removed elements).
 * 
 * @param target - The element to remove (null-safe)
 * @returns Always returns `null`
 * 
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 * remove(modal); // Modal is removed from DOM
 * 
 * // Conditional removal
 * if (shouldRemove) {
 *   remove(element);
 * }
 * ```
 */
export const remove = (target: Element | null) => {
  target?.remove();
  return null;
};

/**
 * Removes all children from the target element.
 * 
 * More efficient than `innerHTML = ''` and safer (doesn't parse HTML).
 * Returns the target for chaining.
 * 
 * @param target - The element to empty (null-safe)
 * @returns The target element
 * 
 * @example
 * ```typescript
 * const container = document.querySelector('.container');
 * 
 * // Clear all content
 * empty(container);
 * 
 * // Then add new content
 * append(empty(container))(newContent);
 * ```
 */
export const empty = (target: Element | null) => {
  if (target) target.replaceChildren();
  return target;
};

/**
 * Wraps the target element with a wrapper element.
 *
 * Inserts the wrapper before the target in the DOM, then moves the target
 * inside the wrapper. Useful for adding container elements around existing
 * content.
 *
 * @param target - The element to wrap (null-safe)
 * @returns A curried function that accepts a wrapper and returns it
 *
 * @example
 * ```typescript
 * const img = document.querySelector('img');
 * const figure = document.createElement('figure');
 *
 * // Imperative (cleaner DX)
 * wrap(img, figure);
 *
 * // Curried (pipeline friendly)
 * wrap(img)(figure);
 * // DOM: <figure><img /></figure>
 *
 * // Using el() helper
 * wrap(img)(el('figure')({})([]));
 *
 * // Add caption to wrapper
 * const wrapper = wrap(img)(figure);
 * append(wrapper)(el('figcaption')({})(['Image caption']));
 * ```
 */
export const wrap = def((target: HTMLElement | null, wrapper: HTMLElement) => {
  if (target && wrapper && target.parentNode) {
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
  }
  return wrapper;
});

// =============================================================================
// 5. CREATION & TEMPLATES
// =============================================================================

/**
 * Creates a DOM element with full type inference.
 * 
 * Returns a curried function for building elements in three stages:
 * 1. Tag name (with type inference)
 * 2. Properties (text, classes, attributes, etc.)
 * 3. Children (elements or text)
 * 
 * The return type is automatically inferred from the tag name.
 * 
 * @template K - The HTML tag name (keyof HTMLElementTagNameMap)
 * @param tag - The HTML tag name (e.g., 'div', 'button', 'a')
 * @returns A curried function for props, then children, then the element
 * 
 * @example
 * ```typescript
 * // Basic button
 * const btn = el('button')({})(['Click me']);
 * // btn is typed as HTMLButtonElement
 * 
 * // With properties
 * const link = el('a')({
 *   attr: { href: '/home' },
 *   class: { active: true },
 *   text: 'Home'
 * })([]);
 * // link is typed as HTMLAnchorElement
 * 
 * // Nested elements
 * const card = el('div')({
 *   class: { card: true }
 * })([
 *   el('h2')({})(['Title']),
 *   el('p')({})(['Description'])
 * ]);
 * 
 * // Form input with type inference
 * const input = el('input')({
 *   attr: { type: 'text', placeholder: 'Enter name' },
 *   value: 'John'
 * })([]);
 * // input is typed as HTMLInputElement
 * 
 * // Partial application for reuse
 * const createButton = el('button');
 * const primaryBtn = createButton({ class: { primary: true } })(['Save']);
 * const secondaryBtn = createButton({ class: { secondary: true } })(['Cancel']);
 * ```
 */
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K) => {
  return (props: ElementProps = {}) => {
    return (children: (string | Node)[] = []): HTMLElementTagNameMap[K] => {
      const node = document.createElement(tag);
      modify(node)(props);
      node.append(..._nodes(children));
      return node;
    };
  };
};

/**
 * Creates an element from an HTML template string.
 * 
 * Uses tagged template literals for convenient HTML creation. Interpolated
 * values are automatically escaped. Returns the first element in the template.
 * 
 * ⚠️ **XSS Warning**: Only use with trusted content. Do not interpolate
 * user input directly without sanitization.
 * 
 * @param strings - Template string parts
 * @param values - Interpolated values
 * @returns The created HTMLElement
 * @throws Error if template doesn't produce an element
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const div = html`<div class="container">Hello</div>`;
 * 
 * // With interpolation
 * const name = 'World';
 * const greeting = html`<h1>Hello ${name}!</h1>`;
 * 
 * // Complex structure
 * const card = html`
 *   <div class="card">
 *     <h2>${title}</h2>
 *     <p>${description}</p>
 *   </div>
 * `;
 * 
 * // ⚠️ UNSAFE - Don't do this with user input!
 * // const unsafe = html`<div>${userInput}</div>`;
 * 
 * // ✅ SAFE - Sanitize user input first
 * const safe = html`<div>${sanitize(userInput)}</div>`;
 * ```
 */
export const html = (strings: TemplateStringsArray, ...values: any[]): HTMLElement => {
  const str = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  const tpl = document.createElement('template');
  tpl.innerHTML = str.trim();
  const el = tpl.content.firstElementChild;
  if (!el) throw new Error('html: Template did not result in an element');
  return el as HTMLElement;
};

/**
 * Creates a DocumentFragment from an HTML template string.
 * 
 * Like `html()` but returns a DocumentFragment containing all elements
 * from the template. Useful for creating multiple sibling elements at once.
 * 
 * ⚠️ **XSS Warning**: Only use with trusted content.
 * 
 * @param strings - Template string parts
 * @param values - Interpolated values
 * @returns A DocumentFragment containing the created elements
 * 
 * @example
 * ```typescript
 * // Create multiple list items
 * const items = htmlMany`
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 *   <li>Item 3</li>
 * `;
 * 
 * const list = document.querySelector('ul');
 * list.appendChild(items);
 * 
 * // With interpolation
 * const rows = htmlMany`
 *   <tr><td>${col1}</td><td>${col2}</td></tr>
 *   <tr><td>${col3}</td><td>${col4}</td></tr>
 * `;
 * ```
 */
export const htmlMany = (strings: TemplateStringsArray, ...values: any[]): DocumentFragment => {
  const str = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  const tpl = document.createElement('template');
  tpl.innerHTML = str.trim();
  return tpl.content;
};

/**
 * Clones a node, preserving its exact type.
 * 
 * Creates a copy of the node and optionally its descendants. The cloned node
 * has no parent and is not part of the document. Event listeners are NOT
 * copied.
 * 
 * @template T - The node type (preserved in return type)
 * @param node - The node to clone (null-safe)
 * @returns A curried function that accepts deep flag and returns the clone
 * 
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * 
 * // Deep clone (includes children)
 * const btnCopy = clone(button)(true);
 * // btnCopy is typed as HTMLButtonElement
 * 
 * // Shallow clone (no children)
 * const btnShallow = clone(button)(false);
 * 
 * // Template pattern
 * const template = el('div')({ class: { card: true } })([
 *   el('h2')({})(['Title']),
 *   el('p')({})(['Description'])
 * ]);
 * 
 * // Create multiple cards from template
 * const card1 = clone(template)(true);
 * const card2 = clone(template)(true);
 * const card3 = clone(template)(true);
 * 
 * // Null-safe
 * const missing = document.querySelector('.missing');
 * const result = clone(missing)(true); // null
 * ```
 */
export const clone = <T extends Node>(node: T | null) => {
  return (deep: boolean = true): T | null => {
    return node ? (node.cloneNode(deep) as T) : null;
  };
};


// =============================================================================
// 6. CLASS MANIPULATION
// =============================================================================

/**
 * Utilities for manipulating CSS classes on elements.
 * 
 * All methods are null-safe and return the element for chaining (except `has`).
 * Provides a functional API for common classList operations.
 * 
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * 
 * // Add multiple classes
 * cls.add(button)('btn', 'btn-primary', 'active');
 * 
 * // Remove classes
 * cls.remove(button)('disabled', 'loading');
 * 
 * // Toggle with optional force
 * cls.toggle(button)('active'); // Toggles
 * cls.toggle(button)('active', true); // Forces add
 * cls.toggle(button)('active', false); // Forces remove
 * 
 * // Replace a class
 * cls.replace(button)('btn-primary', 'btn-secondary');
 * 
 * // Check for class
 * if (cls.has(button)('active')) {
 *   console.log('Button is active');
 * }
 * 
 * // Chaining
 * cls.add(button)('btn');
 * cls.toggle(button)('active');
 * ```
 */
export const cls = {
  /**
   * Adds one or more CSS classes to the element.
   *
   * @param el - The element to add classes to (null-safe)
   * @returns A curried function that accepts class names and returns the element
   *
   * @example
   * ```typescript
   * // Imperative (cleaner DX)
   * cls.add(btn, 'active', 'shadow');
   *
   * // Curried (pipeline friendly)
   * cls.add(btn)('active', 'shadow');
   *
   * // Add single class
   * cls.add(div)('active');
   *
   * // Add multiple classes
   * cls.add(div)('card', 'shadow', 'rounded');
   *
   * // Null-safe
   * cls.add(null)('active'); // Returns null
   * ```
   */
  add: def((el: Element | null, ...classes: string[]) => {
    el?.classList.add(...classes);
    return el;
  }),

  /**
   * Removes one or more CSS classes from the element.
   *
   * @param el - The element to remove classes from (null-safe)
   * @returns A curried function that accepts class names and returns the element
   *
   * @example
   * ```typescript
   * // Imperative (cleaner DX)
   * cls.remove(btn, 'active', 'shadow');
   *
   * // Curried (pipeline friendly)
   * cls.remove(btn)('active', 'shadow');
   *
   * // Remove single class
   * cls.remove(div)('active');
   *
   * // Remove multiple classes
   * cls.remove(div)('loading', 'disabled', 'error');
   *
   * // Safe if class doesn't exist
   * cls.remove(div)('nonexistent'); // No error
   * ```
   */
  remove: def((el: Element | null, ...classes: string[]) => {
    el?.classList.remove(...classes);
    return el;
  }),

  /**
   * Toggles a CSS class on the element.
   *
   * @param el - The element to toggle the class on (null-safe)
   * @returns A curried function that accepts class name and optional force flag
   *
   * @example
   * ```typescript
   * // Imperative (cleaner DX)
   * cls.toggle(btn, 'active');
   * cls.toggle(btn, 'active', true); // Force add
   *
   * // Curried (pipeline friendly)
   * cls.toggle(btn)('active'); // Adds if absent, removes if present
   * cls.toggle(btn)('active', true); // Always adds
   * cls.toggle(btn)('active', false); // Always removes
   *
   * // Conditional toggle
   * cls.toggle(button)('disabled', isLoading);
   * ```
   */
  toggle: def((el: Element | null, className: string, force?: boolean) => {
    el?.classList.toggle(className, force);
    return el;
  }),

  /**
   * Replaces an old class with a new class.
   *
   * @param el - The element to modify (null-safe)
   * @returns A curried function that accepts old and new class names
   *
   * @example
   * ```typescript
   * // Imperative (cleaner DX)
   * cls.replace(btn, 'btn-primary', 'btn-secondary');
   *
   * // Curried (pipeline friendly)
   * cls.replace(btn)('btn-primary', 'btn-secondary');
   *
   * // Replace theme class
   * cls.replace(div)('theme-light', 'theme-dark');
   *
   * // No effect if old class doesn't exist
   * cls.replace(div)('nonexistent', 'new'); // No change
   * ```
   */
  replace: def((el: Element | null, oldClass: string, newClass: string) => {
    el?.classList.replace(oldClass, newClass);
    return el;
  }),

  /**
   * Checks if the element has a specific class.
   * 
   * @param el - The element to check (null-safe)
   * @returns A curried function that accepts a class name and returns boolean
   * 
   * @example
   * ```typescript
   * const button = document.querySelector('button');
   * 
   * // Check for class
   * if (cls.has(button)('active')) {
   *   console.log('Button is active');
   * }
   * 
   * // Conditional logic
   * const isDisabled = cls.has(button)('disabled');
   * 
   * // Null-safe: returns false if element is null
   * cls.has(null)('active'); // false
   * ```
   */
  has: (el: Element | null) => (className: string) => {
    return !!el && el.classList.contains(className);
  }
};

/**
 * Observes changes to a specific class on an element.
 *
 * Uses MutationObserver to watch for class attribute changes. The callback
 * fires only when the specified class is added or removed (not on other class
 * changes). Returns a cleanup function to stop observing.
 *
 * **Performance**: Uses attribute filtering for efficiency. Consider debouncing
 * the callback if rapid changes are expected.
 *
 * @param target - The element to observe (null-safe)
 * @returns A curried function that accepts class name and callback, returns cleanup function
 *
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 *
 * // Imperative (cleaner DX)
 * const cleanup = watchClass(modal, 'open', (isPresent, el) => {
 *   if (isPresent) {
 *     console.log('Modal opened');
 *     document.body.style.overflow = 'hidden';
 *   } else {
 *     console.log('Modal closed');
 *     document.body.style.overflow = '';
 *   }
 * });
 *
 * // Curried (pipeline friendly)
 * const cleanup = watchClass(modal)('open', (isPresent, el) => {
 *   if (isPresent) {
 *     console.log('Modal opened');
 *     document.body.style.overflow = 'hidden';
 *   } else {
 *     console.log('Modal closed');
 *     document.body.style.overflow = '';
 *   }
 * });
 *
 * // Later: stop watching
 * cleanup();
 *
 * // Watch loading state
 * watchClass(button)('loading', (isLoading) => {
 *   button.disabled = isLoading;
 * });
 *
 * // Sync state between elements
 * watchClass(sidebar)('collapsed', (isCollapsed) => {
 *   cls.toggle(mainContent)('expanded', isCollapsed);
 * });
 *
 * // Null-safe: returns no-op cleanup
 * const noop = watchClass(null)('active', callback); // () => {}
 * ```
 */
export const watchClass = def((target: Element | null, className: string, callback: (isPresent: boolean, el: Element) => void): Unsubscribe => {
  if (!target) return () => { };
  let was = target.classList.contains(className);
  const obs = new MutationObserver(() => {
    const is = target.classList.contains(className);
    if (is !== was) { was = is; callback(is, target); }
  });
  obs.observe(target, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
});


// =============================================================================
// 7. DATASET & ATTRIBUTES
// =============================================================================

const toDataAttr = (str: string) => 'data-' + str.replace(/[A-Z]/g, m => "-" + m.toLowerCase());

/**
 * Utilities for working with data attributes (data-*).
 * 
 * Provides a functional API for getting, setting, and observing data attributes.
 * Automatically handles type conversion (numbers, booleans, JSON) and camelCase
 * to kebab-case conversion.
 * 
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * 
 * // Set data attributes
 * Data.set(div)('userId', 123);        // data-user-id="123"
 * Data.set(div)('isActive', true);     // data-is-active="true"
 * Data.set(div)('config', { a: 1 });   // data-config='{"a":1}'
 * 
 * // Get raw string value
 * const userId = Data.get(div)('userId'); // "123"
 * 
 * // Read with type inference
 * const id = Data.read(div)('userId');     // 123 (number)
 * const active = Data.read(div)('isActive'); // true (boolean)
 * const config = Data.read(div)('config');   // { a: 1 } (object)
 * 
 * // React to changes
 * Data.bind(div)('count', (value) => {
 *   console.log('Count changed:', value);
 * });
 * ```
 */
export const Data = {
  /**
   * Gets the raw string value of a data attribute.
   * 
   * Returns the value as-is from the dataset. For type conversion, use `read()`.
   * 
   * @template T - The element type (inferred)
   * @param el - The element to get data from (null-safe)
   * @returns A curried function that accepts a key and returns the value or undefined
   * 
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   * div.dataset.userId = '123';
   * 
   * // Get raw value
   * const userId = Data.get(div)('userId'); // "123" (string)
   * 
   * // CamelCase key
   * const userName = Data.get(div)('userName'); // Accesses data-user-name
   * 
   * // Missing attribute
   * const missing = Data.get(div)('missing'); // undefined
   * 
   * // Null-safe
   * Data.get(null)('userId'); // undefined
   * ```
   */
  get: (el: HTMLElement | null) => (key: string) => el?.dataset[key],

  /**
   * Sets a data attribute value.
   *
   * Automatically converts objects to JSON strings and handles null/undefined
   * by removing the attribute. CamelCase keys are converted to kebab-case.
   *
   * @template T - The element type (inferred)
   * @param el - The element to set data on (null-safe)
   * @returns A curried function that accepts key and value, returns the element
   *
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   *
   * // Imperative (cleaner DX)
   * Data.set(div, 'userId', '123');
   *
   * // Curried (pipeline friendly)
   * Data.set(div)('userId', '123');
   *
   * // Set number (converted to string)
   * Data.set(div)('count', 42); // data-count="42"
   *
   * // Set boolean
   * Data.set(div)('isActive', true); // data-is-active="true"
   *
   * // Set object (JSON stringified)
   * Data.set(div)('config', { theme: 'dark', size: 'lg' });
   * // data-config='{"theme":"dark","size":"lg"}'
   *
   * // Remove attribute (null or undefined)
   * Data.set(div)('userId', null); // Removes data-user-id
   *
   * // CamelCase to kebab-case
   * Data.set(div)('userName', 'John'); // Sets data-user-name="John"
   *
   * // Chaining
   * Data.set(div)('id', 1);
   * Data.set(div)('name', 'Item');
   * ```
   */
  set: def((el: HTMLElement | null, key: string, val: any) => {
    if (!el) return el;
    if (val == null) delete el.dataset[key];
    else el.dataset[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return el;
  }),

  /**
   * Reads a data attribute with automatic type inference.
   * 
   * Intelligently parses the value:
   * - `"true"` → `true` (boolean)
   * - `"false"` → `false` (boolean)
   * - `"null"` → `null`
   * - `"123"` → `123` (number)
   * - `'{"a":1}'` → `{a:1}` (parsed JSON)
   * - Other → string
   * 
   * @template T - The expected return type
   * @param el - The element to read from (null-safe)
   * @returns A curried function that accepts a key and returns the parsed value
   * 
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   * 
   * // Boolean parsing
   * div.dataset.isActive = 'true';
   * Data.read(div)('isActive'); // true (boolean)
   * 
   * // Number parsing
   * div.dataset.count = '42';
   * Data.read(div)('count'); // 42 (number)
   * 
   * // JSON parsing
   * div.dataset.config = '{"theme":"dark"}';
   * Data.read(div)('config'); // { theme: 'dark' }
   * 
   * // String fallback
   * div.dataset.name = 'John';
   * Data.read(div)('name'); // "John" (string)
   * 
   * // Missing attribute
   * Data.read(div)('missing'); // undefined
   * 
   * // Type-safe usage
   * interface Config { theme: string; size: string; }
   * const config = Data.read<Config>(div)('config');
   * ```
   */
  read: (el: HTMLElement | null) => (key: string): any => {
    if (!el || !(key in (el.dataset || {}))) return undefined;
    const val = el.dataset[key]!;
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    try { return JSON.parse(val); } catch { return val; }
  },

  /**
   * Observes changes to a data attribute and fires a callback.
   *
   * Uses MutationObserver to watch for attribute changes. The callback fires
   * immediately with the current value, then on every change. Values are
   * automatically parsed using `Data.read()`.
   *
   * @template T - The expected value type
   * @param el - The element to observe (null-safe)
   * @returns A curried function that accepts key and callback, returns cleanup function
   *
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   *
   * // Imperative (cleaner DX)
   * const cleanup = Data.bind(div, 'count', (value, el) => {
   *   console.log('Count is now:', value);
   * });
   *
   * // Curried (pipeline friendly)
   * const cleanup = Data.bind(div)('count', (value, el) => {
   *   console.log('Count is now:', value);
   *   // Fires immediately with current value
   *   // Then fires on every change
   * });
   *
   * // Later: stop watching
   * cleanup();
   *
   * // Form validation example
   * Data.bind(input)('validationError', (error) => {
   *   if (error) {
   *     errorDisplay.textContent = error;
   *     errorDisplay.style.display = 'block';
   *   } else {
   *     errorDisplay.style.display = 'none';
   *   }
   * });
   *
   * // Sync state between components
   * Data.bind(slider)('value', (value) => {
   *   valueDisplay.textContent = String(value);
   * });
   *
   * // Null-safe: returns no-op cleanup
   * const noop = Data.bind(null)('key', callback); // () => {}
   * ```
   */
  bind: def((el: HTMLElement | null, key: string, callback: (val: any, el: HTMLElement) => void): Unsubscribe => {
    if (!el) return () => { };
    const attr = toDataAttr(key);
    const update = () => callback(Data.read(el)(key), el);

    update(); // Initial
    const obs = new MutationObserver((m) => {
      if (m.some(x => x.attributeName === attr)) update();
    });
    obs.observe(el, { attributes: true, attributeFilter: [attr] });
    return () => obs.disconnect();
  })
};

/**
 * Observes changes to one or more attributes on an element.
 *
 * Uses MutationObserver to watch for attribute changes. The callback fires
 * whenever any of the specified attributes change, receiving the new value
 * and attribute name. Returns a cleanup function to stop observing.
 *
 * **Performance**: Uses attribute filtering for efficiency. The observer only
 * watches the specified attributes, not all attribute changes.
 *
 * @param target - The element to observe (null-safe)
 * @returns A curried function that accepts attributes and callback, returns cleanup function
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 *
 * // Imperative (cleaner DX)
 * const cleanup = watchAttr(input, 'disabled', (value, attrName) => {
 *   console.log(`${attrName} changed to:`, value);
 * });
 *
 * // Curried (pipeline friendly)
 * const cleanup = watchAttr(input)('disabled', (value, attrName) => {
 *   console.log(`${attrName} changed to:`, value);
 *   // value is the new attribute value (string | null)
 * });
 *
 * // Watch multiple attributes
 * watchAttr(input)(['value', 'placeholder', 'type'], (value, attrName) => {
 *   console.log(`${attrName} = ${value}`);
 * });
 *
 * // Form validation
 * watchAttr(input)('aria-invalid', (value) => {
 *   if (value === 'true') {
 *     input.classList.add('error');
 *   } else {
 *     input.classList.remove('error');
 *   }
 * });
 *
 * // Sync attributes between elements
 * watchAttr(sourceElement)('title', (value) => {
 *   if (value) targetElement.setAttribute('title', value);
 * });
 *
 * // Later: stop watching
 * cleanup();
 *
 * // Null-safe: returns no-op cleanup
 * const noop = watchAttr(null)('disabled', callback); // () => {}
 * ```
 */
export const watchAttr = def((target: Element | null, attrs: string | string[], callback: (val: string | null, attr: string) => void): Unsubscribe => {
  if (!target) return () => { };
  const obs = new MutationObserver((muts) => muts.forEach(m => {
    if (m.attributeName) callback(target.getAttribute(m.attributeName), m.attributeName);
  }));
  obs.observe(target, { attributes: true, attributeFilter: Array.isArray(attrs) ? attrs : [attrs] });
  return () => obs.disconnect();
});

/**
 * Observes changes to the text content of an element.
 *
 * Uses MutationObserver to watch for text content changes. The callback fires
 * whenever the element's textContent changes, receiving the new text value.
 * Returns a cleanup function to stop observing.
 *
 * **Performance**: Watches both characterData (direct text node changes) and
 * childList (when text nodes are added/removed) with subtree enabled.
 *
 * @param target - The element to observe (null-safe)
 * @returns A curried function that accepts a callback, returns cleanup function
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 *
 * // Imperative (cleaner DX)
 * const cleanup = watchText(div, (newText) => {
 *   console.log('Text changed to:', newText);
 * });
 *
 * // Curried (pipeline friendly)
 * const cleanup = watchText(div)((newText) => {
 *   console.log('Text changed to:', newText);
 * });
 *
 * // Later: stop watching
 * cleanup();
 *
 * // Use in reactive UI
 * const counter = document.querySelector('#counter');
 * watchText(counter)((text) => {
 *   const count = parseInt(text);
 *   if (count > 100) alert('Limit exceeded!');
 * });
 *
 * // Null-safe: returns no-op cleanup
 * const noop = watchText(null)(callback); // () => {}
 * ```
 */
export const watchText = def((target: Element | null, callback: (text: string) => void): Unsubscribe => {
  if (!target) return () => { };
  const obs = new MutationObserver(() => {
    callback(target.textContent || '');
  });
  obs.observe(target, { characterData: true, childList: true, subtree: true });
  return () => obs.disconnect();
});


// =============================================================================
// 8. LIFECYCLE
// =============================================================================

/**
 * Executes a callback when the DOM is fully loaded and parsed.
 * 
 * If the DOM is already ready, the callback executes immediately (synchronously).
 * Otherwise, it waits for the DOMContentLoaded event. This is safer than placing
 * scripts at the end of the body, as it guarantees DOM availability.
 * 
 * **Timing Guarantee**: The callback will execute exactly once, either immediately
 * or when DOMContentLoaded fires. External resources (images, stylesheets) may
 * still be loading.
 * 
 * **SSR Considerations**: In server-side rendering contexts, ensure this code
 * only runs in the browser (check for `typeof document !== 'undefined'`).
 * 
 * @param fn - The callback to execute when the DOM is ready
 * @returns void
 * 
 * @example
 * ```typescript
 * // Basic usage
 * onReady(() => {
 *   console.log('DOM is ready!');
 *   const app = document.querySelector('#app');
 *   // Safe to manipulate DOM here
 * });
 * 
 * // Initialize app
 * onReady(() => {
 *   const form = document.querySelector('form');
 *   on(form)('submit', handleSubmit);
 *   
 *   const buttons = findAll(document)('button');
 *   buttons.forEach(btn => {
 *     on(btn)('click', handleClick);
 *   });
 * });
 * 
 * // Multiple callbacks (each executes independently)
 * onReady(() => console.log('First'));
 * onReady(() => console.log('Second'));
 * 
 * // SSR-safe usage
 * if (typeof document !== 'undefined') {
 *   onReady(() => {
 *     // Client-side only code
 *   });
 * }
 * 
 * // Difference from window.onload:
 * // - onReady: Fires when DOM is parsed (faster)
 * // - window.onload: Fires when all resources loaded (slower)
 * ```
 */
export const onReady = (fn: () => void): void => {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
};

/**
 * Observes when elements matching a selector are added to the DOM.
 *
 * Uses MutationObserver to watch for new elements. The handler fires for:
 * 1. Elements already in the DOM (initial check)
 * 2. Elements added dynamically after setup
 *
 * Each element is tracked using WeakSet to prevent duplicate handler calls.
 * Returns a cleanup function to stop observing.
 *
 * **Performance**: Uses WeakSet for O(1) duplicate checking without memory leaks.
 * The observer watches the entire subtree by default.
 *
 * **SPA Navigation**: Perfect for handling dynamically loaded content in single-page
 * applications where elements appear/disappear without full page reloads.
 *
 * @template S - The CSS selector string
 * @param selector - CSS selector to match elements
 * @returns A curried function that accepts handler, root, and once flag
 *
 * @example
 * ```typescript
 * // Imperative (cleaner DX)
 * const cleanup = onMount('.modal', (modal) => {
 *   console.log('Modal added:', modal);
 *   modal.classList.add('initialized');
 * });
 *
 * // Curried (pipeline friendly)
 * const cleanup = onMount('.modal')((modal) => {
 *   console.log('Modal added:', modal);
 *   modal.classList.add('initialized');
 *
 *   // Setup modal-specific behavior
 *   const closeBtn = modal.querySelector('.close');
 *   on(closeBtn)('click', () => modal.remove());
 * });
 *
 * // Later: stop observing
 * cleanup();
 *
 * // Watch within a specific container
 * const container = document.querySelector('#app');
 * onMount('.dynamic-card')((card) => {
 *   console.log('Card added');
 * }, container);
 *
 * // One-time handler (stops after first match)
 * onMount('#splash-screen')((splash) => {
 *   setTimeout(() => splash.remove(), 3000);
 * }, document, true); // once = true
 *
 * // SPA route handling
 * onMount('[data-page]')((page) => {
 *   const pageName = page.getAttribute('data-page');
 *   console.log('Page loaded:', pageName);
 *
 *   // Initialize page-specific features
 *   initializeAnalytics(pageName);
 *   loadPageData(pageName);
 * });
 *
 * // Lazy-load images as they're added
 * onMount('img[data-src]')((img) => {
 *   const src = img.getAttribute('data-src');
 *   if (src) {
 *     img.setAttribute('src', src);
 *     img.removeAttribute('data-src');
 *   }
 * });
 *
 * // Component initialization pattern
 * onMount('[data-component="tooltip"]')((el) => {
 *   new Tooltip(el); // Initialize tooltip component
 * });
 * ```
 */
export const onMount = def((selector: string | null, handler: (el: Element) => void, root: ParentNode = document, once = false): Unsubscribe => {
  if (!selector) return () => { };
  const seen = new WeakSet();
  let foundAny = false;
  const check = (node: Element) => {
    if (seen.has(node)) return;
    if (node.matches(selector)) { seen.add(node); handler(node); foundAny = true; }
    node.querySelectorAll(selector).forEach(c => {
      if (!seen.has(c)) { seen.add(c); handler(c); foundAny = true; }
    });
  };

  // Initial check
  root.querySelectorAll(selector).forEach(check);

  const obs = new MutationObserver(muts => muts.forEach(m => {
    m.addedNodes.forEach(n => { if (n.nodeType === 1) check(n as Element); });
  }));

  if (once && foundAny) return () => { }; // Already found
  obs.observe(root, { childList: true, subtree: true });
  return () => obs.disconnect();
});

/**
 * Waits for a condition to become true on an element.
 *
 * Returns a Promise that resolves when the predicate returns true. Uses
 * MutationObserver to watch for changes. The predicate is checked immediately,
 * then on every mutation until it returns true.
 *
 * **Timeout Recommendation**: Consider adding a timeout wrapper to prevent
 * infinite waiting:
 * ```typescript
 * Promise.race([
 *   waitFor(el, predicate),
 *   wait(5000).then(() => { throw new Error('Timeout'); })
 * ]);
 * ```
 *
 * **Memory Leak Prevention**: The observer automatically disconnects when the
 * condition is met. If the element is null, the promise never resolves (consider
 * null-checking before calling).
 *
 * @param target - The element to observe (null-unsafe: promise won't resolve if null)
 * @returns A curried function that accepts a predicate and returns a Promise
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 *
 * // Imperative (cleaner DX)
 * await waitFor(button, (el) => el.classList.contains('ready'));
 * console.log('Button is ready!');
 *
 * // Curried (pipeline friendly)
 * await waitFor(button)((el) => el.classList.contains('ready'));
 * console.log('Button is ready!');
 *
 * // Wait for specific attribute value
 * await waitFor(input)((el) => el.getAttribute('data-loaded') === 'true');
 * console.log('Data loaded!');
 *
 * // Wait for child count
 * const list = document.querySelector('ul');
 * await waitFor(list)((el) => el.children.length >= 10);
 * console.log('List has at least 10 items');
 *
 * // Wait for text content
 * await waitFor(status)((el) => el.textContent?.includes('Complete'));
 * console.log('Status is complete');
 *
 * // With timeout (recommended)
 * try {
 *   await Promise.race([
 *     waitFor(element)((el) => el.classList.contains('loaded')),
 *     wait(5000).then(() => { throw new Error('Timeout waiting for element'); })
 *   ]);
 *   console.log('Element loaded in time');
 * } catch (e) {
 *   console.error('Timed out:', e);
 * }
 *
 * // Animation completion
 * element.classList.add('animating');
 * await waitFor(element)((el) => !el.classList.contains('animating'));
 * console.log('Animation complete');
 *
 * // Form validation
 * await waitFor(form)((el) => {
 *   const inputs = el.querySelectorAll('input[required]');
 *   return Array.from(inputs).every(input => input.value.length > 0);
 * });
 * console.log('All required fields filled');
 * ```
 */
export const waitFor = def((target: Element | null, predicate: (el: Element) => boolean): Promise<Element> => {
  return new Promise((resolve) => {
    if (!target) return;
    if (predicate(target)) return resolve(target);
    const obs = new MutationObserver(() => {
      if (predicate(target)) { obs.disconnect(); resolve(target); }
    });
    obs.observe(target, { attributes: true, childList: true, subtree: true, characterData: true });
  });
});


// =============================================================================
// 9. UTILS (URL, FORM, ETC)
// =============================================================================

/**
 * Utilities for working with URL query parameters.
 * 
 * Provides a functional API for reading and modifying URL search parameters.
 * Supports both 'soft' navigation (using pushState) and 'hard' navigation
 * (full page reload).
 * 
 * **URL Encoding**: Values are automatically URL-encoded when set.
 * 
 * @example
 * ```typescript
 * // URL: https://example.com?page=1&sort=name
 * 
 * // Get single parameter
 * const page = Params.get('page'); // "1"
 * const missing = Params.get('missing'); // null
 * 
 * // Get multiple values (for array parameters)
 * // URL: ?tags=js&tags=ts&tags=react
 * const tags = Params.getAll('tags'); // ["js", "ts", "react"]
 * 
 * // Set parameter (soft navigation - no reload)
 * Params.set('page')('2')(); // Updates URL without reload
 * // URL becomes: ?page=2&sort=name
 * 
 * // Set parameter (hard navigation - full reload)
 * Params.set('page')('2')('hard'); // Reloads page with new URL
 * 
 * // Chaining for multiple updates
 * Params.set('page')('1')();
 * Params.set('sort')('date')();
 * Params.set('filter')('active')();
 * ```
 */
export const Params = {
  /**
   * Gets a single query parameter value.
   * 
   * @param key - The parameter name
   * @returns The parameter value or null if not found
   * 
   * @example
   * ```typescript
   * // URL: ?id=123&name=John
   * const id = Params.get('id'); // "123"
   * const name = Params.get('name'); // "John"
   * const missing = Params.get('missing'); // null
   * ```
   */
  get: (key: string) => new URLSearchParams(window.location.search).get(key),

  /**
   * Gets all values for a query parameter (for array-like parameters).
   * 
   * @param key - The parameter name
   * @returns Array of all values for that parameter
   * 
   * @example
   * ```typescript
   * // URL: ?tags=js&tags=ts&tags=react
   * const tags = Params.getAll('tags'); // ["js", "ts", "react"]
   * 
   * // URL: ?filter=active
   * const filters = Params.getAll('filter'); // ["active"]
   * 
   * // Missing parameter
   * const missing = Params.getAll('missing'); // []
   * ```
   */
  getAll: (key: string) => new URLSearchParams(window.location.search).getAll(key),

  /**
   * Sets a query parameter value.
   * 
   * @param key - The parameter name
   * @returns A curried function that accepts value and navigation type
   * 
   * @example
   * ```typescript
   * // Soft navigation (no page reload)
   * Params.set('page')('2')(); // Default: soft
   * Params.set('page')('2')('soft');
   * 
   * // Hard navigation (full page reload)
   * Params.set('page')('2')('hard');
   * 
   * // Pagination example
   * const nextPage = () => {
   *   const current = parseInt(Params.get('page') || '1');
   *   Params.set('page')(String(current + 1))();
   * };
   * 
   * // Filter example
   * const applyFilter = (filter: string) => {
   *   Params.set('filter')(filter)();
   *   Params.set('page')('1')(); // Reset to page 1
   *   loadData(); // Fetch filtered data
   * };
   * ```
   */
  set: (key: string) => (val: string) => (type: 'soft' | 'hard' = 'soft') => {
    const u = new URL(window.location.href);
    u.searchParams.set(key, val);
    if (type === 'hard') window.location.href = u.href;
    else window.history.pushState(null, '', u.href);
  }
};

/**
 * Utilities for working with form data.
 * 
 * Provides serialization and population of form fields. Automatically handles
 * different input types (text, checkbox, radio, number, select, textarea).
 * 
 * **FormData Compatibility**: For native FormData support, use `new FormData(form)`.
 * This utility provides a plain object representation.
 * 
 * @example
 * ```typescript
 * const form = document.querySelector('form');
 * 
 * // Serialize form to object
 * const data = Form.serialize(form);
 * // { username: "john", email: "john@example.com", age: 25, subscribe: true }
 * 
 * // Populate form from object
 * Form.populate(form)({
 *   username: "jane",
 *   email: "jane@example.com",
 *   age: 30,
 *   subscribe: false
 * });
 * 
 * // Save/load form state
 * const saveForm = () => {
 *   const data = Form.serialize(form);
 *   Local.set('formDraft')(data);
 * };
 * 
 * const loadForm = () => {
 *   const data = Local.get('formDraft');
 *   if (data) Form.populate(form)(data);
 * };
 * ```
 */
export const Form = {
  /**
   * Serializes form inputs into a plain object.
   * 
   * Handles:
   * - Text inputs → string
   * - Number inputs → number
   * - Checkboxes → boolean
   * - Radio buttons → string (only checked value)
   * - Select → string
   * - Textarea → string
   * 
   * Only includes inputs with a `name` attribute.
   * 
   * @param root - The form or container element
   * @returns Object with field names as keys and values
   * 
   * @example
   * ```typescript
   * const form = document.querySelector('form');
   * const data = Form.serialize(form);
   * 
   * // Submit to API
   * await Http.post('/api/submit')(data);
   * 
   * // Validate before submit
   * on(form)('submit', (e) => {
   *   e.preventDefault();
   *   const data = Form.serialize(form);
   *   if (validate(data)) {
   *     submitForm(data);
   *   }
   * });
   * 
   * // Auto-save draft
   * const inputs = form.querySelectorAll('input, textarea');
   * inputs.forEach(input => {
   *   on(input)('input', debounce(() => {
   *     const data = Form.serialize(form);
   *     Local.set('draft')(data);
   *   }, 500));
   * });
   * ```
   */
  serialize: (root: HTMLElement | null) => {
    const data: Record<string, any> = {};
    if (!root) return data;
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach(el => {
      if (!el.name) return;
      if ((el as HTMLInputElement).type === 'checkbox') data[el.name] = (el as HTMLInputElement).checked;
      else if ((el as HTMLInputElement).type === 'radio') { if ((el as HTMLInputElement).checked) data[el.name] = el.value; }
      else if ((el as HTMLInputElement).type === 'number') data[el.name] = Number(el.value);
      else data[el.name] = el.value;
    });
    return data;
  },

  /**
   * Populates form inputs from a plain object.
   *
   * Matches object keys to input `name` attributes and sets values accordingly.
   *
   * @param root - The form or container element
   * @returns A curried function that accepts data object and returns the root
   *
   * @example
   * ```typescript
   * const form = document.querySelector('form');
   *
   * // Imperative (cleaner DX)
   * Form.populate(form, {
   *   username: 'john',
   *   email: 'john@example.com',
   *   notifications: true
   * });
   *
   * // Curried (pipeline friendly)
   * Form.populate(form)({
   *   username: user.username,
   *   email: user.email,
   *   bio: user.bio,
   *   notifications: user.preferences.notifications
   * });
   *
   * // Load saved data
   * const savedData = Local.get('formData');
   * if (savedData) Form.populate(form)(savedData);
   *
   * // Reset form to defaults
   * Form.populate(form)({
   *   theme: 'light',
   *   language: 'en',
   *   notifications: true
   * });
   * ```
   */
  populate: def((root: HTMLElement | null, data: Record<string, any>) => {
    if (!root) return root;
    Object.entries(data).forEach(([k, v]) => {
      const el = root.querySelector(`[name="${k}"]`) as HTMLInputElement;
      if (!el) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v;
      else el.value = String(v);
    });
    return root;
  })
};

/**
 * Waits for a specified number of milliseconds.
 * 
 * Returns a Promise that resolves after the delay. Useful for adding delays
 * in async functions or creating timeouts.
 * 
 * @param ms - The number of milliseconds to wait
 * @returns A Promise that resolves after the delay
 * 
 * @example
 * ```typescript
 * // Simple delay
 * await wait(1000); // Wait 1 second
 * console.log('Done waiting');
 * 
 * // Delay in async function
 * async function showMessage() {
 *   console.log('Loading...');
 *   await wait(2000);
 *   console.log('Done!');
 * }
 * 
 * // Animation timing
 * async function animate() {
 *   element.classList.add('fade-in');
 *   await wait(300);
 *   element.classList.remove('fade-in');
 * }
 * 
 * // Retry with delay
 * async function retryFetch(url: string, retries = 3) {
 *   for (let i = 0; i < retries; i++) {
 *     try {
 *       return await fetch(url);
 *     } catch (e) {
 *       if (i < retries - 1) await wait(1000 * (i + 1));
 *     }
 *   }
 * }
 * ```
 */
export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Waits for the next animation frame.
 * 
 * Returns a Promise that resolves on the next requestAnimationFrame callback.
 * Useful for ensuring DOM updates are rendered before proceeding.
 * 
 * @returns A Promise that resolves on the next frame
 * 
 * @example
 * ```typescript
 * // Ensure DOM update is rendered
 * element.style.opacity = '0';
 * await nextFrame();
 * element.style.transition = 'opacity 0.3s';
 * element.style.opacity = '1';
 * 
 * // Batch DOM reads after writes
 * element.style.width = '100px';
 * await nextFrame();
 * const width = element.offsetWidth; // Avoids layout thrashing
 * 
 * // Smooth animation sequence
 * async function animateSequence() {
 *   element.classList.add('step-1');
 *   await nextFrame();
 *   element.classList.add('step-2');
 *   await nextFrame();
 *   element.classList.add('step-3');
 * }
 * ```
 */
export const nextFrame = () => new Promise(r => requestAnimationFrame(r));

/** CSS Template Literal for highlighting */
export const cssTemplate = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');

// =============================================================================
// 10. NAVIGATION (TRAVERSAL)
// =============================================================================

/**
 * Utilities for DOM tree traversal.
 * 
 * Provides a functional API for navigating the DOM tree (parent, siblings, children).
 * All methods are null-safe and preserve element types where possible.
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.item');
 * 
 * // Navigate to parent
 * const parent = Traverse.parent(element);
 * 
 * // Get siblings
 * const siblings = Traverse.siblings(element);
 * siblings.forEach(sibling => sibling.classList.add('sibling'));
 * 
 * // Navigate to next/previous
 * const next = Traverse.next(element);
 * const prev = Traverse.prev(element);
 * 
 * // Get all children
 * const children = Traverse.children(element);
 * ```
 */
export const Traverse = {
  /**
   * Gets the parent element.
   * 
   * @param el - The element to get the parent of
   * @returns The parent element or null
   * 
   * @example
   * ```typescript
   * const listItem = document.querySelector('li');
   * const list = Traverse.parent(listItem); // <ul>
   * 
   * // Navigate up multiple levels
   * const grandparent = Traverse.parent(Traverse.parent(element));
   * 
   * // Null-safe
   * Traverse.parent(null); // null
   * Traverse.parent(document.documentElement); // null (no parent)
   * ```
   */
  parent: (el: Element | null) => el?.parentElement || null,

  /**
   * Gets the next sibling element.
   * 
   * @param el - The element to get the next sibling of
   * @returns The next sibling element or null
   * 
   * @example
   * ```typescript
   * const first = document.querySelector('li:first-child');
   * const second = Traverse.next(first);
   * 
   * // Iterate through siblings
   * let current = firstElement;
   * while (current) {
   *   console.log(current);
   *   current = Traverse.next(current);
   * }
   * 
   * // Null-safe
   * Traverse.next(null); // null
   * Traverse.next(lastElement); // null (no next sibling)
   * ```
   */
  next: (el: Element | null) => el?.nextElementSibling as HTMLElement | null,

  /**
   * Gets the previous sibling element.
   * 
   * @param el - The element to get the previous sibling of
   * @returns The previous sibling element or null
   * 
   * @example
   * ```typescript
   * const last = document.querySelector('li:last-child');
   * const secondLast = Traverse.prev(last);
   * 
   * // Iterate backwards
   * let current = lastElement;
   * while (current) {
   *   console.log(current);
   *   current = Traverse.prev(current);
   * }
   * ```
   */
  prev: (el: Element | null) => el?.previousElementSibling as HTMLElement | null,

  /**
   * Gets all child elements as an array.
   * 
   * @param el - The element to get children of
   * @returns Array of child elements (empty if no children or null)
   * 
   * @example
   * ```typescript
   * const list = document.querySelector('ul');
   * const items = Traverse.children(list); // Array of <li> elements
   * 
   * // Process children
   * Traverse.children(container).forEach((child, index) => {
   *   child.dataset.index = String(index);
   * });
   * 
   * // Count children
   * const childCount = Traverse.children(element).length;
   * 
   * // Null-safe
   * Traverse.children(null); // []
   * ```
   */
  children: (el: Element | null) => el ? Array.from(el.children) as HTMLElement[] : [],

  /**
   * Gets all sibling elements (excluding the element itself).
   * 
   * @param el - The element to get siblings of
   * @returns Array of sibling elements (empty if no siblings or null)
   * 
   * @example
   * ```typescript
   * const activeItem = document.querySelector('.active');
   * const siblings = Traverse.siblings(activeItem);
   * 
   * // Remove active class from siblings
   * Traverse.siblings(activeItem).forEach(sibling => {
   *   sibling.classList.remove('active');
   * });
   * 
   * // Highlight siblings
   * Traverse.siblings(element).forEach(sibling => {
   *   sibling.style.opacity = '0.5';
   * });
   * 
   * // Null-safe
   * Traverse.siblings(null); // []
   * ```
   */
  siblings: (el: Element | null) => {
    if (!el || !el.parentElement) return [];
    return Array.from(el.parentElement.children).filter(c => c !== el) as HTMLElement[];
  }
};


// =============================================================================
// 11. CSS VARIABLES & ANIMATION
// =============================================================================

/**
 * Utilities for working with CSS custom properties (variables).
 * 
 * Provides a functional API for getting and setting CSS variables on elements.
 * Variables can be set at any level (element, :root, etc.) and will cascade
 * according to CSS specificity rules.
 * 
 * **Fallback Values**: When getting variables, you can provide fallback values
 * using standard CSS syntax: `var(--color, blue)`.
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.card');
 * 
 * // Set CSS variable
 * CssVar.set(element)('--primary-color', '#007bff');
 * CssVar.set(element)('--spacing', '1rem');
 * 
 * // Get CSS variable
 * const color = CssVar.get(element)('--primary-color'); // "#007bff"
 * 
 * // Set on :root for global theme
 * CssVar.set(document.documentElement)('--theme', 'dark');
 * 
 * // Dynamic theming
 * const setTheme = (theme: 'light' | 'dark') => {
 *   const root = document.documentElement;
 *   if (theme === 'dark') {
 *     CssVar.set(root)('--bg', '#1a1a1a');
 *     CssVar.set(root)('--text', '#ffffff');
 *   } else {
 *     CssVar.set(root)('--bg', '#ffffff');
 *     CssVar.set(root)('--text', '#000000');
 *   }
 * };
 * ```
 */
export const CssVar = {
  /**
   * Sets a CSS custom property (variable) on an element.
   * 
   * @param el - The element to set the variable on (null-safe)
   * @returns A curried function that accepts name and value, returns the element
   * 
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   * 
   * // Set single variable
   * CssVar.set(div)('--color', 'red');
   * 
   * // Set multiple variables
   * CssVar.set(div)('--width', '100px');
   * CssVar.set(div)('--height', '100px');
   * 
   * // Global theme variables
   * const root = document.documentElement;
   * CssVar.set(root)('--primary', '#007bff');
   * CssVar.set(root)('--secondary', '#6c757d');
   * 
   * // Dynamic values
   * CssVar.set(element)('--progress', `${percentage}%`);
   * 
   * // Null-safe
   * CssVar.set(null)('--color', 'red'); // Returns null
   * ```
   */
  set: (el: HTMLElement | null) => (name: string, value: string) => {
    el?.style.setProperty(name, value);
    return el;
  },

  /**
   * Gets the computed value of a CSS custom property.
   * 
   * Returns the computed value, which may be inherited from a parent element
   * or :root. The value is trimmed of whitespace.
   * 
   * @param el - The element to get the variable from (null-safe)
   * @returns A curried function that accepts name and returns the value
   * 
   * @example
   * ```typescript
   * const div = document.querySelector('div');
   * 
   * // Get variable value
   * const color = CssVar.get(div)('--primary-color');
   * 
   * // Get inherited variable
   * const spacing = CssVar.get(div)('--spacing'); // May come from parent
   * 
   * // Use in calculations
   * const width = parseInt(CssVar.get(element)('--width'));
   * 
   * // Check if variable is set
   * const hasTheme = CssVar.get(document.documentElement)('--theme') !== '';
   * 
   * // Null-safe
   * CssVar.get(null)('--color'); // ""
   * ```
   */
  get: (el: HTMLElement | null) => (name: string) => {
    return el ? getComputedStyle(el).getPropertyValue(name).trim() : '';
  }
};

/**
 * Reads a computed CSS property value from an element.
 * 
 * Gets the final computed value of any CSS property, including inherited values,
 * cascaded values, and browser defaults. Useful for reading actual rendered values
 * rather than inline styles.
 * 
 * **Unit Parsing**: The returned value includes units (e.g., "16px", "1.5em").
 * Parse with `parseInt()` or `parseFloat()` if you need numeric values.
 * 
 * **Computed vs Inline**: This reads computed styles (what's actually rendered),
 * not inline styles. Use `element.style.property` for inline styles only.
 * 
 * @param el - The element to read from (null-safe)
 * @returns A curried function that accepts a property name and returns the value
 * 
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * 
 * // Get computed width (includes padding, border if box-sizing)
 * const width = computed(div)('width'); // "200px"
 * 
 * // Get font size
 * const fontSize = computed(div)('fontSize'); // "16px"
 * 
 * // Get color (returns rgb/rgba)
 * const color = computed(div)('color'); // "rgb(0, 0, 0)"
 * 
 * // Parse numeric values
 * const widthNum = parseInt(computed(div)('width')); // 200
 * 
 * // Check display state
 * const isHidden = computed(div)('display') === 'none';
 * 
 * // Get inherited values
 * const lineHeight = computed(div)('lineHeight');
 * 
 * // Null-safe
 * computed(null)('width'); // ""
 * ```
 */
export const computed = (el: HTMLElement | null) => (prop: keyof CSSStyleDeclaration): string => {
  if (!el) return '';
  const value = getComputedStyle(el)[prop];
  return typeof value === 'string' ? value : String(value);
};

/**
 * Injects CSS styles into the document.
 * 
 * Creates a <style> element with the provided CSS content and appends it to
 * the specified root (defaults to document.head). Returns a cleanup function
 * to remove the styles.
 * 
 * **CSP Considerations**: If your site uses Content Security Policy, ensure
 * inline styles are allowed or use nonces/hashes.
 * 
 * **Style Precedence**: Injected styles follow normal CSS cascade rules.
 * Later injected styles override earlier ones (if same specificity).
 * 
 * **Scoping**: For scoped styles, use a unique class or data attribute as a
 * prefix in your CSS selectors.
 * 
 * @param cssContent - The CSS content to inject
 * @param root - The node to append the style element to (defaults to document.head)
 * @returns A cleanup function that removes the injected styles
 * 
 * @example
 * ```typescript
 * // Inject global styles
 * const cleanup = injectStyles(`
 *   body { background: #1a1a1a; color: #fff; }
 *   .card { border-radius: 8px; }
 * `);
 * 
 * // Later: remove styles
 * cleanup();
 * 
 * // Component-specific styles
 * const initModal = () => {
 *   const cleanup = injectStyles(`
 *     .modal { position: fixed; inset: 0; }
 *     .modal-backdrop { background: rgba(0,0,0,0.5); }
 *   `);
 *   
 *   return cleanup; // Return for cleanup when modal is destroyed
 * };
 * 
 * // Scoped styles
 * const cleanup = injectStyles(`
 *   [data-theme="dark"] {
 *     --bg: #1a1a1a;
 *     --text: #ffffff;
 *   }
 * `);
 * 
 * // Inject into shadow DOM
 * const shadow = element.attachShadow({ mode: 'open' });
 * injectStyles('.component { color: red; }', shadow);
 * 
 * // Temporary styles (auto-cleanup)
 * const showHighlight = async () => {
 *   const cleanup = injectStyles('.highlight { background: yellow; }');
 *   await wait(3000);
 *   cleanup(); // Remove after 3 seconds
 * };
 * ```
 */
export const injectStyles = (cssContent: string, root: Node = document.head): Unsubscribe => {
  const style = document.createElement('style');
  style.textContent = cssContent;
  root.appendChild(style);
  return () => style.remove();
};

/**
 * Waits for a CSS transition or animation to complete.
 * 
 * Returns a Promise that resolves when the element's transition or animation
 * ends. Includes a fallback that resolves immediately if no transition/animation
 * is active (duration is 0s or element has display:none).
 * 
 * **Fallback Timeout**: The promise includes a built-in fallback that resolves
 * if no transition/animation is detected. For additional safety, wrap in
 * `Promise.race()` with a timeout.
 * 
 * **Animation Event Handling**: Listens for both `transitionend` and `animationend`
 * events. Automatically cleans up event listeners when resolved.
 * 
 * @param el - The element to wait for (null-safe)
 * @returns A Promise that resolves with the element (or null) when complete
 * 
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 * 
 * // Wait for fade-in animation
 * modal.classList.add('fade-in');
 * await waitTransition(modal);
 * console.log('Animation complete!');
 * 
 * // Smooth hide/remove pattern
 * element.classList.add('fade-out');
 * await waitTransition(element);
 * element.remove(); // Remove after animation
 * 
 * // Sequential animations
 * element.classList.add('slide-in');
 * await waitTransition(element);
 * element.classList.add('pulse');
 * await waitTransition(element);
 * element.classList.remove('pulse');
 * 
 * // Modal close with animation
 * const closeModal = async (modal: HTMLElement) => {
 *   modal.classList.remove('show');
 *   await waitTransition(modal);
 *   modal.style.display = 'none';
 * };
 * 
 * // With timeout safety
 * try {
 *   await Promise.race([
 *     waitTransition(element),
 *     wait(5000).then(() => { throw new Error('Animation timeout'); })
 *   ]);
 * } catch (e) {
 *   console.error('Animation took too long');
 * }
 * 
 * // Null-safe
 * await waitTransition(null); // Resolves immediately with null
 * ```
 */
export const waitTransition = (el: HTMLElement | null) => new Promise<HTMLElement | null>((resolve) => {
  if (!el) return resolve(null);

  const onEnd = () => {
    el.removeEventListener('transitionend', onEnd);
    el.removeEventListener('animationend', onEnd);
    resolve(el);
  };

  el.addEventListener('transitionend', onEnd);
  el.addEventListener('animationend', onEnd);

  // Fallback: If no transition happens (e.g. display:none or 0s duration), resolve anyway.
  requestAnimationFrame(() => {
    const s = getComputedStyle(el);
    if (s.transitionDuration === '0s' && s.animationDuration === '0s') onEnd();
  });
});


// =============================================================================
// 12. OBJECTS & STATE
// =============================================================================

/**
 * Utilities for working with plain JavaScript objects.
 * 
 * Provides functional helpers for common object operations like cloning,
 * equality checking, and key picking/omitting.
 * 
 * **Immutability**: These utilities create new objects rather than mutating
 * existing ones, following functional programming principles.
 * 
 * **Performance**: For large objects or frequent operations, consider using
 * specialized libraries like Lodash or Ramda.
 * 
 * @example
 * ```typescript
 * const user = { id: 1, name: 'John', email: 'john@example.com', role: 'admin' };
 * 
 * // Deep clone
 * const userCopy = Obj.clone(user);
 * 
 * // Check equality
 * const isSame = Obj.isEqual(user, userCopy); // true
 * 
 * // Pick specific keys
 * const publicData = Obj.pick(user, ['id', 'name']); // { id: 1, name: 'John' }
 * 
 * // Omit sensitive keys
 * const safeData = Obj.omit(user, ['email', 'role']); // { id: 1, name: 'John' }
 * ```
 */
export const Obj = {
  /**
   * Creates a deep clone of an object.
   * 
   * Uses `structuredClone()` if available (modern browsers), falls back to
   * JSON parse/stringify. Note: JSON fallback doesn't preserve functions,
   * undefined values, or circular references.
   * 
   * @template T - The type of the object to clone
   * @param obj - The object to clone
   * @returns A deep copy of the object
   * 
   * @example
   * ```typescript
   * const original = { a: 1, b: { c: 2 } };
   * const copy = Obj.clone(original);
   * 
   * copy.b.c = 3;
   * console.log(original.b.c); // 2 (unchanged)
   * 
   * // Clone arrays
   * const arr = [1, [2, 3], { a: 4 }];
   * const arrCopy = Obj.clone(arr);
   * 
   * // Clone complex objects
   * const state = {
   *   user: { id: 1, profile: { name: 'John' } },
   *   settings: { theme: 'dark', notifications: true }
   * };
   * const stateCopy = Obj.clone(state);
   * ```
   */
  clone: <T>(obj: T): T => {
    try { return structuredClone(obj); }
    catch { return JSON.parse(JSON.stringify(obj)); }
  },

  /**
   * Checks deep equality between two values.
   * 
   * Compares values recursively. Uses JSON stringification for deep comparison,
   * so objects with different key orders will be considered different.
   * 
   * @param a - First value
   * @param b - Second value
   * @returns True if values are deeply equal
   * 
   * @example
   * ```typescript
   * // Primitive equality
   * Obj.isEqual(1, 1); // true
   * Obj.isEqual('a', 'b'); // false
   * 
   * // Object equality
   * Obj.isEqual({ a: 1 }, { a: 1 }); // true
   * Obj.isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // false (different order)
   * 
   * // Nested objects
   * Obj.isEqual(
   *   { user: { name: 'John', age: 30 } },
   *   { user: { name: 'John', age: 30 } }
   * ); // true
   * 
   * // Arrays
   * Obj.isEqual([1, 2, 3], [1, 2, 3]); // true
   * Obj.isEqual([1, 2], [2, 1]); // false
   * ```
   */
  isEqual: (a: any, b: any) => a === b || JSON.stringify(a) === JSON.stringify(b),

  /**
   * Creates a new object with only the specified keys.
   * 
   * @template T - The object type
   * @template K - The keys to pick
   * @param obj - The source object
   * @param keys - Array of keys to include
   * @returns A new object with only the specified keys
   * 
   * @example
   * ```typescript
   * const user = {
   *   id: 1,
   *   name: 'John',
   *   email: 'john@example.com',
   *   password: 'secret',
   *   role: 'admin'
   * };
   * 
   * // Pick public fields
   * const publicUser = Obj.pick(user, ['id', 'name']);
   * // { id: 1, name: 'John' }
   * 
   * // Pick for API response
   * const apiResponse = Obj.pick(user, ['id', 'name', 'email']);
   * 
   * // Type-safe picking
   * type User = typeof user;
   * const picked: Pick<User, 'id' | 'name'> = Obj.pick(user, ['id', 'name']);
   * ```
   */
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const ret = {} as Pick<T, K>;
    keys.forEach(k => { if (k in obj) ret[k] = obj[k]; });
    return ret;
  },

  /**
   * Creates a new object excluding the specified keys.
   * 
   * @template T - The object type
   * @template K - The keys to omit
   * @param obj - The source object
   * @param keys - Array of keys to exclude
   * @returns A new object without the specified keys
   * 
   * @example
   * ```typescript
   * const user = {
   *   id: 1,
   *   name: 'John',
   *   email: 'john@example.com',
   *   password: 'secret',
   *   role: 'admin'
   * };
   * 
   * // Omit sensitive fields
   * const safeUser = Obj.omit(user, ['password']);
   * // { id: 1, name: 'John', email: 'john@example.com', role: 'admin' }
   * 
   * // Omit multiple fields
   * const publicUser = Obj.omit(user, ['password', 'email', 'role']);
   * // { id: 1, name: 'John' }
   * 
   * // Type-safe omitting
   * type User = typeof user;
   * const omitted: Omit<User, 'password'> = Obj.omit(user, ['password']);
   * ```
   */
  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const ret = { ...obj };
    keys.forEach(k => delete ret[k]);
    return ret as Omit<T, K>;
  }
};


// =============================================================================
// 13. COLLECTIONS (BATCHING)
// =============================================================================

/**
 * Applies a function to each element in a collection.
 * 
 * Similar to `Array.forEach()` but works with any iterable or array-like object
 * (NodeList, HTMLCollection, etc.). Returns the array for further processing.
 * 
 * **Performance**: For simple iterations, native `forEach()` may be faster.
 * Use this when you need to work with non-array collections or want the return value.
 * 
 * **vs forEach**: Unlike `forEach()`, this returns the array, allowing for
 * further chaining or processing.
 * 
 * @template T - The element type
 * @param list - The collection to iterate over (null-safe)
 * @returns A curried function that accepts a callback and returns the array
 * 
 * @example
 * ```typescript
 * // Work with NodeList
 * const items = document.querySelectorAll('li');
 * batch(items)((el, index) => {
 *   el.dataset.index = String(index);
 *   el.classList.add('processed');
 * });
 * 
 * // Work with HTMLCollection
 * const divs = document.getElementsByTagName('div');
 * batch(divs)((div) => {
 *   div.style.opacity = '0.5';
 * });
 * 
 * // Remove all matching elements
 * batch(document.querySelectorAll('.temp'))((el) => el.remove());
 * 
 * // Add event listeners to multiple elements
 * batch(document.querySelectorAll('button'))((btn, i) => {
 *   on(btn)('click', () => console.log('Button', i, 'clicked'));
 * });
 * 
 * // Chain with other operations
 * const elements = batch(items)((el) => el.classList.add('active'));
 * console.log('Processed', elements.length, 'elements');
 * 
 * // Null-safe
 * batch(null)((el) => console.log(el)); // Returns []
 * ```
 */
export const batch = <T extends Element>(list: Iterable<T> | ArrayLike<T> | null) => {
  return (fn: (el: T, index: number) => void): T[] => {
    if (!list) return [];
    const arr = Array.from(list);
    arr.forEach(fn);
    return arr;
  };
};

/**
 * Groups elements by a key function.
 * 
 * Creates an object where keys are the result of the key function and values
 * are arrays of elements that produced that key. Useful for categorizing or
 * organizing collections of elements.
 * 
 * **Type Inference**: The key function should return a string. For better type
 * safety, consider using a union of string literals as the return type.
 * 
 * **Memory Considerations**: For very large collections, consider processing
 * in chunks or using a Map instead of a plain object.
 * 
 * @template T - The element type
 * @param list - The collection to group (null-safe)
 * @returns A curried function that accepts a key function and returns grouped object
 * 
 * @example
 * ```typescript
 * // Group by data attribute
 * const items = document.querySelectorAll('[data-category]');
 * const byCategory = groupBy(items)(el => el.dataset.category || 'uncategorized');
 * // { electronics: [...], clothing: [...], uncategorized: [...] }
 * 
 * // Group by tag name
 * const elements = document.querySelectorAll('*');
 * const byTag = groupBy(elements)(el => el.tagName.toLowerCase());
 * // { div: [...], span: [...], button: [...], ... }
 * 
 * // Group by class presence
 * const allDivs = document.querySelectorAll('div');
 * const byStatus = groupBy(allDivs)(el => 
 *   el.classList.contains('active') ? 'active' : 'inactive'
 * );
 * 
 * // Process groups
 * Object.entries(byCategory).forEach(([category, elements]) => {
 *   console.log(`${category}: ${elements.length} items`);
 *   elements.forEach(el => el.classList.add(`category-${category}`));
 * });
 * 
 * // Group form inputs by type
 * const inputs = document.querySelectorAll('input');
 * const byType = groupBy(inputs)(input => input.type);
 * // { text: [...], email: [...], checkbox: [...], ... }
 * 
 * // Null-safe
 * groupBy(null)(el => 'key'); // {}
 * ```
 */
export const groupBy = <T extends Element>(list: Iterable<T> | ArrayLike<T> | null) => {
  return (keyFn: (el: T) => string): Record<string, T[]> => {
    const groups: Record<string, T[]> = {};
    if (!list) return groups;
    Array.from(list).forEach(el => {
      const k = keyFn(el);
      (groups[k] = groups[k] || []).push(el);
    });
    return groups;
  };
};


// =============================================================================
// 14. COMPONENT REFS
// =============================================================================

/**
 * Collects elements with `data-ref` attributes into a typed object.
 * 
 * Scans the root element for children with `data-ref` attributes and creates
 * an object mapping ref names to elements. Useful for component-based patterns
 * where you need quick access to specific child elements.
 * 
 * **Generic Ref Map**: For type-safe ref access, define an interface for your
 * expected refs and cast the result.
 * 
 * **Duplicate Handling**: If multiple elements have the same ref name, only
 * the last one is kept. Use `groupRefs()` if you need all duplicates.
 * 
 * @param root - The root element to search within (null-safe)
 * @returns Object mapping ref names to elements
 * 
 * @example
 * ```typescript
 * // HTML:
 * // <form>
 * //   <input data-ref="username" />
 * //   <input data-ref="email" />
 * //   <button data-ref="submit">Submit</button>
 * // </form>
 * 
 * const form = document.querySelector('form');
 * const { username, email, submit } = refs(form);
 * 
 * // Type-safe access
 * on(submit)('click', () => {
 *   const data = {
 *     username: (username as HTMLInputElement).value,
 *     email: (email as HTMLInputElement).value
 *   };
 *   console.log(data);
 * });
 * 
 * // Component pattern
 * interface ModalRefs {
 *   title: HTMLElement;
 *   content: HTMLElement;
 *   closeBtn: HTMLElement;
 * }
 * 
 * const modal = document.querySelector('.modal');
 * const r = refs(modal) as unknown as ModalRefs;
 * 
 * modify(r.title)({ text: 'Welcome!' });
 * on(r.closeBtn)('click', () => modal.remove());
 * 
 * // Null-safe
 * refs(null); // {}
 * ```
 */
export const refs = (root: ParentNode | null): Record<string, HTMLElement> => {
  const r: Record<string, HTMLElement> = {};
  if (root) {
    root.querySelectorAll<HTMLElement>('[data-ref]').forEach(el => {
      if (el.dataset.ref) r[el.dataset.ref] = el;
    });
  }
  return r;
};

/**
 * Collects elements with `data-ref` attributes into arrays.
 * 
 * Like `refs()` but allows multiple elements with the same ref name. Each ref
 * name maps to an array of all elements with that ref.
 * 
 * **Array Typing**: All refs are arrays, even if only one element exists.
 * This ensures consistent access patterns.
 * 
 * **Duplicate Handling**: Unlike `refs()`, this preserves all elements with
 * the same ref name in document order.
 * 
 * @param root - The root element to search within (null-safe)
 * @returns Object mapping ref names to arrays of elements
 * 
 * @example
 * ```typescript
 * // HTML:
 * // <ul>
 * //   <li data-ref="item">Item 1</li>
 * //   <li data-ref="item">Item 2</li>
 * //   <li data-ref="item">Item 3</li>
 * //   <button data-ref="action">Delete All</button>
 * // </ul>
 * 
 * const list = document.querySelector('ul');
 * const { item, action } = groupRefs(list);
 * 
 * console.log(item.length); // 3
 * console.log(action.length); // 1
 * 
 * // Process all items
 * item.forEach((el, index) => {
 *   el.dataset.index = String(index);
 * });
 * 
 * // Add listeners to all items
 * item.forEach(el => {
 *   on(el)('click', () => console.log('Item clicked'));
 * });
 * 
 * // Single action button (still an array)
 * on(action[0])('click', () => {
 *   item.forEach(el => el.remove());
 * });
 * 
 * // Null-safe
 * groupRefs(null); // {}
 * ```
 */
export const groupRefs = (root: ParentNode | null): Record<string, HTMLElement[]> => {
  const r: Record<string, HTMLElement[]> = {};
  if (root) {
    root.querySelectorAll<HTMLElement>('[data-ref]').forEach(el => {
      const k = el.dataset.ref;
      if (k) (r[k] = r[k] || []).push(el);
    });
  }
  return r;
};


// =============================================================================
// 15. COLOR UTILS
// =============================================================================

/**
 * Converts a color to a specific color space.
 * 
 * Uses CSS `color-mix()` to convert colors between color spaces like sRGB,
 * Display P3, etc. Requires a browser environment and modern browser support.
 * 
 * **Browser Support**: Requires support for `color-mix()` function (modern browsers).
 * Check compatibility before using in production.
 * 
 * **Color Space Literal Types**: Common values include 'srgb', 'display-p3',
 * 'rec2020', 'a98-rgb', 'prophoto-rgb'.
 * 
 * @param color - The color to convert (any valid CSS color)
 * @param space - The target color space (defaults to 'srgb')
 * @returns The color in the specified color space
 * 
 * @example
 * ```typescript
 * // Convert to Display P3 (wider gamut)
 * const p3Blue = toColorSpace('blue', 'display-p3');
 * 
 * // Convert hex to P3
 * const p3Red = toColorSpace('#ff0000', 'display-p3');
 * 
 * // Convert named color
 * const p3Green = toColorSpace('green', 'display-p3');
 * 
 * // Use in dynamic theming
 * const primaryColor = '#007bff';
 * const p3Primary = toColorSpace(primaryColor, 'display-p3');
 * CssVar.set(document.documentElement)('--primary-p3', p3Primary);
 * 
 * // Check browser support
 * try {
 *   const converted = toColorSpace('red', 'display-p3');
 *   console.log('P3 supported:', converted);
 * } catch (e) {
 *   console.log('P3 not supported, using fallback');
 * }
 * ```
 */
export const toColorSpace = (color: string, space: string = 'srgb'): string => {
  const div = document.createElement('div');
  div.style.color = `color-mix(in ${space}, ${color} 100%, transparent)`;
  document.body.appendChild(div);
  const res = getComputedStyle(div).color;
  div.remove();
  return res;
};

// =============================================================================
// 16. CLASS CYCLING & STATE MACHINES
// =============================================================================

/**
 * Creates a function that cycles through a list of CSS classes.
 * 
 * Returns a function that, when called, removes the current class and adds
 * the next one in the list. Useful for state machines, loading indicators,
 * or any cyclical UI states.
 * 
 * **State Machine Type Inference**: For better type safety, define your states
 * as a const array with `as const` assertion.
 * 
 * **State Persistence**: The current state is tracked internally. If you need
 * to persist state across page reloads, store the current index in localStorage.
 * 
 * @param target - The element to cycle classes on (null-safe)
 * @returns A curried function that accepts class array and returns cycle function
 * 
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * 
 * // Loading states
 * const nextState = cycleClass(button)(['idle', 'loading', 'success', 'error']);
 * 
 * on(button)('click', async () => {
 *   nextState(); // idle -> loading
 *   try {
 *     await fetchData();
 *     nextState(); // loading -> success
 *   } catch (e) {
 *     nextState(); // success -> error (or loading -> error)
 *   }
 * });
 * 
 * // Traffic light simulation
 * const light = document.querySelector('.traffic-light');
 * const nextLight = cycleClass(light)(['red', 'yellow', 'green']);
 * setInterval(nextLight, 2000); // Cycle every 2 seconds
 * 
 * // Theme cycling
 * const themeBtn = document.querySelector('.theme-toggle');
 * const cycleTheme = cycleClass(document.documentElement)(
 *   ['theme-light', 'theme-dark', 'theme-auto']
 * );
 * on(themeBtn)('click', cycleTheme);
 * 
 * // Animation states
 * const box = document.querySelector('.box');
 * const animate = cycleClass(box)(['bounce', 'shake', 'pulse', 'spin']);
 * on(box)('click', animate);
 * 
 * // Null-safe
 * const noop = cycleClass(null)(['a', 'b']); // Returns () => {}
 * ```
 */
export const cycleClass = (target: Element | null) => {
  return (classes: string[]): (() => void) => {
    if (!target) return () => { };

    return () => {
      const currentIdx = classes.findIndex(c => target.classList.contains(c));

      // Remove current class if found
      if (currentIdx > -1) target.classList.remove(classes[currentIdx]);

      // Add next class
      const nextIdx = (currentIdx + 1) % classes.length;
      target.classList.add(classes[nextIdx]);
    };
  };
};

// =============================================================================
// 17. CLEANUP & TEMPLATES
// =============================================================================

/**
 * Removes all event listeners from an element by cloning it.
 * 
 * Creates a clone of the element and replaces the original with the clone.
 * This effectively removes ALL event listeners (both those added via
 * addEventListener and inline handlers). The element type is preserved.
 * 
 * **Side Effects**: This is a destructive operation that removes ALL listeners,
 * including those you may want to keep. Use with caution.
 * 
 * **Memory Leak Prevention**: Useful when you need to completely reset an
 * element's event handlers, especially with third-party libraries that may
 * have attached listeners you can't easily remove.
 * 
 * @template T - The element type (preserved in return)
 * @param element - The element to strip listeners from (null-safe)
 * @returns The cloned element with no listeners, or null
 * 
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * 
 * // Add some listeners
 * button.addEventListener('click', handler1);
 * button.addEventListener('click', handler2);
 * button.onclick = handler3;
 * 
 * // Remove ALL listeners
 * const cleanButton = stripListeners(button);
 * // cleanButton has no listeners, but same content/attributes
 * 
 * // Use case: Reset third-party widget
 * const widget = document.querySelector('.third-party-widget');
 * const cleanWidget = stripListeners(widget);
 * // Now you can attach your own listeners
 * 
 * // Use case: Memory leak cleanup
 * const oldElement = document.querySelector('.leaky');
 * const fresh = stripListeners(oldElement);
 * // Old listeners are garbage collected
 * 
 * // Null-safe
 * stripListeners(null); // Returns null
 * 
 * // Note: Element must have a parent
 * const orphan = document.createElement('div');
 * stripListeners(orphan); // Returns orphan unchanged (no parent)
 * ```
 */
export const stripListeners = <T extends Element>(element: T | null): T | null => {
  if (!element || !element.parentNode) return element;
  const copy = element.cloneNode(true) as T;
  element.replaceWith(copy);
  return copy;
};

/**
 * Instantiates a <template> element by ID or reference.
 * 
 * Clones the template's content and optionally applies properties to the
 * first element in the fragment. Returns a DocumentFragment that can be
 * appended to the DOM.
 * 
 * **Template Pattern**: Templates are great for reusable HTML structures.
 * Define once in HTML, instantiate many times in JavaScript.
 * 
 * **Prop Application**: Properties are applied only to the first element child
 * in the fragment. For complex templates, use refs or selectors after appending.
 * 
 * @param templateOrSelector - Template element or selector string
 * @returns A curried function that accepts props and returns a DocumentFragment
 * @throws Error if template is not found or invalid
 * 
 * @example
 * ```typescript
 * // HTML:
 * // <template id="card-template">
 * //   <div class="card">
 * //     <h3 class="title"></h3>
 * //     <p class="description"></p>
 * //   </div>
 * // </template>
 * 
 * // Instantiate template
 * const card = instantiate('#card-template')({
 *   class: { featured: true },
 *   dataset: { id: '123' }
 * });
 * 
 * append(container)(card);
 * 
 * // Multiple instances
 * const cards = [
 *   { title: 'Card 1', id: '1' },
 *   { title: 'Card 2', id: '2' },
 *   { title: 'Card 3', id: '3' }
 * ].map(data => {
 *   const card = instantiate('#card-template')({
 *     dataset: { id: data.id }
 *   });
 *   // Modify after instantiation
 *   const title = card.querySelector('.title');
 *   if (title) title.textContent = data.title;
 *   return card;
 * });
 * 
 * // Use with template reference
 * const template = document.querySelector('#row-template') as HTMLTemplateElement;
 * const row = instantiate(template)({ class: { new: true } });
 * 
 * // No props
 * const simple = instantiate('#simple-template')();
 * ```
 */
export const instantiate = (templateOrSelector: string | HTMLTemplateElement) => {
  return (rootProps: ElementProps = {}): DocumentFragment => {
    const tpl = typeof templateOrSelector === 'string'
      ? document.querySelector(templateOrSelector) as HTMLTemplateElement
      : templateOrSelector;

    if (!tpl || !('content' in tpl)) {
      throw new Error(`instantiate: Invalid template '${templateOrSelector}'`);
    }

    const content = tpl.content.cloneNode(true) as DocumentFragment;

    // Apply props to the first actual element in the fragment
    if (Object.keys(rootProps).length > 0 && content.firstElementChild) {
      modify(content.firstElementChild as HTMLElement)(rootProps);
    }

    return content;
  };
};

/**
 * Creates multiple deep clones of a node.
 * 
 * Useful for creating skeleton screens, placeholder lists, or any scenario
 * where you need multiple copies of the same element structure.
 * 
 * **Deep Cloning**: Each clone includes all descendants and their attributes,
 * but NOT event listeners.
 * 
 * @param element - The node to clone (null-safe)
 * @returns A curried function that accepts count and returns array of clones
 * 
 * @example
 * ```typescript
 * const template = document.querySelector('.card-template');
 * 
 * // Create 5 skeleton cards
 * const skeletons = cloneMany(template)(5);
 * skeletons.forEach(card => append(container)(card));
 * 
 * // Loading placeholders
 * const placeholder = document.querySelector('.placeholder');
 * const placeholders = cloneMany(placeholder)(10);
 * append(list)(...placeholders);
 * 
 * // Generate list items
 * const listItem = el('li')({ class: { item: true } })([]);
 * const items = cloneMany(listItem)(20);
 * items.forEach((item, i) => {
 *   modify(item)({ text: `Item ${i + 1}` });
 * });
 * append(ul)(...items);
 * 
 * // Null-safe
 * cloneMany(null)(5); // Returns []
 * ```
 */
export const cloneMany = (element: Node | null) => {
  return (count: number): Node[] => {
    if (!element) return [];
    return Array.from({ length: count }).map(() => element.cloneNode(true));
  };
};

// =============================================================================
// 18. GEOMETRY & DIMENSIONS
// =============================================================================

/**
 * Gets the bounding client rectangle of an element.
 * 
 * Returns a DOMRect with position and size information. Safe for null elements
 * (returns an empty rect at origin). The rect is relative to the viewport.
 * 
 * **Reflow Considerations**: Reading layout properties like this triggers a reflow.
 * Batch reads together and separate from writes for better performance.
 * 
 * @param element - The element to get bounds for (null-safe)
 * @returns DOMRect with position and size, or empty rect if null
 * 
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * const bounds = rect(div);
 * 
 * console.log(bounds.width, bounds.height);
 * console.log(bounds.top, bounds.left);
 * console.log(bounds.right, bounds.bottom);
 * 
 * // Check if element is in viewport
 * const inViewport = (
 *   bounds.top >= 0 &&
 *   bounds.left >= 0 &&
 *   bounds.bottom <= window.innerHeight &&
 *   bounds.right <= window.innerWidth
 * );
 * 
 * // Calculate center point
 * const centerX = bounds.left + bounds.width / 2;
 * const centerY = bounds.top + bounds.height / 2;
 * 
 * // Null-safe
 * rect(null); // DOMRect(0, 0, 0, 0)
 * ```
 */
export const rect = (element: Element | null): DOMRect => {
  return element ? element.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
};

/**
 * Gets the element's position relative to the document.
 * 
 * Returns the absolute position from the top-left of the document, accounting
 * for scroll position. Unlike `getBoundingClientRect()`, this gives document
 * coordinates, not viewport coordinates.
 * 
 * **Viewport Calculation**: Adds current scroll position to viewport coordinates.
 * 
 * @param element - The element to get position for (null-safe)
 * @returns Object with top and left coordinates, or {0, 0} if null
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.target');
 * const pos = offset(element);
 * 
 * console.log('Distance from document top:', pos.top);
 * console.log('Distance from document left:', pos.left);
 * 
 * // Scroll to element position
 * window.scrollTo({
 *   top: pos.top - 100, // 100px offset from top
 *   behavior: 'smooth'
 * });
 * 
 * // Calculate distance between elements
 * const pos1 = offset(element1);
 * const pos2 = offset(element2);
 * const distance = Math.sqrt(
 *   Math.pow(pos2.left - pos1.left, 2) +
 *   Math.pow(pos2.top - pos1.top, 2)
 * );
 * 
 * // Null-safe
 * offset(null); // { top: 0, left: 0 }
 * ```
 */
export const offset = (element: HTMLElement | null) => {
  if (!element) return { top: 0, left: 0 };
  const box = element.getBoundingClientRect();
  const doc = document.documentElement;
  return {
    top: box.top + window.scrollY - doc.clientTop,
    left: box.left + window.scrollX - doc.clientLeft
  };
};

/**
 * Checks if an element is visible in the DOM.
 * 
 * An element is considered visible if it has non-zero dimensions (width or height).
 * This checks if the element consumes space in the layout, not if it's actually
 * in the viewport or has `visibility: visible`.
 * 
 * **Note**: This doesn't check `visibility`, `opacity`, or viewport position.
 * It only checks if the element has layout dimensions.
 * 
 * @param element - The element to check (null-safe)
 * @returns True if element has non-zero width or height
 * 
 * @example
 * ```typescript
 * const element = document.querySelector('.target');
 * 
 * if (isVisible(element)) {
 *   console.log('Element is rendered');
 * }
 * 
 * // Check before animating
 * if (isVisible(element)) {
 *   element.classList.add('animate');
 * }
 * 
 * // Hidden elements return false
 * element.style.display = 'none';
 * isVisible(element); // false
 * 
 * // Zero-sized elements return false
 * element.style.width = '0';
 * element.style.height = '0';
 * isVisible(element); // false
 * 
 * // Null-safe
 * isVisible(null); // false
 * ```
 */
export const isVisible = (element: HTMLElement | null): boolean => {
  return !!(element && (element.offsetWidth > 0 || element.offsetHeight > 0));
};


// =============================================================================
// 19. SCROLL & FOCUS
// =============================================================================

/**
 * Scrolls an element into view.
 * 
 * Uses the native `scrollIntoView()` API with customizable options. Returns
 * the element for chaining. Defaults to smooth scrolling with 'start' alignment.
 * 
 * **Accessibility**: Ensure focus management accompanies scrolling for keyboard users.
 * 
 * **Browser Differences**: Smooth scrolling may not work in all browsers.
 * The behavior gracefully degrades to instant scrolling.
 * 
 * @param element - The element to scroll into view (null-safe)
 * @returns A curried function that accepts options and returns the element
 * 
 * @example
 * ```typescript
 * const section = document.querySelector('#section-3');
 * 
 * // Smooth scroll to element
 * scrollInto(section)();
 * 
 * // Custom options
 * scrollInto(section)({
 *   behavior: 'smooth',
 *   block: 'center',
 *   inline: 'nearest'
 * });
 * 
 * // Instant scroll
 * scrollInto(section)({ behavior: 'auto' });
 * 
 * // Scroll to bottom of element
 * scrollInto(section)({ block: 'end' });
 * 
 * // Navigation with scroll
 * on(navLink)('click', (e) => {
 *   e.preventDefault();
 *   const target = document.querySelector(navLink.hash);
 *   scrollInto(target)();
 *   focus(target)(); // Also focus for accessibility
 * });
 * 
 * // Null-safe
 * scrollInto(null)(); // No-op, returns null
 * ```
 */
export const scrollInto = (element: Element | null) => {
  return (options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }) => {
    element?.scrollIntoView(options);
    return element;
  };
};

/**
 * Sets focus on an element.
 * 
 * Safely focuses an element with optional focus options. Returns the element
 * for chaining. Null-safe.
 * 
 * **Accessibility**: Essential for keyboard navigation and screen readers.
 * Always ensure focusable elements have visible focus indicators.
 * 
 * @param element - The element to focus (null-safe)
 * @returns A curried function that accepts options and returns the element
 * 
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * 
 * // Basic focus
 * focus(input)();
 * 
 * // Prevent scroll on focus
 * focus(input)({ preventScroll: true });
 * 
 * // Focus after modal opens
 * const modal = document.querySelector('.modal');
 * modal.classList.add('open');
 * const firstInput = modal.querySelector('input');
 * focus(firstInput)();
 * 
 * // Focus management in forms
 * on(form)('submit', (e) => {
 *   e.preventDefault();
 *   const firstError = form.querySelector('.error');
 *   if (firstError) {
 *     scrollInto(firstError)();
 *     focus(firstError)();
 *   }
 * });
 * 
 * // Null-safe
 * focus(null)(); // No-op, returns null
 * ```
 */
export const focus = (element: HTMLElement | null) => {
  return (options?: FocusOptions) => {
    element?.focus(options);
    return element;
  };
};

/**
 * Removes focus from an element.
 * 
 * Blurs the element, removing keyboard focus. Returns the element for chaining.
 * 
 * **Accessibility**: Use carefully - removing focus can disorient keyboard users.
 * Usually better to move focus to another element rather than blur.
 * 
 * @param element - The element to blur (null-safe)
 * @returns The element
 * 
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * 
 * // Remove focus
 * blur(input);
 * 
 * // Close dropdown on blur
 * on(dropdown)('blur', () => {
 *   dropdown.classList.remove('open');
 * });
 * 
 * // Validate on blur
 * on(input)('blur', () => {
 *   if (!input.value) {
 *     input.classList.add('error');
 *   }
 * });
 * 
 * // Null-safe
 * blur(null); // No-op, returns null
 * ```
 */
export const blur = (element: HTMLElement | null) => {
  element?.blur();
  return element;
};


// =============================================================================
// 20. TIMING UTILS (DEBOUNCE / THROTTLE)
// =============================================================================

/**
 * Debounces a function, delaying execution until after a pause in calls.
 * 
 * Creates a debounced version of the function that delays invoking until after
 * `ms` milliseconds have elapsed since the last time it was called. Perfect for
 * handling rapid events like typing, resizing, or scrolling.
 * 
 * @template T - The function type to debounce
 * @param fn - The function to debounce
 * @param ms - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * ```typescript
 * // Search as user types (waits for pause)
 * const searchInput = document.querySelector('input');
 * const performSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 *   // API call here
 * }, 300);
 * 
 * on(searchInput)('input', (e) => {
 *   performSearch((e.target as HTMLInputElement).value);
 * });
 * 
 * // Auto-save after user stops typing
 * const autoSave = debounce((content: string) => {
 *   localStorage.setItem('draft', content);
 *   console.log('Saved!');
 * }, 1000);
 * 
 * on(textarea)('input', (e) => {
 *   autoSave((e.target as HTMLTextAreaElement).value);
 * });
 * 
 * // Window resize handler
 * const handleResize = debounce(() => {
 *   console.log('Window resized to:', window.innerWidth);
 *   // Expensive layout calculations here
 * }, 250);
 * 
 * on(window)('resize', handleResize);
 * ```
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

/**
 * Throttles a function, limiting how often it can be called.
 * 
 * Creates a throttled version that only invokes the function at most once per
 * `ms` milliseconds. Unlike debounce, throttle ensures the function is called
 * regularly during continuous events. Perfect for scroll, mousemove, or other
 * high-frequency events.
 * 
 * @template T - The function type to throttle
 * @param fn - The function to throttle
 * @param ms - The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 * 
 * @example
 * ```typescript
 * // Scroll progress indicator (updates max once per 16ms)
 * const updateScrollProgress = throttle(() => {
 *   const scrollPercent = (window.scrollY / document.body.scrollHeight) * 100;
 *   progressBar.style.width = `${scrollPercent}%`;
 * }, 16); // ~60fps
 * 
 * on(window)('scroll', updateScrollProgress);
 * 
 * // Mouse tracking (limits updates)
 * const trackMouse = throttle((e: MouseEvent) => {
 *   console.log('Mouse at:', e.clientX, e.clientY);
 *   // Update parallax effect, etc.
 * }, 50);
 * 
 * on(document)('mousemove', trackMouse);
 * 
 * // Infinite scroll (check max once per 200ms)
 * const checkInfiniteScroll = throttle(() => {
 *   const scrollBottom = window.scrollY + window.innerHeight;
 *   if (scrollBottom >= document.body.scrollHeight - 100) {
 *     loadMoreItems();
 *   }
 * }, 200);
 * 
 * on(window)('scroll', checkInfiniteScroll);
 * 
 * // Difference from debounce:
 * // - Debounce: Waits for pause, then executes once
 * // - Throttle: Executes regularly during continuous events
 * ```
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let lastTime = 0;
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      fn(...args);
      lastTime = now;
    }
  };
};

// =============================================================================
// 21. WEB STORAGE (LOCAL & SESSION)
// =============================================================================

/**
 * Factory for creating typed storage wrappers.
 * 
 * Creates storage utilities that automatically handle JSON serialization/deserialization.
 * Used internally to create `Local` and `Session` storage objects.
 * 
 * **Generic Type Inference**: Use type parameters for type-safe storage access.
 * 
 * **Schema Validation**: For production apps, consider adding schema validation
 * to ensure stored data matches expected types.
 * 
 * **Quota Limits**: Most browsers limit localStorage to ~5-10MB. Check quota
 * before storing large amounts of data.
 * 
 * **Error Handling**: Storage operations can fail (quota exceeded, private browsing).
 * Wrap in try-catch for production use.
 * 
 * @param provider - The Storage object (localStorage or sessionStorage)
 * @returns Object with get, set, remove, and clear methods
 */
const createStorage = (provider: Storage) => ({
  /**
   * Gets a value from storage and parses it.
   * 
   * Attempts to parse as JSON. If parsing fails, returns the raw string.
   * Returns null if the key doesn't exist.
   * 
   * @template T - The expected type of the stored value
   * @param key - The storage key
   * @returns The parsed value or null
   * 
   * @example
   * ```typescript
   * // Get with type inference
   * interface User { id: number; name: string; }
   * const user = Local.get<User>('user');
   * 
   * // Get primitive
   * const count = Local.get<number>('count');
   * 
   * // Get with fallback
   * const theme = Local.get<string>('theme') || 'light';
   * ```
   */
  get: <T>(key: string): T | null => {
    const val = provider.getItem(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; }
    catch { return val as unknown as T; }
  },

  /**
   * Sets a value in storage (auto-stringifies objects).
   * 
   * Objects are JSON stringified. Primitives are converted to strings.
   * 
   * @param key - The storage key
   * @returns A curried function that accepts the value
   * 
   * @example
   * ```typescript
   * // Store object
   * Local.set('user')({ id: 1, name: 'John' });
   * 
   * // Store primitive
   * Local.set('count')(42);
   * Local.set('theme')('dark');
   * 
   * // Error handling
   * try {
   *   Local.set('largeData')(hugeObject);
   * } catch (e) {
   *   console.error('Storage quota exceeded');
   * }
   * ```
   */
  set: (key: string) => (value: any): void => {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
    provider.setItem(key, val);
  },

  /**
   * Removes a key from storage.
   * 
   * @param key - The storage key to remove
   * 
   * @example
   * ```typescript
   * Local.remove('user');
   * Session.remove('tempData');
   * ```
   */
  remove: (key: string) => provider.removeItem(key),

  /**
   * Clears all storage.
   * 
   * **Warning**: This removes ALL keys from the storage, not just those
   * created by your app. Use with caution.
   * 
   * @example
   * ```typescript
   * // Clear all localStorage
   * Local.clear();
   * 
   * // Clear session storage
   * Session.clear();
   * ```
   */
  clear: () => provider.clear()
});

/**
 * localStorage wrapper with automatic JSON serialization.
 * 
 * Provides type-safe access to localStorage with automatic parsing/stringification.
 * Data persists across browser sessions until explicitly cleared.
 * 
 * **Quota Limits**: ~5-10MB in most browsers. Check `navigator.storage.estimate()`
 * for available quota.
 * 
 * **Error Handling**: Can throw QuotaExceededError. Wrap in try-catch for production.
 * 
 * @example
 * ```typescript
 * // Store user data
 * interface User { id: number; name: string; email: string; }
 * const user: User = { id: 1, name: 'John', email: 'john@example.com' };
 * Local.set('user')(user);
 * 
 * // Retrieve user data
 * const savedUser = Local.get<User>('user');
 * if (savedUser) {
 *   console.log(savedUser.name);
 * }
 * 
 * // Store app settings
 * Local.set('settings')({
 *   theme: 'dark',
 *   language: 'en',
 *   notifications: true
 * });
 * 
 * // Remove item
 * Local.remove('tempData');
 * 
 * // Clear all
 * Local.clear();
 * ```
 */
export const Local = createStorage(window.localStorage);
/**
 * sessionStorage wrapper with automatic JSON serialization.
 * 
 * Provides type-safe access to sessionStorage. Data persists only for the
 * current browser session (tab). Cleared when the tab is closed.
 * 
 * **Use Cases**: Temporary data, form drafts, wizard state, tab-specific settings.
 * 
 * **Quota Limits**: Similar to localStorage (~5-10MB).
 * 
 * @example
 * ```typescript
 * // Store temporary form data
 * Session.set('formDraft')({
 *   name: 'John',
 *   email: 'john@example.com',
 *   message: 'Hello...'
 * });
 * 
 * // Retrieve on page reload
 * const draft = Session.get('formDraft');
 * if (draft) {
 *   Form.populate(form)(draft);
 * }
 * 
 * // Multi-step wizard
 * Session.set('wizardStep')(2);
 * Session.set('wizardData')({ step1: {...}, step2: {...} });
 * 
 * // Clear on completion
 * Session.remove('wizardStep');
 * Session.remove('wizardData');
 * ```
 */
export const Session = createStorage(window.sessionStorage);


// =============================================================================
// 22. COOKIES
// =============================================================================

/**
 * Utilities for working with browser cookies.
 * 
 * Provides a simple API for getting, setting, and removing cookies with
 * automatic URL encoding/decoding.
 * 
 * **Security**: Cookies are sent with every request to the domain. Use `secure`
 * and `httpOnly` flags for sensitive data. Consider using localStorage for
 * client-side only data.
 * 
 * **Size Limits**: Cookies are limited to ~4KB per cookie, ~20 cookies per domain.
 * 
 * @example
 * ```typescript
 * // Set a cookie
 * Cookie.set('theme')('dark')({ days: 30 });
 * 
 * // Get a cookie
 * const theme = Cookie.get('theme'); // "dark"
 * 
 * // Remove a cookie
 * Cookie.remove('theme');
 * ```
 */
export const Cookie = {
  /**
   * Gets a cookie value by name.
   * 
   * Returns the decoded cookie value or null if not found.
   * 
   * @param name - The cookie name
   * @returns The decoded cookie value or null
   * 
   * @example
   * ```typescript
   * const token = Cookie.get('auth_token');
   * if (token) {
   *   // User is authenticated
   * }
   * 
   * const userId = Cookie.get('user_id');
   * const preferences = Cookie.get('prefs');
   * ```
   */
  get: (name: string): string | null => {
    const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : null;
  },

  /**
   * Sets a cookie with optional expiration and security settings.
   * 
   * **Security Options**:
   * - `secure`: Only send over HTTPS (recommended for production)
   * - `path`: Limit cookie to specific path (defaults to '/')
   * - `days`: Expiration in days (omit for session cookie)
   * 
   * @param name - The cookie name
   * @returns A curried function that accepts value and options
   * 
   * @example
   * ```typescript
   * // Session cookie (expires when browser closes)
   * Cookie.set('session_id')('abc123')();
   * 
   * // Persistent cookie (7 days)
   * Cookie.set('theme')('dark')({ days: 7 });
   * 
   * // Secure cookie (HTTPS only)
   * Cookie.set('auth_token')('secret')({ days: 1, secure: true });
   * 
   * // Path-specific cookie
   * Cookie.set('admin_pref')('value')({ path: '/admin', days: 30 });
   * 
   * // Remember me (1 year)
   * Cookie.set('remember')('true')({ days: 365 });
   * ```
   */
  set: (name: string) => (value: string) => (options: { days?: number, path?: string, secure?: boolean } = {}) => {
    let d = new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * (options.days || 0));
    document.cookie = `${name}=${encodeURIComponent(value)}`
      + `;path=${options.path || '/'}`
      + (options.days ? `;expires=${d.toUTCString()}` : '')
      + (options.secure ? ';secure' : '');
  },

  /**
   * Removes a cookie by setting its expiration to the past.
   * 
   * @param name - The cookie name to remove
   * 
   * @example
   * ```typescript
   * // Logout: remove auth cookie
   * Cookie.remove('auth_token');
   * 
   * // Clear preferences
   * Cookie.remove('theme');
   * Cookie.remove('language');
   * ```
   */
  remove: (name: string) => {
    Cookie.set(name)('')({ days: -1 });
  }
};


// =============================================================================
// 23. NETWORK (FETCH WRAPPER)
// =============================================================================

/**
 * HTTP utilities - A lightweight, functional wrapper around the Fetch API.
 * 
 * Provides type-safe HTTP methods with automatic JSON handling, error checking,
 * and a curried API for flexible composition.
 * 
 * **Error Handling**: All methods throw on non-2xx responses. Wrap in try-catch
 * for production use.
 * 
 * **CORS Considerations**: 
 * - Credentials are not included by default. Add `credentials: 'include'` to headers for cookies.
 * - Preflight requests (OPTIONS) are handled automatically by the browser.
 * - Server must set appropriate CORS headers (Access-Control-Allow-Origin, etc.).
 * 
 * **Type Safety**: Use generic type parameters for response typing.
 * 
 * @example
 * ```typescript
 * // Define response types
 * interface User { id: number; name: string; email: string; }
 * interface ApiError { error: string; code: number; }
 * 
 * // GET with type safety
 * try {
 *   const user = await Http.get<User>('/api/user/123');
 *   console.log(user.name);
 * } catch (error) {
 *   console.error('Failed to fetch user:', error);
 * }
 * 
 * // POST with curried API
 * const response = await Http.post('/api/users')
 *   ({ name: 'John', email: 'john@example.com' })
 *   ({ 'Authorization': 'Bearer token123' });
 * 
 * // Error handling with typed responses
 * try {
 *   const data = await Http.get<User>('/api/user');
 * } catch (err) {
 *   if (err instanceof Error) {
 *     // Parse error message for status code
 *     if (err.message.includes('404')) {
 *       console.log('User not found');
 *     }
 *   }
 * }
 * 
 * // Retry pattern
 * async function fetchWithRetry<T>(
 *   url: string,
 *   maxRetries = 3,
 *   delay = 1000
 * ): Promise<T> {
 *   for (let i = 0; i < maxRetries; i++) {
 *     try {
 *       return await Http.get<T>(url);
 *     } catch (error) {
 *       if (i === maxRetries - 1) throw error;
 *       await wait(delay * (i + 1)); // Exponential backoff
 *     }
 *   }
 *   throw new Error('Max retries exceeded');
 * }
 * 
 * // CORS with credentials
 * const data = await Http.get<User>(
 *   'https://api.example.com/user',
 *   { 'credentials': 'include' } as any
 * );
 * ```
 */



// =============================================================================
// 24. SERVICE WORKER
// =============================================================================

/**
 * Service Worker utilities for Progressive Web Apps (PWAs).
 * 
 * Provides helpers for registering service workers, handling updates, and
 * communicating with the service worker.
 * 
 * **Browser Support**: Check for 'serviceWorker' in navigator before using.
 * 
 * **Lifecycle Events**:
 * 1. **Installing**: Service worker is being installed
 * 2. **Installed/Waiting**: New version is waiting to activate
 * 3. **Activating**: Service worker is taking control
 * 4. **Activated**: Service worker is controlling the page
 * 
 * **Update Strategy**: Service workers update when:
 * - User navigates to a page in scope
 * - An event like push/sync occurs
 * - You call `registration.update()`
 * 
 * @example
 * ```typescript
 * // Basic registration
 * const registration = await SW.register('/sw.js');
 * if (registration) {
 *   console.log('Service worker registered');
 * }
 * 
 * // Handle updates
 * const reg = await SW.register('/sw.js');
 * if (reg) {
 *   reg.addEventListener('updatefound', () => {
 *     const newWorker = reg.installing;
 *     newWorker?.addEventListener('statechange', () => {
 *       if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
 *         // New version available
 *         if (confirm('New version available! Reload?')) {
 *           window.location.reload();
 *         }
 *       }
 *     });
 *   });
 * }
 * 
 * // Send message to service worker
 * SW.post({ type: 'CACHE_CLEAR' });
 * SW.post({ type: 'SKIP_WAITING' });
 * ```
 */
export const SW = {
  /**
   * Registers a service worker script.
   * 
   * **Registration Scope**: By default, the scope is the directory containing
   * the service worker file. You can override this in registration options.
   * 
   * **Update Check**: The browser checks for updates to the service worker
   * script on navigation. Byte-for-byte comparison is used.
   * 
   * **Error Handling**: Returns null if registration fails or if service workers
   * are not supported. Check the return value before using.
   * 
   * @param scriptPath - Path to the service worker script (e.g., '/sw.js')
   * @param options - Optional registration options
   * @returns Promise resolving to ServiceWorkerRegistration or null
   * 
   * @example
   * ```typescript
   * // Basic registration
   * const reg = await SW.register('/sw.js');
   * if (reg) {
   *   console.log('SW registered with scope:', reg.scope);
   * }
   * 
   * // Custom scope
   * const reg = await SW.register('/sw.js', { scope: '/app/' });
   * 
   * // Check for updates manually
   * const reg = await SW.register('/sw.js');
   * if (reg) {
   *   // Check for updates every hour
   *   setInterval(() => reg.update(), 60 * 60 * 1000);
   * }
   * 
   * // Listen for lifecycle events
   * const reg = await SW.register('/sw.js');
   * if (reg) {
   *   // New service worker installing
   *   reg.addEventListener('updatefound', () => {
   *     const installing = reg.installing;
   *     console.log('New service worker installing...');
   *     
   *     installing?.addEventListener('statechange', () => {
   *       console.log('State changed to:', installing.state);
   *       // States: installing, installed, activating, activated, redundant
   *     });
   *   });
   * }
   * 
   * // Skip waiting and activate immediately
   * const reg = await SW.register('/sw.js');
   * if (reg?.waiting) {
   *   // Tell waiting SW to skip waiting
   *   SW.post({ type: 'SKIP_WAITING' });
   * }
   * 
   * // Unregister service worker
   * const reg = await SW.register('/sw.js');
   * if (reg) {
   *   await reg.unregister();
   *   console.log('Service worker unregistered');
   * }
   * ```
   */
  register: async (
    scriptPath: string,
    options?: RegistrationOptions
  ): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register(scriptPath, options);
        return reg;
      } catch (e) {
        //console.error('SW Registration Failed:', e);
        return null;
      }
    }
    return null;
  },

  /**
   * Posts a message to the active service worker.
   * 
   * **Controller**: The "controller" is the service worker that controls the
   * current page. It's null if no service worker is active.
   * 
   * **Message Format**: Use a consistent message format with a `type` field
   * for routing in the service worker.
   * 
   * **Response Handling**: To receive responses, listen for 'message' events
   * on navigator.serviceWorker.
   * 
   * @param message - The message to send (typically an object with a 'type' field)
   * 
   * @example
   * ```typescript
   * // Clear cache
   * SW.post({ type: 'CACHE_CLEAR' });
   * 
   * // Skip waiting (activate new service worker immediately)
   * SW.post({ type: 'SKIP_WAITING' });
   * 
   * // Custom message with data
   * SW.post({
   *   type: 'CACHE_URLS',
   *   urls: ['/page1.html', '/page2.html']
   * });
   * 
   * // Two-way communication
   * // Send message
   * SW.post({ type: 'GET_CACHE_SIZE' });
   * 
   * // Listen for response
   * navigator.serviceWorker.addEventListener('message', (event) => {
   *   if (event.data.type === 'CACHE_SIZE') {
   *     console.log('Cache size:', event.data.size);
   *   }
 * });
   * 
   * // Sync data when online
   * SW.post({
   *   type: 'SYNC_DATA',
   *   data: { userId: 123, updates: [...] }
   * });
   * 
   * // Check if controller exists before posting
   * if (navigator.serviceWorker?.controller) {
   *   SW.post({ type: 'PING' });
   * } else {
   *   console.log('No active service worker');
   * }
   * ```
   */
  post: (message: any) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }
};

// =============================================================================
// 25. EVENT LIFECYCLE & CLEANUP (LISTENER GROUPS)
// =============================================================================

/**
 * Creates a manager for grouping multiple event listeners and subscriptions.
 * 
 * Essential for preventing memory leaks in Single Page Applications (SPAs)
 * and component-based architectures. Allows batch cleanup of all listeners
 * when a component unmounts or a feature is disabled.
 * 
 * **Use Cases**:
 * - React useEffect cleanup
 * - Vue onUnmounted hooks
 * - Modal/dialog lifecycle management
 * - Feature toggle cleanup
 * - Page navigation cleanup
 * 
 * **Memory Leak Prevention**: Always call `clear()` when the component/feature
 * is destroyed to prevent memory leaks from orphaned event listeners.
 * 
 * @returns Object with `add` and `clear` methods for managing subscriptions
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const group = createListenerGroup();
 * 
 * // Add multiple listeners
 * group.add(on(button)('click', handleClick));
 * group.add(on(window)('resize', handleResize));
 * group.add(on(document)('keydown', handleKeydown));
 * 
 * // Later: cleanup all at once
 * group.clear(); // Removes all 3 listeners
 * 
 * // React integration
 * function MyComponent() {
 *   useEffect(() => {
 *     const listeners = createListenerGroup();
 *     
 *     listeners.add(on(button)('click', handleClick));
 *     listeners.add(on(window)('scroll', handleScroll));
 *     listeners.add(Data.bind(element)('count', handleCountChange));
 *     
 *     // Cleanup on unmount
 *     return () => listeners.clear();
 *   }, []);
 * }
 * 
 * // Vue 3 Composition API
 * import { onUnmounted } from 'vue';
 * 
 * export default {
 *   setup() {
 *     const listeners = createListenerGroup();
 *     
 *     listeners.add(on(button.value)('click', handleClick));
 *     listeners.add(on(window)('resize', handleResize));
 *     
 *     onUnmounted(() => {
 *       listeners.clear();
 *     });
 *   }
 * }
 * 
 * // Modal lifecycle
 * class Modal {
 *   private listeners = createListenerGroup();
 *   
 *   open() {
 *     this.listeners.add(on(this.closeBtn)('click', () => this.close()));
 *     this.listeners.add(on(this.overlay)('click', () => this.close()));
 *     this.listeners.add(on(document)('keydown', (e) => {
 *       if (e.key === 'Escape') this.close();
 *     }));
 *   }
 *   
 *   close() {
 *     this.listeners.clear(); // Clean up all listeners
 *     remove(this.element);
 *   }
 * }
 * 
 * // Feature toggle
 * const featureListeners = createListenerGroup();
 * 
 * function enableFeature() {
 *   featureListeners.add(on(button)('click', featureHandler));
 *   featureListeners.add(watchClass(element)('active', handleActiveChange));
 * }
 * 
 * function disableFeature() {
 *   featureListeners.clear(); // Remove all feature listeners
 * }
 * 
 * // Page navigation cleanup
 * let currentPageListeners = createListenerGroup();
 * 
 * function navigateTo(page: string) {
 *   // Clean up previous page
 *   currentPageListeners.clear();
 *   
 *   // Set up new page
 *   currentPageListeners = createListenerGroup();
 *   currentPageListeners.add(on(pageElement)('click', handlePageClick));
 *   // ... more listeners
 * }
 * 
 * // Combining with other cleanup
 * const group = createListenerGroup();
 * 
 * // Add regular listeners
 * group.add(on(button)('click', handler));
 * 
 * // Add custom cleanup logic
 * group.add(() => {
 *   console.log('Custom cleanup');
 *   clearInterval(intervalId);
 *   cancelAnimationFrame(rafId);
 * });
 * 
 * group.clear(); // Runs all cleanup functions
 * ```
 */
export const createListenerGroup = () => {
  const unsubs: Unsubscribe[] = [];
  return {
    /**
     * Registers a cleanup function or unsubscribe callback.
     * 
     * @param fn - The cleanup function to register
     * 
     * @example
     * ```typescript
     * const group = createListenerGroup();
     * 
     * // Add event listener cleanup
     * group.add(on(button)('click', handler));
     * 
     * // Add observer cleanup
     * group.add(watchClass(element)('active', callback));
     * 
     * // Add custom cleanup
     * group.add(() => {
     *   clearTimeout(timeoutId);
     *   worker.terminate();
     * });
     * ```
     */
    add: (fn: Unsubscribe) => {
      unsubs.push(fn);
    },

    /**
     * Executes all registered cleanup functions and clears the list.
     * 
     * **Order**: Cleanup functions are called in the order they were added.
     * 
     * **Idempotent**: Safe to call multiple times - subsequent calls do nothing.
     * 
     * @example
     * ```typescript
     * const group = createListenerGroup();
     * group.add(on(btn)('click', handler));
     * group.add(on(window)('resize', resizeHandler));
     * 
     * group.clear(); // Removes both listeners
     * group.clear(); // Safe to call again - does nothing
     * ```
     */
    clear: () => {
      unsubs.forEach(fn => fn());
      unsubs.length = 0;
    }
  };
};


// =============================================================================
// 26. SIGNALS & CONTROLLERS (ABORTCONTROLLER)
// =============================================================================

/**
 * AbortController and AbortSignal utilities for cancellable operations.
 * 
 * Provides helpers for creating abort signals, timeout signals, and wrapping
 * promises with cancellation support. Essential for managing async operations
 * that may need to be cancelled (fetch requests, animations, long computations).
 * 
 * **Use Cases**:
 * - Cancel fetch requests when component unmounts
 * - Timeout long-running operations
 * - Cancel animations or intervals
 * - Abort expensive computations
 * 
 * **Signal Composition**: Multiple operations can share the same signal,
 * allowing batch cancellation.
 * 
 * @example
 * ```typescript
 * // Basic cancellation
 * const { signal, abort } = Signal.create();
 * fetch('/api/data', { signal });
 * // Later: abort the request
 * abort();
 * 
 * // Timeout pattern
 * const timeoutSignal = Signal.timeout(5000);
 * try {
 *   const data = await fetch('/api/slow', { signal: timeoutSignal });
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.log('Request timed out');
 *   }
 * }
 * 
 * // Wrap non-fetch promises
 * const { signal, abort } = Signal.create();
 * const result = await Signal.wrap(
 *   longRunningComputation(),
 *   signal
 * );
 * ```
 */
export const Signal = {
  /**
   * Creates a new AbortController and returns its signal and abort function.
   * 
   * **Pattern**: Destructure to get both signal and abort function.
   * 
   * **Cleanup**: Call abort() to cancel all operations using this signal.
   * 
   * @returns Object with `signal` (AbortSignal) and `abort` function
   * 
   * @example
   * ```typescript
   * // Basic usage
   * const { signal, abort } = Signal.create();
   * 
   * fetch('/api/users', { signal })
   *   .then(res => res.json())
   *   .catch(err => {
   *     if (err.name === 'AbortError') {
   *       console.log('Request was cancelled');
   *     }
   *   });
   * 
   * // Cancel the request
   * abort();
   * 
   * // React component cleanup
   * function UserList() {
   *   useEffect(() => {
   *     const { signal, abort } = Signal.create();
   *     
   *     fetch('/api/users', { signal })
   *       .then(res => res.json())
   *       .then(setUsers);
   *     
   *     return () => abort(); // Cancel on unmount
   *   }, []);
   * }
   * 
   * // Multiple operations with same signal
   * const { signal, abort } = Signal.create();
   * 
   * Promise.all([
   *   fetch('/api/users', { signal }),
   *   fetch('/api/posts', { signal }),
   *   fetch('/api/comments', { signal })
   * ]);
   * 
   * // Abort all three requests at once
   * abort();
   * 
   * // Conditional abort
   * const { signal, abort } = Signal.create();
   * const button = document.querySelector('button');
   * 
   * on(button)('click', () => {
   *   fetch('/api/data', { signal });
   * });
   * 
   * on(button)('click', () => {
   *   abort(); // Cancel if clicked again
   * });
   * ```
   */
  create: () => {
    const c = new AbortController();
    return { signal: c.signal, abort: () => c.abort() };
  },

  /**
   * Creates an AbortSignal that automatically aborts after a timeout.
   * 
   * **Browser Support**: Uses native `AbortSignal.timeout()` if available,
   * falls back to manual implementation for older browsers.
   * 
   * **Use Case**: Prevent operations from running indefinitely.
   * 
   * @param ms - Timeout in milliseconds
   * @returns An AbortSignal that aborts after the specified time
   * 
   * @example
   * ```typescript
   * // Timeout fetch request after 5 seconds
   * try {
   *   const response = await fetch('/api/data', {
   *     signal: Signal.timeout(5000)
   *   });
   *   const data = await response.json();
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     console.log('Request timed out after 5 seconds');
   *   }
   * }
   * 
   * // Different timeouts for different endpoints
   * const fastEndpoint = fetch('/api/fast', {
   *   signal: Signal.timeout(1000)
   * });
   * 
   * const slowEndpoint = fetch('/api/slow', {
   *   signal: Signal.timeout(10000)
   * });
   * 
   * // Timeout with fallback
   * async function fetchWithFallback(url: string) {
   *   try {
   *     return await fetch(url, { signal: Signal.timeout(3000) });
   *   } catch (error) {
   *     if (error.name === 'AbortError') {
   *       // Return cached data or default
   *       return getCachedData(url);
   *     }
   *     throw error;
   *   }
   * }
   * 
   * // Timeout for non-fetch operations
   * const result = await Signal.wrap(
   *   expensiveComputation(),
   *   Signal.timeout(5000)
   * );
   * ```
   */
  timeout: (ms: number): AbortSignal => {
    // Use native if available, fallback for older browsers
    if ('timeout' in AbortSignal) return AbortSignal.timeout(ms);
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  },

  /**
   * Wraps a Promise to make it abortable via an AbortSignal.
   * 
   * **Behavior**: If the signal aborts, the promise rejects with AbortError.
   * The original promise continues running but its result is ignored.
   * 
   * **Error Handling**: Always check for `error.name === 'AbortError'` to
   * distinguish cancellation from other errors.
   * 
   * @template T - The promise result type
   * @param promise - The promise to wrap
   * @param signal - Optional AbortSignal to control cancellation
   * @returns The wrapped promise that can be cancelled
   * 
   * @example
   * ```typescript
   * // Wrap async function
   * const { signal, abort } = Signal.create();
   * 
   * async function processData() {
   *   await wait(1000);
   *   return { result: 'done' };
   * }
   * 
   * const result = await Signal.wrap(processData(), signal);
   * 
   * // Cancel before completion
   * setTimeout(() => abort(), 500);
   * 
   * // Timeout pattern
   * try {
   *   const result = await Signal.wrap(
   *     longComputation(),
   *     Signal.timeout(5000)
   *   );
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     console.log('Computation timed out');
   *   }
 * }
   * 
   * // Animation loop with cancellation
   * async function animateWithCancel(signal: AbortSignal) {
   *   for (let i = 0; i < 100; i++) {
   *     if (signal.aborted) break;
   *     await Signal.wrap(nextFrame(), signal);
   *     element.style.opacity = String(i / 100);
   *   }
   * }
   * 
   * const { signal, abort } = Signal.create();
   * animateWithCancel(signal);
   * // Later: abort()
   * 
   * // Race with timeout
   * const { signal, abort } = Signal.create();
   * 
   * try {
   *   const result = await Promise.race([
   *     Signal.wrap(fetchData(), signal),
   *     wait(5000).then(() => { throw new Error('Timeout'); })
   *   ]);
   * } catch (error) {
   *   console.error('Failed or timed out:', error);
   * }
   * 
   * // Cleanup on abort
   * const { signal, abort } = Signal.create();
   * 
   * signal.addEventListener('abort', () => {
   *   console.log('Operation cancelled, cleaning up...');
   *   cleanup();
   * });
   * 
   * await Signal.wrap(operation(), signal);
   * ```
   */
  wrap: <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));

    return new Promise((resolve, reject) => {
      const abortHandler = () => {
        reject(new DOMException('Aborted', 'AbortError'));
        signal.removeEventListener('abort', abortHandler);
      };

      signal.addEventListener('abort', abortHandler);

      promise.then(
        val => { signal.removeEventListener('abort', abortHandler); resolve(val); },
        err => { signal.removeEventListener('abort', abortHandler); reject(err); }
      );
    });
  }
};


// =============================================================================
// 27. APP-WIDE PUB/SUB (TYPED EVENT BUS)
// =============================================================================

/**
 * Creates a strongly-typed event bus for application-wide communication.
 * 
 * Provides a type-safe pub/sub system using native EventTarget under the hood.
 * Perfect for decoupling components without the overhead of heavy state
 * management libraries.
 * 
 * **Type Safety**: Define your event map as a type parameter for full
 * IntelliSense support and compile-time checking.
 * 
 * **vs Native Events**: Unlike DOM events, this provides:
 * - Type-safe event names and payloads
 * - No DOM dependency (works anywhere)
 * - Simpler API focused on pub/sub patterns
 * 
 * **Performance**: Uses native EventTarget, so it's as fast as DOM events.
 * 
 * **Memory**: Remember to unsubscribe when components unmount to prevent leaks.
 * 
 * @template Events - Event map type: `{ eventName: payloadType }`
 * @returns Object with `on`, `emit`, and `once` methods
 * 
 * @example
 * ```typescript
 * // Define event types
 * interface AppEvents {
 *   'user:login': { id: number; name: string; };
 *   'user:logout': void;
 *   'cart:add': { productId: string; quantity: number; };
 *   'cart:remove': { productId: string; };
 *   'notification:show': { message: string; type: 'success' | 'error'; };
 * }
 * 
 * // Create typed bus
 * const bus = createBus<AppEvents>();
 * 
 * // Subscribe with full type safety
 * const unsubscribe = bus.on('user:login', (data) => {
 *   console.log(`User ${data.name} logged in`); // data is typed!
 *   updateUI(data.id);
 * });
 * 
 * // Emit events
 * bus.emit('user:login', { id: 123, name: 'John' });
 * bus.emit('user:logout'); // void events don't need data
 * 
 * // Cleanup
 * unsubscribe();
 * 
 * // One-time listeners
 * bus.once('user:login', (data) => {
 *   console.log('First login:', data.name);
 *   // Automatically unsubscribes after first call
 * });
 * 
 * // Cross-component communication
 * // Component A
 * bus.on('cart:add', ({ productId, quantity }) => {
 *   updateCartUI(productId, quantity);
 *   showNotification(`Added ${quantity} items`);
 * });
 * 
 * // Component B
 * function addToCart(productId: string, qty: number) {
 *   bus.emit('cart:add', { productId, quantity: qty });
 * }
 * 
 * // React integration
 * function CartBadge() {
 *   const [count, setCount] = useState(0);
 *   
 *   useEffect(() => {
 *     const unsub1 = bus.on('cart:add', ({ quantity }) => {
 *       setCount(c => c + quantity);
 *     });
 *     
 *     const unsub2 = bus.on('cart:remove', () => {
 *       setCount(c => c - 1);
 *     });
 *     
 *     return () => {
 *       unsub1();
 *       unsub2();
 *     };
 *   }, []);
 *   
 *   return <span>{count}</span>;
 * }
 * 
 * // Global notification system
 * const notifications = createBus<{
 *   show: { message: string; type: 'info' | 'success' | 'error'; };
 *   hide: void;
 * }>();
 * 
 * notifications.on('show', ({ message, type }) => {
 *   const toast = createToast(message, type);
 *   append(document.body)(toast);
 * });
 * 
 * // Anywhere in your app
 * notifications.emit('show', {
 *   message: 'Saved successfully!',
 *   type: 'success'
 * });
 * ```
 */
export const createBus = <Events extends Record<string, any>>() => {
  const target = new EventTarget();

  return {
    /**
     * Subscribes to an event.
     * 
     * **Type Safety**: Event name and data are fully typed based on the Events map.
     * 
     * **Cleanup**: Always store and call the returned unsubscribe function to
     * prevent memory leaks.
     * 
     * @template K - Event name (inferred from Events)
     * @param event - The event name to listen for
     * @param handler - Callback function receiving typed event data
     * @returns Unsubscribe function to remove the listener
     * 
     * @example
     * ```typescript
     * interface Events {
     *   'data:updated': { id: number; value: string; };
     * }
     * 
     * const bus = createBus<Events>();
     * 
     * // Subscribe
     * const unsub = bus.on('data:updated', (data) => {
     *   console.log(`Data ${data.id} = ${data.value}`);
     * });
     * 
     * // Unsubscribe
     * unsub();
     * 
     * // Multiple subscribers
     * const unsub1 = bus.on('data:updated', updateUI);
     * const unsub2 = bus.on('data:updated', logChange);
     * const unsub3 = bus.on('data:updated', syncToServer);
     * 
     * // Cleanup all
     * [unsub1, unsub2, unsub3].forEach(fn => fn());
     * ```
     */
    on: <K extends keyof Events & string>(
      event: K,
      handler: (data: Events[K]) => void
    ): Unsubscribe => {
      const listener = (e: Event) => handler((e as CustomEvent).detail);
      target.addEventListener(event, listener);
      return () => target.removeEventListener(event, listener);
    },

    /**
     * Emits an event with typed data.
     * 
     * **Type Checking**: TypeScript ensures you provide the correct data type
     * for each event.
     * 
     * **Synchronous**: All handlers are called synchronously in registration order.
     * 
     * @template K - Event name (inferred from Events)
     * @param event - The event name to emit
     * @param data - The event data (type-checked against Events map)
     * 
     * @example
     * ```typescript
     * interface Events {
     *   'save': { id: number; data: object; };
     *   'delete': { id: number; };
     *   'clear': void;
     * }
     * 
     * const bus = createBus<Events>();
     * 
     * // Valid emissions
     * bus.emit('save', { id: 1, data: { name: 'John' } });
     * bus.emit('delete', { id: 1 });
     * bus.emit('clear'); // void event
     * 
     * // TypeScript errors:
     * // bus.emit('save', { id: 1 }); // Missing 'data'
     * // bus.emit('delete', {}); // Missing 'id'
     * // bus.emit('clear', {}); // Unexpected data
     * 
     * // Conditional emit
     * if (hasChanges) {
     *   bus.emit('save', { id, data: formData });
     * }
     * ```
     */
    emit: <K extends keyof Events & string>(event: K, data: Events[K]) => {
      target.dispatchEvent(new CustomEvent(event, { detail: data }));
    },

    /**
     * Subscribes to an event for one-time execution.
     * 
     * **Auto-Unsubscribe**: The handler is automatically removed after the
     * first time it's called.
     * 
     * **Use Cases**: Initialization events, one-time confirmations, first-load actions.
     * 
     * @template K - Event name (inferred from Events)
     * @param event - The event name to listen for
     * @param handler - Callback function (called only once)
     * 
     * @example
     * ```typescript
     * interface Events {
     *   'app:ready': void;
     *   'user:firstLogin': { userId: number; };
     * }
     * 
     * const bus = createBus<Events>();
     * 
     * // Run once when app is ready
     * bus.once('app:ready', () => {
     *   console.log('App initialized');
     *   loadUserPreferences();
     * });
     * 
     * // First login bonus
     * bus.once('user:firstLogin', ({ userId }) => {
     *   showWelcomeModal(userId);
     *   grantSignupBonus(userId);
     * });
     * 
     * // Emit multiple times - handler only runs once
     * bus.emit('app:ready');
     * bus.emit('app:ready'); // Handler doesn't run again
     * ```
     */
    once: <K extends keyof Events & string>(
      event: K,
      handler: (data: Events[K]) => void
    ): void => {
      const listener = (e: Event) => handler((e as CustomEvent).detail);
      target.addEventListener(event, listener, { once: true });
    }
  };
};

// =============================================================================
// 28. FLUENT WRAPPER ($)
// =============================================================================

/**
 * Wraps a single element in a fluent object with all fdom functions pre-bound.
 * 
 * Provides an object-oriented, method-chaining API as an alternative to the
 * functional style. All methods return the wrapper (except getters), enabling
 * jQuery-like chaining.
 * 
 * **vs Functional Style**:
 * - **Fluent**: `$(btn).addClass('active').css({ color: 'red' }).on('click', handler)`
 * - **Functional**: `cls.add(btn)('active'); css(btn)({ color: 'red' }); on(btn)('click', handler)`
 * 
 * **When to Use**:
 * - **Fluent ($)**: When performing multiple operations on the same element
 * - **Functional**: When working with multiple elements or in functional pipelines
 * 
 * **Type Preservation**: The generic type parameter preserves the element type
 * throughout the chain.
 * 
 * **Null Safety**: All methods handle null elements gracefully.
 * 
 * @template T - The HTML element type (inferred from input)
 * @param target - The element to wrap (null-safe)
 * @returns Fluent wrapper object with all fdom methods pre-bound
 * 
 * @example
 * ```typescript
 * // Basic chaining
 * const button = document.querySelector('button');
 * $(button)
 *   .modify({ text: 'Click me' })
 *   .addClass('btn', 'btn-primary')
 *   .css({ padding: '10px 20px' })
 *   .on('click', () => console.log('Clicked!'));
 * 
 * // vs Functional style (same result)
 * modify(button)({ text: 'Click me' });
 * cls.add(button)('btn', 'btn-primary');
 * css(button)({ padding: '10px 20px' });
 * on(button)('click', () => console.log('Clicked!'));
 * 
 * // Type preservation
 * const input = document.querySelector('input');
 * $(input)
 *   .modify({ value: 'test' })
 *   .val('new value')  // Type-safe: knows it's an input
 *   .onInput((val) => console.log(val));
 * 
 * // Conditional chaining
 * $(element)
 *   .addClass('base')
 *   .toggleClass('active', isActive)
 *   .css({ opacity: isVisible ? '1' : '0' });
 * 
 * // Event handling with chaining
 * $(form)
 *   .on('submit', (e) => {
 *     e.preventDefault();
 *     const data = Form.serialize(form);
 *     submitData(data);
 *   })
 *   .on('reset', () => console.log('Form reset'));
 * 
 * // Access raw element
 * const wrapped = $(button);
 * const raw = wrapped.raw; // Get underlying HTMLElement
 * 
 * // Complex UI setup
 * $(modal)
 *   .addClass('modal')
 *   .css({ display: 'none' })
 *   .on('click', (e) => {
 *     if (e.target === modal) closeModal();
 *   })
 *   .append(
 *     el('div')({ class: { 'modal-content': true } })([
 *       el('h2')({})(['Modal Title']),
 *       el('p')({})(['Modal content'])
 *     ])
 *   );
 * 
 * // Animation with chaining
 * $(element)
 *   .addClass('fade-in')
 *   .waitTransition()
 *   .then(() => {
 *     $(element).removeClass('fade-in').addClass('visible');
 *   });
 * 
 * // Null-safe operations
 * const missing = document.querySelector('.nonexistent');
 * $(missing).addClass('test'); // No error, safely ignored
 * 
 * // Comparison: Fluent vs Functional
 * // Fluent: Better for single-element operations
 * $(button).addClass('active').css({ color: 'red' });
 * 
 * // Functional: Better for multiple elements
 * [button1, button2, button3].forEach(btn => {
 *   cls.add(btn)('active');
 *   css(btn)({ color: 'red' });
 * });
 * 
 * // Or use $$ for batch operations
 * $$('.button').addClass('active').css({ color: 'red' });
 * ```
 */
export const $ = <T extends HTMLElement>(target: T | null) => {
  // Helper to bind target-first functions and return wrapper for chaining
  const chain = <F extends (t: any) => (...args: any[]) => any>(fn: F) =>
    (...args: Parameters<ReturnType<F>>) => {
      if (target) fn(target)(...args);
      return wrapper;
    };

  const wrapper = {
    /**
     * The raw underlying HTMLElement.
     * @type {T | null}
     */
    raw: target,

    // =========================================
    // EVENTS
    // =========================================

    /**
     * Adds an event listener.
     * @param event - Event name (e.g., 'click', 'submit')
     * @param handler - Function to handle the event
     * @param options - Event options (capture, passive, etc.)
     * @returns {this} Fluent wrapper for chaining
     */
    on: chain(on),

    /**
     * Dispatches a custom event.
     * @param name - Name of the event
     * @param detail - Data to pass with the event
     * @returns {this} Fluent wrapper for chaining
     */
    dispatch: chain(dispatch),

    // =========================================
    // MANIPULATION
    // =========================================

    /**
     * Modifies element properties (text, html, class, etc.).
     * @param props - Object of properties to set
     * @returns {this} Fluent wrapper for chaining
     */
    modify: chain(modify),

    /**
     * Applies inline CSS styles.
     * @param styles - Object of CSS properties (camelCase or kebab-case)
     * @returns {this} Fluent wrapper for chaining
     */
    css: chain(css),

    /**
     * Applies temporary styles that revert after a delay.
     * @param styles - Styles to apply
     * @param ms - Optional duration in ms to revert styles
     * @returns {this} Fluent wrapper for chaining
     */
    tempStyle: (styles: Partial<CSSStyleDeclaration>, ms?: number) => {
      if (target) {
        const revert = tempStyle(target)(styles);
        if (ms) setTimeout(revert, ms);
      }
      return wrapper;
    },

    // =========================================
    // STRUCTURE
    // =========================================

    /**
     * Appends children to this element.
     * @param children - Elements or strings to append
     * @returns {this} Fluent wrapper for chaining
     */
    append: chain(append),

    /**
     * Prepends children to this element.
     * @param children - Elements or strings to prepend
     * @returns {this} Fluent wrapper for chaining
     */
    prepend: chain(prepend),

    /**
     * Inserts content after this element.
     * @param content - Elements or strings to insert
     * @returns {this} Fluent wrapper for chaining
     */
    after: chain(after),

    /**
     * Inserts content before this element.
     * @param content - Elements or strings to insert
     * @returns {this} Fluent wrapper for chaining
     */
    before: chain(before),

    /**
     * Removes this element from the DOM.
     * @returns {void}
     */
    remove: () => { if (target) remove(target); },

    /**
     * Removes all children from this element.
     * @returns {this} Fluent wrapper for chaining
     */
    empty: () => { if (target) empty(target); return wrapper; },

    /**
     * Wraps this element with another element.
     * @param wrapperEl - The wrapping element
     * @returns {this} Fluent wrapper for chaining
     */
    wrap: chain(wrap),

    /**
     * Clones this element.
     * @returns {HTMLElement} The cloned element (not wrapped)
     */
    clone: () => target ? clone(target) : null,

    // =========================================
    // CLASSES
    // =========================================

    /**
     * Adds one or more classes.
     * @param classes - Class names to add
     * @returns {this} Fluent wrapper for chaining
     */
    addClass: chain(cls.add),

    /**
     * Removes one or more classes.
     * @param classes - Class names to remove
     * @returns {this} Fluent wrapper for chaining
     */
    removeClass: chain(cls.remove),

    /**
     * Toggles a class (conditionally or always).
     * @param className - Class to toggle
     * @param force - Optional boolean to force add/remove
     * @returns {this} Fluent wrapper for chaining
     */
    toggleClass: chain(cls.toggle),

    /**
     * Replaces one class with another.
     * @param oldClass - Class to remove
     * @param newClass - Class to add
     * @returns {this} Fluent wrapper for chaining
     */
    replaceClass: chain(cls.replace),

    /**
     * Checks if the element has a class.
     * @param className - Class to check
     * @returns {boolean} True if class exists
     */
    hasClass: (className: string) => target ? cls.has(target)(className) : false,

    /**
     * Watches for class changes.
     * @param callback - Function called when classes change
     * @returns {Unsubscribe} Function to stop watching
     */
    //watchClass: (callback: (classes: string[]) => void) => target ? watchClass(target)(callback) : () => { },

    /**
     * Cycles through a list of classes (removes current, adds next).
     * @param classes - Array of classes to cycle
     * @returns {this} Fluent wrapper for chaining
     */
    cycleClass: chain(cycleClass),

    // =========================================
    // DATA & ATTRIBUTES
    // =========================================

    /**
     * Gets a data attribute value (raw string).
     * @param key - Attribute name (without 'data-')
     * @returns {string | undefined} Raw value
     */
    dataGet: (key: string) => target ? Data.get(target)(key) : undefined,

    /**
     * Sets a data attribute.
     * @param key - Attribute name
     * @param val - Value to set (automatically stringified)
     * @returns {this} Fluent wrapper for chaining
     */
    dataSet: chain(Data.set),

    /**
     * Reads and parses a data attribute.
     * @param key - Attribute name
     * @returns {any} Parsed value (JSON, number, boolean, string)
     */
    dataRead: (key: string) => target ? Data.read(target)(key) : undefined,

    /**
     * Binds a callback to data attribute changes.
     * @param key - Attribute to watch
     * @param handler - Callback receiving new parsed value
     * @returns {Unsubscribe} Function to stop watching
     */
    dataBind: (key: string, handler: (val: any) => void) => target ? Data.bind(target)(key, handler) : () => { },

    /**
     * Watches an attribute for changes.
     * @param attr - Attribute name
     * @param handler - Callback receiving new value
     * @returns {Unsubscribe} Function to stop watching
     */
    watchAttr: (attr: string, handler: (val: string | null) => void) => target ? watchAttr(target)(attr, handler) : () => { },

    /**
     * Watches text content for changes.
     * @param handler - Callback receiving new text
     * @returns {Unsubscribe} Function to stop watching
     */
    watchText: (handler: (text: string | null) => void) => target ? watchText(target)(handler) : () => { },

    // =========================================
    // INPUTS & FORMS
    // =========================================

    /**
     * Gets or sets the value.
     * - No args: Gets value (smart typed)
     * - Arg provided: Sets value
     * @param newVal - Value to set
     * @returns {any | this} Value if getting, wrapper if setting
     */
    val: (newVal?: any) => {
      if (newVal === undefined) return Input.get(target as unknown as FormElement);
      Input.set(target as unknown as FormElement)(newVal);
      return wrapper;
    },

    /**
     * Gets files from an input[type="file"].
     * @returns {File[]} Array of files
     */
    files: () => Input.files(target as unknown as HTMLInputElement),

    /**
     * Listens for input events (keystrokes).
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onInput: (handler: (val: any, e: Event) => void) => target ? Input.watch(target as unknown as FormElement)(handler) : () => { },

    /**
     * Listens for input events with debounce.
     * @param ms - Debounce delay in ms
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onInputDebounced: (ms: number, handler: (val: any, e: Event) => void) => target ? Input.watchDebounced(target as unknown as FormElement)(handler as unknown as any, ms) : () => { },

    /**
     * Listens for change events (blur/enter).
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onChange: (handler: (val: any, e: Event) => void) => target ? Input.change(target as unknown as FormElement)(handler) : () => { },

    /**
     * Selects all text in the input.
     * @returns {this} Fluent wrapper for chaining
     */
    selectText: () => { Input.select(target as unknown as HTMLInputElement); return wrapper; },

    /**
     * Validates the input using HTML5 validation API.
     * @returns {boolean} True if valid
     */
    validate: () => target ? Input.validate(target as unknown as FormElement) : false,

    // =========================================
    // KEYBOARD
    // =========================================

    /**
     * Listens for a specific key press.
     * @param key - Key to listen for (e.g., 'Enter', 'Escape')
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onKey: (key: string, handler: (e: KeyboardEvent) => void) => {
      if (target) Key.is(target)(key, handler);
      return wrapper;
    },

    /**
     * Listens for the Tab key.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onTab: (handler: (e: KeyboardEvent) => void) => {
      if (target) Key.onTab(target)(handler);
      return wrapper;
    },

    /**
     * Listens for Arrow keys.
     * @param handler - Callback receiving direction and event
     * @returns {Unsubscribe} Function to stop listening
     */
    onArrow: (handler: (dir: 'Up' | 'Down' | 'Left' | 'Right', e: KeyboardEvent) => void) => {
      if (target) Key.onArrow(target)(handler);
      return wrapper;
    },

    // =========================================
    // FOCUS
    // =========================================

    /**
     * Listens for focus event.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onFocus: (handler: (e: FocusEvent) => void) => {
      if (target) Focus.on(target)(handler);
      return wrapper;
    },

    /**
     * Listens for blur event.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onBlur: (handler: (e: FocusEvent) => void) => {
      if (target) Focus.onBlur(target)(handler);
      return wrapper;
    },

    /**
     * Listens for focusin (bubbles).
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onFocusIn: (handler: (e: FocusEvent) => void) => {
      if (target) Focus.onIn(target)(handler);
      return wrapper;
    },

    /**
     * Listens for focusout (bubbles).
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onFocusOut: (handler: (e: FocusEvent) => void) => {
      if (target) Focus.onOut(target)(handler);
      return wrapper;
    },

    /**
     * Traps focus within this element (for modals/dialogs).
     * @returns {Unsubscribe} Function to disable trap
     */
    trapFocus: () => Focus.trap(target),

    // =========================================
    // POINTER & TEXT
    // =========================================

    /**
     * Listens for clicks outside this element.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    clickOutside: (handler: () => void) => {
      if (!target) return () => { };
      const listener = (e: Event) => {
        if (target && !target.contains(e.target as Node)) handler();
      };
      document.addEventListener('click', listener);
      return () => document.removeEventListener('click', listener);
    },

    /**
     * Checks if element contains text.
     * @param text - String or RegExp to search
     * @returns {boolean} True if found
     */
    hasText: (text: string | RegExp) => target ? !!Text.find(target)(text) : false,

    /**
     * Finds the first text node matching the pattern.
     * @param text - String or RegExp to search
     * @param selector - Optional selector to scope search
     * @returns {Text | null} The found text node
     */
    findText: (text: string | RegExp, selector?: string) => target ? Text.find(target)(text, selector) : null,

    /**
     * Finds all text nodes matching the pattern.
     * @param text - String or RegExp to search
     * @param selector - Optional selector to scope search
     * @returns {Text[]} Array of found text nodes
     */
    findAllText: (text: string | RegExp, selector?: string) => target ? Text.findAll(target)(text, selector) : [],

    /**
     * Replaces text content.
     * @param search - String or RegExp to find
     * @param replace - Replacement string
     * @returns {this} Fluent wrapper for chaining
     */
    replaceText: (search: string | RegExp, replace: string) => {
      if (target) Text.replace(target)(search, replace);
      return wrapper;
    },

    // =========================================
    // VIEW TRANSITIONS
    // =========================================

    /**
     * Sets the view-transition-name.
     * @param name - Transition name
     * @returns {this} Fluent wrapper for chaining
     */
    transitionName: chain(ViewTransitions.name),

    /**
     * Removes the view-transition-name.
     * @returns {this} Fluent wrapper for chaining
     */
    removeTransitionName: () => { ViewTransitions.unname(target); return wrapper; },

    /**
     * Runs a view transition focusing on this element.
     * @param name - Temporary transition name
     * @param updateFn - Function to run during transition
     * @returns {Promise<void>} Promise resolving when done
     */
    transitionWith: (name: string, updateFn: () => void) => ViewTransitions.tempName(target)(name)(updateFn),

    // =========================================
    // TRAVERSAL
    // =========================================

    /** Parent element */
    parent: Traverse.parent(target),
    /** Next sibling element */
    next: Traverse.next(target),
    /** Previous sibling element */
    prev: Traverse.prev(target),
    /** Child elements */
    children: Traverse.children(target),
    /** Sibling elements */
    siblings: Traverse.siblings(target),

    // =========================================
    // GEOMETRY & UI
    // =========================================

    /**
     * Gets the bounding client rect.
     * @returns {DOMRect | undefined}
     */
    rect: () => rect(target),

    /**
     * Gets the element's offset position.
     * @returns {{ top: number, left: number } | undefined}
     */
    offset: () => offset(target),

    /**
     * Scrolls the element into view.
     * @param arg - Scroll options or boolean
     * @returns {this} Fluent wrapper for chaining
     */
    scrollInto: (arg?: boolean | ScrollIntoViewOptions) => { target?.scrollIntoView(arg); return wrapper; },

    /**
     * Focuses the element.
     * @param options - Focus options
     * @returns {this} Fluent wrapper for chaining
     */
    focus: (options?: FocusOptions) => { target?.focus(options); return wrapper; },

    /**
     * Blurs the element.
     * @returns {this} Fluent wrapper for chaining
     */
    blur: () => { target?.blur(); return wrapper; },

    // =========================================
    // UTILS
    // =========================================

    /**
     * Waits for CSS transitions to complete.
     * @returns {Promise<void>}
     */
    waitTransition: () => waitTransition(target)
  };

  return wrapper;
};

/**
 * Turns a DOM tree into a component object by mapping `data-ref` nodes.
 * 
 * **Pattern**: Use `data-ref="name"` in HTML to mark elements. This function
 * gathers them into a strongly-typed object for easy access.
 * 
 * **Type Safety**: Pass a generic type to define the expected refs.
 * 
 * **Performance**: Scans the tree once on initialization. Much faster than
 * repeated `querySelector` calls.
 * 
 * @template T - Interface defining the expected refs (e.g. `{ title: HTMLElement }`)
 * @param rootOrSelector - The root element or a selector string
 * @returns Object containing the root and all mapped refs
 * 
 * @example
 * ```typescript
 * // HTML:
 * // <div id="card">
 * //   <h1 data-ref="title"></h1>
 * //   <button data-ref="btn"></button>
 * //   <input data-ref="input" type="text">
 * // </div>
 * 
 * // Define types
 * interface CardRefs {
 *   title: HTMLHeadingElement;
 *   btn: HTMLButtonElement;
 *   input: HTMLInputElement;
 * }
 * 
 * // Initialize
 * const card = component<CardRefs>('#card');
 * 
 * // Access refs directly (type-safe)
 * card.title.textContent = 'Hello World';
 * card.input.value = 'Initial value';
 * 
 * // Use with fluent API
 * $(card.btn).on('click', () => {
 *   console.log(card.input.value);
 * });
 * 
 * // Component Factory Pattern
 * function createCard(data: any) {
 *   const el = clone(template);
 *   const cmp = component<CardRefs>(el);
 *   
 *   cmp.title.textContent = data.title;
 *   
 *   return cmp;
 * }
 * ```
 */
export const component = <T extends Record<string, HTMLElement>>(rootOrSelector: HTMLElement | string | null) => {
  const root = typeof rootOrSelector === 'string' ? find(document)(rootOrSelector) : rootOrSelector;
  if (!root) return {} as T & { root: null };

  // Get all refs
  const nodes = refs(root) as T;

  return {
    root,
    ...nodes
  };
};

/**
 * Wraps a LIST of elements for batch operations.
 * 
 * **Batch Processing**: Calling a method applies it to ALL elements in the list.
 * 
 * **Performance**: Optimized for batch DOM updates.
 * 
 * **Parallel Operations**: Methods run sequentially on each element, but
 * can be conceptually treated as parallel updates.
 * 
 * @param selectorOrList - Selector string, Array of Elements, or NodeList
 * @returns Fluent wrapper for the list of elements
 * 
 * @example
 * ```typescript
 * // Select and update multiple elements
 * $$('.btn')
 *   .addClass('active')
 *   .css({ opacity: '1' })
 *   .on('click', handler);
 * 
 * // Filter and map
 * $$('input')
 *   .filter((el) => el.value === '')
 *   .addClass('error');
 * 
 * // Batch event handling
 * const unsubscribeAll = $$('.item').on('click', (e) => {
 *   console.log('Item clicked');
 * });
 * 
 * // Cleanup
 * unsubscribeAll();
 * 
 * // Complex batch update
 * $$('.card')
 *   .removeClass('selected')
 *   .modify({ title: 'Reset' })
 *   .css({ transform: 'none' });
 * 
 * // Functional map (returns array of results)
 * const values = $$('input').map(el => el.value);
 * 
 * // Chaining with filter
 * $$('li')
 *   .filter((el, i) => i % 2 === 0) // Evens
 *   .css({ background: '#eee' });
 * ```
 */
export const $$ = (selectorOrList: string | Element[] | NodeListOf<Element>) => {
  const elements = typeof selectorOrList === 'string'
    ? findAll(document)(selectorOrList)
    : Array.from(selectorOrList) as HTMLElement[];

  // Helper to map a function over all elements
  const map = (fn: any) => (arg: any, arg2?: any) => {
    elements.forEach(el => fn(el)(arg, arg2));
    return wrapper; // Return self for chaining
  };

  const wrapper = {
    raw: elements,

    // Batch Operations
    modify: map(modify),
    css: map(css),
    addClass: map(cls.add),
    removeClass: map(cls.remove),
    toggleClass: map(cls.toggle),
    attr: map((el: any) => (attr: any) => modify(el)({ attr })),

    // Batch Events
    on: (evt: any, handler: any) => {
      const unsubs = elements.map(el => on(el)(evt, handler));
      return () => unsubs.forEach(u => u()); // Return batch unsubscribe
    },

    // Batch Traversal / Manipulation
    remove: () => elements.forEach(el => remove(el)),
    empty: () => elements.forEach(el => empty(el)),

    // Functional map (standard array map)
    map: <T>(fn: (el: HTMLElement, i: number) => T) => elements.map(fn),
    filter: (fn: (el: HTMLElement, i: number) => boolean) => elements.filter(fn)
  };

  return wrapper;
};

/**
 * Creates a Proxy object where properties are 2-way bound to the element's dataset.
 * 
 * **Reactivity**: Assigning to properties updates the DOM `data-*` attributes.
 * Reading properties reads from the DOM.
 * 
 * **Type Safety**: Use a generic interface to define the expected data structure.
 * 
 * **Limitations**:
 * - Only stores strings (or JSON serialized values)
 * - Performance cost of DOM access on every read/write
 * - Property names are converted to kebab-case (e.g. `userId` -> `data-user-id`)
 * 
 * @template T - Interface defining the store shape
 * @param element - The element to bind to
 * @returns Proxy object mirroring the element's dataset
 * 
 * @example
 * ```typescript
 * // Define state shape
 * interface UserState {
 *   userId: number;
 *   isAdmin: boolean;
 *   theme: 'light' | 'dark';
 *   preferences: { notifications: boolean };
 * }
 * 
 * // Create store
 * const state = store<UserState>(document.body);
 * 
 * // Write to DOM (updates data-attributes)
 * state.userId = 123;          // data-user-id="123"
 * state.isAdmin = true;        // data-is-admin="true"
 * state.theme = 'dark';        // data-theme="dark"
 * state.preferences = { notifications: true }; // JSON serialized
 * 
 * // Read from DOM
 * console.log(state.userId); // 123 (typed as number)
 * 
 * // Reactivity with MutationObserver
 * Data.bind(document.body)('user-id', (newId) => {
 *   console.log('User ID changed to:', newId);
 * });
 * 
 * // Delete property
 * delete state.theme; // Removes data-theme attribute
 * ```
 */
export const store = <T extends Record<string, any> = Record<string, any>>(element: HTMLElement | null) => {
  if (!element) return {} as T;

  return new Proxy({}, {
    get: (_, prop: string) => Data.read(element)(prop),
    set: (_, prop: string, value: any) => {
      Data.set(element)(prop, value);
      return true;
    },
    deleteProperty: (_, prop: string) => {
      Data.set(element)(prop, null);
      return true;
    },
    // Allow iteration over current dataset
    ownKeys: () => Reflect.ownKeys(element.dataset),
    getOwnPropertyDescriptor: (_, _key) => ({
      enumerable: true,
      configurable: true,
    })
  }) as T;
};

/**
 * Wraps a form or container to manage input values, validation, and submission.
 * 
 * **Features**:
 * - Automatic serialization of all inputs
 * - Population of inputs from data objects
 * - Simplified submit handling with `preventDefault`
 * - Batch clearing of inputs
 * 
 * **Validation**: Combine with `Input.validate` or custom logic in submit handler.
 * 
 * @param target - Form element or selector
 * @returns Form wrapper object
 * 
 * @example
 * ```typescript
 * const f = form('#login-form');
 * 
 * // Get all values
 * const data = f.values();
 * console.log(data.username, data.password);
 * 
 * // Pre-fill form
 * f.set({
 *   username: 'admin',
 *   rememberMe: true
 * });
 * 
 * // Handle submit
 * f.submit((data, e) => {
 *   // Validations
 *   if (!data.username) {
 *     alert('Username required');
 *     return;
 *   }
 *   
 *   // API call
 *   api.login(data).catch(err => {
 *     console.error(err);
 *     f.clear(); // Clear on error if needed
 *   });
 * });
 * 
 * // Clear form
 * f.clear();
 * ```
 */
export const form = (target: HTMLElement | string | null) => {
  const el = typeof target === 'string' ? find(document)(target) : target;

  return {
    raw: el,
    /** Get all values as object */
    values: () => Form.serialize(el),
    /** Set values from object */
    set: (data: Record<string, any>) => Form.populate(el)(data),
    /** Clear all inputs */
    clear: () => {
      if (!el) return;
      el.querySelectorAll('input, select, textarea').forEach((i: any) => {
        if (i.type === 'checkbox' || i.type === 'radio') i.checked = false;
        else i.value = '';
      });
    },
    /** Short hand for on('submit') with preventDefault and serialization */
    submit: (handler: (data: any, e: Event) => void) => {
      return on(el)('submit', (e) => {
        e.preventDefault();
        handler(Form.serialize(el), e);
      });
    }
  };
};

// =============================================================================
// 29. INPUTS & CONTROLS
// =============================================================================

export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const Input = {
  /**
   * Smart Getter. Automatically handles:
   * - Checkbox/Radio -> boolean
   * - Number/Range -> number
   * - File -> FileList
   * - Select/Text -> string
   * 
   * @example const val = Input.get(input);
   */
  get: (el: FormElement | null): any => {
    if (!el) return undefined;
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
      if (el.type === 'number' || el.type === 'range') return el.valueAsNumber;
      if (el.type === 'file') return el.files;
      if (el.type === 'date') return el.valueAsDate;
    }
    return el.value;
  },

  /**
   * Smart Setter. Automatically handles checkboxes, numbers, etc.
   * 
   * @example Input.set(checkbox)(true);
   */
  set: (el: FormElement | null) => (val: any) => {
    if (!el) return el;
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = !!val;
      } else if (el.type === 'file') {
        // Read-only usually, but clearing allowed
        if (!val) el.value = '';
      } else if (el.type === 'date' && val instanceof Date) {
        el.valueAsDate = val;
      } else {
        el.value = String(val);
      }
    } else {
      el.value = String(val);
    }
    // Trigger event so listeners know it changed programmatically
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return el;
  },

  /**
   * Returns an array of Files from a file input (easier than FileList).
   */
  files: (el: HTMLInputElement | null): File[] => {
    return el && el.files ? Array.from(el.files) : [];
  },

  /**
   * Watches the 'input' event (keystrokes).
   * callback receives the *parsed* value, not the event.
   * 
   * @example Input.watch(search)(query => filterList(query));
   */
  watch: (el: FormElement | null) => {
    return (callback: (val: any, e: Event) => void): Unsubscribe => {
      if (!el) return () => { };
      const handler = (e: Event) => callback(Input.get(el), e);
      el.addEventListener('input', handler);
      return () => el.removeEventListener('input', handler);
    };
  },

  /**
   * Watches the 'input' event with a DEBOUNCE.
   * Perfect for search bars.
   * 
   * @example Input.watchDebounced(search)(query => api.search(query), 500);
   */
  watchDebounced: (el: FormElement | null) => {
    return (callback: (val: any) => void, ms: number): Unsubscribe => {
      if (!el) return () => { };
      const d = debounce((_e) => callback(Input.get(el)), ms);
      el.addEventListener('input', d);
      return () => el.removeEventListener('input', d);
    };
  },

  /**
   * Watches the 'change' event (blur/enter/selection).
   * 
   * @example Input.change(dropdown)(val => console.log('Selected', val));
   */
  change: (el: FormElement | null) => {
    return (callback: (val: any, e: Event) => void): Unsubscribe => {
      if (!el) return () => { };
      const handler = (e: Event) => callback(Input.get(el), e);
      el.addEventListener('change', handler);
      return () => el.removeEventListener('change', handler);
    };
  },

  /**
   * Selects all text in the input/textarea.
   */
  select: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    el?.select();
    return el;
  },

  /**
   * Checks validity and returns boolean. 
   * Optionally sets custom validity message.
   */
  validate: (el: FormElement | null) => (msg?: string): boolean => {
    if (!el) return false;
    if (msg !== undefined) el.setCustomValidity(msg);
    return el.checkValidity();
  }
};

// =============================================================================
// 30. EVENT HELPERS
// =============================================================================

export const Evt = {
  /**
   * Stops propagation (bubbling) of the event.
   * Can be used as a wrapper for handlers.
   * 
   * @example on(btn)('click', Evt.stop(handler));
   */
  stop: <E extends Event>(fn?: (e: E) => void) => (e: E) => {
    e.stopPropagation();
    if (fn) fn(e);
  },

  /**
   * Prevents default behavior.
   * 
   * @example on(form)('submit', Evt.prevent(submitHandler));
   */
  prevent: <E extends Event>(fn?: (e: E) => void) => (e: E) => {
    e.preventDefault();
    if (fn) fn(e);
  },

  /**
   * Stops propagation AND prevents default.
   */
  kill: <E extends Event>(fn?: (e: E) => void) => (e: E) => {
    e.preventDefault();
    e.stopPropagation();
    if (fn) fn(e);
  },

  /**
   * Filters an event handler to only run for specific keys.
   * 
   * @example on(input)('keydown', Evt.key('Enter', search));
   */
  key: (keyOrKeys: string | string[], fn: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (keys.includes(e.key)) fn(e);
  },

  /**
   * Checks if the event triggered exactly on the element (not a child).
   */
  isSelf: (e: Event) => e.target === e.currentTarget,

  /**
   * Gets the coordinate of the event relative to the viewport.
   * Handles Mouse and Touch events uniformly.
   */
  pointer: (e: MouseEvent | TouchEvent | Event) => {
    if ('touches' in e) {
      const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }
};

// =============================================================================
// 31. KEYBOARD & FOCUS INTERACTIONS
// =============================================================================

export const Key = {
  /**
   * Listens for a specific key press.
   * @example Key.is(input)('Enter', onSubmit);
   */
  is: (target: EventTarget | null) => (key: string, handler: (e: KeyboardEvent) => void) => {
    return on(target)('keydown', (e) => {
      if (e.key === key) handler(e as KeyboardEvent);
    });
  },

  /**
   * Listens for the 'Tab' key.
   * Useful for trapping focus or form navigation logic.
   */
  onTab: (target: EventTarget | null) => (handler: (e: KeyboardEvent) => void) => {
    return on(target)('keydown', (e) => {
      if (e.key === 'Tab') handler(e as KeyboardEvent);
    });
  },

  /**
   * Listens for any Arrow key.
   * Handler receives the direction ('Up' | 'Down' | 'Left' | 'Right').
   * 
   * @example 
   * Key.onArrow(menu)((dir, e) => {
   *   if (dir === 'Down') focusNext();
   * });
   */
  onArrow: (target: EventTarget | null) => {
    return (handler: (direction: 'Up' | 'Down' | 'Left' | 'Right', e: KeyboardEvent) => void) => {
      return on(target)('keydown', (e) => {
        if (e.key.startsWith('Arrow')) {
          const dir = e.key.replace('Arrow', '') as 'Up' | 'Down' | 'Left' | 'Right';
          handler(dir, e as KeyboardEvent);
        }
      });
    };
  }
};

export const Focus = {
  /**
   * Standard Focus event.
   */
  on: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => {
    return on(target)('focus', handler as any);
  },

  /**
   * Standard Blur event.
   */
  onBlur: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => {
    return on(target)('blur', handler as any);
  },

  /**
   * Focus In (Bubbles).
   * Useful for detecting if ANY child within a container gained focus.
   */
  onIn: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => {
    return on(target)('focusin', handler as any);
  },

  /**
   * Focus Out (Bubbles).
   * Useful for detecting if focus left a container entirely.
   */
  onOut: (target: HTMLElement | null) => (handler: (e: FocusEvent) => void) => {
    return on(target)('focusout', handler as any);
  },

  /**
   * Traps focus within an element (Accessibility).
   * Prevents Tab from leaving the target container.
   */
  trap: (target: HTMLElement | null) => {
    if (!target) return () => { };

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusables = target.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    target.addEventListener('keydown', handler);
    return () => target.removeEventListener('keydown', handler);
  }
};

// =============================================================================
// 32. TEXT QUERYING
// =============================================================================

export const Text = {
  /**
   * Finds all elements containing the specified text or matching a Regex.
   * 
   * @example
   * // Find all buttons saying "Submit"
   * const btns = Text.findAll(document)('Submit', 'button');
   * 
   * // Find using Regex
   * const prices = Text.findAll(table)(/$\d+\.\d{2}/);
   */
  findAll: (root: Element | Document = document) => {
    return (textOrRegex: string | RegExp, selector: string = '*'): Element[] => {
      const matches = new Set<Element>();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        const content = node.nodeValue || '';

        // 1. Check if parent matches selector
        if (!parent || !parent.matches(selector)) continue;

        // 2. Check text match
        const isMatch = typeof textOrRegex === 'string'
          ? content.includes(textOrRegex)
          : textOrRegex.test(content);

        if (isMatch) matches.add(parent);
      }

      return Array.from(matches);
    };
  },

  /**
   * Finds the FIRST element containing the text.
   * 
   * @example
   * const btn = Text.find(form)('Save');
   */
  find: (root: Element | Document = document) => {
    return (textOrRegex: string | RegExp, selector: string = '*'): Element | null => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        const content = node.nodeValue || '';

        if (!parent || !parent.matches(selector)) continue;

        const isMatch = typeof textOrRegex === 'string'
          ? content.includes(textOrRegex)
          : textOrRegex.test(content);

        if (isMatch) return parent;
      }
      return null;
    };
  },

  /**
   * Replaces text in the target's descendants.
   * Safe wrapper that only touches text nodes, preserving HTML structure.
   * 
   * @example
   * Text.replace(document.body)('foo', 'bar');
   */
  replace: (root: Element | null) => {
    return (searchValue: string | RegExp, replaceValue: string) => {
      if (!root) return root;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;

      while ((node = walker.nextNode())) {
        const val = node.nodeValue || '';
        if (typeof searchValue === 'string' ? val.includes(searchValue) : searchValue.test(val)) {
          node.nodeValue = val.replace(searchValue, replaceValue);
        }
      }
      return root;
    };
  }
};

// =============================================================================
// 33. VIEW TRANSITIONS
// =============================================================================

// Type shim for environments where ViewTransition isn't in 'lib' yet
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

export const ViewTransitions = {
  /** Checks if View Transitions are supported. */
  isSupported: () => 'startViewTransition' in document,

  /**
   * Sets the `view-transition-name` on an element.
   * Essential for connecting elements across DOM updates.
   * 
   * @example View.name(img)('hero-image');
   */
  name: (target: HTMLElement | null) => (name: string) => {
    if (target) target.style.viewTransitionName = name;
    return target;
  },

  /** Removes the view-transition-name. */
  unname: (target: HTMLElement | null) => {
    if (target) target.style.removeProperty('view-transition-name');
    return target;
  },

  /**
   * Starts a global View Transition.
   * Gracefully falls back to immediate execution if not supported.
   * 
   * @example
   * ViewTransitions.start(() => {
   *   // Update DOM here
   *   document.body.append(newPage);
   * });
   */
  start: (updateCallback: () => Promise<void> | void): ViewTransition | null => {
    if (!('startViewTransition' in document)) {
      updateCallback();
      return null;
    }
    // @ts-ignore
    return document.startViewTransition(updateCallback);
  },

  /**
   * Starts a transition with a specific class applied to the document element.
   * Useful for defining different animations (e.g. 'slide-left' vs 'slide-right').
   * 
   * @example ViewTransitions.withClass('slide-back')(() => history.back());
   */
  withClass: (className: string) => (updateCallback: () => Promise<void> | void) => {
    document.documentElement.classList.add(className);

    const transition = ViewTransitions.start(updateCallback);

    if (transition) {
      transition.finished.finally(() => document.documentElement.classList.remove(className));
    } else {
      document.documentElement.classList.remove(className);
    }
    return transition;
  },

  /**
   * Applies a transition name to an element ONLY for the duration of the next transition.
   * Auto-cleans up the name when the transition finishes.
   * 
   * @example View.tempName(img)('hero-morph')(async () => updateDOM());
   */
  tempName: (target: HTMLElement | null) => (name: string) => {
    return (updateCallback: () => Promise<void> | void) => {
      if (!target) return ViewTransitions.start(updateCallback);

      target.style.viewTransitionName = name;
      const transition = ViewTransitions.start(updateCallback);

      if (transition) {
        transition.finished.finally(() => target.style.removeProperty('view-transition-name'));
      } else {
        target.style.removeProperty('view-transition-name');
      }
      return transition;
    };
  }
};

// =============================================================================
// 34. ASYNC & PROMISES
// =============================================================================

export const Async = {
  /**
   * Wraps a value or Promise in a Promise (safe normalization).
   */
  resolve: <T>(v: T | PromiseLike<T>): Promise<T> => Promise.resolve(v),

  /**
   * Sleeps for N milliseconds.
   * @example await Async.sleep(1000);
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Waits for the next Animation Frame.
   */
  nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),

  /**
   * Retries a function N times with exponential backoff.
   * 
   * @example
   * const data = await Async.retry(() => api.get(), { retries: 3 });
   */
  retry: <T>(
    fn: () => Promise<T>,
    options: { retries?: number, delay?: number, factor?: number } = {}
  ): Promise<T> => {
    const { retries = 3, delay = 100, factor = 2 } = options;

    return fn().catch(err => {
      if (retries <= 0) throw err;
      return Async.sleep(delay).then(() =>
        Async.retry(fn, { retries: retries - 1, delay: delay * factor, factor })
      );
    });
  },

  /**
   * Races a promise against a timeout.
   * Throws 'TimeoutError' if time limit exceeded.
   * 
   * @example
   * await Async.timeout(fetch('/long'), 5000);
   */
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TimeoutError')), ms))
    ]);
  },

  /**
   * Limits concurrency of a map function.
   * Useful for batch processing without flooding the network.
   * 
   * @example
   * await Async.map(userIds, fetchUser, 2); // 2 at a time
   */
  map: async <T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    concurrency: number = Infinity
  ): Promise<R[]> => {
    const results: R[] = [];
    const queue = items.map((item, i) => ({ item, i }));

    const worker = async () => {
      while (queue.length > 0) {
        const { item, i } = queue.shift()!;
        results[i] = await fn(item, i);
      }
    };

    await Promise.all(Array.from({ length: Math.min(items.length, concurrency) }, worker));
    return results;
  },

  /**
   * Creates a "Deferred" promise object (exposed resolve/reject).
   * 
   * @example
   * const { promise, resolve } = Async.defer();
   */
  defer: <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  },

  /**
   * Wraps a promise to make it "Cancelable" (wrapper only).
   * Note: Does not stop the underlying operation, just ignores the result.
   */
  cancelable: <T>(promise: Promise<T>) => {
    let isCanceled = false;
    const wrapped = new Promise<T>((resolve, reject) => {
      promise.then(
        val => !isCanceled && resolve(val),
        err => !isCanceled && reject(err)
      );
    });
    return {
      promise: wrapped,
      cancel: () => { isCanceled = true; }
    };
  }
};

// =============================================================================
// 35. TASK QUEUE
// =============================================================================

/**
 * Creates a Task Queue with concurrency control.
 * Useful for throttling API calls, toasts, or sequential animations.
 * 
 * @example
 * const q = createQueue({ concurrency: 1 });
 * q.add(() => api.save(A));
 * q.add(() => api.save(B));
 * await q.drain();
 */
export const createQueue = (options: { concurrency?: number, autoStart?: boolean } = {}) => {
  type Task<T = any> = () => Promise<T> | T;

  const concurrency = options.concurrency || 1;
  const queue: { fn: Task, resolve: Function, reject: Function }[] = [];
  let active = 0;
  let isPaused = !options.autoStart && options.autoStart !== undefined;

  // Event listeners
  const listeners: Record<string, Function[]> = {
    drain: [],
    error: []
  };

  const next = () => {
    if (isPaused || active >= concurrency || queue.length === 0) {
      if (active === 0 && queue.length === 0) listeners.drain.forEach(fn => fn());
      return;
    }

    const job = queue.shift();
    if (!job) return;

    active++;

    Promise.resolve()
      .then(() => job.fn())
      .then(res => job.resolve(res))
      .catch(err => {
        listeners.error.forEach(fn => fn(err));
        job.reject(err);
      })
      .finally(() => {
        active--;
        next();
      });

    next(); // Try to start more if concurrency allows
  };

  return {
    /** Adds a task to the queue. Returns a promise that resolves when the task finishes. */
    add: <T>(fn: Task<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
      });
    },

    /** Pauses processing. Active tasks complete, but new ones wait. */
    pause: () => { isPaused = true; },

    /** Resumes processing. */
    resume: () => { isPaused = false; next(); },

    /** Clears all pending tasks. */
    clear: () => { queue.length = 0; },

    /** Returns the number of pending + active tasks. */
    size: () => queue.length + active,

    /** Returns a promise that resolves when all tasks are complete. */
    drain: () => new Promise<void>(resolve => {
      if (active === 0 && queue.length === 0) return resolve();
      listeners.drain.push(resolve);
    }),

    /** Listen for errors (globally for the queue). */
    onError: (fn: (err: any) => void) => listeners.error.push(fn)
  };
};

// =============================================================================
// 36. HISTORY & URL STATE
// =============================================================================

/**
 * Valid types for URL Query Parameters.
 */
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export const History = {
  /**
   * Updates the URL Query Parameters with new values.
   * Merges with existing params. Pass `null` or `undefined` to remove a key.
   * Handles arrays as repeated params (e.g., `?tag=a&tag=b`).
   * 
   * Order: params -> (mode?)
   * 
   * @example 
   * // Results in ?page=2&sort=desc
   * History.query({ page: 2, sort: 'desc' })(); 
   * 
   * // Replace history instead of push
   * History.query({ tab: 'settings' })('replace');
   */
  query: (params: QueryParams) => (mode: 'push' | 'replace' = 'push') => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([k, v]) => {
      // 1. Remove existing keys to overwrite/clear them
      url.searchParams.delete(k);

      // 2. Set new values
      if (v === null || v === undefined || v === '') return;

      if (Array.isArray(v)) {
        v.forEach(item => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });

    const method = mode === 'replace' ? 'replaceState' : 'pushState';
    window.history[method](window.history.state, '', url.href);
  },

  /**
   * Reads current Query Parameters into a typed Object.
   * Note: duplicate keys (arrays) will return the *last* value, 
   * use `History.readQueryAll()` if you expect arrays.
   * 
   * @template T
   * @returns {T}
   * 
   * @example 
   * const { page, sort } = History.readQuery<{ page: string, sort: string }>();
   */
  readQuery: <T extends Record<string, string>>(): T => {
    return Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as T;
  },

  /**
   * Reads Query Parameters, ensuring all values are arrays.
   * Useful for filters like `?tags=a&tags=b`.
   */
  readQueryAll: (): Record<string, string[]> => {
    const params: Record<string, string[]> = {};
    new URLSearchParams(window.location.search).forEach((val, key) => {
      (params[key] = params[key] || []).push(val);
    });
    return params;
  },

  /**
   * Pushes a new entry onto the history stack with optional state.
   * 
   * @template T - Type of the state object
   * @example History.push('/profile', { userId: 123 });
   */
  push: <T = any>(path: string, state?: T) => {
    window.history.pushState(state, '', path);
  },

  /**
   * Replaces the current history entry.
   * 
   * @template T - Type of the state object
   * @example History.replace(window.location.pathname, { scrolled: true });
   */
  replace: <T = any>(path: string, state?: T) => {
    window.history.replaceState(state, '', path);
  },

  /**
   * Gets the current history state object with Type Safety.
   * 
   * @template T
   * @example const state = History.state<{ userId: number }>();
   */
  state: <T>(): T | null => {
    return window.history.state as T;
  },

  /**
   * Navigates back in history.
   */
  back: () => window.history.back(),

  /**
   * Navigates forward in history.
   */
  forward: () => window.history.forward(),

  /**
   * Reloads the current page.
   */
  reload: () => window.location.reload(),

  /**
   * Listens for history changes (Back/Forward buttons).
   * Returns a cleanup function.
   * 
   * @example 
   * const stop = History.onPop(e => console.log('Navigated to', e.state));
   */
  onPop: (handler: (e: PopStateEvent) => void): Unsubscribe => {
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  },

  /**
   * Serializes an object to a Unicode-safe Base64 string.
   * Useful for storing complex state in the URL hash.
   * 
   * @example window.location.hash = History.encodeState({ filters: [...] });
   */
  encodeState: (state: any): string => {
    try {
      const json = JSON.stringify(state);
      // encodeURIComponent handles Unicode chars that btoa chokes on
      return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      ));
    } catch { return ''; }
  },

  /**
   * Deserializes a Base64 string back to an object.
   */
  decodeState: <T>(str: string): T | null => {
    try {
      const json = decodeURIComponent(Array.prototype.map.call(atob(str),
        (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(json);
    } catch { return null; }
  },

  /**
 * Two-way binds a form input to a URL Query Parameter.
 * 
 * Features:
 * 1. Sets input value from URL on load.
 * 2. Updates URL on input change (debounced).
 * 3. Updates input on PopState (Back/Forward button).
 * 
 * Order: paramName -> debounceMs -> element
 * 
 * @example 
 * const searchInput = find(document)('#search');
 * History.syncToUrl('q', 300)(searchInput);
 */
  syncToUrl: (paramName: string, debounceMs = 300) => (target: HTMLElement | null): Unsubscribe => {
    if (!target) return () => { };

    // Determine if element is Checkbox/Radio or Text-like
    const isCheckable = (target as HTMLInputElement).type === 'checkbox' || (target as HTMLInputElement).type === 'radio';

    // 1. READ: Function to update DOM from URL
    const updateFromUrl = () => {
      const val = new URLSearchParams(window.location.search).get(paramName);
      if (val === null) return; // No param = do nothing (or clear?)

      if (isCheckable) {
        (target as HTMLInputElement).checked = val === 'true';
      } else {
        (target as HTMLInputElement).value = val;
      }
    };

    // 2. WRITE: Function to update URL from DOM
    const updateToUrl = debounce(() => {
      const val = isCheckable
        ? String((target as HTMLInputElement).checked)
        : (target as HTMLInputElement).value;

      History.query({ [paramName]: val })('replace');
    }, debounceMs);

    // 3. BIND: Attach listeners
    updateFromUrl(); // Initial sync

    target.addEventListener('input', updateToUrl);
    target.addEventListener('change', updateToUrl);
    window.addEventListener('popstate', updateFromUrl);

    // Cleanup
    return () => {
      target.removeEventListener('input', updateToUrl);
      target.removeEventListener('change', updateToUrl);
      window.removeEventListener('popstate', updateFromUrl);
    };
  }
}

// =============================================================================
// 0.1 FUNCTIONAL COMBINATORS
// =============================================================================

export const Fn = {
  /**
   * Standard Left-to-Right composition.
   * Passes the output of one function as the input to the next.
   * @example pipe(getName, toUpper, log)(user);
   */
  pipe: <T>(...fns: Function[]) => (x: T) => fns.reduce((v, f) => f(v), x),

  /**
   * Curries a binary function.
   * Turns `fn(a, b)` into `fn(a)(b)`.
   * @example const add = curry((a, b) => a + b); add(1)(2);
   */
  curry: <A, B, R>(fn: (a: A, b: B) => R) => (a: A) => (b: B): R => fn(a, b),

  /**
   * Swaps the arguments of a curried function.
   * Turns `fn(a)(b)` into `fn(b)(a)`.
   * Useful for converting "Config-First" to "Target-First" or vice versa.
   * 
   * @example 
   * // Suppose style(prop)(el)
   * const styleEl = swap(style)(el);
   * styleEl('color');
   */
  swap: <A, B, R>(fn: (a: A) => (b: B) => R) => (b: B) => (a: A): R => fn(a)(b),

  /**
   * Flips the arguments of a standard binary function.
   * Turns `fn(a, b)` into `fn(b, a)`.
   */
  flip: <A, B, R>(fn: (a: A, b: B) => R) => (b: B, a: A): R => fn(a, b),

  /**
   * Executes a side-effect function and returns the original value.
   * Essential for logging or debugging inside a `pipe` chain without breaking it.
   * 
   * @example pipe(modify({...}), tap(console.log), addClass('active'))(el);
   */
  tap: <T>(fn: (x: T) => void) => (x: T): T => {
    fn(x);
    return x;
  },

  /**
   * Executes a function only if the value is not null/undefined.
   * Useful wrapper for standard API functions that might crash on null.
   * 
   * @example const safeParse = maybe(JSON.parse);
   */
  maybe: <T, R>(fn: (x: T) => R) => (x: T | null | undefined): R | null => {
    return (x === null || x === undefined) ? null : fn(x);
  },

  /**
   * Creates a function that accepts data as the *first* argument, 
   * but applies it to a curried function expecting data *last*.
   * 
   * Adapts `fn(config)(data)` to `fn(data, config)`.
   */
  unbind: <D, C, R>(fn: (config: C) => (data: D) => R) => (data: D, config: C): R => {
    return fn(config)(data);
  },

  /**
   * "Thunks" a function. Returns a function that accepts no arguments 
   * and returns the result of the original call.
   * Useful for event handlers that don't need the event object.
   * 
   * @example on(btn)('click', thunk(count, increment));
   */
  thunk: <T>(fn: (...args: any[]) => T, ...args: any[]) => () => fn(...args),

  /**
   * Returns the value unchanged.
   * Useful as a default no-op callback.
   */
  identity: <T>(x: T): T => x,

  /**
   * A function that does nothing.
   */
  noop: () => { }
};

// =============================================================================
// 37. ERROR HANDLING (RESULT & OPTION)
// =============================================================================

/**
 * Represents a successful computation.
 */
export type Ok<T> = { ok: true; val: T; err: null };

/**
 * Represents a failed computation.
 */
export type Err<E> = { ok: false; val: null; err: E };

/**
 * A Result type (inspired by Rust) that is either Ok or Err.
 * Forces you to check `.ok` before accessing the value.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const Result = {
  /** Creates a success result. */
  ok: <T>(val: T): Ok<T> => ({ ok: true, val, err: null }),

  /** Creates a failure result. */
  err: <E>(err: E): Err<E> => ({ ok: false, val: null, err }),

  /**
   * Wraps a synchronous function that might throw.
   * Returns a Result object instead of throwing.
   * 
   * @example
   * const res = Result.try(() => JSON.parse(badString));
   * if (!res.ok) console.error(res.err);
   */
  try: <T>(fn: () => T): Result<T, Error> => {
    try {
      return Result.ok(fn());
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Wraps a Promise that might reject.
   * Returns a Promise<Result>.
   * 
   * @example
   * const { ok, val, err } = await Result.async(() => fetch('/api'));
   */
  async: async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
    try {
      const val = await fn();
      return Result.ok(val);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * Unwraps a Result. Returns value if Ok, throws if Err.
   */
  unwrap: <T, E>(res: Result<T, E>): T => {
    if (res.ok) return res.val;
    throw res.err;
  },

  /**
   * Unwraps a Result with a fallback value.
   */
  unwrapOr: <T, E>(res: Result<T, E>, fallback: T): T => {
    return res.ok ? res.val : fallback;
  },

  /**
   * Maps the value if Ok, ignores if Err.
   */
  map: <T, U, E>(res: Result<T, E>, fn: (v: T) => U): Result<U, E> => {
    return res.ok ? Result.ok(fn(res.val)) : res as unknown as Err<E>;
  }
};


// =============================================================================
// 38. OPTION (NULLABLE HANDLING)
// =============================================================================

/**
 * Functional wrapper for nullable values.
 */
export const Option = {
  /**
   * Creates an Option from a nullable value.
   */
  from: <T>(val: T | null | undefined) => ({
    val,
    isSome: val !== null && val !== undefined,
    isNone: val === null || val === undefined
  }),

  /**
   * Returns the value or a fallback.
   * @example Option.unwrapOr(input, 'default');
   */
  unwrapOr: <T>(val: T | null | undefined, fallback: T): T => {
    return (val !== null && val !== undefined) ? val : fallback;
  },

  /**
   * Maps the value if it exists, returns null otherwise.
   * @example const len = Option.map(str, s => s.length);
   */
  map: <T, R>(val: T | null | undefined, fn: (v: T) => R): R | null => {
    return (val !== null && val !== undefined) ? fn(val) : null;
  },

  /**
   * Executes side-effect if value exists.
   * @example Option.then(element, el => el.remove());
   */
  then: <T>(val: T | null | undefined, fn: (v: T) => void): void => {
    if (val !== null && val !== undefined) fn(val);
  }
};

// =============================================================================
// 39. REACTIVE BINDINGS ("THE HARD WAY" HELPERS)
// =============================================================================

/**
 * A Setter function that updates the DOM only if the value has changed.
 */
export type Setter<T> = (newValue: T) => void;

export const bind = {
  /**
   * Generic value binder with diffing.
   * 
   * @example
   * const setScore = bind.val(0, (n) => div.innerText = n);
   */
  val: <T>(initial: T, effect: (val: T) => void): Setter<T> => {
    let current = initial;
    return (next: T) => {
      if (!Object.is(current, next)) {
        current = next;
        effect(next);
      }
    };
  },

  /**
   * Binds textContent.
   * @example const setText = bind.text(h1); setText('Hello');
   */
  text: (el: HTMLElement | null): Setter<string> => {
    let current: string | undefined;
    return (text: string) => {
      if (el && current !== text) {
        current = text;
        el.textContent = text;
      }
    };
  },

  /**
   * Binds innerHTML.
   */
  html: (el: HTMLElement | null): Setter<string> => {
    let current: string | undefined;
    return (html: string) => {
      if (el && current !== html) {
        current = html;
        el.innerHTML = html;
      }
    };
  },

  /**
   * Binds an attribute.
   * Supports optional currying: `attr(name, el)` or `attr(name)(el)`.
   * 
   * @example
   * const setId = bind.attr('id', div); 
   * setId(123);
   */
  attr: (name: string, el?: HTMLElement | null) => {
    const createSetter = (target: HTMLElement | null): Setter<string | number | boolean | null> => {
      let current: any;
      return (val) => {
        if (!target || current === val) return;
        current = val;
        if (val === null || val === false) target.removeAttribute(name);
        else target.setAttribute(name, String(val));
      };
    };
    // Handle optional currying
    return el !== undefined ? createSetter(el) : createSetter;
  },

  /**
   * Binds a class toggle.
   * Supports optional currying.
   * 
   * @example const toggleActive = bind.toggle('active', div);
   */
  toggle: (className: string, el?: HTMLElement | null) => {
    const createSetter = (target: HTMLElement | null): Setter<boolean> => {
      let current: boolean | undefined;
      return (active) => {
        if (!target || current === active) return;
        current = active;
        target.classList.toggle(className, active);
      };
    };
    return el !== undefined ? createSetter(el) : createSetter;
  },

  /**
   * Binds a list to a container.
   * Replaces children only if array reference changes.
   * 
   * @example 
   * const updateList = bind.list(ul, (user, i) => el('li')({ text: user.name })());
   * updateList(users);
   */
  list: <T>(container: HTMLElement | null, renderItem: (item: T, index: number) => Node) => {
    let currentData: T[] | undefined;

    return (data: T[]) => {
      if (!container) return;
      if (data === currentData) return; // Ref check

      currentData = data;

      // Optimization: fast clear if empty
      if (data.length === 0) {
        if (container.firstChild) container.replaceChildren();
        return;
      }

      const fragment = document.createDocumentFragment();
      data.forEach((item, i) => fragment.appendChild(renderItem(item, i)));
      container.replaceChildren(fragment);
    };
  }
};


// =============================================================================
// 40. VIEW FACTORY & BINDER GENERATOR
// =============================================================================
/**
 * Helper to bind multiple events to refs in one go.
 * 
 * @example
 * bindEvents(refs, {
 *   btn: { click: handleClick },
 *   input: { input: handleInput, keydown: handleKey }
 * })
 */
export const bindEvents = <K extends string>(
  refs: Record<K, HTMLElement>,
  map: Partial<Record<K, Record<string, (e: Event, el: HTMLElement) => void>>>
) => {
  Object.entries(map).forEach(([refKey, events]) => {
    const el = refs[refKey as K];
    if (!el) return;

    Object.entries(events as Record<string, any>).forEach(([evtName, handler]) => {
      // Uses our standard 'on' function
      on(el)(evtName as any, (e) => handler(e, el));
    });
  });
};
/**
 * Defines the shape of the Refs object returned by `view()`.
 * Use a generic to specify keys: `view<'title' | 'button'>`
 */
export type Refs<K extends string> = Record<K, HTMLElement>;

/**
 * A factory for creating maintainable "Hard Way" views.
 * 
 * @template K - The names of the data-ref attributes in the HTML.
 * @param htmlString - The HTML template string.
 */
export const view = <K extends string = string>(htmlString: string) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = htmlString.trim();

  /**
   * Instantiates the view.
   * @returns {{ root: HTMLElement | DocumentFragment, refs: Refs<K> }}
   */
  return () => {
    const root = document.importNode(tpl.content, true);
    const refs = {} as Refs<K>;

    root.querySelectorAll('[data-ref]').forEach(el => {
      const key = (el as HTMLElement).dataset.ref;
      if (key) refs[key as K] = el as HTMLElement;
    });

    // Determine if we return a single root element or the fragment
    const rootEl = (root.children.length === 1 ? root.firstElementChild : root) as HTMLElement | DocumentFragment;

    return { root: rootEl, refs };
  };
};

/**
 * A helper to generate a typed object of Setters from a Refs object.
 * This reduces the boilerplate of creating individual binders manually.
 * 
 * @example
 * const { refs } = createCard();
 * const ui = binder(refs, {
 *   title: bind.text,
 *   image: bind.attr('src'),
 *   active: bind.toggle('is-active')
 * });
 * 
 * // Usage
 * ui.title('Hello');
 * ui.active(true);
 */
export const binder = <
  R extends Record<string, HTMLElement>,
  Schema extends { [Key in keyof R]?: (el: HTMLElement) => Setter<any> }
>(
  refs: R,
  schema: Schema
): { [Key in keyof Schema]: Schema[Key] extends (el: any) => infer S ? S : never } => {
  const binders = {} as any;
  for (const key in schema) {
    if (refs[key]) {
      // @ts-ignore
      binders[key] = schema[key](refs[key]);
    }
  }
  return binders;
};

// =============================================================================
// 41. HTTP FACTORY (TYPE-SAFE, FLEXIBLE, WITH DEFAULTS)
// =============================================================================

/**
 * HTTP request method type.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * HTTP response status code.
 */
export type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 405 | 409 | 422 | 429 | 500 | 502 | 503 | (number & {});

/**
 * Flexible request init configuration.
 * Supports any standard Fetch API options plus custom extensions.
 * 
 * @template T - Custom header type overrides
 */
export interface HttpRequestInit extends Omit<RequestInit, 'body'> {
  /** Request body - auto-stringified if object */
  body?: BodyInit | Record<string, any> | null;
  /** Base URL to prepend (overrides Http defaults) */
  baseURL?: string;
  /** Query parameters to append */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Custom timeout in ms (0 = no timeout) */
  timeout?: number;
  /** Retry count on network failure (default: 0) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Transform response before returning */
  transform?: (data: any) => any;
}

/**
 * HTTP response wrapper with metadata.
 * 
 * @template T - The response data type
 * 
 * @example
 * ```typescript
 * const res: HttpResponse<User> = await http.get('/users/1')({});
 * if (res.ok) console.log(res.data); // User
 * else console.error(res.statusText, res.error);
 * ```
 */
export interface HttpResponse<T = any> {
  /** True if status is 2xx */
  ok: boolean;
  /** HTTP status code */
  status: HttpStatus;
  /** Status text (e.g., "OK", "Not Found") */
  statusText: string;
  /** Response data (parsed JSON, text, blob, etc.) */
  data: T | null;
  /** Error object if request failed */
  error: Error | null;
  /** Raw Fetch Response object */
  response: globalThis.Response;
}

/**
 * HTTP client configuration.
 * Defines defaults for all requests made by this client.
 * 
 * @template H - Custom header keys type
 */
export interface HttpConfig<H extends string = string> {
  /** Base URL for all requests (e.g., "https://api.example.com") */
  baseURL?: string;
  /** Default headers for all requests */
  headers?: Record<H | string, string>;
  /** Default timeout in ms (0 = no timeout) */
  timeout?: number;
  /** Retry policy for network failures */
  retries?: number;
  /** Delay between retries */
  retryDelay?: number;
  /** Request interceptor (runs before fetch) */
  interceptRequest?: (init: HttpRequestInit) => HttpRequestInit | Promise<HttpRequestInit>;
  /** Response interceptor (runs after fetch) */
  interceptResponse?: <T = any>(res: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
}

/**
 * Merges two header objects with type safety.
 * @internal
 */
const _mergeHeaders = (
  base: Record<string, string> | undefined,
  override: Record<string, string> | undefined
): Record<string, string> => {
  return { ...base, ...override };
};

/**
 * Builds a full URL with optional base and params.
 * @internal
 */
const _buildUrl = (path: string, baseURL?: string, params?: Record<string, any>): string => {
  let url = baseURL ? `${baseURL}${path}` : path;

  if (params) {
    const search = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== null && val !== undefined) {
        search.set(key, String(val));
      }
    }
    const qs = search.toString();
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
  }

  return url;
};

/**
 * Converts body to RequestInit.body format.
 * @internal
 */
const _encodeBody = (body: any): BodyInit | null => {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body;
  if (body instanceof FormData) return body;
  if (body instanceof ArrayBuffer) return body;
  // Object: serialize to JSON
  return JSON.stringify(body);
};

/**
 * Parses response based on content-type.
 * @internal
 */
const _parseResponse = async (response: globalThis.Response, transform?: (data: any) => any): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';

  let data: any;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
  } else if (contentType.includes('text')) {
    data = await response.text();
  } else if (contentType.includes('image') || contentType.includes('video') || contentType.includes('audio')) {
    data = await response.blob();
  } else {
    data = await response.arrayBuffer();
  }

  return transform ? transform(data) : data;
};

/**
 * Executes a fetch request with retry logic.
 * @internal
 */
const _fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retries: number = 0,
  retryDelay: number = 1000,
  timeout: number = 0
): Promise<globalThis.Response> => {
  const controller = new AbortController();
  const timeoutId = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined;

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timeoutId !== undefined) clearTimeout(timeoutId);

    // Retry on network error (not on HTTP error like 404)
    if (retries > 0 && (error instanceof TypeError || error instanceof DOMException)) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return _fetchWithRetry(url, init, retries - 1, retryDelay, timeout);
    }

    throw error;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

/**
 * Creates a type-safe HTTP client with flexible configuration.
 * 
 * Advanced HTTP factory with full control: configure defaults per client,
 * override per-request, automatic retries, timeouts, interceptors, and more.
 * 
 * Features:
 * - Fully type-safe with generics for request/response
 * - Automatic JSON serialization/deserialization
 * - Query parameter support with smart merging
 * - Configurable defaults (baseURL, headers, timeout, retries)
 * - Request/response interceptors (async support)
 * - Timeout support with AbortController
 * - Automatic retry on network failure
 * - Content-type detection (JSON, text, blob, etc.)
 * - Returns typed response object with metadata + helper methods
 * 
 * @template H - Custom header keys (e.g., 'Authorization', 'X-Custom')
 * @param config - HTTP client configuration
 * @returns A configured Http client factory with GET, POST, PUT, DELETE, PATCH methods
 * 
 * @example
 * ```typescript
 * // ===== BASIC SETUP =====
 * const api = HttpFactory.create({
 *   baseURL: 'https://api.example.com',
 *   headers: { 'X-API-Key': 'secret' },
 *   timeout: 5000,
 *   retries: 2
 * });
 * 
 * // ===== TYPE-SAFE REQUESTS =====
 * interface User { id: number; name: string }
 * interface CreateUserPayload { name: string; email: string }
 * 
 * // GET with automatic type inference
 * const res = await api.get<User>('/users/123')({});
 * if (res.ok) console.log(res.data.id); // data is User
 * 
 * // POST with body and query params
 * const created = await api.post<User>('/users')({
 *   body: { name: 'Alice', email: 'alice@example.com' },
 *   params: { notify: true },
 *   timeout: 3000
 * });
 * 
 * // ===== PER-REQUEST OVERRIDES =====
 * // Override baseURL for specific request
 * await api.get('/status')({
 *   baseURL: 'https://status.example.com'
 * });
 * 
 * // Override timeout for slow endpoint
 * await api.get<Data>('/expensive-operation')({
 *   timeout: 30000,
 *   retries: 3
 * });
 * 
 * // ===== INTERCEPTORS (AUTH, LOGGING, ERROR HANDLING) =====
 * const api = HttpFactory.create({
 *   baseURL: 'https://api.example.com',
 *   interceptRequest: async (init) => {
 *     // Add auth token dynamically
 *     const token = await getAuthToken();
 *     return {
 *       ...init,
 *       headers: {
 *         ...init.headers,
 *         'Authorization': `Bearer ${token}`
 *       }
 *     };
 *   },
 *   interceptResponse: async (res) => {
 *     // Global error handling
 *     if (res.status === 401) {
 *       await refreshAuth();
 *       // Retry logic would go here
 *     }
 *     return res;
 *   }
 * });
 * 
 * // ===== RESPONSE HELPERS =====
 * const res = await api.get<User[]>('/users')({});
 * 
 * // Check success
 * if (api.isOk(res)) {
 *   console.log(res.data); // Narrowed to User[]
 * }
 * 
 * // Unwrap or throw
 * const users = api.unwrap(res); // throws if not ok
 * 
 * // Unwrap with fallback
 * const users = api.unwrapOr(res, []); // returns [] if error
 * 
 * // ===== TRANSFORMATION =====
 * await api.get<string[]>('/tags')({
 *   transform: (data) => data.map((t: any) => t.name) // Transform JSON before returning
 * });
 * ```
 */
export const Http = {
  /**
   * Creates a configured HTTP client with defaults.
   * 
   * Use this for applications that need centralized configuration, interceptors,
   * or per-client defaults (baseURL, timeout, retries, custom headers).
   * 
   * For simple one-off requests, use the static methods: Http.get, Http.post, etc.
   * 
   * @template H - Custom header keys type
   * @param config - Client configuration
   * @returns An Http client factory
   * 
   * @example
   * ```typescript
   * const api = Http.create({
   *   baseURL: 'https://api.example.com',
   *   headers: { 'X-API-Key': 'secret' },
   *   timeout: 5000,
   *   retries: 2,
   *   interceptRequest: async (init) => {
   *     const token = await getAuthToken();
   *     return {
   *       ...init,
   *       headers: { ...init.headers, 'Authorization': `Bearer ${token}` }
   *     };
   *   }
   * });
   * 
   * const user = await api.get<User>('/users/123')({});
   * ```
   */
  create: <H extends string = string>(config: HttpConfig<H> = {}) => {
    const {
      baseURL: defaultBaseURL,
      headers: defaultHeaders,
      timeout: defaultTimeout = 0,
      retries: defaultRetries = 0,
      retryDelay: defaultRetryDelay = 1000,
      interceptRequest,
      interceptResponse
    } = config;

    /**
     * Executes an HTTP request.
     * @internal
     */
    const _request = async <T = any>(
      method: HttpMethod,
      path: string,
      init: HttpRequestInit = {}
    ): Promise<HttpResponse<T>> => {
      const {
        body,
        baseURL = defaultBaseURL,
        params,
        timeout = defaultTimeout,
        retries = defaultRetries,
        retryDelay = defaultRetryDelay,
        transform,
        ...restInit
      } = init;

      // Merge headers (default + request-specific)
      const headers = _mergeHeaders(
        defaultHeaders as Record<string, string> | undefined,
        restInit.headers as Record<string, string> | undefined
      );

      // Auto-set Content-Type for JSON bodies
      if (body && typeof body === 'object' && !Array.isArray(body) && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Build fetch init
      let fetchInit: any = {
        ...restInit,
        method,
        headers
      };

      // Encode body
      if (body !== undefined && body !== null) {
        fetchInit.body = _encodeBody(body);
      }

      // Run request interceptor
      if (interceptRequest) {
        const intercepted = await interceptRequest(init);
        fetchInit = { ...fetchInit, ...intercepted } as any;
      }

      // Build full URL with params
      const url = _buildUrl(path, baseURL, params);

      // Execute fetch with retry logic
      let response: globalThis.Response;
      try {
        response = await _fetchWithRetry(url, fetchInit, retries, retryDelay, timeout);
      } catch (error) {
        const httpRes: HttpResponse<T> = {
          ok: false,
          status: 0,
          statusText: 'Network Error',
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          response: null as any
        };
        return interceptResponse ? await interceptResponse(httpRes) : httpRes;
      }

      // Parse response data
      let data: T | null = null;
      try {
        data = await _parseResponse(response, transform);
      } catch (error) {
        console.error('Failed to parse response:', error);
      }

      // Build response wrapper
      const httpRes: HttpResponse<T> = {
        ok: response.ok,
        status: response.status as HttpStatus,
        statusText: response.statusText,
        data,
        error: null,
        response
      };

      // Run response interceptor
      return interceptResponse ? await interceptResponse(httpRes) : httpRes;
    };

    return {
      /**
       * Performs a GET request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path (e.g., '/users/123')
       * @returns A curried function that accepts request config
       * 
       * @example
       * ```typescript
       * const res = await http.get<User>('/users/123')({});
       * ```
       */
      get: <T = any>(path: string) => (init: HttpRequestInit = {}) => _request<T>('GET', path, init),

      /**
       * Performs a POST request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config with body
       * 
       * @example
       * ```typescript
       * const res = await http.post<Created>('/users')({
       *   body: { name: 'John' }
       * });
       * ```
       */
      post: <T = any>(path: string) => (init: HttpRequestInit = {}) => _request<T>('POST', path, init),

      /**
       * Performs a PUT request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config with body
       */
      put: <T = any>(path: string) => (init: HttpRequestInit = {}) => _request<T>('PUT', path, init),

      /**
       * Performs a DELETE request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config
       */
      delete: <T = any>(path: string) => (init: HttpRequestInit = {}) => _request<T>('DELETE', path, init),

      /**
       * Performs a PATCH request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config with body
       */
      patch: <T = any>(path: string) => (init: HttpRequestInit = {}) => _request<T>('PATCH', path, init),

      /**
       * Checks if an HTTP response is successful (2xx).
       * 
       * @example
       * ```typescript
       * const res = await http.get('/users')({});
       * if (http.isOk(res)) {
       *   // res.data is guaranteed to be of the generic type
       * }
       * ```
       */
      isOk: <T = any>(res: HttpResponse<T>): res is HttpResponse<T> & { data: T } => res.ok,

      /**
       * Unwraps response data or throws on error.
       * 
       * @example
       * ```typescript
       * const users = http.unwrap(await http.get<User[]>('/users')({}));
       * ```
       */
      unwrap: <T = any>(res: HttpResponse<T>): T => {
        if (!res.ok) throw res.error || new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.data as T;
      },

      /**
       * Unwraps response data or returns fallback on error.
       * 
       * @example
       * ```typescript
       * const users = http.unwrapOr(
       *   await http.get<User[]>('/users')({}),
       *   []
       * );
       * ```
       */
      unwrapOr: <T = any>(res: HttpResponse<T>, fallback: T): T => {
        return res.ok ? (res.data as T) : fallback;
      }
    };
  },

  /**
   * Performs a simple GET request without client configuration.
   * 
   * Throws an error if the response is not ok (non-2xx status).
   * 
   * **Error Handling**: Error message includes status code and text.
   * 
   * @template T - The expected response type
   * @param url - The URL to fetch from
   * @param headers - Optional request headers
   * @returns Promise resolving to parsed JSON response
   * @throws Error if response is not ok
   * 
   * @example
   * ```typescript
   * // Basic GET
   * const users = await Http.get<User[]>('/api/users');
   * 
   * // With custom headers
   * const data = await Http.get<Data>('/api/data', {
   *   'Authorization': 'Bearer token',
   *   'Accept-Language': 'en-US'
   * });
   * 
   * // Error handling
   * try {
   *   const user = await Http.get<User>('/api/user/999');
   * } catch (error) {
   *   // Error message: "Http.get 404: Not Found"
   *   console.error(error);
   * }
   * ```
   */
  get: async <T>(url: string, headers: Record<string, string> = {}): Promise<T> => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Http.get ${res.status}: ${res.statusText}`);
    return res.json();
  },

  /**
   * Performs a simple POST request without client configuration.
   * 
   * **Curried API**: url -> body -> headers for composition and reusability.
   * 
   * Throws an error if the response is not ok.
   * 
   * @template T - The expected response type
   * @param url - The URL to post to
   * @returns A curried function accepting body then headers
   * 
   * @example
   * ```typescript
   * // Basic POST
   * const user = await Http.post('/api/users')
   *   ({ name: 'John', email: 'john@example.com' })
   *   ();
   * 
   * // With auth headers
   * const response = await Http.post('/api/login')
   *   ({ username: 'admin', password: 'secret' })
   *   ({ 'X-CSRF-Token': csrfToken });
   * 
   * // Partial application
   * const createUser = Http.post('/api/users');
   * const user1 = await createUser({ name: 'Alice' })();
   * const user2 = await createUser({ name: 'Bob' })();
   * ```
   */
  post: (url: string) => <T>(body: any) => async (headers: Record<string, string> = {}): Promise<T> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Http.post ${res.status}: ${res.statusText}`);
    return res.json();
  },

  /**
   * Performs a simple PUT request without client configuration.
   * 
   * **Curried API**: url -> body -> headers for composition and reusability.
   * 
   * Throws an error if the response is not ok.
   * 
   * @template T - The expected response type
   * @param url - The URL to put to
   * @returns A curried function accepting body then headers
   * 
   * @example
   * ```typescript
   * // Update resource
   * const updated = await Http.put('/api/users/123')
   *   ({ name: 'John Updated', email: 'new@example.com' })
   *   ({ 'Authorization': `Bearer ${token}` });
   * 
   * // Partial application
   * const updateUser = (id: number) => Http.put(`/api/users/${id}`);
   * await updateUser(123)({ name: 'Alice' })();
   * ```
   */
  put: (url: string) => <T>(body: any) => async (headers: Record<string, string> = {}): Promise<T> => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Http.put ${res.status}: ${res.statusText}`);
    return res.json();
  },

  /**
   * Performs a simple DELETE request without client configuration.
   * 
   * Throws an error if the response is not ok.
   * 
   * @template T - The expected response type (often void or { success: boolean })
   * @param url - The URL to delete
   * @param headers - Optional request headers
   * @returns Promise resolving to parsed JSON response
   * @throws Error if response is not ok
   * 
   * @example
   * ```typescript
   * // Delete resource
   * await Http.delete('/api/users/123', {
   *   'Authorization': `Bearer ${token}`
   * });
   * 
   * // With confirmation
   * const result = await Http.delete<{ success: boolean }>(
   *   '/api/posts/456',
   *   { 'Authorization': `Bearer ${token}` }
   * );
   * if (result.success) {
   *   remove(postElement);
   * }
   * ```
   */
  delete: async <T>(url: string, headers: Record<string, string> = {}): Promise<T> => {
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`Http.delete ${res.status}: ${res.statusText}`);
    return res.json();
  }
};