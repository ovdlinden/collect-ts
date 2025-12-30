/**
 * Pipeable Trait
 *
 * Pass self to a callback and return the result.
 * Useful for breaking out of fluent chains to compute derived values.
 *
 * @example
 * ```ts
 * collect(users)
 *   .filter(u => u.active)
 *   .pipe(c => section(`Active: ${c.count()}`))
 * ```
 */

type Constructor<T = {}> = new (...args: any[]) => T;

export function Pipeable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    /**
     * Pass self to callback, return the callback's result.
     *
     * Unlike tap(), which is for side effects, pipe() returns
     * whatever the callback returns.
     *
     * @param fn - Callback receiving self, returns any value
     */
    pipe<T, R>(this: T, fn: (self: T) => R): R {
      return fn(this);
    }
  };
}
