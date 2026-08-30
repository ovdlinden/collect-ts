/**
 * Method definitions barrel export.
 * For tree-shaking, import individual methods instead.
 */

// Category A: Standalone + Method
export { avg, avgMethod, averageMethod } from './avg.js';
export { chunk, chunkMethod } from './chunk.js';
export { collapse, collapseMethod } from './collapse.js';
export { concat, concatMethod } from './concat.js';
export { contains, containsMethod } from './contains.js';
export { count, countBy, countByMethod } from './count.js';
export { every, everyMethod } from './every.js';
export { except, exceptMethod } from './except.js';
export { filter, filterMethod } from './filter.js';
export { first, firstMethod } from './first.js';
export { flatMap, flatMapMethod } from './flatMap.js';
export { flatten, flattenMethod } from './flatten.js';
export { flip, flipMethod } from './flip.js';
export { groupBy, groupByMethod } from './groupBy.js';
export { join, joinMethod, implodeMethod } from './join.js';
export { keyBy, keyByMethod } from './keyBy.js';
export { keys, keysMethod } from './keys.js';
export { last, lastMethod } from './last.js';
export { map, mapMethod } from './map.js';
export { max, maxMethod } from './max.js';
export { merge, mergeMethod } from './merge.js';
export { min, minMethod } from './min.js';
export { only, onlyMethod } from './only.js';
export { partition, partitionMethod } from './partition.js';
export { pluck, pluckMethod } from './pluck.js';
export { reduce, reduceMethod } from './reduce.js';
export { reject, rejectMethod } from './reject.js';
export { reverse, reverseMethod } from './reverse.js';
export { shuffle, shuffleMethod } from './shuffle.js';
export { skip, skipMethod } from './skip.js';
export { slice, sliceMethod } from './slice.js';
export { some, someMethod } from './some.js';
export { sortBy, sortByMethod, sortByDescMethod } from './sortBy.js';
export { sum, sumMethod } from './sum.js';
export { take, takeMethod } from './take.js';
export { unique, uniqueMethod } from './unique.js';
export { values, valuesMethod } from './values.js';
export { where, whereMethod, whereStrictMethod } from './where.js';
export { whereIn, whereNotIn, whereInMethod, whereNotInMethod } from './whereIn.js';

// Category B: Method only
export { eachMethod } from './each.js';
export { tapMethod } from './tap.js';

// All method definitions for full builds
import avgMethod from './avg.js';
import { averageMethod } from './avg.js';
import chunkMethod from './chunk.js';
import collapseMethod from './collapse.js';
import concatMethod from './concat.js';
import containsMethod from './contains.js';
import countByMethod from './count.js';
import eachMethod from './each.js';
import everyMethod from './every.js';
import exceptMethod from './except.js';
import filterMethod from './filter.js';
import firstMethod from './first.js';
import flatMapMethod from './flatMap.js';
import flattenMethod from './flatten.js';
import flipMethod from './flip.js';
import groupByMethod from './groupBy.js';
import joinMethod from './join.js';
import { implodeMethod } from './join.js';
import keyByMethod from './keyBy.js';
import keysMethod from './keys.js';
import lastMethod from './last.js';
import mapMethod from './map.js';
import maxMethod from './max.js';
import mergeMethod from './merge.js';
import minMethod from './min.js';
import onlyMethod from './only.js';
import partitionMethod from './partition.js';
import pluckMethod from './pluck.js';
import reduceMethod from './reduce.js';
import rejectMethod from './reject.js';
import reverseMethod from './reverse.js';
import shuffleMethod from './shuffle.js';
import skipMethod from './skip.js';
import sliceMethod from './slice.js';
import someMethod from './some.js';
import sortByMethod from './sortBy.js';
import { sortByDescMethod } from './sortBy.js';
import sumMethod from './sum.js';
import takeMethod from './take.js';
import tapMethod from './tap.js';
import uniqueMethod from './unique.js';
import valuesMethod from './values.js';
import whereMethod from './where.js';
import { whereStrictMethod } from './where.js';
import whereInMethod from './whereIn.js';
import { whereNotInMethod } from './whereIn.js';

export const allMethods = [
	avgMethod,
	averageMethod,
	chunkMethod,
	collapseMethod,
	concatMethod,
	containsMethod,
	countByMethod,
	eachMethod,
	everyMethod,
	exceptMethod,
	filterMethod,
	firstMethod,
	flatMapMethod,
	flattenMethod,
	flipMethod,
	groupByMethod,
	implodeMethod,
	joinMethod,
	keyByMethod,
	keysMethod,
	lastMethod,
	mapMethod,
	maxMethod,
	mergeMethod,
	minMethod,
	onlyMethod,
	partitionMethod,
	pluckMethod,
	reduceMethod,
	rejectMethod,
	reverseMethod,
	shuffleMethod,
	skipMethod,
	sliceMethod,
	someMethod,
	sortByMethod,
	sortByDescMethod,
	sumMethod,
	takeMethod,
	tapMethod,
	uniqueMethod,
	valuesMethod,
	whereMethod,
	whereStrictMethod,
	whereInMethod,
	whereNotInMethod,
] as const;
