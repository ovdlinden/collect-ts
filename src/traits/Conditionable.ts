/**
 * Conditionable Trait
 *
 * Matches Laravel's Illuminate\Support\Traits\Conditionable
 *
 * @example
 * ```ts
 * collect(users)
 *   .when(isAdmin, (c, isAdmin) => c.filter(u => u.admin))
 *   .when(search, (c, search) => c.filter(u => u.name.includes(search)))
 * ```
 */

// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixin pattern requires any[] for constructor rest parameter
type Constructor<T = object> = new (...args: any[]) => T;

export function Conditionable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		/**
		 * Apply callback when value is truthy.
		 *
		 * @param value - Any value or callback that returns a value (truthy check)
		 * @param callback - Receives (self, resolvedValue), called when truthy
		 * @param defaultCallback - Receives (self, resolvedValue), called when falsy
		 */
		when<T, V>(
			this: T,
			value: V | ((self: T) => V),
			callback?: (self: T, value: V) => T,
			defaultCallback?: (self: T, value: V) => T,
		): T {
			const resolvedValue = typeof value === 'function' ? (value as (self: T) => V)(this) : value;

			if (resolvedValue) {
				return callback ? callback(this, resolvedValue) : this;
			}
			return defaultCallback ? defaultCallback(this, resolvedValue) : this;
		}

		/**
		 * Apply callback when value is falsy.
		 *
		 * @param value - Any value or callback that returns a value (falsy check)
		 * @param callback - Receives (self, resolvedValue), called when falsy
		 * @param defaultCallback - Receives (self, resolvedValue), called when truthy
		 */
		unless<T, V>(
			this: T,
			value: V | ((self: T) => V),
			callback?: (self: T, value: V) => T,
			defaultCallback?: (self: T, value: V) => T,
		): T {
			const resolvedValue = typeof value === 'function' ? (value as (self: T) => V)(this) : value;

			if (!resolvedValue) {
				return callback ? callback(this, resolvedValue) : this;
			}
			return defaultCallback ? defaultCallback(this, resolvedValue) : this;
		}
	};
}
