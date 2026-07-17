# Templating Interoperability (`h` ↔ `Tag` ↔ signals views)

The library ships more than one way to build DOM. This page explains how they
relate, what mixes freely, and the exact places where mixing bites.

## The three systems

| System | Style | Produces | Docs |
|---|---|---|---|
| `h` / `el` / `tags` | Props-first, VanJS-style: `h.div({ dataRef: 'x' }, [children])` | `HTMLElement` | [45-hyperscript](45-hyperscript.md) |
| `Tag` / `Attr` / `Style` | Curried modifiers: `Tag.div(Attr.onclick(fn), child)` | `HTMLElement` | [49-component](49-component.md) |
| Signals views (`tag()`, `text()`, `attr()` with reactive bindings) | Declarative view descriptions with fine-grained reactivity | `ViewNode` (not a DOM node) until `render()`/`mount()` | *internal — currently not exported from the package* |

`h` and `Tag` both return **plain elements with no wrapper**, which is why most
interop "just works": the DOM itself is the common format.

## What mixes freely (`h` ↔ `Tag`)

**Nesting, both directions.** An element is an element:

```typescript
Tag.div(h.span({}, ['from h']));          // h inside Tag
h.div({}, [Tag.span(Attr.innerText('from Tag'))]); // Tag inside h
```

**`Attr` / `Style` modifiers on any element.** A modifier is just
`(el) => void`, so it applies to DOM from any source — including `Style.scope`
classes:

```typescript
const btn = h.button({}, ['Save']);
Attr.disabled(true)(btn);
Style.color('red')(btn);
```

**Refs and enhancement.** `refs()`, `viewRefs`, `enhance`, and the
[binder](48-binder.md) scan real DOM for `[data-ref]`. `h`'s `dataRef` prop
and `Tag`'s `{ 'data-ref': ... }` are equivalent; a `viewRefs` template can be
built with either system.

**`morph`.** The reconciler compares real elements and doesn't care which
factory built the new tree.

## ⚠️ Gap 1: `h` does not accept `ComponentHandle` children

`Tag` recognizes a [`ComponentHandle`](49-component.md) argument: it appends
the handle's live nodes **and brands them** so `morph` treats them as opaque
(adopt wholesale, never match-and-morph — morphing over a kept-alive child
would orphan its live DOM).

`h` has no such case. `h.div({}, [counterHandle])` is a compile error, and at
runtime the handle would be stringified into an `"[object Object]"` text node.

The tempting workaround **loses the branding**:

```typescript
h.div({}, [...counter.nodes]);   // ⚠️ works in replace mode only
```

Under a parent using `{ reconcile: morph }`, those unbranded child nodes can
be positionally matched against stale nodes and morphed — orphaning the live
child component. **Rule: compose components with `Tag` (or `ctx.child` +
`Tag`), not `h`, anywhere a morph reconciler is in play.** In replace-mode
components the spread workaround is safe, just untyped.

## ⚠️ Gap 2: listener tracking is `Tag`/`Attr`-only

[`syncListeners`/`getTrackedListeners`](49-component.md#listener-tracking--synclisteners--gettrackedlisteners)
record listeners attached through `Tag` props objects and `Attr.on*`. `h`'s
props (`ElementProps`) have no event fields at all — listeners on `h`-built
DOM come from `on()`, which does **not** record into the tracked registry.

Consequences under `morph`:

- usually benign: the old node survives the morph, its `on()` listeners
  persist, and handlers that read setup-scope closures stay correct;
- but `syncListeners` cannot remove or replace them, so **conditionally
  attached handlers on `h`-built subtrees go stale** after a morph.

Replace-mode components are unaffected (nodes are swapped, listeners die with
them).

## The signals view system: bridged, not interoperable

Its `ViewNode`s are descriptions, not DOM, so they can't be passed to `Tag`
or `h`. Interop is one-way: `render(view)` / `mount(view, container)` produce
real DOM you can place anywhere, but that subtree is managed by its own
reactive bindings and cleanup — treat it as a black box (and note its nodes
carry no component branding, so keep it out of morphed regions too).

It is currently **not exported** from the package entry; this section matters
only if you wire it up.

## Cheat sheet

| Mix | Verdict |
|---|---|
| `h` element inside `Tag` / `Tag` element inside `h` | ✅ |
| `Attr` / `Style` modifier on `h`-built (or any) element | ✅ |
| `refs` / `viewRefs` / `enhance` / binder over either | ✅ |
| `ComponentHandle` as `Tag` child | ✅ branded, morph-safe |
| `ComponentHandle` in `h` children | ❌ compile error; `...handle.nodes` spread is morph-**unsafe** |
| `on()` listeners + `morph` updates | ⚠️ persist but never re-sync; fine for stable setup-closure handlers |
| Signals `ViewNode` in `Tag`/`h` | ❌ — bridge via `render()`/`mount()`, keep out of morphed regions |
