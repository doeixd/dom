/**
 * @module reactive-dom
 * 
 * Reactive DOM building with linked signals.
 * Each part of the DOM (attributes, classes, text, children) is a linked signal
 * that auto-updates from sources but can also be manually overridden.
 * 
 * @example Basic Usage
 * ```typescript
 * import { tag, text, attr, cls, style, list, mount } from '@doeixd/dom';
 * 
 * const user = signal({ name: 'Alice', role: 'admin' });
 * const items = signal(['one', 'two', 'three']);
 * 
 * const view = tag('div')(
 *   attr('data-role', () => user.value.role),
 *   cls({ active: () => user.value.role === 'admin' }),
 *   
 *   tag('h1')(
 *     text(() => `Hello, ${user.value.name}!`)
 *   ),
 *   
 *   tag('ul')(
 *     list(() => items.value, item => 
 *       tag('li')(text(item))
 *     )
 *   )
 * );
 * 
 * const { element, cleanup } = mount(view, document.body);
 * 
 * // Updates propagate automatically
 * user.value = { name: 'Bob', role: 'user' };
 * ```
 */

import { effect } from './signals';
import type { 
  Unsubscribe, 
  ReadonlySignal
} from './signals';

// ============================================
// Types
// ============================================

/** Reactive value - signal, getter, or static */
type Reactive<T> = T | ReadonlySignal<T> | (() => T);

/** Unwrap reactive to value */
type UnwrapReactive<T> = T extends ReadonlySignal<infer V> 
  ? V 
  : T extends () => infer V 
    ? V 
    : T;

/** Class map with reactive values */
type ReactiveClassMap = Record<string, Reactive<boolean>>;

/** Style map with reactive values */
type ReactiveStyleMap = Partial<Record<keyof CSSStyleDeclaration, Reactive<string | number>>>;

/** Attribute map with reactive values */
type ReactiveAttrMap = Record<string, Reactive<string | number | boolean | null>>;

/** Event handler map */
type ReactiveEventMap = Partial<{
  [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => void;
}>;

/** Part types */
type PartType = 
  | 'text' 
  | 'attr' 
  | 'prop' 
  | 'class' 
  | 'style' 
  | 'event' 
  | 'children' 
  | 'ref'
  | 'spread';

/** Base part interface */
interface Part<T = unknown> {
  readonly type: PartType;
  readonly value: T;
  readonly isOverridden: boolean;
  set(value: T): void;
  reset(): void;
  bind(element: Element): Unsubscribe;
}

/** Text part */
interface TextPart extends Part<string> {
  readonly type: 'text';
}

/** Attribute part */
interface AttrPart extends Part<string | number | boolean | null> {
  readonly type: 'attr';
  readonly name: string;
}

/** Property part */
interface PropPart<T = unknown> extends Part<T> {
  readonly type: 'prop';
  readonly name: string;
}

/** Class part */
interface ClassPart extends Part<Record<string, boolean>> {
  readonly type: 'class';
  toggle(name: string, force?: boolean): void;
  add(...names: string[]): void;
  remove(...names: string[]): void;
}

/** Style part */
interface StylePart extends Part<Partial<CSSStyleDeclaration>> {
  readonly type: 'style';
  setProperty(name: string, value: string): void;
}

/** Event part */
interface EventPart<E extends Event = Event> extends Part<((e: E) => void) | null> {
  readonly type: 'event';
  readonly eventName: string;
}

/** Children part */
interface ChildrenPart extends Part<ViewNode[]> {
  readonly type: 'children';
  append(...nodes: ViewNode[]): void;
  prepend(...nodes: ViewNode[]): void;
  clear(): void;
}

/** Ref callback */
type RefCallback<T extends Element = Element> = (element: T | null) => void;

/** Ref part */
interface RefPart<T extends Element = Element> extends Part<RefCallback<T> | null> {
  readonly type: 'ref';
  readonly current: T | null;
}

/** View node - element, text, or fragment */
type ViewNode = 
  | ViewElement 
  | ViewText 
  | ViewFragment 
  | ViewPortal
  | ViewConditional
  | ViewList
  | string 
  | number 
  | null 
  | undefined;

/** View element definition */
interface ViewElement {
  readonly nodeType: 'element';
  readonly tag: string;
  readonly parts: Part[];
  readonly children: ViewNode[];
  readonly key?: string | number;
}

/** View text definition */
interface ViewText {
  readonly nodeType: 'text';
  readonly content: Reactive<string>;
}

/** View fragment (multiple nodes) */
interface ViewFragment {
  readonly nodeType: 'fragment';
  readonly children: ViewNode[];
}

/** View portal (render elsewhere) */
interface ViewPortal {
  readonly nodeType: 'portal';
  readonly target: Element | string;
  readonly children: ViewNode[];
}

/** Conditional view */
interface ViewConditional {
  readonly nodeType: 'conditional';
  readonly condition: Reactive<boolean>;
  readonly then: ViewNode;
  readonly else?: ViewNode;
}

/** List view */
interface ViewList<T = unknown> {
  readonly nodeType: 'list';
  readonly items: Reactive<T[]>;
  readonly render: (item: T, index: number) => ViewNode;
  readonly key?: (item: T, index: number) => string | number;
}

/** Mounted view result */
interface MountedView {
  readonly element: Element | DocumentFragment;
  readonly cleanup: Unsubscribe;
  readonly update: () => void;
}


// ============================================
// Helpers
// ============================================

/**
 * Unwrap a reactive value to its current value
 */
function unwrap<T>(reactive: Reactive<T>): T {
  if (reactive === null || reactive === undefined) {
    return reactive as T;
  }
  if (typeof reactive === 'object' && 'value' in reactive) {
    return (reactive as ReadonlySignal<T>).value;
  }
  if (typeof reactive === 'function') {
    return (reactive as () => T)();
  }
  return reactive;
}

/**
 * Check if value is reactive
 */
function isReactive<T>(value: Reactive<T>): value is ReadonlySignal<T> | (() => T) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && 'value' in value) return true;
  if (typeof value === 'function') return true;
  return false;
}

function removeNode(node: Node): void {
  node.parentNode?.removeChild(node);
}

/**
 * Create effect that tracks reactive value
 */
function createReactiveEffect<T>(
  reactive: Reactive<T>,
  callback: (value: T) => void
): Unsubscribe {
  if (!isReactive(reactive)) {
    callback(reactive);
    return () => {};
  }
  
  return effect(() => {
    callback(unwrap(reactive));
  });
}


// ============================================
// Part Implementations
// ============================================

const PART_BRAND = Symbol('part');

/**
 * Create a text part
 */
class TextPartImpl implements TextPart {
  readonly [PART_BRAND] = true;
  readonly type = 'text' as const;
  
  #source: Reactive<string>;
  #value: string;
  #isOverridden = false;
  #node: Text | null = null;
  #cleanup: Unsubscribe | null = null;

  constructor(source: Reactive<string>) {
    this.#source = source;
    this.#value = unwrap(source);
  }

  get value(): string {
    return this.#value;
  }

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  set(value: string): void {
    this.#value = value;
    this.#isOverridden = true;
    if (this.#node) {
      this.#node.textContent = value;
    }
  }

  reset(): void {
    this.#isOverridden = false;
    this.#value = unwrap(this.#source);
    if (this.#node) {
      this.#node.textContent = this.#value;
    }
  }

  bind(element: Element): Unsubscribe {
    this.#node = document.createTextNode(this.#value);
    element.appendChild(this.#node);
    
    if (isReactive(this.#source)) {
      this.#cleanup = createReactiveEffect(this.#source, (value) => {
        if (!this.#isOverridden) {
          this.#value = value;
          if (this.#node) {
            this.#node.textContent = value;
          }
        }
      });
    }
    
    return () => {
      this.#cleanup?.();
      this.#node?.remove();
      this.#node = null;
    };
  }

  createNode(): Text {
    return document.createTextNode(this.#value);
  }
}


/**
 * Create an attribute part
 */
class AttrPartImpl implements AttrPart {
  readonly [PART_BRAND] = true;
  readonly type = 'attr' as const;
  readonly name: string;
  
  #source: Reactive<string | number | boolean | null>;
  #value: string | number | boolean | null;
  #isOverridden = false;
  #element: Element | null = null;
  #cleanup: Unsubscribe | null = null;

  constructor(name: string, source: Reactive<string | number | boolean | null>) {
    this.name = name;
    this.#source = source;
    this.#value = unwrap(source);
  }

  get value(): string | number | boolean | null {
    return this.#value;
  }

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  set(value: string | number | boolean | null): void {
    this.#value = value;
    this.#isOverridden = true;
    this.#apply();
  }

  reset(): void {
    this.#isOverridden = false;
    this.#value = unwrap(this.#source);
    this.#apply();
  }

  bind(element: Element): Unsubscribe {
    this.#element = element;
    this.#apply();
    
    if (isReactive(this.#source)) {
      this.#cleanup = createReactiveEffect(this.#source, (value) => {
        if (!this.#isOverridden) {
          this.#value = value;
          this.#apply();
        }
      });
    }
    
    return () => {
      this.#cleanup?.();
      this.#element = null;
    };
  }

  #apply(): void {
    if (!this.#element) return;
    
    if (this.#value === null || this.#value === false) {
      this.#element.removeAttribute(this.name);
    } else if (this.#value === true) {
      this.#element.setAttribute(this.name, '');
    } else {
      this.#element.setAttribute(this.name, String(this.#value));
    }
  }
}


/**
 * Create a property part
 */
class PropPartImpl<T> implements PropPart<T> {
  readonly [PART_BRAND] = true;
  readonly type = 'prop' as const;
  readonly name: string;
  
  #source: Reactive<T>;
  #value: T;
  #isOverridden = false;
  #element: Element | null = null;
  #cleanup: Unsubscribe | null = null;

  constructor(name: string, source: Reactive<T>) {
    this.name = name;
    this.#source = source;
    this.#value = unwrap(source);
  }

  get value(): T {
    return this.#value;
  }

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  set(value: T): void {
    this.#value = value;
    this.#isOverridden = true;
    this.#apply();
  }

  reset(): void {
    this.#isOverridden = false;
    this.#value = unwrap(this.#source);
    this.#apply();
  }

  bind(element: Element): Unsubscribe {
    this.#element = element;
    this.#apply();
    
    if (isReactive(this.#source)) {
      this.#cleanup = createReactiveEffect(this.#source, (value) => {
        if (!this.#isOverridden) {
          this.#value = value;
          this.#apply();
        }
      });
    }
    
    return () => {
      this.#cleanup?.();
      this.#element = null;
    };
  }

  #apply(): void {
    if (!this.#element) return;
    (this.#element as any)[this.name] = this.#value;
  }
}


/**
 * Create a class part
 */
class ClassPartImpl implements ClassPart {
  readonly [PART_BRAND] = true;
  readonly type = 'class' as const;
  
  #sources: Map<string, Reactive<boolean>> = new Map();
  #values: Map<string, boolean> = new Map();
  #overrides: Set<string> = new Set();
  #element: Element | null = null;
  #cleanups: Unsubscribe[] = [];

  constructor(classes: ReactiveClassMap | Reactive<string>) {
    if (typeof classes === 'string' || typeof classes === 'function' || (typeof classes === 'object' && 'value' in classes)) {
      // Single class string
      const source = classes as Reactive<string>;
      const value = unwrap(source);
      value.split(/\s+/).filter(Boolean).forEach(name => {
        this.#sources.set(name, true);
        this.#values.set(name, true);
      });
    } else {
      // Class map
      for (const [name, source] of Object.entries(classes)) {
        this.#sources.set(name, source);
        this.#values.set(name, unwrap(source));
      }
    }
  }

  get value(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name, value] of this.#values) {
      result[name] = value;
    }
    return result;
  }

  get isOverridden(): boolean {
    return this.#overrides.size > 0;
  }

  set(value: Record<string, boolean>): void {
    for (const [name, enabled] of Object.entries(value)) {
      this.#values.set(name, enabled);
      this.#overrides.add(name);
      this.#applyClass(name, enabled);
    }
  }

  toggle(name: string, force?: boolean): void {
    const current = this.#values.get(name) ?? false;
    const next = force ?? !current;
    this.#values.set(name, next);
    this.#overrides.add(name);
    this.#applyClass(name, next);
  }

  add(...names: string[]): void {
    for (const name of names) {
      this.#values.set(name, true);
      this.#overrides.add(name);
      this.#applyClass(name, true);
    }
  }

  remove(...names: string[]): void {
    for (const name of names) {
      this.#values.set(name, false);
      this.#overrides.add(name);
      this.#applyClass(name, false);
    }
  }

  reset(): void {
    for (const name of this.#overrides) {
      const source = this.#sources.get(name);
      if (source !== undefined) {
        const value = unwrap(source);
        this.#values.set(name, value);
        this.#applyClass(name, value);
      }
    }
    this.#overrides.clear();
  }

  bind(element: Element): Unsubscribe {
    this.#element = element;
    
    // Apply initial values
    for (const [name, value] of this.#values) {
      this.#applyClass(name, value);
    }
    
    // Set up reactive effects
    for (const [name, source] of this.#sources) {
      if (isReactive(source)) {
        const cleanup = createReactiveEffect(source, (value) => {
          if (!this.#overrides.has(name)) {
            this.#values.set(name, value);
            this.#applyClass(name, value);
          }
        });
        this.#cleanups.push(cleanup);
      }
    }
    
    return () => {
      this.#cleanups.forEach(fn => fn());
      this.#cleanups = [];
      this.#element = null;
    };
  }

  #applyClass(name: string, enabled: boolean): void {
    if (!this.#element) return;
    this.#element.classList.toggle(name, enabled);
  }
}


/**
 * Create a style part
 */
class StylePartImpl implements StylePart {
  readonly [PART_BRAND] = true;
  readonly type = 'style' as const;
  
  #sources: Map<string, Reactive<string | number>> = new Map();
  #values: Map<string, string> = new Map();
  #overrides: Set<string> = new Set();
  #element: HTMLElement | null = null;
  #cleanups: Unsubscribe[] = [];

  constructor(styles: ReactiveStyleMap) {
    for (const [prop, source] of Object.entries(styles)) {
      if (source !== undefined) {
        this.#sources.set(prop, source);
        const value = unwrap(source);
        this.#values.set(prop, String(value));
      }
    }
  }

  get value(): Partial<CSSStyleDeclaration> {
    const result: Partial<CSSStyleDeclaration> = {};
    for (const [prop, value] of this.#values) {
      (result as any)[prop] = value;
    }
    return result;
  }

  get isOverridden(): boolean {
    return this.#overrides.size > 0;
  }

  set(value: Partial<CSSStyleDeclaration>): void {
    for (const [prop, val] of Object.entries(value)) {
      if (val !== undefined) {
        this.#values.set(prop, String(val));
        this.#overrides.add(prop);
        this.#applyStyle(prop, String(val));
      }
    }
  }

  setProperty(name: string, value: string): void {
    this.#values.set(name, value);
    this.#overrides.add(name);
    this.#applyStyle(name, value);
  }

  reset(): void {
    for (const name of this.#overrides) {
      const source = this.#sources.get(name);
      if (source !== undefined) {
        const value = String(unwrap(source));
        this.#values.set(name, value);
        this.#applyStyle(name, value);
      }
    }
    this.#overrides.clear();
  }

  bind(element: Element): Unsubscribe {
    this.#element = element as HTMLElement;
    
    // Apply initial values
    for (const [prop, value] of this.#values) {
      this.#applyStyle(prop, value);
    }
    
    // Set up reactive effects
    for (const [prop, source] of this.#sources) {
      if (isReactive(source)) {
        const cleanup = createReactiveEffect(source, (value) => {
          if (!this.#overrides.has(prop)) {
            const strValue = String(value);
            this.#values.set(prop, strValue);
            this.#applyStyle(prop, strValue);
          }
        });
        this.#cleanups.push(cleanup);
      }
    }
    
    return () => {
      this.#cleanups.forEach(fn => fn());
      this.#cleanups = [];
      this.#element = null;
    };
  }

  #applyStyle(prop: string, value: string): void {
    if (!this.#element) return;
    
    // Handle CSS custom properties
    if (prop.startsWith('--')) {
      this.#element.style.setProperty(prop, value);
    } else {
      (this.#element.style as any)[prop] = value;
    }
  }
}


/**
 * Create an event part
 */
class EventPartImpl<E extends Event = Event> implements EventPart<E> {
  readonly [PART_BRAND] = true;
  readonly type = 'event' as const;
  readonly eventName: string;
  
  #handler: ((e: E) => void) | null;
  #isOverridden = false;
  #element: Element | null = null;
  #boundHandler: ((e: Event) => void) | null = null;

  constructor(eventName: string, handler: ((e: E) => void) | null) {
    this.eventName = eventName;
    this.#handler = handler;
  }

  get value(): ((e: E) => void) | null {
    return this.#handler;
  }

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  set(handler: ((e: E) => void) | null): void {
    this.#removeListener();
    this.#handler = handler;
    this.#isOverridden = true;
    this.#addListener();
  }

  reset(): void {
    this.#isOverridden = false;
  }

  bind(element: Element): Unsubscribe {
    this.#element = element;
    this.#addListener();
    
    return () => {
      this.#removeListener();
      this.#element = null;
    };
  }

  #addListener(): void {
    if (!this.#element || !this.#handler) return;
    
    this.#boundHandler = (e: Event) => this.#handler?.(e as E);
    this.#element.addEventListener(this.eventName, this.#boundHandler);
  }

  #removeListener(): void {
    if (!this.#element || !this.#boundHandler) return;
    
    this.#element.removeEventListener(this.eventName, this.#boundHandler);
    this.#boundHandler = null;
  }
}


/**
 * Create a ref part
 */
class RefPartImpl<T extends Element = Element> implements RefPart<T> {
  readonly [PART_BRAND] = true;
  readonly type = 'ref' as const;
  
  #callback: RefCallback<T> | null;
  #current: T | null = null;
  #isOverridden = false;

  constructor(callback: RefCallback<T> | null) {
    this.#callback = callback;
  }

  get value(): RefCallback<T> | null {
    return this.#callback;
  }

  get current(): T | null {
    return this.#current;
  }

  get isOverridden(): boolean {
    return this.#isOverridden;
  }

  set(callback: RefCallback<T> | null): void {
    this.#callback = callback;
    this.#isOverridden = true;
    if (this.#current) {
      this.#callback?.(this.#current);
    }
  }

  reset(): void {
    this.#isOverridden = false;
  }

  bind(element: Element): Unsubscribe {
    this.#current = element as T;
    this.#callback?.(this.#current);
    
    return () => {
      this.#callback?.(null);
      this.#current = null;
    };
  }
}


// ============================================
// View Node Rendering
// ============================================

/**
 * Render a view node to DOM
 */
function renderNode(node: ViewNode, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  if (node === null || node === undefined) {
    return cleanups;
  }
  
  if (typeof node === 'string' || typeof node === 'number') {
    parent.appendChild(document.createTextNode(String(node)));
    return cleanups;
  }
  
  if ('nodeType' in node) {
    switch (node.nodeType) {
      case 'element':
        cleanups.push(...renderElement(node, parent));
        break;
      case 'text':
        cleanups.push(...renderText(node, parent));
        break;
      case 'fragment':
        cleanups.push(...renderFragment(node, parent));
        break;
      case 'portal':
        cleanups.push(...renderPortal(node));
        break;
      case 'conditional':
        cleanups.push(...renderConditional(node, parent));
        break;
      case 'list':
        cleanups.push(...renderList(node, parent));
        break;
    }
  }
  
  return cleanups;
}

/**
 * Render a view element
 */
function renderElement(view: ViewElement, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  // Create element
  const element = view.tag.includes('-')
    ? document.createElement(view.tag)
    : ['svg', 'path', 'circle', 'rect', 'g', 'use', 'defs', 'symbol', 'line', 'polyline', 'polygon', 'text', 'tspan'].includes(view.tag)
      ? document.createElementNS('http://www.w3.org/2000/svg', view.tag)
      : document.createElement(view.tag);
  
  // Bind parts
  for (const part of view.parts) {
    cleanups.push(part.bind(element));
  }
  
  // Render children
  for (const child of view.children) {
    cleanups.push(...renderNode(child, element));
  }
  
  parent.appendChild(element);
  
  return cleanups;
}

/**
 * Render a text node
 */
function renderText(view: ViewText, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  const textNode = document.createTextNode(unwrap(view.content));
  parent.appendChild(textNode);
  
  if (isReactive(view.content)) {
    cleanups.push(createReactiveEffect(view.content, (value) => {
      textNode.textContent = value;
    }));
  }
  
  return cleanups;
}

/**
 * Render a fragment
 */
function renderFragment(view: ViewFragment, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  for (const child of view.children) {
    cleanups.push(...renderNode(child, parent));
  }
  
  return cleanups;
}

/**
 * Render a portal
 */
function renderPortal(view: ViewPortal): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  const target = typeof view.target === 'string'
    ? document.querySelector(view.target)
    : view.target;
  
  if (!target) {
    console.warn(`Portal target not found: ${view.target}`);
    return cleanups;
  }
  
  const fragment = document.createDocumentFragment();
  for (const child of view.children) {
    cleanups.push(...renderNode(child, fragment));
  }
  
  const nodes = Array.from(fragment.childNodes);
  target.appendChild(fragment);
  
  cleanups.push(() => {
    nodes.forEach(removeNode);
  });
  
  return cleanups;
}

/**
 * Render a conditional
 */
function renderConditional(view: ViewConditional, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  // Placeholder comment for positioning
  const marker = document.createComment('conditional');
  parent.appendChild(marker);
  
  let currentNodes: Node[] = [];
  let currentCleanups: Unsubscribe[] = [];
  
  const update = (condition: boolean) => {
    // Cleanup previous
    currentCleanups.forEach(fn => fn());
    currentCleanups = [];
    currentNodes.forEach(removeNode);
    currentNodes = [];
    
    // Render new
    const branch = condition ? view.then : view.else;
    if (branch) {
      const fragment = document.createDocumentFragment();
      currentCleanups = renderNode(branch, fragment);
      currentNodes = Array.from(fragment.childNodes);
      marker.after(...currentNodes);
    }
  };
  
  // Initial render
  update(unwrap(view.condition));
  
  // Set up reactive effect
  if (isReactive(view.condition)) {
    cleanups.push(createReactiveEffect(view.condition, update));
  }
  
  cleanups.push(() => {
    currentCleanups.forEach(fn => fn());
    currentNodes.forEach(removeNode);
    removeNode(marker);
  });
  
  return cleanups;
}

/**
 * Render a list
 */
function renderList<T>(view: ViewList<T>, parent: Element | DocumentFragment): Unsubscribe[] {
  const cleanups: Unsubscribe[] = [];
  
  // Placeholder markers
  const startMarker = document.createComment('list-start');
  const endMarker = document.createComment('list-end');
  parent.appendChild(startMarker);
  parent.appendChild(endMarker);
  
  // Track rendered items
  const renderedItems = new Map<string | number, { nodes: Node[]; cleanups: Unsubscribe[] }>();
  
  const getKey = (item: T, index: number): string | number => {
    if (view.key) {
      return view.key(item, index);
    }
    return index;
  };
  
  const update = (items: T[]) => {
    const newKeys = items.map(getKey);
    const newKeySet = new Set(newKeys);
    
    // Remove items no longer present
    for (const [key, { nodes, cleanups }] of renderedItems) {
      if (!newKeySet.has(key)) {
        cleanups.forEach(fn => fn());
        nodes.forEach(removeNode);
        renderedItems.delete(key);
      }
    }
    
    // Create/reorder items
    let insertBefore: Node = endMarker;
    
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const key = newKeys[i];
      
      let entry = renderedItems.get(key);
      
      if (!entry) {
        // Create new item
        const fragment = document.createDocumentFragment();
        const itemCleanups = renderNode(view.render(item, i), fragment);
        const nodes = Array.from(fragment.childNodes);
        entry = { nodes, cleanups: itemCleanups };
        renderedItems.set(key, entry);
      }
      
      // Insert/move nodes
      for (const node of entry.nodes) {
        if (node.nextSibling !== insertBefore) {
          startMarker.parentNode?.insertBefore(node, insertBefore);
        }
        insertBefore = node;
      }
    }
    
  };
  
  // Initial render
  update(unwrap(view.items));
  
  // Set up reactive effect
  if (isReactive(view.items)) {
    cleanups.push(createReactiveEffect(view.items, update));
  }
  
  cleanups.push(() => {
    for (const { nodes, cleanups } of renderedItems.values()) {
      cleanups.forEach(fn => fn());
      nodes.forEach(removeNode);
    }
    renderedItems.clear();
    removeNode(startMarker);
    removeNode(endMarker);
  });
  
  return cleanups;
}


// ============================================
// Public API - Part Factories
// ============================================

/**
 * Create a reactive text part.
 * 
 * @example
 * ```typescript
 * const name = signal('Alice');
 * 
 * const view = tag('h1')(
 *   text(() => `Hello, ${name.value}!`)
 * );
 * 
 * // Later: override manually
 * view.parts[0].set('Custom greeting');
 * 
 * // Reset to reactive source
 * view.parts[0].reset();
 * ```
 */
export function text(content: Reactive<string>): TextPart {
  return new TextPartImpl(content);
}

/**
 * Create a reactive attribute part.
 * 
 * @example
 * ```typescript
 * const id = signal('user-1');
 * const disabled = signal(false);
 * 
 * const view = tag('button')(
 *   attr('id', () => id.value),
 *   attr('disabled', () => disabled.value),
 *   attr('aria-label', 'Click me')
 * );
 * ```
 */
export function attr(name: string, value: Reactive<string | number | boolean | null>): AttrPart {
  return new AttrPartImpl(name, value);
}

/**
 * Create reactive attributes from a map.
 * 
 * @example
 * ```typescript
 * const view = tag('input')(
 *   attrs({
 *     type: 'text',
 *     placeholder: () => placeholder.value,
 *     disabled: () => isLoading.value
 *   })
 * );
 * ```
 */
export function attrs(map: ReactiveAttrMap): AttrPart[] {
  return Object.entries(map).map(([name, value]) => attr(name, value));
}

/**
 * Create a reactive property part.
 * 
 * @example
 * ```typescript
 * const checked = signal(false);
 * 
 * const view = tag('input')(
 *   attr('type', 'checkbox'),
 *   prop('checked', () => checked.value)
 * );
 * ```
 */
export function prop<T>(name: string, value: Reactive<T>): PropPart<T> {
  return new PropPartImpl(name, value);
}

/**
 * Create a reactive class part.
 * 
 * @example
 * ```typescript
 * const isActive = signal(true);
 * const isLoading = signal(false);
 * 
 * // Object syntax
 * const view = tag('div')(
 *   cls({
 *     active: () => isActive.value,
 *     loading: () => isLoading.value,
 *     'btn-primary': true
 *   })
 * );
 * 
 * // Or static string
 * const view2 = tag('div')(cls('btn btn-primary'));
 * ```
 */
export function cls(classes: ReactiveClassMap | Reactive<string>): ClassPart {
  return new ClassPartImpl(classes);
}

/**
 * Create a reactive style part.
 * 
 * @example
 * ```typescript
 * const color = signal('red');
 * const size = signal(16);
 * 
 * const view = tag('div')(
 *   style({
 *     color: () => color.value,
 *     fontSize: () => `${size.value}px`,
 *     '--custom-prop': () => theme.value.primary
 *   })
 * );
 * ```
 */
export function style(styles: ReactiveStyleMap): StylePart {
  return new StylePartImpl(styles);
}

/**
 * Create an event handler part.
 * 
 * @example
 * ```typescript
 * const view = tag('button')(
 *   on('click', (e) => console.log('Clicked!', e)),
 *   on('mouseenter', () => setHovered(true)),
 *   text('Click me')
 * );
 * ```
 */
export function on<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void
): EventPart<HTMLElementEventMap[K]>;
export function on<E extends Event = Event>(
  eventName: string,
  handler: (event: E) => void
): EventPart<E>;
export function on(eventName: string, handler: (event: Event) => void): EventPart {
  return new EventPartImpl(eventName, handler);
}

/**
 * Create multiple event handlers from a map.
 * 
 * @example
 * ```typescript
 * const view = tag('input')(
 *   events({
 *     focus: () => setFocused(true),
 *     blur: () => setFocused(false),
 *     input: (e) => setValue(e.target.value)
 *   })
 * );
 * ```
 */
export function events(map: ReactiveEventMap): EventPart[] {
  return Object.entries(map)
    .filter(([_, handler]) => handler !== undefined)
    .map(([name, handler]) => on(name, handler as (e: Event) => void));
}

/**
 * Create a ref callback part.
 * 
 * @example
 * ```typescript
 * let inputEl: HTMLInputElement | null = null;
 * 
 * const view = tag('input')(
 *   ref((el) => { inputEl = el; }),
 *   attr('type', 'text')
 * );
 * 
 * // After mount: inputEl is the DOM element
 * inputEl?.focus();
 * ```
 */
export function ref<T extends Element = Element>(callback: RefCallback<T>): RefPart<T> {
  return new RefPartImpl(callback);
}


// ============================================
// Public API - View Builders
// ============================================

/**
 * Create a view element.
 * 
 * @example
 * ```typescript
 * const view = tag('div')(
 *   cls({ container: true }),
 *   attr('id', 'app'),
 *   
 *   tag('h1')(text('Hello World')),
 *   tag('p')(text(() => description.value))
 * );
 * ```
 */
export function tag(tagName: string): (...parts: (Part | ViewNode)[]) => ViewElement {
  return (...parts) => {
    const partsList: Part[] = [];
    const children: ViewNode[] = [];
    
    for (const part of parts) {
      if (part && typeof part === 'object' && PART_BRAND in part) {
        partsList.push(part as Part);
      } else {
        children.push(part as ViewNode);
      }
    }
    
    return {
      nodeType: 'element',
      tag: tagName,
      parts: partsList,
      children
    };
  };
}

/**
 * Create common HTML tags.
 * 
 * @example
 * ```typescript
 * const { div, h1, p, span, button, input, ul, li } = tags;
 * 
 * const view = div(
 *   cls({ container: true }),
 *   h1(text('Title')),
 *   p(text('Content'))
 * );
 * ```
 */
export const tags = new Proxy({} as Record<string, ReturnType<typeof tag>>, {
  get(_, tagName: string) {
    return tag(tagName);
  }
});

/**
 * Create a text node.
 * 
 * @example
 * ```typescript
 * const view = tag('p')(
 *   textNode(() => `Count: ${count.value}`)
 * );
 * ```
 */
export function textNode(content: Reactive<string>): ViewText {
  return {
    nodeType: 'text',
    content
  };
}

/**
 * Create a fragment (multiple nodes without wrapper).
 * 
 * @example
 * ```typescript
 * const view = fragment(
 *   tag('h1')(text('Title')),
 *   tag('p')(text('Paragraph 1')),
 *   tag('p')(text('Paragraph 2'))
 * );
 * ```
 */
export function fragment(...children: ViewNode[]): ViewFragment {
  return {
    nodeType: 'fragment',
    children
  };
}

/**
 * Create a portal (render children into different DOM location).
 * 
 * @example
 * ```typescript
 * const modal = portal(document.body,
 *   tag('div')(
 *     cls({ modal: true }),
 *     text('Modal content')
 *   )
 * );
 * ```
 */
export function portal(target: Element | string, ...children: ViewNode[]): ViewPortal {
  return {
    nodeType: 'portal',
    target,
    children
  };
}

/**
 * Create a conditional view.
 * 
 * @example
 * ```typescript
 * const view = when(
 *   () => isLoggedIn.value,
 *   tag('div')(text('Welcome!')),
 *   tag('div')(text('Please log in'))
 * );
 * ```
 */
export function when(
  condition: Reactive<boolean>,
  then: ViewNode,
  otherwise?: ViewNode
): ViewConditional {
  return {
    nodeType: 'conditional',
    condition,
    then,
    else: otherwise
  };
}

/**
 * Create a reactive list.
 * 
 * @example
 * ```typescript
 * const items = signal(['Apple', 'Banana', 'Cherry']);
 * 
 * const view = list(
 *   () => items.value,
 *   (item, index) => tag('li')(
 *     text(`${index + 1}. ${item}`)
 *   ),
 *   (item) => item // key function
 * );
 * ```
 */
export function list<T>(
  items: Reactive<T[]>,
  render: (item: T, index: number) => ViewNode,
  key?: (item: T, index: number) => string | number
): ViewList<T> {
  return {
    nodeType: 'list',
    items,
    render,
    key
  };
}

/**
 * Create a keyed view element.
 * 
 * @example
 * ```typescript
 * const view = list(
 *   () => todos.value,
 *   (todo) => keyed(todo.id,
 *     tag('li')(text(todo.text))
 *   )
 * );
 * ```
 */
export function keyed(key: string | number, node: ViewElement): ViewElement {
  return {
    ...node,
    key
  };
}


// ============================================
// Public API - Mount/Render
// ============================================

/**
 * Mount a view to a DOM element.
 * 
 * @example
 * ```typescript
 * const name = signal('World');
 * 
 * const view = tag('div')(
 *   tag('h1')(text(() => `Hello, ${name.value}!`)),
 *   tag('button')(
 *     on('click', () => name.value = 'Universe'),
 *     text('Change')
 *   )
 * );
 * 
 * const { cleanup } = mount(view, document.getElementById('app')!);
 * 
 * // Later: cleanup removes everything
 * cleanup();
 * ```
 */
export function mount(view: ViewNode, container: Element | string): MountedView {
  const target = typeof container === 'string'
    ? document.querySelector(container)
    : container;
  
  if (!target) {
    throw new Error(`Mount target not found: ${container}`);
  }
  
  const fragment = document.createDocumentFragment();
  const cleanups = renderNode(view, fragment);
  
  const element = fragment.childNodes.length === 1
    ? fragment.firstChild as Element
    : fragment;
  
  target.appendChild(fragment);
  
  return {
    element: element as Element | DocumentFragment,
    cleanup: () => {
      cleanups.forEach(fn => fn());
    },
    update: () => {
      // Force re-render - mainly for debugging
    }
  };
}

/**
 * Render a view to a DocumentFragment (doesn't mount).
 * 
 * @example
 * ```typescript
 * const { fragment, cleanup } = render(view);
 * document.body.appendChild(fragment);
 * ```
 */
export function render(view: ViewNode): { fragment: DocumentFragment; cleanup: Unsubscribe } {
  const fragment = document.createDocumentFragment();
  const cleanups = renderNode(view, fragment);
  
  return {
    fragment,
    cleanup: () => cleanups.forEach(fn => fn())
  };
}


// ============================================
// Utility: Tagged Template
// ============================================

/**
 * Create a view from a tagged template literal.
 * Interpolations become reactive text nodes.
 * 
 * @example
 * ```typescript
 * const name = signal('Alice');
 * const count = signal(0);
 * 
 * const view = html`
 *   <div class="greeting">
 *     <h1>Hello, ${() => name.value}!</h1>
 *     <p>Count: ${() => count.value}</p>
 *     <button onclick=${() => count.value++}>
 *       Increment
 *     </button>
 *   </div>
 * `;
 * 
 * mount(view, '#app');
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: (Reactive<string | number> | ((e: Event) => void))[]
): ViewNode {
  // Simple implementation - parse HTML and insert reactive parts
  let htmlStr = strings[0];
  const parts: { index: number; value: Reactive<string | number> | ((e: Event) => void) }[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const marker = `__REACTIVE_${i}__`;
    htmlStr += marker + strings[i + 1];
    parts.push({ index: i, value });
  }
  
  // Parse HTML
  const template = document.createElement('template');
  template.innerHTML = htmlStr.trim();
  
  const processNode = (node: Node): ViewNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const match = text.match(/__REACTIVE_(\d+)__/);
      
      if (match) {
        const index = parseInt(match[1], 10);
        const part = parts.find(p => p.index === index);
        if (part && typeof part.value !== 'function') {
          return textNode(part.value as Reactive<string>);
        }
      }
      
      return text;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const partsList: Part[] = [];
      const children: ViewNode[] = [];
      
      // Process attributes
      for (const attribute of Array.from(el.attributes)) {
        const match = attribute.value.match(/__REACTIVE_(\d+)__/);
        
        if (match) {
          const index = parseInt(match[1], 10);
          const part = parts.find(p => p.index === index);
          
          if (part) {
            if (attribute.name.startsWith('on')) {
              // Event handler
              const eventName = attribute.name.slice(2);
              partsList.push(on(eventName, part.value as (e: Event) => void));
            } else {
              // Reactive attribute
              partsList.push(attr(attribute.name, part.value as Reactive<string>));
            }
          }
        } else {
          partsList.push(attr(attribute.name, attribute.value));
        }
      }
      
      // Process children
      for (const child of Array.from(el.childNodes)) {
        const processed = processNode(child);
        if (processed !== null && processed !== undefined && processed !== '') {
          children.push(processed);
        }
      }
      
      return {
        nodeType: 'element',
        tag: el.tagName.toLowerCase(),
        parts: partsList,
        children
      };
    }
    
    return null;
  };
  
  const content = template.content;
  
  if (content.childNodes.length === 1) {
    return processNode(content.firstChild!);
  }
  
  return {
    nodeType: 'fragment',
    children: Array.from(content.childNodes).map(processNode).filter(Boolean) as ViewNode[]
  };
}


// ============================================
// Type Exports
// ============================================

export type {
  Reactive,
  UnwrapReactive,
  ReactiveClassMap,
  ReactiveStyleMap,
  ReactiveAttrMap,
  ReactiveEventMap,
  PartType,
  Part,
  TextPart,
  AttrPart,
  PropPart,
  ClassPart,
  StylePart,
  EventPart,
  ChildrenPart,
  RefPart,
  RefCallback,
  ViewNode,
  ViewElement,
  ViewText,
  ViewFragment,
  ViewPortal,
  ViewConditional,
  ViewList,
  MountedView,
};