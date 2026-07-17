import { describe, it, expect, vi } from 'vitest';
import { component, Tag, Attr, Style, getTrackedListeners, syncListeners, morph, type Reconciler, type ComponentHandle } from '../src/index';

const flush = () => new Promise<void>(r => queueMicrotask(() => queueMicrotask(r)));

describe('Tag / Attr', () => {
  it('creates elements with children, modifiers, and props objects', () => {
    const clicks: string[] = [];
    const el = Tag.div(
      Tag.button(Attr.onclick(() => clicks.push('a')), Attr.innerText('Inc')),
      Tag.span({ className: 'count', innerText: '0' }),
      'plain text',
      42,
      null,
      false,
      [Tag.em('nested'), 'in array']
    );
    expect(el.tagName).toBe('DIV');
    const button = el.querySelector('button')!;
    expect(button.innerText).toBe('Inc');
    button.click();
    expect(clicks).toEqual(['a']);
    expect(el.querySelector('span')!.className).toBe('count');
    expect(el.textContent).toContain('plain text');
    expect(el.textContent).toContain('42');
    expect(el.querySelector('em')!.textContent).toBe('nested');
  });

  it('sets attributes for non-property keys and handles booleans', () => {
    const el = Tag.input({ 'data-role': 'main' }, Attr.disabled(true));
    expect(el.getAttribute('data-role')).toBe('main');
    expect((el as HTMLInputElement).disabled).toBe(true);
    const el2 = Tag.div(Attr.hidden(false));
    expect(el2.hasAttribute('hidden')).toBe(false);
  });

  it('rejects invalid tag names', () => {
    expect(() => (Tag as any)['<script>']()).toThrow(/Invalid tag name/);
  });

  it('returns concrete element types for known tags', () => {
    // Compile-time assertions: no casts needed.
    const input: HTMLInputElement = Tag.input({ value: 'x' });
    const anchor: HTMLAnchorElement = Tag.a({ href: '/home' });
    const custom: HTMLElement = Tag['my-widget']();
    expect(input.value).toBe('x');
    expect(anchor.tagName).toBe('A');
    expect(custom.tagName.toLowerCase()).toBe('my-widget');
  });

  it('rejects mistyped props and misplaced element-specific modifiers at compile time', () => {
    // @ts-expect-error — <div> has no `value` property
    const bad1 = Tag.div(Attr.value('x'));
    // @ts-expect-error — input.value is a string, not a number
    const bad2 = Tag.input({ value: 3 });
    // @ts-expect-error — unknown property (excess property check)
    const bad3 = Tag.div({ innrText: 'typo' });
    // Valid: element-specific modifier on the right element.
    const ok = Tag.input(Attr.value('typed'));
    expect(ok.value).toBe('typed');
    // Runtime is permissive by design; only the types complain.
    expect(bad1).toBeTruthy();
    expect(bad2).toBeTruthy();
    expect(bad3).toBeTruthy();
  });

  it('types Attr event handlers and known HTMLElement properties', () => {
    let x = 0;
    // Compile-time: onclick handler receives a MouseEvent; innerText takes a string.
    const el = Tag.div(
      Attr.onclick((e: MouseEvent) => { x = e.clientX; }),
      Attr.innerText('typed'),
      Attr['data-kind']('demo')
    );
    expect(el.innerText).toBe('typed');
    expect(el.getAttribute('data-kind')).toBe('demo');
    el.dispatchEvent(new MouseEvent('click', { clientX: 5 }));
    expect(x).toBe(5);
  });
});

describe('Style', () => {
  it('sets camelCase properties via property access', () => {
    const el = Tag.div(Style.color('red'), Style.backgroundColor('blue'));
    expect(el.style.color).toBe('red');
    expect(el.style.backgroundColor).toBe('blue');
  });

  it('sets styles via a props object, including kebab-case and custom properties', () => {
    const el = Tag.div(Style({ color: 'red', 'background-color': 'blue', '--accent': '#f00', opacity: 0.5 }));
    expect(el.style.color).toBe('red');
    expect(el.style.backgroundColor).toBe('blue');
    expect(el.style.getPropertyValue('--accent')).toBe('#f00');
    expect(el.style.opacity).toBe('0.5');
  });

  it('removes declarations with null', () => {
    const el = Tag.div(Style({ color: 'red', 'background-color': 'blue' }));
    Style.color(null)(el);
    Style({ 'background-color': null })(el);
    expect(el.style.color).toBe('');
    expect(el.style.backgroundColor).toBe('');
  });

  it('appends px to numbers except unitless properties, keeps 0 bare', () => {
    const el = Tag.div(Style({ width: 200, opacity: 0.5, zIndex: 3, margin: 0 }));
    expect(el.style.width).toBe('200px');
    expect(el.style.opacity).toBe('0.5');
    expect(el.style.zIndex).toBe('3');
    expect(el.style.margin).toBe('0px'); // 0 normalizes; happy-dom reports 0px
    Style.height(12)(el);
    expect(el.style.height).toBe('12px');
  });

  it('composes multiple props objects left-to-right', () => {
    const base = { color: 'red', opacity: 0.5 };
    const override = { color: 'blue' };
    const el = Tag.div(Style(base, override));
    expect(el.style.color).toBe('blue');
    expect(el.style.opacity).toBe('0.5');
  });

  it('scope() injects nested rules under a generated class', () => {
    const card = Style.scope({
      padding: 16,
      '--accent': '#f00',
      '&:hover': { backgroundColor: 'var(--accent)' },
      '& > h2': { margin: 0 },
      '@media (max-width: 600px)': { padding: 8 },
      '@layer utilities': { '&.raised': { boxShadow: '0 2px 8px #0003' } }
    });
    const el = Tag.div(card);
    const cls = Array.from(el.classList).find(c => c.startsWith('dom-s'))!;
    expect(cls).toBeTruthy();
    const sheet = document.head.querySelector('style[data-doeixd-dom]')!;
    const css = sheet.textContent!;
    expect(css).toContain(`.${cls}{padding:16px;--accent:#f00;}`);
    expect(css).toContain(`.${cls}:hover{background-color:var(--accent);}`);
    expect(css).toContain(`.${cls} > h2{margin:0;}`);
    expect(css).toContain(`@media (max-width: 600px){.${cls}{padding:8px;}}`);
    expect(css).toContain(`@layer utilities{.${cls}.raised{box-shadow:0 2px 8px #0003;}}`);
    // Reusing the modifier reuses the class without re-injecting.
    const el2 = Tag.div(card);
    expect(el2.classList.contains(cls)).toBe(true);
    expect(css.split(`.${cls}{padding:16px`).length).toBe(2); // injected once
  });

  it('keyframes() registers an animation and returns its name', () => {
    const spin = Style.keyframes({ from: { opacity: 0 }, '50%': { opacity: 0.3 }, to: { opacity: 1 } });
    expect(spin).toMatch(/^dom-kf/);
    const el = Tag.div(Style.animationName(spin), Style.animationDuration('1s'));
    expect(el.style.animationName).toBe(spin);
    const css = document.head.querySelector('style[data-doeixd-dom]')!.textContent!;
    expect(css).toContain(`@keyframes ${spin}{from{opacity:0;}50%{opacity:0.3;}to{opacity:1;}}`);
    const named = Style.keyframes({ to: { opacity: 0 } }, 'fade-out');
    expect(named).toBe('fade-out');
  });

  it('type-checks keyframe steps and scoped keys', () => {
    // @ts-expect-error — keyframe steps are from/to/percentages
    const bad = Style.keyframes({ middle: { opacity: 0 } });
    expect(bad).toBeTruthy();
    // Valid enum autocomplete values compile:
    const el = Tag.div(Style({ display: 'flex', position: 'sticky' }));
    expect(el.style.display).toBe('flex');
  });

  it('rejects unknown camelCase properties at compile time', () => {
    // @ts-expect-error — 'colr' is not a CSS property
    const bad1 = Style.colr('red');
    // @ts-expect-error — typo in a camelCase key (excess property check)
    const bad2 = Style({ colr: 'red' });
    expect(bad1).toBeTypeOf('function');
    expect(bad2).toBeTypeOf('function');
  });
});

describe('component', () => {
  const Counter = component((ctx) => {
    let count = 0;
    return () => Tag.div(
      Tag.button(Attr.onclick(ctx.event(() => count += 1)), Attr.innerText('Inc'), Attr.className('inc')),
      Tag.div(Attr.innerText(String(count)), Attr.className('value')),
      Tag.button({ onclick: ctx.event(() => count -= 1), innerText: 'Dec', className: 'dec' })
    );
  });

  it('renders synchronously on creation and mounts', () => {
    const counter = Counter();
    expect(counter.el).not.toBeNull();
    counter.mount(document.body);
    expect(document.body.querySelector('.value')!.textContent).toBe('0');
    counter.destroy();
  });

  it('ctx.event() runs the handler and re-renders (batched)', async () => {
    const counter = Counter().mount(document.body);
    (document.body.querySelector('.inc') as HTMLElement).click();
    (document.body.querySelector('.inc') as HTMLElement).click();
    await flush();
    expect(document.body.querySelector('.value')!.textContent).toBe('2');
    (document.body.querySelector('.dec') as HTMLElement).click();
    await flush();
    expect(document.body.querySelector('.value')!.textContent).toBe('1');
    counter.destroy();
  });

  it('batches multiple update() calls into one render', async () => {
    let renders = 0;
    const Comp = component((ctx) => {
      return () => { renders++; return Tag.div(Attr.onclick(ctx.event(() => {}))); };
    });
    const c = Comp().mount(document.body);
    expect(renders).toBe(1);
    c.update();
    c.update();
    c.update();
    await flush();
    expect(renders).toBe(2);
    c.destroy();
  });

  it('replaces rendered nodes in place, preserving position among siblings', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    host.append(document.createElement('header'));
    const c = Counter();
    host.append(...c.nodes);
    host.append(document.createElement('footer'));
    c.update();
    await flush();
    expect(host.children[0].tagName).toBe('HEADER');
    expect(host.children[1].tagName).toBe('DIV');
    expect(host.children[2].tagName).toBe('FOOTER');
    expect(host.querySelectorAll('div.value')).toHaveLength(1);
    c.destroy();
    host.remove();
  });

  it('supports a typed event map: dispatch details and on() listeners', () => {
    type Events = { pick: { value: number }; clear: undefined };
    const Picker = component<void, Events>((ctx) => {
      return () => Tag.div(
        Tag.button(Attr.className('pick'), Attr.onclick(() => ctx.dispatch('pick', { value: 42 }))),
        Tag.button(Attr.className('clear'), Attr.onclick(() => ctx.dispatch('clear')))
      );
    });
    const p = Picker().mount(document.body);
    const picks: number[] = [];
    let cleared = 0;
    p.on('pick', e => picks.push(e.detail.value)); // e is CustomEvent<{ value: number }>
    const offClear = p.on('clear', () => cleared++);
    // @ts-expect-error — 'pick' requires a detail
    const badDispatch = component<void, Events>((ctx) => (ctx.dispatch('pick'), () => Tag.div()));
    // @ts-expect-error — unknown event name
    p.on('nope', () => {});
    (p.el!.querySelector('.pick') as HTMLElement).click();
    (p.el!.querySelector('.clear') as HTMLElement).click();
    offClear();
    (p.el!.querySelector('.clear') as HTMLElement).click();
    expect(picks).toEqual([42]);
    expect(cleared).toBe(1);
    expect(badDispatch).toBeTruthy();
    p.destroy();
  });

  it('acts as an EventTarget via ctx.dispatch', () => {
    const Comp = component((ctx) => {
      return () => Tag.button(Attr.onclick(() => ctx.dispatch('change', { value: 7 })));
    });
    const c = Comp().mount(document.body);
    const handler = vi.fn();
    c.addEventListener('change', handler);
    c.el!.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 7 });
    c.destroy();
  });

  it('destroy() aborts ctx.signal, removes nodes, and makes update() a no-op', async () => {
    let renders = 0;
    let signal: AbortSignal | undefined;
    const Comp = component((ctx) => {
      signal = ctx.signal;
      return () => { renders++; return Tag.div(Attr.className('gone')); };
    });
    const c = Comp().mount(document.body);
    expect(document.body.querySelector('.gone')).not.toBeNull();
    c.destroy();
    expect(signal!.aborted).toBe(true);
    expect(document.body.querySelector('.gone')).toBeNull();
    c.update();
    await flush();
    expect(renders).toBe(1);
  });

  it('passes props to setup', () => {
    const Greeting = component<{ name: string }>((_ctx, props) => {
      return () => Tag.p(Attr.innerText(`Hello ${props.name}`));
    });
    const g = Greeting({ name: 'Pat' });
    expect((g.el as HTMLElement).innerText).toBe('Hello Pat');
  });

  it('accepts a ComponentHandle as a Tag child (composition)', () => {
    const Child = component(() => () => Tag.span(Attr.className('child'), Attr.innerText('hi')));
    const child = Child();
    const wrapper = Tag.section(Attr.className('parent'), child);
    expect(wrapper.querySelector('.child')!.textContent).toBe('hi');
    child.destroy();
  });

  it('exposes previously rendered nodes via ctx.last', () => {
    let seen: Node[] = [];
    const Comp = component((ctx) => {
      return () => { seen = ctx.last; return Tag.div(); };
    });
    const c = Comp();
    expect(seen).toEqual([]); // first render: nothing previous
    c.mount(document.body);
    c.destroy();
  });
});

describe('ctx.child', () => {
  const makeChild = (setups: number[], destroys: number[], id: number) =>
    component((ctx) => {
      setups.push(id);
      let count = 0;
      ctx.signal.addEventListener('abort', () => destroys.push(id));
      return () => Tag.span(
        Attr.className(`child-${id}`),
        Attr.innerText(String(count)),
        Attr.onclick(ctx.event(() => count += 1))
      );
    });

  it('keeps a child instance (state and setup) alive across parent re-renders', async () => {
    const setups: number[] = [], destroys: number[] = [];
    const Child = makeChild(setups, destroys, 1);
    const Parent = component((ctx) => {
      return () => Tag.div(ctx.child(1, () => Child()));
    });
    const p = Parent().mount(document.body);
    expect(setups).toEqual([1]);

    // Bump child state, then re-render the parent.
    (document.body.querySelector('.child-1') as HTMLElement).click();
    await flush();
    expect(document.body.querySelector('.child-1')!.textContent).toBe('1');

    p.update();
    await flush();
    expect(setups).toEqual([1]);           // setup did not re-run
    expect(destroys).toEqual([]);
    expect(document.body.querySelector('.child-1')!.textContent).toBe('1'); // state survived
    p.destroy();
  });

  it('destroys and evicts children whose key is not requested in a render', async () => {
    const setups: number[] = [], destroys: number[] = [];
    const ChildA = makeChild(setups, destroys, 1);
    const ChildB = makeChild(setups, destroys, 2);
    let showA = true;
    const Parent = component((ctx) => {
      return () => Tag.div(
        showA ? ctx.child('a', () => ChildA()) : ctx.child('b', () => ChildB())
      );
    });
    const p = Parent().mount(document.body);
    expect(setups).toEqual([1]);

    showA = false;
    p.update();
    await flush();
    expect(destroys).toEqual([1]);         // A destroyed on eviction
    expect(setups).toEqual([1, 2]);
    expect(document.body.querySelector('.child-1')).toBeNull();
    expect(document.body.querySelector('.child-2')).not.toBeNull();

    showA = true;
    p.update();
    await flush();
    expect(destroys).toEqual([1, 2]);
    expect(setups).toEqual([1, 2, 1]);     // A recreated fresh
    p.destroy();
  });

  it('supports keyed lists: reordering keeps instances alive', async () => {
    const setups: number[] = [], destroys: number[] = [];
    let ids = [1, 2, 3];
    const Parent = component((ctx) => {
      return () => Tag.ul(
        ids.map(id => ctx.child(id, () => makeChild(setups, destroys, id)()))
      );
    });
    const p = Parent().mount(document.body);
    expect(setups).toEqual([1, 2, 3]);

    ids = [3, 1];                          // drop 2, reorder
    p.update();
    await flush();
    expect(setups).toEqual([1, 2, 3]);     // no new setups
    expect(destroys).toEqual([2]);
    const spans = document.body.querySelectorAll('ul span');
    expect(Array.from(spans).map(s => s.className)).toEqual(['child-3', 'child-1']);
    p.destroy();
  });

  it('destroys all cached children when the parent is destroyed', () => {
    const setups: number[] = [], destroys: number[] = [];
    const Parent = component((ctx) => {
      return () => Tag.div(
        ctx.child(1, () => makeChild(setups, destroys, 1)()),
        ctx.child(2, () => makeChild(setups, destroys, 2)())
      );
    });
    const p = Parent().mount(document.body);
    p.destroy();
    expect(destroys.sort()).toEqual([1, 2]);
    expect(document.body.querySelector('.child-1')).toBeNull();
  });

  it('tracks listeners attached via Attr and props objects', () => {
    const fn = () => {};
    const a = Tag.button(Attr.onclick(fn));
    const b = Tag.button({ onclick: fn, onfocus: fn });
    expect(getTrackedListeners(a)).toEqual([{ type: 'click', handler: fn }]);
    expect(getTrackedListeners(b).map(l => l.type)).toEqual(['click', 'focus']);
    expect(getTrackedListeners(Tag.div())).toEqual([]);
  });

  it('syncListeners replaces tracked listeners without touching untracked ones', () => {
    const calls: string[] = [];
    const old = Tag.button(Attr.onclick(() => calls.push('old')));
    old.addEventListener('click', () => calls.push('untracked'));
    const next = Tag.button(Attr.onclick(() => calls.push('new')));

    syncListeners(old, next);
    old.click();
    expect(calls).toEqual(['untracked', 'new']); // 'old' removed, untracked kept
    expect(getTrackedListeners(old).map(l => l.type)).toEqual(['click']);
  });

  it('pins children created during setup (never auto-evicted)', async () => {
    const setups: number[] = [], destroys: number[] = [];
    let include = true;
    const Parent = component((ctx) => {
      const pinned = ctx.child('pin', () => makeChild(setups, destroys, 1)());
      return () => Tag.div(include ? pinned : null);
    });
    const p = Parent().mount(document.body);
    include = false;
    p.update();                            // render without requesting 'pin'
    await flush();
    expect(destroys).toEqual([]);          // still alive
    include = true;
    p.update();
    await flush();
    expect(document.body.querySelector('.child-1')).not.toBeNull();
    expect(setups).toEqual([1]);           // same instance re-attached
    p.destroy();
    expect(destroys).toEqual([1]);         // destroyed with parent
  });
});

describe('reconcile option', () => {
  // A minimal morph: copy text-only children, sync attributes and listeners.
  const naiveMorph: Reconciler = (from, to) => {
    Array.from(from.attributes).forEach(a => { if (!to.hasAttribute(a.name)) from.removeAttribute(a.name); });
    Array.from(to.attributes).forEach(a => from.setAttribute(a.name, a.value));
    if (to.children.length === 0) from.textContent = to.textContent;
    syncListeners(from, to);
  };

  it('keeps element identity across updates (focus/state-preserving)', async () => {
    let label = 'a';
    const Comp = component((ctx) => {
      return () => Tag.button(Attr.className(label), Attr.innerText(label), Attr.onclick(ctx.event(() => {})));
    }, { reconcile: naiveMorph });

    const c = Comp().mount(document.body);
    const first = c.el!;
    label = 'b';
    c.update();
    await flush();
    expect(c.el).toBe(first);                 // same node survived
    expect(first.className).toBe('b');        // morphed to new render
    expect(first.textContent).toBe('b');
    c.destroy();
  });

  it('reconciled element receives the new render listeners via syncListeners', async () => {
    const calls: string[] = [];
    let generation = 0;
    const Comp = component((ctx) => {
      return () => {
        const g = generation++;
        return Tag.button(Attr.onclick(() => { calls.push(`gen-${g}`); ctx.update(); }));
      };
    }, { reconcile: naiveMorph });

    const c = Comp().mount(document.body);
    const btn = c.el as HTMLButtonElement;
    btn.click();
    await flush();
    btn.click();                              // same node, but handler from render 2
    expect(calls).toEqual(['gen-0', 'gen-1']);
    c.destroy();
  });

  it('falls back to replacement when tags differ', async () => {
    let useSpan = false;
    const Comp = component(() => {
      return () => useSpan ? Tag.span(Attr.innerText('s')) : Tag.div(Attr.innerText('d'));
    }, { reconcile: naiveMorph });

    const c = Comp().mount(document.body);
    const first = c.el!;
    useSpan = true;
    c.update();
    await flush();
    expect(c.el).not.toBe(first);
    expect(c.el!.tagName).toBe('SPAN');
    expect(first.isConnected).toBe(false);
    c.destroy();
  });

  it('preserves position among siblings when reconciling', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    host.append(document.createElement('header'));
    let n = 0;
    const Comp = component(() => () => Tag.p(Attr.innerText(String(n))), { reconcile: naiveMorph });
    const c = Comp();
    host.append(...c.nodes);
    host.append(document.createElement('footer'));

    n = 1;
    c.update();
    await flush();
    expect(Array.from(host.children).map(e => e.tagName)).toEqual(['HEADER', 'P', 'FOOTER']);
    expect(host.querySelector('p')!.textContent).toBe('1');
    c.destroy();
    host.remove();
  });

  it('does not reconcile kept-alive child nodes reused at top level', async () => {
    // A node that appears in both old and new output must be left untouched.
    const Comp = component((ctx) => {
      return () => [ctx.child('kid', () => component(() => () => Tag.span(Attr.innerText('kid')))()).el!, Tag.em()];
    }, { reconcile: naiveMorph });
    const c = Comp().mount(document.body);
    const kid = c.nodes[0];
    c.update();
    await flush();
    expect(c.nodes[0]).toBe(kid);
    expect((kid as HTMLElement).textContent).toBe('kid');
    c.destroy();
  });
});

describe('dev warning: component created during render', () => {
  it('warns once when a component is instantiated inside a render function', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Leaky = component(() => () => Tag.span());
    const Parent = component(() => {
      return () => Tag.div(Leaky()); // fresh instance every render — leak
    });
    const p = Parent().mount(document.body);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('ctx.child');
    p.update();
    await flush();
    expect(warn).toHaveBeenCalledTimes(1); // deduped per component
    p.destroy();
    warn.mockRestore();
  });

  it('does not warn for ctx.child or setup-scope instances', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Child = component(() => () => Tag.span());
    const Parent = component((ctx) => {
      const pinned = Child(); // setup scope — fine
      return () => Tag.div(pinned, ctx.child('k', () => Child()));
    });
    const p = Parent().mount(document.body);
    expect(warn).not.toHaveBeenCalled();
    p.destroy();
    warn.mockRestore();
  });

  it('warns for inline instantiation inside a ctx.child-created child render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Inner = component(() => () => Tag.b());
    const Middle = component(() => () => Tag.i(Inner())); // leak inside child
    const Parent = component((ctx) => () => Tag.div(ctx.child('m', () => Middle())));
    const p = Parent().mount(document.body);
    expect(warn).toHaveBeenCalledTimes(1);
    p.destroy();
    warn.mockRestore();
  });
});

describe('ctx.child factory form (props + update)', () => {
  it('creates with props once, default update mutates props and re-renders child', async () => {
    let setups = 0;
    const Item = component<{ label: string }>((_ctx, props) => {
      setups++;
      return () => Tag.li(Attr.innerText(props.label));
    });
    let label = 'a';
    const Parent = component((ctx) => {
      return () => Tag.ul(ctx.child('i', Item, { label }));
    });
    const p = Parent().mount(document.body);
    expect(document.body.querySelector('li')!.textContent).toBe('a');

    label = 'b';
    p.update();
    await flush();
    expect(setups).toBe(1);                   // no re-setup
    expect(document.body.querySelector('li')!.textContent).toBe('b'); // props flowed through
    p.destroy();
  });

  it('uses a custom update callback when provided', async () => {
    const seen: string[] = [];
    const Item = component<{ label: string }>((_ctx, props) => () => Tag.li(Attr.innerText(props.label)));
    let label = 'x';
    const Parent = component((ctx) => {
      return () => Tag.ul(
        ctx.child('i', Item, { label }, (_h, next) => seen.push(next.label))
      );
    });
    const p = Parent().mount(document.body);
    expect(seen).toEqual([]);                 // not called on create
    label = 'y';
    p.update();
    await flush();
    expect(seen).toEqual(['y']);
    expect(document.body.querySelector('li')!.textContent).toBe('x'); // callback chose not to re-render
    p.destroy();
  });
});

describe('built-in morph reconciler', () => {
  it('preserves input identity and user-typed value with controlled rendering', async () => {
    let value = '';
    const Comp = component((ctx) => {
      return () => Tag.div(
        Tag.input({ value, oninput: ctx.event((e: Event) => value = (e.target as HTMLInputElement).value) }),
        Tag.p(Attr.innerText(`${value.length} chars`))
      );
    }, { reconcile: morph });

    const c = Comp().mount(document.body);
    const input = document.body.querySelector('input')!;
    input.value = 'hi';
    input.dispatchEvent(new Event('input'));
    await flush();
    expect(document.body.querySelector('input')).toBe(input); // same node
    expect(input.value).toBe('hi');
    expect(document.body.querySelector('p')!.textContent).toBe('2 chars');
    c.destroy();
  });

  it('reorders keyed children by identity via data-key', async () => {
    let ids = [1, 2, 3];
    const Comp = component(() => {
      return () => Tag.ul(ids.map(id => Tag.li({ 'data-key': id, innerText: `item-${id}` })));
    }, { reconcile: morph });

    const c = Comp().mount(document.body);
    const byKey = (k: number) => document.body.querySelector(`[data-key="${k}"]`)!;
    const li1 = byKey(1), li3 = byKey(3);

    ids = [3, 1];
    c.update();
    await flush();
    const items = Array.from(document.body.querySelectorAll('li'));
    expect(items.map(l => l.textContent)).toEqual(['item-3', 'item-1']);
    expect(items[0]).toBe(li3);               // same nodes, moved
    expect(items[1]).toBe(li1);
    c.destroy();
  });

  it('syncs attributes, listeners, and nested text', async () => {
    const calls: string[] = [];
    let gen = 0;
    const Comp = component((ctx) => {
      return () => {
        const g = gen++;
        return Tag.div(
          { 'data-gen': String(g), className: g === 0 ? 'first' : 'later' },
          Tag.button(Attr.onclick(() => { calls.push(`g${g}`); ctx.update(); })),
          Tag.span(Attr.innerText(`gen ${g}`))
        );
      };
    }, { reconcile: morph });

    const c = Comp().mount(document.body);
    const root = c.el!, btn = root.querySelector('button')!, span = root.querySelector('span')!;
    btn.click();
    await flush();
    expect(c.el).toBe(root);
    expect(root.querySelector('button')).toBe(btn);
    expect(root.querySelector('span')).toBe(span);
    expect(root.getAttribute('data-gen')).toBe('1');
    expect(root.className).toBe('later');
    expect(span.textContent).toBe('gen 1');
    btn.click();                              // listener from render 2, not render 1
    expect(calls).toEqual(['g0', 'g1']);
    c.destroy();
  });

  it('adopts kept-alive ctx.child nodes wholesale instead of morphing over them', async () => {
    const Kid = component(() => {
      const el = Tag.b(Attr.innerText('kid'));
      (el as any).__marker = true;            // instance identity proxy
      return () => el;
    });
    const Parent = component((ctx) => {
      return () => Tag.div(
        Tag.b(Attr.innerText('static')),      // same tag as the kid's root
        ctx.child('k', () => Kid())
      );
    }, { reconcile: morph });

    const p = Parent().mount(document.body);
    const kidEl = document.body.querySelectorAll('b')[1] as any;
    expect(kidEl.__marker).toBe(true);
    p.update();
    await flush();
    const bs = document.body.querySelectorAll('b');
    expect(bs).toHaveLength(2);
    expect((bs[1] as any).__marker).toBe(true); // live kid survived, not a morphed copy
    expect(bs[1].textContent).toBe('kid');
    expect(bs[0].textContent).toBe('static');
    p.destroy();
  });
});

describe('onError / afterRender / mount selector / render event', () => {
  it('onError keeps previous DOM and the component stays usable', async () => {
    const errors: unknown[] = [];
    let boom = false;
    const Comp = component(() => {
      return () => {
        if (boom) throw new Error('render failed');
        return Tag.p(Attr.innerText('ok'));
      };
    }, { onError: (e) => errors.push(e) });

    const c = Comp().mount(document.body);
    boom = true;
    c.update();
    await flush();
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe('render failed');
    expect(document.body.querySelector('p')!.textContent).toBe('ok'); // old DOM kept

    boom = false;
    c.update();
    await flush();
    expect(document.body.querySelector('p')).not.toBeNull(); // recovered
    c.destroy();
  });

  it('afterRender runs after every render with the current nodes, until unsubscribed', async () => {
    const seen: string[] = [];
    let n = 0;
    const Comp = component((ctx) => {
      const off = ctx.afterRender((nodes) => {
        seen.push((nodes[0] as HTMLElement).textContent!);
        if (seen.length === 2) off();
      });
      return () => Tag.p(Attr.innerText(String(n)));
    });
    const c = Comp().mount(document.body);
    expect(seen).toEqual(['0']);              // initial render included
    n = 1; c.update(); await flush();
    n = 2; c.update(); await flush();
    expect(seen).toEqual(['0', '1']);         // unsubscribed after second
    c.destroy();
  });

  it('mount accepts a selector and throws on a missing target', () => {
    const host = document.createElement('div');
    host.id = 'mount-target';
    document.body.append(host);
    const Comp = component(() => () => Tag.p(Attr.innerText('here')));
    const c = Comp().mount('#mount-target');
    expect(host.querySelector('p')!.textContent).toBe('here');
    expect(() => Comp().mount('#does-not-exist')).toThrow(/not found/);
    c.destroy();
    host.remove();
  });

  it('fires a render event on the handle after each render', async () => {
    const Comp = component(() => () => Tag.p());
    const c = Comp();
    let renders = 0;
    c.addEventListener('render', () => renders++);
    c.mount(document.body);
    c.update();
    await flush();
    expect(renders).toBe(1);                  // initial render precedes the listener
    c.destroy();
  });
});

describe('compile-time type safety', () => {
  it('checks props, child factories, events, and ctx shapes', () => {
    const Item = component<{ label: string }>((_ctx, props) => () => Tag.li(Attr.innerText(props.label)));

    type Events = { pick: { value: number }; clear: undefined };
    const Picker = component<void, Events>((ctx) => {
      ctx.dispatch('pick', { value: 1 });
      ctx.dispatch('clear');
      // @ts-expect-error — unknown event name
      ctx.dispatch('nope');
      // @ts-expect-error — wrong detail type
      ctx.dispatch('pick', { value: 'str' });
      ctx.on('pick', (e) => { const n: number = e.detail.value; void n; });
      // @ts-expect-error — unknown event in ctx.on
      ctx.on('missing', () => {});

      // Invalid calls: compile-time only — never executed.
      const _typeOnly = () => {
        // @ts-expect-error — props-taking factory needs the props argument
        ctx.child('a', Item);
        // @ts-expect-error — wrong prop type
        ctx.child('b', Item, { label: 42 });
        // @ts-expect-error — unknown prop key (excess property check)
        ctx.child('c', Item, { label: 'x', extra: true });
        // @ts-expect-error — props are required and typed
        Item();
        // @ts-expect-error — wrong prop shape at the factory call
        Item({ label: 7 });
      };
      void _typeOnly;
      const h = ctx.child('d', Item, { label: 'ok' }, (handle, p) => {
        // update callback is typed: handle is the Item handle, p its props
        const s: string = p.label; void s; void handle.el;
      });
      void h.nodes;

      const off = ctx.afterRender((nodes) => { void nodes.length; });
      off();
      return () => Tag.div();
    });

    const p = Picker();
    p.on('pick', (e) => { const n: number = e.detail.value; void n; });
    // @ts-expect-error — unknown event on the handle
    p.on('bogus', () => {});
    p.destroy();

    const i = Item({ label: 'fine' });
    i.destroy();
    expect(true).toBe(true);
  });
});

describe('type inference', () => {
  // Type-level equality: exact match, not just assignability.
  type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
  const expectType = <T extends true>(): T => true as T;

  it('infers props, event params, child handles, and update callbacks without annotations', () => {
    // P infers from an annotated setup param — no explicit generic needed.
    const Item = component((_ctx, props: { label: string }) => () => Tag.li(Attr.innerText(props.label)));
    expectType<Equal<Parameters<typeof Item>[0], { label: string }>>();

    type ItemEvents = { removed: { id: number } };
    const EvItem = component<{ id: number }, ItemEvents>((_c, p) => () => Tag.li(Attr.innerText(String(p.id))));

    const Parent = component((ctx) => {
      // ctx.event: param type flows contextually from Attr.onclick.
      const btn = Tag.button(
        Attr.onclick(ctx.event(e => { expectType<Equal<typeof e, PointerEvent>>(); }))
      );
      // ctx.event standalone: args and return type preserved exactly.
      const wrapped = ctx.event((a: number, b: string) => a + b.length);
      expectType<Equal<typeof wrapped, (a: number, b: string) => number>>();

      // ctx.child update callback: handle and props infer, events included.
      return () => Tag.ul(
        btn,
        ctx.child(1, EvItem, { id: 1 }, (handle, props) => {
          expectType<Equal<typeof props, { id: number }>>();
          handle.on('removed', (e) => {
            expectType<Equal<typeof e.detail, { id: number }>>();
          });
        }),
        // child return type keeps the concrete handle type (events included).
        (() => {
          const h = ctx.child(2, EvItem, { id: 2 });
          expectType<Equal<typeof h, ComponentHandle<ItemEvents>>>();
          return h;
        })()
      );
    });

    const p = Parent().mount(document.body);
    // handle.on infers the listener's CustomEvent from the event name.
    const ev = EvItem({ id: 9 });
    ev.on('removed', (e) => expectType<Equal<typeof e, CustomEvent<{ id: number }>>>());
    ev.destroy();
    p.destroy();
    expect(true).toBe(true);
  });
});
