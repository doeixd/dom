[![npm version](https://img.shields.io/npm/v/@doeixd/dom)](https://www.npmjs.com/package/@doeixd/dom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/doeixd/dom)

# DOM

A comprehensive, type-safe, functional DOM library with 37+ utilities for modern web development.


## Features

- **Target-First Design**: Intuitive `Action(Element)(Config)` curried pattern
- **100% TypeScript**: Full type inference from DOM selectors and events
- **Null-Safe**: All functions gracefully handle `null`/`undefined` targets
- **Zero Dependencies**: Pure DOM APIs, works with vanilla JS or any framework
- **Composable**: Functional API designed for piping and composition
- **Tree-Shakeable**: Import only what you need
- **37+ Utilities**: Complete toolkit for DOM manipulation, events, forms, network, storage, and more

## Installation

```bash
npm install @doeixd/dom
```

## Quick Start

```typescript
import { find, on, modify, append } from '@doeixd/dom';

// Query with type inference
const button = find(document)('button');  // HTMLButtonElement | null

// Attach event listener with cleanup
const cleanup = on(button)('click', (e, target) => {
  console.log('Clicked!', target);
  cleanup(); // Remove listener when done
});

// Declaratively modify elements
modify(button)({
  class: { active: true },
  text: 'Updated',
  attr: { 'aria-pressed': 'true' }
});

// Append children
append(document.body)([
  document.createElement('div'),
  'Text content'
]);
```

## Core Design Philosophy

### 1. Target-First Currying

Every function uses the pattern: `Action(Target)(Config)`

This makes chaining and composition natural:

```typescript
// All follow the same pattern
find(container)('button')         // Element | null
on(button)('click', handler)      // Cleanup function
modify(element)({ text: 'Hi' })   // Element
css(element)({ color: 'red' })    // Element
cls.add(element)('active')        // Element
```

### 2. Automatic Type Inference

Tag name selectors automatically infer the correct element type:

```typescript
const button = find(document)('button');      // HTMLButtonElement | null
const input = find(document)('input');        // HTMLInputElement | null
const link = find(document)('a');             // HTMLAnchorElement | null
const div = find(document)('div');            // HTMLDivElement | null

// Full type safety - accessing button.disabled works because type is inferred
if (button) button.disabled = true;
```

### 3. Null-Safe Throughout

Functions gracefully handle `null`/`undefined`:

```typescript
const missing = document.querySelector('.does-not-exist');  // null

// All these are safe - they return gracefully
find(missing)('div')           // null
on(missing)('click', handler)  // no-op cleanup () => {}
modify(missing)({})            // null
css(missing)({})               // null
```

## Complete API Reference

### DOM Querying

```typescript
// Find first matching element
find(container)('selector')     // Element | null
find(document)('#app')          // Element | null
find(container)('button.primary')

// Find all matching elements  
findAll(container)('selector')  // Element[]
findAll(document)('.card')
findAll(list)('li')

// Find closest ancestor (including self)
closest(element)('selector')    // Element | null
closest(target)('.container')
closest(button)('form')
```

### Events

```typescript
// Attach event listener
on(element)('click', (e, target) => { })      // Unsubscribe
on(input)('input', (e, target) => { })
on(window)('scroll', handler, { passive: true })

// Delegated event listening (more efficient)
onDelegated(container)('click', 'li', handler)  // Unsubscribe
onDelegated(list)('click', '.delete-btn', deleteHandler)
onDelegated(document)('submit', 'form', submitHandler)

// Dispatch custom events
dispatch(element)('custom-event', { data: 123 })
dispatch(modal)('modal:close', { reason: 'user' }, { bubbles: true })

// Event utilities
Evt.stop(handler)        // Stop propagation
Evt.prevent(handler)     // Prevent default
Evt.kill(handler)        // Both
Evt.key('Enter', handler)  // Key filtering
Evt.isSelf(e)            // Check if event target is self
Evt.pointer(e)           // Get mouse/touch coordinates
```

### DOM Manipulation

```typescript
// Modify element properties declaratively
modify(element)({
  text: 'Content',
  html: '<span>HTML</span>',
  class: { active: true, disabled: false },
  style: { color: 'red', fontSize: '16px' },
  attr: { 'aria-label': 'Submit', type: 'button' },
  dataset: { userId: 123, role: 'admin' },
  value: 'input value',
  disabled: false
})

// Apply CSS styles
css(element)({ color: 'blue', fontSize: '14px' })
css(element)({ '--primary': '#007bff' } as any)  // CSS variables

// Temporary styles (with automatic revert)
const revert = tempStyle(element)({ opacity: '0.5', pointerEvents: 'none' })
// Later...
revert()  // Restores original styles
```

### Structure & Insertion

```typescript
// Insert content
append(parent)(...content)    // Append to end
prepend(parent)(...content)   // Prepend to start
after(element)(...content)    // Insert after (sibling)
before(element)(...content)   // Insert before (sibling)

// Remove content
remove(element)               // Remove from DOM
empty(container)              // Remove all children

// Wrap element
const wrapper = document.createElement('div')
wrap(element)(wrapper)        // Wraps element in wrapper

// Content can be mixed types:
append(container)(
  document.createElement('div'),
  'Text content',
  null,  // Safely ignored
  fragment
)
```

### Element Creation

```typescript
// Create typed elements with full properties
el('button')({
  text: 'Click me',
  class: { primary: true },
  attr: { type: 'submit' }
})([])  // children

const card = el('div')({
  class: { card: true, elevated: true },
  dataset: { id: 123 }
})([
  el('h2')({})(['Title']),
  el('p')({})(['Description'])
])

// Template literals for HTML
const greeting = html`<h1>Hello ${name}!</h1>`

// Multiple elements from template
const items = htmlMany`
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
`

// Clone elements (preserves type)
const original = document.querySelector('button')
const copy = clone(original)(true)  // Deep clone with children
```

### Classes

```typescript
// Add/remove/toggle classes
cls.add(element)('active', 'primary', 'loading')
cls.remove(element)('disabled')
cls.toggle(element)('active')  // Toggle
cls.toggle(element)('active', true)  // Force add
cls.toggle(element)('active', false)  // Force remove
cls.replace(element)('btn-primary', 'btn-secondary')
cls.has(element)('active')  // Returns boolean

// Watch for class changes
const cleanup = watchClass(element)('active', (hasClass, el) => {
  console.log('Active changed to:', hasClass)
})
```

### Attributes & Data

```typescript
// Get/set/read data attributes
Data.get(element)('userId')           // "123" (raw string)
Data.set(element)('userId', 123)      // Sets data-user-id="123"
Data.read(element)('userId')          // 123 (auto-parsed to number)
Data.read(element)('isActive')        // true (parsed to boolean)
Data.read(element)('config')          // { ... } (parsed JSON)

// Watch attribute changes
watchAttr(element)('data-count', (newValue) => {
  console.log('Count changed to:', newValue)
})

// Watch text content changes
watchText(element, (newText) => {
  console.log('Text changed to:', newText)
})

// Data binding (read/write with callback)
Data.bind(element)('theme', (theme) => {
  document.documentElement.className = theme
})
```

### Lifecycle

```typescript
// Run when DOM is ready
onReady(() => {
  console.log('DOM ready')
})

// Run when element is mounted (appears in DOM)
onMount(document.body)('button', (el) => {
  console.log('Button mounted:', el)
})

// Wait for element to appear
const button = await waitFor('button')  // Resolves when found
const visible = await waitFor('modal', { visible: true })
```

### Collections & Refs

```typescript
// Get all elements with data-ref attribute
const refs = refs(container)  // { name: HTMLElement, email: HTMLElement, ... }
refs.name.value = 'John'
refs.email.focus()

// Group refs by category
const refsByGroup = groupRefs(container)  // { inputs: [...], buttons: [...] }

// Batch operations on multiple elements
batch(elements)([
  modify({ class: { selected: false } }),
  css({ opacity: '0.5' })
])

// Group elements by property
const byCategory = groupBy(elements, el => el.dataset.category)
```

### Forms

```typescript
// Serialize form data
const data = Form.serialize(form)  // URLSearchParams | FormData
const obj = Form.read(form)        // Plain object

// Populate form from data
Form.populate(form)({
  username: 'john',
  email: 'john@example.com',
  newsletter: true
})

// Fluent form wrapper
const f = form('#login-form')
const data = f.values()        // Get all values
f.set({ username: 'admin' })  // Pre-fill
f.clear()                      // Clear all inputs
f.submit((data, e) => {
  // Handle submission with preventDefault
  console.log('Form data:', data)
})

// Input utilities
Input.get(input)               // Smart get (handles checkboxes, numbers, files, etc.)
Input.set(input)(value)        // Smart set
Input.watch(input)(callback)   // Listen to input changes
Input.watchDebounced(input)(callback, 300)  // Debounced listening
Input.change(input)(callback)  // Listen to change event
Input.select(input)            // Select all text
Input.validate(input)(msg)     // Check validity
```

### Navigation & Traversal

```typescript
// Traverse the DOM
Traverse.parent(element)           // Parent element | null
Traverse.children(element)         // HTMLElement[]
Traverse.siblings(element)         // HTMLElement[]
Traverse.next(element)             // Next sibling | null
Traverse.prev(element)             // Previous sibling | null
Traverse.firstChild(element)       // First child | null
Traverse.lastChild(element)        // Last child | null
Traverse.ancestor(element)         // Walk up to document root
```

### Geometry & Visibility

```typescript
// Get element dimensions
const r = rect(element)            // DOMRect
console.log(r.width, r.height, r.top, r.left)

// Get offset from parent
const offset = offset(element)    // { top, left, width, height }

// Check visibility
isVisible(element)                 // boolean

// Scroll element into view
scrollInto(element)                // Smooth scroll
scrollInto(element)({ behavior: 'auto' })

// Focus/blur
focus(element)                     // Focus element
blur(element)                      // Blur element
```

### CSS & Styling

```typescript
// CSS variables
CssVar.set('--primary', 'blue')(element)      // Set on element
CssVar.get('--primary')(element)              // Get value
CssVar.setRoot('--theme', 'dark')             // Set on :root

// Computed styles
const color = computed(element)('color')      // Get computed value

// Inject styles dynamically
const cleanup = injectStyles(`
  .highlight { background: yellow; }
  .error { color: red; }
`)
// Later...
cleanup()  // Remove injected styles

// Wait for transitions to complete
await waitTransition(element)
```

### Timing & Animation

```typescript
// Wait for time to pass
await wait(1000)                   // Wait 1 second

// Wait for animation frame
await nextFrame()

// Debounce function (delays until quiet)
const search = debounce((query) => api.search(query), 300)
search('hello')
search.cancel()  // Cancel pending

// Throttle function (rate limit)
const scroll = throttle(() => loadMore(), 500)
window.addEventListener('scroll', scroll)
scroll.cancel()  // Stop throttling
```

### URL & History

```typescript
// Read/write URL query parameters
History.query({ page: 2, sort: 'desc' })('push')   // Update URL
const params = History.readQuery()                  // Get current params
const paramArrays = History.readQueryAll()          // Arrays for repeated params

// History navigation
History.push('/path', state)               // Push new entry
History.replace('/path', state)            // Replace current entry
History.state()                            // Get current state
History.back()                             // Go back
History.forward()                          // Go forward
History.reload()                           // Reload page
History.onPop((e) => {})                   // Listen to back/forward

// Encode/decode state for URL hash
const encoded = History.encodeState({ filters: [...] })
window.location.hash = encoded
const decoded = History.decodeState(encoded)

// Sync form input to URL query parameter
const cleanup = History.syncToUrl('q', 300)(searchInput)
// Input value now syncs with ?q= in URL
```

### Storage

```typescript
// Local Storage (typed)
Local.set('user', { id: 1, name: 'John' })
Local.get('user')                          // Returns object or null
Local.has('user')                          // boolean
Local.remove('user')
Local.clear()

// Session Storage (same API)
Session.set('token', 'abc123')
Session.get('token')

// Cookies
Cookie.set('token', 'abc123', { maxAge: 7 * 24 * 60 * 60 })  // 7 days
Cookie.get('token')
Cookie.remove('token')
```

### Network

```typescript
// HTTP requests
const response = await Http.get('/api/users')
const data = await Http.post('/api/users', { name: 'John' })
await Http.put('/api/users/1', { name: 'Jane' })
await Http.delete('/api/users/1')

// JSON parsing built-in
const json = await Http.get('/api/data').then(r => r.json())

// Service Workers
SW.register('/sw.js')
SW.unregister()
```

### Pub/Sub (Event Bus)

```typescript
// Typed event bus
const bus = createBus<{
  'user:login': { userId: number }
  'user:logout': { timestamp: number }
  'notification:show': { message: string }
}>()

// Emit events
bus.emit('user:login', { userId: 123 })
bus.emit('notification:show', { message: 'Welcome!' })

// Listen for events (typed!)
const cleanup = bus.on('user:login', (data) => {
  console.log('User logged in:', data.userId)
})
```

### Signals & Aborts

```typescript
// Abort signal helpers
const signal = Signal.create()
Signal.add(signal, () => {
  console.log('Abort requested')
})

// Abort all listeners
signal.abort()
```

### Error Handling

```typescript
// Result type (like Rust) for safe error handling
const result = Result.try(() => JSON.parse(jsonString))
if (result.ok) {
  console.log('Parsed:', result.val)
} else {
  console.error('Error:', result.err)
}

// Async result
const res = await Result.async(() => fetch('/api'))
if (res.ok) {
  console.log('Response:', res.val)
} else {
  console.error('Failed:', res.err.message)
}

Result.unwrap(result)              // Returns value or throws
Result.unwrapOr(result, default)   // Returns value or default
Result.map(result, x => x * 2)     // Transform value if Ok

// Option type for nullable values
const opt = Option.from(maybeValue)
if (opt.isSome) {
  console.log('Has value:', opt.val)
} else {
  console.log('No value')
}

Option.unwrapOr(opt.val, fallback)
Option.map(maybeValue, x => x.length)
Option.then(maybeValue, x => console.log(x))  // Side effect if Some
```

### Functional Utilities

```typescript
// Function composition
Fn.pipe(fn1, fn2, fn3)(value)      // Left-to-right composition

// Currying
const add = Fn.curry((a, b) => a + b)
add(1)(2)  // 3

// Function transformation
Fn.swap(fn)                        // Swap argument order
Fn.flip(fn)                        // Flip binary arguments
Fn.tap(console.log)                // Side effects in pipes
Fn.maybe(JSON.parse)               // Safe null handling

// Utilities
Fn.identity(x)                     // Returns x unchanged
Fn.noop()                          // Does nothing
Fn.thunk(fn, args)                 // Defer function call
```

### Fluent Wrappers

```typescript
// Single element wrapper
const $el = $(element)
$el.on('click', handler)
$el.modify({ text: 'Hello' })
$el.css({ color: 'red' })
$el.addClass('active')
$el.data('userId', 123)
// ... all methods return the element for chaining

// Multiple elements wrapper
const $els = $$('.card')
$els.addClass('selected')
$els.css({ opacity: '1' })
$els.on('click', handler)  // Attach to all
$els.remove()              // Remove all
$els.map(el => el.textContent)  // Get values
$els.filter((el, i) => i % 2 === 0)  // Filter
$els.raw                   // Access raw elements array

// Component wrapper (with refs)
const cmp = component<MyRefs>(rootElement)
cmp.root        // The root element
cmp.title       // ref with data-ref="title"
cmp.content     // ref with data-ref="content"

// Store wrapper (reactive data attributes)
interface State {
  userId: number
  isAdmin: boolean
  theme: 'light' | 'dark'
}

const state = store<State>(element)
state.userId = 123           // Updates DOM
state.theme = 'dark'
console.log(state.userId)    // Reads from DOM
```

### Reactive Bindings ("The Hard Way")

Simple, framework-free reactivity with automatic diffing. Create typed setters that efficiently update the DOM only when values change.

```typescript
// Generic value binder with custom effect
const setScore = bind.val(0, (score) => {
  div.textContent = `Score: ${score}`
})
setScore(10)    // Updates only if different
setScore(10)    // No-op (same value)

// Bind text content
const title = find(document)('h1')
const setText = bind.text(title)
setText('Hello World')
setText('Hello World')  // No update (same value)

// Bind HTML content
const content = find(document)('.content')
const setHtml = bind.html(content)
setHtml('<p>HTML content</p>')

// Bind attributes (with optional currying)
const image = find(document)('img')
const setSrc = bind.attr('src')(image)
setSrc('/image.jpg')
setSrc('/image.jpg')  // No update

// Bind class toggles
const button = find(document)('button')
const toggleActive = bind.toggle('active')(button)
toggleActive(true)   // Adds class
toggleActive(true)   // No update
toggleActive(false)  // Removes class

// Bind lists with rendering
const ul = find(document)('ul')
const updateList = bind.list(ul, (user, index) => {
  return el('li')({ text: user.name, dataset: { id: user.id } })([])
})

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]

updateList(users)  // Renders list
updateList(users)  // No update (same reference)
updateList([...users])  // Re-renders (new reference)
```

### View Factory & Component Generation

Create reusable, typed view components with automatic ref collection and setter generation.

```typescript
// Define a view template
const createCard = view<'title' | 'description' | 'button'>(`
  <div class="card">
    <h2 data-ref="title"></h2>
    <p data-ref="description"></p>
    <button data-ref="button">Action</button>
  </div>
`)

// Instantiate the view
const { root, refs } = createCard()

// refs is typed: { title, description, button }
refs.title.textContent = 'Hello'
refs.button.addEventListener('click', handler)

// Append to DOM
append(document.body)([root])
```

### Binder Generator

Generate typed setters from refs with a schema:

```typescript
// Define refs
const { root, refs } = createCard()

// Create typed setters
const ui = binder(refs, {
  title: bind.text,
  description: bind.text,
  active: bind.toggle('active'),
  href: bind.attr('href')
})

// Use the setters (all typed!)
ui.title('Card Title')
ui.description('Card description')
ui.active(true)
ui.href('/page')

// No need to manage individual bind.text/toggle calls
```

### Complete Example: Todo App

```typescript
// 1. Define view factory
const createTodoItem = view<'text' | 'checkbox' | 'deleteBtn'>(`
  <li class="todo-item">
    <input type="checkbox" data-ref="checkbox" />
    <span data-ref="text"></span>
    <button data-ref="deleteBtn">Delete</button>
  </li>
`)

// 2. Create UI controllers
function TodoItem(initialData: { id: number; text: string; done: boolean }) {
  const { root, refs } = createTodoItem()

  // Generate setters
  const ui = binder(refs, {
    text: bind.text,
    done: bind.toggle('done')
  })

  // Initialize UI
  ui.text(initialData.text)
  ui.done(initialData.done)

  // Handle interactions
  on(refs.checkbox)('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    ui.done(checked)
  })

  // Return API
  return {
    root,
    update: (data: typeof initialData) => {
      ui.text(data.text)
      ui.done(data.done)
    },
    onDelete: (handler: () => void) => on(refs.deleteBtn)('click', handler)
  }
}

// 3. Use in application
const todoList = find(document)('#todo-list')

let todos = [
  { id: 1, text: 'Learn fdom', done: false },
  { id: 2, text: 'Build app', done: false }
]

const items = todos.map(todo => {
  const item = TodoItem(todo)
  item.onDelete(() => {
    todos = todos.filter(t => t.id !== todo.id)
    remove(item.root)
  })
  return item
})

items.forEach(item => append(todoList)([item.root]))

// 4. Update later
function updateTodo(id: number, text: string, done: boolean) {
  items[0].update({ id, text, done })
}
```

### Why Use Bind?

- **Diffing**: Only updates DOM when values actually change
- **Type Safety**: Full TypeScript support with inferred types
- **Framework-Free**: No virtual DOM, no build step, pure JavaScript
- **Minimal Boilerplate**: Simple setter functions instead of complex state management
- **Performance**: Direct DOM manipulation with smart caching

Compare with imperative code:

```typescript
// Without bind (imperative)
let currentText = ''
function setText(newText: string) {
  if (currentText !== newText) {
    currentText = newText
    title.textContent = newText
  }
}

// With bind (declarative)
const setText = bind.text(title)
setText(newText)  // Diffing built-in
```

### Other Utilities

```typescript
// Color space conversion
const srgb = toColorSpace('#ff0000', 'srgb')

// Cycle through class states (state machine)
const cycle = cycleClass(['inactive', 'loading', 'active'])(button)
// Each call advances to next class

// Clone with listener cleanup
const clean = stripListeners(element)

// Template instantiation
const instance = instantiate('#template')

// Clone many times
const clones = cloneMany(template)(5)

// Listener groups (batch cleanup)
const group = createListenerGroup()
group.add(on(el1)('click', handler))
group.add(on(el2)('click', handler))
// Later...
group.clear()  // Remove all listeners

// Queue with concurrency control
const q = createQueue({ concurrency: 3, autoStart: true })
await q.add(async () => { /* task */ })
q.pause()
q.resume()
q.clear()
await q.drain()

// Object utilities
Obj.clone(obj)                     // Deep clone
Obj.isEqual(a, b)                  // Deep equality
Obj.pick(obj, 'key1', 'key2')     // Extract properties
Obj.omit(obj, 'key1', 'key2')     // Exclude properties

// Text utilities
Text.words(string)                 // Split to words
Text.lines(string)                 // Split to lines
Text.capitalize(string)            // Capitalize
Text.slug(string)                  // URL slug
Text.truncate(string, length)      // Truncate with ellipsis

// View Transitions API
ViewTransitions.start(async () => {
  // DOM changes here
  modify(element)({ class: { hidden: false } })
})

// Async utilities
Async.all(promises)                // Wait for all (like Promise.all)
Async.allSettled(promises)         // All results
Async.retry(fn, maxAttempts)       // Retry on failure
Async.timeout(promise, ms)         // Timeout wrapper

// Key bindings
Key.is(element)('Enter', handler)
Key.onTab(element)(handler)
Key.onArrow(element)((dir, e) => {
  if (dir === 'Down') moveNext()
})

// Focus management
Focus.on(element)(handler)         // Focus event
Focus.onBlur(element)(handler)     // Blur event
Focus.trap(container)              // Trap focus within element
Focus.restore()                    // Restore previous focus
```

## Common Patterns

### Form Submission with Validation

```typescript
const f = form('#user-form')

f.submit((data, e) => {
  // Validate
  if (!data.username) {
    Input.validate(find(f.raw)('input[name="username"]'))('Required')
    return
  }

  if (!data.email.includes('@')) {
    alert('Invalid email')
    return
  }

  // Submit
  api.createUser(data)
    .then(() => {
      modify(document.body)({
        class: { success: true }
      })
      f.clear()
    })
    .catch(err => {
      alert('Error: ' + err.message)
    })
})
```

### Dynamic List with Event Delegation

```typescript
const list = find(document)('ul')

// Add items
const addItem = (text) => {
  const li = el('li')({
    dataset: { id: Date.now() }
  })([text])
  append(list)([li])
}

// Event delegation - single listener for all items
onDelegated(list)('click', 'li', (e, item) => {
  const id = item.dataset.id
  console.log('Clicked:', id)

  // Add remove button
  const btn = el('button')({})(['Delete'])
  on(btn)('click', () => {
    remove(item)
  })
  append(item)([btn])
})

// Add some initial items
addItem('Item 1')
addItem('Item 2')
addItem('Item 3')
```

### Reactive Component

```typescript
interface CardProps {
  title: string
  description: string
  id: number
}

function createCard(props: CardProps) {
  const card = el('div')({
    class: { card: true },
    dataset: { id: props.id }
  })([
    el('h2')({ text: props.title })([]),
    el('p')({ text: props.description })([]),
    el('button')({ text: 'Delete' })([])
  ])

  const btn = find(card)('button')
  on(btn)('click', () => {
    css(card)({ opacity: '0' })
    wait(300).then(() => remove(card))
  })

  return card
}

// Usage
const card = createCard({
  title: 'My Card',
  description: 'Description here',
  id: 1
})
append(document.body)([card])
```

### Search with Debounce

```typescript
const searchInput = find(document)('#search')
const results = find(document)('#results')

Input.watchDebounced(searchInput)(async (query) => {
  if (!query) {
    empty(results)
    return
  }

  modify(results)({ text: 'Searching...' })

  try {
    const res = await Http.get(`/api/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()

    empty(results)
    append(results)(
      ...data.map(item => el('div')({ text: item.name })([]))
    )
  } catch (err) {
    modify(results)({ text: 'Error: ' + err.message })
  }
}, 300)
```

### Theming with CSS Variables

```typescript
const themeToggle = find(document)('#theme-toggle')
const root = document.documentElement

on(themeToggle)('click', () => {
  const isDark = CssVar.get('--theme')(root) === 'dark'
  const newTheme = isDark ? 'light' : 'dark'

  CssVar.setRoot('--theme', newTheme)
  CssVar.setRoot('--bg', isDark ? '#fff' : '#000')
  CssVar.setRoot('--fg', isDark ? '#000' : '#fff')

  Local.set('theme', newTheme)
})

// Load saved theme
const saved = Local.get('theme')
if (saved) {
  CssVar.setRoot('--theme', saved)
}
```

## Performance Tips

1. **Use Delegated Events**: Attach listeners to containers instead of individual elements
   ```typescript
   // Good: One listener
   onDelegated(list)('click', '.item', handler)

   // Bad: Many listeners
   items.forEach(item => on(item)('click', handler))
   ```

2. **Batch DOM Updates**: Use `batch()` for multiple modifications
   ```typescript
   batch(elements)([
     modify({ class: { active: false } }),
     css({ opacity: '0.5' })
   ])
   ```

3. **Clean Up Listeners**: Always call the cleanup function
   ```typescript
   const cleanup = on(element)('click', handler)
   // Later...
   cleanup()
   ```

4. **Debounce/Throttle**: Use for high-frequency events
   ```typescript
   const scrollHandler = throttle(() => loadMore(), 500)
   window.addEventListener('scroll', scrollHandler)
   ```

5. **Cache Queries**: Store query results instead of re-querying
   ```typescript
   const button = find(document)('button')  // Query once
   on(button)('click', handler1)
   on(button)('click', handler2)
   ```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Node.js 16+

Requires ES2020+ (optional chaining, nullish coalescing, Promise support)

## TypeScript Support

Full TypeScript support with no `@types` package needed. Type inference works automatically:

```typescript
const button = find(document)('button')  // HTMLButtonElement | null
const input = find(document)('input')    // HTMLInputElement | null

// Element-specific properties are available
if (button) {
  button.disabled = true  // ✓ Works
}

if (input) {
  input.value = 'test'   // ✓ Works
}
```

## Contributing

Contributions welcome! Please submit pull requests or issues.

## License

MIT - See [LICENSE](LICENSE) file for details

## Author

Patrick Glen ([@doeixd](https://github.com/doeixd))
