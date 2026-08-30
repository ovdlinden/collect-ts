/**
 * Core module - minimal Collection infrastructure for tree-shaking.
 *
 * @example
 * import { createCollection, CoreCollection } from 'collect-ts/core';
 * import filterMethod from 'collect-ts/methods/filter';
 *
 * const collect = createCollection([filterMethod]);
 */

// Types
export {
	COLLECTION_BRAND,
	isCollection,
	isPlainObject,
	type Arrayable,
	type Collectable,
	type CollectInput,
	type Collapse,
	type CollectionKey,
	type CollectionKind,
	type CollectionLike,
	type CollectionParam,
	type FlattenDepth,
	type Path,
	type PathValue,
	type ValueRetriever,
	type WhereOperator,
} from './types.js';

// Utils
export { dataGet, operatorForWhere, toGroupKey, useAsCallable, valueRetriever } from './utils.js';

// Pipeline
export { allOpsCompilable, chooseExecutionMode, runPipeline, type ExecutionMode, type Operation } from './pipeline.js';

// Core Collection
export { CoreCollection, collectionMacros } from './Collection.js';

// Factory
export { createCollection, extendCollection, type MethodDefinition } from './createCollection.js';
