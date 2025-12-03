# Forms

Utilities for form inputs and form management.

## Why?
Working with form inputs involves repetitive code for getting/setting values, validation, and handling different input types. These utilities simplify form interactions.

## API Reference

### `Input`
Smart getters/setters for form elements.

```typescript
const Input = {
  get: (el: FormElement | null) => any,
  set: (el: FormElement | null) => (val: any) => void,
  files: (el: HTMLInputElement | null) => File[],
  watch: (el: FormElement | null) => (callback: (val: any) => void) => Unsubscribe,
  watchDebounced: (el: FormElement | null) => (ms: number, callback: (val: any) => void) => Unsubscribe,
  change: (el: FormElement | null) => (callback: (val: any) => void) => Unsubscribe,
  select: (el: HTMLInputElement | HTMLTextAreaElement | null) => void,
  validate: (el: FormElement | null) => (msg?: string) => boolean
};
```

### `form`
Wraps a form for easy value management.

```typescript
function form(target: HTMLElement | string | null): FormWrapper;
```

#### `FormWrapper` Interface
```typescript
interface FormWrapper {
  raw: HTMLElement | null;
  values: () => Record<string, any>;
  set: (data: Record<string, any>) => void;
  clear: () => void;
  submit: (handler: (data: any, e: Event) => void) => Unsubscribe;
}
```

## Examples

### Input Handling
```typescript
import { Input, find } from '@doeixd/dom';

const email = find('input[name="email"]');

// Watch for changes
Input.watch(email)((value) => {
  console.log('Email:', value);
});

// Set value
Input.set(email)('user@example.com');
```

### Form Management
```typescript
import { form } from '@doeixd/dom';

const loginForm = form('#login-form');

// Populate form
loginForm.set({ email: 'user@example.com' });

// Handle submission
loginForm.submit((data, e) => {
  console.log('Submitted:', data);
  // { email: '...', password: '...' }
});
```
