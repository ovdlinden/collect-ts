/**
 * Standalone functions barrel export.
 * Category A functions that work on plain arrays.
 *
 * @example
 * import { filter, map, groupBy } from 'collect-ts/fn';
 *
 * const active = filter(users, u => u.active);
 * const names = map(active, u => u.name);
 * const byRole = groupBy(users, 'role');
 */

export { filter } from '../methods/filter.js';
export { first } from '../methods/first.js';
export { groupBy } from '../methods/groupBy.js';
export { map } from '../methods/map.js';
export { reduce } from '../methods/reduce.js';
