"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/signals/index.ts
var signals_exports = {};
__export(signals_exports, {
  ARRAY_BRAND: () => ARRAY_BRAND,
  Await: () => Await,
  Dynamic: () => Dynamic,
  Entries: () => Entries,
  ErrorBoundary: () => ErrorBoundary,
  For: () => For,
  Index: () => Index,
  Keys: () => Keys,
  LINKED_BRAND: () => LINKED_BRAND,
  Match: () => Match,
  Portal: () => Portal,
  Range: () => Range,
  Repeat: () => Repeat,
  SIGNAL_BRAND: () => SIGNAL_BRAND,
  STORE_BRAND: () => STORE_BRAND,
  Show: () => Show,
  Suspense: () => Suspense,
  Switch: () => Switch,
  Values: () => Values,
  array: () => array,
  attr: () => attr,
  attrs: () => attrs,
  batch: () => batch,
  cls: () => cls,
  computed: () => computed,
  createAsync: () => createAsync,
  effect: () => effect,
  events: () => events,
  fragment: () => fragment,
  html: () => html,
  infinite: () => infinite,
  isArray: () => isArray,
  isLinkedSignal: () => isLinkedSignal,
  isSignal: () => isSignal,
  isStore: () => isStore,
  isWritable: () => isWritable,
  keyed: () => keyed,
  lazy: () => lazy,
  linkedFields: () => linkedFields,
  linkedForm: () => linkedForm,
  linkedPath: () => linkedPath,
  linkedSignal: () => linkedSignal,
  list: () => list,
  memo: () => memo,
  mount: () => mount,
  on: () => on,
  paginated: () => paginated,
  persisted: () => persisted,
  portal: () => portal,
  prop: () => prop,
  ref: () => ref,
  render: () => render,
  resource: () => resource,
  signal: () => signal,
  store: () => store,
  style: () => style,
  tag: () => tag,
  tags: () => tags,
  text: () => text,
  textNode: () => textNode,
  untracked: () => untracked,
  watch: () => watch,
  when: () => when
});
module.exports = __toCommonJS(signals_exports);

// src/signals/signals.ts
var SIGNAL_BRAND = Symbol("signal");
var activeEffect = null;
var batchDepth = 0;
var pendingNotifications = /* @__PURE__ */ new Set();
var defaultEquals = (a, b) => Object.is(a, b);
var _a, _value, _initialValue, _prev, _equals, _name, _SignalImpl_instances, notify_fn;
var SignalImpl = class extends EventTarget {
  constructor(value, options = {}) {
    var _a13;
    super();
    __privateAdd(this, _SignalImpl_instances);
    this[_a] = true;
    __privateAdd(this, _value);
    __privateAdd(this, _initialValue);
    __privateAdd(this, _prev);
    __privateAdd(this, _equals);
    __privateAdd(this, _name);
    __privateSet(this, _value, value);
    __privateSet(this, _initialValue, value);
    __privateSet(this, _equals, (_a13 = options.equals) != null ? _a13 : defaultEquals);
    __privateSet(this, _name, options.name);
  }
  /** Current value. Reading tracks dependency, writing notifies subscribers. */
  get value() {
    if (activeEffect) {
      activeEffect.add(this);
    }
    return __privateGet(this, _value);
  }
  set value(next) {
    if (__privateGet(this, _equals).call(this, __privateGet(this, _value), next)) return;
    __privateSet(this, _prev, __privateGet(this, _value));
    __privateSet(this, _value, next);
    __privateMethod(this, _SignalImpl_instances, notify_fn).call(this);
  }
  /** Previous value before last change */
  get prev() {
    return __privateGet(this, _prev);
  }
  /** Read current value without tracking as dependency */
  peek() {
    return __privateGet(this, _value);
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
  update(fn) {
    this.value = fn(__privateGet(this, _value));
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
  silent(value) {
    __privateSet(this, _prev, __privateGet(this, _value));
    __privateSet(this, _value, value);
  }
  /** Reset to initial value */
  reset() {
    this.value = __privateGet(this, _initialValue);
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
  subscribe(callback) {
    const handler = () => callback(__privateGet(this, _value), __privateGet(this, _prev));
    this.addEventListener("change", handler);
    return () => this.removeEventListener("change", handler);
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
  effect(fn) {
    let cleanup;
    const run = () => {
      cleanup == null ? void 0 : cleanup();
      cleanup = fn(__privateGet(this, _value));
    };
    run();
    this.addEventListener("change", run);
    return () => {
      cleanup == null ? void 0 : cleanup();
      this.removeEventListener("change", run);
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
  map(fn) {
    return computed(() => fn(this.value));
  }
  /** @internal Flush pending notification */
  _flush() {
    this.dispatchEvent(new CustomEvent("change"));
  }
  valueOf() {
    return __privateGet(this, _value);
  }
  toString() {
    return String(__privateGet(this, _value));
  }
  toJSON() {
    return __privateGet(this, _value);
  }
  /** Debug representation */
  get [(_a = SIGNAL_BRAND, Symbol.toStringTag)]() {
    return __privateGet(this, _name) ? `Signal(${__privateGet(this, _name)})` : "Signal";
  }
};
_value = new WeakMap();
_initialValue = new WeakMap();
_prev = new WeakMap();
_equals = new WeakMap();
_name = new WeakMap();
_SignalImpl_instances = new WeakSet();
/** @internal Notify subscribers of change */
notify_fn = function() {
  if (batchDepth > 0) {
    pendingNotifications.add(this);
  } else {
    this.dispatchEvent(new CustomEvent("change"));
  }
};
var _a2, _fn, _value2, _dirty, _lazy, _equals2, _name2, _deps, _cleanups, _ComputedImpl_instances, compute_fn, subscribe_fn, _onDependencyChange;
var ComputedImpl = class extends EventTarget {
  constructor(fn, options = {}) {
    var _a13, _b2;
    super();
    __privateAdd(this, _ComputedImpl_instances);
    this[_a2] = true;
    __privateAdd(this, _fn);
    __privateAdd(this, _value2);
    __privateAdd(this, _dirty, true);
    __privateAdd(this, _lazy);
    __privateAdd(this, _equals2);
    __privateAdd(this, _name2);
    __privateAdd(this, _deps, /* @__PURE__ */ new Set());
    __privateAdd(this, _cleanups, []);
    __privateAdd(this, _onDependencyChange, () => {
      if (__privateGet(this, _lazy)) {
        __privateSet(this, _dirty, true);
        this.dispatchEvent(new CustomEvent("change"));
      } else {
        __privateMethod(this, _ComputedImpl_instances, compute_fn).call(this);
      }
    });
    __privateSet(this, _fn, fn);
    __privateSet(this, _lazy, (_a13 = options.lazy) != null ? _a13 : true);
    __privateSet(this, _equals2, (_b2 = options.equals) != null ? _b2 : defaultEquals);
    __privateSet(this, _name2, options.name);
    __privateMethod(this, _ComputedImpl_instances, compute_fn).call(this);
    __privateMethod(this, _ComputedImpl_instances, subscribe_fn).call(this);
  }
  get value() {
    if (activeEffect) {
    }
    if (__privateGet(this, _dirty)) {
      __privateMethod(this, _ComputedImpl_instances, compute_fn).call(this);
    }
    return __privateGet(this, _value2);
  }
  get dirty() {
    return __privateGet(this, _dirty);
  }
  peek() {
    if (__privateGet(this, _dirty)) {
      __privateMethod(this, _ComputedImpl_instances, compute_fn).call(this);
    }
    return __privateGet(this, _value2);
  }
  recompute() {
    __privateSet(this, _dirty, true);
    return this.value;
  }
  subscribe(callback) {
    let prev = __privateGet(this, _value2);
    const handler = () => {
      const next = this.value;
      callback(next, prev);
      prev = next;
    };
    this.addEventListener("change", handler);
    return () => this.removeEventListener("change", handler);
  }
  effect(fn) {
    let cleanup;
    const run = () => {
      cleanup == null ? void 0 : cleanup();
      cleanup = fn(this.value);
    };
    run();
    this.addEventListener("change", run);
    return () => {
      cleanup == null ? void 0 : cleanup();
      this.removeEventListener("change", run);
    };
  }
  map(fn) {
    return computed(() => fn(this.value));
  }
  /** @internal Flush pending notification */
  _flush() {
    this.dispatchEvent(new CustomEvent("change"));
  }
  valueOf() {
    return this.value;
  }
  toString() {
    return String(this.value);
  }
  toJSON() {
    return this.value;
  }
  get [(_a2 = SIGNAL_BRAND, Symbol.toStringTag)]() {
    return __privateGet(this, _name2) ? `Computed(${__privateGet(this, _name2)})` : "Computed";
  }
};
_fn = new WeakMap();
_value2 = new WeakMap();
_dirty = new WeakMap();
_lazy = new WeakMap();
_equals2 = new WeakMap();
_name2 = new WeakMap();
_deps = new WeakMap();
_cleanups = new WeakMap();
_ComputedImpl_instances = new WeakSet();
compute_fn = function() {
  const prevEffect = activeEffect;
  const newDeps = /* @__PURE__ */ new Set();
  activeEffect = newDeps;
  try {
    const next = __privateGet(this, _fn).call(this);
    const changed = __privateGet(this, _value2) === void 0 || !__privateGet(this, _equals2).call(this, __privateGet(this, _value2), next);
    __privateSet(this, _value2, next);
    __privateSet(this, _dirty, false);
    if (!setsEqual(__privateGet(this, _deps), newDeps)) {
      __privateGet(this, _cleanups).forEach((fn) => fn());
      __privateSet(this, _cleanups, []);
      __privateSet(this, _deps, newDeps);
      __privateMethod(this, _ComputedImpl_instances, subscribe_fn).call(this);
    }
    if (changed) {
      if (batchDepth > 0) {
        pendingNotifications.add(this);
      } else {
        this.dispatchEvent(new CustomEvent("change"));
      }
    }
  } finally {
    activeEffect = prevEffect;
  }
};
subscribe_fn = function() {
  for (const dep of __privateGet(this, _deps)) {
    const unsub = () => {
      dep.addEventListener("change", __privateGet(this, _onDependencyChange));
    };
    unsub();
    __privateGet(this, _cleanups).push(() => {
      dep.removeEventListener("change", __privateGet(this, _onDependencyChange));
    });
  }
};
_onDependencyChange = new WeakMap();
function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
function signal(value, options) {
  return new SignalImpl(value, options);
}
function computed(fn, options) {
  return new ComputedImpl(fn, options);
}
function effect(fn, options = {}) {
  const { immediate = true } = options;
  let cleanup;
  let deps = /* @__PURE__ */ new Set();
  let disposed = false;
  const run = () => {
    if (disposed) return;
    cleanup == null ? void 0 : cleanup();
    const prevEffect = activeEffect;
    const newDeps = /* @__PURE__ */ new Set();
    activeEffect = newDeps;
    try {
      cleanup = fn();
    } finally {
      activeEffect = prevEffect;
    }
    if (!setsEqual(deps, newDeps)) {
      deps.forEach((dep) => {
        if (!newDeps.has(dep)) {
          dep.removeEventListener("change", run);
        }
      });
      newDeps.forEach((dep) => {
        if (!deps.has(dep)) {
          dep.addEventListener("change", run);
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
    cleanup == null ? void 0 : cleanup();
    deps.forEach((dep) => dep.removeEventListener("change", run));
    deps.clear();
  };
}
function batch(fn, options = {}) {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingNotifications.size > 0) {
      const pending = pendingNotifications;
      pendingNotifications = /* @__PURE__ */ new Set();
      if (options.defer) {
        queueMicrotask(() => {
          pending.forEach((signal2) => signal2._flush());
        });
      } else {
        pending.forEach((signal2) => signal2._flush());
      }
    }
  }
}
function untracked(fn) {
  const prev = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = prev;
  }
}
function isSignal(value) {
  return value !== null && typeof value === "object" && SIGNAL_BRAND in value && value[SIGNAL_BRAND] === true;
}
function isWritable(value) {
  return isSignal(value) && value instanceof SignalImpl;
}
function watch(signals, callback, options = {}) {
  const { immediate = true } = options;
  let cleanup;
  let prev;
  const getValues = () => {
    return signals.map((s) => s.peek());
  };
  const run = () => {
    cleanup == null ? void 0 : cleanup();
    const current = getValues();
    cleanup = callback(current, prev);
    prev = current;
  };
  const cleanups = signals.map((signal2) => {
    const handler = () => run();
    signal2.subscribe(handler);
    return () => signal2.subscribe(handler);
  });
  if (immediate) {
    run();
  }
  return () => {
    cleanup == null ? void 0 : cleanup();
    cleanups.forEach((fn) => fn());
  };
}
function persisted(key, initial, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = typeof localStorage !== "undefined" ? localStorage : void 0,
    ...signalOptions
  } = options;
  let value = initial;
  if (storage) {
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        value = deserialize(stored);
      }
    } catch (e) {
    }
  }
  const sig = signal(value, signalOptions);
  sig.effect((value2) => {
    if (storage) {
      try {
        storage.setItem(key, serialize(value2));
      } catch (e) {
      }
    }
  });
  if (typeof window !== "undefined" && storage === localStorage) {
    const handler = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          sig.silent(deserialize(e.newValue));
        } catch (e2) {
        }
      }
    };
    window.addEventListener("storage", handler);
  }
  return sig;
}

// src/signals/array.ts
var ARRAY_BRAND = Symbol("reactiveArray");
var arrayBatchDepth = 0;
var pendingArrayNotifications = /* @__PURE__ */ new Map();
var _a3, _items, _initialItems, _prev2, _options, _keyMap, _indexListeners, _ReactiveArrayImpl_instances, notify_fn2, notifyIndexListeners_fn, ensureKeyMap_fn, rebuildKeyMap_fn;
var ReactiveArrayImpl = class extends EventTarget {
  constructor(initial = [], options = {}) {
    super();
    __privateAdd(this, _ReactiveArrayImpl_instances);
    this[_a3] = true;
    __privateAdd(this, _items);
    __privateAdd(this, _initialItems);
    __privateAdd(this, _prev2);
    __privateAdd(this, _options);
    __privateAdd(this, _keyMap, null);
    __privateAdd(this, _indexListeners, /* @__PURE__ */ new Map());
    __privateSet(this, _items, [...initial]);
    __privateSet(this, _initialItems, [...initial]);
    __privateSet(this, _options, options);
    if (options.key) {
      __privateMethod(this, _ReactiveArrayImpl_instances, rebuildKeyMap_fn).call(this);
    }
  }
  // ============ Properties ============
  get value() {
    return __privateGet(this, _items);
  }
  get length() {
    return __privateGet(this, _items).length;
  }
  get prev() {
    return __privateGet(this, _prev2);
  }
  get first() {
    return __privateGet(this, _items)[0];
  }
  get last() {
    return __privateGet(this, _items)[__privateGet(this, _items).length - 1];
  }
  get isEmpty() {
    return __privateGet(this, _items).length === 0;
  }
  // ============ Access ============
  at(index) {
    const i = index < 0 ? __privateGet(this, _items).length + index : index;
    return __privateGet(this, _items)[i];
  }
  peek(index) {
    if (index === void 0) {
      return __privateGet(this, _items);
    }
    const i = index < 0 ? __privateGet(this, _items).length + index : index;
    return __privateGet(this, _items)[i];
  }
  // ============ Mutation ============
  push(...items) {
    if (items.length === 0) return __privateGet(this, _items).length;
    const prev = [...__privateGet(this, _items)];
    __privateGet(this, _items).push(...items);
    if (__privateGet(this, _options).key) {
      items.forEach((item) => {
        const key = __privateGet(this, _options).key(item);
        __privateGet(this, _keyMap).set(key, item);
      });
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "push",
      index: prev.length,
      added: items,
      removed: [],
      prev,
      next: __privateGet(this, _items)
    });
    return __privateGet(this, _items).length;
  }
  pop() {
    if (__privateGet(this, _items).length === 0) return void 0;
    const prev = [...__privateGet(this, _items)];
    const item = __privateGet(this, _items).pop();
    if (item !== void 0 && __privateGet(this, _options).key) {
      const key = __privateGet(this, _options).key(item);
      __privateGet(this, _keyMap).delete(key);
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "pop",
      index: prev.length - 1,
      added: [],
      removed: item !== void 0 ? [item] : [],
      prev,
      next: __privateGet(this, _items)
    });
    return item;
  }
  shift() {
    if (__privateGet(this, _items).length === 0) return void 0;
    const prev = [...__privateGet(this, _items)];
    const item = __privateGet(this, _items).shift();
    if (item !== void 0 && __privateGet(this, _options).key) {
      const key = __privateGet(this, _options).key(item);
      __privateGet(this, _keyMap).delete(key);
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "shift",
      index: 0,
      added: [],
      removed: item !== void 0 ? [item] : [],
      prev,
      next: __privateGet(this, _items)
    });
    return item;
  }
  unshift(...items) {
    if (items.length === 0) return __privateGet(this, _items).length;
    const prev = [...__privateGet(this, _items)];
    __privateGet(this, _items).unshift(...items);
    if (__privateGet(this, _options).key) {
      items.forEach((item) => {
        const key = __privateGet(this, _options).key(item);
        __privateGet(this, _keyMap).set(key, item);
      });
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "unshift",
      index: 0,
      added: items,
      removed: [],
      prev,
      next: __privateGet(this, _items)
    });
    return __privateGet(this, _items).length;
  }
  splice(start, deleteCount = 0, ...items) {
    const prev = [...__privateGet(this, _items)];
    const removed = __privateGet(this, _items).splice(start, deleteCount, ...items);
    if (__privateGet(this, _options).key) {
      removed.forEach((item) => {
        const key = __privateGet(this, _options).key(item);
        __privateGet(this, _keyMap).delete(key);
      });
      items.forEach((item) => {
        const key = __privateGet(this, _options).key(item);
        __privateGet(this, _keyMap).set(key, item);
      });
    }
    if (removed.length > 0 || items.length > 0) {
      __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
        type: "splice",
        index: start,
        added: items,
        removed,
        prev,
        next: __privateGet(this, _items)
      });
    }
    return removed;
  }
  set(indexOrItems, item) {
    if (typeof indexOrItems === "number") {
      const index = indexOrItems;
      if (index < 0 || index >= __privateGet(this, _items).length) return;
      const prev = [...__privateGet(this, _items)];
      const oldItem = __privateGet(this, _items)[index];
      __privateGet(this, _items)[index] = item;
      if (__privateGet(this, _options).key) {
        const oldKey = __privateGet(this, _options).key(oldItem);
        const newKey = __privateGet(this, _options).key(item);
        __privateGet(this, _keyMap).delete(oldKey);
        __privateGet(this, _keyMap).set(newKey, item);
      }
      __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
        type: "set",
        index,
        added: [item],
        removed: [oldItem],
        prev,
        next: __privateGet(this, _items)
      });
    } else {
      const prev = [...__privateGet(this, _items)];
      __privateSet(this, _items, [...indexOrItems]);
      if (__privateGet(this, _options).key) {
        __privateMethod(this, _ReactiveArrayImpl_instances, rebuildKeyMap_fn).call(this);
      }
      __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
        type: "set",
        added: __privateGet(this, _items),
        removed: prev,
        prev,
        next: __privateGet(this, _items)
      });
    }
  }
  update(indexOrFn, fn) {
    if (typeof indexOrFn === "number") {
      const index = indexOrFn;
      if (index < 0 || index >= __privateGet(this, _items).length) return;
      this.set(index, fn(__privateGet(this, _items)[index]));
    } else {
      this.batch(() => {
        for (let i = 0; i < __privateGet(this, _items).length; i++) {
          this.set(i, indexOrFn(__privateGet(this, _items)[i], i));
        }
      });
    }
  }
  sort(compare) {
    const prev = [...__privateGet(this, _items)];
    __privateGet(this, _items).sort(compare);
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "sort",
      prev,
      next: __privateGet(this, _items)
    });
    return this;
  }
  reverse() {
    const prev = [...__privateGet(this, _items)];
    __privateGet(this, _items).reverse();
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "reverse",
      prev,
      next: __privateGet(this, _items)
    });
    return this;
  }
  fill(value, start = 0, end = __privateGet(this, _items).length) {
    const prev = [...__privateGet(this, _items)];
    __privateGet(this, _items).fill(value, start, end);
    if (__privateGet(this, _options).key) {
      __privateMethod(this, _ReactiveArrayImpl_instances, rebuildKeyMap_fn).call(this);
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "fill",
      index: start,
      prev,
      next: __privateGet(this, _items)
    });
    return this;
  }
  swap(indexA, indexB) {
    if (indexA < 0 || indexA >= __privateGet(this, _items).length || indexB < 0 || indexB >= __privateGet(this, _items).length || indexA === indexB) return;
    const prev = [...__privateGet(this, _items)];
    [__privateGet(this, _items)[indexA], __privateGet(this, _items)[indexB]] = [__privateGet(this, _items)[indexB], __privateGet(this, _items)[indexA]];
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "swap",
      prev,
      next: __privateGet(this, _items)
    });
  }
  move(from, to) {
    if (from < 0 || from >= __privateGet(this, _items).length || to < 0 || to >= __privateGet(this, _items).length || from === to) return;
    const prev = [...__privateGet(this, _items)];
    const [item] = __privateGet(this, _items).splice(from, 1);
    __privateGet(this, _items).splice(to, 0, item);
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "move",
      prev,
      next: __privateGet(this, _items)
    });
  }
  clear() {
    if (__privateGet(this, _items).length === 0) return;
    const prev = [...__privateGet(this, _items)];
    __privateSet(this, _items, []);
    if (__privateGet(this, _options).key) {
      __privateGet(this, _keyMap).clear();
    }
    __privateMethod(this, _ReactiveArrayImpl_instances, notify_fn2).call(this, {
      type: "clear",
      removed: prev,
      prev,
      next: __privateGet(this, _items)
    });
  }
  reset() {
    this.set([...__privateGet(this, _initialItems)]);
  }
  // ============ Keyed Operations ============
  getByKey(key) {
    __privateMethod(this, _ReactiveArrayImpl_instances, ensureKeyMap_fn).call(this);
    return __privateGet(this, _keyMap).get(key);
  }
  updateByKey(key, fn) {
    __privateMethod(this, _ReactiveArrayImpl_instances, ensureKeyMap_fn).call(this);
    const item = __privateGet(this, _keyMap).get(key);
    if (item === void 0) return false;
    const index = __privateGet(this, _items).indexOf(item);
    if (index === -1) return false;
    this.set(index, fn(item));
    return true;
  }
  removeByKey(key) {
    __privateMethod(this, _ReactiveArrayImpl_instances, ensureKeyMap_fn).call(this);
    const item = __privateGet(this, _keyMap).get(key);
    if (item === void 0) return void 0;
    const index = __privateGet(this, _items).indexOf(item);
    if (index === -1) return void 0;
    const [removed] = this.splice(index, 1);
    return removed;
  }
  hasKey(key) {
    __privateMethod(this, _ReactiveArrayImpl_instances, ensureKeyMap_fn).call(this);
    return __privateGet(this, _keyMap).has(key);
  }
  // ============ Query ============
  find(predicate) {
    return __privateGet(this, _items).find(predicate);
  }
  findIndex(predicate) {
    return __privateGet(this, _items).findIndex(predicate);
  }
  findLast(predicate) {
    for (let i = __privateGet(this, _items).length - 1; i >= 0; i--) {
      if (predicate(__privateGet(this, _items)[i], i, __privateGet(this, _items))) {
        return __privateGet(this, _items)[i];
      }
    }
    return void 0;
  }
  findLastIndex(predicate) {
    for (let i = __privateGet(this, _items).length - 1; i >= 0; i--) {
      if (predicate(__privateGet(this, _items)[i], i, __privateGet(this, _items))) {
        return i;
      }
    }
    return -1;
  }
  some(predicate) {
    return __privateGet(this, _items).some(predicate);
  }
  every(predicate) {
    return __privateGet(this, _items).every(predicate);
  }
  includes(item) {
    return __privateGet(this, _items).includes(item);
  }
  indexOf(item) {
    return __privateGet(this, _items).indexOf(item);
  }
  lastIndexOf(item) {
    return __privateGet(this, _items).lastIndexOf(item);
  }
  // ============ Derived ============
  filter(predicate) {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      derived.set(__privateGet(this, _items).filter(predicate));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  map(fn) {
    const derived = array([]);
    const update = () => {
      derived.set(__privateGet(this, _items).map(fn));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  sorted(compare) {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      derived.set([...__privateGet(this, _items)].sort(compare));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  reversed() {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      derived.set([...__privateGet(this, _items)].reverse());
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  slice(start, end) {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      derived.set(__privateGet(this, _items).slice(start, end));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  concat(...items) {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      let result = [...__privateGet(this, _items)];
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
    for (const item of items) {
      if (isArray(item)) {
        item.subscribe(() => update());
      }
    }
    return derived;
  }
  flat(depth) {
    const derived = array([]);
    const update = () => {
      derived.set(__privateGet(this, _items).flat(depth));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  flatMap(fn) {
    const derived = array([]);
    const update = () => {
      derived.set(__privateGet(this, _items).flatMap(fn));
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  unique(key) {
    const derived = array([], __privateGet(this, _options));
    const update = () => {
      if (key) {
        const seen = /* @__PURE__ */ new Set();
        const result = [];
        for (const item of __privateGet(this, _items)) {
          const k = key(item);
          if (!seen.has(k)) {
            seen.add(k);
            result.push(item);
          }
        }
        derived.set(result);
      } else {
        derived.set([...new Set(__privateGet(this, _items))]);
      }
    };
    update();
    this.subscribe(() => update());
    return derived;
  }
  // ============ Aggregate ============
  reduce(fn, initial) {
    return computed(() => __privateGet(this, _items).reduce(fn, initial));
  }
  join(separator = ",") {
    return computed(() => __privateGet(this, _items).join(separator));
  }
  subscribe(callbackOrIndex, callback) {
    if (typeof callbackOrIndex === "function") {
      const handler = (e) => {
        const change = e.detail;
        callbackOrIndex(__privateGet(this, _items), change);
      };
      this.addEventListener("change", handler);
      return () => this.removeEventListener("change", handler);
    } else {
      const index = callbackOrIndex;
      if (!__privateGet(this, _indexListeners).has(index)) {
        __privateGet(this, _indexListeners).set(index, /* @__PURE__ */ new Set());
      }
      __privateGet(this, _indexListeners).get(index).add(callback);
      return () => {
        const listeners = __privateGet(this, _indexListeners).get(index);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            __privateGet(this, _indexListeners).delete(index);
          }
        }
      };
    }
  }
  effect(fnOrIndex, fn) {
    let cleanup;
    if (typeof fnOrIndex === "function") {
      const run = () => {
        cleanup == null ? void 0 : cleanup();
        cleanup = fnOrIndex(__privateGet(this, _items));
      };
      run();
      const unsub = this.subscribe(() => run());
      return () => {
        cleanup == null ? void 0 : cleanup();
        unsub();
      };
    } else {
      const index = fnOrIndex;
      let prevItem = __privateGet(this, _items)[index];
      const run = () => {
        cleanup == null ? void 0 : cleanup();
        cleanup = fn(__privateGet(this, _items)[index]);
      };
      run();
      const unsub = this.subscribe(() => {
        const newItem = __privateGet(this, _items)[index];
        if (newItem !== prevItem) {
          prevItem = newItem;
          run();
        }
      });
      return () => {
        cleanup == null ? void 0 : cleanup();
        unsub();
      };
    }
  }
  // ============ Iteration ============
  forEach(fn) {
    __privateGet(this, _items).forEach(fn);
  }
  entries() {
    return __privateGet(this, _items).entries();
  }
  keys() {
    return __privateGet(this, _items).keys();
  }
  values() {
    return __privateGet(this, _items).values();
  }
  [(_a3 = ARRAY_BRAND, Symbol.iterator)]() {
    return __privateGet(this, _items)[Symbol.iterator]();
  }
  // ============ Batch ============
  batch(fn) {
    arrayBatchDepth++;
    try {
      fn();
    } finally {
      arrayBatchDepth--;
      if (arrayBatchDepth === 0) {
        const changes = pendingArrayNotifications.get(this);
        if (changes && changes.length > 0) {
          pendingArrayNotifications.delete(this);
          const mergedChange = {
            type: "set",
            prev: changes[0].prev,
            next: __privateGet(this, _items),
            added: changes.flatMap((c) => {
              var _a13;
              return (_a13 = c.added) != null ? _a13 : [];
            }),
            removed: changes.flatMap((c) => {
              var _a13;
              return (_a13 = c.removed) != null ? _a13 : [];
            })
          };
          this.dispatchEvent(new CustomEvent("change", { detail: mergedChange }));
          __privateMethod(this, _ReactiveArrayImpl_instances, notifyIndexListeners_fn).call(this, mergedChange);
        }
      }
    }
  }
  transaction(fn) {
    const backup = [...__privateGet(this, _items)];
    try {
      this.batch(fn);
    } catch (error) {
      __privateSet(this, _items, backup);
      if (__privateGet(this, _options).key) {
        __privateMethod(this, _ReactiveArrayImpl_instances, rebuildKeyMap_fn).call(this);
      }
      throw error;
    }
  }
  // ============ Utility ============
  toArray() {
    return [...__privateGet(this, _items)];
  }
  toJSON() {
    return __privateGet(this, _items);
  }
  get readonly() {
    return this;
  }
  get [Symbol.toStringTag]() {
    return __privateGet(this, _options).name ? `Array(${__privateGet(this, _options).name})` : "ReactiveArray";
  }
};
_items = new WeakMap();
_initialItems = new WeakMap();
_prev2 = new WeakMap();
_options = new WeakMap();
_keyMap = new WeakMap();
_indexListeners = new WeakMap();
_ReactiveArrayImpl_instances = new WeakSet();
// ============ Private ============
notify_fn2 = function(change) {
  __privateSet(this, _prev2, change.prev);
  if (arrayBatchDepth > 0) {
    if (!pendingArrayNotifications.has(this)) {
      pendingArrayNotifications.set(this, []);
    }
    pendingArrayNotifications.get(this).push(change);
  } else {
    this.dispatchEvent(new CustomEvent("change", { detail: change }));
    __privateMethod(this, _ReactiveArrayImpl_instances, notifyIndexListeners_fn).call(this, change);
  }
};
notifyIndexListeners_fn = function(change) {
  for (const [index, listeners] of __privateGet(this, _indexListeners)) {
    const prevItem = change.prev[index];
    const nextItem = change.next[index];
    if (prevItem !== nextItem) {
      listeners.forEach((cb) => cb(nextItem, prevItem));
    }
  }
};
ensureKeyMap_fn = function() {
  if (!__privateGet(this, _options).key) {
    throw new Error("Key function not provided. Pass { key: (item) => ... } to array().");
  }
  if (!__privateGet(this, _keyMap)) {
    __privateMethod(this, _ReactiveArrayImpl_instances, rebuildKeyMap_fn).call(this);
  }
};
rebuildKeyMap_fn = function() {
  if (!__privateGet(this, _options).key) return;
  __privateSet(this, _keyMap, /* @__PURE__ */ new Map());
  for (const item of __privateGet(this, _items)) {
    const key = __privateGet(this, _options).key(item);
    __privateGet(this, _keyMap).set(key, item);
  }
};
function array(initial = [], options) {
  return new ReactiveArrayImpl(initial, options);
}
function isArray(value) {
  return value !== null && typeof value === "object" && ARRAY_BRAND in value && value[ARRAY_BRAND] === true;
}

// src/signals/linked.ts
var LINKED_BRAND = Symbol("linkedSignal");
var activeLinkedEffect = null;
function normalizeSource(source) {
  if (typeof source === "function" && !("value" in source)) {
    return source;
  }
  return () => source.value;
}
function trackDependencies(fn) {
  const deps = /* @__PURE__ */ new Set();
  const prevEffect = activeLinkedEffect;
  activeLinkedEffect = deps;
  try {
    const value = fn();
    return { value, deps };
  } finally {
    activeLinkedEffect = prevEffect;
  }
}
var _a4, _b, _value3, _prev3, _sourceValue, _prevSourceValue, _isOverridden, _initialized, _getSource, _computation, _equals3, _sticky, _name3, _cleanups2, _LinkedSignalImpl_instances, compute_fn2, updateSubscriptions_fn, _onDependencyChange2, notify_fn3;
var LinkedSignalImpl = class extends EventTarget {
  constructor(source, computation, options = {}) {
    var _a13, _b2;
    super();
    __privateAdd(this, _LinkedSignalImpl_instances);
    this[_b] = true;
    this[_a4] = true;
    __privateAdd(this, _value3);
    __privateAdd(this, _prev3);
    __privateAdd(this, _sourceValue);
    __privateAdd(this, _prevSourceValue);
    __privateAdd(this, _isOverridden, false);
    __privateAdd(this, _initialized, false);
    __privateAdd(this, _getSource);
    __privateAdd(this, _computation);
    __privateAdd(this, _equals3);
    __privateAdd(this, _sticky);
    __privateAdd(this, _name3);
    __privateAdd(this, _cleanups2, []);
    __privateAdd(this, _onDependencyChange2, () => {
      __privateMethod(this, _LinkedSignalImpl_instances, compute_fn2).call(this);
    });
    __privateSet(this, _getSource, source);
    __privateSet(this, _computation, computation);
    __privateSet(this, _equals3, (_a13 = options.equals) != null ? _a13 : Object.is);
    __privateSet(this, _sticky, (_b2 = options.sticky) != null ? _b2 : false);
    __privateSet(this, _name3, options.name);
    __privateMethod(this, _LinkedSignalImpl_instances, compute_fn2).call(this);
    __privateSet(this, _initialized, true);
  }
  // ============ ReadonlySignal ============
  get value() {
    if (activeLinkedEffect) {
      activeLinkedEffect.add(this);
    }
    return __privateGet(this, _value3);
  }
  set value(next) {
    this.set(next);
  }
  get prev() {
    return __privateGet(this, _prev3);
  }
  peek() {
    return __privateGet(this, _value3);
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
  set(next) {
    if (__privateGet(this, _initialized) && __privateGet(this, _equals3).call(this, __privateGet(this, _value3), next)) return;
    __privateSet(this, _prev3, __privateGet(this, _value3));
    __privateSet(this, _value3, next);
    __privateSet(this, _isOverridden, true);
    __privateMethod(this, _LinkedSignalImpl_instances, notify_fn3).call(this);
  }
  /**
   * Update using current value.
   */
  update(fn) {
    this.set(fn(__privateGet(this, _value3)));
  }
  /**
   * Set without triggering notifications.
   */
  silent(next) {
    __privateSet(this, _prev3, __privateGet(this, _value3));
    __privateSet(this, _value3, next);
    __privateSet(this, _isOverridden, true);
  }
  /**
   * Reset to initial computed value.
   */
  reset() {
    this.recompute();
  }
  // ============ LinkedSignal ============
  get isOverridden() {
    return __privateGet(this, _isOverridden);
  }
  /**
   * Force recomputation from sources.
   * Clears any manual override.
   */
  recompute() {
    __privateSet(this, _isOverridden, false);
    __privateMethod(this, _LinkedSignalImpl_instances, compute_fn2).call(this);
    return __privateGet(this, _value3);
  }
  /**
   * Alias for recompute - semantically clear for form resets.
   */
  resetToSource() {
    return this.recompute();
  }
  /**
   * Set value as if it came from computation.
   * Does not mark as overridden.
   */
  setFromSource(value) {
    if (__privateGet(this, _equals3).call(this, __privateGet(this, _value3), value)) return;
    __privateSet(this, _prev3, __privateGet(this, _value3));
    __privateSet(this, _value3, value);
    __privateSet(this, _isOverridden, false);
    __privateMethod(this, _LinkedSignalImpl_instances, notify_fn3).call(this);
  }
  // ============ Subscription ============
  subscribe(callback) {
    const handler = () => callback(__privateGet(this, _value3), __privateGet(this, _prev3));
    this.addEventListener("change", handler);
    return () => this.removeEventListener("change", handler);
  }
  effect(fn) {
    let cleanup;
    const run = () => {
      cleanup == null ? void 0 : cleanup();
      cleanup = fn(__privateGet(this, _value3));
    };
    run();
    this.addEventListener("change", run);
    return () => {
      cleanup == null ? void 0 : cleanup();
      this.removeEventListener("change", run);
    };
  }
  map(fn) {
    return computed(() => fn(this.value));
  }
  valueOf() {
    return __privateGet(this, _value3);
  }
  toString() {
    return String(__privateGet(this, _value3));
  }
  toJSON() {
    return __privateGet(this, _value3);
  }
  get [(_b = LINKED_BRAND, _a4 = SIGNAL_BRAND, Symbol.toStringTag)]() {
    return __privateGet(this, _name3) ? `LinkedSignal(${__privateGet(this, _name3)})` : "LinkedSignal";
  }
};
_value3 = new WeakMap();
_prev3 = new WeakMap();
_sourceValue = new WeakMap();
_prevSourceValue = new WeakMap();
_isOverridden = new WeakMap();
_initialized = new WeakMap();
_getSource = new WeakMap();
_computation = new WeakMap();
_equals3 = new WeakMap();
_sticky = new WeakMap();
_name3 = new WeakMap();
_cleanups2 = new WeakMap();
_LinkedSignalImpl_instances = new WeakSet();
// ============ Private ============
compute_fn2 = function() {
  const { value: sourceValue, deps: sourceDeps } = trackDependencies(__privateGet(this, _getSource));
  const sourceChanged = !Object.is(__privateGet(this, _sourceValue), sourceValue);
  if (__privateGet(this, _sticky) && __privateGet(this, _isOverridden) && __privateGet(this, _initialized)) {
    __privateSet(this, _prevSourceValue, __privateGet(this, _sourceValue));
    __privateSet(this, _sourceValue, sourceValue);
    __privateMethod(this, _LinkedSignalImpl_instances, updateSubscriptions_fn).call(this, sourceDeps);
    return;
  }
  if (__privateGet(this, _isOverridden) && !sourceChanged && __privateGet(this, _initialized)) {
    return;
  }
  const previous = {
    source: __privateGet(this, _prevSourceValue),
    value: __privateGet(this, _prev3)
  };
  __privateSet(this, _prevSourceValue, __privateGet(this, _sourceValue));
  __privateSet(this, _sourceValue, sourceValue);
  const { value: nextValue, deps: computationDeps } = trackDependencies(
    () => __privateGet(this, _computation).call(this, sourceValue, previous)
  );
  const allDeps = /* @__PURE__ */ new Set([...sourceDeps, ...computationDeps]);
  const valueChanged = !__privateGet(this, _initialized) || !__privateGet(this, _equals3).call(this, __privateGet(this, _value3), nextValue);
  if (valueChanged) {
    __privateSet(this, _prev3, __privateGet(this, _value3));
    __privateSet(this, _value3, nextValue);
    __privateSet(this, _isOverridden, false);
    if (__privateGet(this, _initialized)) {
      __privateMethod(this, _LinkedSignalImpl_instances, notify_fn3).call(this);
    }
  }
  __privateMethod(this, _LinkedSignalImpl_instances, updateSubscriptions_fn).call(this, allDeps);
};
updateSubscriptions_fn = function(newDeps) {
  __privateGet(this, _cleanups2).forEach((fn) => fn());
  __privateSet(this, _cleanups2, []);
  for (const dep of newDeps) {
    if (dep && typeof dep.addEventListener === "function") {
      const handler = () => __privateGet(this, _onDependencyChange2).call(this);
      dep.addEventListener("change", handler);
      __privateGet(this, _cleanups2).push(() => dep.removeEventListener("change", handler));
    }
  }
};
_onDependencyChange2 = new WeakMap();
notify_fn3 = function() {
  this.dispatchEvent(new CustomEvent("change"));
};
function linkedSignal(computationOrOptions, options) {
  if (typeof computationOrOptions === "function") {
    const computation = computationOrOptions;
    return new LinkedSignalImpl(
      () => void 0,
      () => computation(),
      options != null ? options : {}
    );
  } else {
    const opts = computationOrOptions;
    const getSource = normalizeSource(opts.source);
    return new LinkedSignalImpl(
      getSource,
      opts.computation,
      opts
    );
  }
}
function isLinkedSignal(value) {
  return value !== null && typeof value === "object" && LINKED_BRAND in value && value[LINKED_BRAND] === true;
}
function linkedFields(source, keys) {
  const result = {};
  for (const key of keys) {
    result[key] = linkedSignal(() => source.value[key]);
  }
  return result;
}
function linkedPath(storeSignal, path) {
  return linkedSignal(() => storeSignal.get(path));
}
function linkedForm(initial) {
  const keys = Object.keys(initial.value);
  const fields = {};
  for (const key of keys) {
    fields[key] = linkedSignal(() => initial.value[key]);
  }
  const values = computed(() => {
    const result = {};
    for (const key of keys) {
      result[key] = fields[key].value;
    }
    return result;
  });
  const dirtyFields = computed(
    () => keys.filter((key) => fields[key].isOverridden)
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
    resetField: (key) => {
      fields[key].resetToSource();
    }
  };
}

// src/signals/store.ts
var STORE_BRAND = Symbol("store");
var activeStoreEffect = null;
var storeBatchDepth = 0;
var pendingStoreNotifications = /* @__PURE__ */ new Map();
function parsePath(path) {
  if (Array.isArray(path)) {
    return path.map(String);
  }
  if (typeof path === "string") {
    return path.split(".").filter(Boolean);
  }
  return [];
}
function getPath(obj, path) {
  let current = obj;
  for (const key of path) {
    if (current === null || current === void 0) return void 0;
    current = current[key];
  }
  return current;
}
function setPath(obj, path, value) {
  var _a13;
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  const current = obj;
  return {
    ...obj,
    [head]: tail.length === 0 ? value : setPath(
      (_a13 = current[head]) != null ? _a13 : {},
      tail,
      value
    )
  };
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetVal = target[key];
      const sourceVal = source[key];
      if (sourceVal !== null && typeof sourceVal === "object" && !Array.isArray(sourceVal) && targetVal !== null && typeof targetVal === "object" && !Array.isArray(targetVal)) {
        result[key] = deepMerge(
          targetVal,
          sourceVal
        );
      } else {
        result[key] = sourceVal;
      }
    }
  }
  return result;
}
var _a5, _value4, _initialValue2, _prev4, _options2, _pathListeners, _StoreImpl_instances, isFullState_fn, setState_fn, notify_fn4;
var StoreImpl = class extends EventTarget {
  constructor(initial, options = {}) {
    super();
    __privateAdd(this, _StoreImpl_instances);
    this[_a5] = true;
    __privateAdd(this, _value4);
    __privateAdd(this, _initialValue2);
    __privateAdd(this, _prev4);
    __privateAdd(this, _options2);
    __privateAdd(this, _pathListeners, /* @__PURE__ */ new Map());
    __privateSet(this, _value4, options.immutable ? deepClone(initial) : initial);
    __privateSet(this, _initialValue2, deepClone(initial));
    __privateSet(this, _options2, options);
  }
  get value() {
    if (activeStoreEffect) {
      activeStoreEffect.add(this);
    }
    return __privateGet(this, _options2).immutable ? deepClone(__privateGet(this, _value4)) : __privateGet(this, _value4);
  }
  get prev() {
    return __privateGet(this, _prev4);
  }
  get(path) {
    const keys = parsePath(path);
    return getPath(__privateGet(this, _value4), keys);
  }
  set(pathOrValue, value) {
    if (arguments.length === 1) {
      const newValue = pathOrValue;
      if (__privateMethod(this, _StoreImpl_instances, isFullState_fn).call(this, newValue)) {
        __privateMethod(this, _StoreImpl_instances, setState_fn).call(this, newValue, []);
      } else {
        const merged = { ...__privateGet(this, _value4), ...newValue };
        __privateMethod(this, _StoreImpl_instances, setState_fn).call(this, merged, []);
      }
    } else {
      const path = parsePath(pathOrValue);
      const prev = getPath(__privateGet(this, _value4), path);
      if (Object.is(prev, value)) return;
      const newState = setPath(__privateGet(this, _value4), path, value);
      __privateMethod(this, _StoreImpl_instances, setState_fn).call(this, newState, path);
    }
  }
  update(pathOrFn, fn) {
    if (typeof pathOrFn === "function") {
      this.set(pathOrFn(__privateGet(this, _value4)));
    } else {
      const path = parsePath(pathOrFn);
      const current = getPath(__privateGet(this, _value4), path);
      this.set(pathOrFn, fn(current));
    }
  }
  merge(partial) {
    var _a13;
    const mergeFn = (_a13 = __privateGet(this, _options2).merge) != null ? _a13 : deepMerge;
    const merged = mergeFn(__privateGet(this, _value4), partial);
    __privateMethod(this, _StoreImpl_instances, setState_fn).call(this, merged, []);
  }
  reset(path) {
    if (path === void 0) {
      __privateMethod(this, _StoreImpl_instances, setState_fn).call(this, deepClone(__privateGet(this, _initialValue2)), []);
    } else {
      const keys = parsePath(path);
      const initialValue = getPath(__privateGet(this, _initialValue2), keys);
      this.set(path, initialValue);
    }
  }
  subscribe(pathOrCallback, callback) {
    if (typeof pathOrCallback === "function") {
      const handler = (e) => {
        const change = e.detail;
        pathOrCallback(__privateGet(this, _value4), change);
      };
      this.addEventListener("change", handler);
      return () => this.removeEventListener("change", handler);
    } else {
      const pathKey = parsePath(pathOrCallback).join(".");
      if (!__privateGet(this, _pathListeners).has(pathKey)) {
        __privateGet(this, _pathListeners).set(pathKey, /* @__PURE__ */ new Set());
      }
      __privateGet(this, _pathListeners).get(pathKey).add(callback);
      return () => {
        const listeners = __privateGet(this, _pathListeners).get(pathKey);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            __privateGet(this, _pathListeners).delete(pathKey);
          }
        }
      };
    }
  }
  select(selector) {
    return computed(() => selector(this.value));
  }
  effect(pathOrFn, fn) {
    let cleanup;
    if (typeof pathOrFn === "function") {
      const run = () => {
        cleanup == null ? void 0 : cleanup();
        cleanup = pathOrFn(__privateGet(this, _value4));
      };
      run();
      const unsub = this.subscribe(() => run());
      return () => {
        cleanup == null ? void 0 : cleanup();
        unsub();
      };
    } else {
      const path = parsePath(pathOrFn);
      let prevValue = getPath(__privateGet(this, _value4), path);
      const run = () => {
        cleanup == null ? void 0 : cleanup();
        cleanup = fn(getPath(__privateGet(this, _value4), path));
      };
      run();
      const unsub = this.subscribe(() => {
        const newValue = getPath(__privateGet(this, _value4), path);
        if (!Object.is(newValue, prevValue)) {
          prevValue = newValue;
          run();
        }
      });
      return () => {
        cleanup == null ? void 0 : cleanup();
        unsub();
      };
    }
  }
  peek(path) {
    if (path === void 0) {
      return __privateGet(this, _value4);
    }
    return getPath(__privateGet(this, _value4), parsePath(path));
  }
  batch(fn) {
    storeBatchDepth++;
    try {
      fn();
    } finally {
      storeBatchDepth--;
      if (storeBatchDepth === 0) {
        const changes = pendingStoreNotifications.get(this);
        if (changes && changes.length > 0) {
          pendingStoreNotifications.delete(this);
          const mergedChange = {
            path: [],
            prev: changes[0].prevState,
            next: __privateGet(this, _value4),
            prevState: changes[0].prevState,
            nextState: __privateGet(this, _value4)
          };
          this.dispatchEvent(new CustomEvent("change", { detail: mergedChange }));
        }
      }
    }
  }
  get readonly() {
    return this;
  }
  toJSON() {
    return __privateGet(this, _value4);
  }
  get [(_a5 = STORE_BRAND, Symbol.toStringTag)]() {
    return __privateGet(this, _options2).name ? `Store(${__privateGet(this, _options2).name})` : "Store";
  }
};
_value4 = new WeakMap();
_initialValue2 = new WeakMap();
_prev4 = new WeakMap();
_options2 = new WeakMap();
_pathListeners = new WeakMap();
_StoreImpl_instances = new WeakSet();
isFullState_fn = function(value) {
  if (typeof value !== "object" || value === null) return false;
  const stateKeys = Object.keys(__privateGet(this, _value4));
  const valueKeys = Object.keys(value);
  return stateKeys.every((key) => valueKeys.includes(key));
};
setState_fn = function(newState, changedPath) {
  if (__privateGet(this, _value4) === newState) return;
  const prevState = __privateGet(this, _value4);
  __privateSet(this, _prev4, prevState);
  __privateSet(this, _value4, newState);
  const change = {
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
    pendingStoreNotifications.get(this).push(change);
  } else {
    __privateMethod(this, _StoreImpl_instances, notify_fn4).call(this, change);
  }
};
notify_fn4 = function(change) {
  this.dispatchEvent(new CustomEvent("change", { detail: change }));
  const pathKey = change.path.join(".");
  const exactListeners = __privateGet(this, _pathListeners).get(pathKey);
  if (exactListeners) {
    exactListeners.forEach((cb) => cb(change.next, change.prev));
  }
  for (let i = change.path.length - 1; i >= 0; i--) {
    const parentPath = change.path.slice(0, i).join(".");
    const parentListeners = __privateGet(this, _pathListeners).get(parentPath);
    if (parentListeners) {
      const value = parentPath ? getPath(__privateGet(this, _value4), change.path.slice(0, i)) : __privateGet(this, _value4);
      const prev = parentPath ? getPath(__privateGet(this, _prev4), change.path.slice(0, i)) : __privateGet(this, _prev4);
      parentListeners.forEach((cb) => cb(value, prev));
    }
  }
  const rootListeners = __privateGet(this, _pathListeners).get("");
  if (rootListeners) {
    rootListeners.forEach((cb) => cb(__privateGet(this, _value4), __privateGet(this, _prev4)));
  }
};
function store(initial, options) {
  return new StoreImpl(initial, options);
}
function isStore(value) {
  return value !== null && typeof value === "object" && STORE_BRAND in value && value[STORE_BRAND] === true;
}

// src/signals/dom.ts
var COMPONENT_NODE = Symbol.for("doeixd.dom.componentNode");
function unwrap(reactive) {
  if (reactive === null || reactive === void 0) {
    return reactive;
  }
  if (typeof reactive === "object" && "value" in reactive) {
    return reactive.value;
  }
  if (typeof reactive === "function") {
    return reactive();
  }
  return reactive;
}
function isReactive(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "object" && "value" in value) return true;
  if (typeof value === "function") return true;
  return false;
}
function removeNode(node) {
  var _a13;
  (_a13 = node.parentNode) == null ? void 0 : _a13.removeChild(node);
}
function lisIndices(arr) {
  const tails = [];
  const prev = new Array(arr.length).fill(-1);
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < 0) continue;
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (arr[tails[mid]] < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    tails[lo] = i;
  }
  const result = /* @__PURE__ */ new Set();
  let k = tails.length > 0 ? tails[tails.length - 1] : -1;
  while (k >= 0) {
    result.add(k);
    k = prev[k];
  }
  return result;
}
function createReactiveEffect(reactive, callback) {
  if (!isReactive(reactive)) {
    callback(reactive);
    return () => {
    };
  }
  return effect(() => {
    callback(unwrap(reactive));
  });
}
var PART_BRAND = Symbol("part");
var _a6, _source, _value5, _isOverridden2, _node, _cleanup;
_a6 = PART_BRAND;
var TextPartImpl = class {
  constructor(source) {
    this[_a6] = true;
    this.type = "text";
    __privateAdd(this, _source);
    __privateAdd(this, _value5);
    __privateAdd(this, _isOverridden2, false);
    __privateAdd(this, _node, null);
    __privateAdd(this, _cleanup, null);
    __privateSet(this, _source, source);
    __privateSet(this, _value5, unwrap(source));
  }
  get value() {
    return __privateGet(this, _value5);
  }
  get isOverridden() {
    return __privateGet(this, _isOverridden2);
  }
  set(value) {
    __privateSet(this, _value5, value);
    __privateSet(this, _isOverridden2, true);
    if (__privateGet(this, _node)) {
      __privateGet(this, _node).textContent = value;
    }
  }
  reset() {
    __privateSet(this, _isOverridden2, false);
    __privateSet(this, _value5, unwrap(__privateGet(this, _source)));
    if (__privateGet(this, _node)) {
      __privateGet(this, _node).textContent = __privateGet(this, _value5);
    }
  }
  bind(element) {
    __privateSet(this, _node, document.createTextNode(__privateGet(this, _value5)));
    element.appendChild(__privateGet(this, _node));
    if (isReactive(__privateGet(this, _source))) {
      __privateSet(this, _cleanup, createReactiveEffect(__privateGet(this, _source), (value) => {
        if (!__privateGet(this, _isOverridden2)) {
          __privateSet(this, _value5, value);
          if (__privateGet(this, _node)) {
            __privateGet(this, _node).textContent = value;
          }
        }
      }));
    }
    return () => {
      var _a13, _b2;
      (_a13 = __privateGet(this, _cleanup)) == null ? void 0 : _a13.call(this);
      (_b2 = __privateGet(this, _node)) == null ? void 0 : _b2.remove();
      __privateSet(this, _node, null);
    };
  }
  createNode() {
    return document.createTextNode(__privateGet(this, _value5));
  }
};
_source = new WeakMap();
_value5 = new WeakMap();
_isOverridden2 = new WeakMap();
_node = new WeakMap();
_cleanup = new WeakMap();
var _a7, _source2, _value6, _isOverridden3, _element, _cleanup2, _AttrPartImpl_instances, apply_fn;
_a7 = PART_BRAND;
var AttrPartImpl = class {
  constructor(name, source) {
    __privateAdd(this, _AttrPartImpl_instances);
    this[_a7] = true;
    this.type = "attr";
    __privateAdd(this, _source2);
    __privateAdd(this, _value6);
    __privateAdd(this, _isOverridden3, false);
    __privateAdd(this, _element, null);
    __privateAdd(this, _cleanup2, null);
    this.name = name;
    __privateSet(this, _source2, source);
    __privateSet(this, _value6, unwrap(source));
  }
  get value() {
    return __privateGet(this, _value6);
  }
  get isOverridden() {
    return __privateGet(this, _isOverridden3);
  }
  set(value) {
    __privateSet(this, _value6, value);
    __privateSet(this, _isOverridden3, true);
    __privateMethod(this, _AttrPartImpl_instances, apply_fn).call(this);
  }
  reset() {
    __privateSet(this, _isOverridden3, false);
    __privateSet(this, _value6, unwrap(__privateGet(this, _source2)));
    __privateMethod(this, _AttrPartImpl_instances, apply_fn).call(this);
  }
  bind(element) {
    __privateSet(this, _element, element);
    __privateMethod(this, _AttrPartImpl_instances, apply_fn).call(this);
    if (isReactive(__privateGet(this, _source2))) {
      __privateSet(this, _cleanup2, createReactiveEffect(__privateGet(this, _source2), (value) => {
        if (!__privateGet(this, _isOverridden3)) {
          __privateSet(this, _value6, value);
          __privateMethod(this, _AttrPartImpl_instances, apply_fn).call(this);
        }
      }));
    }
    return () => {
      var _a13;
      (_a13 = __privateGet(this, _cleanup2)) == null ? void 0 : _a13.call(this);
      __privateSet(this, _element, null);
    };
  }
};
_source2 = new WeakMap();
_value6 = new WeakMap();
_isOverridden3 = new WeakMap();
_element = new WeakMap();
_cleanup2 = new WeakMap();
_AttrPartImpl_instances = new WeakSet();
apply_fn = function() {
  if (!__privateGet(this, _element)) return;
  if (__privateGet(this, _value6) === null || __privateGet(this, _value6) === false) {
    __privateGet(this, _element).removeAttribute(this.name);
  } else if (__privateGet(this, _value6) === true) {
    __privateGet(this, _element).setAttribute(this.name, "");
  } else {
    __privateGet(this, _element).setAttribute(this.name, String(__privateGet(this, _value6)));
  }
};
var _a8, _source3, _value7, _isOverridden4, _element2, _cleanup3, _PropPartImpl_instances, apply_fn2;
_a8 = PART_BRAND;
var PropPartImpl = class {
  constructor(name, source) {
    __privateAdd(this, _PropPartImpl_instances);
    this[_a8] = true;
    this.type = "prop";
    __privateAdd(this, _source3);
    __privateAdd(this, _value7);
    __privateAdd(this, _isOverridden4, false);
    __privateAdd(this, _element2, null);
    __privateAdd(this, _cleanup3, null);
    this.name = name;
    __privateSet(this, _source3, source);
    __privateSet(this, _value7, unwrap(source));
  }
  get value() {
    return __privateGet(this, _value7);
  }
  get isOverridden() {
    return __privateGet(this, _isOverridden4);
  }
  set(value) {
    __privateSet(this, _value7, value);
    __privateSet(this, _isOverridden4, true);
    __privateMethod(this, _PropPartImpl_instances, apply_fn2).call(this);
  }
  reset() {
    __privateSet(this, _isOverridden4, false);
    __privateSet(this, _value7, unwrap(__privateGet(this, _source3)));
    __privateMethod(this, _PropPartImpl_instances, apply_fn2).call(this);
  }
  bind(element) {
    __privateSet(this, _element2, element);
    __privateMethod(this, _PropPartImpl_instances, apply_fn2).call(this);
    if (isReactive(__privateGet(this, _source3))) {
      __privateSet(this, _cleanup3, createReactiveEffect(__privateGet(this, _source3), (value) => {
        if (!__privateGet(this, _isOverridden4)) {
          __privateSet(this, _value7, value);
          __privateMethod(this, _PropPartImpl_instances, apply_fn2).call(this);
        }
      }));
    }
    return () => {
      var _a13;
      (_a13 = __privateGet(this, _cleanup3)) == null ? void 0 : _a13.call(this);
      __privateSet(this, _element2, null);
    };
  }
};
_source3 = new WeakMap();
_value7 = new WeakMap();
_isOverridden4 = new WeakMap();
_element2 = new WeakMap();
_cleanup3 = new WeakMap();
_PropPartImpl_instances = new WeakSet();
apply_fn2 = function() {
  if (!__privateGet(this, _element2)) return;
  __privateGet(this, _element2)[this.name] = __privateGet(this, _value7);
};
var _a9, _sources, _values, _overrides, _element3, _cleanups3, _ClassPartImpl_instances, applyClass_fn;
_a9 = PART_BRAND;
var ClassPartImpl = class {
  constructor(classes) {
    __privateAdd(this, _ClassPartImpl_instances);
    this[_a9] = true;
    this.type = "class";
    __privateAdd(this, _sources, /* @__PURE__ */ new Map());
    __privateAdd(this, _values, /* @__PURE__ */ new Map());
    __privateAdd(this, _overrides, /* @__PURE__ */ new Set());
    __privateAdd(this, _element3, null);
    __privateAdd(this, _cleanups3, []);
    if (typeof classes === "string" || typeof classes === "function" || typeof classes === "object" && "value" in classes) {
      const source = classes;
      const value = unwrap(source);
      value.split(/\s+/).filter(Boolean).forEach((name) => {
        __privateGet(this, _sources).set(name, true);
        __privateGet(this, _values).set(name, true);
      });
    } else {
      for (const [name, source] of Object.entries(classes)) {
        __privateGet(this, _sources).set(name, source);
        __privateGet(this, _values).set(name, unwrap(source));
      }
    }
  }
  get value() {
    const result = {};
    for (const [name, value] of __privateGet(this, _values)) {
      result[name] = value;
    }
    return result;
  }
  get isOverridden() {
    return __privateGet(this, _overrides).size > 0;
  }
  set(value) {
    for (const [name, enabled] of Object.entries(value)) {
      __privateGet(this, _values).set(name, enabled);
      __privateGet(this, _overrides).add(name);
      __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, enabled);
    }
  }
  toggle(name, force) {
    var _a13;
    const current = (_a13 = __privateGet(this, _values).get(name)) != null ? _a13 : false;
    const next = force != null ? force : !current;
    __privateGet(this, _values).set(name, next);
    __privateGet(this, _overrides).add(name);
    __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, next);
  }
  add(...names) {
    for (const name of names) {
      __privateGet(this, _values).set(name, true);
      __privateGet(this, _overrides).add(name);
      __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, true);
    }
  }
  remove(...names) {
    for (const name of names) {
      __privateGet(this, _values).set(name, false);
      __privateGet(this, _overrides).add(name);
      __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, false);
    }
  }
  reset() {
    for (const name of __privateGet(this, _overrides)) {
      const source = __privateGet(this, _sources).get(name);
      if (source !== void 0) {
        const value = unwrap(source);
        __privateGet(this, _values).set(name, value);
        __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, value);
      }
    }
    __privateGet(this, _overrides).clear();
  }
  bind(element) {
    __privateSet(this, _element3, element);
    for (const [name, value] of __privateGet(this, _values)) {
      __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, value);
    }
    for (const [name, source] of __privateGet(this, _sources)) {
      if (isReactive(source)) {
        const cleanup = createReactiveEffect(source, (value) => {
          if (!__privateGet(this, _overrides).has(name)) {
            __privateGet(this, _values).set(name, value);
            __privateMethod(this, _ClassPartImpl_instances, applyClass_fn).call(this, name, value);
          }
        });
        __privateGet(this, _cleanups3).push(cleanup);
      }
    }
    return () => {
      __privateGet(this, _cleanups3).forEach((fn) => fn());
      __privateSet(this, _cleanups3, []);
      __privateSet(this, _element3, null);
    };
  }
};
_sources = new WeakMap();
_values = new WeakMap();
_overrides = new WeakMap();
_element3 = new WeakMap();
_cleanups3 = new WeakMap();
_ClassPartImpl_instances = new WeakSet();
applyClass_fn = function(name, enabled) {
  if (!__privateGet(this, _element3)) return;
  __privateGet(this, _element3).classList.toggle(name, enabled);
};
var _a10, _sources2, _values2, _overrides2, _element4, _cleanups4, _StylePartImpl_instances, applyStyle_fn;
_a10 = PART_BRAND;
var StylePartImpl = class {
  constructor(styles) {
    __privateAdd(this, _StylePartImpl_instances);
    this[_a10] = true;
    this.type = "style";
    __privateAdd(this, _sources2, /* @__PURE__ */ new Map());
    __privateAdd(this, _values2, /* @__PURE__ */ new Map());
    __privateAdd(this, _overrides2, /* @__PURE__ */ new Set());
    __privateAdd(this, _element4, null);
    __privateAdd(this, _cleanups4, []);
    for (const [prop2, source] of Object.entries(styles)) {
      if (source !== void 0) {
        __privateGet(this, _sources2).set(prop2, source);
        const value = unwrap(source);
        __privateGet(this, _values2).set(prop2, String(value));
      }
    }
  }
  get value() {
    const result = {};
    for (const [prop2, value] of __privateGet(this, _values2)) {
      result[prop2] = value;
    }
    return result;
  }
  get isOverridden() {
    return __privateGet(this, _overrides2).size > 0;
  }
  set(value) {
    for (const [prop2, val] of Object.entries(value)) {
      if (val !== void 0) {
        __privateGet(this, _values2).set(prop2, String(val));
        __privateGet(this, _overrides2).add(prop2);
        __privateMethod(this, _StylePartImpl_instances, applyStyle_fn).call(this, prop2, String(val));
      }
    }
  }
  setProperty(name, value) {
    __privateGet(this, _values2).set(name, value);
    __privateGet(this, _overrides2).add(name);
    __privateMethod(this, _StylePartImpl_instances, applyStyle_fn).call(this, name, value);
  }
  reset() {
    for (const name of __privateGet(this, _overrides2)) {
      const source = __privateGet(this, _sources2).get(name);
      if (source !== void 0) {
        const value = String(unwrap(source));
        __privateGet(this, _values2).set(name, value);
        __privateMethod(this, _StylePartImpl_instances, applyStyle_fn).call(this, name, value);
      }
    }
    __privateGet(this, _overrides2).clear();
  }
  bind(element) {
    __privateSet(this, _element4, element);
    for (const [prop2, value] of __privateGet(this, _values2)) {
      __privateMethod(this, _StylePartImpl_instances, applyStyle_fn).call(this, prop2, value);
    }
    for (const [prop2, source] of __privateGet(this, _sources2)) {
      if (isReactive(source)) {
        const cleanup = createReactiveEffect(source, (value) => {
          if (!__privateGet(this, _overrides2).has(prop2)) {
            const strValue = String(value);
            __privateGet(this, _values2).set(prop2, strValue);
            __privateMethod(this, _StylePartImpl_instances, applyStyle_fn).call(this, prop2, strValue);
          }
        });
        __privateGet(this, _cleanups4).push(cleanup);
      }
    }
    return () => {
      __privateGet(this, _cleanups4).forEach((fn) => fn());
      __privateSet(this, _cleanups4, []);
      __privateSet(this, _element4, null);
    };
  }
};
_sources2 = new WeakMap();
_values2 = new WeakMap();
_overrides2 = new WeakMap();
_element4 = new WeakMap();
_cleanups4 = new WeakMap();
_StylePartImpl_instances = new WeakSet();
applyStyle_fn = function(prop2, value) {
  if (!__privateGet(this, _element4)) return;
  if (prop2.startsWith("--")) {
    __privateGet(this, _element4).style.setProperty(prop2, value);
  } else {
    __privateGet(this, _element4).style[prop2] = value;
  }
};
var _a11, _handler, _isOverridden5, _element5, _boundHandler, _EventPartImpl_instances, addListener_fn, removeListener_fn;
_a11 = PART_BRAND;
var EventPartImpl = class {
  constructor(eventName, handler) {
    __privateAdd(this, _EventPartImpl_instances);
    this[_a11] = true;
    this.type = "event";
    __privateAdd(this, _handler);
    __privateAdd(this, _isOverridden5, false);
    __privateAdd(this, _element5, null);
    __privateAdd(this, _boundHandler, null);
    this.eventName = eventName;
    __privateSet(this, _handler, handler);
  }
  get value() {
    return __privateGet(this, _handler);
  }
  get isOverridden() {
    return __privateGet(this, _isOverridden5);
  }
  set(handler) {
    __privateMethod(this, _EventPartImpl_instances, removeListener_fn).call(this);
    __privateSet(this, _handler, handler);
    __privateSet(this, _isOverridden5, true);
    __privateMethod(this, _EventPartImpl_instances, addListener_fn).call(this);
  }
  reset() {
    __privateSet(this, _isOverridden5, false);
  }
  bind(element) {
    __privateSet(this, _element5, element);
    __privateMethod(this, _EventPartImpl_instances, addListener_fn).call(this);
    return () => {
      __privateMethod(this, _EventPartImpl_instances, removeListener_fn).call(this);
      __privateSet(this, _element5, null);
    };
  }
};
_handler = new WeakMap();
_isOverridden5 = new WeakMap();
_element5 = new WeakMap();
_boundHandler = new WeakMap();
_EventPartImpl_instances = new WeakSet();
addListener_fn = function() {
  if (!__privateGet(this, _element5) || !__privateGet(this, _handler)) return;
  __privateSet(this, _boundHandler, (e) => {
    var _a13;
    return (_a13 = __privateGet(this, _handler)) == null ? void 0 : _a13.call(this, e);
  });
  __privateGet(this, _element5).addEventListener(this.eventName, __privateGet(this, _boundHandler));
};
removeListener_fn = function() {
  if (!__privateGet(this, _element5) || !__privateGet(this, _boundHandler)) return;
  __privateGet(this, _element5).removeEventListener(this.eventName, __privateGet(this, _boundHandler));
  __privateSet(this, _boundHandler, null);
};
var _a12, _callback, _current, _isOverridden6;
_a12 = PART_BRAND;
var RefPartImpl = class {
  constructor(callback) {
    this[_a12] = true;
    this.type = "ref";
    __privateAdd(this, _callback);
    __privateAdd(this, _current, null);
    __privateAdd(this, _isOverridden6, false);
    __privateSet(this, _callback, callback);
  }
  get value() {
    return __privateGet(this, _callback);
  }
  get current() {
    return __privateGet(this, _current);
  }
  get isOverridden() {
    return __privateGet(this, _isOverridden6);
  }
  set(callback) {
    var _a13;
    __privateSet(this, _callback, callback);
    __privateSet(this, _isOverridden6, true);
    if (__privateGet(this, _current)) {
      (_a13 = __privateGet(this, _callback)) == null ? void 0 : _a13.call(this, __privateGet(this, _current));
    }
  }
  reset() {
    __privateSet(this, _isOverridden6, false);
  }
  bind(element) {
    var _a13;
    __privateSet(this, _current, element);
    (_a13 = __privateGet(this, _callback)) == null ? void 0 : _a13.call(this, __privateGet(this, _current));
    return () => {
      var _a14;
      (_a14 = __privateGet(this, _callback)) == null ? void 0 : _a14.call(this, null);
      __privateSet(this, _current, null);
    };
  }
};
_callback = new WeakMap();
_current = new WeakMap();
_isOverridden6 = new WeakMap();
function renderNode(node, parent) {
  const cleanups = [];
  if (node === null || node === void 0) {
    return cleanups;
  }
  if (typeof node === "string" || typeof node === "number") {
    parent.appendChild(document.createTextNode(String(node)));
    return cleanups;
  }
  if ("nodeType" in node) {
    switch (node.nodeType) {
      case "element":
        cleanups.push(...renderElement(node, parent));
        break;
      case "text":
        cleanups.push(...renderText(node, parent));
        break;
      case "fragment":
        cleanups.push(...renderFragment(node, parent));
        break;
      case "portal":
        cleanups.push(...renderPortal(node));
        break;
      case "conditional":
        cleanups.push(...renderConditional(node, parent));
        break;
      case "list":
        cleanups.push(...renderList(node, parent));
        break;
    }
  }
  return cleanups;
}
var SVG_TAGS = /* @__PURE__ */ new Set([
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view"
]);
function renderElement(view, parent) {
  const cleanups = [];
  const element = view.tag.includes("-") ? document.createElement(view.tag) : SVG_TAGS.has(view.tag) ? document.createElementNS("http://www.w3.org/2000/svg", view.tag) : document.createElement(view.tag);
  for (const part of view.parts) {
    cleanups.push(part.bind(element));
  }
  for (const child of view.children) {
    cleanups.push(...renderNode(child, element));
  }
  parent.appendChild(element);
  return cleanups;
}
function renderText(view, parent) {
  const cleanups = [];
  const textNode2 = document.createTextNode(unwrap(view.content));
  parent.appendChild(textNode2);
  if (isReactive(view.content)) {
    cleanups.push(createReactiveEffect(view.content, (value) => {
      textNode2.textContent = value;
    }));
  }
  return cleanups;
}
function renderFragment(view, parent) {
  const cleanups = [];
  for (const child of view.children) {
    cleanups.push(...renderNode(child, parent));
  }
  return cleanups;
}
function renderPortal(view) {
  const cleanups = [];
  const target = typeof view.target === "string" ? document.querySelector(view.target) : view.target;
  if (!target) {
    console.warn(`Portal target not found: ${view.target}`);
    return cleanups;
  }
  const fragment2 = document.createDocumentFragment();
  for (const child of view.children) {
    cleanups.push(...renderNode(child, fragment2));
  }
  const nodes = Array.from(fragment2.childNodes);
  target.appendChild(fragment2);
  cleanups.push(() => {
    nodes.forEach(removeNode);
  });
  return cleanups;
}
function renderConditional(view, parent) {
  const cleanups = [];
  const marker = document.createComment("conditional");
  parent.appendChild(marker);
  let currentNodes = [];
  let currentCleanups = [];
  const update = (condition) => {
    currentCleanups.forEach((fn) => fn());
    currentCleanups = [];
    currentNodes.forEach(removeNode);
    currentNodes = [];
    const branch = condition ? view.then : view.else;
    if (branch) {
      const fragment2 = document.createDocumentFragment();
      currentCleanups = renderNode(branch, fragment2);
      currentNodes = Array.from(fragment2.childNodes);
      marker.after(...currentNodes);
    }
  };
  update(unwrap(view.condition));
  if (isReactive(view.condition)) {
    cleanups.push(createReactiveEffect(view.condition, update));
  }
  cleanups.push(() => {
    currentCleanups.forEach((fn) => fn());
    currentNodes.forEach(removeNode);
    removeNode(marker);
  });
  return cleanups;
}
function renderList(view, parent) {
  const cleanups = [];
  const startMarker = document.createComment("list-start");
  const endMarker = document.createComment("list-end");
  parent.appendChild(startMarker);
  parent.appendChild(endMarker);
  const renderedItems = /* @__PURE__ */ new Map();
  const getKey = (item, index) => {
    if (view.key) {
      return view.key(item, index);
    }
    return index;
  };
  let prevOrder = [];
  const update = (items) => {
    const newKeys = items.map(getKey);
    const newKeySet = new Set(newKeys);
    for (const [key, { nodes, cleanups: cleanups2 }] of renderedItems) {
      if (!newKeySet.has(key)) {
        cleanups2.forEach((fn) => fn());
        nodes.forEach(removeNode);
        renderedItems.delete(key);
      }
    }
    const oldIndex = new Map(prevOrder.map((k, i) => [k, i]));
    const entries = newKeys.map((key, i) => {
      var _a13;
      let entry = renderedItems.get(key);
      if (!entry) {
        const fragment2 = document.createDocumentFragment();
        const itemCleanups = renderNode(view.render(items[i], i), fragment2);
        entry = { nodes: Array.from(fragment2.childNodes), cleanups: itemCleanups };
        renderedItems.set(key, entry);
      }
      return { entry, old: (_a13 = oldIndex.get(key)) != null ? _a13 : -1 };
    });
    const stable = lisIndices(entries.map((e) => e.old));
    const parent2 = endMarker.parentNode;
    let anchor = endMarker;
    for (let i = entries.length - 1; i >= 0; i--) {
      const { nodes } = entries[i].entry;
      if (nodes.length === 0) continue;
      if (stable.has(i)) {
        anchor = nodes[0];
      } else if (parent2) {
        for (let j = nodes.length - 1; j >= 0; j--) {
          parent2.insertBefore(nodes[j], anchor);
          anchor = nodes[j];
        }
      }
    }
    prevOrder = newKeys;
  };
  update(unwrap(view.items));
  if (isReactive(view.items)) {
    cleanups.push(createReactiveEffect(view.items, update));
  }
  cleanups.push(() => {
    for (const { nodes, cleanups: cleanups2 } of renderedItems.values()) {
      cleanups2.forEach((fn) => fn());
      nodes.forEach(removeNode);
    }
    renderedItems.clear();
    removeNode(startMarker);
    removeNode(endMarker);
  });
  return cleanups;
}
function text(content) {
  return new TextPartImpl(content);
}
function attr(name, value) {
  return new AttrPartImpl(name, value);
}
function attrs(map) {
  return Object.entries(map).map(([name, value]) => attr(name, value));
}
function prop(name, value) {
  return new PropPartImpl(name, value);
}
function cls(classes) {
  return new ClassPartImpl(classes);
}
function style(styles) {
  return new StylePartImpl(styles);
}
function on(eventName, handler) {
  return new EventPartImpl(eventName, handler);
}
function events(map) {
  return Object.entries(map).filter(([_, handler]) => handler !== void 0).map(([name, handler]) => on(name, handler));
}
function ref(callback) {
  return new RefPartImpl(callback);
}
function tag(tagName) {
  return (...parts) => {
    const partsList = [];
    const children = [];
    for (const part of parts) {
      if (part && typeof part === "object" && PART_BRAND in part) {
        partsList.push(part);
      } else {
        children.push(part);
      }
    }
    return {
      nodeType: "element",
      tag: tagName,
      parts: partsList,
      children
    };
  };
}
var tags = new Proxy({}, {
  get(_, tagName) {
    return tag(tagName);
  }
});
function textNode(content) {
  return {
    nodeType: "text",
    content
  };
}
function fragment(...children) {
  return {
    nodeType: "fragment",
    children
  };
}
function portal(target, ...children) {
  return {
    nodeType: "portal",
    target,
    children
  };
}
function when(condition, then, otherwise) {
  return {
    nodeType: "conditional",
    condition,
    then,
    else: otherwise
  };
}
function list(items, render2, key) {
  return {
    nodeType: "list",
    items,
    render: render2,
    key
  };
}
function keyed(key, node) {
  return {
    ...node,
    key
  };
}
function mount(view, container) {
  const target = typeof container === "string" ? document.querySelector(container) : container;
  if (!target) {
    throw new Error(`Mount target not found: ${container}`);
  }
  const fragment2 = document.createDocumentFragment();
  const cleanups = renderNode(view, fragment2);
  fragment2.childNodes.forEach((n) => {
    n[COMPONENT_NODE] = true;
  });
  const element = fragment2.childNodes.length === 1 ? fragment2.firstChild : fragment2;
  target.appendChild(fragment2);
  return {
    element,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    }
  };
}
function render(view) {
  const fragment2 = document.createDocumentFragment();
  const cleanups = renderNode(view, fragment2);
  fragment2.childNodes.forEach((n) => {
    n[COMPONENT_NODE] = true;
  });
  return {
    fragment: fragment2,
    cleanup: () => cleanups.forEach((fn) => fn())
  };
}
function html(strings, ...values) {
  let htmlStr = strings[0];
  const parts = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const marker = `__REACTIVE_${i}__`;
    htmlStr += marker + strings[i + 1];
    parts.push({ index: i, value });
  }
  const template = document.createElement("template");
  template.innerHTML = htmlStr.trim();
  const processNode = (node) => {
    var _a13;
    if (node.nodeType === Node.TEXT_NODE) {
      const text2 = (_a13 = node.textContent) != null ? _a13 : "";
      const match = text2.match(/__REACTIVE_(\d+)__/);
      if (match) {
        const index = parseInt(match[1], 10);
        const part = parts.find((p) => p.index === index);
        if (part && typeof part.value !== "function") {
          return textNode(part.value);
        }
      }
      return text2;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;
      const partsList = [];
      const children = [];
      for (const attribute of Array.from(el.attributes)) {
        const match = attribute.value.match(/__REACTIVE_(\d+)__/);
        if (match) {
          const index = parseInt(match[1], 10);
          const part = parts.find((p) => p.index === index);
          if (part) {
            if (attribute.name.startsWith("on")) {
              const eventName = attribute.name.slice(2);
              partsList.push(on(eventName, part.value));
            } else {
              partsList.push(attr(attribute.name, part.value));
            }
          }
        } else {
          partsList.push(attr(attribute.name, attribute.value));
        }
      }
      for (const child of Array.from(el.childNodes)) {
        const processed = processNode(child);
        if (processed !== null && processed !== void 0 && processed !== "") {
          children.push(processed);
        }
      }
      return {
        nodeType: "element",
        tag: el.tagName.toLowerCase(),
        parts: partsList,
        children
      };
    }
    return null;
  };
  const content = template.content;
  if (content.childNodes.length === 1) {
    return processNode(content.firstChild);
  }
  return {
    nodeType: "fragment",
    children: Array.from(content.childNodes).map(processNode).filter(Boolean)
  };
}

// src/signals/utils.ts
function unwrap2(reactive) {
  if (reactive === null || reactive === void 0) {
    return reactive;
  }
  if (typeof reactive === "object" && "value" in reactive) {
    return reactive.value;
  }
  if (typeof reactive === "function") {
    return reactive();
  }
  return reactive;
}
function isReactive2(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "object" && "value" in value) return true;
  if (typeof value === "function") return true;
  return false;
}
function For(each, renderOrOptions, keyFn) {
  var _a13;
  if (typeof renderOrOptions === "function") {
    return {
      nodeType: "for",
      each,
      render: renderOrOptions,
      keyFn: keyFn != null ? keyFn : (_, i) => i
    };
  }
  return {
    nodeType: "for",
    each,
    render: renderOrOptions.render,
    keyFn: (_a13 = renderOrOptions.key) != null ? _a13 : (_, i) => i,
    fallback: renderOrOptions.fallback
  };
}
function Index(each, render2, options) {
  return {
    nodeType: "index",
    each,
    render: render2,
    fallback: options == null ? void 0 : options.fallback
  };
}
function Show(when2, children, fallbackOrOptions) {
  if (fallbackOrOptions && typeof fallbackOrOptions === "object" && ("fallback" in fallbackOrOptions || "keyed" in fallbackOrOptions)) {
    return {
      nodeType: "show",
      when: when2,
      children,
      fallback: fallbackOrOptions.fallback,
      keyed: fallbackOrOptions.keyed
    };
  }
  return {
    nodeType: "show",
    when: when2,
    children,
    fallback: fallbackOrOptions
  };
}
function Match(value, render2) {
  return { value, render: render2 };
}
function Switch(value, ...casesAndOptions) {
  const cases = [];
  let fallback;
  for (const item of casesAndOptions) {
    if ("value" in item && "render" in item) {
      cases.push(item);
    } else if ("fallback" in item) {
      fallback = item.fallback;
    }
  }
  return {
    nodeType: "switch",
    value,
    cases,
    fallback
  };
}
function Dynamic(component, props) {
  return {
    nodeType: "dynamic",
    component,
    props: props != null ? props : () => ({})
  };
}
function Portal(target, ...children) {
  const nodes = [];
  let options = {};
  for (const child of children) {
    if (child && typeof child === "object" && ("mount" in child || "isSVG" in child)) {
      options = child;
    } else {
      nodes.push(child);
    }
  }
  return {
    nodeType: "portal",
    target,
    children: nodes,
    ...options
  };
}
function ErrorBoundary(children, fallback) {
  return {
    nodeType: "errorBoundary",
    children,
    fallback
  };
}
function Suspense(children, fallback) {
  return {
    nodeType: "suspense",
    children,
    fallback
  };
}
function resource(fetcherOrOptions) {
  const options = typeof fetcherOrOptions === "function" ? { fetcher: fetcherOrOptions } : fetcherOrOptions;
  const state = signal("unresolved");
  const value = signal(options.initialValue);
  const error = signal(void 0);
  const latest = signal(options.initialValue);
  let abortController = null;
  let fetchId = 0;
  const load = async (refetching = false) => {
    var _a13;
    abortController == null ? void 0 : abortController.abort();
    abortController = new AbortController();
    const currentFetchId = ++fetchId;
    const sourceValue = options.source ? unwrap2(options.source) : void 0;
    if (options.lazy && !sourceValue && options.source) {
      return value.peek();
    }
    state.value = refetching ? "refreshing" : "pending";
    error.value = void 0;
    try {
      const result = await options.fetcher(sourceValue, {
        value: value.peek(),
        refetching
      });
      if (currentFetchId !== fetchId) return void 0;
      value.value = result;
      latest.value = result;
      state.value = "ready";
      return result;
    } catch (err) {
      if (currentFetchId !== fetchId) return void 0;
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      state.value = "errored";
      (_a13 = options.onError) == null ? void 0 : _a13.call(options, e);
      return void 0;
    }
  };
  if (!options.lazy || options.source && unwrap2(options.source)) {
    load();
  }
  if (options.source && isReactive2(options.source)) {
    effect(() => {
      const sourceValue = unwrap2(options.source);
      if (!options.lazy || sourceValue) {
        load(state.peek() === "ready");
      }
    });
  }
  const loading = computed(
    () => state.value === "pending" || state.value === "refreshing"
  );
  const resourceFn = () => value.value;
  Object.defineProperties(resourceFn, {
    value: { get: () => value.value },
    loading: { get: () => loading.value },
    error: { get: () => error.value },
    state: { get: () => state.value },
    latest: { get: () => latest.value }
  });
  resourceFn.refetch = (_info) => load(true);
  resourceFn.mutate = (newValue) => {
    const result = typeof newValue === "function" ? newValue(value.peek()) : newValue;
    value.value = result;
    latest.value = result;
    return result;
  };
  return resourceFn;
}
function createAsync(fn, options) {
  const value = signal(options == null ? void 0 : options.initialValue);
  const error = signal(void 0);
  const state = signal("pending");
  const load = async () => {
    state.value = "pending";
    error.value = void 0;
    try {
      value.value = await fn();
      state.value = "ready";
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      state.value = "errored";
    }
  };
  load();
  return {
    get value() {
      return value.value;
    },
    get loading() {
      return state.value === "pending";
    },
    get error() {
      return error.value;
    },
    get state() {
      return state.value;
    },
    refetch: load
  };
}
function paginated(options) {
  var _a13;
  const items = signal([]);
  const page = signal((_a13 = options.initialPage) != null ? _a13 : 1);
  const hasMore = signal(true);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal(void 0);
  const load = async (loadMore = false) => {
    var _a14;
    if (loadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      page.value = (_a14 = options.initialPage) != null ? _a14 : 1;
    }
    error.value = void 0;
    try {
      const sourceValue = options.source ? unwrap2(options.source) : void 0;
      const result = await options.fetcher(page.value, sourceValue);
      if (loadMore) {
        items.value = [...items.value, ...result.data];
      } else {
        items.value = result.data;
      }
      hasMore.value = result.hasMore;
      page.value++;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };
  load();
  return {
    get items() {
      return items.value;
    },
    get loading() {
      return loading.value;
    },
    get loadingMore() {
      return loadingMore.value;
    },
    get error() {
      return error.value;
    },
    get hasMore() {
      return hasMore.value;
    },
    get page() {
      return page.value;
    },
    loadMore: () => load(true),
    refresh: () => load(false),
    reset: () => {
      var _a14;
      items.value = [];
      page.value = (_a14 = options.initialPage) != null ? _a14 : 1;
      hasMore.value = true;
      load();
    }
  };
}
function infinite(options) {
  const items = signal([]);
  const cursor = signal(options.initialCursor);
  const hasMore = signal(true);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal(void 0);
  const load = async (loadMore = false) => {
    if (loadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
      cursor.value = options.initialCursor;
    }
    error.value = void 0;
    try {
      const result = await options.fetcher(loadMore ? cursor.value : options.initialCursor);
      if (loadMore) {
        items.value = [...items.value, ...result.data];
      } else {
        items.value = result.data;
      }
      cursor.value = result.nextCursor;
      hasMore.value = result.nextCursor !== void 0;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  };
  load();
  return {
    get items() {
      return items.value;
    },
    get loading() {
      return loading.value;
    },
    get loadingMore() {
      return loadingMore.value;
    },
    get error() {
      return error.value;
    },
    get hasMore() {
      return hasMore.value;
    },
    get cursor() {
      return cursor.value;
    },
    loadMore: () => load(true),
    refresh: () => load(false)
  };
}
function lazy(loader) {
  let Component = null;
  let promise = null;
  const load = () => {
    if (!promise) {
      promise = loader().then((mod) => {
        Component = mod.default;
      });
    }
    return promise;
  };
  const LazyComponent = (props) => {
    if (Component) {
      return Component(props);
    }
    throw load();
  };
  LazyComponent.preload = load;
  return LazyComponent;
}
function memo(component, areEqual) {
  const equals = areEqual != null ? areEqual : (a, b) => {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => a[key] === b[key]);
  };
  let lastProps = null;
  let lastResult = null;
  return (props) => {
    const currentProps = unwrap2(props);
    if (lastProps && equals(lastProps, currentProps)) {
      return lastResult;
    }
    lastProps = currentProps;
    lastResult = component(currentProps);
    return lastResult;
  };
}
function Repeat(count, render2) {
  return {
    nodeType: "repeat",
    count,
    render: render2
  };
}
function Await(promise, handlers) {
  return {
    nodeType: "await",
    promise,
    ...handlers
  };
}
function Range(endOrOptions, render2) {
  var _a13, _b2;
  if (typeof endOrOptions === "number" || typeof endOrOptions === "function" || typeof endOrOptions === "object" && "value" in endOrOptions) {
    return {
      nodeType: "range",
      start: 0,
      end: endOrOptions,
      step: 1,
      render: render2
    };
  }
  return {
    nodeType: "range",
    start: (_a13 = endOrOptions.start) != null ? _a13 : 0,
    end: endOrOptions.end,
    step: (_b2 = endOrOptions.step) != null ? _b2 : 1,
    render: render2
  };
}
function Entries(object, render2) {
  return {
    nodeType: "entries",
    object,
    render: render2
  };
}
function Keys(object, render2) {
  return {
    nodeType: "entries",
    object,
    render: ([key], index) => render2(key, index)
  };
}
function Values(object, render2) {
  return {
    nodeType: "entries",
    object,
    render: ([, value], index) => render2(value, index)
  };
}
//# sourceMappingURL=signals.js.map
