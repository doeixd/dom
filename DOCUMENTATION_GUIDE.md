// This file contains comprehensive JSDoc improvements for the remaining fdom library functions
// Due to the large scope (50+ exports), I'm creating this reference file to guide systematic improvements

/**
 * STRUCTURE FUNCTIONS (append, prepend, after, before, remove, empty, wrap)
 * - Add comprehensive JSDoc with multiple examples
 * - Document null safety
 * - Show common patterns (fragments, text nodes, multiple children)
 * - Document return values for chaining
 */

/**
 * CREATION FUNCTIONS (el, html, htmlMany, clone)
 * - Document curried API pattern
 * - Show type inference from tag names
 * - Add XSS safety warnings for html/htmlMany
 * - Document deep vs shallow cloning
 */

/**
 * CLASS FUNCTIONS (cls object, watchClass, cycleClass)
 * - Document each method in cls object
 * - Add state machine examples for cycleClass
 * - Document MutationObserver cleanup for watchClass
 */

/**
 * DATA/ATTRIBUTES (Data object, watchAttr)
 * - Document camelCase to kebab-case conversion
 * - Add JSON parsing examples
 * - Document type inference for Data.read
 */

/**
 * LIFECYCLE (onReady, onMount, waitFor)
 * - Document timing guarantees
 * - Add SPA navigation examples
 * - Document memory leak prevention
 */

/**
 * UTILITIES (Params, Form, wait, nextFrame, cssTemplate)
 * - Add URL encoding examples
 * - Document FormData compatibility
 * - Add animation timing examples
 */

/**
 * NAVIGATION (Traverse object)
 * - Document type preservation through traversal
 * - Add null safety examples
 */

/**
 * CSS & ANIMATION (CssVar, computed, injectStyles, waitTransition)
 * - Document CSS variable fallbacks
 * - Add theming examples
 * - Document CSP considerations for injectStyles
 */

/**
 * COLLECTIONS (batch, groupBy)
 * - Document performance characteristics
 * - Add type inference examples
 */

/**
 * REFS (refs, groupRefs)
 * - Add component pattern examples
 * - Document duplicate handling
 */

/**
 * TIMING (debounce, throttle)
 * - Preserve exact function signatures
 * - Document use cases and differences
 * - Add cancellation examples
 */

/**
 * STORAGE (Local, Session)
 * - Add schema validation examples
 * - Document quota limits
 * - Add error handling
 */

/**
 * NETWORK (Http object)
 * - Add error response typing
 * - Document CORS considerations
 * - Add retry pattern examples
 */

/**
 * SIGNALS (Signal object)
 * - Document AbortController patterns
 * - Add cancellation examples
 */

/**
 * PUB/SUB (createBus)
 * - Stricter event map types
 * - Add type inference examples
 */

/**
 * FLUENT WRAPPERS ($, $$, component, store, form)
 * - Document method chaining
 * - Add component patterns
 * - Document proxy limitations for store
 */
