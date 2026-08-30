/**
 * Webpack loader for collect-ts tree-shaking.
 * Used internally by the webpack plugin.
 */

import { transform, type TransformOptions } from './transform.js';

interface LoaderContext {
	getOptions(): TransformOptions & { plugin?: unknown };
	resourcePath: string;
	callback(err: Error | null, content?: string, map?: unknown): void;
}

export default function loader(this: LoaderContext, source: string): void {
	const options = this.getOptions();
	const result = transform(source, options);

	if (result) {
		this.callback(null, result.code, result.map);
	} else {
		this.callback(null, source);
	}
}
