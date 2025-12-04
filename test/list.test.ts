import { describe, it, expect, beforeEach } from 'vitest';
import { List, h } from '../src';

describe('List() reactive array binding', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('Default mode (blow-away rendering)', () => {
    it('renders initial items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['Item 1', 'Item 2', 'Item 3']);

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe('Item 1');
      expect(container.children[1].textContent).toBe('Item 2');
      expect(container.children[2].textContent).toBe('Item 3');
    });

    it('replaces all items on set()', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B']);
      expect(container.children.length).toBe(2);

      list.set(['X', 'Y', 'Z']);
      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe('X');
    });

    it('appends items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A']);
      list.append(['B', 'C']);

      expect(container.children.length).toBe(3);
      expect(container.children[2].textContent).toBe('C');
    });

    it('prepends items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['B']);
      list.prepend(['A']);

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe('A');
    });

    it('inserts items at index', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'C']);
      list.insert(1, ['B']);

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe('A');
      expect(container.children[1].textContent).toBe('B');
      expect(container.children[2].textContent).toBe('C');
    });

    it('removes items matching predicate', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B', 'C']);
      list.remove(item => item === 'B');

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe('A');
      expect(container.children[1].textContent).toBe('C');
    });

    it('updates items matching predicate', () => {
      const list = List<{ id: number; name: string }>(container, {
        render: (item) => h.li({}, [item.name])
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      list.update(item => item.id === 1, item => ({ ...item, name: 'Alice Updated' }));

      expect(container.children[0].textContent).toBe('Alice Updated');
      expect(container.children[1].textContent).toBe('Bob');
    });

    it('clears all items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B', 'C']);
      list.clear();

      expect(container.children.length).toBe(0);
    });

    it('returns current items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B']);
      const items = list.items();

      expect(items).toEqual(['A', 'B']);
    });

    it('returns current elements', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B']);
      const elements = list.elements();

      expect(elements.length).toBe(2);
      expect(elements[0].tagName).toBe('LI');
    });
  });

  describe('Keyed mode (efficient diffing)', () => {
    interface Item {
      id: number;
      name: string;
    }

    it('creates elements with keys', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name])
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe('Alice');
    });

    it('reuses existing elements when keys match', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => {
          const el = h.li({}, [item.name]);
          (el as any).created = true;
          return el;
        }
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      const firstEl = container.children[0];
      expect((firstEl as any).created).toBe(true);

      // Update with same keys
      list.set([
        { id: 1, name: 'Alice Updated' },
        { id: 2, name: 'Bob Updated' }
      ]);

      // Should be same element reference
      expect(container.children[0]).toBe(firstEl);
    });

    it('calls update function for existing elements', () => {
      let updateCount = 0;

      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name]),
        update: (el, item) => {
          updateCount++;
          el.textContent = item.name;
        }
      });

      list.set([{ id: 1, name: 'Alice' }]);
      expect(updateCount).toBe(0); // No update on first render

      list.set([{ id: 1, name: 'Alice Updated' }]);
      expect(updateCount).toBe(1); // Update called for existing element
      expect(container.children[0].textContent).toBe('Alice Updated');
    });

    it('removes elements when keys disappear', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name])
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ]);

      list.set([
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' }
      ]);

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe('Alice');
      expect(container.children[1].textContent).toBe('Charlie');
    });

    it('adds new elements for new keys', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name])
      });

      list.set([{ id: 1, name: 'Alice' }]);
      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      expect(container.children.length).toBe(2);
      expect(container.children[1].textContent).toBe('Bob');
    });

    it('reorders elements correctly', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name])
      });

      list.set([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
      ]);

      const firstEl = container.children[0];
      const secondEl = container.children[1];
      const thirdEl = container.children[2];

      // Reverse order
      list.set([
        { id: 3, name: 'C' },
        { id: 2, name: 'B' },
        { id: 1, name: 'A' }
      ]);

      expect(container.children[0]).toBe(thirdEl);
      expect(container.children[1]).toBe(secondEl);
      expect(container.children[2]).toBe(firstEl);
    });

    it('calls onAdd for new elements', () => {
      const addedElements: HTMLElement[] = [];

      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name]),
        onAdd: (el) => addedElements.push(el)
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      expect(addedElements.length).toBe(2);
    });

    it('calls onRemove for deleted elements', () => {
      const removedElements: HTMLElement[] = [];

      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name]),
        onRemove: (el) => removedElements.push(el)
      });

      list.set([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      list.set([{ id: 1, name: 'Alice' }]);

      expect(removedElements.length).toBe(1);
    });

    it('handles complex updates with add, remove, and reorder', () => {
      const list = List<Item>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [item.name])
      });

      list.set([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
      ]);

      list.set([
        { id: 3, name: 'C' },
        { id: 4, name: 'D' },
        { id: 1, name: 'A' }
      ]);

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe('C');
      expect(container.children[1].textContent).toBe('D');
      expect(container.children[2].textContent).toBe('A');
    });
  });

  describe('Custom reconciliation mode', () => {
    it('calls custom reconcile function', () => {
      let reconcileCalls = 0;

      const list = List<string>(container, {
        render: (item) => h.li({}, [item]),
        reconcile: (oldItems, newItems, container, renderFn) => {
          reconcileCalls++;
          container.replaceChildren(...newItems.map((item, i) => renderFn(item, i)));
        }
      });

      list.set(['A', 'B']);
      expect(reconcileCalls).toBe(1);

      list.set(['C', 'D']);
      expect(reconcileCalls).toBe(2);
    });

    it('passes correct arguments to reconcile', () => {
      let lastOldItems: string[] = [];
      let lastNewItems: string[] = [];

      const list = List<string>(container, {
        render: (item) => h.li({}, [item]),
        reconcile: (oldItems, newItems, container, renderFn) => {
          lastOldItems = oldItems;
          lastNewItems = newItems;
          container.replaceChildren(...newItems.map((item, i) => renderFn(item, i)));
        }
      });

      list.set(['A', 'B']);
      expect(lastOldItems).toEqual([]);
      expect(lastNewItems).toEqual(['A', 'B']);

      list.set(['C', 'D']);
      expect(lastOldItems).toEqual(['A', 'B']);
      expect(lastNewItems).toEqual(['C', 'D']);
    });
  });

  describe('Null container handling', () => {
    it('creates no-op list for null container', () => {
      const list = List<string>(null, {
        render: (item) => h.li({}, [item])
      });

      // Should not throw
      list.set(['A', 'B']);
      list.append(['C']);
      list.clear();

      expect(list.items()).toEqual([]);
      expect(list.elements()).toEqual([]);
    });
  });

  describe('Integration with h()', () => {
    it('works with h() elements', () => {
      const list = List<{ text: string; active: boolean }>(container, {
        key: item => item.text,
        render: (item) => h.li({
          class: { active: item.active }
        }, [item.text])
      });

      list.set([
        { text: 'Item 1', active: true },
        { text: 'Item 2', active: false }
      ]);

      expect(container.children[0].classList.contains('active')).toBe(true);
      expect(container.children[1].classList.contains('active')).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('clears all items', () => {
      const list = List<string>(container, {
        render: (item) => h.li({}, [item])
      });

      list.set(['A', 'B', 'C']);
      list.destroy();

      expect(container.children.length).toBe(0);
    });

    it('clears internal maps for keyed mode', () => {
      const list = List<{ id: number }>(container, {
        key: item => item.id,
        render: (item) => h.li({}, [String(item.id)])
      });

      list.set([{ id: 1 }, { id: 2 }]);
      list.destroy();

      expect(list.elements()).toEqual([]);
    });
  });
});
