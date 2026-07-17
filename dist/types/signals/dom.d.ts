/**
 * @module reactive-dom
 *
 * Reactive DOM building with linked signals.
 * Each part of the DOM (attributes, classes, text, children) is a linked signal
 * that auto-updates from sources but can also be manually overridden.
 *
 * Shipped as the `@doeixd/dom/signals` subpath. Several exports (`text`,
 * `attr`, `on`, `mount`, `list`, `tags`, `render`) intentionally share names
 * with different APIs on the main entry — import from one entry per file, or
 * alias (`import { mount as mountView } from '@doeixd/dom/signals'`).
 *
 * Views rendered here are managed by their own reactive bindings; their
 * top-level nodes are branded so the main entry's `morph` reconciler adopts
 * them wholesale instead of morphing into them.
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
import type { Unsubscribe, ReadonlySignal } from './signals';
/** Reactive value - signal, getter, or static */
type Reactive<T> = T | ReadonlySignal<T> | (() => T);
/** Unwrap reactive to value */
type UnwrapReactive<T> = T extends ReadonlySignal<infer V> ? V : T extends () => infer V ? V : T;
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
type PartType = 'text' | 'attr' | 'prop' | 'class' | 'style' | 'event' | 'children' | 'ref' | 'spread';
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
type ViewNode = ViewElement | ViewText | ViewFragment | ViewPortal | ViewConditional | ViewList<any> | string | number | null | undefined;
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
}
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
export declare function text(content: Reactive<string>): TextPart;
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
export declare function attr(name: string, value: Reactive<string | number | boolean | null>): AttrPart;
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
export declare function attrs(map: ReactiveAttrMap): AttrPart[];
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
export declare function prop<T>(name: string, value: Reactive<T>): PropPart<T>;
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
export declare function cls(classes: ReactiveClassMap | Reactive<string>): ClassPart;
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
export declare function style(styles: ReactiveStyleMap): StylePart;
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
export declare function on<K extends keyof HTMLElementEventMap>(eventName: K, handler: (event: HTMLElementEventMap[K]) => void): EventPart<HTMLElementEventMap[K]>;
export declare function on<E extends Event = Event>(eventName: string, handler: (event: E) => void): EventPart<E>;
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
export declare function events(map: ReactiveEventMap): EventPart[];
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
export declare function ref<T extends Element = Element>(callback: RefCallback<T>): RefPart<T>;
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
export declare function tag(tagName: string): (...parts: (Part | ViewNode)[]) => ViewElement;
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
export declare const tags: Record<string, (...parts: (Part | ViewNode)[]) => ViewElement>;
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
export declare function textNode(content: Reactive<string>): ViewText;
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
export declare function fragment(...children: ViewNode[]): ViewFragment;
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
export declare function portal(target: Element | string, ...children: ViewNode[]): ViewPortal;
/**
 * Create a conditional view.
 *
 * Branch semantics: each toggle **destroys** the inactive branch (running its
 * cleanups) and renders the other from scratch — branches do not keep state
 * while hidden. Keep state that must survive toggling in signals outside the
 * branch, or lift it above the `when`.
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
export declare function when(condition: Reactive<boolean>, then: ViewNode, otherwise?: ViewNode): ViewConditional;
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
export declare function list<T>(items: Reactive<T[]>, render: (item: T, index: number) => ViewNode, key?: (item: T, index: number) => string | number): ViewList<T>;
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
export declare function keyed(key: string | number, node: ViewElement): ViewElement;
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
export declare function mount(view: ViewNode, container: Element | string): MountedView;
/**
 * Render a view to a DocumentFragment (doesn't mount).
 *
 * @example
 * ```typescript
 * const { fragment, cleanup } = render(view);
 * document.body.appendChild(fragment);
 * ```
 */
export declare function render(view: ViewNode): {
    fragment: DocumentFragment;
    cleanup: Unsubscribe;
};
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
export declare function html(strings: TemplateStringsArray, ...values: (Reactive<string | number> | ((e: Event) => void))[]): ViewNode;
export type { Reactive, UnwrapReactive, ReactiveClassMap, ReactiveStyleMap, ReactiveAttrMap, ReactiveEventMap, PartType, Part, TextPart, AttrPart, PropPart, ClassPart, StylePart, EventPart, ChildrenPart, RefPart, RefCallback, ViewNode, ViewElement, ViewText, ViewFragment, ViewPortal, ViewConditional, ViewList, MountedView, };
//# sourceMappingURL=dom.d.ts.map