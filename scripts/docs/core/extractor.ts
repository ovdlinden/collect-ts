/**
 * TypeScript Method Extractor
 *
 * Extracts public method names from TypeScript source using Babel parser.
 * Pure function - no I/O, operates on source strings.
 *
 * Uses Babel instead of TypeScript compiler API for compatibility with TS 7.x
 * (the Go-based rewrite delays the programmatic API to 7.1).
 */

import { existsSync, readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { collect } from '../../../src/index.js';

/**
 * Extract public method names from TypeScript source code.
 */
export function extractPublicMethodsFromSource(source: string, _fileName: string, className = 'Collection'): string[] {
	const ast = parse(source, {
		sourceType: 'module',
		plugins: ['typescript'],
	});

	const methods: string[] = [];

	traverse(ast, {
		ClassDeclaration(path) {
			const node = path.node;
			if (className && node.id?.name !== className) return;

			for (const member of node.body.body) {
				if (member.type !== 'ClassMethod' && member.type !== 'TSDeclareMethod') continue;
				if (member.key.type !== 'Identifier') continue;

				const isPrivate = member.accessibility === 'private';
				const isProtected = member.accessibility === 'protected';
				if (isPrivate || isProtected) continue;

				methods.push(member.key.name);
			}
		},
	});

	return collect(methods).unique().sort().all();
}

/**
 * Extract public method names from a TypeScript file.
 * This is a convenience wrapper that reads the file and calls extractPublicMethodsFromSource.
 */
export function extractPublicMethods(filePath: string, className = 'Collection'): string[] {
	if (!existsSync(filePath)) {
		throw new Error(`Cannot extract methods: file not found at ${filePath}`);
	}
	const source = readFileSync(filePath, 'utf-8');
	const fileName = filePath.split('/').pop() ?? filePath;
	return extractPublicMethodsFromSource(source, fileName, className);
}
