# Error Handling (Result)

Rust-inspired Result type for explicit error handling.

## Why?
Try/catch can be verbose and makes error handling implicit. `Result` forces you to handle errors explicitly, improving code reliability.

## API Reference

### `Result`
Result type utilities.

```typescript
const Result = {
  ok: <T>(val: T) => Ok<T>,
  err: <E>(err: E) => Err<E>,
  try: <T>(fn: () => T) => Result<T, Error>,
  async: <T>(fn: () => Promise<T>) => Promise<Result<T, Error>>,
  unwrap: <T, E>(res: Result<T, E>) => T,
  unwrapOr: <T, E>(res: Result<T, E>, fallback: T) => T,
  map: <T, E, U>(res: Result<T, E>, fn: (v: T) => U) => Result<U, E>
};
```

## Examples

### Safe Parsing
```typescript
import { Result } from '@doeixd/dom';

const res = Result.try(() => JSON.parse(input));

if (res.ok) {
  console.log('Parsed:', res.val);
} else {
  console.error('Parse error:', res.err);
}
```

### Async Error Handling
```typescript
import { Result, Http } from '@doeixd/dom';

const { ok, val, err } = await Result.async(() => Http.get('/api/data'));

if (ok) {
  console.log('Data:', val);
} else {
  console.error('Failed:', err);
}
```
