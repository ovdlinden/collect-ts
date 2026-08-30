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

export { avg } from '../methods/avg.js';
export { chunk } from '../methods/chunk.js';
export { contains } from '../methods/contains.js';
export { every } from '../methods/every.js';
export { filter } from '../methods/filter.js';
export { first } from '../methods/first.js';
export { flatMap } from '../methods/flatMap.js';
export { groupBy } from '../methods/groupBy.js';
export { keyBy } from '../methods/keyBy.js';
export { last } from '../methods/last.js';
export { map } from '../methods/map.js';
export { max } from '../methods/max.js';
export { min } from '../methods/min.js';
export { partition } from '../methods/partition.js';
export { pluck } from '../methods/pluck.js';
export { reduce } from '../methods/reduce.js';
export { reject } from '../methods/reject.js';
export { skip } from '../methods/skip.js';
export { some } from '../methods/some.js';
export { sortBy } from '../methods/sortBy.js';
export { sum } from '../methods/sum.js';
export { take } from '../methods/take.js';
export { unique } from '../methods/unique.js';
