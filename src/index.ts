/**
 * @see https://laravel.com/docs/collections
 */

export const VERSION = '0.4.0' as const;
export const LARAVEL_COLLECTION_VERSION = '12.43' as const;

export type {
	Arrayable,
	Collapse,
	Collectable,
	CollectedState,
	CollectionKey,
	CollectionKind,
	CollectionLike,
	CollectionMacros,
	CollectionParam,
	FlattenDepth,
	Path,
	PathValue,
	ProxiedArrayCollection,
	ProxiedCollection,
	ValueRetriever,
	WhereOperator,
} from './Collection.js';
export {
	COLLECTION_BRAND,
	Collection,
	collect,
	collectState,
	isCollection,
	toArray,
	WithCollection,
	wrapWithProxy,
} from './Collection.js';

export {
	InvalidArgumentException,
	ItemNotFoundException,
	MultipleItemsFoundException,
	UnexpectedValueException,
} from './exceptions/index.js';

export type {
	AsyncCollectionMacros,
	GeneratorFactory,
	ProxiedAsyncLazyCollection,
	ProxiedLazyCollection,
} from './LazyCollection.js';
export {
	AsyncLazyCollection,
	asyncLazy,
	isAsyncLazyCollection,
	isLazyCollection,
	LazyCollection,
	lazy,
} from './LazyCollection.js';
