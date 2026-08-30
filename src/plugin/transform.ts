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

/**
 * Transform source code to use tree-shakeable imports.
 * Uses regex-based parsing for simplicity and speed.
 */
export function transform(code: string, options: TransformOptions = {}): TransformResult | null {
	const packageName = options.packageName ?? 'collect-ts';

	// Quick check: does this file import from our package?
	const importRegex = new RegExp(
		`import\\s*\\{[^}]*\\bcollect\\b[^}]*\\}\\s*from\\s*['"]${escapeRegex(packageName)}['"]`,
	);
	if (!importRegex.test(code)) {
		return null; // No transformation needed
	}

	// Find all method calls on collect() results
	const usedMethods = findUsedMethods(code);
	if (usedMethods.size === 0) {
		return null; // No methods to tree-shake
	}

	// Generate the transformed code
	const transformedCode = rewriteImports(code, packageName, usedMethods);

	return {
		code: transformedCode,
		usedMethods: Array.from(usedMethods),
	};
}

/**
 * Find all Collection methods used in the code.
 * Looks for patterns like `.methodName(` after collect() calls.
 */
function findUsedMethods(code: string): Set<string> {
	const methods = new Set<string>();

	// Match method calls: .methodName( or .methodName.property (for HOM)
	// This regex finds potential method calls after collect()
	const methodCallRegex = /\.(\w+)\s*[(.]/g;
	let match: RegExpExecArray | null;

	while ((match = methodCallRegex.exec(code)) !== null) {
		const methodName = match[1];
		if (KNOWN_METHODS.has(methodName)) {
			methods.add(methodName);
		}
	}

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
	const methodImports: string[] = [];

	for (const method of usedMethods) {
		const moduleName = METHOD_TO_MODULE[method] ?? method;
		if (!modules.has(moduleName)) {
			modules.add(moduleName);
			imports.push(`import ${moduleName}Method from '${packageName}/methods/${moduleName}';`);
		}
		// For aliased methods, import the specific export
		if (METHOD_TO_MODULE[method]) {
			methodImports.push(`${method}Method`);
		}
	}

	// Add named imports for aliased methods
	for (const method of usedMethods) {
		if (METHOD_TO_MODULE[method]) {
			const moduleName = METHOD_TO_MODULE[method];
			// Check if we need to add a named import
			const namedImportRegex = new RegExp(`import\\s+\\{[^}]*${method}Method[^}]*\\}`);
			if (!namedImportRegex.test(imports.join('\n'))) {
				// Find and update the module import to include the named export
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
	// Only transform JS/TS files, skip node_modules
	return /\.[jt]sx?$/.test(id) && !id.includes('node_modules');
}
