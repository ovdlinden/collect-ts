/**
 * Documentation Parser
 *
 * Parses Laravel collection markdown documentation into structured format.
 * Pure functions - no I/O, no console output.
 */

import { type Collection, collect } from '../../../src/index.js';
import type { CodeExample, MethodDoc, ParsedDocs } from './types.js';

type LanguageType = 'php' | 'typescript' | 'blade' | 'shell' | 'json' | 'text' | 'html';

/**
 * Normalize language tags, mapping aliases to canonical names
 */
function normalizeLanguage(lang: string | undefined): LanguageType {
	if (!lang) return 'php';
	const langMap: Record<string, LanguageType> = {
		bash: 'shell',
		sh: 'shell',
		ts: 'typescript',
		vue: 'html',
	};
	const mapped = langMap[lang] || lang;
	const valid: LanguageType[] = ['php', 'typescript', 'blade', 'shell', 'json', 'text', 'html'];
	return valid.includes(mapped as LanguageType) ? (mapped as LanguageType) : 'text';
}

/**
 * Parse a collections.md file into structured format
 */
export function parseCollectionsDocs(markdownInput: string): ParsedDocs {
	// Normalize line endings (CRLF -> LF)
	const markdown = markdownInput.replace(/\r\n/g, '\n');

	// Find the introduction (everything before "## Available Methods" or first method)
	const introMatch = markdown.match(/^([\s\S]*?)(?=<a name="method-|## Available Methods|## Method Listing)/i);
	const introduction = introMatch ? introMatch[1].trim() : '';

	// Split into method sections
	// Methods are marked with <a name="method-xxx"></a> followed by #### `methodName()`
	const methodPattern = /<a name="method-([^"]+)"><\/a>\s*\n####\s*`([^`]+)\(\)`[^\n]*/g;
	const methodMatches = [...markdown.matchAll(methodPattern)];

	// Parse each method section using collect-ts
	const methods: Collection<MethodDoc> = collect(methodMatches).map((match, index) => {
		const anchor = match[1];
		const name = match[2];
		const startIndex = match.index ?? 0;

		// Find end of this method section (start of next method or end of file)
		const nextMatch = methodMatches[index + 1];
		const endIndex = nextMatch?.index ?? markdown.length;

		const sectionMarkdown = markdown.slice(startIndex, endIndex).trim();

		// Extract description (text between method header and first code block or note)
		const descriptionMatch = sectionMarkdown.match(/####[^\n]+\n\n([\s\S]*?)(?=```|> \[!|<a name=|$)/);
		const description = descriptionMatch ? descriptionMatch[1].trim().replace(/\n+/g, ' ') : '';

		// Extract code examples
		const examples = extractCodeExamples(sectionMarkdown);

		return { name, anchor, description, examples };
	});

	return { introduction, methods };
}

/**
 * Extract code examples from markdown section
 */
function extractCodeExamples(markdown: string): CodeExample[] {
	// Match code blocks with any language tag
	const codeBlockPattern = /```(\w+)?\n([\s\S]*?)\n```/g;

	return collect([...markdown.matchAll(codeBlockPattern)])
		.map((match) => ({
			language: normalizeLanguage(match[1]),
			code: match[2].trim(),
		}))
		.all();
}
