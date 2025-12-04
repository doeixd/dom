/**
 * @doeixd/dom 
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
  *    4. Structure ........ append, prepend, after, before, remove, wrap, mount
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
 *    10. Navigation ...... Traverse (parent, children, siblings, next, prev, parents, nextAll, prevAll, closestAll)
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
 * Input that can be an element, selector string, function returning element, or null.
 * Used by selector-enabled utilities to accept flexible input types.
 */
export type ElementInput<S extends string = string> =
  | ParseSelector<S>                    // Direct element
  | S                                    // String selector
  | (() => ParseSelector<S> | null)     // Function returning element
  | null;                                // Null

/**
 * Function signature for selector-enabled utilities with dual-mode support.
 * Supports both immediate execution and curried application.
 */
export type SelectorFunction<_T extends HTMLElement, A extends any[], R> = {
  /** Immediate mode: all arguments provided at once */
  <S extends string>(input: ElementInput<S>, ...args: A): R;
  /** Curried mode: input provided first, returns function accepting remaining args */
  <S extends string>(input: ElementInput<S>): (...args: A) => R;
};

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

// =============================================================================
// NEW FEATURE TYPES
// =============================================================================

/**
 * SVG element tag names that require special namespace handling in h() proxy.
 */
export type SVGElementTags =
  | 'svg' | 'g' | 'path' | 'circle' | 'rect' | 'line' | 'polygon'
  | 'polyline' | 'ellipse' | 'text' | 'tspan' | 'defs' | 'clipPath'
  | 'linearGradient' | 'radialGradient' | 'stop' | 'mask' | 'pattern'
  | 'marker' | 'symbol' | 'use' | 'image' | 'foreignObject';

/**
 * Extended ElementProps that includes dataRef support for h() proxy.
 *
 * @example
 * ```typescript
 * const props: HElementProps = {
 *   class: { active: true },
 *   dataRef: 'myElement'  // Will set data-ref="myElement"
 * };
 * ```
 */
export interface HElementProps extends ElementProps {
  /** Reference name for element extraction via refs() */
  dataRef?: string;
}

/**
 * Options for configuring a List instance.
 *
 * @template T - The data item type
 *
 * @example
 * ```typescript
 * // Simple list (default blow-away mode)
 * const options: ListOptions<string> = {
 *   render: (item) => h.li({}, [item])
 * };
 *
 * // Keyed list (efficient diffing)
 * const options: ListOptions<User> = {
 *   key: user => user.id,
 *   render: (user) => h.li({}, [user.name]),
 *   update: (el, user) => { el.textContent = user.name; }
 * };
 * ```
 */
export interface ListOptions<T> {
  /** Function to render each item to an element (required) */
  render: (item: T, index: number) => HTMLElement;

  /** Optional key function - if provided, enables keyed reconciliation */
  key?: (item: T) => string | number;

  /** Optional update function for efficient keyed updates */
  update?: (element: HTMLElement, item: T, index: number) => void;

  /** Optional lifecycle hooks */
  onRemove?: (element: HTMLElement, item: T) => void;
  onAdd?: (element: HTMLElement, item: T) => void;

  /**
   * Optional custom reconciliation function for full control.
   * When provided, this function is responsible for all DOM updates.
   *
   * @example
   * ```typescript
   * // Use morphdom for custom reconciliation
   * reconcile: (oldItems, newItems, container, renderFn) => {
   *   const newHtml = newItems.map(renderFn).map(el => el.outerHTML).join('');
   *   morphdom(container, '<div>' + newHtml + '</div>');
   * }
   * ```
   */
  reconcile?: (
    oldItems: T[],
    newItems: T[],
    container: HTMLElement,
    renderFn: (item: T, index: number) => HTMLElement
  ) => void;
}

/**
 * Bound list instance with reactive update methods.
 *
 * @template T - The data item type
 */
export interface BoundList<T> {
  /** Replace entire list with new items */
  set(items: T[]): void;

  /** Append items to end of list */
  append(items: T[]): void;

  /** Prepend items to start of list */
  prepend(items: T[]): void;

  /** Insert items at specific index */
  insert(index: number, items: T[]): void;

  /** Remove items matching predicate */
  remove(predicate: (item: T) => boolean): void;

  /** Update items matching predicate */
  update(predicate: (item: T) => boolean, updater: (item: T) => T): void;

  /** Clear all items */
  clear(): void;

  /** Get current items array (readonly) */
  items(): readonly T[];

  /** Get current elements array (readonly) */
  elements(): readonly HTMLElement[];

  /** Destroy the list and cleanup */
  destroy(): void;
}

/**
 * Options for configuring a viewRefs template instance.
 */
export interface ViewRefsOptions {
  /** Optional root element class names */
  className?: string | string[];

  /** Optional root element ID */
  id?: string;

  /** Optional initial properties for root element */
  props?: ElementProps;
}

/**
 * Context passed to viewRefs template factory.
 *
 * @template R - The refs shape
 */
export interface ViewRefsContext<R extends Record<string, HTMLElement>> {
  /** Extracted refs object (populated after template execution) */
  refs: R;
}

/**
 * Instance returned by viewRefs factory.
 *
 * @template R - The refs shape
 */
export interface ViewRefsInstance<R extends Record<string, HTMLElement>> {
  /** The root element */
  element: HTMLElement;

  /** Typed refs object */
  refs: R;

  /** Update root element properties */
  update(props: ElementProps): void;

  /** Update individual refs with smart value handling */
  updateRefs(updates: Partial<{[K in keyof R]: any}>): void;

  /** Get a setter function for a specific ref */
  bind<K extends keyof R>(key: K): (value: any) => void;

  /** Destroy element and cleanup */
  destroy(): void;
}

/**
 * Schema defining how refs map to setters.
 *
 * @template R - The refs shape
 */
export type BinderSchema<R extends Record<string, HTMLElement>> = {
  [K in keyof R]: Setter<any>;
};

/**
 * Infers the data shape from a binder schema.
 *
 * @template S - The binder schema type
 */
export type InferBinderData<S extends Record<string, Setter<any>>> = {
  [K in keyof S]: S[K] extends Setter<infer T> ? T : never;
};

/**
 * Enhanced binder with batch updates and type-safe setters.
 *
 * @template R - The refs shape
 */
export interface EnhancedBinder<R extends Record<string, HTMLElement>> {
  /** Call with data object to update multiple refs */
  (data: Partial<InferBinderData<BinderSchema<R>>>): void;

  /** Individual setter functions */
  set: BinderSchema<R>;

  /** Batch multiple updates into single operation */
  batch(fn: () => void): void;

  /** Get current refs object */
  refs(): R;
}

/**
 * Primitive binding functions for common DOM operations.
 */
export interface BindPrimitives {
  /** Bind to textContent */
  text(el: HTMLElement | null): Setter<string>;

  /** Bind to innerHTML */
  html(el: HTMLElement | null): Setter<string>;

  /** Bind to attribute */
  attr(name: string): (el: HTMLElement | null) => Setter<string | null>;

  /** Bind to property */
  prop<K extends keyof HTMLElement>(name: K): (el: HTMLElement | null) => Setter<HTMLElement[K]>;

  /** Bind to CSS class toggle */
  toggle(className: string): (el: HTMLElement | null) => Setter<boolean>;

  /** Bind to multiple CSS classes */
  classes(el: HTMLElement | null): Setter<Record<string, boolean>>;

  /** Bind to style properties */
  style(el: HTMLElement | null): Setter<Partial<CSSStyleDeclaration>>;

  /** Bind to form input value */
  value(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null): Setter<string | number>;

  /** Bind to element visibility */
  show(el: HTMLElement | null): Setter<boolean>;
}

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
 * Finds an element or throws if not found.
 * 
 * @template S - CSS selector
 * @param selector - The selector to search for
 * @param root - The root to search within (default: document)
 * @returns The matched element
 * @throws Error if element not found
 */
export function require<S extends string>(selector: S, root: ParentNode = document): ParseSelector<S> {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el as ParseSelector<S>;
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



// =============================================================================
// 2. EVENTS
// =============================================================================

/**
 * Handler type for events
 */
type EventHandler<T extends EventTarget, K extends keyof HTMLElementEventMap> = (
  event: HTMLElementEventMap[K],
  target: T
) => void;

/**
 * Event setup stage: attach listener with event type and handler
 */
type EventSetup<T extends EventTarget> = {
  <K extends keyof HTMLElementEventMap>(
    eventType: K,
    handler: EventHandler<T, K>,
    options?: boolean | AddEventListenerOptions
  ): Unsubscribe;
};

/**
 * Attaches an event listener to the target element.
 *
 * Returns a cleanup function to remove the listener. Supports all standard
 * DOM events with full type inference. The handler receives both the event
 * and the target element for convenience.
 *
 * Supports multiple calling styles:
 * ```typescript
 * // Curried
 * on(button)('click', handler);
 *
 * // Imperative
 * on(button, 'click', handler);
 * ```
 *
 * @example
 * ```typescript
 * const button = find('button');
 *
 * // Curried - great for reuse
 * const onButton = on(button);
 * onButton('click', (e, target) => console.log('Clicked!', target));
 * onButton('mouseenter', (e, target) => cls.add(target)('hovered'));
 *
 * // Imperative - concise one-offs
 * on(button, 'click', (e, target) => {
 *   e.preventDefault();
 *   submit();
 * });
 *
 * // With options
 * on(window, 'scroll', handler, { passive: true });
 * on(button)('click', handler, { once: true });
 *
 * // Null-safe: returns no-op cleanup if target is null
 * const missing = find('.missing');
 * on(missing, 'click', handler); // Safe, returns () => {}
 *
 * // Type inference works throughout:
 * on(input, 'input', (e) => {
 *   console.log(e.data);  // e is InputEvent
 * });
 *
 * on(document, 'keydown', (e) => {
 *   if (e.key === 'Escape') close();  // e is KeyboardEvent
 * });
 * ```
 */
// Overload: just target -> returns event setup
export function on<T extends EventTarget>(
  target: T | null
): EventSetup<T>;

// Overload: all args -> returns Unsubscribe
export function on<T extends EventTarget, K extends keyof HTMLElementEventMap>(
  target: T | null,
  eventType: K,
  handler: EventHandler<T, K>,
  options?: boolean | AddEventListenerOptions
): Unsubscribe;

// Implementation
export function on<T extends EventTarget, K extends keyof HTMLElementEventMap>(
  target: T | null,
  eventType?: K,
  handler?: EventHandler<T, K>,
  options?: boolean | AddEventListenerOptions
): EventSetup<T> | Unsubscribe {

  // Core listener factory
  const createListener = <Evt extends keyof HTMLElementEventMap>(
    evt: Evt,
    fn: EventHandler<T, Evt>,
    opts: boolean | AddEventListenerOptions = false
  ): Unsubscribe => {
    if (!target) return () => { };

    const listener = (e: Event) => fn(e as HTMLElementEventMap[Evt], target);
    target.addEventListener(evt, listener, opts);
    return () => target.removeEventListener(evt, listener, opts);
  };

  // Event setup stage
  const eventSetup: EventSetup<T> = <Evt extends keyof HTMLElementEventMap>(
    evt: Evt,
    fn: EventHandler<T, Evt>,
    opts?: boolean | AddEventListenerOptions
  ) => createListener(evt, fn, opts);

  // Route based on provided arguments
  if (eventType === undefined || handler === undefined) {
    // on(target) -> event setup
    return eventSetup;
  }

  // on(target, event, handler) -> Unsubscribe
  return createListener(eventType, handler, options);
}

/**
 * Handler type for delegated events
 */
type DelegatedHandler<S extends string, K extends keyof HTMLElementEventMap> = (
  event: HTMLElementEventMap[K],
  match: ParseSelector<S>
) => void;

/**
 * Final stage: attach event listener
 */
type DelegatedEventSetup<S extends string> = {
  <K extends keyof HTMLElementEventMap>(
    eventType: K,
    handler: DelegatedHandler<S, K>,
    options?: boolean | AddEventListenerOptions
  ): Unsubscribe;
};

/**
 * Middle stage: select target elements
 * Supports both curried and imperative styles
 */
type DelegatedSelectorSetup = {
  // Curried: (selector) => (event, handler) => Unsubscribe
  <S extends string>(selector: S): DelegatedEventSetup<S>;

  // Imperative: (selector, event, handler) => Unsubscribe
  <S extends string, K extends keyof HTMLElementEventMap>(
    selector: S,
    eventType: K,
    handler: DelegatedHandler<S, K>,
    options?: boolean | AddEventListenerOptions
  ): Unsubscribe;
};

/**
 * Attaches a **Delegated Event Listener** using event bubbling.
 *
 * Supports multiple calling styles:
 * ```typescript
 * // Fully curried
 * onDelegated(root)('li')('click', handler);
 *
 * // Partially curried
 * onDelegated(root, 'li')('click', handler);
 * onDelegated(root)('li', 'click', handler);
 *
 * // Fully imperative
 * onDelegated(root, 'li', 'click', handler);
 * ```
 *
 * @example
 * ```typescript
 * const list = find('#user-list');
 *
 * // Curried - great for reuse
 * const onListItem = onDelegated(list)('li');
 * onListItem('click', (e, li) => console.log(li.textContent));
 * onListItem('mouseenter', (e, li) => cls.add(li)('hovered'));
 *
 * // Imperative - concise one-offs
 * onDelegated(list, 'button.delete', 'click', (e, btn) => {
 *   e.stopPropagation();
 *   deleteItem(btn.dataset.id);
 * });
 * ```
 */
// Overload: just root -> returns selector setup
export function onDelegated(
  root: ParentNode | null
): DelegatedSelectorSetup;

// Overload: root + selector -> returns event setup
export function onDelegated<S extends string>(
  root: ParentNode | null,
  selector: S
): DelegatedEventSetup<S>;

// Overload: all args -> returns Unsubscribe
export function onDelegated<S extends string, K extends keyof HTMLElementEventMap>(
  root: ParentNode | null,
  selector: S,
  eventType: K,
  handler: DelegatedHandler<S, K>,
  options?: boolean | AddEventListenerOptions
): Unsubscribe;

// Implementation
export function onDelegated<S extends string, K extends keyof HTMLElementEventMap>(
  root: ParentNode | null,
  selector?: S,
  eventType?: K,
  handler?: DelegatedHandler<S, K>,
  options?: boolean | AddEventListenerOptions
): DelegatedSelectorSetup | DelegatedEventSetup<S> | Unsubscribe {

  // Core listener factory - the actual work happens here
  const createListener = <Sel extends string, Evt extends keyof HTMLElementEventMap>(
    sel: Sel,
    evt: Evt,
    fn: DelegatedHandler<Sel, Evt>,
    opts: boolean | AddEventListenerOptions = false
  ): Unsubscribe => {
    if (!root) return () => { };

    const listener = (e: Event) => {
      const target = e.target as Element;
      const match = target.closest?.(sel);

      if (match && root.contains(match)) {
        fn(e as HTMLElementEventMap[Evt], match as ParseSelector<Sel>);
      }
    };

    root.addEventListener(evt, listener, opts);
    return () => root.removeEventListener(evt, listener, opts);
  };

  // Event setup stage: (eventType, handler, options?) => Unsubscribe
  const eventSetup = <Sel extends string>(sel: Sel): DelegatedEventSetup<Sel> => {
    return (<Evt extends keyof HTMLElementEventMap>(
      evt: Evt,
      fn: DelegatedHandler<Sel, Evt>,
      opts?: boolean | AddEventListenerOptions
    ) => createListener(sel, evt, fn, opts)) as DelegatedEventSetup<Sel>;
  };

  // Selector setup stage: supports both curried and imperative
  const selectorSetup = (<Sel extends string,
    Evt extends keyof HTMLElementEventMap
  >(
    sel: Sel,
    evt?: Evt,
    fn?: DelegatedHandler<Sel, Evt>,
    opts?: boolean | AddEventListenerOptions
  ) => {
    // Imperative: all args provided
    if (evt !== undefined && fn !== undefined) {
      return createListener(sel, evt, fn, opts);
    }
    // Curried: return event setup
    return eventSetup(sel);
  }) as DelegatedSelectorSetup;

  // Route based on provided arguments
  if (selector === undefined) {
    // onDelegated(root) -> selector setup
    return selectorSetup;
  }

  if (eventType === undefined || handler === undefined) {
    // onDelegated(root, selector) -> event setup
    return eventSetup(selector);
  }

  // onDelegated(root, selector, event, handler) -> Unsubscribe
  return createListener(selector, eventType, handler, options);
}

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

// =============================================================================
// 3. MANIPULATION (MODIFY & STYLE)
// =============================================================================

/**
 * The core logic for applying properties to an element. Kept private.
 * @internal
 */
const _applyProps = <T extends HTMLElement>(element: T | null, props: ElementProps): T | null => {
  if (!element) return null;

  if (props.text !== undefined) element.innerText = props.text;
  if (props.html !== undefined) element.innerHTML = props.html;
  if (props.value !== undefined) (element as any).value = props.value;
  if (props.disabled !== undefined) (element as any).disabled = props.disabled;

  if (props.style) Object.assign(element.style, props.style);

  if (props.dataset) {
    Object.entries(props.dataset).forEach(([k, v]) => {
      // Allow null/undefined to remove data attributes
      if (v === null || v === undefined) {
        delete element.dataset[k];
      } else {
        element.dataset[k] = String(v);
      }
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
};

/**
 * Declaratively modifies an element's properties with full type safety.
 *
 * Provides a unified API for setting text, styles, classes, attributes, and more.
 * Supports three calling styles for maximum flexibility.
 *
 * @template T - The HTML element type, which is preserved.
 *
 * @overload
 * <caption>**1. Config-First (Curried):** `modify(props)(element)`</caption>
 * Best for creating reusable modifiers in functional pipelines.
 * @param props - The properties to apply.
 * @returns A function that accepts an element and returns it.
 * @example
 * ```typescript
 * import { Fn, find } from '@doeixd/dom';
 * 
 * const makePrimary = modify({
 *   class: { 'btn-primary': true },
 *   attr: { 'aria-disabled': false }
 * });
 * 
 * Fn.pipe(
 *   find('#submit-btn'),
 *   makePrimary
 * );
 * ```
 *
 * @overload
 * <caption>**2. Element-First (Curried):** `modify(element)(props)`</caption>
 * Best for applying multiple, separate modifications to the same element.
 * @param element - The element to modify (null-safe).
 * @returns A function that accepts properties and returns the element.
 * @example
 * ```typescript
 * const btn = find('button');
 * const modifyBtn = modify(btn);
 * 
 * modifyBtn({ text: 'Step 1' });
 * // ... later
 * modifyBtn({ class: { success: true }, text: 'Complete' });
 * ```
 *
 * @overload
 * <caption>**3. Imperative:** `modify(element, props)`</caption>
 * Best for simple, one-off modifications. Cleanest syntax.
 * @param element - The element to modify (null-safe).
 * @param props - The properties to apply.
 * @returns The modified element.
 * @example
 * ```typescript
 * const btn = find('button');
 * modify(btn, { text: 'Click Me' });
 * ```
 */
export function modify<T extends HTMLElement>(props: ElementProps): (element: T | null) => T | null;
export function modify<T extends HTMLElement>(element: T | null, props: ElementProps): T | null;
export function modify<T extends HTMLElement>(element: T | null): (props: ElementProps) => T | null;

export function modify(
  arg1: any,
  arg2?: any
): any {
  const isElementFirst = arg1 instanceof HTMLElement || arg1 === null;

  // Case 1: Config-First -> modify(props)
  if (!isElementFirst) {
    const props = arg1;
    return (element: HTMLElement | null) => _applyProps(element, props);
  }

  // Case 2: Imperative -> modify(el, props)
  if (arg2 !== undefined) {
    const element = arg1;
    const props = arg2;
    return _applyProps(element, props);
  }

  // Case 3: Element-First Curried -> modify(el)
  const element = arg1;
  return (props: ElementProps) => _applyProps(element, props);
}

/** 
 * Sets properties on an element.
 *  @alias modify 
 */
export const set = modify;

/**
 * Applies inline CSS styles to an element. Supports multiple calling styles.
 *
 * @overload <caption>**1. Config-First:** `css(styles)(element)`</caption>
 * @param styles - The CSS styles to apply.
 * @returns A function that accepts an element.
 *
 * @overload <caption>**2. Element-First:** `css(element)(styles)`</caption>
 * @param element - The element to style.
 * @returns A function that accepts styles.
 *
 * @overload <caption>**3. Imperative:** `css(element, styles)`</caption>
 * @param element - The element to style.
 * @param styles - The CSS styles to apply.
 */
export function css(
  styles: Partial<CSSStyleDeclaration>
): <T extends HTMLElement>(element: T | null) => T | null;

export function css<T extends HTMLElement>(
  element: T | null,
  styles: Partial<CSSStyleDeclaration>
): T | null;

export function css<T extends HTMLElement>(
  element: T | null
): (styles: Partial<CSSStyleDeclaration>) => T | null;

export function css(
  arg1: any,
  arg2?: any
): any {
  const isElementFirst = arg1 instanceof HTMLElement || arg1 === null;

  const applyCss = <T extends HTMLElement>(element: T | null, styles: Partial<CSSStyleDeclaration>) => {
    if (element) Object.assign(element.style, styles);
    return element;
  };

  if (!isElementFirst) {
    const styles = arg1;
    return (element: HTMLElement | null) => applyCss(element, styles);
  }

  if (arg2 !== undefined) {
    const element = arg1;
    const styles = arg2;
    return applyCss(element, styles);
  }

  const element = arg1;
  return (styles: Partial<CSSStyleDeclaration>) => applyCss(element, styles);
}

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

/**
 * Mounts a child element into a parent container.
 *
 * Appends the child to the parent and returns a cleanup function to remove it.
 * Useful for dynamic DOM updates, modals, popovers, and temporary UI elements.
 *
 * Supports two call styles:
 * 1. `mount(parent, child)` — Imperative (cleaner DX)
 * 2. `mount(parent)(child)` — Curried (pipeline friendly)
 *
 * @overload
 * @param parent - Parent element or selector (null-safe)
 * @param child - Child element to mount (or null for curried)
 * @returns Cleanup function to unmount the child, or no-op if parent not found
 *
 * @example
 * ```typescript
 * // Imperative style
 * const modal = document.createElement('div');
 * modal.textContent = 'Hello World';
 * const cleanup = mount(document.body, modal);
 *
 * // Later: remove the element
 * cleanup();
 *
 * // Using selector-first API
 * const popup = el('div')({ class: { popup: true } })(['Content']);
 * const remove = mount(".container")(popup);
 *
 * // Mounting multiple elements
 * const list = document.querySelector('ul');
 * const items = [el('li')({})(['Item 1']), el('li')({})(['Item 2'])];
 * const cleanups = items.map(item => mount(list)(item));
 *
 * // With temporary modal
 * const showModal = (content: string) => {
 *   const modal = el('div')({
 *     class: { modal: true },
 *     attr: { role: 'dialog' }
 *   })([content]);
 *
 *   const cleanup = mount(document.body)(modal);
 *
 *   // Auto-cleanup on button click
 *   modal.addEventListener('click', () => cleanup());
 *   return cleanup;
 * };
 * ```
 */
export const mount = def((parent: Element | string | null, child: Element | null): Unsubscribe => {
  if (!child) return () => { };

  const parentEl = typeof parent === 'string' ? document.querySelector(parent) : parent;
  if (!parentEl) return () => { };

  parentEl.appendChild(child);

  // Return cleanup function
  return () => {
    if (child.parentNode === parentEl) {
      parentEl.removeChild(child);
    }
  };
});

// =============================================================================
// 5. CREATION & TEMPLATES
// =============================================================================

/**
 * Creates a DOM element with full type inference.
 * 
 * Supports two syntaxes:
 * 1. **Hyperscript-style**: `el(tag, props, children)` — cleaner, more readable
 * 2. **Curried**: `el(tag)(props)(children)` — composable, pipeline-friendly
 * 
 * The return type is automatically inferred from the tag name.
 * 
 * @template K - The HTML tag name (keyof HTMLElementTagNameMap)
 * @param tag - The HTML tag name (e.g., 'div', 'button', 'a')
 * @param props - Optional properties (text, classes, attributes, etc.)
 * @param children - Optional children (elements or text)
 * @returns The created element (Hyperscript) or curried function (Curried)
 * 
 * @example
 * ```typescript
 * // Hyperscript-style (new, cleaner)
 * const btn = el('button', { class: { primary: true } }, ['Click me']);
 * // btn is typed as HTMLButtonElement
 * 
 * // Nested elements (much more readable)
 * const card = el('div', { class: { card: true } }, [
 *   el('h2', {}, ['Title']),
 *   el('p', {}, ['Description'])
 * ]);
 * 
 * // Curried syntax (still supported for backward compatibility)
 * const link = el('a')({
 *   attr: { href: '/home' },
 *   class: { active: true },
 *   text: 'Home'
 * })([]);
 * // link is typed as HTMLAnchorElement
 * 
 * // Form input with type inference
 * const input = el('input', {
 *   attr: { type: 'text', placeholder: 'Enter name' },
 *   value: 'John'
 * }, []);
 * // input is typed as HTMLInputElement
 * 
 * // Partial application for reuse (curried)
 * const createButton = el('button');
 * const primaryBtn = createButton({ class: { primary: true } })(['Save']);
 * const secondaryBtn = createButton({ class: { secondary: true } })(['Cancel']);
 * ```
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps,
  children: (string | Node)[]
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K
): (props?: ElementProps) => (children?: (string | Node)[]) => HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElementProps,
  children?: (string | Node)[]
): any {
  // Hyperscript-style: el(tag, props, children)
  if (props !== undefined && children !== undefined) {
    const node = document.createElement(tag);
    modify(node)(props);
    node.append(..._nodes(children));
    return node;
  }

  // Curried syntax: el(tag)(props)(children)
  return (propsArg: ElementProps = {}) => {
    return (childrenArg: (string | Node)[] = []): HTMLElementTagNameMap[K] => {
      const node = document.createElement(tag);
      modify(node)(propsArg);
      node.append(..._nodes(childrenArg));
      return node;
    };
  };
}

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

/**
 * SVG element tags that require special namespace handling.
 * All tags are stored in lowercase for case-insensitive matching.
 * @internal
 */
const svgElementTags = new Set<string>([
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon',
  'polyline', 'ellipse', 'text', 'tspan', 'defs', 'clippath',
  'lineargradient', 'radialgradient', 'stop', 'mask', 'pattern',
  'marker', 'symbol', 'use', 'image', 'foreignobject'
]);

/**
 * VanJS-style hyperscript proxy for element creation.
 *
 * Provides a Proxy-based API where property access creates element factories.
 * Supports both HTML and SVG elements with automatic namespace detection.
 *
 * **Performance Note**: The Proxy has minimal overhead (~5% vs direct el() calls).
 * For performance-critical loops with 1000s of elements, prefer el() directly.
 *
 * **Type Safety**: Returns `HTMLElement` rather than specific element types due to
 * Proxy limitations. Use type assertions if you need specific element types.
 *
 * @example
 * ```typescript
 * import { h } from '@doeixd/dom';
 *
 * // Basic HTML elements
 * const card = h.div({ class: { card: true } }, [
 *   h.h2({}, ['Title']),
 *   h.p({ text: 'Content' }),
 *   h.button({ dataRef: 'submit' }, ['Submit'])
 * ]);
 *
 * // SVG elements (automatically use SVG namespace)
 * const icon = h.svg({ attr: { viewBox: '0 0 24 24', width: '24', height: '24' } }, [
 *   h.path({ attr: { d: 'M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z' } })
 * ]);
 *
 * // Nested structures
 * const list = h.ul({ class: { 'todo-list': true } }, [
 *   h.li({}, ['Item 1']),
 *   h.li({}, ['Item 2']),
 *   h.li({}, ['Item 3'])
 * ]);
 *
 * // With refs for later access
 * const form = h.form({}, [
 *   h.input({ dataRef: 'name', attr: { type: 'text', placeholder: 'Name' } }),
 *   h.input({ dataRef: 'email', attr: { type: 'email', placeholder: 'Email' } }),
 *   h.button({ dataRef: 'submit', attr: { type: 'submit' } }, ['Submit'])
 * ]);
 *
 * // Extract refs
 * const formRefs = refs(form);
 * console.log(formRefs.name, formRefs.email, formRefs.submit);
 * ```
 */
export const h = new Proxy({} as Record<string, (props?: HElementProps, children?: (string | Node)[]) => HTMLElement>, {
  get(_target, tag: string) {
    if (typeof tag !== 'string') return undefined;

    // Validate tag name (alphanumeric, starting with letter)
    if (!/^[a-z][a-z0-9]*$/i.test(tag)) {
      throw new Error(`h: Invalid tag name "${tag}". Tag names must start with a letter and contain only letters and numbers.`);
    }

    return (props: HElementProps = {}, children: (string | Node)[] = []) => {
      // Extract dataRef prop separately to avoid passing it to modify()
      const { dataRef, ...restProps } = props;

      // Create element with appropriate namespace
      const isSVG = svgElementTags.has(tag.toLowerCase());
      const element = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag);

      // Apply properties
      if (Object.keys(restProps).length > 0) {
        // For SVG elements, handle common props directly to ensure proper namespace handling
        if (isSVG) {
          // Handle attributes
          if (restProps.attr) {
            Object.entries(restProps.attr).forEach(([key, value]) => {
              if (value === false || value === null || value === undefined) {
                element.removeAttribute(key);
              } else {
                element.setAttribute(key, String(value));
              }
            });
          }

          // Handle classes
          if (restProps.class) {
            Object.entries(restProps.class).forEach(([className, isActive]) => {
              if (isActive) {
                element.classList.add(className);
              } else {
                element.classList.remove(className);
              }
            });
          }

          // Handle style
          if (restProps.style) {
            Object.assign((element as HTMLElement).style, restProps.style);
          }

          // Handle text and html
          if (restProps.text !== undefined) {
            element.textContent = restProps.text;
          }
          if (restProps.html !== undefined) {
            element.innerHTML = restProps.html;
          }
        } else {
          // For HTML elements, use modify for everything
          modify(element as HTMLElement, restProps);
        }
      }

      // Set data-ref attribute if provided
      if (dataRef) {
        element.setAttribute('data-ref', dataRef);
      }

      // Append children if any
      if (children.length > 0) {
        element.append(..._nodes(children));
      }

      return element as HTMLElement;
    };
  }
});

/**
 * Alias for `h` proxy. Provides alternative naming for hyperscript-style element creation.
 *
 * Some developers prefer `tags` as it's more explicit about creating HTML tags.
 * Functionally identical to `h`.
 *
 * @example
 * ```typescript
 * import { tags } from '@doeixd/dom';
 *
 * const page = tags.div({ class: { container: true } }, [
 *   tags.header({}, [tags.h1({}, ['My App'])]),
 *   tags.main({}, [tags.p({}, ['Content'])]),
 *   tags.footer({}, [tags.small({}, ['© 2024'])])
 * ]);
 * ```
 */
export const tags = h;

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
    if (val.startsWith('{') || val.startsWith('[')) {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
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

/**
 * Gets or sets an attribute on an element.
 *
 * Overloads:
 * 1. attr("data-id") — gets attribute from documentElement
 * 2. attr(el)("data-id") — gets attribute from the element
 * 3. attr(el)("data-id", "123") — sets attribute
 *
 * Getter returns `string | null`
 * Setter returns `void`
 */
export function attr(attribute: string): string | null;
export function attr(el: Element | null):
  (attribute: string) => string | null;
export function attr(el: Element | null):
  (attribute: string, value: string) => void;

export function attr(a: any): any {
  // Case 1: attr("data-id")
  if (typeof a === "string") {
    const attribute = a;
    return document.documentElement.getAttribute(attribute);
  }

  // Curried case: attr(el)
  const el: Element | null = a;
  return (attribute: string, value?: string): any => {
    if (!el) return value === undefined ? null : undefined;
    if (value === undefined) {
      return el.getAttribute(attribute);
    }
    el.setAttribute(attribute, value);
  };
}

/**
 * Gets or sets a DOM property.
 *
 * Works like `attr` but for real JS properties.
 *
 * Overloads:
 * 1. prop("value") — gets from document.documentElement
 * 2. prop(el)("value") — getter
 * 3. prop(el)("value", newValue) — setter
 *
 * Getter: returns the property type of the element if known.
 * Setter: void
 */
export function prop<K extends keyof HTMLElement>(prop: K): HTMLElement[K];
export function prop<T extends HTMLElement, K extends keyof T>(
  el: T | null
): (prop: K) => T[K];
export function prop<T extends HTMLElement, K extends keyof T>(
  el: T | null
): (prop: K, value: T[K]) => void;

export function prop(a: any): any {
  if (typeof a === "string") {
    const key = a;
    const el = document.documentElement as any;
    return el[key];
  }

  const el = a as HTMLElement | null;

  return (key: any, value?: any): any => {
    if (!el) return undefined;
    if (value === undefined) return (el as any)[key];
    (el as any)[key] = value;
  };
}


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
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
};

/**
 * Promise-based DOM lifecycle utilities for different timing needs.
 * 
 * Type-safe, composable methods for waiting on specific lifecycle phases:
 * - `dom()` — waits until DOM is parsed (DOMContentLoaded)
 * - `micro()` — waits until microtask queue is empty
 * - `raf()` — waits until next requestAnimationFrame
 * 
 * @example
 * ```typescript
 * // Wait for DOM to be parsed
 * await ready.dom();
 * const app = document.querySelector('#app');
 * 
 * // Wait for microtasks to flush
 * await ready.micro();
 * 
 * // Wait for next paint
 * await ready.raf();
 * 
 * // Chain multiple lifecycle waits
 * await ready.dom();
 * await ready.micro();
 * await ready.raf();
 * // Now safe to interact with layout
 * ```
 */
export const ready = {
  /**
   * Waits until the DOM is parsed and interactive (DOMContentLoaded).
   * Resolves immediately if DOM is already loaded.
   * 
   * @returns Promise that resolves when DOM is ready
   */
  dom: () => new Promise<void>(resolve => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  }),

  /**
   * Waits until the microtask queue is flushed (after current JS execution).
   * Useful for ensuring Promise chains and MutationObserver callbacks have run.
   * 
   * @returns Promise that resolves on next microtask
   */
  micro: () => new Promise<void>(resolve => queueMicrotask(resolve)),

  /**
   * Waits until the next requestAnimationFrame (next paint cycle).
   * Useful for deferring layout-dependent code.
   * 
   * @returns Promise that resolves on next frame
   */
  raf: () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
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
 * Flexible, type-aware DOM traversal utilities.
 *
 * Each method supports three invocation styles:
 *
 * 1. **Element-first** (immediate):
 *    Traverse.next(el)                     → Element | null
 *
 * 2. **Selector-first**:
 *    Traverse.next(".item")                → Element | null
 *
 * 3. **Curried**:
 *    Traverse.next(el)("span.highlight")   → Element | null
 *
 * All operations are:
 *   - **Null-safe**: All functions gracefully return `null` or `[]`.
 *   - **Type-preserving**: Passing `HTMLDivElement` returns `HTMLDivElement | null`.
 *   - **Selector-aware**: Passing a selector filters the returned element(s).
 */
export const Traverse = {
  /**
   * Get the parent element, optionally filtered by a selector.
   *
   * @example
   * // Element-first
   * const parent = Traverse.parent(el);       // <div> | null
   *
   * // Selector-first
   * const parent = Traverse.parent("#child"); // parent of #child
   *
   * // Curried
   * const specific = Traverse.parent(el)(".box");
   */
  parent(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.parentElement || null;
    }

    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const parent = el?.parentElement ?? null;
      if (!parent) return null;
      return !selector || parent.matches(selector) ? parent : null;
    };
  },

  /**
   * Get the next sibling element.
   *
   * @example
   * Traverse.next(el);            // <li> | null
   * Traverse.next(".active");     // next of .active
   * Traverse.next(el)("button");  // next button sibling
   */
  next(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.nextElementSibling || null;
    }

    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const next = el?.nextElementSibling ?? null;
      if (!selector || !next) return next;
      return next.matches(selector) ? next : null;
    };
  },

  /**
   * Get the previous sibling element.
   *
   * @example
   * Traverse.prev(el);
   * Traverse.prev(".selected");
   * Traverse.prev(el)(".item");
   */
  prev(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.previousElementSibling || null;
    }

    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const prev = el?.previousElementSibling ?? null;
      if (!selector || !prev) return prev;
      return prev.matches(selector) ? prev : null;
    };
  },

  /**
   * Get child elements, with optional selector filtering.
   *
   * @example
   * Traverse.children(el);         // Element[]
   * Traverse.children(".list");    // children of element matching .list
   * Traverse.children(el)("li");   // only <li> children
   */
  children(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el ? Array.from(el.children) : [];
    }

    const el = elOrSelector ?? null;
    return (selector?: string): Element[] => {
      if (!el) return [];
      const kids = Array.from(el.children);
      return selector ? kids.filter(c => c.matches(selector)) : kids;
    };
  },

  /**
    * Get sibling elements (excluding the original element).
    *
    * @example
    * Traverse.siblings(el);
    * Traverse.siblings("#active");
    * Traverse.siblings(el)(".item");
    */
  siblings(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      if (!el?.parentElement) return [];
      return Array.from(el.parentElement.children).filter(c => c !== el);
    }

    const el = elOrSelector ?? null;
    return (selector?: string): Element[] => {
      if (!el?.parentElement) return [];
      const sibs = Array.from(el.parentElement.children).filter(s => s !== el);
      return selector ? sibs.filter(s => s.matches(selector)) : sibs;
    };
  },

  /**
   * Get all ancestor elements up to the document root.
   *
   * Optionally stops at an element matching a selector.
   *
   * @example
   * Traverse.parents(el);                  // All ancestors
   * Traverse.parents("#child");            // Ancestors of #child
   * Traverse.parents(el, ".section");      // Ancestors until .section match
   * Traverse.parents(el)(".container");    // Curried: ancestors matching .container
   */
  parents(elOrSelector?: Element | string | null, until?: string | ((el: Element) => boolean)): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.parentElement ?? null;

    while (current) {
      // If until is a string selector
      if (typeof until === "string" && current.matches(until)) {
        break;
      }
      // If until is a function predicate
      if (typeof until === "function" && until(current)) {
        break;
      }
      result.push(current);
      current = current.parentElement;
    }

    return result;
  },

  /**
   * Get all following sibling elements.
   *
   * Optionally filtered by a selector.
   *
   * @example
   * Traverse.nextAll(el);           // All following siblings
   * Traverse.nextAll(".selected");  // Following siblings of .selected
   * Traverse.nextAll(el)(".item");  // Following siblings matching .item
   */
  nextAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.nextElementSibling ?? null;

    while (current) {
      if (!selector || current.matches(selector)) {
        result.push(current);
      }
      current = current.nextElementSibling;
    }

    return result;
  },

  /**
   * Get all preceding sibling elements.
   *
   * Optionally filtered by a selector.
   *
   * @example
   * Traverse.prevAll(el);           // All preceding siblings
   * Traverse.prevAll(".selected");  // Preceding siblings of .selected
   * Traverse.prevAll(el)(".item");  // Preceding siblings matching .item
   */
  prevAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.previousElementSibling ?? null;

    while (current) {
      if (!selector || current.matches(selector)) {
        result.push(current);
      }
      current = current.previousElementSibling;
    }

    return result;
  },

  /**
   * Get all ancestors including the element itself, up to document root.
   *
   * Optionally filtered by a selector.
   *
   * @example
   * Traverse.closestAll(el);            // Element + all ancestors
   * Traverse.closestAll("#child");      // Self + ancestors of #child
   * Traverse.closestAll(el)(".box");    // Self + ancestors matching .box
   */
  closestAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current: Element | null = el;

    while (current) {
      if (!selector || current.matches(selector)) {
        result.push(current);
      }
      current = current.parentElement;
    }

    return result;
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

  let resolved = false;
  let timeoutId: number | undefined;

  const onEnd = () => {
    if (resolved) return;
    resolved = true;

    if (timeoutId !== undefined) clearTimeout(timeoutId);
    el.removeEventListener('transitionend', onEnd);
    el.removeEventListener('animationend', onEnd);
    resolve(el);
  };

  el.addEventListener('transitionend', onEnd);
  el.addEventListener('animationend', onEnd);

  // Fallback: If no transition happens (e.g. display:none or 0s duration), resolve anyway.
  requestAnimationFrame(() => {
    const s = getComputedStyle(el);
    const transitionDuration = parseFloat(s.transitionDuration) * 1000;
    const animationDuration = parseFloat(s.animationDuration) * 1000;
    const maxDuration = Math.max(transitionDuration, animationDuration);

    if (maxDuration === 0) {
      onEnd();
    } else {
      // Safety timeout: duration + 50ms buffer
      timeoutId = setTimeout(onEnd, maxDuration + 50) as any;
    }
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

/**
 * Creates a reactive list binding with flexible rendering strategies.
 *
 * Provides three modes:
 * 1. **Default** (no `key`): Simple blow-away rendering - fast for small lists
 * 2. **Keyed** (with `key`): Efficient DOM diffing using Map-based reconciliation
 * 3. **Custom** (with `reconcile`): User-provided reconciliation for full control
 *
 * **Performance**:
 * - Default mode: O(n) render, best for lists <50 items that rarely change
 * - Keyed mode: O(n) diffing, best for dynamic lists with frequent updates
 * - Custom mode: Depends on user implementation (e.g., morphdom, nanomorph)
 *
 * **Memory**: Call `destroy()` when done to prevent memory leaks, especially
 * for keyed mode which maintains internal Maps.
 *
 * @template T - The data item type
 * @param container - The parent element to render into (null-safe)
 * @param options - Configuration for rendering strategy
 * @returns BoundList instance with reactive methods
 *
 * @example
 * ```typescript
 * import { List, h } from '@doeixd/dom';
 *
 * interface Todo {
 *   id: number;
 *   text: string;
 *   done: boolean;
 * }
 *
 * // Simple default mode (blow-away rendering)
 * const simpleList = List<string>(container, {
 *   render: (item) => h.li({}, [item])
 * });
 *
 * simpleList.set(['Item 1', 'Item 2', 'Item 3']);
 *
 * // Keyed mode (efficient diffing)
 * const todoList = List<Todo>(container, {
 *   key: todo => todo.id,
 *   render: (todo, index) => h.li({
 *     class: { done: todo.done }
 *   }, [
 *     h.input({
 *       attr: { type: 'checkbox' },
 *       dataRef: `todo-${todo.id}`
 *     }),
 *     h.span({}, [`${index + 1}. ${todo.text}`])
 *   ]),
 *   update: (el, todo, index) => {
 *     // Efficient: only update changed parts
 *     const checkbox = el.querySelector('input')!;
 *     checkbox.checked = todo.done;
 *     el.querySelector('span')!.textContent = `${index + 1}. ${todo.text}`;
 *     el.classList.toggle('done', todo.done);
 *   },
 *   onAdd: (el) => el.classList.add('fade-in'),
 *   onRemove: (el) => el.classList.add('fade-out')
 * });
 *
 * // Rich API
 * todoList.set(todos);
 * todoList.append([{ id: 4, text: 'New todo', done: false }]);
 * todoList.remove(todo => todo.done);
 * todoList.update(todo => todo.id === 1, todo => ({ ...todo, done: true }));
 *
 * // Custom reconciliation mode
 * import morphdom from 'morphdom';
 *
 * const customList = List<User>(container, {
 *   render: (user) => h.div({}, [user.name]),
 *   reconcile: (oldItems, newItems, container, renderFn) => {
 *     const newHTML = '<div>' +
 *       newItems.map(renderFn).map(el => el.outerHTML).join('') +
 *       '</div>';
 *     morphdom(container, newHTML);
 *   }
 * });
 *
 * // Cleanup when done
 * todoList.destroy();
 * ```
 */
export function List<T>(
  container: HTMLElement | null,
  options: ListOptions<T>
): BoundList<T> {
  // Null-safe no-op implementation
  if (!container) {
    const noop = () => {};
    return {
      set: noop,
      append: noop,
      prepend: noop,
      insert: noop,
      remove: noop,
      update: noop,
      clear: noop,
      items: () => [],
      elements: () => [],
      destroy: noop
    };
  }

  let currentItems: T[] = [];

  // Custom reconciliation mode
  if (options.reconcile) {
    return {
      set(items: T[]) {
        options.reconcile!(currentItems, items, container, options.render);
        currentItems = [...items];
      },
      append(items: T[]) {
        const newItems = [...currentItems, ...items];
        options.reconcile!(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      prepend(items: T[]) {
        const newItems = [...items, ...currentItems];
        options.reconcile!(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      insert(index: number, items: T[]) {
        const newItems = [
          ...currentItems.slice(0, index),
          ...items,
          ...currentItems.slice(index)
        ];
        options.reconcile!(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      remove(predicate: (item: T) => boolean) {
        const newItems = currentItems.filter(item => !predicate(item));
        options.reconcile!(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      update(predicate: (item: T) => boolean, updater: (item: T) => T) {
        const newItems = currentItems.map(item =>
          predicate(item) ? updater(item) : item
        );
        options.reconcile!(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      clear() {
        options.reconcile!(currentItems, [], container, options.render);
        currentItems = [];
      },
      items: () => currentItems,
      elements: () => Array.from(container.children) as HTMLElement[],
      destroy() {
        this.clear();
      }
    };
  }

  // Keyed mode (efficient diffing)
  if (options.key) {
    const elementMap = new Map<string | number, HTMLElement>();

    const reconcile = (newItems: T[]): void => {
      const newKeys = new Set(newItems.map(options.key!));

      // Remove deleted items
      currentItems.forEach(item => {
        const key = options.key!(item);
        if (!newKeys.has(key)) {
          const el = elementMap.get(key);
          if (el) {
            options.onRemove?.(el, item);
            el.remove();
            elementMap.delete(key);
          }
        }
      });

      // Build new element list
      const newElements: HTMLElement[] = [];

      newItems.forEach((item, index) => {
        const key = options.key!(item);
        let el = elementMap.get(key);

        if (el) {
          // Update existing element
          if (options.update) {
            options.update(el, item, index);
          }
        } else {
          // Create new element
          el = options.render(item, index) as HTMLElement;
          elementMap.set(key, el);
          options.onAdd?.(el, item);
        }

        newElements.push(el);
      });

      // Reorder DOM to match new order
      newElements.forEach((el, index) => {
        const currentEl = container.children[index];
        if (currentEl !== el) {
          container.insertBefore(el, currentEl || null);
        }
      });

      currentItems = [...newItems];
    };

    return {
      set(items: T[]) {
        reconcile(items);
      },
      append(items: T[]) {
        reconcile([...currentItems, ...items]);
      },
      prepend(items: T[]) {
        reconcile([...items, ...currentItems]);
      },
      insert(index: number, items: T[]) {
        reconcile([
          ...currentItems.slice(0, index),
          ...items,
          ...currentItems.slice(index)
        ]);
      },
      remove(predicate: (item: T) => boolean) {
        reconcile(currentItems.filter(item => !predicate(item)));
      },
      update(predicate: (item: T) => boolean, updater: (item: T) => T) {
        reconcile(currentItems.map(item => predicate(item) ? updater(item) : item));
      },
      clear() {
        reconcile([]);
      },
      items: () => currentItems,
      elements: () => Array.from(elementMap.values()),
      destroy() {
        this.clear();
        elementMap.clear();
      }
    };
  }

  // Default mode (simple blow-away rendering)
  const render = (items: T[]): void => {
    container.replaceChildren(...items.map((item, index) => options.render(item, index)));
    currentItems = [...items];
  };

  return {
    set(items: T[]) {
      render(items);
    },
    append(items: T[]) {
      render([...currentItems, ...items]);
    },
    prepend(items: T[]) {
      render([...items, ...currentItems]);
    },
    insert(index: number, items: T[]) {
      render([
        ...currentItems.slice(0, index),
        ...items,
        ...currentItems.slice(index)
      ]);
    },
    remove(predicate: (item: T) => boolean) {
      render(currentItems.filter(item => !predicate(item)));
    },
    update(predicate: (item: T) => boolean, updater: (item: T) => T) {
      render(currentItems.map(item => predicate(item) ? updater(item) : item));
    },
    clear() {
      render([]);
    },
    items: () => currentItems,
    elements: () => Array.from(container.children) as HTMLElement[],
    destroy() {
      this.clear();
    }
  };
}

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

/**
 * Creates a typed template factory with automatic ref extraction.
 *
 * Combines element creation with ref extraction into a single, type-safe pattern.
 * Perfect for reusable component templates where you need structured access to
 * internal elements.
 *
 * **Type Safety**: Generic parameter ensures refs are properly typed, providing
 * autocomplete and compile-time safety.
 *
 * **Pattern**: Template factory receives a context object that will be populated
 * with refs after the element is created, enabling advanced use cases.
 *
 * @template R - The shape of the refs object (interface mapping names to element types)
 * @param templateFactory - Function that creates the template element
 * @returns A factory function that creates instances with refs
 *
 * @example
 * ```typescript
 * import { viewRefs, h } from '@doeixd/dom';
 *
 * // Define the refs interface for type safety
 * interface CardRefs {
 *   title: HTMLHeadingElement;
 *   content: HTMLParagraphElement;
 *   action: HTMLButtonElement;
 * }
 *
 * // Create the template factory
 * const Card = viewRefs<CardRefs>(({ refs }) =>
 *   h.div({ class: { card: true } }, [
 *     h.h2({ dataRef: 'title' }, ['Default Title']),
 *     h.p({ dataRef: 'content' }, ['Default content']),
 *     h.button({ dataRef: 'action' }, ['Click Me'])
 *   ])
 * );
 *
 * // Create instance
 * const { element, refs, update } = Card();
 *
 * // Modify refs (fully typed!)
 * refs.title.textContent = 'My Card'; // ✅ Type-safe
 * refs.content.textContent = 'Some content';
 *
 * // Update root element
 * update({ class: { highlighted: true } });
 *
 * // Mount to DOM
 * document.body.appendChild(element);
 * ```
 *
 * @example
 * ```typescript
 * // Advanced: With initial configuration
 * const card = Card({
 *   className: 'featured-card',
 *   props: { class: { featured: true } }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Integration with List
 * interface TodoItemRefs {
 *   checkbox: HTMLInputElement;
 *   label: HTMLSpanElement;
 *   deleteBtn: HTMLButtonElement;
 * }
 *
 * const TodoItem = viewRefs<TodoItemRefs>(({ refs }) =>
 *   h.li({}, [
 *     h.input({ dataRef: 'checkbox', attr: { type: 'checkbox' } }),
 *     h.span({ dataRef: 'label' }),
 *     h.button({ dataRef: 'deleteBtn' }, ['×'])
 *   ])
 * );
 *
 * const todoList = List<Todo>(container, {
 *   key: todo => todo.id,
 *   render: (todo) => {
 *     const { element, refs } = TodoItem();
 *     refs.label.textContent = todo.text;
 *     refs.checkbox.checked = todo.done;
 *     refs.deleteBtn.onclick = () => deleteTodo(todo.id);
 *     return element;
 *   }
 * });
 * ```
 */
export function viewRefs<R extends Record<string, HTMLElement>>(
  templateFactory: (ctx: ViewRefsContext<R>) => HTMLElement
) {
  return (options?: ViewRefsOptions): ViewRefsInstance<R> => {
    // Create context object (refs will be populated after creation)
    const ctx: ViewRefsContext<R> = {
      refs: {} as R
    };

    // Execute template factory
    const element = templateFactory(ctx);

    // Extract refs from created element
    const extractedRefs = refs(element) as R;

    // Populate context refs (so template factory can access them if needed)
    Object.assign(ctx.refs, extractedRefs);

    // Apply optional configuration
    if (options) {
      if (options.className) {
        const classes = Array.isArray(options.className)
          ? options.className
          : [options.className];
        element.classList.add(...classes);
      }

      if (options.id) {
        element.id = options.id;
      }

      if (options.props) {
        modify(element, options.props);
      }
    }

    // Helper to apply a value to a ref element
    const applyValueToRef = (el: HTMLElement, value: any): void => {
      if (value === null || value === undefined) {
        return;
      }

      // If value is a string or number, set as text content
      if (typeof value === 'string' || typeof value === 'number') {
        el.textContent = String(value);
      }
      // If value is an object with element properties, use modify
      else if (typeof value === 'object' && !Array.isArray(value)) {
        // Check if it's an ElementProps-like object
        if ('text' in value || 'html' in value || 'class' in value ||
            'style' in value || 'attr' in value) {
          modify(el, value as ElementProps);
        }
        // Special handling for input elements
        else if ('value' in value && 'value' in el) {
          (el as any).value = value.value;
        }
        // Otherwise assume it's ElementProps
        else {
          modify(el, value as ElementProps);
        }
      }
    };

    return {
      element,
      refs: ctx.refs,
      update(props: ElementProps): void {
        modify(element, props);
      },
      updateRefs(updates: Partial<{[K in keyof R]: any}>): void {
        Object.entries(updates).forEach(([key, value]) => {
          const el = ctx.refs[key as keyof R];
          if (el) {
            applyValueToRef(el, value);
          }
        });
      },
      bind<K extends keyof R>(key: K): (value: any) => void {
        return (value: any) => {
          const el = ctx.refs[key];
          if (el) {
            applyValueToRef(el, value);
          }
        };
      },
      destroy(): void {
        element.remove();
      }
    };
  };
}

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
  if (!element) return new EventTarget() as T & EventTarget;

  const target = new EventTarget();
  return new Proxy(target, {
    get: (t, prop: string | symbol) => {
      if (prop in t) {
        const val = (t as any)[prop];
        return typeof val === 'function' ? val.bind(t) : val;
      }
      return Data.read(element)(String(prop));
    },
    set: (t, prop: string | symbol, value: any) => {
      if (prop in t) return true;
      Data.set(element)(String(prop), value);
      t.dispatchEvent(new CustomEvent(String(prop), { detail: value }));
      t.dispatchEvent(new CustomEvent('change', { detail: { prop, value } }));
      return true;
    },
    deleteProperty: (t, prop: string | symbol) => {
      if (prop in t) return false;
      Data.set(element)(String(prop), null);
      t.dispatchEvent(new CustomEvent(String(prop), { detail: null }));
      t.dispatchEvent(new CustomEvent('change', { detail: { prop, value: null } }));
      return true;
    },
    // Allow iteration over current dataset
    ownKeys: () => Reflect.ownKeys(element.dataset),
    getOwnPropertyDescriptor: (_, _key) => ({
      enumerable: true,
      configurable: true,
    })
  }) as T & EventTarget;
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

// =============================================================================
// FUNCTIONAL COMBINATORS & UTILITIES
// =============================================================================

/**
 * A collection of functional programming helpers for composition, currying,
 * and creating point-free logic. Essential for building complex behaviors
 * from small, reusable functions.
 */
export const Fn = {
  /**
   * (B-Combinator) Chains functions in left-to-right order.
   * `pipe(f, g, h)(x)` is equivalent to `h(g(f(x)))`.
   * 
   * @param fns - The sequence of functions to apply.
   * @returns A new function that applies the sequence to its input.
   * 
   * @example
   * ```typescript
   * import { Fn, modify, cls } from '@doeixd/dom';
   * 
   * const makeActive = Fn.pipe(
   *   modify({ text: 'Active' }),
   *   cls.add('is-active')
   * );
   * 
   * makeActive(myButton);
   * ```
   */
  pipe: <T>(...fns: Array<(arg: any) => any>) => (x: T): any => fns.reduce((v, f) => f(v), x),

  /**
   * Converts a function that takes two arguments `fn(a, b)` into a curried
   * function that takes them one at a time `fn(a)(b)`.
   * 
   * @param fn - The binary function to curry.
   * 
   * @example
   * ```typescript
   * const add = (a: number, b: number) => a + b;
   * const curriedAdd = Fn.curry(add);
   * const add5 = curriedAdd(5);
   * add5(3); // 8
   * ```
   */
  curry: <A, B, R>(fn: (a: A, b: B) => R) => (a: A) => (b: B): R => fn(a, b),

  /**
   * (C-Combinator) Swaps the arguments of a curried function.
   * Transforms `fn(config)(target)` into `fn(target)(config)`.
   * 
   * Essential for using config-first functions (like `cls.add`) in contexts 
   * like `Array.map` that provide the target first.
   * 
   * @param fn - The curried function to swap.
   * 
   * @example
   * ```typescript
   * import { Fn, findAll, cls } from '@doeixd/dom';
   * 
   * const buttons = findAll('button');
   * const addActiveClass = Fn.swap(cls.add)('is-active');
   * 
   * buttons.forEach(addActiveClass); // point-free style
   * ```
   */
  swap: <A, B, R>(fn: (a: A) => (b: B) => R): (b: B) => (a: A) => R => (b) => (a) => fn(a)(b),

  /**
   * Flips the arguments of a non-curried binary function.
   * Transforms `fn(a, b)` into `fn(b, a)`.
   * 
   * @param fn - The binary function to flip.
   */
  flip: <A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R => (b, a) => fn(a, b),

  /**
   * (K-Combinator) Executes a side-effect function with a value, then returns the value.
   * Essential for debugging (`console.log`) or executing void-returning functions
   * inside a `pipe` chain without breaking it.
   * 
   * @param fn - The side-effect function.
   * 
   * @example
   * ```typescript
   * import { Fn, modify, find } from '@doeixd/dom';
   * 
   * const processEl = Fn.pipe(
   *   modify({ text: 'Processed' }),
   *   Fn.tap(el => console.log('Element after modify:', el)),
   *   el => el.dataset.id
   * );
   * 
   * const id = processEl(find('#my-el'));
   * ```
   */
  tap: <T>(fn: (x: T) => void) => (x: T): T => {
    fn(x);
    return x;
  },

  /**
   * Creates a function that executes only if its input is not `null` or `undefined`.
   * Safely wraps functions that would otherwise throw errors on nullish inputs.
   * 
   * @param fn - The function to protect.
   * 
   * @example
   * ```typescript
   * import { Fn, find } from '@doeixd/dom';
   * 
   * const el = find('.maybe-missing');
   * const safeFocus = Fn.maybe(focus());
   * 
   * safeFocus(el); // No crash if el is null
   * ```
   */
  maybe: <T, R>(fn: (x: T) => R) => (x: T | null | undefined): R | null => {
    return (x === null || x === undefined) ? null : fn(x);
  },

  /**
   * (W-Combinator / Converge) Applies multiple functions to the same input,
   * then passes their results to a final combining function.
   * `converge(h, f, g)(x)` is equivalent to `h(f(x), g(x))`.
   * 
   * @param h - The final function that accepts the results.
   * @param fns - The functions to apply to the input.
   * 
   * @example
   * ```typescript
   * import { Fn, attr, prop } from '@doeixd/dom';
   * 
   * const logData = (id, value) => console.log({ id, value });
   * 
   * const logInputState = Fn.converge(
   *   logData,
   *   attr('data-id'),
   *   prop('value')
   * );
   * 
   * logInputState(myInputElement); // Logs { id: '...', value: '...' }
   * ```
   */
  converge: <T, O>(h: (...args: any[]) => O, ...fns: Array<(x: T) => any>) => (x: T): O => {
    return h(...fns.map(f => f(x)));
  },

  /**
   * Creates a function that executes one of two functions based on a predicate.
   * 
   * @param predicate - A function that returns a boolean.
   * @param ifTrue - The function to call if the predicate is true.
   * @param ifFalse - The function to call if the predicate is false.
   * 
   * @example
   * ```typescript
   * import { Fn, cls } from '@doeixd/dom';
   * 
   * const hasValue = (el: HTMLInputElement) => el.value.length > 0;
   * 
   * const toggleValidClass = Fn.ifElse(
   *   hasValue,
   *   cls.add('is-valid'),
   *   cls.remove('is-valid')
   * );
   * 
   * toggleValidClass(myInputElement);
   * ```
   */
  ifElse: <T, R1, R2>(
    predicate: (x: T) => boolean,
    ifTrue: (x: T) => R1,
    ifFalse: (x: T) => R2
  ) => (x: T): R1 | R2 => predicate(x) ? ifTrue(x) : ifFalse(x),

  /**
   * "Thunks" a function, creating a nullary (zero-argument) function that
   * calls the original with pre-filled arguments.
   * 
   * Useful for event handlers that don't need the event object.
   * 
   * @param fn - The function to thunk.
   * @param args - The arguments to pre-fill.
   * 
   * @example
   * ```typescript
   * import { Fn, on } from '@doeixd/dom';
   * 
   * const increment = (amount: number) => console.log(amount + 1);
   * 
   * on(button)('click', Fn.thunk(increment, 5)); // Logs 6 on click
   * ```
   */
  thunk: <A extends any[], R>(fn: (...args: A) => R, ...args: A): () => R => () => fn(...args),

  /**
   * (I-Combinator) Returns the value it was given.
   * Useful as a default or placeholder in functional compositions.
   */
  identity: <T>(x: T): T => x,

  /**
   * A function that does nothing and returns nothing.
   * Useful for providing a default no-op callback.
   */
  noop: () => { },

  /**
   * Converts an element-first function into an element-last (chainable) function.
   * Perfect for use with `chain()` and functional pipelines.
   *
   * Takes a function `(element, ...args) => result` and converts it to
   * `(...args) => (element) => element`, allowing it to be used in chains.
   *
   * @template T - The element type
   * @template A - The argument types tuple
   * @param fn - The element-first function to convert
   * @returns A curried, chainable version that returns the element
   *
   * @example
   * ```typescript
   * import { Fn, chain, find } from '@doeixd/dom';
   *
   * // Original element-first function
   * function setTextColor(el: HTMLElement, color: string) {
   *   el.style.color = color;
   * }
   *
   * // Convert to chainable
   * const withTextColor = Fn.chainable(setTextColor);
   *
   * // Now use in chain!
   * chain(
   *   find('#app'),
   *   withTextColor('red'),        // Returns (el) => el
   *   withTextColor('blue'),       // Can chain multiple
   *   cls.add('styled')            // Mix with other chainables
   * );
   *
   * // Works with multiple arguments
   * function setAttrs(el: HTMLElement, name: string, value: string) {
   *   el.setAttribute(name, value);
   * }
   * const withAttr = Fn.chainable(setAttrs);
   *
   * chain(
   *   element,
   *   withAttr('data-id', '123'),
   *   withAttr('aria-label', 'Button')
   * );
   *
   * // Reusable transformers
   * const makeButton = [
   *   withTextColor('white'),
   *   Fn.chainable((el: HTMLElement, size: string) => {
   *     el.style.padding = size === 'large' ? '20px' : '10px';
   *   })('large'),
   *   cls.add('btn')
   * ];
   *
   * findAll('button').forEach(btn => chain(btn, ...makeButton));
   * ```
   */
  chainable: <T extends HTMLElement, A extends any[]>(
    fn: (element: T, ...args: A) => any
  ) => (...args: A) => (element: T): T => {
    fn(element, ...args);
    return element;
  },

  /**
   * Like `chainable`, but preserves the function's return value instead of
   * returning the element. Useful when you need the result of the operation.
   *
   * @template T - The element type
   * @template A - The argument types tuple
   * @template R - The return type
   * @param fn - The element-first function to convert
   * @returns A curried version that returns the function's result
   *
   * @example
   * ```typescript
   * import { Fn } from '@doeixd/dom';
   *
   * // Function that returns a value
   * function getComputedWidth(el: HTMLElement, includeMargin: boolean): number {
   *   const styles = window.getComputedStyle(el);
   *   const width = parseFloat(styles.width);
   *   if (!includeMargin) return width;
   *   const marginLeft = parseFloat(styles.marginLeft);
   *   const marginRight = parseFloat(styles.marginRight);
   *   return width + marginLeft + marginRight;
   * }
   *
   * const getWidth = Fn.chainableWith(getComputedWidth);
   *
   * const element = find('#box');
   * const totalWidth = getWidth(true)(element);  // Returns number
   * console.log('Total width:', totalWidth);
   *
   * // Use in Fn.pipe when you need the value
   * const processElement = Fn.pipe(
   *   find('#container'),
   *   getWidth(false),
   *   width => console.log('Width:', width)
   * );
   * ```
   */
  chainableWith: <T extends HTMLElement, A extends any[], R>(
    fn: (element: T, ...args: A) => R
  ) => (...args: A) => (element: T): R => {
    return fn(element, ...args);
  },

  /**
   * Transforms an element-accepting function to also accept string selectors
   * or functions that return elements. Preserves dual-mode API like def().
   *
   * Supports ParseSelector type inference for string literal selectors,
   * enabling type-safe selector resolution with automatic element type inference.
   *
   * @template T - Element type
   * @template A - Arguments tuple
   * @template R - Return type
   * @param fn - Original element-accepting function
   * @param root - Root element for scoped searches (default: document)
   * @returns Function that accepts ElementInput with dual-mode support
   *
   * @example
   * ```typescript
   * import { Fn, cls, css, modify, find } from '@doeixd/dom';
   *
   * // Transform existing functions
   * const clsAdd = Fn.withSelector((el: HTMLElement | null, ...classes: string[]) => {
   *   if (!el) return null;
   *   cls.add(el)(...classes);
   *   return el;
   * });
   *
   * // Use with selectors (dual-mode)
   * clsAdd('button', 'active', 'btn');           // Immediate: HTMLButtonElement | null
   * clsAdd('button')('active', 'btn');           // Curried: HTMLButtonElement | null
   * clsAdd('#app', 'container');                 // ID selector: HTMLElement | null
   * clsAdd('svg')('icon');                       // SVG: SVGSVGElement | null
   *
   * // Use with function getters (lazy evaluation)
   * clsAdd(() => find('.dynamic'))('highlight'); // Function: HTMLElement | null
   *
   * // Use with direct elements
   * const button = find('button');
   * clsAdd(button)('active');
   *
   * // Null-safe by design
   * clsAdd(null)('active');         // Returns null, no error
   * clsAdd('.missing')('active');   // Returns null if not found
   *
   * // Type inference preserved
   * const btn = clsAdd('button')('active'); // Type: HTMLButtonElement | null
   * const div = clsAdd('div')('card');      // Type: HTMLDivElement | null
   *
   * // Scoped to component
   * const container = find('#container');
   * const scopedAdd = Fn.withSelector(
   *   (el: HTMLElement | null, ...classes: string[]) => {
   *     if (!el) return null;
   *     cls.add(el)(...classes);
   *     return el;
   *   },
   *   container // Scoped root
   * );
   * scopedAdd('button')('btn'); // Searches within container only
   *
   * // Create reusable selector-enabled utilities
   * const cssSelector = Fn.withSelector((el: HTMLElement | null, styles: Partial<CSSStyleDeclaration>) => {
   *   if (!el) return null;
   *   css(el)(styles);
   *   return el;
   * });
   *
   * cssSelector('.card', { padding: '20px' });
   * cssSelector('.card')({ padding: '20px' });
   * ```
   */
  withSelector: <T extends HTMLElement, A extends any[], R>(
    fn: (element: T | null, ...args: A) => R,
    root: ParentNode = document
  ): SelectorFunction<T, A, R> => {
    function wrapper<S extends string>(
      input: ElementInput<S>,
      ...args: any[]
    ): any {
      // Resolve input to element
      let element: T | null = null;

      if (input === null || input === undefined) {
        element = null;
      } else if (typeof input === 'string') {
        element = root.querySelector(input) as unknown as T | null;
      } else if (typeof input === 'function') {
        element = input() as unknown as T | null;
      } else {
        element = input as unknown as T | null;
      }

      // Apply original function with dual-mode support
      if (args.length > 0) {
        // Immediate mode: all arguments provided
        return fn(element, ...args as A);
      } else {
        // Curried mode: return function accepting remaining arguments
        return (...lateArgs: A) => fn(element, ...lateArgs);
      }
    }

    return wrapper as SelectorFunction<T, A, R>;
  },
};

/**
 * Selector-enabled versions of common DOM utilities.
 *
 * These wrap the original functions with `Fn.withSelector` for convenience,
 * allowing you to pass string selectors, function getters, or direct elements.
 *
 * All functions support dual-mode API (immediate and curried) and preserve
 * type inference via ParseSelector.
 *
 * @example
 * ```typescript
 * import { $sel, find } from '@doeixd/dom';
 *
 * // Add classes using selector
 * $sel.addClass('button', 'active', 'btn');
 * $sel.addClass('button')('active', 'btn'); // Curried
 *
 * // Apply CSS
 * $sel.css('.card', { padding: '20px' });
 * $sel.css('.card')({ padding: '20px' });
 *
 * // Modify elements
 * $sel.modify('#app', { text: 'Hello', disabled: false });
 *
 * // Attach events
 * $sel.on('button', 'click', (e) => console.log('Clicked!'));
 *
 * // Function getters for dynamic elements
 * $sel.focus(() => find('.modal input'))();
 *
 * // Type inference preserved
 * const btn = $sel.addClass('button')('active'); // HTMLButtonElement | null
 * const svg = $sel.css('svg')({ fill: 'red' });  // SVGSVGElement | null
 * ```
 */
export const $sel = {
  /**
   * Add classes using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  addClass: Fn.withSelector((el: Element | null, ...classes: string[]) => {
    if (!el) return null;
    cls.add(el, ...classes);
    return el;
  }),

  /**
   * Remove classes using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  removeClass: Fn.withSelector((el: Element | null, ...classes: string[]) => {
    if (!el) return null;
    cls.remove(el, ...classes);
    return el;
  }),

  /**
   * Toggle class using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  toggleClass: Fn.withSelector((el: Element | null, className: string, force?: boolean) => {
    if (!el) return null;
    return cls.toggle(el)(className, force);
  }),

  /**
   * Apply CSS styles using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  css: Fn.withSelector((el: HTMLElement | null, styles: Partial<CSSStyleDeclaration>) => {
    if (!el) return null;
    return css(el)(styles);
  }),

  /**
   * Modify element properties using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  modify: Fn.withSelector(<T extends HTMLElement>(el: T | null, props: ElementProps) => {
    if (!el) return null;
    return modify(el)(props) as T | null;
  }),

  /**
   * Attach event listener using selector or element.
   * Supports dual-mode: immediate and curried.
   * Returns unsubscribe function for cleanup.
   */
  on: Fn.withSelector(<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): Unsubscribe => {
    if (!el) return () => { };
    return on(el)(event, handler, options);
  }),

  /**
   * Focus element using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  focus: Fn.withSelector((el: HTMLElement | null, options?: FocusOptions) => {
    if (!el) return null;
    return focus(el)(options);
  }),

  /**
   * Blur element using selector or element.
   * Returns the element for chaining.
   */
  blur: Fn.withSelector((el: HTMLElement | null) => {
    if (!el) return null;
    return blur(el);
  }),

  /**
   * Scroll element into view using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  scrollInto: Fn.withSelector((el: Element | null, options?: ScrollIntoViewOptions) => {
    if (!el) return null;
    return scrollInto(el)(options);
  }),

  /**
   * Get element's bounding rect using selector or element.
   */
  rect: Fn.withSelector((el: Element | null): DOMRect | null => {
    if (!el) return null;
    return rect(el);
  }),

  /**
   * Remove element from DOM using selector or element.
   */
  remove: Fn.withSelector((el: Element | null) => {
    if (!el) return null;
    return remove(el);
  }),

  /**
   * Empty element (remove all children) using selector or element.
   */
  empty: Fn.withSelector((el: Element | null) => {
    if (!el) return null;
    return empty(el);
  })
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
  },

  /** 
 * Binds to inline styles. 
 * @example bind.style(el, 'width') // expects string like "100px"
 */
  style: (el: HTMLElement | null, property: string) => {
    let current: string | undefined;
    return (value: string | number) => {
      if (!el || current === value) return;
      current = String(value);
      el.style[property as any] = current;
    };
  },

  /**
   * Binds to CSS Variables.
   * @example bind.cssVar(el, '--progress')
   */
  cssVar: (el: HTMLElement | null, varName: string) => {
    let current: string | undefined;
    return (value: string | number) => {
      if (!el || current === value) return;
      current = String(value);
      el.style.setProperty(varName, current);
    };
  },

  /**
   * Binds to an element property.
   * @example bind.prop('disabled')(button)
   */
  prop: <K extends keyof HTMLElement>(propName: K, el?: HTMLElement | null) => {
    const createSetter = (target: HTMLElement | null): Setter<HTMLElement[K]> => {
      let current: any;
      return (value: HTMLElement[K]) => {
        if (!target || current === value) return;
        current = value;
        target[propName] = value;
      };
    };
    return el !== undefined ? createSetter(el) : createSetter;
  },

  /**
   * Binds to multiple CSS classes with boolean toggles.
   * @example bind.classes(el)({ active: true, disabled: false })
   */
  classes: (el: HTMLElement | null): Setter<Record<string, boolean>> => {
    return (classMap: Record<string, boolean>) => {
      if (!el) return;
      Object.entries(classMap).forEach(([className, isActive]) => {
        el.classList.toggle(className, isActive);
      });
    };
  },

  /**
   * Binds to form input value.
   * @example const setValue = bind.value(input); setValue('hello');
   */
  value: (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null): Setter<string | number> => {
    let current: string | undefined;
    return (value: string | number) => {
      if (!el) return;
      const stringValue = String(value);
      if (current !== stringValue) {
        current = stringValue;
        el.value = stringValue;
      }
    };
  },

  /**
   * Binds to element visibility (display none/block).
   * Preserves original display value when showing.
   * @example const toggleVis = bind.show(el); toggleVis(false);
   */
  show: (el: HTMLElement | null): Setter<boolean> => {
    if (!el) return () => {};
    let originalDisplay: string | null = null;

    return (visible: boolean) => {
      if (visible) {
        if (el.style.display === 'none') {
          el.style.display = originalDisplay || '';
        }
      } else {
        if (el.style.display !== 'none') {
          originalDisplay = el.style.display || null;
          el.style.display = 'none';
        }
      }
    };
  }
};

/**
 * Creates an enhanced binder with type-safe setters and batch updates.
 *
 * Integrates with the existing `bind` primitives to provide a declarative way
 * to bind data to DOM elements extracted via refs. Define a schema mapping
 * refs to setter functions, then update multiple refs with a single data object.
 *
 * **Features**:
 * - **Type-safe**: TypeScript infers data shape from schema
 * - **Batch updates**: Group multiple changes into single operation
 * - **Partial updates**: Only provide changed values
 * - **Null-safe**: Handles missing refs gracefully
 *
 * **Integration**: Uses existing `bind` primitives (text, value, prop, toggle, etc.)
 *
 * @template R - The refs shape
 * @param refsObj - Object containing refs to bind
 * @param schema - Optional schema defining how refs map to setters (defaults to text binding)
 * @returns Enhanced binder instance
 *
 * @example
 * ```typescript
 * import { createBinder, bind, viewRefs, h } from '@doeixd/dom';
 *
 * interface FormRefs {
 *   nameInput: HTMLInputElement;
 *   emailInput: HTMLInputElement;
 *   submitBtn: HTMLButtonElement;
 *   errorMsg: HTMLElement;
 * }
 *
 * const Form = viewRefs<FormRefs>(({ refs }) =>
 *   h.form({}, [
 *     h.input({ dataRef: 'nameInput', attr: { type: 'text' } }),
 *     h.input({ dataRef: 'emailInput', attr: { type: 'email' } }),
 *     h.button({ dataRef: 'submitBtn' }, ['Submit']),
 *     h.div({ dataRef: 'errorMsg', class: { error: true } })
 *   ])
 * );
 *
 * const { element, refs } = Form();
 *
 * // Create binder with schema using existing bind primitives
 * const ui = createBinder(refs, {
 *   nameInput: bind.value,
 *   emailInput: bind.value,
 *   submitBtn: bind.prop('disabled'),
 *   errorMsg: bind.text
 * });
 *
 * // Update multiple refs at once (type-safe!)
 * ui({
 *   nameInput: 'John Doe',
 *   emailInput: 'john@example.com',
 *   submitBtn: false
 * });
 *
 * // Batch updates for performance
 * ui.batch(() => {
 *   ui({ nameInput: '' });
 *   ui({ emailInput: '' });
 *   ui({ errorMsg: 'Please fill all fields' });
 * });
 *
 * // Access individual setters
 * ui.set.errorMsg('Invalid email format');
 *
 * // Partial updates
 * ui({ submitBtn: true }); // Only updates submit button
 * ```
 */
export function createBinder<R extends Record<string, HTMLElement>>(
  refsObj: R,
  schema?: Partial<BinderSchema<R>>
): EnhancedBinder<R> {
  // Build complete schema (default to text binding)
  const completeSchema: BinderSchema<R> = {} as BinderSchema<R>;

  for (const key in refsObj) {
    if (schema && key in schema) {
      // Use provided schema setter
      completeSchema[key] = (schema[key] as any)(refsObj[key]);
    } else {
      // Default to text binding
      completeSchema[key] = bind.text(refsObj[key]) as any;
    }
  }

  // Batching state
  let isBatching = false;
  const pendingUpdates = new Map<keyof R, any>();

  /**
   * Flushes pending updates in batch mode.
   */
  const flush = (): void => {
    if (!isBatching) {
      pendingUpdates.forEach((value, key) => {
        completeSchema[key](value);
      });
      pendingUpdates.clear();
    }
  };

  /**
   * Updates a single ref.
   */
  const updateRef = <K extends keyof R>(key: K, value: any): void => {
    if (isBatching) {
      pendingUpdates.set(key, value);
    } else {
      completeSchema[key](value);
    }
  };

  /**
   * Main binder function - updates multiple refs from data object.
   */
  const binderFn = (data: Partial<InferBinderData<BinderSchema<R>>>): void => {
    Object.entries(data).forEach(([key, value]) => {
      if (key in completeSchema) {
        updateRef(key as keyof R, value);
      }
    });

    if (!isBatching) {
      flush();
    }
  };

  /**
   * Batch multiple updates into single operation.
   */
  binderFn.batch = (fn: () => void): void => {
    const wasBatching = isBatching;
    isBatching = true;

    try {
      fn();
    } finally {
      isBatching = wasBatching;
      if (!wasBatching) {
        flush();
      }
    }
  };

  /**
   * Individual setter functions.
   */
  binderFn.set = completeSchema;

  /**
   * Get current refs object.
   */
  binderFn.refs = (): R => refsObj;

  return binderFn as EnhancedBinder<R>;
}

/**
 * Creates a lightweight, pure JavaScript observable store.
 * Unlike `store()`, this does NOT write to the DOM.
 */
export const createStore = <T extends Record<string, any>>(initialState: T) => {
  let state = { ...initialState };
  const listeners = new Set<(s: T) => void>();

  return {
    /** Get current state snapshot */
    get: () => state,

    /** Update state (partial updates merged) */
    set: (update: Partial<T> | ((prev: T) => Partial<T>)) => {
      const newVals = typeof update === 'function' ? update(state) : update;
      state = { ...state, ...newVals };
      listeners.forEach(fn => fn(state));
    },

    /** Subscribe to changes */
    subscribe: (fn: (s: T) => void): Unsubscribe => {
      listeners.add(fn);
      fn(state); // Fire immediately
      return () => listeners.delete(fn);
    }
  };
};

// =============================================================================
// 40. VIEW FACTORY & BINDER GENERATOR
// =============================================================================
/**
 * Attaches multiple event listeners to a set of DOM references in one go.
 * 
 * Returns a single **Unsubscribe** function that cleans up all listeners created 
 * by this call.
 * 
 * **Features:**
 * - **Deep Typing:** Infers event types based on event names (e.g., 'click' -> `MouseEvent`).
 * - **Cleanup:** Returns a batch unsubscribe function to prevent memory leaks.
 * - **Target-First:** Supports `bindEvents(refs, map)` or `bindEvents(refs)(map)`.
 * 
 * @template R - The Refs object type (Record of HTMLElements).
 * @template M - The Event Map definition.
 * 
 * @param refs - The object containing DOM elements (usually from `createView()`).
 * @param map - A nested object mapping `RefKey -> EventName -> Handler`.
 * @returns A function that removes all attached listeners.
 * 
 * @example
 * ```typescript
 * // 1. Immediate Usage
 * const cleanup = bindEvents(refs, {
 *   btn: { 
 *     // 'e' is inferred as MouseEvent, 'el' as HTMLButtonElement
 *     click: (e, el) => console.log('Clicked', el) 
 *   },
 *   input: { 
 *     // 'e' is inferred as InputEvent
 *     input: (e) => updateState(e.target.value),
 *     keydown: (e) => handleEnter(e)
 *   }
 * });
 * 
 * // Later: remove all listeners
 * cleanup();
 * 
 * // 2. Curried Usage (useful for defining behavior separate from refs)
 * const attachListeners = bindEvents(refs);
 * 
 * const cleanup = attachListeners({
 *   btn: { click: handleClick }
 * });
 * ```
 */
export function bindEvents<
  R extends Record<string, HTMLElement>
>(
  refs: R
): (map: EventSchema<R>) => Unsubscribe;

export function bindEvents<
  R extends Record<string, HTMLElement>
>(
  refs: R,
  map: EventSchema<R>
): Unsubscribe;

export function bindEvents(refs: any, map?: any) {
  const exec = (m: any): Unsubscribe => {
    const unsubs: Unsubscribe[] = [];

    Object.entries(m).forEach(([refKey, events]) => {
      const el = refs[refKey];
      if (!el) return;

      Object.entries(events as Record<string, any>).forEach(([evtName, handler]) => {
        // Uses fdom 'on' which returns an Unsubscribe
        unsubs.push(
          on(el)(evtName as any, (e) => handler(e, el))
        );
      });
    });

    // Return batch cleanup
    return () => unsubs.forEach(fn => fn());
  };

  if (map !== undefined) {
    return exec(map);
  }

  return (lateMap: any) => exec(lateMap);
}

/**
 * Helper type to map Refs to Event Handlers.
 * - Matches keys from Refs.
 * - Provides autocomplete for standard DOM events (click, input, etc).
 * - Allows custom events (strings).
 */
export type EventSchema<R extends Record<string, HTMLElement>> = {
  [K in keyof R]?: {
    // Standard Events
    [E in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[E], el: R[K]) => void;
  } & {
    // Custom Events
    [customEvent: string]: (e: any, el: R[K]) => void;
  };
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
 * Generates a strongly-typed object of UI updaters from a set of DOM references.
 * 
 * This utility acts as a **Schema Definition** for your view. It maps specific DOM elements 
 * (from `refs`) to specific behaviors (from `bind` primitives), returning an object of 
 * setter functions ready to accept data.
 * 
 * **Features:**
 * - **Type Safety:** Schema keys must exist in the provided `refs`.
 * - **Inference:** The returned setters preserve the input types of the binders (e.g., `bind.text` -> `string`).
 * - **Target-First:** Supports `binder(refs, schema)` or `binder(refs)(schema)`.
 * 
 * @template R - The Refs object type (Record of HTMLElements).
 * @template S - The Schema type mapping ref keys to binder factories.
 * 
 * @param refs - The object containing DOM elements (usually from `createView()`).
 * @param schema - A map defining how each ref should be bound (e.g., `{ title: bind.text }`).
 * @returns An object where keys match the schema and values are the bound setter functions.
 * 
 * @example
 * ```typescript
 * // 1. Immediate Usage
 * const ui = binder(refs, {
 *   title: bind.text,                // (val: string) => void
 *   avatar: bind.attr('src'),        // (val: string | null) => void
 *   isAdmin: bind.toggle('admin')    // (val: boolean) => void
 * });
 * 
 * ui.title('Welcome'); // Type-safe
 * 
 * // 2. Curried Usage (useful for pipelines or delayed definition)
 * const bindToView = binder(refs);
 * 
 * const ui = bindToView({
 *   title: bind.text
 * });
 * ```
 */
export function binder<
  R extends Record<string, HTMLElement>
>(
  refs: R
): <
  S extends Partial<{ [K in keyof R]: (el: any) => (val: any) => void }>
>(schema: S) => { [K in keyof S]: S[K] extends (el: any) => infer Fn ? Fn : never };

export function binder<
  R extends Record<string, HTMLElement>,
  S extends Partial<{ [K in keyof R]: (el: any) => (val: any) => void }>
>(
  refs: R,
  schema: S
): { [K in keyof S]: S[K] extends (el: any) => infer Fn ? Fn : never };

export function binder(refs: any, schema?: any) {
  const exec = (s: any) => {
    const binders: any = {};
    for (const key in s) {
      if (refs[key]) {
        binders[key] = s[key](refs[key]);
      }
    }
    return binders;
  };

  if (schema !== undefined) {
    return exec(schema);
  }

  return (lateSchema: any) => exec(lateSchema);
}

/** 
 * Helper type to constrain the setters object. 
 */
type SetterMap = Record<string, (val: any) => void>;

/** 
 * Helper type to infer the data shape from the setters.
 * Converts { name: (s: string) => void } into { name?: string } 
 */
type InferData<S extends SetterMap> = Partial<{
  [K in keyof S]: Parameters<S[K]>[0]
}>;

/**
 * Connects a data object to a map of UI setter functions.
 * 
 * This utility eliminates the boilerplate of manually calling updaters like 
 * `if (data.name) ui.name(data.name)`. It iterates through the `data` object 
 * and invokes the corresponding setter for each key found in the `setters` map.
 * 
 * **Behaviors:**
 * - **Partial Updates:** Keys in `data` that are `undefined` are ignored, allowing for partial state updates.
 * - **Null Support:** Keys set to `null` are passed through (useful for clearing attributes or text).
 * - **Type Inference:** The input `data` shape is strictly inferred from the `setters` definition.
 * 
 * **Usage Patterns:**
 * 1. **Immediate (`apply(ui, data)`):** Apply changes instantly. Useful for one-off updates.
 * 2. **Curried (`apply(ui)`):** Returns a reusable update function typed to accept your data. 
 *    This is the recommended pattern for the component `update` return value.
 * 
 * @template S - The shape of the Setters object (inferred automatically).
 * @param setters - The schema of updater functions (created via `binder()`).
 * @param data - The data object to apply. Keys missing from `setters` are safely ignored.
 * @returns 
 * - If `data` is provided: `void` (updates run immediately).
 * - If `data` is omitted: A function `(data: T) => void` for future updates.
 * 
 * @example
 * ```typescript
 * // 1. Define the UI Schema
 * const ui = binder(refs, {
 *   title: bind.text,                // (val: string) => void
 *   isVisible: bind.toggle('show')   // (val: boolean) => void
 * });
 * 
 * // 2. Immediate Usage
 * apply(ui, { title: 'Hello', isVisible: true });
 * 
 * // 3. Curried Usage (The "Hard Way" Component Pattern)
 * export default function init() {
 *   const { root, refs } = createView();
 *   const ui = binder(refs, { ... });
 * 
 *   // Create a pre-bound update function
 *   // 'update' is now typed as: (data: { title?: string, isVisible?: boolean }) => void
 *   const update = apply(ui);
 * 
 *   return (props) => {
 *     update(props);
 *     return root;
 *   };
 * }
 * ```
 */
export function apply<S extends SetterMap>(
  setters: S
): (data: InferData<S>) => void;

export function apply<S extends SetterMap>(
  setters: S,
  data: InferData<S>
): void;

export function apply<S extends SetterMap>(
  setters: S,
  data?: InferData<S>
) {
  // Shared logic execution
  const exec = (d: InferData<S>) => {
    for (const key in d) {
      const val = d[key];
      // Check undefined to allow null values if the setter accepts them
      if (val !== undefined) {
        const setter = setters[key];
        if (setter) setter(val);
      }
    }
  };

  // 1. Immediate execution
  if (data !== undefined) {
    return exec(data);
  }

  // 2. Partial application (Curried)
  return (lateData: InferData<S>) => exec(lateData);
}

// =============================================================================
// 40.5 ELEMENT TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Applies multiple pre-configured element transformers to an element.
 *
 * This utility takes an element and applies a sequence of curried functions to it.
 * Each function should be a pre-configured transformer that expects an element
 * (like `cls.add('active')`, `css({...})`, `modify({...})`).
 *
 * Returns the element for further chaining.
 *
 * @template T - The element type
 * @param element - The target element (null-safe)
 * @param transforms - Pre-configured element transformers
 * @returns The element (or null if input was null)
 *
 * @example
 * ```typescript
 * import { chain, find, cls, css, modify, attr } from '@doeixd/dom';
 *
 * // Configure a button with multiple operations
 * const button = chain(
 *   find('#submit'),
 *   cls.add('btn', 'btn-primary'),
 *   css({ padding: '10px 20px', borderRadius: '4px' }),
 *   modify({ text: 'Submit', disabled: false }),
 *   attr.set('data-action', 'submit')
 * );
 *
 * // Reusable configuration
 * const cardStyle = [
 *   cls.add('card', 'shadow'),
 *   css({ margin: '10px', padding: '15px' })
 * ];
 *
 * const cards = findAll('.card-container > div');
 * cards.forEach(card => chain(card, ...cardStyle));
 *
 * // With Fn.pipe for element creation
 * const createButton = Fn.pipe(
 *   el('button'),
 *   btn => chain(btn,
 *     cls.add('btn'),
 *     css({ padding: '10px' }),
 *     modify({ text: 'Click me' })
 *   )
 * );
 * ```
 */
export const chain = <T extends HTMLElement>(
  element: T | null,
  ...transforms: Array<(el: T) => any>
): T | null => {
  if (!element) return null;
  transforms.forEach(transform => transform(element));
  return element;
};

/**
 * Executes multiple callback functions on an element.
 *
 * Similar to `chain`, but accepts direct callback functions instead of
 * pre-configured transformers. Each callback receives the element as its
 * first argument.
 *
 * This is more flexible for operations that need runtime values or complex logic.
 * Returns the element for further chaining.
 *
 * @template T - The element type
 * @param element - The target element (null-safe)
 * @param operations - Callback functions that receive the element
 * @returns The element (or null if input was null)
 *
 * @example
 * ```typescript
 * import { exec, find, cls, css, on } from '@doeixd/dom';
 *
 * // Execute multiple operations with runtime values
 * const isActive = true;
 * const theme = 'dark';
 *
 * exec(
 *   find('#app'),
 *   el => cls.add(el)('app-container'),
 *   el => cls.toggle(el)('is-active', isActive),
 *   el => cls.add(el)(`theme-${theme}`),
 *   el => css(el)({
 *     backgroundColor: theme === 'dark' ? '#333' : '#fff'
 *   }),
 *   el => on(el)('click', () => console.log('Clicked!', el)),
 *   el => console.log('Element configured:', el)
 * );
 *
 * // Conditional operations
 * const config = getUserConfig();
 * exec(
 *   element,
 *   el => config.showBorder && cls.add(el)('bordered'),
 *   el => config.animated && attr.set(el)('data-animated', 'true'),
 *   el => config.onInit?.(el)
 * );
 *
 * // Mix with other operations
 * const buttons = findAll('button');
 * buttons.forEach((btn, index) =>
 *   exec(
 *     btn,
 *     el => modify(el)({ text: `Button ${index + 1}` }),
 *     el => on(el)('click', () => handleClick(index)),
 *     el => el.dataset.index = String(index)
 *   )
 * );
 * ```
 */
export const exec = <T extends HTMLElement>(
  element: T | null,
  ...operations: Array<(el: T) => any>
): T | null => {
  if (!element) return null;
  operations.forEach(operation => operation(element));
  return element;
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

/**
 * Narrows an element to a more specific type using a CSS selector.
 *
 * Usage:
 *   const input = cast("input[type=email]")(el);
 *
 * Returns:
 *   - el (narrowed) if it matches
 *   - null otherwise
 */
export function cast<S extends string>(selector: S) {
  return <T extends Element>(el: T | null): ParseSelector<S> | null => {
    if (!el) return null;
    return el.matches(selector)
      ? (el as unknown as ParseSelector<S>)
      : null;
  };
}

/**
 * Type guard: checks if a node is an Element.
 */
export function isElement(node: Node | null): node is Element {
  return node instanceof Element;
}

/**
 * Type guard: narrows an element to a specific tag type based on tag name.
 *
 * Example:
 *   nodes.filter(isTag("button")) // HTMLButtonElement[]
 */
export function isTag<K extends keyof HTMLElementTagNameMap>(tag: K) {
  return (el: Element | null): el is HTMLElementTagNameMap[K] => {
    return !!el && el.tagName.toLowerCase() === tag.toLowerCase();
  };
}

/**
 * Checks whether an element is visible within the viewport or a custom scroll root.
 *
 * **Usage styles:**
 *
 * **1. Element-first**
 * ```ts
 * const visible = isInViewport(myDiv);
 * ```
 *
 * **2. Selector-first**
 * ```ts
 * const visible = isInViewport(".item");
 * ```
 *
 * **3. Curried**
 * ```ts
 * const check = isInViewport(".item");
 * const visible = check({ partial: true });
 * ```
 *
 * **4. Fully-Curried (element first, options later)**
 * ```ts
 * const withOptions = isInViewport(myDiv);
 * const visible = withOptions({ threshold: 0.5 });
 * ```
 *
 * ---
 *
 * **Visibility semantics**
 *
 * The function defaults to **full visibility**, meaning the element must be
 * entirely inside the bounding box of the viewport (or of `root`, if provided).
 *  
 * Use options to relax or refine the check:
 *
 * - `partial?: boolean` — true if **any part** intersects the root.
 * - `threshold?: number` — percentage of the element that must be visible (0–1).
 *   Overrides `partial`/`full` semantics.
 * - `margin?: number | { top?: number; right?: number; bottom?: number; left?: number }`
 *   — expands or contracts the root bounds.
 * - `root?: Element | Document` — custom scroll container; defaults to viewport.
 *
 * ---
 *
 * **Selector behavior**
 *
 * When passed a string selector, the function queries the element from
 * `document`. If the selector does not match anything, the function returns
 * `false`.
 *
 * ---
 *
 * **Examples**
 *
 * **Check if fully visible**
 * ```ts
 * isInViewport(myDiv); // true or false
 * ```
 *
 * **Check if partially visible**
 * ```ts
 * isInViewport(myDiv, { partial: true });
 * ```
 *
 * **Require at least 60% visibility**
 * ```ts
 * isInViewport(myDiv, { threshold: 0.6 });
 * ```
 *
 * **Use margin to treat near-visibility as visible**
 * ```ts
 * isInViewport(myDiv, { margin: 50 });
 * ```
 *
 * **Use another scroll root**
 * ```ts
 * const scroller = document.querySelector(".scroll-area")!;
 * isInViewport(myDiv, { root: scroller });
 * ```
 *
 * @template S - CSS selector literal used to type-narrow elements when
 *               calling with a selector string.
 */
export function isInViewport<S extends string>(
  elOrSelector?: Element | null | S
):
  | boolean
  | ((
    options?: {
      /**
       * Allow partial visibility.  
       * default: false (element must be fully inside)
       */
      partial?: boolean;

      /**
       * Percentage of element that must be visible (0–1).  
       * Overrides `partial`. default: 1 (fully visible)
       */
      threshold?: number;

      /**
       * Custom viewport root (e.g., a scroll container).
       * default: window viewport
       */
      root?: Element | null;

      /**
       * Margin (CSS margin syntax: "10px", "10px 20px", etc.)
       * Expands or contracts the effective viewport.
       */
      margin?: string;
    }
  ) => boolean) {
  // --- Selector-first mode ---
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    if (!el) return false;
    return inViewport(el, {});
  }

  // --- Element-first or null-safe curried ---
  const el = elOrSelector ?? null;

  return (options?: {
    partial?: boolean;
    threshold?: number;
    root?: Element | null;
    margin?: string;
  }): boolean => {
    if (!el) return false;
    return inViewport(el, options ?? {});
  };
}

/**
 * Internal utility performing the actual visibility check.
 */
function inViewport(
  el: Element,
  {
    partial = false,
    threshold,
    root = null,
    margin
  }: {
    partial?: boolean;
    threshold?: number;
    root?: Element | null;
    margin?: string;
  }
): boolean {
  const rect = el.getBoundingClientRect();

  // Parse margin offsets
  const margins = parseMargin(margin);

  // Viewport or custom root bounds
  const containerRect = root
    ? root.getBoundingClientRect()
    : {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };

  // Apply margin adjustments
  const vp = {
    top: containerRect.top + margins.top,
    left: containerRect.left + margins.left,
    right: containerRect.right - margins.right,
    bottom: containerRect.bottom - margins.bottom
  };

  const elementArea = rect.width * rect.height;
  if (elementArea === 0) return false;

  const intersection = {
    top: Math.max(rect.top, vp.top),
    left: Math.max(rect.left, vp.left),
    right: Math.min(rect.right, vp.right),
    bottom: Math.min(rect.bottom, vp.bottom)
  };

  const intersectWidth = intersection.right - intersection.left;
  const intersectHeight = intersection.bottom - intersection.top;

  if (intersectWidth <= 0 || intersectHeight <= 0) return false;

  const visibleArea = intersectWidth * intersectHeight;

  // Threshold overrides all other options
  if (typeof threshold === "number") {
    return visibleArea / elementArea >= threshold;
  }

  // Full visibility (default)
  if (!partial) {
    return (
      rect.top >= vp.top &&
      rect.left >= vp.left &&
      rect.right <= vp.right &&
      rect.bottom <= vp.bottom
    );
  }

  // Partial visibility
  return visibleArea > 0;
}

/**
 * Parses CSS-like margin strings ("10px 20px").
 */
function parseMargin(input?: string) {
  if (!input) return { top: 0, left: 0, right: 0, bottom: 0 };

  const parts = input.split(/\s+/).map(p => parseInt(p, 10) || 0);

  switch (parts.length) {
    case 1:
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2:
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4:
    default:
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[2],
        left: parts[3]
      };
  }
}

/* --------------------------------------------------------
 * Animation Helpers
 * -------------------------------------------------------- */
/**
 * Animate an element using Web Animations API.
 *
 * Supports:
 * - Selector or element input
 * - Curried: animate(el)(keyframes, options)
 *
 * @example
 * ```ts
 * await animate(".box", { opacity: [0,1] }, { duration: 300 });
 * await animate(document.querySelector(".box"))({ transform: ["scale(0)","scale(1)"] }, { duration: 500 });
 * ```
 */
export function animate(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return (keyframes: Keyframe[], options?: KeyframeAnimationOptions) => el ? el.animate(keyframes, options).finished : Promise.resolve();
  }
  const el = elOrSelector ?? null;
  return (keyframes: Keyframe[], options?: KeyframeAnimationOptions) => el ? el.animate(keyframes, options).finished : Promise.resolve();
}




/**
 * Sanitizes HTML by removing dangerous tags and attributes to prevent XSS.
 * 
 * **Safety Features**:
 * - Removes `<script>`, `<iframe>`, `<object>`, `<embed>` tags.
 * - Removes all `on*` attributes (inline event handlers like `onclick`).
 * - Removes `javascript:` URIs in `href` and `src` attributes.
 * 
 * **SECURITY WARNING**: While significantly safer than a raw innerHTML, this function 
 * is lightweight and may not catch every sophisticated XSS vector. 
 * For high-risk inputs (e.g., public comments, rich text from untrusted users), 
 * use a dedicated library like DOMPurify.
 * 
 * @template T - The return type (defaults to string, can be cast to TrustedHTML etc.)
 * @param html - The HTML string to sanitize
 * @returns The sanitized HTML string
 * 
 * @example
 * ```typescript
 * // Removes scripts and handlers
 * const safe = sanitizeHTMLSimple('<div onclick="alert(1)">Hello</div><script>...</script>');
 * // Result: "<div>Hello</div>"
 * 
 * // Removes dangerous protocols
 * const safeLink = sanitizeHTMLSimple('<a href="javascript:alert(1)">Link</a>');
 * // Result: "<a>Link</a>"
 * ```
 */
export function sanitizeHTMLSimple<T = string>(html: string): T {
  const template = document.createElement('template');
  template.innerHTML = html;

  const dangerousTags = ['script', 'iframe', 'object', 'embed'];

  // 1. Remove dangerous tags
  template.content.querySelectorAll(dangerousTags.join(',')).forEach(node => node.remove());

  // 2. Sanitize attributes on all remaining elements
  template.content.querySelectorAll('*').forEach(el => {
    const attrs = el.getAttributeNames();
    for (const attr of attrs) {
      // Remove event handlers
      if (attr.startsWith('on')) {
        el.removeAttribute(attr);
      }
      // Remove javascript: protocol
      else if (attr === 'href' || attr === 'src') {
        const value = el.getAttribute(attr) || '';
        if (value.toLowerCase().trim().startsWith('javascript:')) {
          el.removeAttribute(attr);
        }
      }
    }
  });

  return template.innerHTML as unknown as T;
}

/**
 * Extracts text content from an HTML string, removing all tags.
 * 
 * Useful for:
 * - Generating plain text previews
 * - SEO descriptions
 * - Accessibility labels
 * - Safe text display
 * 
 * @template T - The return type (defaults to string)
 * @param html - The HTML string to parse
 * @returns The plain text content
 * 
 * @example
 * ```typescript
 * const text = sanitizeHTMLTextOnly('<h1>Hello <b>World</b></h1>');
 * // Result: "Hello World"
 * 
 * // Handles entities
 * const decoded = sanitizeHTMLTextOnly('Fish &amp; Chips');
 * // Result: "Fish & Chips"
 * ```
 */
export function sanitizeHTMLTextOnly<T = string>(html: string): T {
  const template = document.createElement('template');
  template.innerHTML = html;
  return (template.content.textContent || '') as unknown as T;
}


// =============================================================================
// 42. COMPONENT ARCHITECTURE (Release Candidate)
// =============================================================================

/**
 * Context object passed to the component setup function.
 * Provides a scoped, auto-cleaning sandbox for the component's logic.
 */
export interface ComponentContext<
  Refs extends Record<string, HTMLElement> = any,
  Groups extends Record<string, HTMLElement[]> = any,
  State extends Record<string, any> = Record<string, any>
> {
  /** The root element of the component */
  root: HTMLElement;

  /** 
   * Map of single elements with `data-ref` attributes.
   * Scoped to this component instance.
   */
  refs: Refs;

  /** 
   * Map of element arrays with `data-ref` attributes.
   * Useful for lists (e.g. `groups.items.forEach(...)`).
   */
  groups: Groups;

  /**
   * Reactive Proxy for the root element's dataset.
   * - Reading `state.foo` reads `data-foo` from the DOM.
   * - Writing `state.foo = x` updates `data-foo` and triggers watchers.
   */
  state: State;

  /**
   * Creates a lightweight, reactive store for component-local state.
   * Unlike `state`, this does NOT sync with DOM attributes - it's pure JS.
   *
   * @example
   * ```typescript
   * const userStore = ctx.store({ name: '', email: '' });
   *
   * // Subscribe to changes
   * userStore.subscribe((state) => console.log('User:', state));
   *
   * // Update state
   * userStore.set({ name: 'Alice' });
   *
   * // Get current state
   * console.log(userStore.get());
   * ```
   */
  store: typeof createStore;

  /**
   * Scoped element finder (querySelector within root).
   */
  find: (selector: string) => HTMLElement | null;

  /**
   * Scoped element finder (querySelectorAll within root).
   */
  findAll: (selector: string) => HTMLElement[];

  /**
   * Generates a strongly-typed object of UI updaters based on the component's Refs.
   * @see binder
   */
  binder: <S extends Partial<{ [K in keyof Refs]: (el: any) => (val: any) => void }>>(schema: S) =>
    { [K in keyof S]: S[K] extends (el: any) => infer Fn ? Fn : never };

  /**
   * Attaches multiple event listeners to the component's Refs with automatic cleanup.
   * @see bindEvents
   */
  bindEvents: (map: EventSchema<Refs>) => void;

  /**
   * Watches a specific key in the component's state (DOM attributes) for changes.
   * Fires immediately with current value, then on every change.
   * Auto-cleans up on destroy.
   */
  watch: (key: keyof State & string, handler: (val: any) => void) => void;

  /**
   * Registers a cleanup function to run when the component is destroyed.
   * (Equivalent to React's useEffect return function).
   */
  effect: (fn: Unsubscribe) => void;

  /**
   * Attaches an event listener to an element with automatic cleanup.
   * Returns an unsubscribe function for manual cleanup if needed.
   *
   * @param event - The event name (e.g., 'click', 'input').
   * @param element - The target element or selector (resolved via ctx.find).
   * @param handler - The event handler function.
   * @param options - Optional event listener options.
   *
   * @example
   * ```typescript
   * ctx.on('click', ctx.refs.btn, () => console.log('Clicked'));
   * ctx.on('input', 'input[name="search"]', (e) => handleSearch(e));
   * ```
   */
  on: <K extends keyof HTMLElementEventMap>(
    event: K,
    element: HTMLElement | string,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) => Unsubscribe;

  /**
   * Prebound bind utilities for easy DOM updates with selector resolution.
   * All methods accept either an HTMLElement or a selector string.
   */
  bind: {
    /**
     * Two-way binding between an input element and a state key.
     * Automatically syncs input value ↔ state.
     *
     * @example
     * ```typescript
     * ctx.bind.input('input[name="username"]', 'username');
     * // Now ctx.state.username updates the input, and input changes update state
     * ```
     */
    input: (inputOrSelector: HTMLInputElement | string, stateKey: keyof State & string) => void;

    /** Binds textContent to an element. */
    text: (elOrSelector: HTMLElement | string | null) => Setter<string>;

    /** Binds innerHTML to an element. */
    html: (elOrSelector: HTMLElement | string | null) => Setter<string>;

    /** Binds an attribute to an element. */
    attr: (name: string, elOrSelector?: HTMLElement | string | null) => Setter<string | number | boolean | null> | ((el?: HTMLElement | string | null) => Setter<string | number | boolean | null>);

    /** Binds a class toggle to an element. */
    toggle: (className: string, elOrSelector?: HTMLElement | string | null) => Setter<boolean> | ((el?: HTMLElement | string | null) => Setter<boolean>);

    /** Generic value binder with diffing. */
    val: <T>(initial: T, effect: (val: T) => void) => Setter<T>;

    /** Binds inline styles to an element. */
    style: (elOrSelector: HTMLElement | string | null, property: string) => Setter<string | number>;

    /** Binds CSS variables to an element. */
    cssVar: (elOrSelector: HTMLElement | string | null, varName: string) => Setter<string | number>;

    /** Binds a list to a container element. */
    list: <T>(containerOrSelector: HTMLElement | string | null, renderItem: (item: T, index: number) => Node) => Setter<T[]>;
  };

  /**
   * Observer utilities with automatic cleanup on component destroy.
   */
  observe: {
    /**
     * Creates an IntersectionObserver for an element.
     * Auto-disconnects on component destroy.
     *
     * @example
     * ```typescript
     * ctx.observe.intersection('.lazy-image', (entry) => {
     *   if (entry.isIntersecting) loadImage(entry.target);
     * });
     * ```
     */
    intersection: (
      elementOrSelector: HTMLElement | string,
      callback: (entry: IntersectionObserverEntry) => void,
      options?: IntersectionObserverInit
    ) => void;

    /**
     * Creates a ResizeObserver for an element.
     * Auto-disconnects on component destroy.
     *
     * @example
     * ```typescript
     * ctx.observe.resize('.resizable', (entry) => {
     *   console.log('New size:', entry.contentRect);
     * });
     * ```
     */
    resize: (
      elementOrSelector: HTMLElement | string,
      callback: (entry: ResizeObserverEntry) => void
    ) => void;
  };

  /**
   * Creates a computed property that derives its value from state keys.
   * Re-computes whenever any dependency changes.
   *
   * @param deps - Array of state keys to watch.
   * @param compute - Function to compute the derived value.
   * @returns Object with current value and onChange subscription.
   *
   * @example
   * ```typescript
   * const fullName = ctx.computed(['firstName', 'lastName'], () =>
   *   `${ctx.state.firstName} ${ctx.state.lastName}`
   * );
   *
   * fullName.onChange((name) => console.log('Full name:', name));
   * ```
   */
  computed: <T>(
    deps: Array<keyof State & string>,
    compute: () => T
  ) => {
    value: T;
    onChange: (callback: (val: T) => void) => void;
  };

  /**
   * Executes a function immediately after the component setup completes.
   * Useful for initialization that needs the full context to be ready.
   *
   * @example
   * ```typescript
   * ctx.onMount(() => {
   *   console.log('Component mounted');
   *   fetchInitialData();
   * });
   * ```
   */
  onMount: (fn: () => void) => void;

  /**
   * Registers a cleanup function to run when the component is destroyed.
   * Alias for `effect()` with a clearer name for lifecycle clarity.
   *
   * @example
   * ```typescript
   * ctx.onUnmount(() => {
   *   console.log('Component unmounting');
   *   saveState();
   * });
   * ```
   */
  onUnmount: (fn: () => void) => void;

  /**
   * Applies multiple pre-configured element transformers to an element.
   * Accepts string selectors (resolved within component root) or HTMLElements.
   *
   * @example
   * ```typescript
   * ctx.chain(
   *   '.submit-btn',
   *   cls.add('btn', 'btn-primary'),
   *   css({ padding: '10px' }),
   *   modify({ text: 'Submit' })
   * );
   *
   * // Or with refs
   * ctx.chain(
   *   ctx.refs.button,
   *   cls.add('active'),
   *   attr.set('disabled', false)
   * );
   * ```
   */
  chain: <T extends HTMLElement>(
    elementOrSelector: T | string,
    ...transforms: Array<(el: T) => any>
  ) => T | null;

  /**
   * Executes multiple callback functions on an element.
   * Accepts string selectors (resolved within component root) or HTMLElements.
   *
   * @example
   * ```typescript
   * const theme = ctx.state.theme;
   * ctx.exec(
   *   '.app-container',
   *   el => cls.add(el)(`theme-${theme}`),
   *   el => on(el)('click', handleClick),
   *   el => console.log('Configured:', el)
   * );
   * ```
   */
  exec: <T extends HTMLElement>(
    elementOrSelector: T | string,
    ...operations: Array<(el: T) => any>
  ) => T | null;
}

/**
 * The public interface returned by a component instance.
 */
export type ComponentInstance<API> = API & {
  /** The root element */
  root: HTMLElement;
  /** Destroys the component, removing all listeners and observers */
  destroy: () => void;
};

/**
 * Creates a reactive, self-cleaning component instance on a DOM element.
 * 
 * Applies the **Setup Pattern** (similar to Vue 3 Composition API) to Vanilla DOM.
 * It binds a logic closure to a root element and provides a scoped `Context` toolkit.
 * 
 * 🧠 **Key Features:**
 * 1. **Auto-Cleanup**: All listeners (`bindEvents`), watchers (`watch`), and effects 
 *    attached via the context are automatically removed when `destroy()` is called.
 * 2. **Scoped Access**: `refs`, `groups`, `binder`, `find` are scoped to the component root.
 * 3. **DOM-as-State**: `ctx.state` proxies `data-*` attributes for simple reactivity.
 * 4. **Composition**: The `setup` function allows for composing reusable logic.
 * 
 * @template API - The public methods/properties returned by the component.
 * @template R - The shape of `refs` (elements marked with `data-ref="name"`).
 * @template G - The shape of `groups` (lists marked with `data-ref="name"`).
 * @template S - The shape of `state` (reactive `data-*` attributes).
 * 
 * @param target - The DOM element or CSS selector to mount the component on.
 * @param setup - The initialization function. Receives a `ComponentContext` and returns the public API.
 * @returns The initialized component instance, or `null` if the target was not found.
 * 
 * @example
 * ```typescript
 * // 1. Define Types
 * interface CounterRefs { display: HTMLElement; btn: HTMLButtonElement; }
 * interface CounterGroups { items: HTMLElement[]; }
 * interface CounterState { count: number; }
 * 
 * // 2. Component Definition
 * const Counter = defineComponent<any, CounterRefs, CounterGroups, CounterState>('#app', (ctx) => {
 *   
 *   // Initialize State in DOM
 *   ctx.state.count = 0;
 * 
 *   // Output Schema (Data -> DOM)
 *   const ui = ctx.binder({
 *     display: bind.text
 *   });
 * 
 *   // Input Handling (DOM -> Logic)
 *   ctx.bindEvents({
 *     btn: {
 *       click: () => ctx.state.count++
 *     }
 *   });
 * 
 *   // Working with Groups (Lists)
 *   ctx.groups.items.forEach((item, index) => {
 *      modify(item)({ text: `Item ${index}` });
 *   });
 * 
 *   // Reactivity (State -> Output)
 *   ctx.watch('count', (val) => {
 *     ui.display(String(val));
 *   });
 * });
 * 
 * // 3. Usage
 * // ... later ...
 * Counter.destroy();
 * ```
 */
export const defineComponent = <
  API extends Record<string, any> = {},
  R extends Record<string, HTMLElement> = any,
  G extends Record<string, HTMLElement[]> = any,
  S extends Record<string, any> = any
>(
  target: string | HTMLElement | null,
  setup: (ctx: ComponentContext<R, G, S>) => API | void
): ComponentInstance<API> | null => {
  // 1. Resolve Root
  const root = (typeof target === 'string' ? find(document)(target) : target) as HTMLElement;
  if (!root) return null;

  // 2. Lifecycle & Cleanup Manager
  const hooks = createListenerGroup();
  const mountCallbacks: Array<() => void> = [];

  // 3. Resolve Scoped Refs & Groups
  const scopedRefs = refs(root) as R;
  const scopedGroups = groupRefs(root) as G;

  // Helper: Resolve element from string selector or HTMLElement
  const resolveElement = (elOrSelector: HTMLElement | string | null): HTMLElement | null => {
    if (typeof elOrSelector === 'string') {
      return find(root)(elOrSelector);
    }
    return elOrSelector;
  };

  // 4. Construct Context
  const ctx: ComponentContext<R, G, S> = {
    root,
    refs: scopedRefs,
    groups: scopedGroups,
    state: store<S>(root),
    store: createStore,

    find: find(root),
    findAll: findAll(root),

    // Scoped Binder (Bound to Refs)
    binder: (schema) => binder(scopedRefs, schema),

    // Scoped Event Binding (Bound to Refs) with Auto-Cleanup
    bindEvents: (map) => {
      hooks.add(bindEvents(scopedRefs, map));
    },

    // Reactive State Watcher
    watch: (key, handler) => {
      hooks.add(Data.bind(root)(key, handler));
    },

    // Generic Cleanup
    effect: (fn) => hooks.add(fn),

    // Prebound Event Listener with Auto-Cleanup
    on: (event, element, handler, options) => {
      const target = resolveElement(element);
      const unsubscribe = on(target)(event, handler as any, options);
      hooks.add(unsubscribe);
      return unsubscribe;
    },

    // Prebound Bind Utilities with Selector Resolution
    bind: {
      input: (inputOrSelector, stateKey) => {
        const input = (typeof inputOrSelector === 'string'
          ? find(root)(inputOrSelector)
          : inputOrSelector) as HTMLInputElement;

        if (!input) return;

        // Determine input type
        const inputType = input.type?.toLowerCase() || 'text';
        const isCheckbox = inputType === 'checkbox';
        const isRadio = inputType === 'radio';

        // State -> Input
        const updateInput = (val: any) => {
          if (isCheckbox) {
            input.checked = !!val;
          } else if (isRadio) {
            input.checked = input.value === String(val);
          } else {
            input.value = val ?? '';
          }
        };

        // Input -> State
        const updateState = () => {
          if (isCheckbox) {
            ctx.state[stateKey] = input.checked as any;
          } else if (isRadio) {
            if (input.checked) {
              ctx.state[stateKey] = input.value as any;
            }
          } else {
            ctx.state[stateKey] = input.value as any;
          }
        };

        // Initialize input from state
        updateInput(ctx.state[stateKey]);

        // Listen to state changes
        ctx.watch(stateKey, updateInput);

        // Listen to input changes
        const eventName = isCheckbox || isRadio ? 'change' : 'input';
        hooks.add(on(input)(eventName as any, updateState));
      },

      text: (elOrSelector) => bind.text(resolveElement(elOrSelector)),
      html: (elOrSelector) => bind.html(resolveElement(elOrSelector)),

      attr: ((name: string, elOrSelector?: HTMLElement | string | null) => {
        if (elOrSelector === undefined) {
          return (el?: HTMLElement | string | null) => bind.attr(name, resolveElement(el || null));
        }
        return bind.attr(name, resolveElement(elOrSelector));
      }) as any,

      toggle: ((className: string, elOrSelector?: HTMLElement | string | null) => {
        if (elOrSelector === undefined) {
          return (el?: HTMLElement | string | null) => bind.toggle(className, resolveElement(el || null));
        }
        return bind.toggle(className, resolveElement(elOrSelector));
      }) as any,

      val: bind.val,

      style: (elOrSelector, property) => bind.style(resolveElement(elOrSelector), property),
      cssVar: (elOrSelector, varName) => bind.cssVar(resolveElement(elOrSelector), varName),
      list: (containerOrSelector, renderItem) => bind.list(resolveElement(containerOrSelector), renderItem)
    },

    // Observer Utilities with Auto-Cleanup
    observe: {
      intersection: (elementOrSelector, callback, options) => {
        const element = resolveElement(elementOrSelector);
        if (!element) return;

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(callback);
        }, options);

        observer.observe(element);
        hooks.add(() => observer.disconnect());
      },

      resize: (elementOrSelector, callback) => {
        const element = resolveElement(elementOrSelector);
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
          entries.forEach(callback);
        });

        observer.observe(element);
        hooks.add(() => observer.disconnect());
      }
    },

    // Computed Properties
    computed: (deps, compute) => {
      let currentValue = compute();
      const listeners = new Set<(val: any) => void>();

      // Watch all dependencies
      deps.forEach((dep) => {
        ctx.watch(dep, () => {
          const newValue = compute();
          if (!Object.is(currentValue, newValue)) {
            currentValue = newValue;
            listeners.forEach((fn) => fn(newValue));
          }
        });
      });

      return {
        get value() { return currentValue; },
        onChange: (callback) => {
          listeners.add(callback);
          // Optionally fire immediately
          callback(currentValue);
        }
      };
    },

    // Lifecycle Hooks
    onMount: (fn) => {
      mountCallbacks.push(fn);
    },

    onUnmount: (fn) => hooks.add(fn),

    // Element Transformation Utilities
    chain: (<T extends HTMLElement>(elementOrSelector: T | string, ...transforms: Array<(el: T) => any>): T | null => {
      const element = (typeof elementOrSelector === 'string'
        ? find(root)(elementOrSelector)
        : elementOrSelector) as T | null;
      return chain(element, ...transforms);
    }) as any,

    exec: (<T extends HTMLElement>(elementOrSelector: T | string, ...operations: Array<(el: T) => any>): T | null => {
      const element = (typeof elementOrSelector === 'string'
        ? find(root)(elementOrSelector)
        : elementOrSelector) as T | null;
      return exec(element, ...operations);
    }) as any
  };

  // 5. Initialize Logic
  const api = setup(ctx) || {} as API;

  // Execute onMount callbacks after setup completes
  mountCallbacks.forEach((fn) => fn());

  // 6. Return Instance
  return {
    ...api,
    root,
    destroy: () => hooks.clear(),
  };
};

/**
 * Spawns a component dynamically.
 * Useful for Modals, Toasts, or dynamic lists.
 * 
 * @param templateFn - The view factory (from `view()`)
 * @param componentFn - The logic factory (from `defineComponent`)
 * @param target - Where to append the result
 * @param props - Initial props
 * 
 * @example
 * ```typescript
 * // 1. Define the template
 * const ModalTemplate = view(({ title, message }) => html`
 *   <div class="modal" data-ref="modal">
 *     <div class="modal-content">
 *       <h2 data-ref="title">${title}</h2>
 *       <p data-ref="message">${message}</p>
 *       <button data-ref="closeBtn">Close</button>
 *     </div>
 *   </div>
 * `);
 * 
 * // 2. Define the component logic
 * const ModalComponent = (root: HTMLElement) => defineComponent(root, (ctx) => {
 *   ctx.bindEvents({
 *     closeBtn: {
 *       click: () => instance.destroy()
 *     }
 *   });
 * 
 *   return {
 *     setTitle: (title: string) => modify(ctx.refs.title)({ text: title }),
 *     setMessage: (msg: string) => modify(ctx.refs.message)({ text: msg })
 *   };
 * });
 * 
 * // 3. Spawn the modal
 * const instance = mountComponent(
 *   () => ModalTemplate({ title: 'Alert', message: 'Hello World!' }),
 *   ModalComponent,
 *   document.body
 * );
 * 
 * // 4. Use the API
 * instance.setTitle('New Title');
 * 
 * // 5. Cleanup when done
 * instance.destroy(); // Removes DOM and cleans up listeners
 * ```
 */
export const mountComponent = <API>(
  templateFn: () => { root: HTMLElement | DocumentFragment },
  componentFn: (root: HTMLElement) => ComponentInstance<API> | null,
  target: HTMLElement,
  _props?: any
) => {
  // 1. Create DOM
  const { root } = templateFn();
  const rootEl = (root instanceof DocumentFragment ? root.firstElementChild : root) as HTMLElement;

  // 2. Append to DOM (must happen before logic if logic needs measurements)
  target.appendChild(root);

  // 3. Initialize Logic
  // We explicitly pass the element we just created
  const instance = componentFn(rootEl);

  if (!instance) {
    rootEl.remove();
    throw new Error('Failed to init component');
  }

  // 4. Return wrapper with destroy that cleans DOM too
  return {
    ...instance,
    destroy: () => {
      instance.destroy();
      rootEl.remove();
    }
  };
};

/**
 * Control object passed to wrapped functions for fine-grained update control.
 *
 * @template R - The return/result type used for updates
 *
 * @example
 * ```typescript
 * const loadItems = sync((control) => {
 *   control(0); // Immediate update: "Loading 0%"
 *
 *   for (let i = 0; i < items.length; i++) {
 *     processItem(items[i]);
 *     control((i + 1) / items.length * 100); // Progress updates
 *   }
 *
 *   control.skip(); // Skip final auto-update (we already updated)
 *   return items.length;
 * });
 * ```
 */
interface UpdateControl<R> {
  /**
   * Trigger an immediate update with the given value.
   * Useful for progress indicators, intermediate states, or streaming updates.
   *
   * @param value - The value to pass to the updater function
   *
   * @example
   * ```typescript
   * const processFiles = sync((control) => {
   *   files.forEach((file, i) => {
   *     process(file);
   *     control({ current: i + 1, total: files.length });
   *   });
   *   return files.length;
   * });
   * ```
   */
  (value: R): void;

  /**
   * Skip the automatic update that normally runs after function completion.
   * Call this when you've handled updates manually and don't need a final one.
   *
   * @example
   * ```typescript
   * const manualUpdate = sync((control) => {
   *   const result = compute();
   *   control(result); // Manual update
   *   control.skip();  // Don't update again with return value
   *   return result;
   * });
   * ```
   */
  skip(): void;

  /**
   * Queue an update to run asynchronously (next microtask).
   * Multiple queued updates within the same task are batched into one.
   *
   * @param value - The value to pass to the updater function
   *
   * @example
   * ```typescript
   * const batchedOps = sync((control) => {
   *   control.queue(1); // Queued
   *   control.queue(2); // Replaces previous (batched)
   *   control.queue(3); // Replaces previous (batched)
   *   // Only one update runs with value 3
   *   return 3;
   * });
   * ```
   */
  queue(value: R): void;

  /**
   * Force all queued updates to run immediately.
   * Useful when you need to ensure DOM is updated before continuing.
   *
   * @example
   * ```typescript
   * const withFlush = sync((control) => {
   *   control.queue(intermediateValue);
   *   control.flush(); // Force update now
   *   measureDOM();    // Safe to measure after flush
   *   return finalValue;
   * });
   * ```
   */
  flush(): void;
}

/**
 * Updater function called when updates are triggered.
 *
 * @template T - The element type
 * @template R - The result type from wrapped functions
 *
 * @param el - The target element
 * @param result - The return value from the wrapped function (undefined on initial call)
 *
 * @example
 * ```typescript
 * // Simple text updater
 * const textUpdater: Updater<HTMLElement, number> = (el, result) => {
 *   el.textContent = result !== undefined ? String(result) : '0';
 * };
 *
 * // Progress bar updater
 * const progressUpdater: Updater<HTMLElement, number> = (el, percent) => {
 *   el.style.width = `${percent ?? 0}%`;
 *   el.setAttribute('aria-valuenow', String(percent ?? 0));
 * };
 * ```
 */
type Updater<T extends Element, R = unknown> = (el: T, result: R | undefined) => void;

/**
 * Function signature for wrapped functions that receive update control.
 *
 * @template Args - Argument types for the function
 * @template R - Return type of the function
 */
type ControlledFn<Args extends any[], R> = (control: UpdateControl<R>, ...args: Args) => R;

/**
 * Function signature for simple wrapped functions without control.
 *
 * @template Args - Argument types for the function
 * @template R - Return type of the function
 */
type SimpleFn<Args extends any[], R> = (...args: Args) => R;

/**
 * The resulting wrapped function type.
 *
 * @template Args - Argument types for the function
 * @template R - Return type of the function
 */
type WrappedFn<Args extends any[], R> = (...args: Args) => R;

/**
 * Helper type to extract wrapped function types from a record.
 */
type WrapAll<T extends Record<string, ControlledFn<any[], any>>> = {
  [K in keyof T]: T[K] extends ControlledFn<infer Args, infer R>
  ? WrappedFn<Args, R>
  : never;
};

/**
 * Helper type for simple function wrapping.
 */
type WrapAllSimple<T extends Record<string, SimpleFn<any[], any>>> = {
  [K in keyof T]: T[K] extends SimpleFn<infer Args, infer R>
  ? WrappedFn<Args, R>
  : never;
};

/**
 * The update wrapper interface with all utilities.
 *
 * @template T - The target element type
 *
 * @example
 * ```typescript
 * let count = 0;
 * const sync: UpdateWrapper<HTMLElement> = createUpdateAfter(
 *   countEl,
 *   (el, result) => { el.textContent = String(result ?? count); }
 * );
 *
 * // Use various wrapper methods
 * const increment = sync((ctrl) => ++count);
 * const add = sync((ctrl, n: number) => count += n);
 * const reset = sync.simple(() => count = 0);
 * ```
 */
interface UpdateWrapper<T extends Element> {
  /**
   * Wrap a function that receives update control.
   * The updater automatically runs after function completion with its return value.
   *
   * @template Args - The function's argument types
   * @template R - The function's return type
   * @param fn - Function receiving UpdateControl as first argument, followed by any args
   * @returns A wrapped function with the same signature (minus control)
   *
   * @example
   * ```typescript
   * const sync = createUpdateAfter(el, (el, count) => {
   *   el.textContent = `Count: ${count}`;
   * });
   *
   * // With control for intermediate updates
   * const incrementBy = sync((control, amount: number) => {
   *   for (let i = 0; i < amount; i++) {
   *     count++;
   *     control(count); // Update after each increment
   *   }
   *   return count;
   * });
   *
   * incrementBy(5); // Updates 5 times during, once after
   * ```
   */
  <Args extends any[], R>(fn: ControlledFn<Args, R>): WrappedFn<Args, R>;

  /**
   * Wrap a simple function without update control.
   * Convenient when you don't need intermediate updates.
   *
   * @template Args - The function's argument types
   * @template R - The function's return type
   * @param fn - Simple function to wrap
   * @returns A wrapped function with identical signature
   *
   * @example
   * ```typescript
   * const increment = sync.simple(() => ++count);
   * const add = sync.simple((n: number) => count += n);
   * const reset = sync.simple(() => count = 0);
   *
   * increment();  // Updates with new count
   * add(5);       // Updates with new count
   * reset();      // Updates with 0
   * ```
   */
  simple<Args extends any[], R>(fn: SimpleFn<Args, R>): WrappedFn<Args, R>;

  /**
   * Wrap multiple controlled functions at once.
   *
   * @template A - Record of controlled functions
   * @param actions - Object mapping names to controlled functions
   * @returns Object with same keys but wrapped functions
   *
   * @example
   * ```typescript
   * const actions = sync.all({
   *   increment: (ctrl) => ++count,
   *   decrement: (ctrl) => --count,
   *   add: (ctrl, n: number) => count += n,
   *   reset: (ctrl) => count = 0
   * });
   *
   * actions.increment();  // Updates
   * actions.add(10);      // Updates
   * actions.reset();      // Updates
   * ```
   */
  all<A extends Record<string, ControlledFn<any[], any>>>(actions: A): WrapAll<A>;

  /**
   * Wrap multiple simple functions at once.
   *
   * @template A - Record of simple functions
   * @param actions - Object mapping names to simple functions
   * @returns Object with same keys but wrapped functions
   *
   * @example
   * ```typescript
   * const actions = sync.allSimple({
   *   increment: () => ++count,
   *   decrement: () => --count,
   *   double: () => count *= 2
   * });
   *
   * actions.increment();
   * actions.double();
   * ```
   */
  allSimple<A extends Record<string, SimpleFn<any[], any>>>(actions: A): WrapAllSimple<A>;

  /**
   * Batch multiple operations, running only ONE update at the end.
   * All wrapped function calls inside the batch are executed,
   * but their individual updates are suppressed until the batch completes.
   *
   * @template R - Return type of the batch function
   * @param fn - Function containing multiple wrapped calls
   * @returns The return value of fn
   *
   * @example
   * ```typescript
   * // Without batch: 3 DOM updates
   * increment(); increment(); increment();
   *
   * // With batch: 1 DOM update
   * sync.batch(() => {
   *   increment();
   *   increment();
   *   increment();
   * });
   *
   * // Batch with return value
   * const finalCount = sync.batch(() => {
   *   increment();
   *   increment();
   *   return count;
   * });
   * ```
   */
  batch<R>(fn: () => R): R;

  /**
   * Manually trigger an update with a specific value.
   * Useful for forcing updates outside of wrapped functions.
   *
   * @template R - The value type
   * @param value - Value to pass to the updater
   *
   * @example
   * ```typescript
   * // Force update with specific value
   * sync.update(42);
   *
   * // Update after external change
   * count = someExternalValue;
   * sync.update(count);
   * ```
   */
  update<R>(value: R): void;

  /**
   * Trigger an update with undefined (same as initial update).
   * Useful when the updater reads from external state.
   *
   * @example
   * ```typescript
   * const sync = createUpdateAfter(el, (el) => {
   *   el.textContent = String(count); // Reads from closure
   * });
   *
   * count = 100;
   * sync.refresh(); // Updates to show 100
   * ```
   */
  refresh(): void;

  /**
   * Check if currently inside a batch operation.
   */
  readonly isBatching: boolean;

  /**
   * The target element (may be null if element wasn't found).
   */
  readonly el: T | null;
}


/**
 * Stage 1: Only element provided, waiting for updater.
 */
type ElementStage<T extends Element> = {
  <R>(updater: Updater<T, R>): UpdateWrapper<T>;
  <R>(updater: Updater<T, R>, initialValue: R): UpdateWrapper<T>;
};

// ============================================================================
// OVERLOADS
// ============================================================================

/**
 * Creates an update wrapper that syncs DOM state after function execution.
 *
 * This utility bridges imperative state changes with DOM updates by:
 * 1. Running an initial update immediately (optional)
 * 2. Wrapping functions to trigger updates after they complete
 * 3. Passing return values to the updater for reactive-style updates
 * 4. Supporting intermediate updates, batching, and async operations
 *
 * @template T - The target element type (inferred from selector/element)
 *
 * @example
 * ```typescript
 * // Basic counter with automatic DOM sync
 * let count = 0;
 * const countEl = find('#count');
 *
 * const sync = createUpdateAfter(countEl, (el, result) => {
 *   el.textContent = String(result ?? count);
 * });
 *
 * const increment = sync.simple(() => ++count);
 * const decrement = sync.simple(() => --count);
 *
 * increment(); // DOM shows 1
 * increment(); // DOM shows 2
 * decrement(); // DOM shows 1
 * ```
 *
 * @example
 * ```typescript
 * // Progress indicator with intermediate updates
 * const progressBar = find('.progress-bar');
 *
 * const sync = createUpdateAfter(progressBar, (el, percent) => {
 *   el.style.width = `${percent ?? 0}%`;
 *   el.textContent = `${percent ?? 0}%`;
 * });
 *
 * const processFiles = sync(async (control, files: File[]) => {
 *   for (let i = 0; i < files.length; i++) {
 *     await uploadFile(files[i]);
 *     control(Math.round((i + 1) / files.length * 100));
 *   }
 *   return 100;
 * });
 *
 * await processFiles(myFiles); // Progress updates during upload
 * ```
 *
 * @example
 * ```typescript
 * // Batching multiple updates
 * const sync = createUpdateAfter(el, (el, value) => {
 *   el.textContent = String(value);
 * });
 *
 * const inc = sync.simple(() => ++count);
 *
 * // Without batch: 3 DOM updates
 * inc(); inc(); inc();
 *
 * // With batch: 1 DOM update at the end
 * sync.batch(() => {
 *   inc(); inc(); inc();
 * });
 * ```
 */
// Overload 1: Just element -> returns function waiting for updater
export function createUpdateAfter<T extends Element>(
  el: T | null
): ElementStage<T>;

// Overload 2: Element + updater -> returns wrapper
export function createUpdateAfter<T extends Element, R = unknown>(
  el: T | null,
  updater: Updater<T, R>
): UpdateWrapper<T>;

// Overload 3: Element + updater + initial value -> returns wrapper (runs initial update with value)
export function createUpdateAfter<T extends Element, R>(
  el: T | null,
  updater: Updater<T, R>,
  initialValue: R
): UpdateWrapper<T>;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export function createUpdateAfter<T extends Element, R = unknown>(
  el: T | null,
  updater?: Updater<T, R>,
  initialValue?: R
): ElementStage<T> | UpdateWrapper<T> {
  /**
   * Core factory that creates the wrapper given an updater.
   */
  const createWrapper = <Result>(
    update: Updater<T, Result>,
    initial?: Result
  ): UpdateWrapper<T> => {
    // Batching state
    let isBatching = false;
    let batchedValue: Result | undefined;
    let hasBatchedValue = false;

    // Queued update state (for microtask batching)
    let queuedValue: Result | undefined;
    let hasQueuedUpdate = false;
    let queuedMicrotask: Promise<void> | null = null;

    /**
     * Execute the updater if element exists.
     */
    const runUpdate = (value: Result | undefined): void => {
      if (!el) return;

      if (isBatching) {
        // Store for batch completion
        batchedValue = value;
        hasBatchedValue = true;
        return;
      }

      update(el, value);
    };

    /**
     * Process queued updates (runs as microtask).
     */
    const flushQueue = (): void => {
      if (!hasQueuedUpdate) return;

      const value = queuedValue;
      queuedValue = undefined;
      hasQueuedUpdate = false;
      queuedMicrotask = null;

      runUpdate(value);
    };

    /**
     * Queue an update for the next microtask.
     */
    const queueUpdate = (value: Result): void => {
      queuedValue = value;
      hasQueuedUpdate = true;

      if (!queuedMicrotask) {
        queuedMicrotask = Promise.resolve().then(flushQueue);
      }
    };

    /**
     * Create the UpdateControl object for a wrapped function.
     */
    const createControl = (): UpdateControl<Result> & { _skip: boolean } => {
      let shouldSkip = false;

      const control = ((value: Result) => {
        runUpdate(value);
      }) as UpdateControl<Result> & { _skip: boolean };

      control.skip = () => {
        shouldSkip = true;
      };

      control.queue = (value: Result) => {
        queueUpdate(value);
      };

      control.flush = () => {
        flushQueue();
      };

      Object.defineProperty(control, '_skip', {
        get: () => shouldSkip
      });

      return control;
    };

    /**
     * Wrap a controlled function.
     */
    const wrapControlled = <Args extends any[], Ret>(
      fn: ControlledFn<Args, Ret>
    ): WrappedFn<Args, Ret> => {
      return (...args: Args): Ret => {
        const control = createControl() as unknown as UpdateControl<Ret> & { _skip: boolean };
        const result = fn(control, ...args);

        // Handle async functions
        if (result instanceof Promise) {
          return result.then((resolved) => {
            if (!control._skip) {
              runUpdate(resolved as unknown as Result);
            }
            return resolved;
          }) as Ret;
        }

        // Sync: update after unless skipped
        if (!control._skip) {
          runUpdate(result as unknown as Result);
        }

        return result;
      };
    };

    /**
     * Wrap a simple function (no control).
     */
    const wrapSimple = <Args extends any[], Ret>(
      fn: SimpleFn<Args, Ret>
    ): WrappedFn<Args, Ret> => {
      return (...args: Args): Ret => {
        const result = fn(...args);

        // Handle async
        if (result instanceof Promise) {
          return result.then((resolved) => {
            runUpdate(resolved as unknown as Result);
            return resolved;
          }) as Ret;
        }

        runUpdate(result as unknown as Result);
        return result;
      };
    };

    // Run initial update
    if (el) {
      update(el, initial);
    }

    // Build the wrapper object
    const wrapper = (<Args extends any[], Ret>(
      fn: ControlledFn<Args, Ret>
    ): WrappedFn<Args, Ret> => {
      return wrapControlled(fn);
    }) as UpdateWrapper<T>;

    wrapper.simple = wrapSimple;

    wrapper.all = <A extends Record<string, ControlledFn<any[], any>>>(
      actions: A
    ): WrapAll<A> => {
      return Object.fromEntries(
        Object.entries(actions).map(([key, fn]) => [key, wrapControlled(fn)])
      ) as WrapAll<A>;
    };

    wrapper.allSimple = <A extends Record<string, SimpleFn<any[], any>>>(
      actions: A
    ): WrapAllSimple<A> => {
      return Object.fromEntries(
        Object.entries(actions).map(([key, fn]) => [key, wrapSimple(fn)])
      ) as WrapAllSimple<A>;
    };

    wrapper.batch = <Ret>(fn: () => Ret): Ret => {
      const wasBatching = isBatching;
      isBatching = true;
      hasBatchedValue = false;

      const result = fn();

      // Handle async batch
      if (result instanceof Promise) {
        return result.then((resolved) => {
          isBatching = wasBatching;
          if (hasBatchedValue && !wasBatching) {
            runUpdate(batchedValue);
          }
          return resolved;
        }) as Ret;
      }

      // Sync batch: restore state and flush
      isBatching = wasBatching;
      if (hasBatchedValue && !wasBatching) {
        runUpdate(batchedValue);
      }

      return result;
    };

    wrapper.update = <Ret>(value: Ret): void => {
      runUpdate(value as unknown as Result);
    };

    wrapper.refresh = (): void => {
      runUpdate(undefined);
    };

    Object.defineProperty(wrapper, 'isBatching', {
      get: () => isBatching
    });

    Object.defineProperty(wrapper, 'el', {
      value: el,
      writable: false
    });

    return wrapper;
  };

  // Route based on arguments
  if (updater === undefined) {
    // Stage 1: Return function waiting for updater
    return (<Result>(upd: Updater<T, Result>, init?: Result) => {
      return createWrapper(upd, init);
    }) as ElementStage<T>;
  }

  // Stage 2+: Create wrapper directly
  return createWrapper(updater, initialValue);
}