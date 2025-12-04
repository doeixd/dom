import { describe, it, expect, beforeEach } from 'vitest';
import { viewRefs, h, List } from '../src';

describe('viewRefs() typed template factory', () => {
  describe('Basic template creation', () => {
    it('creates element from template factory', () => {
      const Template = viewRefs<{ title: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.h2({ dataRef: 'title' }, ['Hello'])
        ])
      );

      const { element } = Template();

      expect(element.tagName).toBe('DIV');
      expect(element.querySelector('h2')).not.toBeNull();
    });

    it('extracts refs correctly', () => {
      const Template = viewRefs<{ title: HTMLElement; content: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.h2({ dataRef: 'title' }, ['Title']),
          h.p({ dataRef: 'content' }, ['Content'])
        ])
      );

      const { refs } = Template();

      expect(refs.title).toBeInstanceOf(HTMLElement);
      expect(refs.title.tagName).toBe('H2');
      expect(refs.content).toBeInstanceOf(HTMLElement);
      expect(refs.content.tagName).toBe('P');
    });

    it('provides refs in template context', () => {
      let contextRefs: any = null;

      const Template = viewRefs<{ test: HTMLElement }>(({ refs }) => {
        contextRefs = refs;
        return h.div({}, [
          h.span({ dataRef: 'test' }, ['Test'])
        ]);
      });

      const { refs } = Template();

      expect(contextRefs).toBe(refs);
      expect(contextRefs.test).toBe(refs.test);
    });
  });

  describe('Options handling', () => {
    it('applies className option', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element } = Template({ className: 'card' });

      expect(element.classList.contains('card')).toBe(true);
    });

    it('applies multiple classNames', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element } = Template({ className: ['card', 'active'] });

      expect(element.classList.contains('card')).toBe(true);
      expect(element.classList.contains('active')).toBe(true);
    });

    it('applies id option', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element } = Template({ id: 'my-component' });

      expect(element.id).toBe('my-component');
    });

    it('applies props option', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element } = Template({
        props: {
          class: { highlighted: true },
          style: { color: 'red' }
        }
      });

      expect(element.classList.contains('highlighted')).toBe(true);
      expect(element.style.color).toBe('red');
    });

    it('applies multiple options together', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element } = Template({
        className: 'card',
        id: 'main-card',
        props: {
          class: { shadow: true },
          attr: { 'data-test': 'value' }
        }
      });

      expect(element.classList.contains('card')).toBe(true);
      expect(element.classList.contains('shadow')).toBe(true);
      expect(element.id).toBe('main-card');
      expect(element.getAttribute('data-test')).toBe('value');
    });
  });

  describe('update() method', () => {
    it('updates element props', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element, update } = Template();

      update({ class: { active: true } });

      expect(element.classList.contains('active')).toBe(true);
    });

    it('updates multiple times', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element, update } = Template();

      update({ class: { active: true } });
      expect(element.classList.contains('active')).toBe(true);

      update({ class: { disabled: true } });
      expect(element.classList.contains('disabled')).toBe(true);
      expect(element.classList.contains('active')).toBe(true);
    });

    it('updates style and attributes', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element, update } = Template();

      update({
        style: { fontSize: '20px' },
        attr: { 'aria-label': 'Updated' }
      });

      expect(element.style.fontSize).toBe('20px');
      expect(element.getAttribute('aria-label')).toBe('Updated');
    });
  });

  describe('updateRefs() method', () => {
    it('updates refs with string values', () => {
      const Template = viewRefs<{ title: HTMLElement; content: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.h2({ dataRef: 'title' }),
          h.p({ dataRef: 'content' })
        ])
      );

      const { refs, updateRefs } = Template();

      updateRefs({
        title: 'New Title',
        content: 'New Content'
      });

      expect(refs.title.textContent).toBe('New Title');
      expect(refs.content.textContent).toBe('New Content');
    });

    it('updates refs with number values', () => {
      const Template = viewRefs<{ count: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'count' })
        ])
      );

      const { refs, updateRefs } = Template();

      updateRefs({ count: 42 });

      expect(refs.count.textContent).toBe('42');
    });

    it('updates refs with ElementProps objects', () => {
      const Template = viewRefs<{ box: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.div({ dataRef: 'box' })
        ])
      );

      const { refs, updateRefs } = Template();

      updateRefs({
        box: {
          text: 'Updated',
          class: { active: true },
          style: { color: 'red' }
        }
      });

      expect(refs.box.textContent).toBe('Updated');
      expect(refs.box.classList.contains('active')).toBe(true);
      expect(refs.box.style.color).toBe('red');
    });

    it('handles partial updates', () => {
      const Template = viewRefs<{ title: HTMLElement; content: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.h2({ dataRef: 'title' }, ['Initial Title']),
          h.p({ dataRef: 'content' }, ['Initial Content'])
        ])
      );

      const { refs, updateRefs } = Template();

      updateRefs({ title: 'Updated Title' });

      expect(refs.title.textContent).toBe('Updated Title');
      expect(refs.content.textContent).toBe('Initial Content');
    });

    it('ignores null and undefined values', () => {
      const Template = viewRefs<{ title: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.h2({ dataRef: 'title' }, ['Initial'])
        ])
      );

      const { refs, updateRefs } = Template();

      updateRefs({ title: null });
      expect(refs.title.textContent).toBe('Initial');

      updateRefs({ title: undefined });
      expect(refs.title.textContent).toBe('Initial');
    });
  });

  describe('bind() method', () => {
    it('returns a setter function for a ref', () => {
      const Template = viewRefs<{ message: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'message' })
        ])
      );

      const { refs, bind } = Template();
      const setMessage = bind('message');

      setMessage('Hello');
      expect(refs.message.textContent).toBe('Hello');

      setMessage('World');
      expect(refs.message.textContent).toBe('World');
    });

    it('works with ElementProps objects', () => {
      const Template = viewRefs<{ box: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.div({ dataRef: 'box' })
        ])
      );

      const { refs, bind } = Template();
      const setBox = bind('box');

      setBox({
        text: 'Active Box',
        class: { active: true }
      });

      expect(refs.box.textContent).toBe('Active Box');
      expect(refs.box.classList.contains('active')).toBe(true);
    });

    it('can be used as a callback', () => {
      const Template = viewRefs<{ status: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'status' })
        ])
      );

      const { refs, bind } = Template();
      const statuses = ['Loading', 'Ready', 'Complete'];

      statuses.forEach(bind('status'));

      expect(refs.status.textContent).toBe('Complete');
    });

    it('handles multiple refs independently', () => {
      const Template = viewRefs<{ first: HTMLElement; second: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'first' }),
          h.span({ dataRef: 'second' })
        ])
      );

      const { refs, bind } = Template();
      const setFirst = bind('first');
      const setSecond = bind('second');

      setFirst('First Value');
      setSecond('Second Value');

      expect(refs.first.textContent).toBe('First Value');
      expect(refs.second.textContent).toBe('Second Value');
    });
  });

  describe('destroy() method', () => {
    it('removes element from DOM', () => {
      const container = document.createElement('div');
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { element, destroy } = Template();
      container.appendChild(element);

      expect(container.children.length).toBe(1);

      destroy();

      expect(container.children.length).toBe(0);
    });

    it('can be called multiple times safely', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['Content'])
      );

      const { destroy } = Template();

      expect(() => {
        destroy();
        destroy();
        destroy();
      }).not.toThrow();
    });
  });

  describe('Multiple instances', () => {
    it('creates independent instances', () => {
      const Template = viewRefs<{ label: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'label' }, ['Initial'])
        ])
      );

      const instance1 = Template();
      const instance2 = Template();

      expect(instance1.element).not.toBe(instance2.element);
      expect(instance1.refs.label).not.toBe(instance2.refs.label);
    });

    it('allows independent updates', () => {
      const Template = viewRefs<{ label: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'label' }, ['Initial'])
        ])
      );

      const instance1 = Template();
      const instance2 = Template();

      instance1.refs.label.textContent = 'Instance 1';
      instance2.refs.label.textContent = 'Instance 2';

      expect(instance1.refs.label.textContent).toBe('Instance 1');
      expect(instance2.refs.label.textContent).toBe('Instance 2');
    });
  });

  describe('Integration with h()', () => {
    it('works with h() created elements', () => {
      const Template = viewRefs<{ title: HTMLElement; icon: HTMLElement }>(({ refs }) =>
        h.div({ class: { card: true } }, [
          h.div({ class: { 'card-header': true } }, [
            h.span({ dataRef: 'icon', class: { icon: true } }),
            h.h3({ dataRef: 'title' }, ['Title'])
          ])
        ])
      );

      const { element, refs } = Template();

      expect(element.classList.contains('card')).toBe(true);
      expect(refs.title.tagName).toBe('H3');
      expect(refs.icon.classList.contains('icon')).toBe(true);
    });

    it('works with nested structures', () => {
      const Template = viewRefs<{ input: HTMLElement; button: HTMLElement }>(({ refs }) =>
        h.form({}, [
          h.div({ class: { 'form-group': true } }, [
            h.input({ dataRef: 'input', attr: { type: 'text' } })
          ]),
          h.button({ dataRef: 'button', attr: { type: 'submit' } }, ['Submit'])
        ])
      );

      const { element, refs } = Template();

      expect(element.tagName).toBe('FORM');
      expect(refs.input.tagName).toBe('INPUT');
      expect(refs.button.tagName).toBe('BUTTON');
    });
  });

  describe('Integration with List()', () => {
    it('can be used as List render function', () => {
      const container = document.createElement('div');

      const ItemTemplate = viewRefs<{ label: HTMLElement }>(({ refs }) =>
        h.li({ class: { item: true } }, [
          h.span({ dataRef: 'label' })
        ])
      );

      const list = List<string>(container, {
        render: (item) => {
          const { element, refs } = ItemTemplate();
          refs.label.textContent = item;
          return element;
        }
      });

      list.set(['Item 1', 'Item 2', 'Item 3']);

      expect(container.children.length).toBe(3);
      expect(container.querySelectorAll('.item').length).toBe(3);
      expect(container.children[0].textContent).toBe('Item 1');
    });

    it('works with keyed List mode', () => {
      const container = document.createElement('div');

      interface Item {
        id: number;
        name: string;
      }

      const ItemTemplate = viewRefs<{ name: HTMLElement }>(({ refs }) =>
        h.li({}, [
          h.span({ dataRef: 'name' })
        ])
      );

      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => {
          const { element, refs } = ItemTemplate();
          refs.name.textContent = item.name;
          return element;
        },
        update: (el, item) => {
          const nameEl = el.querySelector('[data-ref="name"]') as HTMLElement;
          if (nameEl) nameEl.textContent = item.name;
        }
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      expect(container.children.length).toBe(2);

      list.set([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob' }
      ]);

      expect(container.children[0].textContent).toBe('Alice Updated');
    });
  });

  describe('Complex real-world examples', () => {
    it('creates a card component with multiple refs', () => {
      interface CardRefs {
        title: HTMLElement;
        content: HTMLElement;
        closeBtn: HTMLElement;
        footer: HTMLElement;
      }

      const Card = viewRefs<CardRefs>(({ refs }) =>
        h.div({ class: { card: true } }, [
          h.div({ class: { 'card-header': true } }, [
            h.h2({ dataRef: 'title', class: { 'card-title': true } }),
            h.button({ dataRef: 'closeBtn', class: { 'card-close': true } }, ['×'])
          ]),
          h.div({ dataRef: 'content', class: { 'card-body': true } }),
          h.div({ dataRef: 'footer', class: { 'card-footer': true } })
        ])
      );

      const { element, refs, update } = Card({ className: 'shadow' });

      refs.title.textContent = 'My Card';
      refs.content.textContent = 'Card content here';
      refs.footer.appendChild(h.button({}, ['Save']));

      expect(element.classList.contains('card')).toBe(true);
      expect(element.classList.contains('shadow')).toBe(true);
      expect(refs.title.textContent).toBe('My Card');
      expect(refs.content.textContent).toBe('Card content here');
      expect(refs.footer.children.length).toBe(1);

      update({ class: { active: true } });
      expect(element.classList.contains('active')).toBe(true);
    });

    it('creates a form component', () => {
      interface FormRefs {
        nameInput: HTMLElement;
        emailInput: HTMLElement;
        submitBtn: HTMLElement;
        errorMsg: HTMLElement;
      }

      const LoginForm = viewRefs<FormRefs>(({ refs }) =>
        h.form({ class: { 'login-form': true } }, [
          h.div({ class: { 'form-group': true } }, [
            h.label({}, ['Name:']),
            h.input({ dataRef: 'nameInput', attr: { type: 'text' } })
          ]),
          h.div({ class: { 'form-group': true } }, [
            h.label({}, ['Email:']),
            h.input({ dataRef: 'emailInput', attr: { type: 'email' } })
          ]),
          h.div({ dataRef: 'errorMsg', class: { error: true } }),
          h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } }, ['Login'])
        ])
      );

      const { element, refs } = LoginForm({ id: 'main-form' });

      expect(element.tagName).toBe('FORM');
      expect(element.id).toBe('main-form');
      expect(refs.nameInput.tagName).toBe('INPUT');
      expect(refs.emailInput.tagName).toBe('INPUT');
      expect(refs.submitBtn.tagName).toBe('BUTTON');
      expect(refs.errorMsg).toBeInstanceOf(HTMLElement);
    });

    it('creates reusable list item template', () => {
      interface TodoRefs {
        checkbox: HTMLElement;
        label: HTMLElement;
        deleteBtn: HTMLElement;
      }

      const TodoItem = viewRefs<TodoRefs>(({ refs }) =>
        h.li({ class: { 'todo-item': true } }, [
          h.input({ dataRef: 'checkbox', attr: { type: 'checkbox' } }),
          h.span({ dataRef: 'label' }),
          h.button({ dataRef: 'deleteBtn' }, ['Delete'])
        ])
      );

      const container = document.createElement('ul');

      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const list = List<Todo>(container, {
        key: todo => todo.id,
        render: (todo) => {
          const { element, refs } = TodoItem();
          refs.label.textContent = todo.text;
          (refs.checkbox as HTMLInputElement).checked = todo.completed;
          return element;
        }
      });

      list.set([
        { id: 1, text: 'Buy groceries', completed: false },
        { id: 2, text: 'Walk dog', completed: true }
      ]);

      expect(container.children.length).toBe(2);
      expect(container.querySelectorAll('.todo-item').length).toBe(2);
      expect((container.querySelector('[data-ref="checkbox"]') as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty refs', () => {
      const Template = viewRefs<{}>(({ refs }) =>
        h.div({}, ['No refs here'])
      );

      const { element, refs } = Template();

      expect(element.tagName).toBe('DIV');
      expect(Object.keys(refs).length).toBe(0);
    });

    it('handles single ref', () => {
      const Template = viewRefs<{ single: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.span({ dataRef: 'single' })
        ])
      );

      const { refs } = Template();

      expect(Object.keys(refs).length).toBe(1);
      expect(refs.single).toBeInstanceOf(HTMLElement);
    });

    it('handles deeply nested refs', () => {
      const Template = viewRefs<{ deep: HTMLElement }>(({ refs }) =>
        h.div({}, [
          h.div({}, [
            h.div({}, [
              h.div({}, [
                h.span({ dataRef: 'deep' })
              ])
            ])
          ])
        ])
      );

      const { refs } = Template();

      expect(refs.deep).toBeInstanceOf(HTMLElement);
      expect(refs.deep.tagName).toBe('SPAN');
    });
  });
});
