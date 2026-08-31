/**
 * Core module - minimal Collection infrastructure for tree-shaking.
 *
 * @example
 * import { createCollection, CoreCollection } from 'collect-ts/core';
 * import filterMethod from 'collect-ts/methods/filter';
 *
 * const collect = createCollection([filterMethod]);
 */

// Core Collection
export { CoreCollection, collectionMacros } from './Collection.js';
// Factory
export { createCollection, extendCollection, type MethodDefinition } from './createCollection.js';

// Pipeline
export { allOpsCompilable, chooseExecutionMode, type ExecutionMode, type Operation, runPipeline } from './pipeline.js';
// Types
export {
	type Arrayable,
	COLLECTION_BRAND,
	type Collapse,
	type Collectable,
	type CollectInput,
	type CollectionKey,
	type CollectionKind,
	type CollectionLike,
	type CollectionParam,
	type FlattenDepth,
	isCollection,
	isPlainObject,
	type Path,
	type PathValue,
	type ValueRetriever,
	type WhereOperator,
} from './types.js';
// Utils
export { dataGet, operatorForWhere, toGroupKey, useAsCallable, valueRetriever } from './utils.js';
