#!/usr/bin/env npx tsx
/**
 * Generates docs/collections/ guide pages from JSDoc in src/Collection.ts
 *
 * Run: npx tsx scripts/generate-collection-guides.ts
 *
 * This ensures the guide pages stay in sync with the JSDoc source-of-truth.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { collect } from '../src/index.js';

interface ExampleBlock {
  prose: string;
  code: string;
}

interface MethodSearchData {
  name: string;
  category: string;
  description: string;
  signature: string;
}

interface SeeRef {
  method: string;
  description: string;
}

interface MethodDoc {
  name: string;
  category: string;
  group: string;
  description: string;
  examples: ExampleBlock[];
  see: SeeRef[];
}

interface CategoryDescription {
  category: string;
  description: string;
}

const CATEGORY_MAP: Record<string, string> = {
  // Direct category mappings (new canonical names)
  'Creating': 'creating',
  'Finding': 'finding',
  'Filtering': 'filtering',
  'Transforming': 'transforming',
  'Grouping': 'grouping',
  'Aggregating': 'aggregating',
  'Sorting': 'sorting',
  'Combining': 'combining',
  'Checking': 'checking',
  // Legacy category mappings (for backwards compatibility)
  'Getting': 'finding',
  'Reducing': 'aggregating',
  'Merging': 'combining',
  'Set Operations': 'combining',
  'Slicing': 'filtering',
  'Mapping': 'transforming',
  'Mutating': 'transforming',
  'Conditional': 'checking',
  'String': 'transforming',
  'Iteration': 'transforming',
  'Utility': 'finding',
  'Static': 'finding',
};

const CATEGORY_TITLES: Record<string, string> = {
  creating: 'Creating',
  filtering: 'Filtering',
  transforming: 'Transforming',
  grouping: 'Grouping',
  aggregating: 'Aggregating',
  finding: 'Finding',
  sorting: 'Sorting',
  combining: 'Combining',
  checking: 'Checking',
};

/**
 * Check if a line looks like the START of code.
 */
function isCodeStart(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  return (
    trimmed.startsWith('const ') ||
    trimmed.startsWith('let ') ||
    trimmed.startsWith('var ') ||
    trimmed.startsWith('class ') ||
    trimmed.startsWith('function ') ||
    trimmed.startsWith('collect(') ||
    trimmed.startsWith('collection.') ||
    trimmed.startsWith('Collection.') || // Static method calls
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[.(]/.test(trimmed) // Include uppercase
  );
}

/**
 * Check if a line is code continuation (inside a code block).
 */
function isCodeContinuation(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true; // Empty lines inside code are ok

  return (
    trimmed.startsWith('const ') ||
    trimmed.startsWith('let ') ||
    trimmed.startsWith('var ') ||
    trimmed.startsWith('collect(') ||
    trimmed.startsWith('collection') ||
    trimmed.startsWith('Collection.') || // Static method calls
    trimmed.startsWith('users') ||
    trimmed.startsWith('products') ||
    trimmed.startsWith('orders') ||
    trimmed.startsWith('items') ||
    trimmed.startsWith('result') ||
    trimmed.startsWith('// →') ||
    trimmed.startsWith('//') || // Output continuation lines (multi-line output)
    trimmed.startsWith('.') ||
    trimmed.startsWith(')') ||
    trimmed.startsWith(']') ||
    trimmed.startsWith('}') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('(') ||
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[.(\[]/.test(trimmed) || // Include uppercase
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*$/.test(trimmed) // Include uppercase
  );
}

/**
 * Parse an @example block into prose + code.
 * Prose comes before the code. Anything after `// →` that isn't code is trailing prose
 * that belongs to the NEXT example (returned separately).
 */
function parseExampleBlock(content: string): { block: ExampleBlock; trailingProse: string } {
  const lines = content.split('\n');
  const proseLines: string[] = [];
  const codeLines: string[] = [];
  const trailingLines: string[] = [];

  let state: 'prose' | 'code' | 'trailing' = 'prose';
  let sawOutput = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (state === 'prose') {
      if (isCodeStart(line)) {
        state = 'code';
        codeLines.push(line);
      } else {
        proseLines.push(line);
      }
    } else if (state === 'code') {
      if (trimmed.startsWith('// →')) {
        sawOutput = true;
        codeLines.push(line);
      } else if (sawOutput && trimmed && !isCodeContinuation(line)) {
        // After output, non-code line means we're in trailing prose
        state = 'trailing';
        trailingLines.push(line);
      } else if (isCodeContinuation(line)) {
        codeLines.push(line);
      } else {
        // Non-code after code but before output - shouldn't happen in well-formed JSDoc
        codeLines.push(line);
      }
    } else {
      // trailing
      trailingLines.push(line);
    }
  }

  return {
    block: {
      prose: proseLines.join('\n').trim(),
      code: codeLines.join('\n').trim(),
    },
    trailingProse: trailingLines.join('\n').trim(),
  };
}

/**
 * Parse @see references with descriptions.
 * Supports:
 *   @see {@link method} — description
 *   @see {@link method} - description
 *   @see {@link method}
 */
function parseSeeRefs(jsdoc: string): SeeRef[] {
  const refs: SeeRef[] = [];
  const seePattern = /@see\s+\{@link\s+(\w+)\}(?:\s*[—-]\s*(.+))?/g;

  let match;
  while ((match = seePattern.exec(jsdoc)) !== null) {
    refs.push({
      method: match[1],
      description: match[2]?.trim() || '',
    });
  }

  return refs;
}

/**
 * Parse @categoryDescription blocks.
 */
function parseCategoryDescriptions(source: string): CategoryDescription[] {
  const descriptions: CategoryDescription[] = [];
  const pattern = /@categoryDescription\s+(\w+)\s+([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/g;

  // Find all JSDoc blocks
  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
  let jsdocMatch;

  while ((jsdocMatch = jsdocPattern.exec(source)) !== null) {
    const jsdoc = jsdocMatch[0];
    let match;

    while ((match = pattern.exec(jsdoc)) !== null) {
      const category = match[1].trim();
      const desc = match[2]
        .replace(/^\s*\*\s?/gm, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      descriptions.push({ category, description: desc });
    }
  }

  return descriptions;
}

function stripGenerics(str: string): string {
  let result = '';
  let depth = 0;
  for (const char of str) {
    if (char === '<') depth++;
    else if (char === '>') depth--;
    else if (depth === 0) result += char;
  }
  return result;
}

function splitTopLevel(str: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of str) {
    if (char === '<' || char === '(' || char === '[' || char === '{') depth++;
    else if (char === '>' || char === ')' || char === ']' || char === '}') depth--;
    else if (char === delimiter && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());

  return parts;
}

function simplifyParams(params: string): string {
  if (!params.trim()) return '';

  return collect(splitTopLevel(params, ','))
    .map((p) => {
      const match = p.trim().match(/^(\w+)(\?)?/);
      return match ? match[1] + (match[2] || '') : p;
    })
    .join(', ');
}

function extractSignaturesFromSource(source: string): Map<string, string> {
  const signatures = new Map<string, string>();

  for (const line of source.split('\n')) {
    const match = line.match(/^\t(\w+)(?:<[^>]*>)?\(([^)]*)\)(?::\s*([^{;]+))?[{;]/);
    if (!match) continue;

    const [, name, params, returnType] = match;
    if (name.startsWith('_') || signatures.has(name)) continue;

    const simplifiedParams = simplifyParams(params);
    const simplifiedReturn = stripGenerics(returnType?.trim() || 'void').replace(/\s+/g, ' ').trim();
    signatures.set(name, `${name}(${simplifiedParams}): ${simplifiedReturn}`);
  }

  return signatures;
}

function parseJSDoc(source: string): MethodDoc[] {
  const methods: MethodDoc[] = [];

  // Find all JSDoc blocks
  const jsdocBlockPattern = /\/\*\*[\s\S]*?\*\//g;
  const methodAfterPattern = /^\s*(?:static\s+)?([a-zA-Z_]\w*)\s*[<(]/;
  const categoryPattern = /@category\s+(.+)/;
  const groupPattern = /@group\s+(.+)/;

  let blockMatch;
  while ((blockMatch = jsdocBlockPattern.exec(source)) !== null) {
    const jsdoc = blockMatch[0];
    const jsdocEnd = blockMatch.index + jsdoc.length;

    // Skip @categoryDescription blocks (they're handled separately)
    if (jsdoc.includes('@categoryDescription')) continue;

    // Skip if no @category
    const categoryMatch = jsdoc.match(categoryPattern);
    if (!categoryMatch) continue;

    // Find the method name after this JSDoc
    const afterJsdoc = source.slice(jsdocEnd, jsdocEnd + 200);
    const methodMatch = afterJsdoc.match(methodAfterPattern);
    if (!methodMatch) continue;

    const methodName = methodMatch[1];

    const category = categoryMatch[1].trim();

    // Extract @group
    const groupMatch = jsdoc.match(groupPattern);
    const group = groupMatch ? groupMatch[1].trim() : '';

    // Extract description (all content after /** and before first @tag)
    const descMatch = jsdoc.match(/\/\*\*\s*\n?\s*\*\s*([\s\S]*?)(?=\s*\*\s*@)/);
    const description = descMatch
      ? descMatch[1]
          .split('\n')
          .map(line => line.replace(/^\s*\*\s?/, ''))  // Remove leading * from each line
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')   // Normalize 3+ blank lines to 2
          .trim()
      : '';

    // Extract examples with prose
    const examples: ExampleBlock[] = [];
    const exampleRegex = /@example\s*([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/g;
    let exampleMatch;
    let pendingProse = '';

    while ((exampleMatch = exampleRegex.exec(jsdoc)) !== null) {
      const content = exampleMatch[1]
        .replace(/^\s*\*\s?/gm, '')
        .trim();

      if (content) {
        const { block, trailingProse } = parseExampleBlock(content);

        // Prepend any pending prose from the previous example
        if (pendingProse) {
          block.prose = pendingProse + (block.prose ? '\n\n' + block.prose : '');
        }

        examples.push(block);
        pendingProse = trailingProse;
      }
    }

    // If there's trailing prose after the last example, add it as a prose-only block
    // (This would be unusual but handle it gracefully)
    if (pendingProse) {
      // Just ignore trailing prose after last example, or add to description
    }

    // Extract @see references
    const see = parseSeeRefs(jsdoc);

    methods.push({
      name: methodName,
      category,
      group,
      description,
      examples,
      see,
    });
  }

  return methods;
}

interface GroupedMethods {
  group: string;
  methods: MethodDoc[];
}

// Define the order of groups per category
const GROUP_ORDER: Record<string, string[]> = {
  filtering: [
    'Callback Filters',
    'Property Filters',
    'Key Selection',
    'Slicing',
    'Deduplication',
    'Existence Checks',
  ],
  // Add other categories as needed
};

function groupMethods(methods: MethodDoc[], category: string): GroupedMethods[] {
  const groups = new Map<string, MethodDoc[]>();
  const ungrouped: MethodDoc[] = [];

  for (const method of methods) {
    if (method.group) {
      const existing = groups.get(method.group) || [];
      existing.push(method);
      groups.set(method.group, existing);
    } else {
      ungrouped.push(method);
    }
  }

  // Sort groups by defined order, then alphabetically for undefined groups
  const order = GROUP_ORDER[category] || [];
  const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  const result = sorted.map(([group, methods]) => ({ group, methods }));

  // Add ungrouped methods at the end with empty group name
  if (ungrouped.length > 0) {
    result.push({ group: '', methods: ungrouped });
  }

  return result;
}

function generateGuidePage(
  filename: string,
  methods: MethodDoc[],
  categoryDescriptions: CategoryDescription[],
  methodToFile: Map<string, string>,
): string {
  const title = CATEGORY_TITLES[filename] || filename.charAt(0).toUpperCase() + filename.slice(1);

  // Find category description
  const catDesc = categoryDescriptions.find(
    (d) => d.category.toLowerCase() === title.toLowerCase(),
  );

  const lines: string[] = [
    `# ${title}`,
    '',
  ];

  if (catDesc) {
    lines.push(catDesc.description, '');
  }

  lines.push(
    '<!-- This file is auto-generated from JSDoc. Do not edit directly. -->',
    '<!-- Run: npm run docs:guides -->',
    '',
  );

  const grouped = groupMethods(methods, filename);

  for (const { group, methods: groupMethods } of grouped) {
    // Add group heading if named
    if (group) {
      lines.push(`## ${group}`, '');
    }

    for (const method of groupMethods) {
      // Always use ### for methods (subordinate to groups or category)
      lines.push(`### ${method.name}()`, '');

      if (method.description) {
        lines.push(method.description, '');
      }

      for (const example of method.examples) {
        // Add prose before code if present
        if (example.prose) {
          lines.push(example.prose, '');
        }

        if (example.code) {
          lines.push('```typescript', example.code, '```', '');
        }
      }

      // Related methods as prose (Laravel style) — trust the reader to explore
      // Limit to 2 most relevant alternatives; use tighter phrasing
      if (method.see.length > 0) {
        const refs = collect(method.see)
          .take(2)
          .map((s) => {
            const targetFile = methodToFile.get(s.method);
            const isSamePage = targetFile === filename;
            const anchor = s.method.toLowerCase();
            const link = isSamePage
              ? `[\`${s.method}\`](#${anchor})`
              : `[\`${s.method}\`](/collections/${targetFile}#${anchor})`;
            return s.description
              ? `For ${s.description}, use ${link}.`
              : `See ${link}.`;
          }).join(' ');
        lines.push(refs, '');
      }

      lines.push('---', '');
    }
  }

  return lines.join('\n');
}

// Main
const sourceCode = fs.readFileSync('src/Collection.ts', 'utf-8');
const lazySourceCode = fs.readFileSync('src/LazyCollection.ts', 'utf-8');

const methods = parseJSDoc(sourceCode);
const categoryDescriptions = parseCategoryDescriptions(sourceCode);

// Extract signatures from both source files
const signatures = new Map([
  ...extractSignaturesFromSource(sourceCode),
  ...extractSignaturesFromSource(lazySourceCode),
]);

console.log(`Found ${methods.length} documented methods`);
console.log(`Found ${categoryDescriptions.length} category descriptions`);
console.log(`Extracted ${signatures.size} method signatures`);

// Build method → filename lookup for cross-page links
const methodToFile = new Map<string, string>();
for (const method of methods) {
  const file = CATEGORY_MAP[method.category] || 'other';
  methodToFile.set(method.name, file);
}

// Group by target file
const byFile = new Map<string, MethodDoc[]>();
for (const method of methods) {
  const file = CATEGORY_MAP[method.category] || 'other';
  const existing = byFile.get(file) || [];
  existing.push(method);
  byFile.set(file, existing);
}

// Generate files
const outDir = 'docs/collections';
for (const [filename, fileMethods] of byFile) {
  if (filename === 'other') continue;

  const content = generateGuidePage(filename, fileMethods, categoryDescriptions, methodToFile);
  const outPath = path.join(outDir, `${filename}.md`);

  console.log(`Writing ${outPath} (${fileMethods.length} methods)`);
  fs.writeFileSync(outPath, content);
}

// Generate methods.json for search index
const searchData: MethodSearchData[] = methods.map((m) => ({
  name: m.name,
  category: CATEGORY_MAP[m.category] || 'other',
  description: m.description.slice(0, 500),
  signature: signatures.get(m.name) || `${m.name}()`,
}));

const methodsJsonPath = 'docs/.vitepress/theme/data/methods.json';
fs.writeFileSync(methodsJsonPath, JSON.stringify(searchData, null, '\t'));
console.log(`Written ${methodsJsonPath} (${searchData.length} methods)`);

console.log('Done!');
