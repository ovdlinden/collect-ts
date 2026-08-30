/**
 * AST-based transform for tree-shakeable Collection imports.
 *
 * Transforms:
 *   import { collect } from 'collect-ts';
 *   collect(users).filter().map().groupBy();
 *
 * Into:
 *   import { createCollection } from 'collect-ts/core';
 *   import filterMethod from 'collect-ts/methods/filter';
 *   import mapMethod from 'collect-ts/methods/map';
 *   import groupByMethod from 'collect-ts/methods/groupBy';
 *   const collect = createCollection([filterMethod, mapMethod, groupByMethod]);
 *   collect(users).filter().map().groupBy();
 */

import * as acorn from 'acorn';

export interface TransformOptions {
	/** Package name to transform (default: 'collect-ts') */
	packageName?: string;
	/** Whether to include source maps */
	sourcemap?: boolean;
}

export interface TransformResult {
	code: string;
	map?: unknown;
	/** Methods that were detected and will be tree-shaken */
	usedMethods: string[];
}

/** All known Collection methods that can be tree-shaken */
const KNOWN_METHODS = new Set([
	'avg',
	'average',
	'chunk',
	'collapse',
	'concat',
	'contains',
	'count',
	'countBy',
	'each',
	'every',
	'except',
	'filter',
	'first',
	'flatMap',
	'flatten',
	'flip',
	'groupBy',
	'implode',
	'join',
	'keyBy',
	'keys',
	'last',
	'map',
	'max',
	'merge',
	'min',
	'only',
	'partition',
	'pluck',
	'reduce',
	'reject',
	'reverse',
	'shuffle',
	'skip',
	'slice',
	'some',
	'sortBy',
	'sortByDesc',
	'sum',
	'take',
	'tap',
	'unique',
	'values',
	'where',
	'whereStrict',
	'whereIn',
	'whereNotIn',
]);

/** Methods that share a module file */
const METHOD_TO_MODULE: Record<string, string> = {
	average: 'avg',
	sortByDesc: 'sortBy',
	whereStrict: 'where',
	whereNotIn: 'whereIn',
	implode: 'join',
	countBy: 'count',
};

type AcornNode = acorn.Node & {
	type: string;
	body?: AcornNode[];
	expression?: AcornNode;
	source?: { value: string };
	specifiers?: Array<{
		type: string;
		imported?: { name: string };
		local?: { name: string };
	}>;
	callee?: AcornNode;
	object?: AcornNode;
	property?: { name: string };
	name?: string;
	arguments?: AcornNode[];
};

/**
 * Transform source code to use tree-shakeable imports.
 * Uses acorn for accurate AST-based detection.
 */
export function transform(code: string, options: TransformOptions = {}): TransformResult | null {
	const packageName = options.packageName ?? 'collect-ts';

	let ast: AcornNode;
	try {
		ast = acorn.parse(code, {
			ecmaVersion: 'latest',
			sourceType: 'module',
		}) as AcornNode;
	} catch {
		return null;
	}

	// Find the collect identifier from imports
	const collectIdentifier = findCollectImport(ast, packageName);
	if (!collectIdentifier) {
		return null;
	}

	// Find all method calls on collect() results
	const usedMethods = findUsedMethods(ast, collectIdentifier);
	if (usedMethods.size === 0) {
		return null;
	}

	// Generate the transformed code
	const transformedCode = rewriteImports(code, packageName, usedMethods);

	return {
		code: transformedCode,
		usedMethods: Array.from(usedMethods),
	};
}

/**
 * Find the local identifier for 'collect' imported from the package.
 * Handles: import { collect } from 'collect-ts'
 *          import { collect as c } from 'collect-ts'
 */
function findCollectImport(ast: AcornNode, packageName: string): string | null {
	for (const node of ast.body ?? []) {
		if (node.type !== 'ImportDeclaration') continue;
		if (node.source?.value !== packageName) continue;

		for (const specifier of node.specifiers ?? []) {
			if (specifier.type !== 'ImportSpecifier') continue;
			const importedName = specifier.imported?.name;
			if (importedName === 'collect') {
				return specifier.local?.name ?? 'collect';
			}
		}
	}
	return null;
}

/**
 * Find all Collection methods used on collect() call chains.
 * Detects methods both on direct chains and within callback arguments.
 */
function findUsedMethods(ast: AcornNode, collectIdentifier: string): Set<string> {
	const methods = new Set<string>();

	function isCollectCall(node: AcornNode): boolean {
		return (
			node.type === 'CallExpression' &&
			node.callee?.type === 'Identifier' &&
			node.callee.name === collectIdentifier
		);
	}

	function chainLeadsToCollect(node: AcornNode | undefined): boolean {
		if (!node) return false;
		if (isCollectCall(node)) return true;
		if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
			return chainLeadsToCollect(node.callee.object as AcornNode);
		}
		return false;
	}

	function collectMethodsFromChain(node: AcornNode, inCollectContext: boolean): void {
		if (node.type !== 'CallExpression') return;

		const callee = node.callee;
		if (!callee) return;

		if (callee.type === 'MemberExpression' && callee.property?.name) {
			const methodName = callee.property.name;
			const isOnCollectChain = chainLeadsToCollect(callee.object);

			if (isOnCollectChain || inCollectContext) {
				if (KNOWN_METHODS.has(methodName)) {
					methods.add(methodName);
				}
			}

			// If this is on a collect chain, scan callback arguments for nested Collection methods
			if (isOnCollectChain && node.arguments) {
				for (const arg of node.arguments) {
					if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
						scanForMethodCalls(arg, true);
					}
				}
			}

			collectMethodsFromChain(callee.object as AcornNode, inCollectContext);
		}
	}

	function scanForMethodCalls(node: AcornNode, inCollectContext: boolean): void {
		if (node.type === 'CallExpression') {
			collectMethodsFromChain(node, inCollectContext);
		}

		for (const key in node) {
			const child = (node as unknown as Record<string, unknown>)[key];
			if (child && typeof child === 'object') {
				if (Array.isArray(child)) {
					for (const item of child) {
						if (item && typeof item === 'object' && 'type' in item) {
							scanForMethodCalls(item as AcornNode, inCollectContext);
						}
					}
				} else if ('type' in child) {
					scanForMethodCalls(child as AcornNode, inCollectContext);
				}
			}
		}
	}

	function visit(node: AcornNode): void {
		if (node.type === 'CallExpression') {
			collectMethodsFromChain(node, false);
		}

		for (const key in node) {
			const child = (node as unknown as Record<string, unknown>)[key];
			if (child && typeof child === 'object') {
				if (Array.isArray(child)) {
					for (const item of child) {
						if (item && typeof item === 'object' && 'type' in item) {
							visit(item as AcornNode);
						}
					}
				} else if ('type' in child) {
					visit(child as AcornNode);
				}
			}
		}
	}

	visit(ast);
	return methods;
}

/**
 * Rewrite the imports to use modular imports.
 */
function rewriteImports(code: string, packageName: string, usedMethods: Set<string>): string {
	// Build the new import statements
	const imports: string[] = [];
	imports.push(`import { createCollection } from '${packageName}/core';`);

	// Deduplicate modules (e.g., sortBy and sortByDesc share a module)
	const modules = new Set<string>();

	for (const method of usedMethods) {
		const moduleName = METHOD_TO_MODULE[method] ?? method;
		if (!modules.has(moduleName)) {
			modules.add(moduleName);
			imports.push(`import ${moduleName}Method from '${packageName}/methods/${moduleName}';`);
		}
	}

	// Add named imports for aliased methods
	for (const method of usedMethods) {
		if (METHOD_TO_MODULE[method]) {
			const moduleName = METHOD_TO_MODULE[method];
			const namedImportRegex = new RegExp(`import\\s+\\{[^}]*${method}Method[^}]*\\}`);
			if (!namedImportRegex.test(imports.join('\n'))) {
				const idx = imports.findIndex((i) => i.includes(`/${moduleName}';`) || i.includes(`/${moduleName}";`));
				if (idx > 0) {
					imports[idx] = `import ${moduleName}Method, { ${method}Method } from '${packageName}/methods/${moduleName}';`;
				}
			}
		}
	}

	// Build the createCollection call
	const methodList = Array.from(usedMethods)
		.map((m) => `${m}Method`)
		.join(', ');
	const collectDecl = `const collect = createCollection([${methodList}]);`;

	// Replace the original import
	const importRegex = new RegExp(
		`import\\s*\\{[^}]*\\bcollect\\b[^}]*\\}\\s*from\\s*['"]${escapeRegex(packageName)}['"]\\s*;?`,
	);

	const newImportBlock = imports.join('\n') + '\n' + collectDecl;

	return code.replace(importRegex, newImportBlock);
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a file should be transformed.
 */
export function shouldTransform(id: string): boolean {
	return /\.[jt]sx?$/.test(id) && !id.includes('node_modules');
}
