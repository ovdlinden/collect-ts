import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import { collect } from '../src/Collection';

interface SearchEntry {
	id: string;
	title: string;
	titles: string[];
	text: string;
	signature?: string;
}

interface TitleEntry {
	level: number;
	title: string;
}

const docsDir = join(import.meta.dirname, '../docs');
const srcDir = join(import.meta.dirname, '../src');
const outputPath = join(docsDir, '.vitepress/theme/data/search-index.json');

// Extract method signatures from TypeScript source files
function extractSignatures(): Map<string, string> {
	const signatures = new Map<string, string>();
	const files = ['Collection.ts', 'LazyCollection.ts'];

	for (const file of files) {
		const content = readFileSync(join(srcDir, file), 'utf-8');
		const lines = content.split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			// Match method declarations (non-implementation overloads or single declarations)
			// Pattern: methodName(params): ReturnType;
			// or: methodName<T>(params): ReturnType {
			const match = line.match(/^\t(\w+)(?:<[^>]+>)?\(([^)]*)\)(?::\s*([^{;]+))?[{;]/);
			if (match) {
				const [, name, params, returnType] = match;
				// Skip internal/private methods and already captured
				if (name.startsWith('_') || signatures.has(name)) continue;
				// Skip if it's an implementation (has { at end) and we already have the signature
				if (line.endsWith('{') && signatures.has(name)) continue;

				// Simplify the signature
				const simplifiedParams = simplifyParams(params);
				const simplifiedReturn = simplifyReturn(returnType?.trim() || 'void');
				signatures.set(name, `${name}(${simplifiedParams}): ${simplifiedReturn}`);
			}
		}
	}

	return signatures;
}

function simplifyParams(params: string): string {
	if (!params.trim()) return '';

	// Split by top-level commas (not inside angle brackets or parens)
	const parts: string[] = [];
	let current = '';
	let depth = 0;

	for (const char of params) {
		if (char === '<' || char === '(' || char === '[' || char === '{') depth++;
		else if (char === '>' || char === ')' || char === ']' || char === '}') depth--;
		else if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}
	if (current.trim()) parts.push(current.trim());

	// Simplify each parameter
	return parts
		.map((p) => {
			// Extract just the name and optional marker
			const nameMatch = p.match(/^(\w+)(\?)?/);
			if (!nameMatch) return p;
			return nameMatch[1] + (nameMatch[2] || '');
		})
		.join(', ');
}

function simplifyReturn(ret: string): string {
	// Remove generic parameters for cleaner display
	return ret
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function extractMarkdownSections(content: string, filePath: string): SearchEntry[] {
	const entries: SearchEntry[] = [];
	const lines = content.split('\n');
	const basePath = filePath.replace(docsDir, '').replace(/\.md$/, '').replace(/\/index$/, '/');

	const titleStack: TitleEntry[] = [];
	let currentText = '';
	let currentAnchor = '';
	let currentTitle = '';

	function getTitlesArray(): string[] {
		return titleStack.map((t) => t.title);
	}

	for (const line of lines) {
		const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
		if (headingMatch) {
			// Save previous section
			if (currentTitle && currentText.trim()) {
				entries.push({
					id: `${basePath}#${currentAnchor}`,
					title: currentTitle,
					titles: getTitlesArray(),
					text: currentText.slice(0, 500),
				});
			}

			const level = headingMatch[1].length;
			const title = headingMatch[2].trim();
			const anchor = title
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-');

			// Pop titles until we find a parent (lower level number)
			while (titleStack.length > 0 && titleStack[titleStack.length - 1].level >= level) {
				titleStack.pop();
			}

			// Push current heading
			titleStack.push({ level, title });
			currentTitle = title;
			currentAnchor = anchor;
			currentText = '';
		} else {
			// Strip code blocks and accumulate text
			if (!line.startsWith('```') && !line.startsWith(':::')) {
				const cleanLine = line
					.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](link) -> text
					.replace(/\/collections\/\w+#\w+/g, '') // Remove bare internal links
					.replace(/[*_`\[\]()#]/g, '') // Remove markdown chars
					.replace(/→|←|↑|↓/g, '') // Remove arrows
					.replace(/---/g, '') // Remove separators
					.trim();
				if (cleanLine) currentText += ' ' + cleanLine;
			}
		}
	}

	// Save last section
	if (currentTitle && currentText.trim()) {
		entries.push({
			id: `${basePath}#${currentAnchor}`,
			title: currentTitle,
			titles: getTitlesArray(),
			text: currentText.slice(0, 500),
		});
	}

	return entries;
}

function findMarkdownFiles(dir: string): string[] {
	const files: string[] = [];
	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory() && !entry.name.startsWith('.')) {
			files.push(...findMarkdownFiles(fullPath));
		} else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
			files.push(fullPath);
		}
	}

	return files;
}

// Extract signatures from TypeScript source
const signatures = extractSignatures();
console.log(`Extracted ${signatures.size} method signatures`);

// Generate index - only collection method pages
const collectionsDir = join(docsDir, 'collections');
const mdFiles = findMarkdownFiles(collectionsDir);
const searchIndex: SearchEntry[] = [];

for (const file of mdFiles) {
	const content = readFileSync(file, 'utf-8');
	const sections = extractMarkdownSections(content, file);
	// Only include method entries (h3 headings), skip category headers
	for (const section of sections) {
		if (section.titles.length > 1) {
			// Add signature if available (strip () from title to match)
			const methodName = section.title.replace(/\(\)$/, '');
			const sig = signatures.get(methodName);
			if (sig) {
				section.signature = sig;
			}
			searchIndex.push(section);
		}
	}
}

// Build MiniSearch index with unique numeric IDs
const miniSearch = new MiniSearch<SearchEntry & { _id: number }>({
	idField: '_id',
	fields: ['title', 'text', 'signature'],
	storeFields: ['id', 'title', 'titles', 'text', 'signature'],
	searchOptions: {
		boost: { title: 3, signature: 2, text: 1 },
		prefix: true,
		fuzzy: 0.2,
	},
});

miniSearch.addAll(
	collect(searchIndex)
		.map((entry, i) => ({ ...entry, _id: i }))
		.all(),
);

// Export serialized index
writeFileSync(outputPath, JSON.stringify(miniSearch.toJSON(), null, '\t'));
console.log(`Generated MiniSearch index with ${searchIndex.length} entries`);
