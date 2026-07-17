import { describe, it, expect, vi } from 'vitest';
import {
  signal, tag, tags, text, attr, cls, style as styleParts, on as onPart,
  when, list, mount, render, fragment
} from '../src/signals';
import { component, Tag, morph } from '../src/index';

const flush = () => new Promise<void>(r => queueMicrotask(() => queueMicrotask(r)));

describe('signals view: reactivity', () => {
  it('binds text, attributes, and classes to signals and updates in place', () => {
    const name = signal('Alice');
    const active = signal(false);

    const view = tag('div')(
      attr('data-name', () => name.value),
      cls({ active: () => active.value, static: true }),
      tag('h1')(text(() => `Hello, ${name.value}!`))
    );

    const { element, cleanup } = mount(view, document.body);
    const el = element as HTMLElement;
    const h1 = el.querySelector('h1')!;
    expect(el.getAttribute('data-name')).toBe('Alice');
    expect(el.classList.contains('static')).toBe(true);
    expect(el.classList.contains('active')).toBe(false);
    expect(h1.textContent).toBe('Hello, Alice!');

    const h1Node = h1.firstChild;
    name.value = 'Bob';
    active.value = true;
    expect(el.getAttribute('data-name')).toBe('Bob');
    expect(el.classList.contains('active')).toBe(true);
    expect(h1.textContent).toBe('Hello, Bob!');
    expect(h1.firstChild).toBe(h1Node); // text node patched, not replaced

    cleanup();
  });

  it('part override pauses reactivity until reset', () => {
    const label = signal('from-signal');
    const part = text(() => label.value);
    const view = tag('span')(part);
    const { element, cleanup } = mount(view, document.body);
    const el = element as HTMLElement;
    expect(el.textContent).toBe('from-signal');

    part.set('manual');
    expect(el.textContent).toBe('manual');
    expect(part.isOverridden).toBe(true);
    label.value = 'ignored while overridden';
    expect(el.textContent).toBe('manual');

    part.reset();
    expect(part.isOverridden).toBe(false);
    expect(el.textContent).toBe('ignored while overridden');
    label.value = 'reactive again';
    expect(el.textContent).toBe('reactive again');
    cleanup();
  });

  it('when() swaps branches (destroy and rebuild)', () => {
    const cond = signal(true);
    const view = tag('div')(
      when(() => cond.value, tag('b')(text('yes')), tag('i')(text('no')))
    );
    const { element, cleanup } = mount(view, document.body);
    const el = element as HTMLElement;
    expect(el.querySelector('b')).not.toBeNull();
    const firstB = el.querySelector('b');

    cond.value = false;
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('i')!.textContent).toBe('no');

    cond.value = true;
    expect(el.querySelector('b')).not.toBeNull();
    expect(el.querySelector('b')).not.toBe(firstB); // rebuilt, not cached
    cleanup();
  });

  it('event parts attach handlers', () => {
    const clicks: number[] = [];
    const view = tag('button')(onPart('click', () => clicks.push(1)));
    const { element, cleanup } = mount(view, document.body);
    (element as HTMLElement).click();
    expect(clicks).toEqual([1]);
    cleanup();
  });
});

describe('signals view: keyed list (LIS reordering)', () => {
  const setup = () => {
    const items = signal([1, 2, 3, 4, 5]);
    const view = tag('ul')(
      list(() => items.value, (n) => tag('li')(attr('data-key', String(n)), text(String(n))), (n) => n)
    );
    const { element, cleanup } = mount(view, document.body);
    const ul = element as HTMLUListElement;
    const nodeFor = (n: number) => ul.querySelector(`[data-key="${n}"]`)!;
    const order = () => Array.from(ul.querySelectorAll('li')).map(l => Number(l.getAttribute('data-key')));
    return { items, ul, nodeFor, order, cleanup };
  };

  it('reorders by identity: existing items move, not re-render', () => {
    const { items, nodeFor, order, cleanup } = setup();
    const n3 = nodeFor(3);
    items.value = [3, 1, 2, 4, 5];
    expect(order()).toEqual([3, 1, 2, 4, 5]);
    expect(nodeFor(3)).toBe(n3);
    cleanup();
  });

  it('moving one item to the front is a single DOM move', () => {
    const { items, ul, order, cleanup } = setup();
    const moves = vi.spyOn(ul, 'insertBefore');
    items.value = [5, 1, 2, 3, 4];
    expect(order()).toEqual([5, 1, 2, 3, 4]);
    expect(moves).toHaveBeenCalledTimes(1);
    moves.mockRestore();
    cleanup();
  });

  it('an unchanged list performs zero moves', () => {
    const { items, ul, cleanup } = setup();
    const moves = vi.spyOn(ul, 'insertBefore');
    items.value = [...items.value];
    expect(moves).not.toHaveBeenCalled();
    moves.mockRestore();
    cleanup();
  });

  it('removed items leave the DOM', () => {
    const { items, order, cleanup } = setup();
    items.value = [2, 4];
    expect(order()).toEqual([2, 4]);
    cleanup();
  });
});

describe('signals view: interop with morph', () => {
  it('mounted view nodes are branded opaque — morph adopts, never morphs them', async () => {
    // A signals-view root <b> that could positionally match a sibling <b>.
    const label = signal('sig');
    const { fragment: frag } = render(tag('b')(text(() => label.value)));
    const sigNode = frag.firstChild as HTMLElement;

    const Comp = component(() => {
      return () => Tag.div(Tag.b({ innerText: 'static' }), sigNode);
    }, { reconcile: morph });

    const c = Comp().mount(document.body);
    expect(document.body.querySelectorAll('b')[1]).toBe(sigNode);

    c.update();
    await flush();

    const bs = document.body.querySelectorAll('b');
    expect(bs[1]).toBe(sigNode); // live node survived the morph
    label.value = 'still-reactive';
    expect(bs[1].textContent).toBe('still-reactive'); // bindings intact
    c.destroy();
  });
});

describe('signals view: builders', () => {
  it('tags proxy and fragments work', () => {
    const view = fragment(
      tags.h2(text('Title')),
      tags.p(text('Body'))
    );
    const { fragment: frag, cleanup } = render(view);
    document.body.append(frag);
    expect(document.body.querySelector('h2')!.textContent).toBe('Title');
    expect(document.body.querySelector('p')!.textContent).toBe('Body');
    cleanup();
  });

  it('svg tags get the SVG namespace', () => {
    const { element, cleanup } = mount(tag('svg')(tag('circle')(attr('r', '5'))), document.body);
    expect((element as Element).namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect((element as Element).querySelector('circle')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
    cleanup();
  });

  it('style parts apply and update', () => {
    const color = signal('red');
    const { element, cleanup } = mount(
      tag('div')(styleParts({ color: () => color.value })), document.body
    );
    expect((element as HTMLElement).style.color).toBe('red');
    color.value = 'blue';
    expect((element as HTMLElement).style.color).toBe('blue');
    cleanup();
  });
});
