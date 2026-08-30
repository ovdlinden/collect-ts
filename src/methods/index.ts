/**
 * Method definitions barrel export.
 * Used for non-tree-shakeable builds or manual method attachment.
 *
 * For tree-shaking, import individual methods:
 * import filterMethod from 'collect-ts/methods/filter';
 */

// Category A: Standalone + Method
export { avg, avgMethod, averageMethod } from './avg.js';
export { chunk, chunkMethod } from './chunk.js';
export { contains, containsMethod } from './contains.js';
export { every, everyMethod } from './every.js';
export { filter, filterMethod } from './filter.js';
export { first, firstMethod } from './first.js';
export { flatMap, flatMapMethod } from './flatMap.js';
export { groupBy, groupByMethod } from './groupBy.js';
export { keyBy, keyByMethod } from './keyBy.js';
export { last, lastMethod } from './last.js';
export { map, mapMethod } from './map.js';
export { max, maxMethod } from './max.js';
export { min, minMethod } from './min.js';
export { partition, partitionMethod } from './partition.js';
export { pluck, pluckMethod } from './pluck.js';
export { reduce, reduceMethod } from './reduce.js';
export { reject, rejectMethod } from './reject.js';
export { skip, skipMethod } from './skip.js';
export { some, someMethod } from './some.js';
export { sortBy, sortByMethod, sortByDescMethod } from './sortBy.js';
export { sum, sumMethod } from './sum.js';
export { take, takeMethod } from './take.js';
export { unique, uniqueMethod } from './unique.js';

// Category B: Method only
export { eachMethod } from './each.js';
export { tapMethod } from './tap.js';

// Default exports for easier importing
import avgMethod from './avg.js';
import chunkMethod from './chunk.js';
import containsMethod from './contains.js';
import eachMethod from './each.js';
import everyMethod from './every.js';
import filterMethod from './filter.js';
import firstMethod from './first.js';
import flatMapMethod from './flatMap.js';
import groupByMethod from './groupBy.js';
import keyByMethod from './keyBy.js';
import lastMethod from './last.js';
import mapMethod from './map.js';
import maxMethod from './max.js';
import minMethod from './min.js';
import partitionMethod from './partition.js';
import pluckMethod from './pluck.js';
import reduceMethod from './reduce.js';
import rejectMethod from './reject.js';
import skipMethod from './skip.js';
import someMethod from './some.js';
import sortByMethod from './sortBy.js';
import { sortByDescMethod } from './sortBy.js';
import { averageMethod } from './avg.js';
import sumMethod from './sum.js';
import takeMethod from './take.js';
import tapMethod from './tap.js';
import uniqueMethod from './unique.js';

export const allMethods = [
	avgMethod,
	averageMethod,
	chunkMethod,
	containsMethod,
	eachMethod,
	everyMethod,
	filterMethod,
	firstMethod,
	flatMapMethod,
	groupByMethod,
	keyByMethod,
	lastMethod,
	mapMethod,
	maxMethod,
	minMethod,
	partitionMethod,
	pluckMethod,
	reduceMethod,
	rejectMethod,
	skipMethod,
	someMethod,
	sortByMethod,
	sortByDescMethod,
	sumMethod,
	takeMethod,
	tapMethod,
	uniqueMethod,
] as const;
