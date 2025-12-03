# Creation

Utilities for creating DOM elements and fragments.

## Why?
`document.createElement` is verbose and requires separate calls to set attributes and append children. `el` and `html` allow for concise, declarative element creation.

## API Reference

### `el`
Creates a DOM element with properties and children.

```typescript
// Signature
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElementProps,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K];

// Curried
function el<K extends keyof HTMLElementTagNameMap>(tag: K): 
  (props?: ElementProps) => 
  (children?: (Node | string)[]) => HTMLElementTagNameMap[K];
```

### `html`
Creates a DocumentFragment from an HTML string. Useful for templating.

```typescript
function html(strings: TemplateStringsArray, ...values: any[]): DocumentFragment;
```

### `htmlMany`
Creates an array of Elements from an HTML string.

```typescript
function htmlMany(htmlString: string): HTMLElement[];
```

### `clone`
Deep clones a node.

```typescript
function clone<T extends Node>(node: T): T;
```

## Examples

### Creating Elements (`el`)
```typescript
import { el } from '@doeixd/dom';

const card = el('div', { class: { card: true } }, [
  el('h2', { text: 'Title' }),
  el('p', { text: 'Content goes here.' }),
  el('button', { 
    text: 'Click Me',
    attr: { type: 'button' } 
  })
]);

document.body.appendChild(card);
```

### Using HTML Templates (`html`)
```typescript
import { html, append } from '@doeixd/dom';

const name = 'World';
const fragment = html`
  <div class="greeting">
    <h1>Hello, ${name}!</h1>
  </div>
`;

append(document.body)(fragment);
```

### Curried Creation
Useful for creating factories.

```typescript
import { el } from '@doeixd/dom';

const createButton = el('button')({ class: { btn: true } });

const submitBtn = createButton(['Submit']);
const cancelBtn = createButton(['Cancel']);
```
