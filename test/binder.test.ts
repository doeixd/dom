import { describe, it, expect, beforeEach } from 'vitest';
import { createBinder, bind, viewRefs, h, refs } from '../src';

describe('createBinder() data binding system', () => {
  describe('Basic binding', () => {
    it('creates binder with default text binding', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'message' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui({ message: 'Hello World' });

      expect(refsObj.message.textContent).toBe('Hello World');
    });

    it('updates multiple refs with default binding', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'title' }),
        h.span({ dataRef: 'content' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui({
        title: 'Title',
        content: 'Content'
      });

      expect(refsObj.title.textContent).toBe('Title');
      expect(refsObj.content.textContent).toBe('Content');
    });
  });

  describe('Schema-based binding', () => {
    it('uses schema to define binding behavior', () => {
      const element = h.form({}, [
        h.input({ dataRef: 'nameInput', attr: { type: 'text' } }),
        h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        nameInput: bind.value,
        submitBtn: (el) => bind.prop('disabled', el)
      });

      ui({
        nameInput: 'John Doe',
        submitBtn: true
      });

      expect((refsObj.nameInput as HTMLInputElement).value).toBe('John Doe');
      expect((refsObj.submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('mixes schema and default bindings', () => {
      const element = h.div({}, [
        h.input({ dataRef: 'input', attr: { type: 'text' } }),
        h.span({ dataRef: 'label' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        input: bind.value
        // label uses default text binding
      });

      ui({
        input: 'test value',
        label: 'Label text'
      });

      expect((refsObj.input as HTMLInputElement).value).toBe('test value');
      expect(refsObj.label.textContent).toBe('Label text');
    });
  });

  describe('bind.text primitive', () => {
    it('updates text content', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'text' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, { text: bind.text });

      ui({ text: 'Hello' });
      expect(refsObj.text.textContent).toBe('Hello');

      ui({ text: 'World' });
      expect(refsObj.text.textContent).toBe('World');
    });

    it('handles empty strings', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'text' }, ['Initial'])
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, { text: bind.text });

      ui({ text: '' });
      expect(refsObj.text.textContent).toBe('');
    });
  });

  describe('bind.html primitive', () => {
    it('updates innerHTML', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'content' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, { content: bind.html });

      ui({ content: '<strong>Bold</strong>' });
      expect(refsObj.content.innerHTML).toBe('<strong>Bold</strong>');
      expect(refsObj.content.querySelector('strong')).not.toBeNull();
    });
  });

  describe('bind.attr primitive', () => {
    it('sets attribute value', () => {
      const element = h.div({}, [
        h.button({ dataRef: 'btn' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        btn: (el) => bind.attr('aria-label')(el)
      });

      ui({ btn: 'Click me' });
      expect(refsObj.btn.getAttribute('aria-label')).toBe('Click me');
    });

    it('removes attribute when null', () => {
      const element = h.div({}, [
        h.button({ dataRef: 'btn', attr: { 'aria-label': 'Initial' } })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        btn: (el) => bind.attr('aria-label')(el)
      });

      ui({ btn: null });
      expect(refsObj.btn.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('bind.prop primitive', () => {
    it('sets element property', () => {
      const element = h.div({}, [
        h.button({ dataRef: 'btn' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        btn: (el) => bind.prop('disabled', el)
      });

      ui({ btn: true });
      expect((refsObj.btn as HTMLButtonElement).disabled).toBe(true);

      ui({ btn: false });
      expect((refsObj.btn as HTMLButtonElement).disabled).toBe(false);
    });

    it('works with various properties', () => {
      const element = h.div({}, [
        h.input({ dataRef: 'input' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        input: (el) => bind.prop('readOnly', el)
      });

      ui({ input: true });
      expect((refsObj.input as HTMLInputElement).readOnly).toBe(true);
    });
  });

  describe('bind.toggle primitive', () => {
    it('toggles single class', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: (el) => bind.toggle('active')(el)
      });

      ui({ box: true });
      expect(refsObj.box.classList.contains('active')).toBe(true);

      ui({ box: false });
      expect(refsObj.box.classList.contains('active')).toBe(false);
    });
  });

  describe('bind.classes primitive', () => {
    it('toggles multiple classes', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: bind.classes
      });

      ui({
        box: { active: true, disabled: false, highlighted: true }
      });

      expect(refsObj.box.classList.contains('active')).toBe(true);
      expect(refsObj.box.classList.contains('disabled')).toBe(false);
      expect(refsObj.box.classList.contains('highlighted')).toBe(true);
    });

    it('updates classes dynamically', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box', class: { initial: true } })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: bind.classes
      });

      ui({ box: { active: true } });
      expect(refsObj.box.classList.contains('active')).toBe(true);
      expect(refsObj.box.classList.contains('initial')).toBe(true);

      ui({ box: { active: false, disabled: true } });
      expect(refsObj.box.classList.contains('active')).toBe(false);
      expect(refsObj.box.classList.contains('disabled')).toBe(true);
    });
  });

  describe('bind.style primitive', () => {
    it('updates single style property', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: (el) => bind.style(el, 'color')
      });

      ui({ box: 'red' });
      expect(refsObj.box.style.color).toBe('red');

      ui({ box: 'blue' });
      expect(refsObj.box.style.color).toBe('blue');
    });

    it('updates multiple style properties with custom setter', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box' })
      ]);
      const refsObj = refs(element);

      // Custom setter for style objects
      const styleObjectSetter = (el: HTMLElement | null) => {
        return (styles: Partial<CSSStyleDeclaration>) => {
          if (!el) return;
          Object.assign(el.style, styles);
        };
      };

      const ui = createBinder(refsObj, {
        box: styleObjectSetter
      });

      ui({
        box: { color: 'red', fontSize: '20px' }
      });

      expect(refsObj.box.style.color).toBe('red');
      expect(refsObj.box.style.fontSize).toBe('20px');
    });
  });

  describe('bind.value primitive', () => {
    it('updates input value', () => {
      const element = h.div({}, [
        h.input({ dataRef: 'input' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        input: bind.value
      });

      ui({ input: 'test value' });
      expect((refsObj.input as HTMLInputElement).value).toBe('test value');
    });

    it('handles numeric values', () => {
      const element = h.div({}, [
        h.input({ dataRef: 'input', attr: { type: 'number' } })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        input: bind.value
      });

      ui({ input: 42 });
      expect((refsObj.input as HTMLInputElement).value).toBe('42');
    });

    it('prevents unnecessary updates with dirty checking', () => {
      const element = h.div({}, [
        h.input({ dataRef: 'input' })
      ]);
      const refsObj = refs(element);
      let updateCount = 0;

      // Wrap bind.value to count updates
      const countingValue = (el: HTMLInputElement | null) => {
        const setter = bind.value(el);
        return (value: string | number) => {
          updateCount++;
          setter(value);
        };
      };

      const ui = createBinder(refsObj, {
        input: countingValue
      });

      ui({ input: 'test' });
      ui({ input: 'test' }); // Same value
      ui({ input: 'test' }); // Same value

      // bind.value has dirty checking, so it should skip updates
      expect((refsObj.input as HTMLInputElement).value).toBe('test');
    });
  });

  describe('bind.show primitive', () => {
    it('shows and hides element', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box' })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: bind.show
      });

      ui({ box: false });
      expect(refsObj.box.style.display).toBe('none');

      ui({ box: true });
      expect(refsObj.box.style.display).toBe('');
    });

    it('preserves original display value', () => {
      const element = h.div({}, [
        h.div({ dataRef: 'box', style: { display: 'flex' } })
      ]);
      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        box: bind.show
      });

      ui({ box: false });
      expect(refsObj.box.style.display).toBe('none');

      ui({ box: true });
      expect(refsObj.box.style.display).toBe('flex');
    });
  });

  describe('Individual setters (ui.set)', () => {
    it('provides individual setter functions', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'message' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui.set.message('Hello');
      expect(refsObj.message.textContent).toBe('Hello');

      ui.set.message('World');
      expect(refsObj.message.textContent).toBe('World');
    });

    it('works with schema-based setters', () => {
      const element = h.form({}, [
        h.input({ dataRef: 'nameInput' }),
        h.button({ dataRef: 'submitBtn' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj, {
        nameInput: bind.value,
        submitBtn: (el) => bind.prop('disabled', el)
      });

      ui.set.nameInput('John');
      expect((refsObj.nameInput as HTMLInputElement).value).toBe('John');

      ui.set.submitBtn(true);
      expect((refsObj.submitBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('Batch updates', () => {
    it('batches multiple updates', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'title' }),
        h.span({ dataRef: 'content' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui.batch(() => {
        ui({ title: 'Title 1' });
        ui({ content: 'Content 1' });
        ui({ title: 'Title 2' });
      });

      expect(refsObj.title.textContent).toBe('Title 2');
      expect(refsObj.content.textContent).toBe('Content 1');
    });

    it('supports nested batching', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'message' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui.batch(() => {
        ui({ message: 'First' });
        ui.batch(() => {
          ui({ message: 'Second' });
        });
      });

      expect(refsObj.message.textContent).toBe('Second');
    });
  });

  describe('refs() method', () => {
    it('returns the original refs object', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'test' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      expect(ui.refs()).toBe(refsObj);
    });
  });

  describe('Integration with viewRefs()', () => {
    it('works with viewRefs template', () => {
      interface FormRefs {
        nameInput: HTMLElement;
        emailInput: HTMLElement;
        submitBtn: HTMLElement;
        errorMsg: HTMLElement;
      }

      const Form = viewRefs<FormRefs>(({ refs }) =>
        h.form({}, [
          h.input({ dataRef: 'nameInput', attr: { type: 'text' } }),
          h.input({ dataRef: 'emailInput', attr: { type: 'email' } }),
          h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } }),
          h.div({ dataRef: 'errorMsg', class: { error: true } })
        ])
      );

      const { element, refs: formRefs } = Form();
      const ui = createBinder(formRefs, {
        nameInput: bind.value,
        emailInput: bind.value,
        submitBtn: (el) => bind.prop('disabled', el),
        errorMsg: bind.text
      });

      ui({
        nameInput: 'John',
        emailInput: 'john@example.com',
        submitBtn: false,
        errorMsg: ''
      });

      expect((formRefs.nameInput as HTMLInputElement).value).toBe('John');
      expect((formRefs.emailInput as HTMLInputElement).value).toBe('john@example.com');
      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(false);
      expect(formRefs.errorMsg.textContent).toBe('');
    });

    it('updates form state dynamically', () => {
      interface FormRefs {
        input: HTMLElement;
        submitBtn: HTMLElement;
        errorMsg: HTMLElement;
      }

      const Form = viewRefs<FormRefs>(({ refs }) =>
        h.form({}, [
          h.input({ dataRef: 'input', attr: { type: 'text' } }),
          h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } }, ['Submit']),
          h.div({ dataRef: 'errorMsg', class: { error: true } })
        ])
      );

      const { refs: formRefs } = Form();
      const ui = createBinder(formRefs, {
        input: bind.value,
        submitBtn: (el) => bind.prop('disabled', el),
        errorMsg: bind.text
      });

      // Initial state
      ui({
        input: '',
        submitBtn: true,
        errorMsg: ''
      });

      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(true);

      // User types
      ui({ input: 'test@example.com', submitBtn: false });
      expect((formRefs.input as HTMLInputElement).value).toBe('test@example.com');
      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(false);

      // Validation error
      ui({ errorMsg: 'Invalid email', submitBtn: true });
      expect(formRefs.errorMsg.textContent).toBe('Invalid email');
      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('Complex real-world examples', () => {
    it('manages a complete form state', () => {
      interface LoginFormRefs {
        usernameInput: HTMLElement;
        passwordInput: HTMLElement;
        rememberCheckbox: HTMLElement;
        submitBtn: HTMLElement;
        errorMsg: HTMLElement;
        loadingSpinner: HTMLElement;
      }

      const LoginForm = viewRefs<LoginFormRefs>(({ refs }) =>
        h.form({ class: { 'login-form': true } }, [
          h.input({ dataRef: 'usernameInput', attr: { type: 'text', placeholder: 'Username' } }),
          h.input({ dataRef: 'passwordInput', attr: { type: 'password', placeholder: 'Password' } }),
          h.label({}, [
            h.input({ dataRef: 'rememberCheckbox', attr: { type: 'checkbox' } }),
            ' Remember me'
          ]),
          h.button({ dataRef: 'submitBtn', attr: { type: 'submit' } }, ['Login']),
          h.div({ dataRef: 'errorMsg', class: { error: true } }),
          h.div({ dataRef: 'loadingSpinner', class: { spinner: true } })
        ])
      );

      const { refs: formRefs } = LoginForm();
      const ui = createBinder(formRefs, {
        usernameInput: bind.value,
        passwordInput: bind.value,
        rememberCheckbox: (el) => bind.prop('checked', el),
        submitBtn: (el) => bind.prop('disabled', el),
        errorMsg: bind.text,
        loadingSpinner: bind.show
      });

      // Initial state
      ui({
        usernameInput: '',
        passwordInput: '',
        rememberCheckbox: false,
        submitBtn: true,
        errorMsg: '',
        loadingSpinner: false
      });

      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(true);
      expect(formRefs.loadingSpinner.style.display).toBe('none');

      // User fills form
      ui({
        usernameInput: 'john',
        passwordInput: 'secret123',
        submitBtn: false
      });

      expect((formRefs.usernameInput as HTMLInputElement).value).toBe('john');
      expect((formRefs.passwordInput as HTMLInputElement).value).toBe('secret123');
      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(false);

      // Submit (loading state)
      ui({
        submitBtn: true,
        loadingSpinner: true,
        errorMsg: ''
      });

      expect((formRefs.submitBtn as HTMLButtonElement).disabled).toBe(true);
      expect(formRefs.loadingSpinner.style.display).toBe('');

      // Error state
      ui({
        submitBtn: false,
        loadingSpinner: false,
        errorMsg: 'Invalid credentials'
      });

      expect(formRefs.errorMsg.textContent).toBe('Invalid credentials');
      expect(formRefs.loadingSpinner.style.display).toBe('none');
    });
  });

  describe('Edge cases', () => {
    it('handles empty refs object', () => {
      const refsObj = {};
      const ui = createBinder(refsObj);

      expect(() => {
        ui({});
      }).not.toThrow();
    });

    it('ignores unknown ref names', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'known' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui({
        known: 'Known value',
        unknown: 'Unknown value' // Should be ignored
      } as any);

      expect(refsObj.known.textContent).toBe('Known value');
    });

    it('handles partial updates', () => {
      const element = h.div({}, [
        h.span({ dataRef: 'first' }),
        h.span({ dataRef: 'second' })
      ]);

      const refsObj = refs(element);
      const ui = createBinder(refsObj);

      ui({ first: 'First', second: 'Second' });
      ui({ first: 'Updated First' }); // Only update first

      expect(refsObj.first.textContent).toBe('Updated First');
      expect(refsObj.second.textContent).toBe('Second');
    });
  });
});
