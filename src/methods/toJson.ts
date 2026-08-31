/**
 * toJson/toString methods - serialization.
 */

import type { CollectionKind, CoreCollection, MethodDefinition } from '../core/index.js';

/**
 * The `toJson` method converts the collection into a JSON serialized string.
 *
 * @returns JSON string representation
 *
 * @example
 * collect({ name: 'Taylor', age: 25 })
 *     .toJson()
 * // → '{"name":"Taylor","age":25}'
 *
 * @example With array:
 * collect([1, 2, 3])
 *     .toJson()
 * // → '[1,2,3]'
 *
 * @see {@link toPrettyJson} - Format with indentation
 * @see {@link all} - Get raw items
 *
 * @category Finding
 */
export const toJsonMethod: MethodDefinition<'toJson'> = {
	name: 'toJson',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): string {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return JSON.stringify(arr);
		}
		return JSON.stringify(this.getItems());
	},
};

/**
 * The `toPrettyJson` method converts the collection into a formatted JSON string
 * with indentation for readability.
 *
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 *
 * @example
 * collect({ name: 'Taylor', age: 25 })
 *     .toPrettyJson()
 * // → '{\n  "name": "Taylor",\n  "age": 25\n}'
 *
 * @example Custom indentation:
 * collect([1, 2, 3])
 *     .toPrettyJson(4)
 * // → '[\n    1,\n    2,\n    3\n]'
 *
 * @see {@link toJson} - Compact JSON
 *
 * @category Finding
 */
export const toPrettyJsonMethod: MethodDefinition<'toPrettyJson'> = {
	name: 'toPrettyJson',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>, indent = 2): string {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return JSON.stringify(arr, null, indent);
		}
		return JSON.stringify(this.getItems(), null, indent);
	},
};

/**
 * The `toString` method returns the collection as a string representation.
 * For arrays, items are joined with commas. For objects, returns JSON.
 *
 * @returns String representation
 *
 * @example With array:
 * collect([1, 2, 3])
 *     .toString()
 * // → '1,2,3'
 *
 * @example With object:
 * collect({ a: 1, b: 2 })
 *     .toString()
 * // → '{"a":1,"b":2}'
 *
 * @see {@link join} - Join with custom separator
 * @see {@link toJson} - JSON serialization
 *
 * @category Finding
 */
export const toStringMethod: MethodDefinition<'toString'> = {
	name: 'toString',
	chainable: false,
	fn<T, CK extends CollectionKind>(this: CoreCollection<T, CK>): string {
		const arr = this.getArrayItems();
		if (arr !== null) {
			return arr.join(',');
		}
		return JSON.stringify(this.getItems());
	},
};

export default toJsonMethod;
