# Color

Utilities for color manipulation and conversion.

## Why?
Converting between color spaces (Hex, RGB, HSL) is common in UI development, especially for theming or dynamic visualizations.

## API Reference

### `toColorSpace`
Converts a color string to a specific color space.

```typescript
function toColorSpace(color: string, space: 'rgb' | 'hsl' | 'hex'): string;
```

## Examples

### Converting Colors
```typescript
import { toColorSpace } from '@doeixd/dom';

const hex = '#ff0000';
const rgb = toColorSpace(hex, 'rgb'); // "rgb(255, 0, 0)"
const hsl = toColorSpace(hex, 'hsl'); // "hsl(0, 100%, 50%)"
```
