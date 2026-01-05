import { describe, expect, it } from 'vitest';
import { compareBaseline } from '../../scripts/docs/core/comparator';
import { parseCollectionsDocs } from '../../scripts/docs/core/parser';

describe('parser', () => {
	describe('parseCollectionsDocs', () => {
		it('extracts method from anchor format', () => {
			const markdown = `
<a name="method-all"></a>
#### \`all()\`

The \`all\` method returns the underlying array.
`;
			const docs = parseCollectionsDocs(markdown);
			const method = docs.methods.firstWhere('name', 'all');
			expect(method).toBeDefined();
			expect(method?.anchor).toBe('all');
		});

		it('extracts description', () => {
			const markdown = `
<a name="method-map"></a>
#### \`map()\`

The \`map\` method iterates through the collection and passes each value to the given callback.
`;
			const docs = parseCollectionsDocs(markdown);
			const method = docs.methods.firstWhere('name', 'map');
			expect(method?.description).toContain('iterates through the collection');
		});

		it('extracts code examples', () => {
			const markdown = `
<a name="method-map"></a>
#### \`map()\`

Maps values.

\`\`\`php
$collection->map(fn ($item) => $item * 2);
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			const method = docs.methods.firstWhere('name', 'map');
			expect(method?.examples.length).toBe(1);
			expect(method?.examples[0].language).toBe('php');
			expect(method?.examples[0].code).toContain('$collection->map');
		});

		it('extracts multiple methods', () => {
			const markdown = `
<a name="method-first"></a>
#### \`first()\`

Gets the first item.

<a name="method-last"></a>
#### \`last()\`

Gets the last item.
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.count()).toBe(2);
			expect(docs.methods.firstWhere('name', 'first')).toBeDefined();
			expect(docs.methods.firstWhere('name', 'last')).toBeDefined();
		});

		it('handles empty markdown', () => {
			const docs = parseCollectionsDocs('');
			expect(docs.methods.count()).toBe(0);
		});

		it('handles markdown without methods', () => {
			const docs = parseCollectionsDocs('# Just a title\n\nSome content.');
			expect(docs.methods.count()).toBe(0);
		});

		it('normalizes CRLF line endings', () => {
			const markdown = `<a name="method-test"></a>\r\n#### \`test()\`\r\n\r\nDescription.\r\n`;
			const docs = parseCollectionsDocs(markdown);
			const method = docs.methods.firstWhere('name', 'test');
			expect(method).toBeDefined();
			expect(method?.description).toBe('Description.');
		});
	});

	describe('language normalization', () => {
		it('maps bash to shell', () => {
			const markdown = `
<a name="method-test"></a>
#### \`test()\`

Example.

\`\`\`bash
echo "hello"
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.firstWhere('name', 'test')?.examples[0].language).toBe('shell');
		});

		it('maps vue to html', () => {
			const markdown = `
<a name="method-test"></a>
#### \`test()\`

Example.

\`\`\`vue
<template></template>
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.firstWhere('name', 'test')?.examples[0].language).toBe('html');
		});

		it('maps ts to typescript', () => {
			const markdown = `
<a name="method-test"></a>
#### \`test()\`

Example.

\`\`\`ts
const x: number = 1;
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.firstWhere('name', 'test')?.examples[0].language).toBe('typescript');
		});

		it('defaults unknown language to text', () => {
			const markdown = `
<a name="method-test"></a>
#### \`test()\`

Example.

\`\`\`ruby
puts "hello"
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.firstWhere('name', 'test')?.examples[0].language).toBe('text');
		});

		it('defaults missing language to php', () => {
			const markdown = `
<a name="method-test"></a>
#### \`test()\`

Example.

\`\`\`
$collection->all();
\`\`\`
`;
			const docs = parseCollectionsDocs(markdown);
			expect(docs.methods.firstWhere('name', 'test')?.examples[0].language).toBe('php');
		});
	});

	describe('compareBaseline', () => {
		it('returns exists=false when baseline is null', () => {
			const result = compareBaseline(null, 'current content');
			expect(result.exists).toBe(false);
			expect(result.upToDate).toBe(false);
		});

		it('returns upToDate=true when baseline matches current', () => {
			const content = 'same content';
			const result = compareBaseline(content, content);
			expect(result.exists).toBe(true);
			expect(result.upToDate).toBe(true);
		});

		it('returns upToDate=false when baseline differs from current', () => {
			const result = compareBaseline('old content', 'new content');
			expect(result.exists).toBe(true);
			expect(result.upToDate).toBe(false);
		});

		it('returns the current content', () => {
			const current = 'the current docs';
			const result = compareBaseline(null, current);
			expect(result.content).toBe(current);
		});

		it('includes baselinePath', () => {
			const result = compareBaseline(null, 'content');
			expect(result.baselinePath).toBe('scripts/docs/baseline/laravel-collections.md');
		});
	});
});
