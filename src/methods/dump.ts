/**
 * dump/dd methods - debugging utilities.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `dump` method outputs the collection's items to the console and returns the
 * collection, allowing you to inspect the contents at any point in a method chain
 * without interrupting the flow.
 *
 * @param label - Optional label to display with the output
 * @returns The collection (for chaining)
 *
 * @example Debug mid-chain:
 * collect([1, 2, 3])
 *     .map(n => n * 2)
 *     .dump()              // Logs: [2, 4, 6]
 *     .filter(n => n > 3)
 *     .all()
 * // → [4, 6]
 *
 * @example With a label:
 * collect([1, 2, 3])
 *     .dump('before filter')
 *     .filter(n => n > 1)
 *     .dump('after filter')
 *     .all()
 * // Logs: [1, 2, 3] 'before filter'
 * // Logs: [2, 3] 'after filter'
 *
 * @see {@link dd} - Dump and halt execution
 * @see {@link tap} - Execute any callback mid-chain
 *
 * @category Transforming
 */
export const dumpMethod: MethodDefinition<'dump'> = {
	name: 'dump',
	chainable: true,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, label?: string): CoreCollection<T, CK> {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (label) {
			console.log(items, label);
		} else {
			console.log(items);
		}

		return this;
	},
};

/**
 * The `dd` method outputs the collection's items to the console and then throws
 * an error to halt script execution. This is useful for debugging when you want
 * to inspect the collection and stop processing. The name comes from "dump and die."
 *
 * @param label - Optional label to display with the output
 * @throws Always throws after dumping
 *
 * @example
 * collect([1, 2, 3])
 *     .map(n => n * 2)
 *     .dd()  // Logs: [2, 4, 6], then throws
 *     .filter(n => n > 3)  // Never reached
 *
 * @example With a label:
 * collect(users)
 *     .filter(u => u.active)
 *     .dd('active users')  // Logs active users, then throws
 *
 * @see {@link dump} - Dump without halting
 *
 * @category Transforming
 */
export const ddMethod: MethodDefinition<'dd'> = {
	name: 'dd',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, label?: string): never {
		const arr = this.getArrayItems();
		const items = arr ?? Object.values(this.getItems());

		if (label) {
			console.log(items, label);
		} else {
			console.log(items);
		}

		throw new Error('dd() called - execution halted');
	},
};

export default dumpMethod;
