import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SearchEntry {
	id: string;
	title: string;
	titles: string[];
	text: string;
}

interface TitleEntry {
	level: number;
	title: string;
}

const docsDir = join(import.meta.dirname, '../docs');
const outputPath = join(docsDir, '.vitepress/theme/data/search-index.json');

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
				currentText += ' ' + line.replace(/[*_`\[\]()]/g, '');
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

// Generate index
const mdFiles = findMarkdownFiles(docsDir);
const searchIndex: SearchEntry[] = [];

for (const file of mdFiles) {
	const content = readFileSync(file, 'utf-8');
	const sections = extractMarkdownSections(content, file);
	searchIndex.push(...sections);
}

writeFileSync(outputPath, JSON.stringify(searchIndex, null, '\t'));
console.log(`Generated search index with ${searchIndex.length} entries`);
