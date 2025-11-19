"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  $: () => $,
  $$: () => $$,
  Async: () => Async,
  Cookie: () => Cookie,
  CssVar: () => CssVar,
  Data: () => Data,
  Evt: () => Evt,
  Fn: () => Fn,
  Focus: () => Focus,
  Form: () => Form,
  History: () => History,
  Http: () => Http,
  Input: () => Input,
  Key: () => Key,
  Local: () => Local,
  Obj: () => Obj,
  Option: () => Option,
  Params: () => Params,
  Result: () => Result,
  SW: () => SW,
  Session: () => Session,
  Signal: () => Signal,
  Text: () => Text,
  Traverse: () => Traverse,
  ViewTransitions: () => ViewTransitions,
  after: () => after,
  append: () => append,
  batch: () => batch,
  before: () => before,
  bind: () => bind,
  binder: () => binder,
  blur: () => blur,
  clone: () => clone,
  cloneMany: () => cloneMany,
  closest: () => closest,
  cls: () => cls,
  component: () => component,
  computed: () => computed,
  createBus: () => createBus,
  createListenerGroup: () => createListenerGroup,
  createQueue: () => createQueue,
  css: () => css,
  cssTemplate: () => cssTemplate,
  cycleClass: () => cycleClass,
  debounce: () => debounce,
  dispatch: () => dispatch,
  el: () => el,
  empty: () => empty,
  find: () => find,
  findAll: () => findAll,
  focus: () => focus,
  form: () => form,
  groupBy: () => groupBy,
  groupRefs: () => groupRefs,
  html: () => html,
  htmlMany: () => htmlMany,
  injectStyles: () => injectStyles,
  instantiate: () => instantiate,
  isVisible: () => isVisible,
  modify: () => modify,
  nextFrame: () => nextFrame,
  offset: () => offset,
  on: () => on,
  onDelegated: () => onDelegated,
  onMount: () => onMount,
  onReady: () => onReady,
  prepend: () => prepend,
  rect: () => rect,
  refs: () => refs,
  remove: () => remove,
  scrollInto: () => scrollInto,
  store: () => store,
  stripListeners: () => stripListeners,
  tempStyle: () => tempStyle,
  throttle: () => throttle,
  toColorSpace: () => toColorSpace,
  view: () => view,
  wait: () => wait,
  waitFor: () => waitFor,
  waitTransition: () => waitTransition,
  watchAttr: () => watchAttr,
  watchClass: () => watchClass,
  watchText: () => watchText,
  wrap: () => wrap
});
module.exports = __toCommonJS(src_exports);
var _nodes = (args) => args.flat().filter((x) => x != null && x !== false).map((x) => x instanceof Node ? x : document.createTextNode(String(x)));
var find = (root = document) => {
  return (selector) => {
    return root.querySelector(selector);
  };
};
var findAll = (root = document) => {
  return (selector) => {
    return Array.from(root.querySelectorAll(selector));
  };
};
var closest = (element) => {
  return (selector) => {
    return element == null ? void 0 : element.closest(selector);
  };
};
var on = (target) => {
  return (eventType, handler, options = false) => {
    if (!target) return () => {
    };
    const listener = (e) => handler(e, target);
    target.addEventListener(eventType, listener, options);
    return () => target.removeEventListener(eventType, listener, options);
  };
};
var onDelegated = (root) => {
  return (eventType, selector, handler, options = false) => {
    if (!root) return () => {
    };
    const listener = (e) => {
      var _a;
      const target = e.target;
      const match = (_a = target == null ? void 0 : target.closest) == null ? void 0 : _a.call(target, selector);
      if (match && root.contains(match)) {
        handler(e, match);
      }
    };
    root.addEventListener(eventType, listener, options);
    return () => root.removeEventListener(eventType, listener, options);
  };
};
var dispatch = (target) => {
  return (eventName, detail, options = { bubbles: true }) => {
    if (target) {
      target.dispatchEvent(new CustomEvent(eventName, { detail, ...options }));
    }
    return target;
  };
};
var modify = (element) => {
  return (props) => {
    if (!element) return null;
    if (props.text !== void 0) element.innerText = props.text;
    if (props.html !== void 0) element.innerHTML = props.html;
    if (props.value !== void 0) element.value = props.value;
    if (props.disabled !== void 0) element.disabled = props.disabled;
    if (props.style) Object.assign(element.style, props.style);
    if (props.dataset) {
      Object.entries(props.dataset).forEach(([k, v]) => {
        if (v === void 0) return;
        element.dataset[k] = v === null ? void 0 : String(v);
      });
    }
    if (props.class) {
      Object.entries(props.class).forEach(([k, v]) => element.classList.toggle(k, !!v));
    }
    if (props.attr) {
      Object.entries(props.attr).forEach(([k, v]) => {
        if (v === false || v === null || v === void 0) element.removeAttribute(k);
        else element.setAttribute(k, String(v));
      });
    }
    return element;
  };
};
var css = (element) => {
  return (styles) => {
    if (element) Object.assign(element.style, styles);
    return element;
  };
};
var tempStyle = (element) => {
  return (styles) => {
    if (!element) return () => {
    };
    const original = {};
    Object.keys(styles).forEach((key) => {
      original[key] = element.style[key];
    });
    Object.assign(element.style, styles);
    return () => Object.assign(element.style, original);
  };
};
var append = (parent) => {
  return (...content) => {
    parent == null ? void 0 : parent.append(..._nodes(content));
    return parent;
  };
};
var prepend = (parent) => {
  return (...content) => {
    parent == null ? void 0 : parent.prepend(..._nodes(content));
    return parent;
  };
};
var after = (target) => {
  return (...content) => {
    target == null ? void 0 : target.after(..._nodes(content));
    return target;
  };
};
var before = (target) => {
  return (...content) => {
    target == null ? void 0 : target.before(..._nodes(content));
    return target;
  };
};
var remove = (target) => {
  target == null ? void 0 : target.remove();
  return null;
};
var empty = (target) => {
  if (target) target.replaceChildren();
  return target;
};
var wrap = (target) => {
  return (wrapper) => {
    if (target && wrapper && target.parentNode) {
      target.parentNode.insertBefore(wrapper, target);
      wrapper.appendChild(target);
    }
    return wrapper;
  };
};
var el = (tag) => {
  return (props = {}) => {
    return (children = []) => {
      const node = document.createElement(tag);
      modify(node)(props);
      node.append(..._nodes(children));
      return node;
    };
  };
};
var html = (strings, ...values) => {
  const str = strings.reduce((acc, s, i) => {
    var _a;
    return acc + s + ((_a = values[i]) != null ? _a : "");
  }, "");
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  const el2 = tpl.content.firstElementChild;
  if (!el2) throw new Error("html: Template did not result in an element");
  return el2;
};
var htmlMany = (strings, ...values) => {
  const str = strings.reduce((acc, s, i) => {
    var _a;
    return acc + s + ((_a = values[i]) != null ? _a : "");
  }, "");
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content;
};
var clone = (node) => {
  return (deep = true) => {
    return node ? node.cloneNode(deep) : null;
  };
};
var cls = {
  /**
   * Adds one or more CSS classes to the element.
   * 
   * @param el - The element to add classes to (null-safe)
   * @returns A curried function that accepts class names and returns the element
   * 
   * @example
   * ```typescript
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
  add: (el2) => (...classes) => {
    el2 == null ? void 0 : el2.classList.add(...classes);
    return el2;
  },
  /**
   * Removes one or more CSS classes from the element.
   * 
   * @param el - The element to remove classes from (null-safe)
   * @returns A curried function that accepts class names and returns the element
   * 
   * @example
   * ```typescript
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
  remove: (el2) => (...classes) => {
    el2 == null ? void 0 : el2.classList.remove(...classes);
    return el2;
  },
  /**
   * Toggles a CSS class on the element.
   * 
   * @param el - The element to toggle the class on (null-safe)
   * @returns A curried function that accepts class name and optional force flag
   * 
   * @example
   * ```typescript
   * // Basic toggle
   * cls.toggle(div)('active'); // Adds if absent, removes if present
   * 
   * // Force add
   * cls.toggle(div)('active', true); // Always adds
   * 
   * // Force remove
   * cls.toggle(div)('active', false); // Always removes
   * 
   * // Conditional toggle
   * cls.toggle(button)('disabled', isLoading);
   * ```
   */
  toggle: (el2) => (className, force) => {
    el2 == null ? void 0 : el2.classList.toggle(className, force);
    return el2;
  },
  /**
   * Replaces an old class with a new class.
   * 
   * @param el - The element to modify (null-safe)
   * @returns A curried function that accepts old and new class names
   * 
   * @example
   * ```typescript
   * // Replace theme class
   * cls.replace(div)('theme-light', 'theme-dark');
   * 
   * // Replace state class
   * cls.replace(button)('btn-primary', 'btn-secondary');
   * 
   * // No effect if old class doesn't exist
   * cls.replace(div)('nonexistent', 'new'); // No change
   * ```
   */
  replace: (el2) => (oldClass, newClass) => {
    el2 == null ? void 0 : el2.classList.replace(oldClass, newClass);
    return el2;
  },
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
  has: (el2) => (className) => {
    return !!el2 && el2.classList.contains(className);
  }
};
var watchClass = (target) => {
  return (className, callback) => {
    if (!target) return () => {
    };
    let was = target.classList.contains(className);
    const obs = new MutationObserver(() => {
      const is = target.classList.contains(className);
      if (is !== was) {
        was = is;
        callback(is, target);
      }
    });
    obs.observe(target, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  };
};
var toDataAttr = (str) => "data-" + str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
var Data = {
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
  get: (el2) => (key) => el2 == null ? void 0 : el2.dataset[key],
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
   * // Set string
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
  set: (el2) => (key, val) => {
    if (!el2) return el2;
    if (val == null) delete el2.dataset[key];
    else el2.dataset[key] = typeof val === "object" ? JSON.stringify(val) : String(val);
    return el2;
  },
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
  read: (el2) => (key) => {
    if (!el2 || !(key in (el2.dataset || {}))) return void 0;
    const val = el2.dataset[key];
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === "null") return null;
    if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
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
   * // Watch for changes
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
  bind: (el2) => (key, callback) => {
    if (!el2) return () => {
    };
    const attr = toDataAttr(key);
    const update = () => callback(Data.read(el2)(key), el2);
    update();
    const obs = new MutationObserver((m) => {
      if (m.some((x) => x.attributeName === attr)) update();
    });
    obs.observe(el2, { attributes: true, attributeFilter: [attr] });
    return () => obs.disconnect();
  }
};
var watchAttr = (target) => {
  return (attrs, callback) => {
    if (!target) return () => {
    };
    const obs = new MutationObserver((muts) => muts.forEach((m) => {
      if (m.attributeName) callback(target.getAttribute(m.attributeName), m.attributeName);
    }));
    obs.observe(target, { attributes: true, attributeFilter: Array.isArray(attrs) ? attrs : [attrs] });
    return () => obs.disconnect();
  };
};
var watchText = (target) => {
  return (callback) => {
    if (!target) return () => {
    };
    const obs = new MutationObserver(() => {
      callback(target.textContent || "");
    });
    obs.observe(target, { characterData: true, childList: true, subtree: true });
    return () => obs.disconnect();
  };
};
var onReady = (fn) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
  else fn();
};
var onMount = (selector) => {
  return (handler, root = document, once = false) => {
    const seen = /* @__PURE__ */ new WeakSet();
    let foundAny = false;
    const check = (node) => {
      if (seen.has(node)) return;
      if (node.matches(selector)) {
        seen.add(node);
        handler(node);
        foundAny = true;
      }
      node.querySelectorAll(selector).forEach((c) => {
        if (!seen.has(c)) {
          seen.add(c);
          handler(c);
          foundAny = true;
        }
      });
    };
    root.querySelectorAll(selector).forEach(check);
    const obs = new MutationObserver((muts) => muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) check(n);
      });
    }));
    if (once && foundAny) return () => {
    };
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  };
};
var waitFor = (target) => {
  return (predicate) => {
    return new Promise((resolve) => {
      if (!target) return;
      if (predicate(target)) return resolve(target);
      const obs = new MutationObserver(() => {
        if (predicate(target)) {
          obs.disconnect();
          resolve(target);
        }
      });
      obs.observe(target, { attributes: true, childList: true, subtree: true, characterData: true });
    });
  };
};
var Params = {
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
  get: (key) => new URLSearchParams(window.location.search).get(key),
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
  getAll: (key) => new URLSearchParams(window.location.search).getAll(key),
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
  set: (key) => (val) => (type = "soft") => {
    const u = new URL(window.location.href);
    u.searchParams.set(key, val);
    if (type === "hard") window.location.href = u.href;
    else window.history.pushState(null, "", u.href);
  }
};
var Form = {
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
  serialize: (root) => {
    const data = {};
    if (!root) return data;
    root.querySelectorAll("input, select, textarea").forEach((el2) => {
      if (!el2.name) return;
      if (el2.type === "checkbox") data[el2.name] = el2.checked;
      else if (el2.type === "radio") {
        if (el2.checked) data[el2.name] = el2.value;
      } else if (el2.type === "number") data[el2.name] = Number(el2.value);
      else data[el2.name] = el2.value;
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
   * // Load saved data
   * const savedData = Local.get('formData');
   * if (savedData) Form.populate(form)(savedData);
   * 
   * // Load user profile
   * const user = await Http.get('/api/user');
   * Form.populate(form)({
   *   username: user.username,
   *   email: user.email,
   *   bio: user.bio,
   *   notifications: user.preferences.notifications
   * });
   * 
   * // Reset form to defaults
   * Form.populate(form)({
   *   theme: 'light',
   *   language: 'en',
   *   notifications: true
   * });
   * ```
   */
  populate: (root) => (data) => {
    if (!root) return root;
    Object.entries(data).forEach(([k, v]) => {
      const el2 = root.querySelector(`[name="${k}"]`);
      if (!el2) return;
      if (el2.type === "checkbox" || el2.type === "radio") el2.checked = !!v;
      else el2.value = String(v);
    });
    return root;
  }
};
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var nextFrame = () => new Promise((r) => requestAnimationFrame(r));
var cssTemplate = (strings, ...values) => strings.reduce((acc, s, i) => {
  var _a;
  return acc + s + ((_a = values[i]) != null ? _a : "");
}, "");
var Traverse = {
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
  parent: (el2) => (el2 == null ? void 0 : el2.parentElement) || null,
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
  next: (el2) => el2 == null ? void 0 : el2.nextElementSibling,
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
  prev: (el2) => el2 == null ? void 0 : el2.previousElementSibling,
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
  children: (el2) => el2 ? Array.from(el2.children) : [],
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
  siblings: (el2) => {
    if (!el2 || !el2.parentElement) return [];
    return Array.from(el2.parentElement.children).filter((c) => c !== el2);
  }
};
var CssVar = {
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
  set: (el2) => (name, value) => {
    el2 == null ? void 0 : el2.style.setProperty(name, value);
    return el2;
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
  get: (el2) => (name) => {
    return el2 ? getComputedStyle(el2).getPropertyValue(name).trim() : "";
  }
};
var computed = (el2) => (prop) => {
  if (!el2) return "";
  const value = getComputedStyle(el2)[prop];
  return typeof value === "string" ? value : String(value);
};
var injectStyles = (cssContent, root = document.head) => {
  const style = document.createElement("style");
  style.textContent = cssContent;
  root.appendChild(style);
  return () => style.remove();
};
var waitTransition = (el2) => new Promise((resolve) => {
  if (!el2) return resolve(null);
  const onEnd = () => {
    el2.removeEventListener("transitionend", onEnd);
    el2.removeEventListener("animationend", onEnd);
    resolve(el2);
  };
  el2.addEventListener("transitionend", onEnd);
  el2.addEventListener("animationend", onEnd);
  requestAnimationFrame(() => {
    const s = getComputedStyle(el2);
    if (s.transitionDuration === "0s" && s.animationDuration === "0s") onEnd();
  });
});
var Obj = {
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
  clone: (obj) => {
    try {
      return structuredClone(obj);
    } catch (e) {
      return JSON.parse(JSON.stringify(obj));
    }
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
  isEqual: (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b),
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
  pick: (obj, keys) => {
    const ret = {};
    keys.forEach((k) => {
      if (k in obj) ret[k] = obj[k];
    });
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
  omit: (obj, keys) => {
    const ret = { ...obj };
    keys.forEach((k) => delete ret[k]);
    return ret;
  }
};
var batch = (list) => {
  return (fn) => {
    if (!list) return [];
    const arr = Array.from(list);
    arr.forEach(fn);
    return arr;
  };
};
var groupBy = (list) => {
  return (keyFn) => {
    const groups = {};
    if (!list) return groups;
    Array.from(list).forEach((el2) => {
      const k = keyFn(el2);
      (groups[k] = groups[k] || []).push(el2);
    });
    return groups;
  };
};
var refs = (root) => {
  const r = {};
  if (root) {
    root.querySelectorAll("[data-ref]").forEach((el2) => {
      if (el2.dataset.ref) r[el2.dataset.ref] = el2;
    });
  }
  return r;
};
var groupRefs = (root) => {
  const r = {};
  if (root) {
    root.querySelectorAll("[data-ref]").forEach((el2) => {
      const k = el2.dataset.ref;
      if (k) (r[k] = r[k] || []).push(el2);
    });
  }
  return r;
};
var toColorSpace = (color, space = "srgb") => {
  const div = document.createElement("div");
  div.style.color = `color-mix(in ${space}, ${color} 100%, transparent)`;
  document.body.appendChild(div);
  const res = getComputedStyle(div).color;
  div.remove();
  return res;
};
var cycleClass = (target) => {
  return (classes) => {
    if (!target) return () => {
    };
    return () => {
      const currentIdx = classes.findIndex((c) => target.classList.contains(c));
      if (currentIdx > -1) target.classList.remove(classes[currentIdx]);
      const nextIdx = (currentIdx + 1) % classes.length;
      target.classList.add(classes[nextIdx]);
    };
  };
};
var stripListeners = (element) => {
  if (!element || !element.parentNode) return element;
  const copy = element.cloneNode(true);
  element.replaceWith(copy);
  return copy;
};
var instantiate = (templateOrSelector) => {
  return (rootProps = {}) => {
    const tpl = typeof templateOrSelector === "string" ? document.querySelector(templateOrSelector) : templateOrSelector;
    if (!tpl || !("content" in tpl)) {
      throw new Error(`instantiate: Invalid template '${templateOrSelector}'`);
    }
    const content = tpl.content.cloneNode(true);
    if (Object.keys(rootProps).length > 0 && content.firstElementChild) {
      modify(content.firstElementChild)(rootProps);
    }
    return content;
  };
};
var cloneMany = (element) => {
  return (count) => {
    if (!element) return [];
    return Array.from({ length: count }).map(() => element.cloneNode(true));
  };
};
var rect = (element) => {
  return element ? element.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
};
var offset = (element) => {
  if (!element) return { top: 0, left: 0 };
  const box = element.getBoundingClientRect();
  const doc = document.documentElement;
  return {
    top: box.top + window.scrollY - doc.clientTop,
    left: box.left + window.scrollX - doc.clientLeft
  };
};
var isVisible = (element) => {
  return !!(element && (element.offsetWidth > 0 || element.offsetHeight > 0));
};
var scrollInto = (element) => {
  return (options = { behavior: "smooth", block: "start" }) => {
    element == null ? void 0 : element.scrollIntoView(options);
    return element;
  };
};
var focus = (element) => {
  return (options) => {
    element == null ? void 0 : element.focus(options);
    return element;
  };
};
var blur = (element) => {
  element == null ? void 0 : element.blur();
  return element;
};
var debounce = (fn, ms) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};
var throttle = (fn, ms) => {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      fn(...args);
      lastTime = now;
    }
  };
};
var createStorage = (provider) => ({
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
  get: (key) => {
    const val = provider.getItem(key);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
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
  set: (key) => (value) => {
    const val = typeof value === "object" ? JSON.stringify(value) : String(value);
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
  remove: (key) => provider.removeItem(key),
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
var Local = createStorage(window.localStorage);
var Session = createStorage(window.sessionStorage);
var Cookie = {
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
  get: (name) => {
    const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
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
  set: (name) => (value) => (options = {}) => {
    let d = /* @__PURE__ */ new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1e3 * (options.days || 0));
    document.cookie = `${name}=${encodeURIComponent(value)};path=${options.path || "/"}` + (options.days ? `;expires=${d.toUTCString()}` : "") + (options.secure ? ";secure" : "");
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
  remove: (name) => {
    Cookie.set(name)("")({ days: -1 });
  }
};
var Http = {
  /**
   * Performs a GET request.
   * 
   * **Response Type**: Automatically parses JSON response. For non-JSON responses,
   * use native fetch() instead.
   * 
   * **Error Handling**: Throws Error with status code and text on non-2xx responses.
   * 
   * @template T - The expected response type
   * @param url - The URL to fetch from
   * @param headers - Optional request headers
   * @returns Promise resolving to parsed JSON response
   * @throws Error if response is not ok (non-2xx status)
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
   * 
   * // With query parameters (use Params utility)
   * const query = Params.encode({ page: 1, limit: 10 });
   * const results = await Http.get<Results>(`/api/search?${query}`);
   * ```
   */
  get: async (url, headers = {}) => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Http.get ${res.status}: ${res.statusText}`);
    return res.json();
  },
  /**
   * Performs a POST request with JSON body.
   * 
   * **Curried API**: Takes URL first, then body, then optional headers.
   * This allows partial application for reusable endpoints.
   * 
   * **Content-Type**: Automatically sets 'application/json'. Override in headers if needed.
   * 
   * @template T - The expected response type
   * @param url - The URL to post to
   * @returns A curried function accepting body
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
   * // Partial application for reusable endpoint
   * const createUser = Http.post('/api/users');
   * const user1 = await createUser({ name: 'Alice' })();
   * const user2 = await createUser({ name: 'Bob' })();
   * 
   * // Form submission
   * const formData = Form.serialize(form);
   * const result = await Http.post('/api/submit')
   *   (formData)
   *   ({ 'Authorization': `Bearer ${token}` });
   * 
   * // Error handling with response body
   * try {
   *   await Http.post('/api/users')({ email: 'invalid' })();
   * } catch (error) {
   *   // Server returned 400: Bad Request
   *   console.error('Validation failed:', error);
   * }
   * ```
   */
  post: (url) => (body) => async (headers = {}) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Http.post ${res.status}: ${res.statusText}`);
    return res.json();
  },
  /**
   * Performs a PUT request with JSON body.
   * 
   * **Use Case**: Typically used for updating existing resources.
   * 
   * **Curried API**: Same pattern as POST - url -> body -> headers.
   * 
   * @template T - The expected response type
   * @param url - The URL to put to
   * @returns A curried function accepting body
   * 
   * @example
   * ```typescript
   * // Update user
   * const updated = await Http.put('/api/users/123')
   *   ({ name: 'John Updated', email: 'new@example.com' })
   *   ({ 'Authorization': `Bearer ${token}` });
   * 
   * // Partial application
   * const updateUser = (id: number) => Http.put(`/api/users/${id}`);
   * await updateUser(123)({ name: 'Alice' })();
   * 
   * // Optimistic update pattern
   * const originalData = { ...userData };
   * modify(userElement)({ text: newName }); // Update UI immediately
   * try {
   *   await Http.put(`/api/users/${id}`)({ name: newName })();
   * } catch (error) {
   *   modify(userElement)({ text: originalData.name }); // Revert on error
   * }
   * ```
   */
  put: (url) => (body) => async (headers = {}) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Http.put ${res.status}: ${res.statusText}`);
    return res.json();
  },
  /**
    * Performs a DELETE request.
    * 
    * **Response**: Many DELETE endpoints return empty responses or confirmation objects.
    * 
    * @template T - The expected response type (often void or { success: boolean })
    * @param url - The URL to delete
    * @param headers - Optional request headers
    * @returns Promise resolving to parsed JSON response
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
    * 
    * // Error handling
    * try {
    *   await Http.delete(`/api/items/${id}`);
    *   remove(itemElement);
    * } catch (error) {
    *   alert('Failed to delete item');
    * }
    * ```
    */
  delete: async (url, headers = {}) => {
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`Http.delete ${res.status}: ${res.statusText}`);
    return res.json();
  }
};
var SW = {
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
  register: async (scriptPath, options) => {
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.register(scriptPath, options);
        return reg;
      } catch (e) {
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
  post: (message) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }
};
var createListenerGroup = () => {
  const unsubs = [];
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
    add: (fn) => {
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
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    }
  };
};
var Signal = {
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
  timeout: (ms) => {
    if ("timeout" in AbortSignal) return AbortSignal.timeout(ms);
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
  wrap: (promise, signal) => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
    return new Promise((resolve, reject) => {
      const abortHandler = () => {
        reject(new DOMException("Aborted", "AbortError"));
        signal.removeEventListener("abort", abortHandler);
      };
      signal.addEventListener("abort", abortHandler);
      promise.then(
        (val) => {
          signal.removeEventListener("abort", abortHandler);
          resolve(val);
        },
        (err) => {
          signal.removeEventListener("abort", abortHandler);
          reject(err);
        }
      );
    });
  }
};
var createBus = () => {
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
    on: (event, handler) => {
      const listener = (e) => handler(e.detail);
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
    emit: (event, data) => {
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
    once: (event, handler) => {
      const listener = (e) => handler(e.detail);
      target.addEventListener(event, listener, { once: true });
    }
  };
};
var $ = (target) => {
  const chain = (fn) => (...args) => {
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
    tempStyle: (styles, ms) => {
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
    remove: () => {
      if (target) remove(target);
    },
    /**
     * Removes all children from this element.
     * @returns {this} Fluent wrapper for chaining
     */
    empty: () => {
      if (target) empty(target);
      return wrapper;
    },
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
    hasClass: (className) => target ? cls.has(target)(className) : false,
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
    dataGet: (key) => target ? Data.get(target)(key) : void 0,
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
    dataRead: (key) => target ? Data.read(target)(key) : void 0,
    /**
     * Binds a callback to data attribute changes.
     * @param key - Attribute to watch
     * @param handler - Callback receiving new parsed value
     * @returns {Unsubscribe} Function to stop watching
     */
    dataBind: (key, handler) => target ? Data.bind(target)(key, handler) : () => {
    },
    /**
     * Watches an attribute for changes.
     * @param attr - Attribute name
     * @param handler - Callback receiving new value
     * @returns {Unsubscribe} Function to stop watching
     */
    watchAttr: (attr, handler) => target ? watchAttr(target)(attr, handler) : () => {
    },
    /**
     * Watches text content for changes.
     * @param handler - Callback receiving new text
     * @returns {Unsubscribe} Function to stop watching
     */
    watchText: (handler) => target ? watchText(target)(handler) : () => {
    },
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
    val: (newVal) => {
      if (newVal === void 0) return Input.get(target);
      Input.set(target)(newVal);
      return wrapper;
    },
    /**
     * Gets files from an input[type="file"].
     * @returns {File[]} Array of files
     */
    files: () => Input.files(target),
    /**
     * Listens for input events (keystrokes).
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onInput: (handler) => target ? Input.watch(target)(handler) : () => {
    },
    /**
     * Listens for input events with debounce.
     * @param ms - Debounce delay in ms
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onInputDebounced: (ms, handler) => target ? Input.watchDebounced(target)(handler, ms) : () => {
    },
    /**
     * Listens for change events (blur/enter).
     * @param handler - Callback receiving parsed value
     * @returns {Unsubscribe} Function to stop listening
     */
    onChange: (handler) => target ? Input.change(target)(handler) : () => {
    },
    /**
     * Selects all text in the input.
     * @returns {this} Fluent wrapper for chaining
     */
    selectText: () => {
      Input.select(target);
      return wrapper;
    },
    /**
     * Validates the input using HTML5 validation API.
     * @returns {boolean} True if valid
     */
    validate: () => target ? Input.validate(target) : false,
    // =========================================
    // KEYBOARD
    // =========================================
    /**
     * Listens for a specific key press.
     * @param key - Key to listen for (e.g., 'Enter', 'Escape')
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onKey: (key, handler) => {
      if (target) Key.is(target)(key, handler);
      return wrapper;
    },
    /**
     * Listens for the Tab key.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onTab: (handler) => {
      if (target) Key.onTab(target)(handler);
      return wrapper;
    },
    /**
     * Listens for Arrow keys.
     * @param handler - Callback receiving direction and event
     * @returns {Unsubscribe} Function to stop listening
     */
    onArrow: (handler) => {
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
    onFocus: (handler) => {
      if (target) Focus.on(target)(handler);
      return wrapper;
    },
    /**
     * Listens for blur event.
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onBlur: (handler) => {
      if (target) Focus.onBlur(target)(handler);
      return wrapper;
    },
    /**
     * Listens for focusin (bubbles).
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onFocusIn: (handler) => {
      if (target) Focus.onIn(target)(handler);
      return wrapper;
    },
    /**
     * Listens for focusout (bubbles).
     * @param handler - Callback function
     * @returns {Unsubscribe} Function to stop listening
     */
    onFocusOut: (handler) => {
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
    clickOutside: (handler) => {
      if (!target) return () => {
      };
      const listener = (e) => {
        if (target && !target.contains(e.target)) handler();
      };
      document.addEventListener("click", listener);
      return () => document.removeEventListener("click", listener);
    },
    /**
     * Checks if element contains text.
     * @param text - String or RegExp to search
     * @returns {boolean} True if found
     */
    hasText: (text) => target ? !!Text.find(target)(text) : false,
    /**
     * Finds the first text node matching the pattern.
     * @param text - String or RegExp to search
     * @param selector - Optional selector to scope search
     * @returns {Text | null} The found text node
     */
    findText: (text, selector) => target ? Text.find(target)(text, selector) : null,
    /**
     * Finds all text nodes matching the pattern.
     * @param text - String or RegExp to search
     * @param selector - Optional selector to scope search
     * @returns {Text[]} Array of found text nodes
     */
    findAllText: (text, selector) => target ? Text.findAll(target)(text, selector) : [],
    /**
     * Replaces text content.
     * @param search - String or RegExp to find
     * @param replace - Replacement string
     * @returns {this} Fluent wrapper for chaining
     */
    replaceText: (search, replace) => {
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
    removeTransitionName: () => {
      ViewTransitions.unname(target);
      return wrapper;
    },
    /**
     * Runs a view transition focusing on this element.
     * @param name - Temporary transition name
     * @param updateFn - Function to run during transition
     * @returns {Promise<void>} Promise resolving when done
     */
    transitionWith: (name, updateFn) => ViewTransitions.tempName(target)(name)(updateFn),
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
    scrollInto: (arg) => {
      target == null ? void 0 : target.scrollIntoView(arg);
      return wrapper;
    },
    /**
     * Focuses the element.
     * @param options - Focus options
     * @returns {this} Fluent wrapper for chaining
     */
    focus: (options) => {
      target == null ? void 0 : target.focus(options);
      return wrapper;
    },
    /**
     * Blurs the element.
     * @returns {this} Fluent wrapper for chaining
     */
    blur: () => {
      target == null ? void 0 : target.blur();
      return wrapper;
    },
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
var component = (rootOrSelector) => {
  const root = typeof rootOrSelector === "string" ? find(document)(rootOrSelector) : rootOrSelector;
  if (!root) return {};
  const nodes = refs(root);
  return {
    root,
    ...nodes
  };
};
var $$ = (selectorOrList) => {
  const elements = typeof selectorOrList === "string" ? findAll(document)(selectorOrList) : Array.from(selectorOrList);
  const map = (fn) => (arg, arg2) => {
    elements.forEach((el2) => fn(el2)(arg, arg2));
    return wrapper;
  };
  const wrapper = {
    raw: elements,
    // Batch Operations
    modify: map(modify),
    css: map(css),
    addClass: map(cls.add),
    removeClass: map(cls.remove),
    toggleClass: map(cls.toggle),
    attr: map((el2) => (attr) => modify(el2)({ attr })),
    // Batch Events
    on: (evt, handler) => {
      const unsubs = elements.map((el2) => on(el2)(evt, handler));
      return () => unsubs.forEach((u) => u());
    },
    // Batch Traversal / Manipulation
    remove: () => elements.forEach((el2) => remove(el2)),
    empty: () => elements.forEach((el2) => empty(el2)),
    // Functional map (standard array map)
    map: (fn) => elements.map(fn),
    filter: (fn) => elements.filter(fn)
  };
  return wrapper;
};
var store = (element) => {
  if (!element) return {};
  return new Proxy({}, {
    get: (_, prop) => Data.read(element)(prop),
    set: (_, prop, value) => {
      Data.set(element)(prop, value);
      return true;
    },
    deleteProperty: (_, prop) => {
      Data.set(element)(prop, null);
      return true;
    },
    // Allow iteration over current dataset
    ownKeys: () => Reflect.ownKeys(element.dataset),
    getOwnPropertyDescriptor: (_, _key) => ({
      enumerable: true,
      configurable: true
    })
  });
};
var form = (target) => {
  const el2 = typeof target === "string" ? find(document)(target) : target;
  return {
    raw: el2,
    /** Get all values as object */
    values: () => Form.serialize(el2),
    /** Set values from object */
    set: (data) => Form.populate(el2)(data),
    /** Clear all inputs */
    clear: () => {
      if (!el2) return;
      el2.querySelectorAll("input, select, textarea").forEach((i) => {
        if (i.type === "checkbox" || i.type === "radio") i.checked = false;
        else i.value = "";
      });
    },
    /** Short hand for on('submit') with preventDefault and serialization */
    submit: (handler) => {
      return on(el2)("submit", (e) => {
        e.preventDefault();
        handler(Form.serialize(el2), e);
      });
    }
  };
};
var Input = {
  /**
   * Smart Getter. Automatically handles:
   * - Checkbox/Radio -> boolean
   * - Number/Range -> number
   * - File -> FileList
   * - Select/Text -> string
   * 
   * @example const val = Input.get(input);
   */
  get: (el2) => {
    if (!el2) return void 0;
    if (el2 instanceof HTMLInputElement) {
      if (el2.type === "checkbox" || el2.type === "radio") return el2.checked;
      if (el2.type === "number" || el2.type === "range") return el2.valueAsNumber;
      if (el2.type === "file") return el2.files;
      if (el2.type === "date") return el2.valueAsDate;
    }
    return el2.value;
  },
  /**
   * Smart Setter. Automatically handles checkboxes, numbers, etc.
   * 
   * @example Input.set(checkbox)(true);
   */
  set: (el2) => (val) => {
    if (!el2) return el2;
    if (el2 instanceof HTMLInputElement) {
      if (el2.type === "checkbox" || el2.type === "radio") {
        el2.checked = !!val;
      } else if (el2.type === "file") {
        if (!val) el2.value = "";
      } else if (el2.type === "date" && val instanceof Date) {
        el2.valueAsDate = val;
      } else {
        el2.value = String(val);
      }
    } else {
      el2.value = String(val);
    }
    el2.dispatchEvent(new Event("input", { bubbles: true }));
    el2.dispatchEvent(new Event("change", { bubbles: true }));
    return el2;
  },
  /**
   * Returns an array of Files from a file input (easier than FileList).
   */
  files: (el2) => {
    return el2 && el2.files ? Array.from(el2.files) : [];
  },
  /**
   * Watches the 'input' event (keystrokes).
   * callback receives the *parsed* value, not the event.
   * 
   * @example Input.watch(search)(query => filterList(query));
   */
  watch: (el2) => {
    return (callback) => {
      if (!el2) return () => {
      };
      const handler = (e) => callback(Input.get(el2), e);
      el2.addEventListener("input", handler);
      return () => el2.removeEventListener("input", handler);
    };
  },
  /**
   * Watches the 'input' event with a DEBOUNCE.
   * Perfect for search bars.
   * 
   * @example Input.watchDebounced(search)(query => api.search(query), 500);
   */
  watchDebounced: (el2) => {
    return (callback, ms) => {
      if (!el2) return () => {
      };
      const d = debounce((_e) => callback(Input.get(el2)), ms);
      el2.addEventListener("input", d);
      return () => el2.removeEventListener("input", d);
    };
  },
  /**
   * Watches the 'change' event (blur/enter/selection).
   * 
   * @example Input.change(dropdown)(val => console.log('Selected', val));
   */
  change: (el2) => {
    return (callback) => {
      if (!el2) return () => {
      };
      const handler = (e) => callback(Input.get(el2), e);
      el2.addEventListener("change", handler);
      return () => el2.removeEventListener("change", handler);
    };
  },
  /**
   * Selects all text in the input/textarea.
   */
  select: (el2) => {
    el2 == null ? void 0 : el2.select();
    return el2;
  },
  /**
   * Checks validity and returns boolean. 
   * Optionally sets custom validity message.
   */
  validate: (el2) => (msg) => {
    if (!el2) return false;
    if (msg !== void 0) el2.setCustomValidity(msg);
    return el2.checkValidity();
  }
};
var Evt = {
  /**
   * Stops propagation (bubbling) of the event.
   * Can be used as a wrapper for handlers.
   * 
   * @example on(btn)('click', Evt.stop(handler));
   */
  stop: (fn) => (e) => {
    e.stopPropagation();
    if (fn) fn(e);
  },
  /**
   * Prevents default behavior.
   * 
   * @example on(form)('submit', Evt.prevent(submitHandler));
   */
  prevent: (fn) => (e) => {
    e.preventDefault();
    if (fn) fn(e);
  },
  /**
   * Stops propagation AND prevents default.
   */
  kill: (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fn) fn(e);
  },
  /**
   * Filters an event handler to only run for specific keys.
   * 
   * @example on(input)('keydown', Evt.key('Enter', search));
   */
  key: (keyOrKeys, fn) => (e) => {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (keys.includes(e.key)) fn(e);
  },
  /**
   * Checks if the event triggered exactly on the element (not a child).
   */
  isSelf: (e) => e.target === e.currentTarget,
  /**
   * Gets the coordinate of the event relative to the viewport.
   * Handles Mouse and Touch events uniformly.
   */
  pointer: (e) => {
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }
};
var Key = {
  /**
   * Listens for a specific key press.
   * @example Key.is(input)('Enter', onSubmit);
   */
  is: (target) => (key, handler) => {
    return on(target)("keydown", (e) => {
      if (e.key === key) handler(e);
    });
  },
  /**
   * Listens for the 'Tab' key.
   * Useful for trapping focus or form navigation logic.
   */
  onTab: (target) => (handler) => {
    return on(target)("keydown", (e) => {
      if (e.key === "Tab") handler(e);
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
  onArrow: (target) => {
    return (handler) => {
      return on(target)("keydown", (e) => {
        if (e.key.startsWith("Arrow")) {
          const dir = e.key.replace("Arrow", "");
          handler(dir, e);
        }
      });
    };
  }
};
var Focus = {
  /**
   * Standard Focus event.
   */
  on: (target) => (handler) => {
    return on(target)("focus", handler);
  },
  /**
   * Standard Blur event.
   */
  onBlur: (target) => (handler) => {
    return on(target)("blur", handler);
  },
  /**
   * Focus In (Bubbles).
   * Useful for detecting if ANY child within a container gained focus.
   */
  onIn: (target) => (handler) => {
    return on(target)("focusin", handler);
  },
  /**
   * Focus Out (Bubbles).
   * Useful for detecting if focus left a container entirely.
   */
  onOut: (target) => (handler) => {
    return on(target)("focusout", handler);
  },
  /**
   * Traps focus within an element (Accessibility).
   * Prevents Tab from leaving the target container.
   */
  trap: (target) => {
    if (!target) return () => {
    };
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const focusables = target.querySelectorAll(
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
    target.addEventListener("keydown", handler);
    return () => target.removeEventListener("keydown", handler);
  }
};
var Text = {
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
  findAll: (root = document) => {
    return (textOrRegex, selector = "*") => {
      const matches = /* @__PURE__ */ new Set();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        const content = node.nodeValue || "";
        if (!parent || !parent.matches(selector)) continue;
        const isMatch = typeof textOrRegex === "string" ? content.includes(textOrRegex) : textOrRegex.test(content);
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
  find: (root = document) => {
    return (textOrRegex, selector = "*") => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        const content = node.nodeValue || "";
        if (!parent || !parent.matches(selector)) continue;
        const isMatch = typeof textOrRegex === "string" ? content.includes(textOrRegex) : textOrRegex.test(content);
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
  replace: (root) => {
    return (searchValue, replaceValue) => {
      if (!root) return root;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const val = node.nodeValue || "";
        if (typeof searchValue === "string" ? val.includes(searchValue) : searchValue.test(val)) {
          node.nodeValue = val.replace(searchValue, replaceValue);
        }
      }
      return root;
    };
  }
};
var ViewTransitions = {
  /** Checks if View Transitions are supported. */
  isSupported: () => "startViewTransition" in document,
  /**
   * Sets the `view-transition-name` on an element.
   * Essential for connecting elements across DOM updates.
   * 
   * @example View.name(img)('hero-image');
   */
  name: (target) => (name) => {
    if (target) target.style.viewTransitionName = name;
    return target;
  },
  /** Removes the view-transition-name. */
  unname: (target) => {
    if (target) target.style.removeProperty("view-transition-name");
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
  start: (updateCallback) => {
    if (!("startViewTransition" in document)) {
      updateCallback();
      return null;
    }
    return document.startViewTransition(updateCallback);
  },
  /**
   * Starts a transition with a specific class applied to the document element.
   * Useful for defining different animations (e.g. 'slide-left' vs 'slide-right').
   * 
   * @example ViewTransitions.withClass('slide-back')(() => history.back());
   */
  withClass: (className) => (updateCallback) => {
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
  tempName: (target) => (name) => {
    return (updateCallback) => {
      if (!target) return ViewTransitions.start(updateCallback);
      target.style.viewTransitionName = name;
      const transition = ViewTransitions.start(updateCallback);
      if (transition) {
        transition.finished.finally(() => target.style.removeProperty("view-transition-name"));
      } else {
        target.style.removeProperty("view-transition-name");
      }
      return transition;
    };
  }
};
var Async = {
  /**
   * Wraps a value or Promise in a Promise (safe normalization).
   */
  resolve: (v) => Promise.resolve(v),
  /**
   * Sleeps for N milliseconds.
   * @example await Async.sleep(1000);
   */
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  /**
   * Waits for the next Animation Frame.
   */
  nextFrame: () => new Promise((resolve) => requestAnimationFrame(resolve)),
  /**
   * Retries a function N times with exponential backoff.
   * 
   * @example
   * const data = await Async.retry(() => api.get(), { retries: 3 });
   */
  retry: (fn, options = {}) => {
    const { retries = 3, delay = 100, factor = 2 } = options;
    return fn().catch((err) => {
      if (retries <= 0) throw err;
      return Async.sleep(delay).then(
        () => Async.retry(fn, { retries: retries - 1, delay: delay * factor, factor })
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
  timeout: (promise, ms) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("TimeoutError")), ms))
    ]);
  },
  /**
   * Limits concurrency of a map function.
   * Useful for batch processing without flooding the network.
   * 
   * @example
   * await Async.map(userIds, fetchUser, 2); // 2 at a time
   */
  map: async (items, fn, concurrency = Infinity) => {
    const results = [];
    const queue = items.map((item, i) => ({ item, i }));
    const worker = async () => {
      while (queue.length > 0) {
        const { item, i } = queue.shift();
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
  defer: () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  },
  /**
   * Wraps a promise to make it "Cancelable" (wrapper only).
   * Note: Does not stop the underlying operation, just ignores the result.
   */
  cancelable: (promise) => {
    let isCanceled = false;
    const wrapped = new Promise((resolve, reject) => {
      promise.then(
        (val) => !isCanceled && resolve(val),
        (err) => !isCanceled && reject(err)
      );
    });
    return {
      promise: wrapped,
      cancel: () => {
        isCanceled = true;
      }
    };
  }
};
var createQueue = (options = {}) => {
  const concurrency = options.concurrency || 1;
  const queue = [];
  let active = 0;
  let isPaused = !options.autoStart && options.autoStart !== void 0;
  const listeners = {
    drain: [],
    error: []
  };
  const next = () => {
    if (isPaused || active >= concurrency || queue.length === 0) {
      if (active === 0 && queue.length === 0) listeners.drain.forEach((fn) => fn());
      return;
    }
    const job = queue.shift();
    if (!job) return;
    active++;
    Promise.resolve().then(() => job.fn()).then((res) => job.resolve(res)).catch((err) => {
      listeners.error.forEach((fn) => fn(err));
      job.reject(err);
    }).finally(() => {
      active--;
      next();
    });
    next();
  };
  return {
    /** Adds a task to the queue. Returns a promise that resolves when the task finishes. */
    add: (fn) => {
      return new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
      });
    },
    /** Pauses processing. Active tasks complete, but new ones wait. */
    pause: () => {
      isPaused = true;
    },
    /** Resumes processing. */
    resume: () => {
      isPaused = false;
      next();
    },
    /** Clears all pending tasks. */
    clear: () => {
      queue.length = 0;
    },
    /** Returns the number of pending + active tasks. */
    size: () => queue.length + active,
    /** Returns a promise that resolves when all tasks are complete. */
    drain: () => new Promise((resolve) => {
      if (active === 0 && queue.length === 0) return resolve();
      listeners.drain.push(resolve);
    }),
    /** Listen for errors (globally for the queue). */
    onError: (fn) => listeners.error.push(fn)
  };
};
var History = {
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
  query: (params) => (mode = "push") => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.delete(k);
      if (v === null || v === void 0 || v === "") return;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
    const method = mode === "replace" ? "replaceState" : "pushState";
    window.history[method](window.history.state, "", url.href);
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
  readQuery: () => {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },
  /**
   * Reads Query Parameters, ensuring all values are arrays.
   * Useful for filters like `?tags=a&tags=b`.
   */
  readQueryAll: () => {
    const params = {};
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
  push: (path, state) => {
    window.history.pushState(state, "", path);
  },
  /**
   * Replaces the current history entry.
   * 
   * @template T - Type of the state object
   * @example History.replace(window.location.pathname, { scrolled: true });
   */
  replace: (path, state) => {
    window.history.replaceState(state, "", path);
  },
  /**
   * Gets the current history state object with Type Safety.
   * 
   * @template T
   * @example const state = History.state<{ userId: number }>();
   */
  state: () => {
    return window.history.state;
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
  onPop: (handler) => {
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  },
  /**
   * Serializes an object to a Unicode-safe Base64 string.
   * Useful for storing complex state in the URL hash.
   * 
   * @example window.location.hash = History.encodeState({ filters: [...] });
   */
  encodeState: (state) => {
    try {
      const json = JSON.stringify(state);
      return btoa(encodeURIComponent(json).replace(
        /%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      ));
    } catch (e) {
      return "";
    }
  },
  /**
   * Deserializes a Base64 string back to an object.
   */
  decodeState: (str) => {
    try {
      const json = decodeURIComponent(Array.prototype.map.call(
        atob(str),
        (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(""));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
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
  syncToUrl: (paramName, debounceMs = 300) => (target) => {
    if (!target) return () => {
    };
    const isCheckable = target.type === "checkbox" || target.type === "radio";
    const updateFromUrl = () => {
      const val = new URLSearchParams(window.location.search).get(paramName);
      if (val === null) return;
      if (isCheckable) {
        target.checked = val === "true";
      } else {
        target.value = val;
      }
    };
    const updateToUrl = debounce(() => {
      const val = isCheckable ? String(target.checked) : target.value;
      History.query({ [paramName]: val })("replace");
    }, debounceMs);
    updateFromUrl();
    target.addEventListener("input", updateToUrl);
    target.addEventListener("change", updateToUrl);
    window.addEventListener("popstate", updateFromUrl);
    return () => {
      target.removeEventListener("input", updateToUrl);
      target.removeEventListener("change", updateToUrl);
      window.removeEventListener("popstate", updateFromUrl);
    };
  }
};
var Fn = {
  /**
   * Standard Left-to-Right composition.
   * Passes the output of one function as the input to the next.
   * @example pipe(getName, toUpper, log)(user);
   */
  pipe: (...fns) => (x) => fns.reduce((v, f) => f(v), x),
  /**
   * Curries a binary function.
   * Turns `fn(a, b)` into `fn(a)(b)`.
   * @example const add = curry((a, b) => a + b); add(1)(2);
   */
  curry: (fn) => (a) => (b) => fn(a, b),
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
  swap: (fn) => (b) => (a) => fn(a)(b),
  /**
   * Flips the arguments of a standard binary function.
   * Turns `fn(a, b)` into `fn(b, a)`.
   */
  flip: (fn) => (b, a) => fn(a, b),
  /**
   * Executes a side-effect function and returns the original value.
   * Essential for logging or debugging inside a `pipe` chain without breaking it.
   * 
   * @example pipe(modify({...}), tap(console.log), addClass('active'))(el);
   */
  tap: (fn) => (x) => {
    fn(x);
    return x;
  },
  /**
   * Executes a function only if the value is not null/undefined.
   * Useful wrapper for standard API functions that might crash on null.
   * 
   * @example const safeParse = maybe(JSON.parse);
   */
  maybe: (fn) => (x) => {
    return x === null || x === void 0 ? null : fn(x);
  },
  /**
   * Creates a function that accepts data as the *first* argument, 
   * but applies it to a curried function expecting data *last*.
   * 
   * Adapts `fn(config)(data)` to `fn(data, config)`.
   */
  unbind: (fn) => (data, config) => {
    return fn(config)(data);
  },
  /**
   * "Thunks" a function. Returns a function that accepts no arguments 
   * and returns the result of the original call.
   * Useful for event handlers that don't need the event object.
   * 
   * @example on(btn)('click', thunk(count, increment));
   */
  thunk: (fn, ...args) => () => fn(...args),
  /**
   * Returns the value unchanged.
   * Useful as a default no-op callback.
   */
  identity: (x) => x,
  /**
   * A function that does nothing.
   */
  noop: () => {
  }
};
var Result = {
  /** Creates a success result. */
  ok: (val) => ({ ok: true, val, err: null }),
  /** Creates a failure result. */
  err: (err) => ({ ok: false, val: null, err }),
  /**
   * Wraps a synchronous function that might throw.
   * Returns a Result object instead of throwing.
   * 
   * @example
   * const res = Result.try(() => JSON.parse(badString));
   * if (!res.ok) console.error(res.err);
   */
  try: (fn) => {
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
  async: async (fn) => {
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
  unwrap: (res) => {
    if (res.ok) return res.val;
    throw res.err;
  },
  /**
   * Unwraps a Result with a fallback value.
   */
  unwrapOr: (res, fallback) => {
    return res.ok ? res.val : fallback;
  },
  /**
   * Maps the value if Ok, ignores if Err.
   */
  map: (res, fn) => {
    return res.ok ? Result.ok(fn(res.val)) : res;
  }
};
var Option = {
  /**
   * Creates an Option from a nullable value.
   */
  from: (val) => ({
    val,
    isSome: val !== null && val !== void 0,
    isNone: val === null || val === void 0
  }),
  /**
   * Returns the value or a fallback.
   * @example Option.unwrapOr(input, 'default');
   */
  unwrapOr: (val, fallback) => {
    return val !== null && val !== void 0 ? val : fallback;
  },
  /**
   * Maps the value if it exists, returns null otherwise.
   * @example const len = Option.map(str, s => s.length);
   */
  map: (val, fn) => {
    return val !== null && val !== void 0 ? fn(val) : null;
  },
  /**
   * Executes side-effect if value exists.
   * @example Option.then(element, el => el.remove());
   */
  then: (val, fn) => {
    if (val !== null && val !== void 0) fn(val);
  }
};
var bind = {
  /**
   * Generic value binder with diffing.
   * 
   * @example
   * const setScore = bind.val(0, (n) => div.innerText = n);
   */
  val: (initial, effect) => {
    let current = initial;
    return (next) => {
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
  text: (el2) => {
    let current;
    return (text) => {
      if (el2 && current !== text) {
        current = text;
        el2.textContent = text;
      }
    };
  },
  /**
   * Binds innerHTML.
   */
  html: (el2) => {
    let current;
    return (html2) => {
      if (el2 && current !== html2) {
        current = html2;
        el2.innerHTML = html2;
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
  attr: (name, el2) => {
    const createSetter = (target) => {
      let current;
      return (val) => {
        if (!target || current === val) return;
        current = val;
        if (val === null || val === false) target.removeAttribute(name);
        else target.setAttribute(name, String(val));
      };
    };
    return el2 !== void 0 ? createSetter(el2) : createSetter;
  },
  /**
   * Binds a class toggle.
   * Supports optional currying.
   * 
   * @example const toggleActive = bind.toggle('active', div);
   */
  toggle: (className, el2) => {
    const createSetter = (target) => {
      let current;
      return (active) => {
        if (!target || current === active) return;
        current = active;
        target.classList.toggle(className, active);
      };
    };
    return el2 !== void 0 ? createSetter(el2) : createSetter;
  },
  /**
   * Binds a list to a container.
   * Replaces children only if array reference changes.
   * 
   * @example 
   * const updateList = bind.list(ul, (user, i) => el('li')({ text: user.name })());
   * updateList(users);
   */
  list: (container, renderItem) => {
    let currentData;
    return (data) => {
      if (!container) return;
      if (data === currentData) return;
      currentData = data;
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
var view = (htmlString) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = htmlString.trim();
  return () => {
    const root = document.importNode(tpl.content, true);
    const refs2 = {};
    root.querySelectorAll("[data-ref]").forEach((el2) => {
      const key = el2.dataset.ref;
      if (key) refs2[key] = el2;
    });
    const rootEl = root.children.length === 1 ? root.firstElementChild : root;
    return { root: rootEl, refs: refs2 };
  };
};
var binder = (refs2, schema) => {
  const binders = {};
  for (const key in schema) {
    if (refs2[key]) {
      binders[key] = schema[key](refs2[key]);
    }
  }
  return binders;
};
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
//# sourceMappingURL=index.js.map
