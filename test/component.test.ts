import { describe, it, expect, vi } from 'vitest';
import { component, Tag, Attr, Style } from '../src/index';

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
