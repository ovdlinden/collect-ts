import { Collection } from '../src/Collection.js';
import { createBehavioralTests } from './shared/collection-behavior.js';

createBehavioralTests(
	'Collection',
	(items) => new Collection(items),
	(c) => (c as Collection<unknown>).values().all(),
);
