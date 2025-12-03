# @doeixd/dom Documentation

A production-grade, target-first, type-safe DOM library.

## Introduction

`@doeixd/dom` is designed to provide a robust, type-safe, and functional API for DOM manipulation. It prioritizes:
- **Type Safety**: Extensive use of TypeScript generics to infer element types from selectors.
- **Functional Composition**: Functions are designed to be curried and composed.
- **Performance**: Lightweight wrappers and direct DOM manipulation.

## Installation

```bash
npm install @doeixd/dom
```

## Quick Start

```typescript
import { find, on, modify } from '@doeixd/dom';

// Type-safe selection
const btn = find('button#submit'); // HTMLButtonElement | null

if (btn) {
  // Event handling
  on(btn)('click', (e) => {
    console.log('Clicked!');
  });

  // Modification
  modify(btn)({
    text: 'Processing...',
    class: { loading: true },
    attr: { disabled: true }
  });
}
```

## Modules

### DOM Core
- [Querying](01-querying.md): `find`, `findAll`, `closest`
- [Events](02-events.md): `on`, `onDelegated`, `dispatch`
- [Manipulation](03-manipulation.md): `modify`, `css`, `tempStyle`
- [Structure](04-structure.md): `append`, `prepend`, `after`, `before`, `remove`, `wrap`, `mount`
- [Creation](05-creation.md): `el`, `html`, `htmlMany`, `clone`

### State & Attributes
- [Classes](06-classes.md): `cls`, `watchClass`
- [Attributes](07-attributes.md): `Data`, `watchAttr`, `watchText`
- [Objects](12-objects.md): `Obj`
- [Refs](14-refs.md): `refs`, `groupRefs`
- [Cycling](16-cycling.md): `cycleClass`

### Lifecycle & Observation
- [Lifecycle](08-lifecycle.md): `onReady`, `onMount`, `waitFor`
- [Cleanup](17-cleanup.md): `stripListeners`, `instantiate`, `cloneMany`
- [Timing](20-timing.md): `debounce`, `throttle`
- [Groups](25-groups.md): `createListenerGroup`
- [Signals](26-signals.md): `Signal`

### Layout & Navigation
- [Navigation](10-navigation.md): `Traverse`
- [CSS Utils](11-css-utils.md): `CssVar`, `computed`, `injectStyles`, `waitTransition`
- [Color](15-color.md): `toColorSpace`
- [Geometry](18-geometry.md): `rect`, `offset`, `isVisible`
- [Scroll & Focus](19-scroll-focus.md): `scrollInto`, `focus`, `blur`

### Data & Network
- [URL & Form](09-url-form.md): `Params`, `Form`
- [Collections](13-collections.md): `batch`, `groupBy`
- [Storage](21-storage.md): `Local`, `Session`
- [Cookies](22-cookies.md): `Cookie`
- [Network](23-network.md): `Http`
- [PWA](24-pwa.md): `SW`
- [Pub/Sub](27-pub-sub.md): `createBus`

### Advanced & Utilities
- [Fluent Wrapper ($)](28-fluent.md): `$`
- [Components](29-components.md): `component`, `$$`, `defineComponent`, `mountComponent`
- [Store](30-store.md): `store`
- [Forms](31-forms.md): `Input`, `form`
- [Event Helpers](32-event-helpers.md): `Evt`
- [Keyboard & Focus](33-keyboard-focus.md): `Key`, `Focus`
- [Text](34-text.md): `Text`
- [View Transitions](35-view-transitions.md): `ViewTransitions`
- [Async](36-async.md): `Async`
- [Queue](37-queue.md): `createQueue`
- [History](38-history.md): `History`
- [Error Handling](39-error-handling.md): `Result`
- [Option](40-option.md): `Option`
- [Reactive](41-reactive.md): `bind`, `createStore`
- [View](42-view.md): `view`, `binder`, `bindEvents`, `apply`
- [Functional](43-functional.md): `Fn`, `chain`, `exec`
- [Signals Update](44-signals-update.md): `createUpdateAfter`
