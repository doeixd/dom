/**
 * 🔹 Flexible DOM Utility Library
 *
 * All functions support:
 *  - Element-first:   fn(el)
 *  - Selector-first:  fn(".my-selector")
 *  - Curried:         fn(el)(options)
 *
 * Null-safe, type-aware, fully generic where possible.
 * Designed for modern web development.
 */

/* --------------------------------------------------------
 * Helper Types
 * -------------------------------------------------------- */

type MaybeElement = Element | null;
type MaybeParentNode = ParentNode | null;
type Selector<S extends string = string> = S;

type AttrValue = string | null | number | boolean;

type EventListenerOptions = boolean | AddEventListenerOptions;

interface TraverseOptions {
  includeSelf?: boolean;
  until?: string;
}

/* --------------------------------------------------------
 * DOM Type Guards
 * -------------------------------------------------------- */
export const is = {
  element: (node: Node | null): node is Element => !!node && node.nodeType === 1,
  tag: <T extends keyof HTMLElementTagNameMap>(tag: T) => (el: Element | null): el is HTMLElementTagNameMap[T] =>
    !!el && el.tagName.toLowerCase() === tag.toLowerCase(),
  visible: (el: Element | null): boolean => !!el && !!(el as HTMLElement).offsetParent,
  input: (el: Element | null): el is HTMLInputElement => !!el && el.tagName === "INPUT",
  button: (el: Element | null): el is HTMLButtonElement => !!el && el.tagName === "BUTTON"
};

/* --------------------------------------------------------
 * Query Helpers
 * -------------------------------------------------------- */

export function find<S extends string>(elOrSelector?: Element | null | S) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ?? null;
  }
  const el = elOrSelector ?? null;
  return (selector?: string): Element | null => {
    if (!el) return null;
    if (!selector) return el;
    return el.querySelector(selector) ?? null;
  };
}

export function findAll<S extends string>(elOrSelector?: Element | null | S) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? Array.from(el.querySelectorAll("*")) : [];
  }
  const el = elOrSelector ?? null;
  return (selector?: string): Element[] => {
    if (!el) return [];
    if (!selector) return Array.from(el.querySelectorAll("*"));
    return Array.from(el.querySelectorAll(selector));
  };
}

/* --------------------------------------------------------
 * Traversal Helpers
 * -------------------------------------------------------- */
export const Traverse = {
  parent(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.parentElement ?? null;
    }
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      if (!el?.parentElement) return null;
      if (!selector) return el.parentElement;
      return el.parentElement.matches(selector) ? el.parentElement : null;
    };
  },

  next(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.nextElementSibling ?? null;
    }
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const next = el?.nextElementSibling ?? null;
      if (!selector || !next) return next;
      return next.matches(selector) ? next : null;
    };
  },

  prev(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el?.previousElementSibling ?? null;
    }
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const prev = el?.previousElementSibling ?? null;
      if (!selector || !prev) return prev;
      return prev.matches(selector) ? prev : null;
    };
  },

  children(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el ? Array.from(el.children) : [];
    }
    const el = elOrSelector ?? null;
    return (selector?: string): Element[] => {
      if (!el) return [];
      const kids = Array.from(el.children);
      if (!selector) return kids;
      return kids.filter(c => c.matches(selector));
    };
  },

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
      if (!selector) return sibs;
      return sibs.filter(s => s.matches(selector));
    };
  },

  closest(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") {
      const el = document.querySelector(elOrSelector);
      return el ?? null;
    }
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      if (!el) return null;
      if (!selector) return el;
      return el.closest(selector) ?? null;
    };
  }
};

/* --------------------------------------------------------
 * Attribute / Property Helpers
 * -------------------------------------------------------- */
export function attr(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? attr(el) : () => null;
  }
  const el = elOrSelector ?? null;
  return (name: string, value?: AttrValue): string | null | void => {
    if (!el) return null;
    if (value === undefined) return el.getAttribute(name);
    el.setAttribute(name, String(value));
  };
}

export function prop<T extends keyof HTMLElementTagNameMap>(
  elOrSelector?: Element | null
) {
  const el = elOrSelector ?? null;
  return <K extends keyof HTMLElementTagNameMap[T]>(
    key: K,
    value?: HTMLElementTagNameMap[T][K]
  ): HTMLElementTagNameMap[T][K] | void => {
    if (!el) return undefined;
    const e = el as HTMLElementTagNameMap[T];
    if (value === undefined) return e[key];
    e[key] = value;
  };
}

/* --------------------------------------------------------
 * Class / Dataset Helpers
 * -------------------------------------------------------- */
export function classList(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? classList(el) : { add: () => {}, remove: () => {}, toggle: () => {} };
  }
  const el = elOrSelector ?? null;
  return {
    add: (...names: string[]) => { if (el) el.classList.add(...names); },
    remove: (...names: string[]) => { if (el) el.classList.remove(...names); },
    toggle: (name: string, force?: boolean) => { if (el) el.classList.toggle(name, force); }
  };
}

export function data(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? data(el) : {};
  }
  const el = elOrSelector ?? null;
  return new Proxy({}, {
    get(_, key: string) { return el?.dataset[key] ?? undefined; },
    set(_, key: string, value) { if (el) el.dataset[key] = String(value); return true; }
  });
}

/* --------------------------------------------------------
 * Event Helpers
 * -------------------------------------------------------- */
export function on(
  elOrSelector?: Element | string | null
) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return (event: string, fn: EventListener, options?: EventListenerOptions) => {
      if (el) el.addEventListener(event, fn, options);
    };
  }
  const el = elOrSelector ?? null;
  return (event: string, fn: EventListener, options?: EventListenerOptions) => {
    if (el) el.addEventListener(event, fn, options);
  };
}

/* --------------------------------------------------------
 * Viewport / Visibility Helpers
 * -------------------------------------------------------- */
export function isInViewport<S extends string = string>(
  elOrSelector?: Element | null | S
) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? inViewport(el, {}) : false;
  }
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

function inViewport(
  el: Element,
  { partial = false, threshold, root = null, margin }: {
    partial?: boolean;
    threshold?: number;
    root?: Element | null;
    margin?: string;
  }
): boolean {
  const rect = el.getBoundingClientRect();
  const container = root ? root.getBoundingClientRect() : { top:0,left:0,right:window.innerWidth,bottom:window.innerHeight };
  const margins = parseMargin(margin);
  const vp = { top: container.top + margins.top, left: container.left + margins.left,
               right: container.right - margins.right, bottom: container.bottom - margins.bottom };
  const elementArea = rect.width * rect.height;
  if (elementArea === 0) return false;
  const intersectWidth = Math.min(rect.right,vp.right) - Math.max(rect.left,vp.left);
  const intersectHeight = Math.min(rect.bottom,vp.bottom) - Math.max(rect.top,vp.top);
  if (intersectWidth <= 0 || intersectHeight <= 0) return false;
  const visibleArea = intersectWidth * intersectHeight;
  if (typeof threshold === "number") return visibleArea / elementArea >= threshold;
  if (!partial) return rect.top>=vp.top && rect.left>=vp.left && rect.right<=vp.right && rect.bottom<=vp.bottom;
  return visibleArea > 0;
}

function parseMargin(input?: string) {
  if (!input) return { top:0,left:0,right:0,bottom:0 };
  const parts = input.split(/\s+/).map(p=>parseInt(p,10)||0);
  switch(parts.length){
    case 1: return {top:parts[0],right:parts[0],bottom:parts[0],left:parts[0]};
    case 2: return {top:parts[0],right:parts[1],bottom:parts[0],left:parts[1]};
    case 3: return {top:parts[0],right:parts[1],bottom:parts[2],left:parts[1]};
    case 4: default: return {top:parts[0],right:parts[1],bottom:parts[2],left:parts[3]};
  }
}

/* --------------------------------------------------------
 * Casting / Assertion Helpers
 * -------------------------------------------------------- */
export function cast<S extends string>(selector: S) {
  return (el: Element | null) => el?.closest(selector) ?? null;
}

export function index(elOrSelector?: Element | string | null) {
  const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
  if (!el || !el.parentElement) return -1;
  return Array.from(el.parentElement.children).indexOf(el);
}

export function exists(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") return !!document.querySelector(elOrSelector);
  return !!elOrSelector;
}

export function has(el: Element | null, selector: string) {
  return !!el?.querySelector(selector);
}

export function siblings(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    if (!el?.parentElement) return [];
    return Array.from(el.parentElement.children).filter(c => c !== el);
  }
  const el = elOrSelector ?? null;
  if (!el?.parentElement) return [];
  return Array.from(el.parentElement.children).filter(c => c !== el);
}

/**
 * 🔹 Full DOM Utility Library
 * 
 * Features:
 * - Query: find, findAll, cast
 * - Traversal: parent, children, siblings, closest, next, prev, parents, closestAll, nextAll, prevAll
 * - Attributes/Properties: attr, prop, data
 * - Class: classList
 * - Events: on, off, once, delegate
 * - Viewport: isInViewport, observeInViewport, waitForInViewport, directional checks
 * - Layout: rect, offset, scrollPos, maxScroll, css
 * - DOM helpers: html, mount, unmount, portal
 * - Misc: exists, index, has, hash, batch
 * 
 * All functions support:
 * - Selector or Element input
 * - Optional currying
 * - Null-safe and type-safe
 */

type MaybeElement = Element | null;
type Selector<S extends string = string> = S;
type AttrValue = string | number | boolean | null;

interface InViewportOptions {
  partial?: boolean;
  threshold?: number;
  root?: Element | null;
  margin?: string;
}

interface TraverseOptions {
  includeSelf?: boolean;
  until?: string;
}

type EventListenerOptions = boolean | AddEventListenerOptions;

/* --------------------------------------------------------
 * Type Guards
 * -------------------------------------------------------- */
export const is = {
  element: (node: Node | null): node is Element => !!node && node.nodeType === 1,
  tag: <T extends keyof HTMLElementTagNameMap>(tag: T) => (el: Element | null): el is HTMLElementTagNameMap[T] =>
    !!el && el.tagName.toLowerCase() === tag.toLowerCase(),
  visible: (el: Element | null): boolean => !!el && !!(el as HTMLElement).offsetParent,
  input: (el: Element | null): el is HTMLInputElement => !!el && el.tagName === "INPUT",
  button: (el: Element | null): el is HTMLButtonElement => !!el && el.tagName === "BUTTON"
};

/* --------------------------------------------------------
 * Query Helpers
 * -------------------------------------------------------- */
export function find<S extends string>(elOrSelector?: Element | null | S) {
  if (typeof elOrSelector === "string") return document.querySelector(elOrSelector) ?? null;
  const el = elOrSelector ?? null;
  return (selector?: string): Element | null => !el ? null : selector ? el.querySelector(selector) : el;
}

export function findAll<S extends string>(elOrSelector?: Element | null | S) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? Array.from(el.querySelectorAll("*")) : [];
  }
  const el = elOrSelector ?? null;
  return (selector?: string): Element[] => !el ? [] : selector ? Array.from(el.querySelectorAll(selector)) : Array.from(el.querySelectorAll("*"));
}

export function cast<S extends string>(selector: S) {
  return (el: Element | null) => el?.closest(selector) ?? null;
}

/* --------------------------------------------------------
 * Traversal Helpers
 * -------------------------------------------------------- */
export const Traverse = {
  parent(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") return document.querySelector(elOrSelector)?.parentElement ?? null;
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      if (!el?.parentElement) return null;
      return !selector ? el.parentElement : el.parentElement.matches(selector) ? el.parentElement : null;
    };
  },
  next(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") return document.querySelector(elOrSelector)?.nextElementSibling ?? null;
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const next = el?.nextElementSibling ?? null;
      if (!next || !selector) return next;
      return next.matches(selector) ? next : null;
    };
  },
  prev(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") return document.querySelector(elOrSelector)?.previousElementSibling ?? null;
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => {
      const prev = el?.previousElementSibling ?? null;
      if (!prev || !selector) return prev;
      return prev.matches(selector) ? prev : null;
    };
  },
  children(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") return Array.from(document.querySelector(elOrSelector)?.children ?? []);
    const el = elOrSelector ?? null;
    return (selector?: string): Element[] => {
      if (!el) return [];
      const kids = Array.from(el.children);
      return selector ? kids.filter(c => c.matches(selector)) : kids;
    };
  },
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
  closest(elOrSelector?: Element | string | null) {
    if (typeof elOrSelector === "string") return document.querySelector(elOrSelector);
    const el = elOrSelector ?? null;
    return (selector?: string): Element | null => !el ? null : !selector ? el : el.closest(selector);
  },
  parents(elOrSelector?: Element | string | null, until?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.parentElement ?? null;
    while (current && (!until || !current.matches(until))) {
      result.push(current);
      current = current.parentElement;
    }
    return result;
  },
  nextAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.nextElementSibling ?? null;
    while (current) {
      if (!selector || current.matches(selector)) result.push(current);
      current = current.nextElementSibling;
    }
    return result;
  },
  prevAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current = el?.previousElementSibling ?? null;
    while (current) {
      if (!selector || current.matches(selector)) result.push(current);
      current = current.previousElementSibling;
    }
    return result;
  },
  closestAll(elOrSelector?: Element | string | null, selector?: string): Element[] {
    const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
    const result: Element[] = [];
    let current: Element | null = el;
    while (current) {
      if (!selector || current.matches(selector)) result.push(current);
      current = current.parentElement;
    }
    return result;
  }
};

/* --------------------------------------------------------
 * Attribute / Property / Dataset Helpers
 * -------------------------------------------------------- */
export function attr(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? attr(el) : () => null;
  }
  const el = elOrSelector ?? null;
  return (name: string, value?: AttrValue): string | null | void => {
    if (!el) return null;
    if (value === undefined) return el.getAttribute(name);
    el.setAttribute(name, String(value));
  };
}

export function prop<T extends HTMLElement = HTMLElement>(elOrSelector?: T | null) {
  const el = elOrSelector ?? null;
  return <K extends keyof T>(key: K, value?: T[K]): T[K] | void => {
    if (!el) return undefined;
    if (value === undefined) return el[key];
    el[key] = value;
  };
}

export function data(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? data(el) : {};
  }
  const el = elOrSelector ?? null;
  return new Proxy({}, {
    get(_, key: string) { return el?.dataset[key]; },
    set(_, key: string, value) { if (el) el.dataset[key] = String(value); return true; }
  });
}

/* --------------------------------------------------------
 * Class Helpers
 * -------------------------------------------------------- */
export function classList(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return el ? classList(el) : { add: () => {}, remove: () => {}, toggle: () => {} };
  }
  const el = elOrSelector ?? null;
  return {
    add: (...names: string[]) => { if (el) el.classList.add(...names); },
    remove: (...names: string[]) => { if (el) el.classList.remove(...names); },
    toggle: (name: string, force?: boolean) => { if (el) el.classList.toggle(name, force); }
  };
}

/* --------------------------------------------------------
 * Event Helpers
 * -------------------------------------------------------- */
export function on(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return (event: string, fn: EventListener, options?: EventListenerOptions) => { if (el) el.addEventListener(event, fn, options); };
  }
  const el = elOrSelector ?? null;
  return (event: string, fn: EventListener, options?: EventListenerOptions) => { if (el) el.addEventListener(event, fn, options); };
}

export function off(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector === "string") {
    const el = document.querySelector(elOrSelector);
    return (event: string, fn: EventListener, options?: EventListenerOptions) => { if (el) el.removeEventListener(event, fn, options); };
  }
  const el = elOrSelector ?? null;
  return (event: string, fn: EventListener, options?: EventListenerOptions) => { if (el) el.removeEventListener(event, fn, options); };
}

export function once(elOrSelector?: Element | string | null, event?: string) {
  const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
  return new Promise<Event>((resolve) => {
    if (!el || !event) return resolve(new Event("noop"));
    const handler = (e: Event) => { resolve(e); el.removeEventListener(event, handler); };
    el.addEventListener(event, handler);
  });
}

/* --------------------------------------------------------
 * Viewport / Visibility
 * -------------------------------------------------------- */
export function isInViewport<S extends string = string>(elOrSelector?: Element | S | null) {
  if (typeof elOrSelector === "string") return inViewport(document.querySelector(elOrSelector));
  const el = elOrSelector ?? null;
  return (options?: InViewportOptions): boolean => el ? inViewport(el, options) : false;
}

function inViewport(el: Element | null, { partial=false, threshold, root=null, margin }: InViewportOptions={}) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const container = root ? root.getBoundingClientRect() : { top:0,left:0,right:window.innerWidth,bottom:window.innerHeight };
  const margins = parseMargin(margin);
  const vp = { top: container.top+margins.top, left: container.left+margins.left, right: container.right-margins.right, bottom: container.bottom-margins.bottom };
  const area = rect.width*rect.height;
  if (area === 0) return false;
  const intersectWidth = Math.min(rect.right,vp.right)-Math.max(rect.left,vp.left);
  const intersectHeight = Math.min(rect.bottom,vp.bottom)-Math.max(rect.top,vp.top);
  if (intersectWidth<=0||intersectHeight<=0) return false;
  const visibleArea = intersectWidth*intersectHeight;
  if (typeof threshold==="number") return visibleArea/area>=threshold;
  return partial ? visibleArea>0 : rect.top>=vp.top && rect.left>=vp.left && rect.right<=vp.right && rect.bottom<=vp.bottom;
}

function parseMargin(margin?: string) {
  if (!margin) return {top:0,left:0,right:0,bottom:0};
  const parts = margin.split(/\s+/).map(v=>parseInt(v,10)||0);
  switch(parts.length){
    case 1: return {top:parts[0],left:parts[0],right:parts[0],bottom:parts[0]};
    case 2: return {top:parts[0],bottom:parts[0],left:parts[1],right:parts[1]};
    case 3: return {top:parts[0],left:parts[1],right:parts[1],bottom:parts[2]};
    case 4: default: return {top:parts[0],right:parts[1],bottom:parts[2],left:parts[3]};
  }
}

/* --------------------------------------------------------
 * Misc DOM Helpers
 * -------------------------------------------------------- */
export function exists(elOrSelector?: Element | string | null) {
  if (typeof elOrSelector==="string") return !!document.querySelector(elOrSelector);
  return !!elOrSelector;
}

export function index(elOrSelector?: Element | string | null) {
  const el = typeof elOrSelector==="string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
  if (!el || !el.parentElement) return -1;
  return Array.from(el.parentElement.children).indexOf(el);
}

export function has(el: Element | null, selector: string) {
  return !!el?.querySelector(selector);
}

export function hash(el: Element | null) {
  if (!el) return "";
  return el.tagName.toLowerCase()+"-"+(el.id||el.className||Math.random().toString(36).substr(2,5));
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
    return (keyframes: Keyframe | Keyframe[], options?: KeyframeAnimationOptions) => el ? el.animate(keyframes, options).finished : Promise.resolve();
  }
  const el = elOrSelector ?? null;
  return (keyframes: Keyframe | Keyframe[], options?: KeyframeAnimationOptions) => el ? el.animate(keyframes, options).finished : Promise.resolve();
}

/* --------------------------------------------------------
 * Portal / Mount Helpers
 * -------------------------------------------------------- */
/**
 * Insert HTML string into a container element.
 *
 * Returns a cleanup function to remove it.
 *
 * @example
 * ```ts
 * const close = portal(".modal", "<div>Hello World</div>");
 * close(); // removes it
 * ```
 */
export function portal(containerOrSelector: Element | string, html: string): () => void {
  const container = typeof containerOrSelector === "string" ? document.querySelector(containerOrSelector) : containerOrSelector;
  if (!container) return () => {};
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const children = Array.from(wrapper.children);
  children.forEach(c => container.appendChild(c));
  return () => children.forEach(c => c.remove());
}

/**
 * Mount a single element into a parent.
 *
 * Returns a cleanup function to remove it.
 */
export function mount(parentOrSelector: Element | string, child: Element): () => void {
  const parent = typeof parentOrSelector === "string" ? document.querySelector(parentOrSelector) : parentOrSelector;
  if (!parent) return () => {};
  parent.appendChild(child);
  return () => child.remove();
}

/* --------------------------------------------------------
 * DOM Ready / Lifecycle
 * -------------------------------------------------------- */
export const ready = {
  dom: () => new Promise<void>(resolve => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  }),
  micro: () => new Promise<void>(resolve => queueMicrotask(resolve)),
  raf: () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
};

/* --------------------------------------------------------
 * WaitFor Helper
 * -------------------------------------------------------- */
/**
 * Wait for a condition or an element to exist.
 *
 * @example
 * ```ts
 * await waitFor(() => document.querySelector(".loaded"));
 * await waitFor(() => myVar === true);
 * ```
 */
export async function waitFor(fn: () => boolean | unknown, timeout = 5000, interval = 50) {
  const start = performance.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      if (fn()) return resolve();
      if (performance.now() - start > timeout) return reject(new Error("waitFor timeout"));
      setTimeout(check, interval);
    };
    check();
  });
}

/* --------------------------------------------------------
 * Intersection / Viewport Observation
 * -------------------------------------------------------- */
/**
 * Observe element visibility in viewport.
 *
 * Returns an observer with disconnect method.
 *
 * @example
 * ```ts
 * const observer = observeInViewport(".item", (entry) => console.log(entry.isIntersecting));
 * observer.disconnect(); // stop observing
 * ```
 */
export function observeInViewport(elOrSelector?: Element | string | null, callback?: (entry: IntersectionObserverEntry) => void) {
  const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
  if (!el) return { disconnect: () => {} };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(callback ?? (() => {}));
  });
  observer.observe(el);
  return observer;
}

/**
 * Wait until element is in viewport.
 *
 * Options: partial visibility, threshold, root, margin
 *
 * @example
 * ```ts
 * await waitForInViewport(".box", { partial: true });
 * ```
 */
export function waitForInViewport(elOrSelector?: Element | string | null, options?: InViewportOptions) {
  const el = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector ?? null;
  if (!el) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const observer = new IntersectionObserver((entries, obs) => {
      const entry = entries[0];
      if (inViewport(entry.target as Element, options)) {
        obs.disconnect();
        resolve(true);
      }
    }, { root: options?.root ?? null, rootMargin: options?.margin ?? "0px", threshold: options?.threshold ?? (options?.partial ? 0 : 1) });
    observer.observe(el);
  });
}
