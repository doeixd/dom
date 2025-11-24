#!/usr/bin/env node

/**
 * find-exports.js
 * 
 * Finds all export statements in src/index.ts and outputs them with line numbers.
 * 
 * Usage:
 *   node scripts/find-exports.js
 *   npm run find-exports
 */

const fs = require('fs');
const path = require('path');

// Path to index.ts
const indexPath = path.join(__dirname, '..', 'src', 'index.ts');

// Read the file
const content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split('\n');

// Regular expressions to match different export patterns
const exportPatterns = [
  /^export\s+type\s+(\w+)/,           // export type Foo
  /^export\s+interface\s+(\w+)/,      // export interface Foo
  /^export\s+class\s+(\w+)/,          // export class Foo
  /^export\s+function\s+(\w+)/,       // export function foo
  /^export\s+const\s+(\w+)/,          // export const foo
  /^export\s+let\s+(\w+)/,            // export let foo
  /^export\s+var\s+(\w+)/,            // export var foo
  /^export\s+enum\s+(\w+)/,           // export enum Foo
  /^export\s+default\s+/,             // export default
  /^export\s+\{/,                     // export { ... }
  /^export\s+\*/,                     // export * from
];

console.log('📦 Exports found in src/index.ts:\n');
console.log('─'.repeat(80));

let exportCount = 0;

lines.forEach((line, index) => {
  const lineNumber = index + 1;
  const trimmedLine = line.trim();

  // Check if line matches any export pattern
  const isExport = exportPatterns.some(pattern => pattern.test(trimmedLine));

  if (isExport) {
    exportCount++;
    console.log(`Line ${lineNumber.toString().padStart(5)}: ${line}`);
  }
});

console.log('─'.repeat(80));
console.log(`\n✅ Total exports found: ${exportCount}\n`);
