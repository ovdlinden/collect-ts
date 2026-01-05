/**
 * TypeScript Method Extractor
 *
 * Extracts public method names from TypeScript source using the TypeScript Compiler API.
 * Pure function - no I/O, operates on source strings.
 */

import { existsSync, readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { collect } from '../../../src/index.js';

/**
 * Extract public method names from TypeScript source code.
 */
export function extractPublicMethodsFromSource(source: string, fileName: string, className = 'Collection'): string[] {
	const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);

	// Find the specified class (or first class if name not specified)
	const classNode = sourceFile.statements.find(
		(s): s is ts.ClassDeclaration =>
			ts.isClassDeclaration(s) && (s.name?.getText(sourceFile) === className || className === ''),
	);
	if (!classNode) return [];

	// IMPORTANT: Use Array.from() - TypeScript's NodeArray is not a true Array
	return collect(Array.from(classNode.members))
		.filter(
			(m): m is ts.MethodDeclaration => ts.isMethodDeclaration(m) && m.name.kind === ts.SyntaxKind.Identifier, // Exclude computed properties like [Symbol.iterator]
		)
		.reject((m) => {
			// Exclude private and protected methods
			const mods = ts.getModifiers(m);
			return (
				mods?.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword || mod.kind === ts.SyntaxKind.ProtectedKeyword) ??
				false
			);
		})
		.map((m) => m.name?.getText(sourceFile))
		.filter((name): name is string => !!name)
		.unique() // Handle overloads - same method name appears multiple times
		.sort()
		.all();
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
