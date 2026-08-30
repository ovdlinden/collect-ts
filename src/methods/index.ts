/**
 * Method definitions barrel export.
 * Used for non-tree-shakeable builds or manual method attachment.
 *
 * For tree-shaking, import individual methods:
 * import filterMethod from 'collect-ts/methods/filter';
 */

// Category A: Standalone + Method
export { filter, filterMethod } from './filter.js';
export { first, firstMethod } from './first.js';
export { groupBy, groupByMethod } from './groupBy.js';
export { map, mapMethod } from './map.js';
export { reduce, reduceMethod } from './reduce.js';

// Category B: Method only
export { eachMethod } from './each.js';
export { tapMethod } from './tap.js';

// Default exports for easier importing
export { default as filterDef } from './filter.js';
export { default as firstDef } from './first.js';
export { default as groupByDef } from './groupBy.js';
export { default as mapDef } from './map.js';
export { default as reduceDef } from './reduce.js';
export { default as eachDef } from './each.js';
export { default as tapDef } from './tap.js';

// All method definitions for full builds
import filterMethod from './filter.js';
import firstMethod from './first.js';
import groupByMethod from './groupBy.js';
import mapMethod from './map.js';
import reduceMethod from './reduce.js';
import eachMethod from './each.js';
import tapMethod from './tap.js';

export const allMethods = [
	filterMethod,
	firstMethod,
	groupByMethod,
	mapMethod,
	reduceMethod,
	eachMethod,
	tapMethod,
] as const;
