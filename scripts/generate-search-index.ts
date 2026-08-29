import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import { collect } from '../src/Collection';

interface MethodData {
	name: string;
	category: string;
	description: string;
	signature: string;
}

interface SearchEntry {
	id: string;
	title: string;
	titles: string[];
	text: string;
	signature?: string;
	aliases?: string;
}

const METHOD_ALIASES: Record<string, string[]> = {
	// Finding
	get: ['find', 'retrieve', 'fetch', 'lookup'],
	first: ['head', 'front', 'find'],
	firstOrFail: ['findOrFail'],
	last: ['tail', 'end'],
	find: ['lookup', 'search'],
	firstWhere: ['findWhere'],
	sole: ['only', 'single', 'one'],

	// Removing
	forget: ['remove', 'delete', 'unset', 'drop'],
	pull: ['remove', 'extract', 'pop'],
	reject: ['remove', 'exclude', 'omit', 'filterOut'],
	except: ['omit', 'exclude', 'without'],
	skip: ['offset', 'drop'],
	skipUntil: ['dropUntil'],
	skipWhile: ['dropWhile'],

	// Iteration
	each: ['forEach', 'loop', 'iterate', 'walk'],
	eachSpread: ['forEachSpread'],
	map: ['transform', 'convert', 'apply'],
	mapSpread: ['transformSpread'],
	mapWithKeys: ['mapToObject', 'keyBy'],
	transform: ['mutate', 'modify'],

	// Extraction
	pluck: ['extract', 'pick', 'select', 'column'],
	only: ['pick', 'select', 'include'],
	value: ['scalar', 'unwrap'],
	values: ['toArray', 'list'],
	keys: ['indices', 'properties'],

	// Grouping
	chunk: ['split', 'batch', 'partition', 'paginate'],
	chunkWhile: ['splitWhile'],
	groupBy: ['group', 'categorize', 'bucket'],
	partition: ['split', 'divide', 'separate'],
	splitIn: ['divide', 'chunk'],

	// Checking
	contains: ['has', 'includes', 'exists', 'in'],
	containsStrict: ['hasStrict', 'includesStrict'],
	doesntContain: ['notContains', 'missing', 'excludes'],
	has: ['exists', 'contains', 'hasKey'],
	hasAny: ['hasOneOf', 'containsAny'],
	isEmpty: ['empty', 'blank', 'none'],
	isNotEmpty: ['notEmpty', 'hasItems', 'any'],
	some: ['any', 'exists'],
	every: ['all', 'each'],

	// Aggregating
	sum: ['total', 'add'],
	avg: ['average', 'mean'],
	average: ['avg', 'mean'],
	count: ['length', 'size', 'total'],
	countBy: ['groupCount', 'tally'],
	min: ['minimum', 'lowest', 'smallest'],
	max: ['maximum', 'highest', 'largest'],
	median: ['middle'],
	mode: ['mostCommon', 'frequent'],

	// Sorting
	sort: ['order', 'arrange'],
	sortBy: ['orderBy'],
	sortByDesc: ['orderByDesc', 'sortByDescending'],
	sortDesc: ['sortDescending', 'reverse'],
	sortKeys: ['ksort', 'orderKeys'],
	sortKeysDesc: ['krsort'],
	shuffle: ['randomize', 'scramble'],
	random: ['sample', 'pick'],
	reverse: ['flip', 'invert'],

	// Combining
	merge: ['combine', 'extend', 'assign'],
	mergeRecursive: ['deepMerge'],
	concat: ['append', 'join', 'add'],
	union: ['merge', 'combine', 'dedupe'],
	combine: ['zip', 'pair'],
	zip: ['combine', 'pair', 'zipWith'],
	crossJoin: ['cartesian', 'product'],
	join: ['implode', 'glue', 'concatenate'],
	implode: ['join', 'glue'],

	// Transforming
	flatten: ['flat', 'unwrap'],
	flatMap: ['flattenMap', 'mapFlat'],
	collapse: ['flatten', 'merge'],
	unique: ['distinct', 'dedupe', 'deduplicate'],
	uniqueStrict: ['distinctStrict'],
	duplicates: ['repeated', 'copies'],
	flip: ['swap', 'invert'],
	pad: ['fill', 'extend'],
	replace: ['substitute', 'swap'],
	splice: ['insert', 'remove'],
	put: ['set', 'add', 'insert'],
	prepend: ['unshift', 'addFirst'],
	push: ['append', 'add', 'addLast'],
	pop: ['removeLast', 'last'],
	shift: ['removeFirst', 'first'],

	// Filtering
	filter: ['where', 'select', 'keep'],
	where: ['filter', 'match'],
	whereStrict: ['filterStrict'],
	whereBetween: ['range', 'inRange'],
	whereIn: ['inArray', 'oneOf'],
	whereNotIn: ['notInArray', 'notOneOf'],
	whereNull: ['nulls', 'filterNull'],
	whereNotNull: ['notNull', 'filterNotNull'],
	whereInstanceOf: ['ofType', 'instanceof'],
	take: ['limit', 'first', 'head'],
	takeUntil: ['limitUntil'],
	takeWhile: ['limitWhile'],
	slice: ['subset', 'range'],
	nth: ['everyNth', 'step'],

	// Other
	tap: ['debug', 'inspect', 'peek'],
	pipe: ['chain', 'through', 'apply'],
	pipeInto: ['into', 'pipeTo'],
	when: ['if', 'conditional'],
	whenEmpty: ['ifEmpty'],
	whenNotEmpty: ['ifNotEmpty'],
	unless: ['ifNot', 'except'],
	dd: ['dump', 'debug', 'die'],
	dump: ['log', 'debug', 'print'],
	toJson: ['serialize', 'stringify'],
	toArray: ['array', 'all'],
	all: ['toArray', 'unwrap'],
	lazy: ['defer', 'stream', 'generator'],
	collect: ['eager', 'materialize'],
};

const CATEGORY_TITLES: Record<string, string> = {
	creating: 'Creating',
	filtering: 'Filtering',
	transforming: 'Transforming',
	grouping: 'Grouping',
	aggregating: 'Aggregating',
	finding: 'Finding',
	sorting: 'Sorting',
	combining: 'Combining',
	checking: 'Checking',
};

const docsDir = join(import.meta.dirname, '../docs');
const methodsPath = join(docsDir, '.vitepress/theme/data/methods.json');
const outputPath = join(docsDir, '.vitepress/theme/data/search-index.json');

// Load pre-parsed method data from generate-collection-guides.ts
const methods: MethodData[] = JSON.parse(readFileSync(methodsPath, 'utf-8'));
console.log(`Loaded ${methods.length} methods from methods.json`);

// Build search index entries
const searchIndex: SearchEntry[] = collect(methods)
	.map((m) => {
		const aliases = METHOD_ALIASES[m.name];
		return {
			id: `/collections/${m.category}#${m.name.toLowerCase()}`,
			title: `${m.name}()`,
			titles: [CATEGORY_TITLES[m.category] || m.category, `${m.name}()`],
			text: m.description,
			signature: m.signature,
			aliases: aliases?.join(' '),
		};
	})
	.all();

// Build MiniSearch index with unique numeric IDs
const miniSearch = new MiniSearch<SearchEntry & { _id: number }>({
	idField: '_id',
	fields: ['title', 'text', 'signature', 'aliases'],
	storeFields: ['id', 'title', 'titles', 'text', 'signature'],
	searchOptions: {
		boost: { title: 3, signature: 2, aliases: 1.5, text: 1 },
		prefix: true,
		fuzzy: 0.2,
	},
});

miniSearch.addAll(
	collect(searchIndex)
		.map((entry, i) => ({ ...entry, _id: i }))
		.all(),
);

// Export serialized index
writeFileSync(outputPath, JSON.stringify(miniSearch.toJSON(), null, '\t'));
console.log(`Generated MiniSearch index with ${searchIndex.length} entries`);
