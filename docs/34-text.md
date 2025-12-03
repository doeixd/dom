# Text

Text querying and manipulation utilities.

## Why?
Finding text nodes or working with text content often requires manual traversal. `Text` provides helpers for common text operations.

## API Reference

### `Text`
Text utilities.

```typescript
const Text = {
  findNode: (el: Element, text: string) => Text | null,
  replace: (el: Element, search: string, replace: string) => void,
  highlight: (el: Element, text: string, className: string) => void,
  truncate: (text: string, length: number, suffix?: string) => string
};
```

## Examples

### Highlighting Search Terms
```typescript
import { Text, find } from '@doeixd/dom';

const article = find('article');
Text.highlight(article, 'important', 'highlight');
```

### Truncating Text
```typescript
import { Text } from '@doeixd/dom';

const long = 'This is a very long piece of text...';
const short = Text.truncate(long, 20); // "This is a very lo..."
```
