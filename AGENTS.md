# Developer Scripts

## find-exports

**Purpose**: Finds all export statements in `src/index.ts` and outputs them with line numbers.

**Usage**:
```bash
npm run find-exports
```

**Output**: Lists all export statements (types, interfaces, functions, constants, etc.) with their corresponding line numbers in the source file.

**Location**: `scripts/find-exports.js`

**Example Output**:
```
📦 Exports found in src/index.ts:

────────────────────────────────────────────────────────────────────────────────
Line    83: export type ParseSelector<S extends string> =
Line   102: export type Unsubscribe = () => void;
Line   117: export type EventMap<T extends Record<string, Event> = {}> = ...
...
────────────────────────────────────────────────────────────────────────────────

✅ Total exports found: 157
```

**Use Cases**:
- Quick reference for all exported APIs
- Debugging export issues
- Generating documentation
- Code review and auditing
