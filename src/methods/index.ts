/**
 * Method definitions barrel export.
 * For tree-shaking, import individual methods instead.
 */

// Phase 2: Additional migrated methods
export { addMethod, unshiftMethod } from './add.js';
export { afterMethod, beforeMethod } from './afterBefore.js';
// New method exports
export { allMethod, toArrayMethod } from './all.js';
// Category A: Standalone + Method
export { averageMethod, avg, avgMethod } from './avg.js';
export { chunk, chunkMethod } from './chunk.js';
export { chunkWhileMethod, collapseWithKeysMethod } from './chunkWhile.js';
export { collapse, collapseMethod } from './collapse.js';
export { collectMethod, toBaseMethod } from './collectMethod.js';
export { combineMethod, unionMethod, zipMethod } from './combine.js';
export { concat, concatMethod } from './concat.js';
export { contains, containsMethod } from './contains.js';
export { containsOneItemMethod, containsStrictMethod, doesntContainMethod } from './containsOneItem.js';
export { count, countBy, countByMethod, countMethod } from './count.js';
export { crossJoinMethod, multiplyMethod } from './crossJoin.js';
export {
	diffAssocMethod,
	diffAssocUsingMethod,
	diffKeysMethod,
	diffKeysUsingMethod,
	diffMethod,
	diffUsingMethod,
} from './diff.js';
export { dotMethod, undotMethod } from './dot.js';
export { ddMethod, dumpMethod } from './dump.js';
export { doesntContainStrictMethod, duplicatesMethod } from './duplicates.js';
export { duplicatesStrictMethod } from './duplicatesStrict.js';
// Category B: Method only
export { eachMethod } from './each.js';
export { eachSpreadMethod } from './eachSpread.js';
export { ensureMethod } from './ensure.js';
export { every, everyMethod } from './every.js';
export { except, exceptMethod } from './except.js';
export { filter, filterMethod } from './filter.js';
export { first, firstMethod } from './first.js';
export { firstOrFailMethod, firstWhereMethod, soleMethod } from './firstWhere.js';
export { flatMap, flatMapMethod } from './flatMap.js';
export { flatten, flattenMethod } from './flatten.js';
export { flip, flipMethod } from './flip.js';
export { getMethod } from './get.js';
export { getOrPutMethod, selectMethod } from './getOrPut.js';
export { groupBy, groupByMethod } from './groupBy.js';
export { hasAnyMethod, hasMethod } from './has.js';
export { hasManyMethod, hasSoleMethod } from './hasSole.js';
export {
	intersectAssocMethod,
	intersectAssocUsingMethod,
	intersectByKeysMethod,
	intersectMethod,
	intersectUsingMethod,
} from './intersect.js';
export { isEmptyMethod, isNotEmptyMethod } from './isEmpty.js';
export { implodeMethod, join, joinMethod } from './join.js';
export { keyBy, keyByMethod } from './keyBy.js';
export { keys, keysMethod } from './keys.js';
export { last, lastMethod } from './last.js';
export { lazyFirstMethod, lazyMethod } from './lazy.js';
export { map, mapMethod } from './map.js';
export { mapIntoMethod, mapSpreadMethod, mapWithKeysMethod } from './mapInto.js';
export { mapToDictionaryMethod, mapToGroupsMethod, mapWithKeyMethod } from './mapVariants.js';
export { max, maxMethod } from './max.js';
export { medianMethod, modeMethod } from './median.js';
export { merge, mergeMethod } from './merge.js';
export { mergeRecursiveMethod } from './mergeRecursive.js';
export { min, minMethod } from './min.js';
export { offsetExistsMethod, offsetGetMethod, offsetSetMethod, offsetUnsetMethod } from './offset.js';
export { only, onlyMethod } from './only.js';
export { padMethod, spliceMethod } from './pad.js';
export { partition, partitionMethod } from './partition.js';
export { percentageMethod } from './percentage.js';
export { pipeIntoMethod, pipeMethod, pipeThroughMethod } from './pipe.js';
export { pluck, pluckMethod } from './pluck.js';
export { popMethod, shiftMethod } from './pop.js';
export { forgetMethod, pullMethod } from './pull.js';
export { prependMethod, pushMethod, putMethod } from './put.js';
export { nthMethod, randomMethod } from './random.js';
export { reduce, reduceMethod } from './reduce.js';
export { reduceIntoMethod, reduceSpreadMethod, reduceWithKeysMethod } from './reduceVariants.js';
export { reject, rejectMethod } from './reject.js';
// Phase 3: Final method migrations
export { replaceMethod, replaceRecursiveMethod } from './replace.js';
export { reverse, reverseMethod } from './reverse.js';
export { searchMethod, valueMethod } from './search.js';
export { shuffle, shuffleMethod } from './shuffle.js';
export { skip, skipMethod } from './skip.js';
export { skipUntilMethod, skipWhileMethod, takeUntilMethod, takeWhileMethod } from './skipTake.js';
export { slice, sliceMethod } from './slice.js';
export { forPageMethod, slidingMethod } from './sliding.js';
export { some, someMethod } from './some.js';
export { sortDescMethod, sortKeysDescMethod, sortKeysMethod, sortKeysUsingMethod, sortMethod } from './sort.js';
export { sortBy, sortByDescMethod, sortByMethod } from './sortBy.js';
export { splitInMethod, splitMethod } from './split.js';
export { sum, sumMethod } from './sum.js';
export { take, takeMethod } from './take.js';
export { tapMethod } from './tap.js';
export { toJsonMethod, toPrettyJsonMethod, toStringMethod } from './toJson.js';
export { transformMethod } from './transform.js';
export { unique, uniqueMethod } from './unique.js';
export { uniqueStrictMethod } from './uniqueStrict.js';
export { values, valuesMethod } from './values.js';
export {
	unlessEmptyMethod,
	unlessMethod,
	unlessNotEmptyMethod,
	whenEmptyMethod,
	whenMethod,
	whenNotEmptyMethod,
} from './when.js';
export { where, whereMethod, whereStrictMethod } from './where.js';
export { whereBetweenMethod } from './whereBetween.js';
export { whereIn, whereInMethod, whereNotIn, whereNotInMethod } from './whereIn.js';
export { whereInStrictMethod, whereInstanceOfMethod, whereNotInStrictMethod } from './whereInstance.js';
export { whereNotBetweenMethod } from './whereNotBetween.js';
export { whereNotNullMethod, whereNullMethod } from './whereNull.js';
export { WithCollection, withMethod } from './with.js';

// Phase 2 imports
import addMethod, { unshiftMethod } from './add.js';
import afterMethod, { beforeMethod } from './afterBefore.js';
// New method imports
import allMethod, { toArrayMethod } from './all.js';
// All method definitions for full builds
import avgMethod, { averageMethod } from './avg.js';
import chunkMethod from './chunk.js';
import chunkWhileMethod, { collapseWithKeysMethod } from './chunkWhile.js';
import collapseMethod from './collapse.js';
import collectMethod, { toBaseMethod } from './collectMethod.js';
import combineMethod, { unionMethod, zipMethod } from './combine.js';
import concatMethod from './concat.js';
import containsMethod from './contains.js';
import containsOneItemMethod, { containsStrictMethod, doesntContainMethod } from './containsOneItem.js';
import countByMethod, { countMethod } from './count.js';
import crossJoinMethod, { multiplyMethod } from './crossJoin.js';
import diffMethod, {
	diffAssocMethod,
	diffAssocUsingMethod,
	diffKeysMethod,
	diffKeysUsingMethod,
	diffUsingMethod,
} from './diff.js';
import dotMethod, { undotMethod } from './dot.js';
import dumpMethod, { ddMethod } from './dump.js';
import duplicatesMethod, { doesntContainStrictMethod } from './duplicates.js';
import duplicatesStrictMethod from './duplicatesStrict.js';
import eachMethod from './each.js';
import eachSpreadMethod from './eachSpread.js';
import ensureMethod from './ensure.js';
import everyMethod from './every.js';
import exceptMethod from './except.js';
import filterMethod from './filter.js';
import firstMethod from './first.js';
import firstWhereMethod, { firstOrFailMethod, soleMethod } from './firstWhere.js';
import flatMapMethod from './flatMap.js';
import flattenMethod from './flatten.js';
import flipMethod from './flip.js';
import getMethod from './get.js';
import getOrPutMethod, { selectMethod } from './getOrPut.js';
import groupByMethod from './groupBy.js';
import hasMethod, { hasAnyMethod } from './has.js';
import hasSoleMethod, { hasManyMethod } from './hasSole.js';
import intersectMethod, {
	intersectAssocMethod,
	intersectAssocUsingMethod,
	intersectByKeysMethod,
	intersectUsingMethod,
} from './intersect.js';
import isEmptyMethod, { isNotEmptyMethod } from './isEmpty.js';
import joinMethod, { implodeMethod } from './join.js';
import keyByMethod from './keyBy.js';
import keysMethod from './keys.js';
import lastMethod from './last.js';
import lazyMethod, { lazyFirstMethod } from './lazy.js';
import mapMethod from './map.js';
import mapIntoMethod, { mapSpreadMethod, mapWithKeysMethod } from './mapInto.js';
import mapToDictionaryMethod, { mapToGroupsMethod, mapWithKeyMethod } from './mapVariants.js';
import maxMethod from './max.js';
import medianMethod, { modeMethod } from './median.js';
import mergeMethod from './merge.js';
import mergeRecursiveMethod from './mergeRecursive.js';
import minMethod from './min.js';
import { offsetExistsMethod, offsetGetMethod, offsetSetMethod, offsetUnsetMethod } from './offset.js';
import onlyMethod from './only.js';
import padMethod, { spliceMethod } from './pad.js';
import partitionMethod from './partition.js';
import percentageMethod from './percentage.js';
import pipeMethod, { pipeIntoMethod, pipeThroughMethod } from './pipe.js';
import pluckMethod from './pluck.js';
import popMethod, { shiftMethod } from './pop.js';
import pullMethod, { forgetMethod } from './pull.js';
import putMethod, { prependMethod, pushMethod } from './put.js';
import randomMethod, { nthMethod } from './random.js';
import reduceMethod from './reduce.js';
import reduceIntoMethod, { reduceSpreadMethod, reduceWithKeysMethod } from './reduceVariants.js';
import rejectMethod from './reject.js';
// Phase 3 imports
import replaceMethod, { replaceRecursiveMethod } from './replace.js';
import reverseMethod from './reverse.js';
import searchMethod, { valueMethod } from './search.js';
import shuffleMethod from './shuffle.js';
import skipMethod from './skip.js';
import skipUntilMethod, { skipWhileMethod, takeUntilMethod, takeWhileMethod } from './skipTake.js';
import sliceMethod from './slice.js';
import slidingMethod, { forPageMethod } from './sliding.js';
import someMethod from './some.js';
import sortMethod, { sortDescMethod, sortKeysDescMethod, sortKeysMethod, sortKeysUsingMethod } from './sort.js';
import sortByMethod, { sortByDescMethod } from './sortBy.js';
import splitMethod, { splitInMethod } from './split.js';
import sumMethod from './sum.js';
import takeMethod from './take.js';
import tapMethod from './tap.js';
import toJsonMethod, { toPrettyJsonMethod, toStringMethod } from './toJson.js';
import transformMethod from './transform.js';
import uniqueMethod from './unique.js';
import uniqueStrictMethod from './uniqueStrict.js';
import valuesMethod from './values.js';
import whenMethod, {
	unlessEmptyMethod,
	unlessMethod,
	unlessNotEmptyMethod,
	whenEmptyMethod,
	whenNotEmptyMethod,
} from './when.js';
import whereMethod, { whereStrictMethod } from './where.js';
import whereBetweenMethod from './whereBetween.js';
import whereInMethod, { whereNotInMethod } from './whereIn.js';
import whereInstanceOfMethod, { whereInStrictMethod, whereNotInStrictMethod } from './whereInstance.js';
import whereNotBetweenMethod from './whereNotBetween.js';
import whereNullMethod, { whereNotNullMethod } from './whereNull.js';
import withMethod from './with.js';

export const allMethods = [
	// Original methods
	avgMethod,
	averageMethod,
	chunkMethod,
	collapseMethod,
	concatMethod,
	containsMethod,
	countMethod,
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
	// New methods
	allMethod,
	toArrayMethod,
	collectMethod,
	toBaseMethod,
	combineMethod,
	unionMethod,
	zipMethod,
	containsOneItemMethod,
	containsStrictMethod,
	doesntContainMethod,
	diffMethod,
	diffKeysMethod,
	diffAssocMethod,
	dotMethod,
	undotMethod,
	dumpMethod,
	ddMethod,
	duplicatesStrictMethod,
	eachSpreadMethod,
	ensureMethod,
	firstWhereMethod,
	firstOrFailMethod,
	soleMethod,
	getMethod,
	hasMethod,
	hasAnyMethod,
	intersectMethod,
	intersectByKeysMethod,
	isEmptyMethod,
	isNotEmptyMethod,
	lazyMethod,
	mapIntoMethod,
	mapSpreadMethod,
	mapWithKeysMethod,
	medianMethod,
	modeMethod,
	offsetExistsMethod,
	offsetGetMethod,
	offsetSetMethod,
	offsetUnsetMethod,
	padMethod,
	spliceMethod,
	pipeMethod,
	pipeIntoMethod,
	pipeThroughMethod,
	popMethod,
	shiftMethod,
	pullMethod,
	forgetMethod,
	putMethod,
	pushMethod,
	prependMethod,
	randomMethod,
	nthMethod,
	searchMethod,
	valueMethod,
	sortMethod,
	sortDescMethod,
	sortKeysMethod,
	sortKeysDescMethod,
	toJsonMethod,
	toPrettyJsonMethod,
	toStringMethod,
	transformMethod,
	whenMethod,
	unlessMethod,
	whenEmptyMethod,
	whenNotEmptyMethod,
	unlessEmptyMethod,
	unlessNotEmptyMethod,
	whereBetweenMethod,
	whereNotBetweenMethod,
	whereNullMethod,
	whereNotNullMethod,
	// Phase 2 methods
	addMethod,
	unshiftMethod,
	afterMethod,
	beforeMethod,
	skipUntilMethod,
	skipWhileMethod,
	takeUntilMethod,
	takeWhileMethod,
	slidingMethod,
	forPageMethod,
	crossJoinMethod,
	multiplyMethod,
	chunkWhileMethod,
	collapseWithKeysMethod,
	splitMethod,
	splitInMethod,
	uniqueStrictMethod,
	duplicatesMethod,
	doesntContainStrictMethod,
	percentageMethod,
	getOrPutMethod,
	selectMethod,
	whereInstanceOfMethod,
	whereInStrictMethod,
	whereNotInStrictMethod,
	hasManyMethod,
	hasSoleMethod,
	mapToDictionaryMethod,
	mapToGroupsMethod,
	mapWithKeyMethod,
	reduceIntoMethod,
	reduceSpreadMethod,
	reduceWithKeysMethod,
	// Phase 3 methods
	diffUsingMethod,
	diffKeysUsingMethod,
	diffAssocUsingMethod,
	intersectUsingMethod,
	intersectAssocMethod,
	intersectAssocUsingMethod,
	sortKeysUsingMethod,
	lazyFirstMethod,
	replaceMethod,
	replaceRecursiveMethod,
	mergeRecursiveMethod,
	withMethod,
] as const;
