import { describe, it, expect, beforeEach } from 'vitest';
import { h, tags, refs, modify } from '../src';

describe('h() hyperscript proxy', () => {
  describe('HTML element creation', () => {
    it('creates a div element', () => {
      const el = h.div({}, []);
      expect(el.tagName).toBe('DIV');
      expect(el instanceof HTMLDivElement).toBe(true);
    });

    it('creates various HTML elements', () => {
      expect(h.span({}, []).tagName).toBe('SPAN');
      expect(h.p({}, []).tagName).toBe('P');
      expect(h.button({}, []).tagName).toBe('BUTTON');
      expect(h.input({}, []).tagName).toBe('INPUT');
      expect(h.section({}, []).tagName).toBe('SECTION');
      expect(h.article({}, []).tagName).toBe('ARTICLE');
    });

    it('works without props or children', () => {
      const el = h.div();
      expect(el.tagName).toBe('DIV');
      expect(el.children.length).toBe(0);
      expect(el.textContent).toBe('');
    });

    it('works with props but no children', () => {
      const el = h.div({ class: { active: true } });
      expect(el.classList.contains('active')).toBe(true);
    });

    it('works with children but no props', () => {
      const el = h.div({}, ['Hello']);
      expect(el.textContent).toBe('Hello');
    });
  });

  describe('Props application', () => {
    it('applies class props correctly', () => {
      const el = h.div({ class: { active: true, disabled: false } }, []);
      expect(el.classList.contains('active')).toBe(true);
      expect(el.classList.contains('disabled')).toBe(false);
    });

    it('applies style props correctly', () => {
      const el = h.div({ style: { color: 'red', fontSize: '16px' } }, []);
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('16px');
    });

    it('applies attribute props correctly', () => {
      const el = h.button({ attr: { type: 'submit', 'aria-label': 'Submit' } }, []);
      expect(el.getAttribute('type')).toBe('submit');
      expect(el.getAttribute('aria-label')).toBe('Submit');
    });

    it('applies text prop correctly', () => {
      const el = h.div({ text: 'Hello World' }, []);
      expect(el.textContent).toBe('Hello World');
    });

    it('applies html prop correctly', () => {
      const el = h.div({ html: '<strong>Bold</strong>' }, []);
      expect(el.innerHTML).toBe('<strong>Bold</strong>');
      expect(el.querySelector('strong')).not.toBeNull();
    });

    it('applies dataset props correctly', () => {
      const el = h.div({ dataset: { userId: '123', role: 'admin' } }, []);
      expect(el.dataset.userId).toBe('123');
      expect(el.dataset.role).toBe('admin');
    });

    it('applies multiple prop types together', () => {
      const el = h.div({
        class: { card: true },
        style: { padding: '10px' },
        attr: { id: 'my-card' },
        dataset: { cardId: '1' }
      }, []);

      expect(el.classList.contains('card')).toBe(true);
      expect(el.style.padding).toBe('10px');
      expect(el.id).toBe('my-card');
      expect(el.dataset.cardId).toBe('1');
    });
  });

  describe('dataRef prop handling', () => {
    it('sets data-ref attribute when dataRef is provided', () => {
      const el = h.div({ dataRef: 'myElement' }, []);
      expect(el.getAttribute('data-ref')).toBe('myElement');
      expect(el.dataset.ref).toBe('myElement');
    });

    it('does not set data-ref when dataRef is not provided', () => {
      const el = h.div({}, []);
      expect(el.getAttribute('data-ref')).toBeNull();
    });

    it('works with dataRef and other props', () => {
      const el = h.div({
        dataRef: 'test',
        class: { active: true },
        style: { color: 'blue' }
      }, []);

      expect(el.dataset.ref).toBe('test');
      expect(el.classList.contains('active')).toBe(true);
      expect(el.style.color).toBe('blue');
    });
  });

  describe('Children handling', () => {
    it('appends string children as text nodes', () => {
      const el = h.div({}, ['Hello', 'World']);
      expect(el.textContent).toBe('HelloWorld');
      expect(el.childNodes.length).toBe(2);
      expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(el.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
    });

    it('appends element children', () => {
      const child1 = h.span({}, ['Child 1']);
      const child2 = h.span({}, ['Child 2']);
      const el = h.div({}, [child1, child2]);

      expect(el.children.length).toBe(2);
      expect(el.children[0].tagName).toBe('SPAN');
      expect(el.children[1].tagName).toBe('SPAN');
      expect(el.textContent).toBe('Child 1Child 2');
    });

    it('handles mixed string and element children', () => {
      const el = h.div({}, [
        'Text before',
        h.strong({}, ['bold']),
        'Text after'
      ]);

      expect(el.childNodes.length).toBe(3);
      expect(el.childNodes[0].textContent).toBe('Text before');
      expect(el.childNodes[1].tagName).toBe('STRONG');
      expect(el.childNodes[2].textContent).toBe('Text after');
    });

    it('handles nested structures', () => {
      const el = h.div({}, [
        h.ul({}, [
          h.li({}, ['Item 1']),
          h.li({}, ['Item 2']),
          h.li({}, ['Item 3'])
        ])
      ]);

      expect(el.querySelector('ul')).not.toBeNull();
      expect(el.querySelectorAll('li').length).toBe(3);
      expect(el.querySelectorAll('li')[0].textContent).toBe('Item 1');
    });

    it('filters out null, undefined, and false children', () => {
      const el = h.div({}, [
        'Hello',
        null,
        undefined,
        false,
        'World'
      ]);

      expect(el.textContent).toBe('HelloWorld');
      expect(el.childNodes.length).toBe(2);
    });
  });

  describe('SVG element creation', () => {
    it('creates SVG elements with correct namespace', () => {
      const el = h.svg({}, []);
      expect(el.tagName.toLowerCase()).toBe('svg');
      expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('creates SVG child elements with correct namespace', () => {
      const circle = h.circle({}, []);
      expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');

      const path = h.path({}, []);
      expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');

      const rect = h.rect({}, []);
      expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('creates nested SVG structures', () => {
      const svg = h.svg({ attr: { viewBox: '0 0 100 100', width: '100', height: '100' } }, [
        h.circle({ attr: { cx: '50', cy: '50', r: '40', fill: 'red' } }),
        h.rect({ attr: { x: '10', y: '10', width: '30', height: '30', fill: 'blue' } })
      ]);

      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');

      const circle = svg.querySelector('circle');
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute('cx')).toBe('50');
      expect(circle?.getAttribute('fill')).toBe('red');

      const rect = svg.querySelector('rect');
      expect(rect).not.toBeNull();
      expect(rect?.getAttribute('x')).toBe('10');
    });

    it('handles all SVG element types', () => {
      const svgElements = [
        'svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon',
        'polyline', 'ellipse', 'text', 'tspan', 'defs', 'clipPath',
        'linearGradient', 'radialGradient', 'stop', 'mask', 'pattern',
        'marker', 'symbol', 'use', 'image', 'foreignObject'
      ];

      svgElements.forEach(tag => {
        const el = (h as any)[tag]({}, []);
        expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });
    });
  });

  describe('Error handling', () => {
    it('throws error for invalid tag name starting with number', () => {
      expect(() => {
        (h as any)['123invalid']({}, []);
      }).toThrow('Invalid tag name');
    });

    it('throws error for tag name with special characters', () => {
      expect(() => {
        (h as any)['my-tag']({}, []);
      }).toThrow('Invalid tag name');
    });

    it('throws error for tag name with spaces', () => {
      expect(() => {
        (h as any)['my tag']({}, []);
      }).toThrow('Invalid tag name');
    });

    it('allows valid alphanumeric tag names', () => {
      // These should not throw
      expect(() => h.div({}, [])).not.toThrow();
      expect(() => (h as any).div2({}, [])).not.toThrow();
      expect(() => (h as any).MyCustomElement({}, [])).not.toThrow();
    });
  });

  describe('tags alias', () => {
    it('is identical to h', () => {
      expect(tags).toBe(h);
    });

    it('works the same as h', () => {
      const withH = h.div({ class: { test: true } }, ['Content']);
      const withTags = tags.div({ class: { test: true } }, ['Content']);

      expect(withH.tagName).toBe(withTags.tagName);
      expect(withH.classList.contains('test')).toBe(true);
      expect(withTags.classList.contains('test')).toBe(true);
      expect(withH.textContent).toBe(withTags.textContent);
    });
  });

  describe('Integration with other utilities', () => {
    it('works with refs() for element extraction', () => {
      const form = h.form({}, [
        h.input({ dataRef: 'name' }),
        h.input({ dataRef: 'email' }),
        h.button({ dataRef: 'submit' }, ['Submit'])
      ]);

      const formRefs = refs(form);

      expect(formRefs.name).toBeInstanceOf(HTMLInputElement);
      expect(formRefs.email).toBeInstanceOf(HTMLInputElement);
      expect(formRefs.submit).toBeInstanceOf(HTMLButtonElement);
    });

    it('elements can be modified with modify()', () => {
      const el = h.div({}, ['Initial']);
      modify(el, { class: { updated: true }, text: 'Modified' });

      expect(el.classList.contains('updated')).toBe(true);
      expect(el.textContent).toBe('Modified');
    });
  });

  describe('Complex real-world examples', () => {
    it('creates a card component', () => {
      const card = h.div({ class: { card: true, 'card-shadow': true } }, [
        h.div({ class: { 'card-header': true } }, [
          h.h2({ class: { 'card-title': true } }, ['Card Title']),
          h.button({ class: { 'card-close': true }, attr: { 'aria-label': 'Close' } }, ['×'])
        ]),
        h.div({ class: { 'card-body': true } }, [
          h.p({}, ['This is the card content.']),
          h.p({}, ['It can contain multiple paragraphs.'])
        ]),
        h.div({ class: { 'card-footer': true } }, [
          h.button({ class: { btn: true, 'btn-primary': true } }, ['Save']),
          h.button({ class: { btn: true, 'btn-secondary': true } }, ['Cancel'])
        ])
      ]);

      expect(card.classList.contains('card')).toBe(true);
      expect(card.querySelector('.card-header')).not.toBeNull();
      expect(card.querySelector('.card-title')?.textContent).toBe('Card Title');
      expect(card.querySelectorAll('.btn').length).toBe(2);
    });

    it('creates a form with inputs', () => {
      const form = h.form({ attr: { method: 'post', action: '/submit' } }, [
        h.div({ class: { 'form-group': true } }, [
          h.label({ attr: { for: 'name' } }, ['Name:']),
          h.input({
            dataRef: 'nameInput',
            attr: { type: 'text', id: 'name', placeholder: 'Enter your name' }
          })
        ]),
        h.div({ class: { 'form-group': true } }, [
          h.label({ attr: { for: 'email' } }, ['Email:']),
          h.input({
            dataRef: 'emailInput',
            attr: { type: 'email', id: 'email', placeholder: 'Enter your email' }
          })
        ]),
        h.button({
          dataRef: 'submitBtn',
          attr: { type: 'submit' },
          class: { btn: true, 'btn-primary': true }
        }, ['Submit'])
      ]);

      expect(form.tagName).toBe('FORM');
      expect(form.getAttribute('method')).toBe('post');
      expect(form.querySelectorAll('input').length).toBe(2);
      expect(form.querySelector('[data-ref="nameInput"]')).not.toBeNull();
    });

    it('creates an SVG icon', () => {
      const icon = h.svg({
        attr: { viewBox: '0 0 24 24', width: '24', height: '24' },
        class: { icon: true, 'icon-home': true }
      }, [
        h.path({
          attr: {
            d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            fill: 'currentColor'
          }
        })
      ]);

      expect(icon.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(icon.classList.contains('icon')).toBe(true);

      const path = icon.querySelector('path');
      expect(path).not.toBeNull();
      expect(path?.getAttribute('fill')).toBe('currentColor');
    });
  });
});
