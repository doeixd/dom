// src/index.ts
var _nodes = (args) => args.flat().filter((x) => x != null && x !== false).map((x) => x instanceof Node ? x : document.createTextNode(String(x)));
var def = (fn) => {
  function wrapper(target, ...args) {
    if (args.length > 0) {
      return fn(target, ...args);
    }
    return (...lateArgs) => fn(target, ...lateArgs);
  }
  return wrapper;
};
function find(arg) {
  if (typeof arg === "string") {
    const selector = arg;
    return document.querySelector(selector);
  }
  const root = arg != null ? arg : document;
  return (selector) => {
    return root.querySelector(selector);
  };
}
function require2(selector, root = document) {
  const el2 = root.querySelector(selector);
  if (!el2) throw new Error(`Element not found: ${selector}`);
  return el2;
}
function findAll(arg) {
  if (typeof arg === "string") {
    const selector = arg;
    return Array.from(document.querySelectorAll(selector));
  }
  const root = arg != null ? arg : document;
  return (selector) => {
    return Array.from(root.querySelectorAll(selector));
  };
}
function closest(arg) {
  if (typeof arg === "string") {
    const selector = arg;
    return document.documentElement.closest(selector);
  }
  const element = arg;
  return (selector) => {
    return element == null ? void 0 : element.closest(selector);
  };
}
function exists(arg) {
  if (typeof arg === "string") {
    return document.querySelector(arg) !== null;
  }
  const root = arg != null ? arg : document;
  return (selector) => {
    return root.querySelector(selector) !== null;
  };
}
function siblings(arg) {
  if (!(arg instanceof Element) && arg !== null) {
    const root = arg;
    return (node2) => {
      if (!root || !node2) return [];
      return Array.from(root.children).filter((el2) => el2 !== node2);
    };
  }
  const node = arg;
  if (!node || !node.parentElement) return [];
  return Array.from(node.parentElement.children).filter((el2) => el2 !== node);
}
function has(arg) {
  if (typeof arg === "string") {
    return document.querySelector(arg) !== null;
  }
  const root = arg;
  return (selector) => {
    if (!root) return false;
    return root.querySelector(selector) !== null;
  };
}
function index(arg) {
  if (!(arg instanceof Element) && arg !== null) {
    const root = arg;
    return (node2) => {
      if (!root || !node2) return -1;
      const children = Array.from(root.children);
      return children.indexOf(node2);
    };
  }
  const node = arg;
  if (!node || !node.parentElement) return -1;
  return Array.from(node.parentElement.children).indexOf(node);
}
function on(target, eventType, handler, options) {
  const createListener = (evt, fn, opts = false) => {
    if (!target) return () => {
    };
    const listener = (e) => fn(e, target);
    target.addEventListener(evt, listener, opts);
    return () => target.removeEventListener(evt, listener, opts);
  };
  const eventSetup = (evt, fn, opts) => createListener(evt, fn, opts);
  if (eventType === void 0 || handler === void 0) {
    return eventSetup;
  }
  return createListener(eventType, handler, options);
}
function onDelegated(root, selector, eventType, handler, options) {
  const createListener = (sel, evt, fn, opts = false) => {
    if (!root) return () => {
    };
    const listener = (e) => {
      var _a;
      const target = e.target;
      const match = (_a = target.closest) == null ? void 0 : _a.call(target, sel);
      if (match && root.contains(match)) {
        fn(e, match);
      }
    };
    root.addEventListener(evt, listener, opts);
    return () => root.removeEventListener(evt, listener, opts);
  };
  const eventSetup = (sel) => {
    return (evt, fn, opts) => createListener(sel, evt, fn, opts);
  };
  const selectorSetup = (sel, evt, fn, opts) => {
    if (evt !== void 0 && fn !== void 0) {
      return createListener(sel, evt, fn, opts);
    }
    return eventSetup(sel);
  };
  if (selector === void 0) {
    return selectorSetup;
  }
  if (eventType === void 0 || handler === void 0) {
    return eventSetup(selector);
  }
  return createListener(selector, eventType, handler, options);
}
var dispatch = (target) => {
  return (eventName, detail, options = { bubbles: true }) => {
    if (target) {
      target.dispatchEvent(new CustomEvent(eventName, { detail, ...options }));
    }
    return target;
  };
};
var _applyProps = (element, props) => {
  if (!element) return null;
  if (props.text !== void 0) element.innerText = props.text;
  if (props.html !== void 0) element.innerHTML = props.html;
  if (props.value !== void 0) element.value = props.value;
  if (props.disabled !== void 0) element.disabled = props.disabled;
  if (props.style) Object.assign(element.style, props.style);
  if (props.dataset) {
    Object.entries(props.dataset).forEach(([k, v]) => {
      if (v === null || v === void 0) {
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
      if (v === false || v === null || v === void 0) element.removeAttribute(k);
      else element.setAttribute(k, String(v));
    });
  }
  return element;
};
function modify(arg1, arg2) {
  const isElementFirst = arg1 instanceof HTMLElement || arg1 === null;
  if (!isElementFirst) {
    const props = arg1;
    return (element2) => _applyProps(element2, props);
  }
  if (arg2 !== void 0) {
    const element2 = arg1;
    const props = arg2;
    return _applyProps(element2, props);
  }
  const element = arg1;
  return (props) => _applyProps(element, props);
}
var set = modify;
function css(arg1, arg2) {
  const isElementFirst = arg1 instanceof HTMLElement || arg1 === null;
  const applyCss = (element2, styles) => {
    if (element2) Object.assign(element2.style, styles);
    return element2;
  };
  if (!isElementFirst) {
    const styles = arg1;
    return (element2) => applyCss(element2, styles);
  }
  if (arg2 !== void 0) {
    const element2 = arg1;
    const styles = arg2;
    return applyCss(element2, styles);
  }
  const element = arg1;
  return (styles) => applyCss(element, styles);
}
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
var append = def((parent, ...content) => {
  parent == null ? void 0 : parent.append(..._nodes(content));
  return parent;
});
var prepend = def((parent, ...content) => {
  parent == null ? void 0 : parent.prepend(..._nodes(content));
  return parent;
});
var after = def((target, ...content) => {
  target == null ? void 0 : target.after(..._nodes(content));
  return target;
});
var before = def((target, ...content) => {
  target == null ? void 0 : target.before(..._nodes(content));
  return target;
});
var remove = (target) => {
  target == null ? void 0 : target.remove();
  return null;
};
var empty = (target) => {
  if (target) target.replaceChildren();
  return target;
};
var wrap = def((target, wrapper) => {
  if (target && wrapper && target.parentNode) {
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
  }
  return wrapper;
});
var mount = def((parent, child) => {
  if (!child) return () => {
  };
  const parentEl = typeof parent === "string" ? document.querySelector(parent) : parent;
  if (!parentEl) return () => {
  };
  parentEl.appendChild(child);
  return () => {
    if (child.parentNode === parentEl) {
      parentEl.removeChild(child);
    }
  };
});
function createWebComponent(arg1, arg2) {
  const toKebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
  const build = (ctor, options2 = {}) => {
    var _a, _b;
    const rawName = (_b = options2.name) != null ? _b : toKebab((_a = ctor.name) != null ? _a : "");
    if (!rawName) {
      throw new Error("createWebComponent: name is required for anonymous classes.");
    }
    const name = rawName.includes("-") ? rawName : `${rawName}-el`;
    const shouldDefine = options2.define !== false;
    const registry = typeof customElements === "undefined" ? void 0 : customElements;
    const alreadyDefined = registry == null ? void 0 : registry.get(name);
    if (shouldDefine) {
      if (!registry) {
        throw new Error("createWebComponent: customElements is not available in this environment.");
      }
      if (!alreadyDefined) {
        registry.define(name, ctor, options2.defineOptions);
      }
    }
    return {
      name,
      ctor,
      defined: shouldDefine ? true : !!alreadyDefined
    };
  };
  if (typeof arg1 === "function") {
    return build(arg1, arg2);
  }
  const options = arg1 != null ? arg1 : {};
  return (ctor) => build(ctor, options);
}
function el(tag, props, children) {
  if (props !== void 0 && children !== void 0) {
    const node = document.createElement(tag);
    modify(node)(props);
    node.append(..._nodes(children));
    return node;
  }
  return (propsArg = {}) => {
    return (childrenArg = []) => {
      const node = document.createElement(tag);
      modify(node)(propsArg);
      node.append(..._nodes(childrenArg));
      return node;
    };
  };
}
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
var svgElementTags = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polygon",
  "polyline",
  "ellipse",
  "text",
  "tspan",
  "defs",
  "clippath",
  "lineargradient",
  "radialgradient",
  "stop",
  "mask",
  "pattern",
  "marker",
  "symbol",
  "use",
  "image",
  "foreignobject"
]);
var h = new Proxy({}, {
  get(_target, tag) {
    if (typeof tag !== "string") return void 0;
    if (!/^[a-z][a-z0-9]*$/i.test(tag)) {
      throw new Error(`h: Invalid tag name "${tag}". Tag names must start with a letter and contain only letters and numbers.`);
    }
    return (props = {}, children = []) => {
      const { dataRef, ...restProps } = props;
      const isSVG = svgElementTags.has(tag.toLowerCase());
      const element = isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
      if (Object.keys(restProps).length > 0) {
        if (isSVG) {
          if (restProps.attr) {
            Object.entries(restProps.attr).forEach(([key, value]) => {
              if (value === false || value === null || value === void 0) {
                element.removeAttribute(key);
              } else {
                element.setAttribute(key, String(value));
              }
            });
          }
          if (restProps.class) {
            Object.entries(restProps.class).forEach(([className, isActive]) => {
              if (isActive) {
                element.classList.add(className);
              } else {
                element.classList.remove(className);
              }
            });
          }
          if (restProps.style) {
            Object.assign(element.style, restProps.style);
          }
          if (restProps.text !== void 0) {
            element.textContent = restProps.text;
          }
          if (restProps.html !== void 0) {
            element.innerHTML = restProps.html;
          }
        } else {
          modify(element, restProps);
        }
      }
      if (dataRef) {
        element.setAttribute("data-ref", dataRef);
      }
      if (children.length > 0) {
        element.append(..._nodes(children));
      }
      return element;
    };
  }
});
var tags = h;
var cls = {
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
  add: def((el2, ...classes) => {
    el2 == null ? void 0 : el2.classList.add(...classes);
    return el2;
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
  remove: def((el2, ...classes) => {
    el2 == null ? void 0 : el2.classList.remove(...classes);
    return el2;
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
  toggle: def((el2, className, force) => {
    el2 == null ? void 0 : el2.classList.toggle(className, force);
    return el2;
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
  replace: def((el2, oldClass, newClass) => {
    el2 == null ? void 0 : el2.classList.replace(oldClass, newClass);
    return el2;
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
  has: (el2) => (className) => {
    return !!el2 && el2.classList.contains(className);
  }
};
var watchClass = def((target, className, callback) => {
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
});
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
  set: def((el2, key, val) => {
    if (!el2) return el2;
    if (val == null) delete el2.dataset[key];
    else el2.dataset[key] = typeof val === "object" ? JSON.stringify(val) : String(val);
    return el2;
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
  read: (el2) => (key) => {
    if (!el2 || !(key in (el2.dataset || {}))) return void 0;
    const val = el2.dataset[key];
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === "null") return null;
    if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
    if (val.startsWith("{") || val.startsWith("[")) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
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
  bind: def((el2, key, callback) => {
    if (!el2) return () => {
    };
    const attr2 = toDataAttr(key);
    const update = () => callback(Data.read(el2)(key), el2);
    update();
    const obs = new MutationObserver((m) => {
      if (m.some((x) => x.attributeName === attr2)) update();
    });
    obs.observe(el2, { attributes: true, attributeFilter: [attr2] });
    return () => obs.disconnect();
  })
};
var watchAttr = def((target, attrs, callback) => {
  if (!target) return () => {
  };
  const obs = new MutationObserver((muts) => muts.forEach((m) => {
    if (m.attributeName) callback(target.getAttribute(m.attributeName), m.attributeName);
  }));
  obs.observe(target, { attributes: true, attributeFilter: Array.isArray(attrs) ? attrs : [attrs] });
  return () => obs.disconnect();
});
var watchText = def((target, callback) => {
  if (!target) return () => {
  };
  const obs = new MutationObserver(() => {
    callback(target.textContent || "", target);
  });
  obs.observe(target, { characterData: true, childList: true, subtree: true });
  return () => obs.disconnect();
});
var resolveWatchElement = (target) => {
  if (typeof target === "string") return find(document)(target);
  if (typeof target === "function") return target();
  return target;
};
var watch = Object.assign(
  (target) => {
    return {
      class: (className, callback) => watch.class(target, className, callback),
      attr: (attrName, callback) => watch.attr(target, attrName, callback),
      text: (callback) => watch.text(target, callback),
      mutations: (optionsOrCallback, maybeCallback) => watch.mutations(target, optionsOrCallback, maybeCallback)
    };
  },
  {
    /**
     * Observe class changes for a specific class name.
     *
     * @param target - Element, selector, or resolver
     * @param className - Class to watch
     * @param callback - Called when class toggles
     * @returns Cleanup function
     *
     * @example
     * ```typescript
     * const stop = watch.class(btn, 'active', (isActive) => {
     *   console.log(isActive);
     * });
     * ```
     */
    class: (target, className, callback) => {
      const el2 = resolveWatchElement(target);
      return watchClass(el2, className, (isPresent, element) => callback(isPresent, element));
    },
    /**
     * Observe attribute changes for a specific attribute.
     *
     * @param target - Element, selector, or resolver
     * @param attrName - Attribute to watch
     * @param callback - Called when attribute changes
     * @returns Cleanup function
     *
     * @example
     * ```typescript
     * watch.attr(input, 'aria-invalid', (value) => {
     *   console.log(value);
     * });
     * ```
     */
    attr: (target, attrName, callback) => {
      const el2 = resolveWatchElement(target);
      return watchAttr(el2, attrName, (value, element) => callback(value, element));
    },
    /**
     * Observe text content changes.
     *
     * @param target - Element, selector, or resolver
     * @param callback - Called when text changes
     * @returns Cleanup function
     *
     * @example
     * ```typescript
     * watch.text(status, (text) => console.log(text));
     * ```
     */
    text: (target, callback) => {
      const el2 = resolveWatchElement(target);
      return watchText(el2, (text, element) => callback(text, element));
    },
    /**
     * Observe DOM mutations for a target element.
     *
     * Defaults to `{ attributes: true, childList: true, subtree: false }`.
     *
     * @param target - Element, selector, or resolver
     * @param options - Mutation observer options or callback
     * @param callback - Mutation observer callback
     * @returns Cleanup function
     *
     * @example
     * ```typescript
     * const stop = watch.mutations(el, (records) => {
     *   console.log(records.length);
     * });
     *
     * watch.mutations(el, { subtree: true }, (records) => {
     *   console.log(records);
     * });
     * ```
     */
    mutations: (target, optionsOrCallback, maybeCallback) => {
      const el2 = resolveWatchElement(target);
      if (!el2) return () => {
      };
      const defaultOptions = {
        attributes: true,
        childList: true,
        subtree: false
      };
      const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
      if (!callback) return () => {
      };
      const options = typeof optionsOrCallback === "function" ? defaultOptions : { ...defaultOptions, ...optionsOrCallback };
      const observer = new MutationObserver((records) => callback(records, observer, el2));
      observer.observe(el2, options);
      return () => observer.disconnect();
    }
  }
);
function attr(a) {
  if (typeof a === "string") {
    const attribute = a;
    return document.documentElement.getAttribute(attribute);
  }
  const el2 = a;
  return (attribute, value) => {
    if (!el2) return value === void 0 ? null : void 0;
    if (value === void 0) {
      return el2.getAttribute(attribute);
    }
    el2.setAttribute(attribute, value);
  };
}
function prop(a) {
  if (typeof a === "string") {
    const key = a;
    const el3 = document.documentElement;
    return el3[key];
  }
  const el2 = a;
  return (key, value) => {
    if (!el2) return void 0;
    if (value === void 0) return el2[key];
    el2[key] = value;
  };
}
var onReady = (fn) => {
  if (typeof document === "undefined") return;
  if (document.readyState === "complete" || document.readyState === "interactive") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  }
};
var ready = {
  /**
   * Waits until the DOM is parsed and interactive (DOMContentLoaded).
   * Resolves immediately if DOM is already loaded.
   * 
   * @returns Promise that resolves when DOM is ready
   */
  dom: () => new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  }),
  /**
   * Waits until the microtask queue is flushed (after current JS execution).
   * Useful for ensuring Promise chains and MutationObserver callbacks have run.
   * 
   * @returns Promise that resolves on next microtask
   */
  micro: () => new Promise((resolve) => queueMicrotask(resolve)),
  /**
   * Waits until the next requestAnimationFrame (next paint cycle).
   * Useful for deferring layout-dependent code.
   * 
   * @returns Promise that resolves on next frame
   */
  raf: () => new Promise((resolve) => requestAnimationFrame(() => resolve()))
};
var onMount = def((selector, handler, root = document, once = false) => {
  if (!selector) return () => {
  };
  const seen = /* @__PURE__ */ new WeakSet();
  let foundAny = false;
  let obs = null;
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
  const stopIfOnceSatisfied = () => {
    if (once && foundAny && obs) {
      obs.disconnect();
      obs = null;
    }
  };
  root.querySelectorAll(selector).forEach(check);
  if (once && foundAny) return () => {
  };
  obs = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) check(n);
      });
    });
    stopIfOnceSatisfied();
  });
  obs.observe(root, { childList: true, subtree: true });
  return () => {
    obs == null ? void 0 : obs.disconnect();
    obs = null;
  };
});
var waitFor = def((target, predicate) => {
  return new Promise((resolve, reject) => {
    if (!target) {
      reject(new Error("waitFor: target is null"));
      return;
    }
    if (predicate(target)) return resolve(target);
    const obs = new MutationObserver(() => {
      if (predicate(target)) {
        obs.disconnect();
        resolve(target);
      }
    });
    obs.observe(target, { attributes: true, childList: true, subtree: true, characterData: true });
  });
});
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
     * Options:
     * - `nested`: Supports dot-notation for nested objects
     * - `includeFiles`: Includes FileList values
     * - `includeDisabled`: Includes disabled inputs
     * 
     * Only includes inputs with a `name` attribute.
     * 
     * @param root - The form or container element
     * @param options - Serialization options
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
  serialize: (root, options = {}) => {
    const data = {};
    if (!root) return data;
    const { nested = false, includeFiles = false, includeDisabled = false } = options;
    const isNumeric = (value) => /^\d+$/.test(value);
    const setNested = (target, path, value) => {
      let current = target;
      path.forEach((segment, index2) => {
        const isLast = index2 === path.length - 1;
        if (isLast) {
          current[segment] = value;
          return;
        }
        const nextSegment = path[index2 + 1];
        const shouldBeArray = typeof nextSegment === "string" && isNumeric(nextSegment);
        if (current[segment] === void 0 || typeof current[segment] !== "object") {
          current[segment] = shouldBeArray ? [] : {};
        }
        current = current[segment];
      });
    };
    const setValue = (name, value) => {
      if (nested) {
        setNested(data, name.split(".").filter(Boolean), value);
      } else {
        data[name] = value;
      }
    };
    root.querySelectorAll("input, select, textarea").forEach((el2) => {
      if (!el2.name) return;
      if (!includeDisabled && el2.disabled) return;
      if (el2 instanceof HTMLInputElement && el2.type === "file") {
        if (includeFiles) setValue(el2.name, el2.files);
        return;
      }
      if (el2 instanceof HTMLInputElement && el2.type === "checkbox") {
        setValue(el2.name, el2.checked);
      } else if (el2 instanceof HTMLInputElement && el2.type === "radio") {
        if (el2.checked) setValue(el2.name, el2.value);
      } else if (el2 instanceof HTMLInputElement && el2.type === "number") {
        setValue(el2.name, Number(el2.value));
      } else {
        setValue(el2.name, el2.value);
      }
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
  populate: def((root, data) => {
    if (!root) return root;
    Object.entries(data).forEach(([k, v]) => {
      const el2 = root.querySelector(`[name="${k}"]`);
      if (!el2) return;
      if (el2.type === "checkbox" || el2.type === "radio") el2.checked = !!v;
      else el2.value = String(v);
    });
    return root;
  })
};
var wait = (ms) => new Promise((r) => setTimeout(r, ms));
var nextFrame = () => new Promise((r) => requestAnimationFrame(r));
var cssTemplate = (strings, ...values) => strings.reduce((acc, s, i) => {
  var _a;
  return acc + s + ((_a = values[i]) != null ? _a : "");
}, "");
var Traverse = {
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
  parent(elOrSelector, selector) {
    var _a;
    if (typeof elOrSelector === "string") {
      const el3 = document.querySelector(elOrSelector);
      const parent2 = (el3 == null ? void 0 : el3.parentElement) || null;
      if (!parent2) return null;
      return !selector || parent2.matches(selector) ? parent2 : null;
    }
    const el2 = elOrSelector != null ? elOrSelector : null;
    const parent = (_a = el2 == null ? void 0 : el2.parentElement) != null ? _a : null;
    if (!parent) return null;
    return !selector || parent.matches(selector) ? parent : null;
  },
  /**
   * Get the next sibling element.
   *
   * @example
   * Traverse.next(el);            // <li> | null
   * Traverse.next(".active");     // next of .active
   * Traverse.next(el)("button");  // next button sibling
   */
  next(elOrSelector, selector) {
    var _a;
    if (typeof elOrSelector === "string") {
      const el3 = document.querySelector(elOrSelector);
      const next2 = (el3 == null ? void 0 : el3.nextElementSibling) || null;
      if (!next2) return null;
      return !selector || next2.matches(selector) ? next2 : null;
    }
    const el2 = elOrSelector != null ? elOrSelector : null;
    const next = (_a = el2 == null ? void 0 : el2.nextElementSibling) != null ? _a : null;
    if (!next) return null;
    return !selector || next.matches(selector) ? next : null;
  },
  /**
   * Get the previous sibling element.
   *
   * @example
   * Traverse.prev(el);
   * Traverse.prev(".selected");
   * Traverse.prev(el)(".item");
   */
  prev(elOrSelector, selector) {
    var _a;
    if (typeof elOrSelector === "string") {
      const el3 = document.querySelector(elOrSelector);
      const prev2 = (el3 == null ? void 0 : el3.previousElementSibling) || null;
      if (!prev2) return null;
      return !selector || prev2.matches(selector) ? prev2 : null;
    }
    const el2 = elOrSelector != null ? elOrSelector : null;
    const prev = (_a = el2 == null ? void 0 : el2.previousElementSibling) != null ? _a : null;
    if (!prev) return null;
    return !selector || prev.matches(selector) ? prev : null;
  },
  /**
   * Get child elements, with optional selector filtering.
   *
   * @example
   * Traverse.children(el);         // Element[]
   * Traverse.children(".list");    // children of element matching .list
   * Traverse.children(el)("li");   // only <li> children
   */
  children(elOrSelector, selector) {
    if (typeof elOrSelector === "string") {
      const el3 = document.querySelector(elOrSelector);
      if (!el3) return [];
      const kids2 = Array.from(el3.children);
      return selector ? kids2.filter((c) => c.matches(selector)) : kids2;
    }
    const el2 = elOrSelector != null ? elOrSelector : null;
    if (!el2) return [];
    const kids = Array.from(el2.children);
    return selector ? kids.filter((c) => c.matches(selector)) : kids;
  },
  /**
    * Get sibling elements (excluding the original element).
    *
    * @example
    * Traverse.siblings(el);
    * Traverse.siblings("#active");
    * Traverse.siblings(el)(".item");
    */
  siblings(elOrSelector, selector) {
    if (typeof elOrSelector === "string") {
      const el3 = document.querySelector(elOrSelector);
      if (!(el3 == null ? void 0 : el3.parentElement)) return [];
      const sibs2 = Array.from(el3.parentElement.children).filter((c) => c !== el3);
      return selector ? sibs2.filter((s) => s.matches(selector)) : sibs2;
    }
    const el2 = elOrSelector != null ? elOrSelector : null;
    if (!(el2 == null ? void 0 : el2.parentElement)) return [];
    const sibs = Array.from(el2.parentElement.children).filter((s) => s !== el2);
    return selector ? sibs.filter((s) => s.matches(selector)) : sibs;
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
  parents(elOrSelector, until) {
    var _a;
    const el2 = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector != null ? elOrSelector : null;
    const result = [];
    let current = (_a = el2 == null ? void 0 : el2.parentElement) != null ? _a : null;
    while (current) {
      if (typeof until === "string" && current.matches(until)) {
        break;
      }
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
  nextAll(elOrSelector, selector) {
    var _a;
    const el2 = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector != null ? elOrSelector : null;
    const result = [];
    let current = (_a = el2 == null ? void 0 : el2.nextElementSibling) != null ? _a : null;
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
  prevAll(elOrSelector, selector) {
    var _a;
    const el2 = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector != null ? elOrSelector : null;
    const result = [];
    let current = (_a = el2 == null ? void 0 : el2.previousElementSibling) != null ? _a : null;
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
  closestAll(elOrSelector, selector) {
    const el2 = typeof elOrSelector === "string" ? document.querySelector(elOrSelector) : elOrSelector != null ? elOrSelector : null;
    const result = [];
    let current = el2;
    while (current) {
      if (!selector || current.matches(selector)) {
        result.push(current);
      }
      current = current.parentElement;
    }
    return result;
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
var computed = (el2) => (prop2) => {
  if (!el2) return "";
  const value = getComputedStyle(el2)[prop2];
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
  let resolved = false;
  let timeoutId;
  const onEnd = () => {
    if (resolved) return;
    resolved = true;
    if (timeoutId !== void 0) clearTimeout(timeoutId);
    el2.removeEventListener("transitionend", onEnd);
    el2.removeEventListener("animationend", onEnd);
    resolve(el2);
  };
  el2.addEventListener("transitionend", onEnd);
  el2.addEventListener("animationend", onEnd);
  requestAnimationFrame(() => {
    const s = getComputedStyle(el2);
    const transitionDuration = parseFloat(s.transitionDuration) * 1e3;
    const animationDuration = parseFloat(s.animationDuration) * 1e3;
    const maxDuration = Math.max(transitionDuration, animationDuration);
    if (maxDuration === 0) {
      onEnd();
    } else {
      timeoutId = setTimeout(onEnd, maxDuration + 50);
    }
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
   * Maps an object's entries into a new object.
   *
   * Supports two styles:
   * - Entry mapping: `(entry) => [newKey, newValue]`
   * - Value mapping: `(value, key) => newValue` (keys preserved)
   *
   * @template T - The object type
   * @template K - The original key type
   * @template V - The original value type
   * @returns A new mapped object
   *
   * @example
   * ```typescript
   * const user = { id: 1, name: 'Ada', role: 'admin' };
   *
   * // Value mapping (keys preserved)
   * const upper = Obj.map(user, (value) => String(value).toUpperCase());
   * // { id: '1', name: 'ADA', role: 'ADMIN' }
   *
   * // Entry mapping (change keys + values)
   * const pairs = Obj.map(user, ([key, value]) => [`user_${key}`, value]);
   * // { user_id: 1, user_name: 'Ada', user_role: 'admin' }
   * ```
   */
  map: (obj, mapper) => {
    const entries = Object.entries(obj);
    const isEntryMapper = mapper.length <= 1;
    const result = {};
    if (isEntryMapper) {
      entries.forEach(([key, value]) => {
        const [newKey, newValue] = mapper([key, value]);
        result[newKey] = newValue;
      });
      return result;
    }
    entries.forEach(([key, value]) => {
      result[key] = mapper(value, key);
    });
    return result;
  },
  /**
   * Renames a key on an object (immutable).
   *
   * Supports both call styles:
   * - `Obj.renameKey(obj, from, to)`
   * - `Obj.renameKey(from, to)(obj)`
   *
   * If the source key is missing, returns a shallow copy of the original.
   *
   * @template T - The object type
   * @template F - Key to rename
   * @template N - New key name
   * @returns A new object with the renamed key
   *
   * @example
   * ```typescript
   * const user = { id: 1, name: 'Ada' };
   *
   * const renamed = Obj.renameKey(user, 'name', 'fullName');
   * // { id: 1, fullName: 'Ada' }
   *
   * const rename = Obj.renameKey('id', 'userId');
   * const renamed2 = rename(user);
   * // { userId: 1, name: 'Ada' }
   * ```
   */
  renameKey: (objOrFrom, fromOrTo, to) => {
    const rename = (obj, from, newKey) => {
      const result = { ...obj };
      if (!(from in obj)) {
        return result;
      }
      const value = obj[from];
      delete result[from];
      result[newKey] = value;
      return result;
    };
    if (to === void 0) {
      return (obj) => rename(obj, objOrFrom, fromOrTo);
    }
    return rename(objOrFrom, fromOrTo, to);
  },
  /**
   * Safely reads a nested value by path.
   *
   * Supports string paths (`"a.b.0.c"`) and array paths (`['a', 'b', 0, 'c']`).
   * Returns `fallback` when the path cannot be resolved.
   *
   * Supports both call styles:
   * - `Obj.get(obj, path, fallback?)`
   * - `Obj.get(path, fallback?)(obj)`
   *
   * @template T - The object type
   * @template R - The fallback type
   * @param obj - The source object
   * @param path - Path to read
   * @param fallback - Optional fallback when missing
   * @returns The resolved value or fallback
   *
   * @example
   * ```typescript
   * const state = { user: { profile: { name: 'Ada' } }, items: [{ id: 1 }] };
   *
   * Obj.get(state, 'user.profile.name'); // 'Ada'
   * Obj.get(state, ['items', 0, 'id']); // 1
   * Obj.get(state, 'user.missing', 'Unknown'); // 'Unknown'
   *
   * const getUserName = Obj.get('user.profile.name');
   * getUserName(state); // 'Ada'
   * ```
   */
  get: (objOrPath, pathOrFallback, maybeFallback) => {
    const resolvePath = (path2) => Array.isArray(path2) ? path2 : path2.split(".").filter(Boolean);
    if (typeof objOrPath === "string" || Array.isArray(objOrPath)) {
      const path2 = resolvePath(objOrPath);
      const fallback2 = pathOrFallback;
      return (obj2) => {
        let current2 = obj2;
        for (const segment of path2) {
          if (current2 == null) return fallback2;
          current2 = current2[segment];
        }
        return current2 === void 0 ? fallback2 : current2;
      };
    }
    const obj = objOrPath;
    const path = resolvePath(pathOrFallback);
    const fallback = maybeFallback;
    let current = obj;
    for (const segment of path) {
      if (current == null) return fallback;
      current = current[segment];
    }
    return current === void 0 ? fallback : current;
  },
  /**
   * Sets a nested value by path (immutable).
   *
   * Creates missing objects/arrays as needed. Numeric path segments create arrays.
   * Supports both call styles:
   * - `Obj.set(obj, path, value)`
   * - `Obj.set(path, value)(obj)`
   *
   * @template T - The object type
   * @param obj - The source object
   * @param path - Path to set
   * @param value - Value to assign
   * @returns A new object with the updated value
   *
   * @example
   * ```typescript
   * const state = { user: { profile: { name: 'Ada' } }, items: [] };
   *
   * const updated = Obj.set(state, 'user.profile.name', 'Grace');
   * const updated2 = Obj.set(state, ['items', 0, 'id'], 42);
   *
   * const setName = Obj.set('user.profile.name', 'Lin');
   * setName(state);
   * ```
   */
  set: (objOrPath, pathOrValue, maybeValue) => {
    const resolvePath = (path2) => Array.isArray(path2) ? path2 : path2.split(".").filter(Boolean);
    const setAtPath = (obj2, path2, value2) => {
      if (path2.length === 0) return value2;
      const [segment, ...rest] = path2;
      const isIndex = typeof segment === "number";
      const base = Array.isArray(obj2) ? obj2.slice() : { ...obj2 != null ? obj2 : isIndex ? [] : {} };
      const nextValue = setAtPath((obj2 != null ? obj2 : isIndex ? [] : {})[segment], rest, value2);
      base[segment] = nextValue;
      return base;
    };
    if (typeof objOrPath === "string" || Array.isArray(objOrPath)) {
      const path2 = resolvePath(objOrPath);
      const value2 = pathOrValue;
      return (obj2) => setAtPath(obj2, path2, value2);
    }
    const obj = objOrPath;
    const path = resolvePath(pathOrValue);
    const value = maybeValue;
    return setAtPath(obj, path, value);
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
function List(container, options) {
  if (!container) {
    const noop = () => {
    };
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
  let currentItems = [];
  if (options.reconcile) {
    return {
      set(items) {
        options.reconcile(currentItems, items, container, options.render);
        currentItems = [...items];
      },
      append(items) {
        const newItems = [...currentItems, ...items];
        options.reconcile(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      prepend(items) {
        const newItems = [...items, ...currentItems];
        options.reconcile(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      insert(index2, items) {
        const newItems = [
          ...currentItems.slice(0, index2),
          ...items,
          ...currentItems.slice(index2)
        ];
        options.reconcile(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      remove(predicate) {
        const newItems = currentItems.filter((item) => !predicate(item));
        options.reconcile(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      update(predicate, updater) {
        const newItems = currentItems.map(
          (item) => predicate(item) ? updater(item) : item
        );
        options.reconcile(currentItems, newItems, container, options.render);
        currentItems = newItems;
      },
      clear() {
        options.reconcile(currentItems, [], container, options.render);
        currentItems = [];
      },
      items: () => currentItems,
      elements: () => Array.from(container.children),
      destroy() {
        this.clear();
      }
    };
  }
  if (options.key) {
    const elementMap = /* @__PURE__ */ new Map();
    const reconcile = (newItems) => {
      const newKeys = new Set(newItems.map(options.key));
      currentItems.forEach((item) => {
        var _a;
        const key = options.key(item);
        if (!newKeys.has(key)) {
          const el2 = elementMap.get(key);
          if (el2) {
            (_a = options.onRemove) == null ? void 0 : _a.call(options, el2, item);
            el2.remove();
            elementMap.delete(key);
          }
        }
      });
      const newElements = [];
      newItems.forEach((item, index2) => {
        var _a;
        const key = options.key(item);
        let el2 = elementMap.get(key);
        if (el2) {
          if (options.update) {
            options.update(el2, item, index2);
          }
        } else {
          el2 = options.render(item, index2);
          elementMap.set(key, el2);
          (_a = options.onAdd) == null ? void 0 : _a.call(options, el2, item);
        }
        newElements.push(el2);
      });
      newElements.forEach((el2, index2) => {
        const currentEl = container.children[index2];
        if (currentEl !== el2) {
          container.insertBefore(el2, currentEl || null);
        }
      });
      currentItems = [...newItems];
    };
    return {
      set(items) {
        reconcile(items);
      },
      append(items) {
        reconcile([...currentItems, ...items]);
      },
      prepend(items) {
        reconcile([...items, ...currentItems]);
      },
      insert(index2, items) {
        reconcile([
          ...currentItems.slice(0, index2),
          ...items,
          ...currentItems.slice(index2)
        ]);
      },
      remove(predicate) {
        reconcile(currentItems.filter((item) => !predicate(item)));
      },
      update(predicate, updater) {
        reconcile(currentItems.map((item) => predicate(item) ? updater(item) : item));
      },
      clear() {
        reconcile([]);
      },
      items: () => currentItems,
      elements: () => Array.from(container.children),
      destroy() {
        this.clear();
        elementMap.clear();
      }
    };
  }
  const render = (items) => {
    container.replaceChildren(...items.map((item, index2) => options.render(item, index2)));
    currentItems = [...items];
  };
  return {
    set(items) {
      render(items);
    },
    append(items) {
      render([...currentItems, ...items]);
    },
    prepend(items) {
      render([...items, ...currentItems]);
    },
    insert(index2, items) {
      render([
        ...currentItems.slice(0, index2),
        ...items,
        ...currentItems.slice(index2)
      ]);
    },
    remove(predicate) {
      render(currentItems.filter((item) => !predicate(item)));
    },
    update(predicate, updater) {
      render(currentItems.map((item) => predicate(item) ? updater(item) : item));
    },
    clear() {
      render([]);
    },
    items: () => currentItems,
    elements: () => Array.from(container.children),
    destroy() {
      this.clear();
    }
  };
}
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
function viewRefs(templateFactory) {
  return (options) => {
    const ctx = {
      refs: {}
    };
    const element = templateFactory(ctx);
    const extractedRefs = refs(element);
    Object.assign(ctx.refs, extractedRefs);
    if (options) {
      if (options.className) {
        const classes = Array.isArray(options.className) ? options.className : [options.className];
        element.classList.add(...classes);
      }
      if (options.id) {
        element.id = options.id;
      }
      if (options.props) {
        modify(element, options.props);
      }
    }
    const applyValueToRef = (el2, value) => {
      if (value === null || value === void 0) {
        return;
      }
      if (typeof value === "string" || typeof value === "number") {
        el2.textContent = String(value);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        if ("text" in value || "html" in value || "class" in value || "style" in value || "attr" in value) {
          modify(el2, value);
        } else if ("value" in value && "value" in el2) {
          el2.value = value.value;
        } else {
          modify(el2, value);
        }
      }
    };
    return {
      element,
      refs: ctx.refs,
      update(props) {
        modify(element, props);
      },
      updateRefs(updates) {
        Object.entries(updates).forEach(([key, value]) => {
          const el2 = ctx.refs[key];
          if (el2) {
            applyValueToRef(el2, value);
          }
        });
      },
      bind(key) {
        return (value) => {
          const el2 = ctx.refs[key];
          if (el2) {
            applyValueToRef(el2, value);
          }
        };
      },
      destroy() {
        element.remove();
      }
    };
  };
}
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
Object.assign(cls, {
  watch: watchClass,
  cycle: cycleClass
});
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
  let clearCount = 0;
  const add = (fn) => {
    unsubs.push(fn);
    return fn;
  };
  return {
    /**
     * Registers a cleanup function or unsubscribe callback.
     * Returns the cleanup for convenient chaining.
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
    add,
    /**
     * Registers multiple cleanup functions at once.
     * 
     * @example
     * ```typescript
     * group.addMany(
     *   on(btn)('click', handler),
     *   on(window)('resize', resizeHandler)
     * );
     * ```
     */
    addMany: (...fns) => {
      fns.forEach((fn) => add(fn));
      return fns;
    },
    /**
     * Runs a generator and auto-registers any cleanups it returns.
     * If the group is cleared before async work completes, late cleanups
     * are executed immediately.
     *
     * @example
     * ```typescript
     * group.auto((register) => {
     *   register(on(btn)('click', handler));
     *   return 'ready';
     * });
     * ```
     */
    auto: (gen) => {
      const startClearCount = clearCount;
      const register = (cleanup) => {
        if (clearCount !== startClearCount) {
          cleanup();
          return cleanup;
        }
        unsubs.push(cleanup);
        return cleanup;
      };
      return gen(register);
    },
    /**
     * Returns the number of registered cleanups.
     */
    size: () => unsubs.length,
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
      let firstError = null;
      const pending = unsubs.splice(0);
      pending.forEach((fn) => {
        try {
          fn();
        } catch (err) {
          if (!firstError) {
            firstError = err;
          }
        }
      });
      clearCount += 1;
      if (firstError) {
        throw firstError;
      }
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
  const chain2 = (fn) => (...args) => {
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
    on: chain2(on),
    /**
     * Dispatches a custom event.
     * @param name - Name of the event
     * @param detail - Data to pass with the event
     * @returns {this} Fluent wrapper for chaining
     */
    dispatch: chain2(dispatch),
    // =========================================
    // MANIPULATION
    // =========================================
    /**
     * Modifies element properties (text, html, class, etc.).
     * @param props - Object of properties to set
     * @returns {this} Fluent wrapper for chaining
     */
    modify: chain2(modify),
    /**
     * Applies inline CSS styles.
     * @param styles - Object of CSS properties (camelCase or kebab-case)
     * @returns {this} Fluent wrapper for chaining
     */
    css: chain2(css),
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
    append: chain2(append),
    /**
     * Prepends children to this element.
     * @param children - Elements or strings to prepend
     * @returns {this} Fluent wrapper for chaining
     */
    prepend: chain2(prepend),
    /**
     * Inserts content after this element.
     * @param content - Elements or strings to insert
     * @returns {this} Fluent wrapper for chaining
     */
    after: chain2(after),
    /**
     * Inserts content before this element.
     * @param content - Elements or strings to insert
     * @returns {this} Fluent wrapper for chaining
     */
    before: chain2(before),
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
    wrap: chain2(wrap),
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
    addClass: chain2(cls.add),
    /**
     * Removes one or more classes.
     * @param classes - Class names to remove
     * @returns {this} Fluent wrapper for chaining
     */
    removeClass: chain2(cls.remove),
    /**
     * Toggles a class (conditionally or always).
     * @param className - Class to toggle
     * @param force - Optional boolean to force add/remove
     * @returns {this} Fluent wrapper for chaining
     */
    toggleClass: chain2(cls.toggle),
    /**
     * Replaces one class with another.
     * @param oldClass - Class to remove
     * @param newClass - Class to add
     * @returns {this} Fluent wrapper for chaining
     */
    replaceClass: chain2(cls.replace),
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
    cycleClass: chain2(cycleClass),
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
    dataSet: chain2(Data.set),
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
    watchAttr: (attr2, handler) => target ? watchAttr(target)(attr2, handler) : () => {
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
      return onClickOutside(target, () => handler());
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
    transitionName: chain2(ViewTransitions.name),
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
    attr: map((el2) => (attr2) => modify(el2)({ attr: attr2 })),
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
  if (!element) return new EventTarget();
  const target = new EventTarget();
  return new Proxy(target, {
    get: (t, prop2) => {
      if (prop2 in t) {
        const val = t[prop2];
        return typeof val === "function" ? val.bind(t) : val;
      }
      return Data.read(element)(String(prop2));
    },
    set: (t, prop2, value) => {
      if (prop2 in t) return true;
      Data.set(element)(String(prop2), value);
      t.dispatchEvent(new CustomEvent(String(prop2), { detail: value }));
      t.dispatchEvent(new CustomEvent("change", { detail: { prop: prop2, value } }));
      return true;
    },
    deleteProperty: (t, prop2) => {
      if (prop2 in t) return false;
      Data.set(element)(String(prop2), null);
      t.dispatchEvent(new CustomEvent(String(prop2), { detail: null }));
      t.dispatchEvent(new CustomEvent("change", { detail: { prop: prop2, value: null } }));
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
   * Watches input while respecting IME composition events.
   * Fires on compositionend or non-composing input.
   *
   * @example
   * ```typescript
   * Input.watchComposed(input)((value) => update(value));
   * ```
   */
  watchComposed: (el2) => {
    return (callback) => {
      if (!el2) return () => {
      };
      let composing = false;
      const handleCompositionStart = () => {
        composing = true;
      };
      const handleCompositionEnd = (e) => {
        composing = false;
        callback(Input.get(el2), e);
      };
      const handleInput = (e) => {
        if (!composing) callback(Input.get(el2), e);
      };
      el2.addEventListener("compositionstart", handleCompositionStart);
      el2.addEventListener("compositionend", handleCompositionEnd);
      el2.addEventListener("input", handleInput);
      return () => {
        el2.removeEventListener("compositionstart", handleCompositionStart);
        el2.removeEventListener("compositionend", handleCompositionEnd);
        el2.removeEventListener("input", handleInput);
      };
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
var autoResize = (textarea, options = {}) => {
  if (!textarea) return () => {
  };
  const { maxHeight } = options;
  const resize = () => {
    textarea.style.height = "auto";
    const height = textarea.scrollHeight;
    const nextHeight = maxHeight ? Math.min(height, maxHeight) : height;
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = maxHeight && height > maxHeight ? "auto" : "hidden";
  };
  resize();
  textarea.addEventListener("input", resize);
  return () => textarea.removeEventListener("input", resize);
};
var createUpload = (dropzone, options = {}) => {
  var _a;
  const target = typeof dropzone === "string" ? find(document)(dropzone) : dropzone;
  if (!target) {
    return {
      open: () => {
      },
      destroy: () => {
      },
      input: null
    };
  }
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = !!options.multiple;
  if ((_a = options.accept) == null ? void 0 : _a.length) {
    input.accept = options.accept.join(",");
  }
  input.style.display = "none";
  target.appendChild(input);
  const acceptsFile = (file) => {
    if (!options.accept || options.accept.length === 0) return true;
    return options.accept.some((rule) => {
      if (rule.endsWith("/*")) {
        const prefix = rule.replace("/*", "");
        return file.type.startsWith(prefix);
      }
      if (rule.startsWith(".")) {
        return file.name.toLowerCase().endsWith(rule.toLowerCase());
      }
      return file.type === rule;
    });
  };
  const handleFiles = async (files) => {
    var _a2, _b, _c;
    const validFiles = [];
    files.forEach((file) => {
      var _a3, _b2;
      if (!acceptsFile(file)) {
        (_a3 = options.onError) == null ? void 0 : _a3.call(options, file, new Error("File type not accepted."));
        return;
      }
      if (options.maxSize && file.size > options.maxSize) {
        (_b2 = options.onError) == null ? void 0 : _b2.call(options, file, new Error("File exceeds maximum size."));
        return;
      }
      validFiles.push(file);
    });
    if (validFiles.length === 0) return;
    (_a2 = options.onFiles) == null ? void 0 : _a2.call(options, validFiles);
    if (options.upload) {
      for (const file of validFiles) {
        try {
          const response = await options.upload(file, (percent) => {
            var _a3;
            (_a3 = options.onProgress) == null ? void 0 : _a3.call(options, file, percent);
          });
          (_b = options.onComplete) == null ? void 0 : _b.call(options, file, response);
        } catch (error) {
          (_c = options.onError) == null ? void 0 : _c.call(
            options,
            file,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }
  };
  const handleInputChange = () => {
    const files = input.files ? Array.from(input.files) : [];
    handleFiles(files);
    input.value = "";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    var _a2, _b;
    e.preventDefault();
    const files = Array.from((_b = (_a2 = e.dataTransfer) == null ? void 0 : _a2.files) != null ? _b : []);
    handleFiles(files);
  };
  const handleClick = () => input.click();
  input.addEventListener("change", handleInputChange);
  target.addEventListener("click", handleClick);
  target.addEventListener("dragover", handleDragOver);
  target.addEventListener("drop", handleDrop);
  return {
    open: () => input.click(),
    destroy: () => {
      input.removeEventListener("change", handleInputChange);
      target.removeEventListener("click", handleClick);
      target.removeEventListener("dragover", handleDragOver);
      target.removeEventListener("drop", handleDrop);
      input.remove();
    },
    input
  };
};
var draggable = (element, options = {}) => {
  var _a;
  if (!element) return () => {
  };
  const axis = (_a = options.axis) != null ? _a : "both";
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let originX = 0;
  let originY = 0;
  let boundsRect = null;
  let startRect = null;
  const resolveBounds = () => {
    if (!options.bounds) return null;
    if (typeof options.bounds === "string") {
      const el2 = find(document)(options.bounds);
      return el2 ? el2.getBoundingClientRect() : null;
    }
    if (options.bounds instanceof HTMLElement) {
      return options.bounds.getBoundingClientRect();
    }
    if (options.bounds instanceof DOMRect) {
      return options.bounds;
    }
    return options.bounds;
  };
  const applyTransform = (x, y) => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  };
  const handlePointerMove = (e) => {
    var _a2;
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let nextX = axis === "y" ? originX : originX + dx;
    let nextY = axis === "x" ? originY : originY + dy;
    if (boundsRect && startRect) {
      const minX = boundsRect.left - startRect.left;
      const maxX = boundsRect.right - startRect.right;
      const minY = boundsRect.top - startRect.top;
      const maxY = boundsRect.bottom - startRect.bottom;
      if (axis !== "y") nextX = Math.min(Math.max(nextX, minX), maxX);
      if (axis !== "x") nextY = Math.min(Math.max(nextY, minY), maxY);
    }
    currentX = nextX;
    currentY = nextY;
    applyTransform(currentX, currentY);
    (_a2 = options.onDrag) == null ? void 0 : _a2.call(options, { x: currentX, y: currentY });
  };
  const handlePointerUp = () => {
    var _a2;
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    (_a2 = options.onDrop) == null ? void 0 : _a2.call(options, { x: currentX, y: currentY });
  };
  const handlePointerDown = (e) => {
    var _a2;
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    originX = currentX;
    originY = currentY;
    boundsRect = resolveBounds();
    startRect = element.getBoundingClientRect();
    (_a2 = element.setPointerCapture) == null ? void 0 : _a2.call(element, e.pointerId);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };
  element.addEventListener("pointerdown", handlePointerDown);
  return () => {
    element.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };
};
var createSortable = (container, options) => {
  if (!container) {
    return {
      refresh: () => {
      },
      destroy: () => {
      }
    };
  }
  const { items, handle, onReorder } = options;
  let dragging = null;
  let fromIndex = -1;
  const getItems = () => Array.from(container.querySelectorAll(items));
  const onDragStart = (e) => {
    var _a, _b;
    const target = e.currentTarget;
    if (handle && !((_a = e.target) == null ? void 0 : _a.closest(handle))) {
      e.preventDefault();
      return;
    }
    dragging = target;
    fromIndex = getItems().indexOf(target);
    (_b = e.dataTransfer) == null ? void 0 : _b.setData("text/plain", "");
  };
  const onDragEnd = () => {
    if (!dragging) return;
    const toIndex = getItems().indexOf(dragging);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onReorder == null ? void 0 : onReorder(fromIndex, toIndex);
    }
    dragging = null;
    fromIndex = -1;
  };
  const onDragOver = (e) => {
    var _a;
    e.preventDefault();
    if (!dragging) return;
    const target = (_a = e.target) == null ? void 0 : _a.closest(items);
    if (!target || target === dragging) return;
    const currentItems = getItems();
    const draggingIndex = currentItems.indexOf(dragging);
    const targetIndex = currentItems.indexOf(target);
    if (draggingIndex < targetIndex) {
      container.insertBefore(dragging, target.nextSibling);
    } else {
      container.insertBefore(dragging, target);
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
  };
  const bindItems = () => {
    getItems().forEach((item) => {
      item.draggable = true;
      item.addEventListener("dragstart", onDragStart);
      item.addEventListener("dragend", onDragEnd);
    });
  };
  const unbindItems = () => {
    getItems().forEach((item) => {
      item.removeEventListener("dragstart", onDragStart);
      item.removeEventListener("dragend", onDragEnd);
    });
  };
  bindItems();
  container.addEventListener("dragover", onDragOver);
  container.addEventListener("drop", onDrop);
  return {
    refresh: () => {
      unbindItems();
      bindItems();
    },
    destroy: () => {
      unbindItems();
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("drop", onDrop);
    }
  };
};
var onClickOutside = (target, handler, options = {}) => {
  var _a, _b;
  const resolve = (input) => {
    if (typeof input === "function") return input();
    if (typeof input === "string") return find(document)(input);
    return input;
  };
  const root = resolve(target);
  if (!root) return () => {
  };
  const ignore = ((_a = options.ignore) != null ? _a : []).map(resolve).filter((el2) => !!el2);
  const capture = (_b = options.capture) != null ? _b : true;
  const listener = (event) => {
    var _a2;
    const path = (_a2 = event.composedPath) == null ? void 0 : _a2.call(event);
    const eventTarget = event.target;
    const isInside = path ? path.includes(root) : !!eventTarget && root.contains(eventTarget);
    if (isInside) return;
    const isIgnored = ignore.some(
      (el2) => path ? path.includes(el2) : !!eventTarget && el2.contains(eventTarget)
    );
    if (!isIgnored) handler(event);
  };
  document.addEventListener("pointerdown", listener, { capture });
  return () => document.removeEventListener("pointerdown", listener, { capture });
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
var createMediaQuery = (queries) => {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
    return {
      matches: {},
      on: () => () => {
      },
      destroy: () => {
      }
    };
  }
  const matches = {};
  const listeners = [];
  const mqlMap = /* @__PURE__ */ new Map();
  Object.keys(queries).forEach((key) => {
    const query = queries[key];
    const mql = window.matchMedia(query);
    matches[key] = mql.matches;
    mqlMap.set(key, mql);
  });
  const on2 = (key, handler) => {
    const mql = mqlMap.get(key);
    if (!mql) return () => {
    };
    const listener = (e) => {
      matches[key] = e.matches;
      handler(e.matches);
    };
    matches[key] = mql.matches;
    handler(mql.matches);
    if ("addEventListener" in mql) {
      mql.addEventListener("change", listener);
      listeners.push(() => mql.removeEventListener("change", listener));
      return () => mql.removeEventListener("change", listener);
    }
    const legacyListener = (e) => listener(e);
    mql.addListener(legacyListener);
    const cleanup = () => mql.removeListener(legacyListener);
    listeners.push(cleanup);
    return cleanup;
  };
  return {
    matches,
    on: on2,
    destroy: () => {
      listeners.forEach((cleanup) => cleanup());
      listeners.length = 0;
    }
  };
};
var Key = {
  /**
   * Returns true if the keyboard event matches a key or predicate.
   * Supports optional currying.
   *
   * @example
   * ```typescript
   * if (Key.matches(e, 'Enter')) onSubmit();
   * if (Key.matches(['ArrowUp', 'ArrowDown'])(e)) moveFocus();
   * ```
   */
  matches: (eventOrKey, keyOrPredicate) => {
    const matchesKey = (event, matcher2) => {
      if (typeof matcher2 === "function") return matcher2(event.key);
      if (Array.isArray(matcher2)) return matcher2.includes(event.key);
      return event.key === matcher2;
    };
    if (typeof eventOrKey === "object" && "key" in eventOrKey) {
      if (!keyOrPredicate) return false;
      return matchesKey(eventOrKey, keyOrPredicate);
    }
    const matcher = eventOrKey;
    return (event) => matchesKey(event, matcher);
  },
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
var A11y = /* @__PURE__ */ (() => {
  let liveRegion = null;
  const ensureLiveRegion = () => {
    if (typeof document === "undefined" || !document.body) return null;
    if (!liveRegion || !document.body.contains(liveRegion)) {
      liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.setAttribute("role", "status");
      liveRegion.style.position = "absolute";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.margin = "-1px";
      liveRegion.style.padding = "0";
      liveRegion.style.border = "0";
      liveRegion.style.overflow = "hidden";
      liveRegion.style.clip = "rect(0 0 0 0)";
      liveRegion.style.clipPath = "inset(50%)";
      liveRegion.style.whiteSpace = "nowrap";
      document.body.appendChild(liveRegion);
    }
    return liveRegion;
  };
  const resolve = (input) => {
    if (typeof input === "function") return input();
    if (typeof input === "string") return find(document)(input);
    return input;
  };
  return {
    /**
     * Announces a message to screen readers.
     *
     * @param message - Message to announce
     * @param politeness - 'polite' or 'assertive'
     *
     * @example
     * ```typescript
     * A11y.announce('Saved', 'polite');
     * ```
     */
    announce: (message, politeness = "polite") => {
      const region = ensureLiveRegion();
      if (!region) return;
      region.setAttribute("aria-live", politeness);
      region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
      region.textContent = "";
      const announceNow = () => {
        region.textContent = message;
      };
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(announceNow);
      } else {
        setTimeout(announceNow, 0);
      }
    },
    /**
     * Sets aria-expanded and aria-controls on a trigger/panel pair.
     *
     * @param triggerInput - Trigger element or selector
     * @param panelInput - Panel element or selector
     * @param expanded - Optional expanded state (defaults to toggle)
     * @returns Final expanded state
     *
     * @example
     * ```typescript
     * A11y.setExpanded(button, panel, true);
     * ```
     */
    setExpanded: (triggerInput, panelInput, expanded) => {
      const trigger = resolve(triggerInput);
      const panel = resolve(panelInput);
      if (!trigger || !panel) return null;
      const current = trigger.getAttribute("aria-expanded") === "true";
      const next = expanded != null ? expanded : !current;
      const panelId = panel.id || `panel-${Math.random().toString(36).slice(2, 9)}`;
      panel.id = panelId;
      trigger.setAttribute("aria-controls", panelId);
      trigger.setAttribute("aria-expanded", String(next));
      return next;
    },
    /**
     * Sets aria-selected for an option and clears siblings within a listbox.
     *
     * @param optionInput - Option element or selector
     * @param listboxInput - Optional listbox container
     * @param selected - Selected state (default: true)
     *
     * @example
     * ```typescript
     * A11y.setSelected(option, listbox, true);
     * ```
     */
    setSelected: (optionInput, listboxInput, selected = true) => {
      const option = resolve(optionInput);
      if (!option) return null;
      const listbox = listboxInput ? resolve(listboxInput) : null;
      if (listbox) {
        listbox.querySelectorAll('[aria-selected="true"]').forEach((el2) => {
          if (el2 !== option) {
            el2.setAttribute("aria-selected", "false");
          }
        });
      }
      option.setAttribute("aria-selected", String(selected));
      return selected;
    },
    /**
     * Creates roving tabindex behavior for composite widgets.
     *
     * @param root - Widget root element
     * @param selector - Selector for focusable items
     * @param options - Roving options
     * @returns Cleanup function
     *
     * @example
     * ```typescript
     * const stop = A11y.roving(toolbar, 'button', { axis: 'horizontal' });
     * ```
     */
    roving: (root, selector, options = {}) => {
      var _a, _b;
      if (!root) return () => {
      };
      const items = Array.from(root.querySelectorAll(selector));
      if (items.length === 0) return () => {
      };
      const axis = (_a = options.axis) != null ? _a : "both";
      const loop = (_b = options.loop) != null ? _b : true;
      const resolveInitial = () => {
        if (typeof options.initial === "number") {
          return Math.min(Math.max(options.initial, 0), items.length - 1);
        }
        if (options.initial instanceof HTMLElement) {
          const idx = items.indexOf(options.initial);
          if (idx >= 0) return idx;
        }
        const existing = items.findIndex((item) => item.tabIndex === 0);
        return existing >= 0 ? existing : 0;
      };
      let currentIndex = resolveInitial();
      const setActive = (index2, focusItem) => {
        var _a2;
        currentIndex = index2;
        items.forEach((item, i) => {
          item.tabIndex = i === index2 ? 0 : -1;
        });
        if (focusItem) {
          (_a2 = items[index2]) == null ? void 0 : _a2.focus();
        }
      };
      setActive(currentIndex, false);
      const handleKey = (e) => {
        const key = e.key;
        const isHorizontal = axis === "horizontal" || axis === "both";
        const isVertical = axis === "vertical" || axis === "both";
        let nextIndex = currentIndex;
        if (key === "Home") {
          nextIndex = 0;
        } else if (key === "End") {
          nextIndex = items.length - 1;
        } else if (isHorizontal && key === "ArrowRight") {
          nextIndex = currentIndex + 1;
        } else if (isHorizontal && key === "ArrowLeft") {
          nextIndex = currentIndex - 1;
        } else if (isVertical && key === "ArrowDown") {
          nextIndex = currentIndex + 1;
        } else if (isVertical && key === "ArrowUp") {
          nextIndex = currentIndex - 1;
        } else {
          return;
        }
        e.preventDefault();
        if (loop) {
          if (nextIndex < 0) nextIndex = items.length - 1;
          if (nextIndex >= items.length) nextIndex = 0;
        } else {
          nextIndex = Math.min(Math.max(nextIndex, 0), items.length - 1);
        }
        setActive(nextIndex, true);
      };
      root.addEventListener("keydown", handleKey);
      return () => root.removeEventListener("keydown", handleKey);
    }
  };
})();
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
  def,
  /**
   * Creates a function that accepts data as either the first OR the last argument.
   * 
   * @param fn - The original function (must be written as Data-First: (data, ...args) => result)
   * @param isData - A Type Guard to identify the Data argument at runtime.
   */
  makeDataFirstOrLast(fn, isData) {
    return (...args) => {
      if (args.length > 0 && isData(args[0])) {
        const data = args[0];
        const rest = args.slice(1);
        return fn(data, ...rest);
      }
      const lastIndex = args.length - 1;
      if (lastIndex >= 0 && isData(args[lastIndex])) {
        const data = args[lastIndex];
        const rest = args.slice(0, lastIndex);
        return fn(data, ...rest);
      }
      throw new Error(
        "Could not determine call signature: Data argument not found at start or end."
      );
    };
  },
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
  pipe: (...fns) => (x) => fns.reduce((v, f) => f(v), x),
  /**
   * Alias for `chain` utility.
   */
  chain,
  /**
   * Alias for `exec` utility.
   */
  exec,
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
  curry: (fn) => (a) => (b) => fn(a, b),
  /**
   * Prefills the first argument for multiple functions.
   *
   * Supports both call styles:
   * - `Fn.withArg(arg, fn1, fn2)`
   * - `Fn.withArg(arg)(fn1, fn2)`
   *
   * Returns a tuple of functions with `arg` applied as the first parameter.
   *
   * @template E - The first argument type
   * @template F - Tuple of functions that accept `E` first
   * @param arg - The argument to prefill
   * @param fns - Functions to prefill with `arg`
   * @returns Tuple of functions with `arg` applied
   *
   * @example
   * ```typescript
   * import { Fn, on, modify } from '@doeixd/dom';
   *
   * const [onButton, modifyButton] = Fn.withArg(button, on, modify);
   * onButton('click', handler);
   * modifyButton({ text: 'Save' });
   *
   * const [onCard, modifyCard] = Fn.withArg(card)(on, modify);
   * onCard('mouseenter', handler);
   * modifyCard({ class: { active: true } });
   * ```
   */
  withArg: /* @__PURE__ */ (() => {
    const apply2 = (arg, fns) => fns.map((fn) => (...args) => fn(arg, ...args));
    const wrapper = (arg, ...fns) => {
      if (fns.length > 0) {
        return apply2(arg, fns);
      }
      return (...rest) => apply2(arg, rest);
    };
    return wrapper;
  })(),
  /**
   * Converts a data-first function into a data-last, dual-mode function.
   *
   * Turns `(data, ...args) => result` into:
   * - Immediate: `(...args, data) => result`
   * - Curried: `(...args) => (data) => result`
   *
   * Detection defaults to arity (`fn.length`) and can be customized with:
   * - `arity`: expected argument count (including data)
   * - `isData`: predicate for the last argument
   *
   * @template D - The data type
   * @template A - Argument tuple (excluding data)
   * @template R - Return type
   * @param fn - Data-first function
   * @param config - Optional arity or predicate config
   * @returns Dual-mode data-last function
   *
   * @example
   * ```typescript
   * import { Fn, on } from '@doeixd/dom';
   *
   * const onLast = Fn.dataLast(on, { arity: 3 });
   * onLast('click', handler, button); // Immediate
   * onLast('click', handler)(button); // Curried
   * ```
   *
   * @example
   * ```typescript
   * import { Fn, modify } from '@doeixd/dom';
   *
   * const modifyLast = Fn.dataLast(modify, (value): value is HTMLElement => value instanceof HTMLElement);
   * modifyLast({ text: 'Save' }, button);
   * modifyLast({ text: 'Save' })(button);
   * ```
   */
  dataLast: (fn, config) => {
    var _a;
    const arity = typeof config === "number" ? config : typeof config === "function" ? fn.length : (_a = config == null ? void 0 : config.arity) != null ? _a : fn.length;
    const isData = typeof config === "function" ? config : typeof config === "number" ? void 0 : config == null ? void 0 : config.isData;
    return (...args) => {
      if (isData) {
        if (args.length > 0 && isData(args[args.length - 1])) {
          const data = args[args.length - 1];
          const rest = args.slice(0, -1);
          return fn(data, ...rest);
        }
        return (data) => fn(data, ...args);
      }
      if (args.length >= arity) {
        const data = args[args.length - 1];
        const rest = args.slice(0, -1);
        return fn(data, ...rest);
      }
      return (data) => fn(data, ...args);
    };
  },
  /**
   * Builds a data-last transformer from a predicate.
   *
   * Useful when arity detection is ambiguous or when the data argument can be
   * inferred by shape (like elements, selectors, or custom objects).
   *
   * Supports both call styles:
   * - `Fn.dataLastPred(isData, fn1, fn2)`
   * - `Fn.dataLastPred(isData)(fn1, fn2)`
   *
   * @param isData - Predicate that identifies the data argument
   * @returns Data-last versions of the provided functions
   *
   * @example
   * ```typescript
   * import { Fn, on } from '@doeixd/dom';
   *
   * const isElement = (value: unknown): value is HTMLElement => value instanceof HTMLElement;
   * const [onLast] = Fn.dataLastPred(isElement)(on);
   *
   * onLast('click', handler, button);
   * onLast('click', handler)(button);
   * ```
   *
   * @example
   * ```typescript
   * import { Fn, modify, cls } from '@doeixd/dom';
   *
   * const isTarget = (value: unknown): value is HTMLElement | null =>
   *   value === null || value instanceof HTMLElement;
   *
   * const [modifyLast, addClassLast] = Fn.dataLastPred(isTarget)(modify, cls.add);
   * modifyLast({ text: 'Save' }, button);
   * addClassLast('active', button);
   * ```
   */
  dataLastPred: /* @__PURE__ */ (() => {
    const wrapper = (isData, ...fns) => {
      if (fns.length > 0) {
        return fns.map((fn) => Fn.dataLast(fn, { isData }));
      }
      return (...rest) => rest.map((fn) => Fn.dataLast(fn, { isData }));
    };
    return wrapper;
  })(),
  /**
   * Element/selector-aware data-last helper.
   *
   * Uses a built-in predicate that treats `ElementInput` as the data argument,
   * enabling immediate vs curried behavior for element/selector inputs.
   *
   * @returns Data-last versions of the provided functions
   *
   * @example
   * ```typescript
   * import { Fn, on, modify } from '@doeixd/dom';
   *
   * const [onLast, modifyLast] = Fn.dataLastEl(on, modify);
   *
   * onLast('click', handler, button);
   * onLast('click', handler)(button);
   * onLast('click', handler, '#save');
   * onLast('click', handler)('#save');
   *
   * modifyLast({ text: 'Save' }, button);
   * modifyLast({ text: 'Save' })('#save');
   * ```
   */
  dataLastEl: /* @__PURE__ */ (() => {
    const isElementInput = (value) => {
      if (value === null || value === void 0) return true;
      if (typeof value === "string") return true;
      if (typeof value === "function") return true;
      return value instanceof Element;
    };
    const wrapper = (...fns) => Fn.dataLastPred(isElementInput)(...fns);
    return wrapper;
  })(),
  /**
   * Makes a function flexible about the position of its first argument.
   *
   * Supports all of the following call styles:
   * - `fnFlex(firstArg, ...rest)`
   * - `fnFlex(firstArg)(...rest)`
   * - `fnFlex(...rest, firstArg)`
   * - `fnFlex(...rest)(firstArg)`
   *
   * For ambiguous signatures, pass a predicate to identify the first argument
   * (the "subject") so immediate vs curried behavior is deterministic.
   *
   * @template D - The first argument type
   * @template A - Remaining arguments tuple
   * @template R - Return type
   * @param fn - Function to wrap
   * @param isFirstArg - Optional predicate for the first argument
   * @returns A flexible function with both data-first and data-last usage
   *
   * @example
   * ```typescript
   * import { Fn, on } from '@doeixd/dom';
   *
   * const isElement = (value: unknown): value is HTMLElement => value instanceof HTMLElement;
   * const onFlex = Fn.flex(on, isElement);
   *
   * onFlex(button, 'click', handler);
   * onFlex(button)('click', handler);
   * onFlex('click', handler, button);
   * onFlex('click', handler)(button);
   * ```
   *
   * @example
   * ```typescript
   * import { Fn, modify } from '@doeixd/dom';
   *
   * const isTarget = (value: unknown): value is HTMLElement | null =>
   *   value === null || value instanceof HTMLElement;
   *
   * const modifyFlex = Fn.flex(modify, isTarget);
   * modifyFlex(button, { text: 'Save' });
   * modifyFlex({ text: 'Save' }, button);
   * ```
   */
  flex: (fn, isFirstArg) => {
    const arity = fn.length;
    return (...args) => {
      if (args.length === 0) {
        return (data) => fn(data, ...[]);
      }
      if (isFirstArg) {
        const first = args[0];
        if (isFirstArg(first)) {
          if (args.length === 1) {
            return (...rest) => fn(first, ...rest);
          }
          return fn(first, ...args.slice(1));
        }
        const last = args[args.length - 1];
        if (isFirstArg(last)) {
          if (args.length === 1) {
            return (...rest) => fn(last, ...rest);
          }
          return fn(last, ...args.slice(0, -1));
        }
      }
      if (args.length >= arity) {
        return fn(args[0], ...args.slice(1));
      }
      return (data) => fn(data, ...args);
    };
  },
  /**
   * Element/selector-aware flex helper.
   *
   * Uses the same ElementInput predicate as `dataLastEl`, enabling flexible
   * first/last positioning for element/selector inputs.
   *
   * @returns Flexible versions of the provided functions
   *
   * @example
   * ```typescript
   * import { Fn, on, modify } from '@doeixd/dom';
   *
   * const [onFlex, modifyFlex] = Fn.flexEl(on, modify);
   *
   * onFlex(button, 'click', handler);
   * onFlex('click', handler, button);
   * onFlex('click', handler)(button);
   *
   * modifyFlex(button, { text: 'Save' });
   * modifyFlex({ text: 'Save' }, '#save');
   * ```
   */
  flexEl: /* @__PURE__ */ (() => {
    const isElementInput = (value) => {
      if (value === null || value === void 0) return true;
      if (typeof value === "string") return true;
      if (typeof value === "function") return true;
      return value instanceof Element;
    };
    const wrapper = (...fns) => fns.map((fn) => Fn.flex(fn, isElementInput));
    return wrapper;
  })(),
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
  swap: (fn) => (b) => (a) => fn(a)(b),
  /**
   * Flips the arguments of a non-curried binary function.
   * Transforms `fn(a, b)` into `fn(b, a)`.
   * 
   * @param fn - The binary function to flip.
   */
  flip: (fn) => (b, a) => fn(a, b),
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
  tap: (fn) => (x) => {
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
  maybe: (fn) => (x) => {
    return x === null || x === void 0 ? null : fn(x);
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
  converge: (h2, ...fns) => (x) => {
    return h2(...fns.map((f) => f(x)));
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
  ifElse: (predicate, ifTrue, ifFalse) => (x) => predicate(x) ? ifTrue(x) : ifFalse(x),
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
  thunk: (fn, ...args) => () => fn(...args),
  /**
   * (I-Combinator) Returns the value it was given.
   * Useful as a default or placeholder in functional compositions.
   */
  identity: (x) => x,
  /**
   * A function that does nothing and returns nothing.
   * Useful for providing a default no-op callback.
   */
  noop: () => {
  },
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
  chainable: (fn) => (...args) => (element) => {
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
  chainableWith: (fn) => (...args) => (element) => {
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
  withSelector: (fn, root = document) => {
    function wrapper(input, ...args) {
      let element = null;
      if (input === null || input === void 0) {
        element = null;
      } else if (typeof input === "string") {
        element = root.querySelector(input);
      } else if (typeof input === "function") {
        element = input();
      } else {
        element = input;
      }
      if (args.length > 0) {
        return fn(element, ...args);
      } else {
        return (...lateArgs) => fn(element, ...lateArgs);
      }
    }
    return wrapper;
  }
};
var $sel = {
  /**
   * Add classes using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  addClass: Fn.withSelector((el2, ...classes) => {
    if (!el2) return null;
    cls.add(el2, ...classes);
    return el2;
  }),
  /**
   * Remove classes using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  removeClass: Fn.withSelector((el2, ...classes) => {
    if (!el2) return null;
    cls.remove(el2, ...classes);
    return el2;
  }),
  /**
   * Toggle class using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  toggleClass: Fn.withSelector((el2, className, force) => {
    if (!el2) return null;
    return cls.toggle(el2)(className, force);
  }),
  /**
   * Apply CSS styles using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  css: Fn.withSelector((el2, styles) => {
    if (!el2) return null;
    return css(el2)(styles);
  }),
  /**
   * Modify element properties using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  modify: Fn.withSelector((el2, props) => {
    if (!el2) return null;
    return modify(el2)(props);
  }),
  /**
   * Attach event listener using selector or element.
   * Supports dual-mode: immediate and curried.
   * Returns unsubscribe function for cleanup.
   */
  on: Fn.withSelector((el2, event, handler, options) => {
    if (!el2) return () => {
    };
    return on(el2)(event, handler, options);
  }),
  /**
   * Focus element using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  focus: Fn.withSelector((el2, options) => {
    if (!el2) return null;
    return focus(el2)(options);
  }),
  /**
   * Blur element using selector or element.
   * Returns the element for chaining.
   */
  blur: Fn.withSelector((el2) => {
    if (!el2) return null;
    return blur(el2);
  }),
  /**
   * Scroll element into view using selector or element.
   * Supports dual-mode: immediate and curried.
   */
  scrollInto: Fn.withSelector((el2, options) => {
    if (!el2) return null;
    return scrollInto(el2)(options);
  }),
  /**
   * Get element's bounding rect using selector or element.
   */
  rect: Fn.withSelector((el2) => {
    if (!el2) return null;
    return rect(el2);
  }),
  /**
   * Remove element from DOM using selector or element.
   */
  remove: Fn.withSelector((el2) => {
    if (!el2) return null;
    return remove(el2);
  }),
  /**
   * Empty element (remove all children) using selector or element.
   */
  empty: Fn.withSelector((el2) => {
    if (!el2) return null;
    return empty(el2);
  })
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
  },
  /** 
  * Binds to inline styles. 
  * @example bind.style(el, 'width') // expects string like "100px"
  */
  style: (el2, property) => {
    let current;
    return (value) => {
      if (!el2 || current === value) return;
      current = String(value);
      el2.style[property] = current;
    };
  },
  /**
   * Binds to CSS Variables.
   * @example bind.cssVar(el, '--progress')
   */
  cssVar: (el2, varName) => {
    let current;
    return (value) => {
      if (!el2 || current === value) return;
      current = String(value);
      el2.style.setProperty(varName, current);
    };
  },
  /**
   * Binds to an element property.
   * @example bind.prop('disabled')(button)
   */
  prop: (propName, el2) => {
    const createSetter = (target) => {
      let current;
      return (value) => {
        if (!target || current === value) return;
        current = value;
        target[propName] = value;
      };
    };
    return el2 !== void 0 ? createSetter(el2) : createSetter;
  },
  /**
   * Binds to multiple CSS classes with boolean toggles.
   * @example bind.classes(el)({ active: true, disabled: false })
   */
  classes: (el2) => {
    return (classMap) => {
      if (!el2) return;
      Object.entries(classMap).forEach(([className, isActive]) => {
        el2.classList.toggle(className, isActive);
      });
    };
  },
  /**
   * Binds to form input value.
   * @example const setValue = bind.value(input); setValue('hello');
   */
  value: (el2) => {
    let current;
    return (value) => {
      if (!el2) return;
      const stringValue = String(value);
      if (current !== stringValue) {
        current = stringValue;
        el2.value = stringValue;
      }
    };
  },
  /**
   * Binds to element visibility (display none/block).
   * Preserves original display value when showing.
   * @example const toggleVis = bind.show(el); toggleVis(false);
   */
  show: (el2) => {
    if (!el2) return () => {
    };
    let originalDisplay = null;
    return (visible) => {
      if (visible) {
        if (el2.style.display === "none") {
          el2.style.display = originalDisplay || "";
        }
      } else {
        if (el2.style.display !== "none") {
          originalDisplay = el2.style.display || null;
          el2.style.display = "none";
        }
      }
    };
  }
};
function createBinder(refsObj, schema) {
  const completeSchema = {};
  for (const key in refsObj) {
    if (schema && key in schema) {
      completeSchema[key] = schema[key](refsObj[key]);
    } else {
      completeSchema[key] = bind.text(refsObj[key]);
    }
  }
  let isBatching = false;
  const pendingUpdates = /* @__PURE__ */ new Map();
  const flush = () => {
    if (!isBatching) {
      pendingUpdates.forEach((value, key) => {
        completeSchema[key](value);
      });
      pendingUpdates.clear();
    }
  };
  const updateRef = (key, value) => {
    if (isBatching) {
      pendingUpdates.set(key, value);
    } else {
      completeSchema[key](value);
    }
  };
  const binderFn = (data) => {
    Object.entries(data).forEach(([key, value]) => {
      if (key in completeSchema) {
        updateRef(key, value);
      }
    });
    if (!isBatching) {
      flush();
    }
  };
  binderFn.batch = (fn) => {
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
  binderFn.set = completeSchema;
  binderFn.refs = () => refsObj;
  return binderFn;
}
var createStore = (initialState) => {
  let state = { ...initialState };
  const listeners = /* @__PURE__ */ new Set();
  return {
    /** Get current state snapshot */
    get: () => state,
    /** Update state (partial updates merged) */
    set: (update) => {
      const newVals = typeof update === "function" ? update(state) : update;
      state = { ...state, ...newVals };
      listeners.forEach((fn) => fn(state));
    },
    /** Subscribe to changes */
    subscribe: (fn) => {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    }
  };
};
function bindEvents(refs2, map) {
  const exec2 = (m) => {
    const unsubs = [];
    Object.entries(m).forEach(([refKey, events]) => {
      const el2 = refs2[refKey];
      if (!el2) return;
      Object.entries(events).forEach(([evtName, handler]) => {
        unsubs.push(
          on(el2)(evtName, (e) => handler(e, el2))
        );
      });
    });
    return () => unsubs.forEach((fn) => fn());
  };
  if (map !== void 0) {
    return exec2(map);
  }
  return (lateMap) => exec2(lateMap);
}
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
function binder(refs2, schema) {
  const exec2 = (s) => {
    const binders = {};
    for (const key in s) {
      if (refs2[key]) {
        binders[key] = s[key](refs2[key]);
      }
    }
    return binders;
  };
  if (schema !== void 0) {
    return exec2(schema);
  }
  return (lateSchema) => exec2(lateSchema);
}
function apply(setters, data) {
  const exec2 = (d) => {
    for (const key in d) {
      const val = d[key];
      if (val !== void 0) {
        const setter = setters[key];
        if (setter) setter(val);
      }
    }
  };
  if (data !== void 0) {
    return exec2(data);
  }
  return (lateData) => exec2(lateData);
}
function chain(element, ...transforms) {
  if (!element) return null;
  transforms.forEach((transform) => transform(element));
  return element;
}
function exec(element, ...operations) {
  if (!element) return null;
  operations.forEach((operation) => operation(element));
  return element;
}
var _mergeHeaders = (base, override) => {
  return { ...base, ...override };
};
var _buildUrl = (path, baseURL, params) => {
  let url = baseURL ? `${baseURL}${path}` : path;
  if (params) {
    const search = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== null && val !== void 0) {
        search.set(key, String(val));
      }
    }
    const qs = search.toString();
    if (qs) url += `${url.includes("?") ? "&" : "?"}${qs}`;
  }
  return url;
};
var _encodeBody = (body) => {
  if (body === null || body === void 0) return null;
  if (typeof body === "string") return body;
  if (body instanceof Blob) return body;
  if (body instanceof FormData) return body;
  if (body instanceof ArrayBuffer) return body;
  return JSON.stringify(body);
};
var _parseResponse = async (response, transform) => {
  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
  } else if (contentType.includes("text")) {
    data = await response.text();
  } else if (contentType.includes("image") || contentType.includes("video") || contentType.includes("audio")) {
    data = await response.blob();
  } else {
    data = await response.arrayBuffer();
  }
  return transform ? transform(data) : data;
};
var _fetchWithRetry = async (url, init, retries = 0, retryDelay = 1e3, timeout = 0) => {
  const controller = new AbortController();
  const timeoutId = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : void 0;
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timeoutId !== void 0) clearTimeout(timeoutId);
    if (retries > 0 && (error instanceof TypeError || error instanceof DOMException)) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return _fetchWithRetry(url, init, retries - 1, retryDelay, timeout);
    }
    throw error;
  } finally {
    if (timeoutId !== void 0) clearTimeout(timeoutId);
  }
};
var Http = {
  /**
     * Creates a configured HTTP client with defaults.
     * 
     * Use this for applications that need centralized configuration, interceptors,
     * or per-client defaults (baseURL, timeout, retries, custom headers).
     * Supports grouped interceptors (`interceptors.request/response/error`) and
     * per-request abort controls via `abortable: true`.
  
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
  create: (config = {}) => {
    const {
      baseURL: defaultBaseURL,
      headers: defaultHeaders,
      timeout: defaultTimeout = 0,
      retries: defaultRetries = 0,
      retryDelay: defaultRetryDelay = 1e3,
      interceptRequest,
      interceptResponse,
      interceptors
    } = config;
    const applyRequestInterceptors = async (init) => {
      let nextInit = init;
      if (interceptRequest) {
        nextInit = await interceptRequest(nextInit);
      }
      if (interceptors == null ? void 0 : interceptors.request) {
        nextInit = await interceptors.request(nextInit);
      }
      return nextInit;
    };
    const applyResponseInterceptors = async (res) => {
      let nextRes = interceptResponse ? await interceptResponse(res) : res;
      if (interceptors == null ? void 0 : interceptors.response) {
        nextRes = await interceptors.response(nextRes);
      }
      if (!nextRes.ok && (interceptors == null ? void 0 : interceptors.error)) {
        nextRes = await interceptors.error(nextRes);
      }
      return nextRes;
    };
    const _request = async (method, path, init = {}) => {
      const requestInit = await applyRequestInterceptors(init);
      const {
        body,
        baseURL = defaultBaseURL,
        params,
        timeout = defaultTimeout,
        retries = defaultRetries,
        retryDelay = defaultRetryDelay,
        transform,
        abortable: _abortable,
        ...restInit
      } = requestInit;
      const headers = _mergeHeaders(
        defaultHeaders,
        restInit.headers
      );
      if (body && typeof body === "object" && !Array.isArray(body) && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }
      const fetchInit = {
        ...restInit,
        method,
        headers
      };
      if (body !== void 0 && body !== null) {
        fetchInit.body = _encodeBody(body);
      }
      const url = _buildUrl(path, baseURL, params);
      let response;
      try {
        response = await _fetchWithRetry(url, fetchInit, retries, retryDelay, timeout);
      } catch (error) {
        const httpRes2 = {
          ok: false,
          status: 0,
          statusText: "Network Error",
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          response: null
        };
        return applyResponseInterceptors(httpRes2);
      }
      let data = null;
      try {
        data = await _parseResponse(response, transform);
      } catch (error) {
        console.error("Failed to parse response:", error);
      }
      const httpRes = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        error: null,
        response
      };
      return applyResponseInterceptors(httpRes);
    };
    const requestWithAbort = (method, path, init = {}) => {
      var _a;
      const { abortable, ...restInit } = init;
      if (abortable) {
        const controller = new AbortController();
        const signal = (_a = restInit.signal) != null ? _a : controller.signal;
        const promise = _request(method, path, { ...restInit, signal });
        return {
          promise,
          abort: () => controller.abort()
        };
      }
      return _request(method, path, restInit);
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
       *
       * const { promise, abort } = http.get<User>('/users/123')({ abortable: true });
       * abort();
       * ```
       */
      get: (path) => (init = {}) => requestWithAbort("GET", path, init),
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
      post: (path) => (init = {}) => requestWithAbort("POST", path, init),
      /**
       * Performs a PUT request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config with body
       */
      put: (path) => (init = {}) => requestWithAbort("PUT", path, init),
      /**
       * Performs a DELETE request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config
       */
      delete: (path) => (init = {}) => requestWithAbort("DELETE", path, init),
      /**
       * Performs a PATCH request.
       * 
       * @template T - Response data type
       * @param path - Endpoint path
       * @returns A curried function that accepts request config with body
       */
      patch: (path) => (init = {}) => requestWithAbort("PATCH", path, init),
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
      isOk: (res) => res.ok,
      /**
       * Unwraps response data or throws on error.
       * 
       * @example
       * ```typescript
       * const users = http.unwrap(await http.get<User[]>('/users')({}));
       * ```
       */
      unwrap: (res) => {
        if (!res.ok) throw res.error || new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.data;
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
      unwrapOr: (res, fallback) => {
        return res.ok ? res.data : fallback;
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
  get: async (url, headers = {}) => {
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
  delete: async (url, headers = {}) => {
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`Http.delete ${res.status}: ${res.statusText}`);
    return res.json();
  }
};
function cast(selector) {
  return (el2) => {
    if (!el2) return null;
    return el2.matches(selector) ? el2 : null;
  };
}
function isElement(node) {
  return node instanceof Element;
}
function isTag(tag) {
  return (el2) => {
    return !!el2 && el2.tagName.toLowerCase() === tag.toLowerCase();
  };
}
function isInViewport(elOrSelector) {
  if (typeof elOrSelector === "string") {
    const el3 = document.querySelector(elOrSelector);
    if (!el3) return false;
    return inViewport(el3, {});
  }
  const el2 = elOrSelector != null ? elOrSelector : null;
  return (options) => {
    if (!el2) return false;
    return inViewport(el2, options != null ? options : {});
  };
}
function inViewport(el2, {
  partial = false,
  threshold,
  root = null,
  margin
}) {
  const rect2 = el2.getBoundingClientRect();
  const margins = parseMargin(margin);
  const containerRect = root ? root.getBoundingClientRect() : {
    top: 0,
    left: 0,
    right: window.innerWidth,
    bottom: window.innerHeight
  };
  const vp = {
    top: containerRect.top + margins.top,
    left: containerRect.left + margins.left,
    right: containerRect.right - margins.right,
    bottom: containerRect.bottom - margins.bottom
  };
  const elementArea = rect2.width * rect2.height;
  if (elementArea === 0) return false;
  const intersection = {
    top: Math.max(rect2.top, vp.top),
    left: Math.max(rect2.left, vp.left),
    right: Math.min(rect2.right, vp.right),
    bottom: Math.min(rect2.bottom, vp.bottom)
  };
  const intersectWidth = intersection.right - intersection.left;
  const intersectHeight = intersection.bottom - intersection.top;
  if (intersectWidth <= 0 || intersectHeight <= 0) return false;
  const visibleArea = intersectWidth * intersectHeight;
  if (typeof threshold === "number") {
    return visibleArea / elementArea >= threshold;
  }
  if (!partial) {
    return rect2.top >= vp.top && rect2.left >= vp.left && rect2.right <= vp.right && rect2.bottom <= vp.bottom;
  }
  return visibleArea > 0;
}
function parseMargin(input) {
  if (!input) return { top: 0, left: 0, right: 0, bottom: 0 };
  const parts = input.split(/\s+/).map((p) => parseInt(p, 10) || 0);
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
function animate(elOrSelector) {
  if (typeof elOrSelector === "string") {
    const el3 = document.querySelector(elOrSelector);
    return (keyframes, options) => el3 ? el3.animate(keyframes, options).finished : Promise.resolve();
  }
  const el2 = elOrSelector != null ? elOrSelector : null;
  return (keyframes, options) => el2 ? el2.animate(keyframes, options).finished : Promise.resolve();
}
function sanitizeHTMLSimple(html2) {
  const template = document.createElement("template");
  template.innerHTML = html2;
  const dangerousTags = ["script", "iframe", "object", "embed"];
  template.content.querySelectorAll(dangerousTags.join(",")).forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((el2) => {
    const attrs = el2.getAttributeNames();
    for (const attr2 of attrs) {
      if (attr2.startsWith("on")) {
        el2.removeAttribute(attr2);
      } else if (attr2 === "href" || attr2 === "src") {
        const value = el2.getAttribute(attr2) || "";
        if (value.toLowerCase().trim().startsWith("javascript:")) {
          el2.removeAttribute(attr2);
        }
      }
    }
  });
  return template.innerHTML;
}
function sanitizeHTMLTextOnly(html2) {
  const template = document.createElement("template");
  template.innerHTML = html2;
  return template.content.textContent || "";
}
var createComponentContext = (root) => {
  const hooks = createListenerGroup();
  const mountCallbacks = [];
  let hasMounted = false;
  const scopedRefs = refs(root);
  const scopedGroups = groupRefs(root);
  const resolveElement = (elOrSelector) => {
    if (typeof elOrSelector === "string") {
      return find(root)(elOrSelector);
    }
    return elOrSelector;
  };
  const ctx = {
    root,
    refs: scopedRefs,
    groups: scopedGroups,
    state: store(root),
    store: createStore,
    find: find(root),
    findAll: findAll(root),
    binder: (schema) => binder(scopedRefs, schema),
    bindEvents: (map) => {
      hooks.add(bindEvents(scopedRefs, map));
    },
    watch: (key, handler) => {
      hooks.add(Data.bind(root)(key, handler));
    },
    effect: (fn) => hooks.add(fn),
    on: (event, element, handler, options) => {
      const target = resolveElement(element);
      const unsubscribe = on(target)(event, handler, options);
      hooks.add(unsubscribe);
      return unsubscribe;
    },
    bind: {
      input: (inputOrSelector, stateKey) => {
        var _a;
        const input = typeof inputOrSelector === "string" ? find(root)(inputOrSelector) : inputOrSelector;
        if (!input) return;
        const inputType = ((_a = input.type) == null ? void 0 : _a.toLowerCase()) || "text";
        const isCheckbox = inputType === "checkbox";
        const isRadio = inputType === "radio";
        const updateInput = (val) => {
          if (isCheckbox) {
            input.checked = !!val;
          } else if (isRadio) {
            input.checked = input.value === String(val);
          } else {
            input.value = val != null ? val : "";
          }
        };
        const updateState = () => {
          if (isCheckbox) {
            ctx.state[stateKey] = input.checked;
          } else if (isRadio) {
            if (input.checked) {
              ctx.state[stateKey] = input.value;
            }
          } else {
            ctx.state[stateKey] = input.value;
          }
        };
        updateInput(ctx.state[stateKey]);
        ctx.watch(stateKey, updateInput);
        const eventName = isCheckbox || isRadio ? "change" : "input";
        hooks.add(on(input)(eventName, updateState));
      },
      text: (elOrSelector) => bind.text(resolveElement(elOrSelector)),
      html: (elOrSelector) => bind.html(resolveElement(elOrSelector)),
      attr: (name, elOrSelector) => {
        if (elOrSelector === void 0) {
          return (el2) => bind.attr(name, resolveElement(el2 || null));
        }
        return bind.attr(name, resolveElement(elOrSelector));
      },
      toggle: (className, elOrSelector) => {
        if (elOrSelector === void 0) {
          return (el2) => bind.toggle(className, resolveElement(el2 || null));
        }
        return bind.toggle(className, resolveElement(elOrSelector));
      },
      val: bind.val,
      style: (elOrSelector, property) => bind.style(resolveElement(elOrSelector), property),
      cssVar: (elOrSelector, varName) => bind.cssVar(resolveElement(elOrSelector), varName),
      list: (containerOrSelector, renderItem) => bind.list(resolveElement(containerOrSelector), renderItem)
    },
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
    computed: (deps, compute) => {
      let currentValue = compute();
      const listeners = /* @__PURE__ */ new Set();
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
        get value() {
          return currentValue;
        },
        onChange: (callback) => {
          listeners.add(callback);
          callback(currentValue);
        }
      };
    },
    onMount: (fn) => {
      if (hasMounted) {
        fn();
        return;
      }
      mountCallbacks.push(fn);
    },
    onUnmount: (fn) => hooks.add(fn),
    chain: (elementOrSelector, ...transforms) => {
      const element = typeof elementOrSelector === "string" ? find(root)(elementOrSelector) : elementOrSelector;
      return chain(element, ...transforms);
    },
    exec: (elementOrSelector, ...operations) => {
      const element = typeof elementOrSelector === "string" ? find(root)(elementOrSelector) : elementOrSelector;
      return exec(element, ...operations);
    }
  };
  const runMountCallbacks = () => {
    if (hasMounted) return;
    hasMounted = true;
    mountCallbacks.forEach((fn) => fn());
  };
  return {
    ctx,
    auto: hooks.auto,
    destroy: () => hooks.clear(),
    runMountCallbacks
  };
};
var domCtx = (target) => {
  const root = typeof target === "string" ? find(document)(target) : target;
  if (!root) return null;
  const { ctx, destroy, runMountCallbacks } = createComponentContext(root);
  runMountCallbacks();
  return Object.assign(ctx, { destroy });
};
var defineComponent = (target, setup) => {
  const root = typeof target === "string" ? find(document)(target) : target;
  if (!root) return null;
  const { ctx, destroy, runMountCallbacks, auto } = createComponentContext(root);
  const api = setup(ctx, auto) || {};
  runMountCallbacks();
  return {
    ...api,
    root,
    destroy
  };
};
var mountComponent = (templateFn, componentFn, target, _props) => {
  const { root } = templateFn();
  const rootEl = root instanceof DocumentFragment ? root.firstElementChild : root;
  target.appendChild(root);
  const instance = componentFn(rootEl);
  if (!instance) {
    rootEl.remove();
    throw new Error("Failed to init component");
  }
  return {
    ...instance,
    destroy: () => {
      instance.destroy();
      rootEl.remove();
    }
  };
};
function createUpdateAfter(el2, updater, initialValue) {
  const createWrapper = (update, initial) => {
    let isBatching = false;
    let batchedValue;
    let hasBatchedValue = false;
    let queuedValue;
    let hasQueuedUpdate = false;
    let queuedMicrotask = null;
    const runUpdate = (value) => {
      if (!el2) return;
      if (isBatching) {
        batchedValue = value;
        hasBatchedValue = true;
        return;
      }
      update(el2, value);
    };
    const flushQueue = () => {
      if (!hasQueuedUpdate) return;
      const value = queuedValue;
      queuedValue = void 0;
      hasQueuedUpdate = false;
      queuedMicrotask = null;
      runUpdate(value);
    };
    const queueUpdate = (value) => {
      queuedValue = value;
      hasQueuedUpdate = true;
      if (!queuedMicrotask) {
        queuedMicrotask = Promise.resolve().then(flushQueue);
      }
    };
    const createControl = () => {
      let shouldSkip = false;
      const control = (value) => {
        runUpdate(value);
      };
      control.skip = () => {
        shouldSkip = true;
      };
      control.queue = (value) => {
        queueUpdate(value);
      };
      control.flush = () => {
        flushQueue();
      };
      Object.defineProperty(control, "_skip", {
        get: () => shouldSkip
      });
      return control;
    };
    const wrapControlled = (fn) => {
      return (...args) => {
        const control = createControl();
        const result = fn(control, ...args);
        if (result instanceof Promise) {
          return result.then((resolved) => {
            if (!control._skip) {
              runUpdate(resolved);
            }
            return resolved;
          });
        }
        if (!control._skip) {
          runUpdate(result);
        }
        return result;
      };
    };
    const wrapSimple = (fn) => {
      return (...args) => {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.then((resolved) => {
            runUpdate(resolved);
            return resolved;
          });
        }
        runUpdate(result);
        return result;
      };
    };
    if (el2) {
      update(el2, initial);
    }
    const wrapper = (fn) => {
      return wrapControlled(fn);
    };
    wrapper.simple = wrapSimple;
    wrapper.all = (actions) => {
      return Object.fromEntries(
        Object.entries(actions).map(([key, fn]) => [key, wrapControlled(fn)])
      );
    };
    wrapper.allSimple = (actions) => {
      return Object.fromEntries(
        Object.entries(actions).map(([key, fn]) => [key, wrapSimple(fn)])
      );
    };
    wrapper.batch = (fn) => {
      const wasBatching = isBatching;
      isBatching = true;
      hasBatchedValue = false;
      const result = fn();
      if (result instanceof Promise) {
        return result.then((resolved) => {
          isBatching = wasBatching;
          if (hasBatchedValue && !wasBatching) {
            runUpdate(batchedValue);
          }
          return resolved;
        });
      }
      isBatching = wasBatching;
      if (hasBatchedValue && !wasBatching) {
        runUpdate(batchedValue);
      }
      return result;
    };
    wrapper.update = (value) => {
      runUpdate(value);
    };
    wrapper.refresh = () => {
      runUpdate(void 0);
    };
    Object.defineProperty(wrapper, "isBatching", {
      get: () => isBatching
    });
    Object.defineProperty(wrapper, "el", {
      value: el2,
      writable: false
    });
    return wrapper;
  };
  if (updater === void 0) {
    return (upd, init) => {
      return createWrapper(upd, init);
    };
  }
  return createWrapper(updater, initialValue);
}
export {
  $,
  $$,
  $sel,
  A11y,
  Async,
  Cookie,
  CssVar,
  Data,
  Evt,
  Fn,
  Focus,
  Form,
  History,
  Http,
  Input,
  Key,
  List,
  Local,
  Obj,
  Option,
  Params,
  Result,
  SW,
  Session,
  Signal,
  Text,
  Traverse,
  ViewTransitions,
  after,
  animate,
  append,
  apply,
  attr,
  autoResize,
  batch,
  before,
  bind,
  bindEvents,
  binder,
  blur,
  cast,
  chain,
  clone,
  cloneMany,
  closest,
  cls,
  component,
  computed,
  createBinder,
  createBus,
  createListenerGroup,
  createMediaQuery,
  createQueue,
  createSortable,
  createStore,
  createUpdateAfter,
  createUpload,
  createWebComponent,
  css,
  cssTemplate,
  cycleClass,
  debounce,
  def,
  defineComponent,
  dispatch,
  domCtx,
  draggable,
  el,
  empty,
  exec,
  exists,
  find,
  findAll,
  focus,
  form,
  groupBy,
  groupRefs,
  h,
  has,
  html,
  htmlMany,
  index,
  injectStyles,
  instantiate,
  isElement,
  isInViewport,
  isTag,
  isVisible,
  modify,
  mount,
  mountComponent,
  nextFrame,
  offset,
  on,
  onClickOutside,
  onDelegated,
  onMount,
  onReady,
  prepend,
  prop,
  ready,
  rect,
  refs,
  remove,
  require2 as require,
  sanitizeHTMLSimple,
  sanitizeHTMLTextOnly,
  scrollInto,
  set,
  siblings,
  store,
  stripListeners,
  tags,
  tempStyle,
  throttle,
  toColorSpace,
  view,
  viewRefs,
  wait,
  waitFor,
  waitTransition,
  watch,
  watchAttr,
  watchClass,
  watchText,
  wrap
};
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
//# sourceMappingURL=index.js.map
