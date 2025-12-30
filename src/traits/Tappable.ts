/**
 * Tappable Trait
 *
 * Matches Laravel's Illuminate\Support\Traits\Tappable
 *
 * @example
 * ```ts
 * collect(users)
 *   .tap(c => console.log('Count:', c.count()))
 *   .filter(u => u.active)
 * ```
 */

// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixin pattern requires any[] for constructor rest parameter
type Constructor<T = object> = new (...args: any[]) => T;

export function Tappable<TBase extends Constructor>(Base: TBase) {
	return class extends Base {
		/**
		 * Execute callback for side effects, return self unchanged.
		 *
		 * @param callback - Optional callback receiving self (return value ignored)
		 */
		tap<T>(this: T, callback?: (self: T) => void): T {
			if (callback) callback(this);
			return this;
		}
	};
}
