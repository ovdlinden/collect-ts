/**
 * Unplugin for tree-shakeable Collection imports.
 *
 * Automatically transforms:
 *   import { collect } from 'collect-ts';
 *   collect(users).filter().map();
 *
 * Into tree-shakeable imports that only include used methods.
 *
 * @example Vite
 * ```ts
 * import { vite as collectionPlugin } from 'collect-ts/plugin';
 * export default { plugins: [collectionPlugin()] };
 * ```
 *
 * @example Webpack
 * ```js
 * const { webpack: collectionPlugin } = require('collect-ts/plugin');
 * module.exports = { plugins: [collectionPlugin()] };
 * ```
 *
 * @example Rollup
 * ```js
 * import { rollup as collectionPlugin } from 'collect-ts/plugin';
 * export default { plugins: [collectionPlugin()] };
 * ```
 */

import { transform, shouldTransform, type TransformOptions } from './transform.js';

export interface PluginOptions extends TransformOptions {
	/** File patterns to include (default: /\.[jt]sx?$/) */
	include?: RegExp | string | (RegExp | string)[];
	/** File patterns to exclude (default: /node_modules/) */
	exclude?: RegExp | string | (RegExp | string)[];
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Create the collection tree-shake plugin for any bundler.
 * Uses the unplugin pattern for cross-bundler compatibility.
 */
export function createPlugin(options: PluginOptions = {}) {
	const { debug = false, ...transformOptions } = options;

	return {
		name: 'collect-ts-treeshake',

		transformInclude(id: string): boolean {
			return shouldTransform(id);
		},

		transform(code: string, id: string): { code: string; map?: unknown } | null {
			const result = transform(code, transformOptions);

			if (result && debug) {
				console.log(`[collect-ts] Transformed ${id}`);
				console.log(`  Methods: ${result.usedMethods.join(', ')}`);
			}

			return result;
		},
	};
}

// Vite plugin
export function vite(options: PluginOptions = {}) {
	const plugin = createPlugin(options);
	return {
		name: plugin.name,
		transform(code: string, id: string) {
			if (!plugin.transformInclude(id)) return null;
			return plugin.transform(code, id);
		},
	};
}

// Rollup plugin
export function rollup(options: PluginOptions = {}) {
	const plugin = createPlugin(options);
	return {
		name: plugin.name,
		transform(code: string, id: string) {
			if (!plugin.transformInclude(id)) return null;
			return plugin.transform(code, id);
		},
	};
}

// Webpack plugin (loader-based)
export function webpack(options: PluginOptions = {}) {
	const plugin = createPlugin(options);

	return {
		apply(compiler: { options: { module: { rules: unknown[] } } }) {
			compiler.options.module.rules.push({
				test: /\.[jt]sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve('./webpack-loader.js'),
						options: { plugin, ...options },
					},
				],
			});
		},
	};
}

// esbuild plugin
export function esbuild(options: PluginOptions = {}) {
	const plugin = createPlugin(options);

	return {
		name: plugin.name,
		setup(build: {
			onLoad: (
				opts: { filter: RegExp; namespace?: string },
				cb: (args: { path: string }) => Promise<{ contents: string; loader: string } | undefined>,
			) => void;
		}) {
			build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: { path: string }) => {
				if (args.path.includes('node_modules')) return undefined;

				const fs = await import('node:fs/promises');
				const code = await fs.readFile(args.path, 'utf8');
				const result = plugin.transform(code, args.path);

				if (result) {
					return {
						contents: result.code,
						loader: args.path.endsWith('.ts') || args.path.endsWith('.tsx') ? 'ts' : 'js',
					};
				}
				return undefined;
			});
		},
	};
}

// Re-export transform utilities
export { transform, shouldTransform, type TransformOptions, type TransformResult } from './transform.js';

// Default export for convenience
export default createPlugin;
